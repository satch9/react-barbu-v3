import { Server as HttpServer } from "http";
import { Socket, Server as ServerSocketIo, ServerOptions } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Game } from "./Game";
import { Contracts } from "./Contracts";
import { GameState, Player, RoomsState } from "./gameInterface";
import { Card } from "./Card";

export class ServerSocket {
    public static instance: ServerSocket;
    public io: ServerSocketIo;
    public game: Game

    public users: { [uid: string]: string };

    constructor(httpServer: HttpServer) {
        ServerSocket.instance = this;

        const options: Partial<ServerOptions> = {
            serveClient: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
                allowedHeaders: ["Content-Type", "Authorization"]
            },
            pingTimeout: 60000,
            pingInterval: 25000,
            transports: ['websocket', 'polling']
        };

        this.io = new ServerSocketIo(httpServer, options);
        this.users = {};
        this.game = new Game(this, Contracts.CONTRACTS);
        this.io.on("connection", this.startListeners.bind(this));
        console.log("Socket IO started");
    }

    startListeners(socket: Socket) {
        console.info(`Message received from ${socket.id}`);

        socket.on("handshake", this.handleHandshake.bind(this, socket));

        /** GAME SECTION */

        socket.on("create_game", this.handleCreateGame.bind(this));
        socket.on("join_game", this.handleJoinGame.bind(this));
        socket.on("start_game", this.handleStartGame.bind(this));
        socket.on("choose_contract", this.handleChooseContract.bind(this));
        socket.on("card_played", this.handleCardPlayed.bind(this));
        socket.on("announce_reussite", this.handleAnnounceReussite.bind(this));
        socket.on("gobackgame", this.handleGoBackGame.bind(this));

        /** END GAME SECTION */

        socket.on("disconnect", (reason: string) => {
            console.info(`[disconnect-reason] ${socket.id} reason=${reason}`);
            this.handleDisconnect(socket);
        });
        socket.on("message", this.handleMessage.bind(this, socket));
    }

    handleHandshake(socket: Socket, existingUid: string | null, callback: (uid: string, users: string[], gameState: GameState, roomsState: RoomsState) => void) {
        console.log(`Handshake received from ${socket.id} (existingUid=${existingUid ?? 'none'})`);

        // Réutilise le uid envoyé par le client s'il a un format valide,
        // sinon en génère un nouveau. Cela permet à un joueur qui se reconnecte
        // (iOS qui suspend l'onglet, blip réseau…) de garder son identité.
        const isValidUid = typeof existingUid === 'string' && /^[0-9a-f-]{36}$/i.test(existingUid);
        const uid = isValidUid ? existingUid : uuidv4();

        this.users[uid] = socket.id;

        // Si ce joueur figure déjà dans une room ou dans gameState, on rafraîchit
        // son socketId courant et on broadcaste le nouvel état à tous les clients.
        if (isValidUid) {
            this.game.updatePlayerSocketId(uid, socket.id);
        }

        const users = Object.values(this.users);

        // Envoie l'état complet au client qui (re)connecte.
        callback(uid, users, this.game.gameState, this.game.roomsState);

        // Broadcaste le gameState/roomsState rafraîchi à tous les autres
        // pour qu'ils voient le socketId à jour du joueur reconnecté.
        if (isValidUid) {
            this.updateGameStateAndRoomState();
        }

        this.sendMessage(
            "user_connected",
            users.filter((id) => id !== socket.id),
            users
        );
    }

    handleCreateGame({ uid, socketId, pseudo, deckSize, maxPlayers }: { uid: string, socketId: string, pseudo: string, deckSize?: 32 | 52, maxPlayers?: number }) {
        this.game.createGame(uid, socketId, pseudo, deckSize ?? 52, maxPlayers ?? 4);
        this.updateGameStateAndRoomState();
    }

    handleJoinGame({ uid, socketId, pseudo, roomId }: { uid: string, socketId: string, pseudo: string, roomId: string }) {
        this.game.joinGame(uid, socketId, pseudo, roomId);
        this.updateGameStateAndRoomState();
    }

    handleStartGame({ roomId }: { roomId: string }) {
        this.game.startGame(roomId);
        this.io.emit("started_game");
        this.updateGameStateAndRoomState();
    }

    handleChooseContract({ playerContract, contractIndex, roomId }: { playerContract: Player, contractIndex: number, roomId: string }) {
        const targetSocket = this.users[playerContract.uid];
        if (!targetSocket) return;

        if (!this.game.gameState.startedGame) {
            this.io.to(targetSocket).emit('error', 'La partie n\'a pas encore commencé.');
            return;
        }

        if (this.game.gameState.currentContract !== null) {
            this.io.to(targetSocket).emit('error', 'Un contrat est déjà en cours.');
            return;
        }

        if (playerContract.uid !== this.game.gameState.currentPlayer.uid) {
            this.io.to(targetSocket).emit('error', "Ce n'est pas votre tour.");
            return;
        }

        this.game.chooseContract(playerContract, contractIndex, roomId);
        this.game.updateChosenContracts(playerContract, contractIndex);

        // Pour la Réussite, le dealer reste actif jusqu'à ce qu'il annonce la valeur.
        // Pour les autres contrats, on passe au joueur suivant immédiatement.
        const isReussite = this.game.gameState.currentContract!.contract.name === 'Réussite';
        if (!isReussite) {
            this.game.nextPlayer();
        }

        this.updateGameStateAndRoomState();
    }

    handleCardPlayed({ cardClicked, playerCardClicked }: { cardClicked: Card, playerCardClicked: Player }) {
        const CARD_VIEW_DELAY = 2000;
        const numPlayers = this.game.gameState.players.length;
        const prevFolds = this.game.gameState.currentTurn.folds.slice();
        const prevCount = prevFolds.filter(Boolean).length;
        const prevSnapshot = JSON.parse(JSON.stringify(this.game.gameState));

        this.game.cardPlayed(cardClicked, playerCardClicked);

        const newFolds = this.game.gameState.currentTurn.folds;
        const newCount = newFolds.filter(Boolean).length;
        const trickJustCompleted = prevCount === numPlayers - 1 && newCount === 0;
        const cardPlayedIntermediate = !trickJustCompleted && newCount > prevCount;

        if (trickJustCompleted) {
            // Reconstitue le pli complet avec la dernière carte posée
            const playerIndex = prevSnapshot.players.findIndex((p: Player) => p.name === playerCardClicked.name);
            const fullFolds = prevFolds.slice();
            if (playerIndex !== -1) fullFolds[playerIndex] = cardClicked;

            // Émet l'état intermédiaire avec toutes les cartes visibles (ancien currentPlayer)
            this.io.emit('gameState', {
                ...prevSnapshot,
                currentTurn: { ...prevSnapshot.currentTurn, folds: fullFolds },
            });
            this.io.emit('roomsState', this.game.roomsState);

            // Après le délai, émet l'état final (pli effacé, joueur suivant actif)
            setTimeout(() => {
                this.updateGameStateAndRoomState();
            }, CARD_VIEW_DELAY);
        } else if (cardPlayedIntermediate) {
            // Pli incomplet : on diffère le passage au joueur suivant pour laisser
            // le temps de voir la carte qui vient d'être posée.
            // On émet d'abord les cartes mises à jour mais en gardant l'ancien
            // currentPlayer (donc personne ne sait encore que c'est à son tour).
            this.io.emit('gameState', {
                ...this.game.gameState,
                currentPlayer: prevSnapshot.currentPlayer,
                playableCardIndices: prevSnapshot.playableCardIndices,
            });
            this.io.emit('roomsState', this.game.roomsState);

            // Après le délai, on bascule sur le vrai joueur suivant
            setTimeout(() => {
                this.updateGameStateAndRoomState();
            }, CARD_VIEW_DELAY);
        } else {
            this.updateGameStateAndRoomState();
        }
    }

    handleAnnounceReussite({ value }: { value: string }) {
        this.game.announceReussite(value);
        this.updateGameStateAndRoomState();
    }

    handleGoBackGame({ roomIdGoBackGame }: { roomIdGoBackGame: string }) {
        this.game.goBackGame(roomIdGoBackGame);
        this.updateGameStateAndRoomState();
    }

    handleDisconnect(socket: Socket) {
        console.info(`User disconnected: ${socket.id}`);
        const uid = this.getUidFromSocketID(socket.id);
        if (uid) {
            delete this.users[uid];
        }
        // Note: on ne supprime PAS les rooms automatiquement à la déconnexion.
        // Socket.IO émet "disconnect" pour de nombreuses raisons hors-contrôle
        // (upgrade de transport, blip réseau, navigation) — supprimer la room
        // ferait disparaître la partie aux autres joueurs alors qu'elle est
        // toujours valide. Cleanup explicite via un futur événement "leave_game".
        this.io.emit("user_disconnected", uid);
        this.updateGameStateAndRoomState();
    }

    handleMessage(socket: Socket, message: string) {
        console.info(`Message received from ${socket.id}: ${message}`);
        /** Send message to all connected users */
        socket.broadcast.emit("message", message);
    }

    updateGameStateAndRoomState() {
        this.io.emit("gameState", this.game.gameState);
        this.io.emit("roomsState", this.game.roomsState);
    }

    getUidFromSocketID = (id: string) => {
        return Object.keys(this.users).find((uid) => this.users[uid] === id);
    };

    sendMessage = (name: string, players: string[], payload?: object) => {
        console.info(`Emitting event: ${name} to ${players} players`);
        players.forEach((id) =>
            payload ? this.io.to(id).emit(name, payload) : this.io.to(id).emit(name)
        );
    };
}