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

    handleCreateGame({ uid, socketId, pseudo, deckSize }: { uid: string, socketId: string, pseudo: string, deckSize?: 32 | 52 }) {
        this.game.createGame(uid, socketId, pseudo, deckSize ?? 52);
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
        this.game.chooseContract(playerContract, contractIndex, roomId);
        this.game.updateChosenContracts(playerContract, contractIndex);

        // Pour la Réussite, le dealer reste actif jusqu'à ce qu'il annonce la valeur.
        // Pour les autres contrats, on passe au joueur suivant immédiatement.
        const isReussite = this.game.gameState.currentContract?.contract.name === 'Réussite';
        if (!isReussite) {
            this.game.nextPlayer();
        }

        this.updateGameStateAndRoomState();
    }

    handleCardPlayed({ cardClicked, playerCardClicked }: { cardClicked: Card, playerCardClicked: Player }) {
        this.game.cardPlayed(cardClicked, playerCardClicked)
        this.updateGameStateAndRoomState();
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