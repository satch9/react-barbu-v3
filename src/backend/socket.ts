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
            },
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
        socket.on("gobackgame", this.handleGoBackGame.bind(this));

        /** END GAME SECTION */

        socket.on("disconnect", this.handleDisconnect.bind(this, socket));
        socket.on("message", this.handleMessage.bind(this, socket));
    }

    handleHandshake(socket: Socket, callback: (uid: string, users: string[], gameState: GameState, roomsState: RoomsState) => void) {

        console.log(`Handshake received from ${socket.id}`);

        /** Check if this is a reconnection */
        const reconnected = Object.values(this.users).includes(socket.id);
        console.log("reconnected", reconnected);
        if (reconnected) {
            console.info("-------------------------");
            console.info("This user has reconnected");
            console.info("-------------------------");

            const uid = this.getUidFromSocketID(socket.id);
            const users = Object.values(this.users);

            if (uid) {
                console.info("Sending callback for reconnect ...");

                callback(uid, users, this.game.gameState, this.game.roomsState);
                return;
            }
        }

        const uid = uuidv4();
        this.users[uid] = socket.id;

        const users = Object.values(this.users);

        callback(uid, users, this.game.gameState, this.game.roomsState);

        this.sendMessage(
            "user_connected",
            users.filter((id) => id !== socket.id),
            users
        );

    }

    handleCreateGame({ uid, socketId, pseudo }: { uid: string, socketId: string, pseudo: string }) {
        this.game.createGame(uid, socketId, pseudo);
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
        //console.log("choose_contract", playerContract, contractIndex, roomId)
        this.game.chooseContract(playerContract, contractIndex, roomId);
        this.game.updateChosenContracts(playerContract, contractIndex);
        this.game.nextPlayer();
        this.updateGameStateAndRoomState();
    }

    handleCardPlayed({ cardClicked, playerCardClicked }: { cardClicked: Card, playerCardClicked: Player }) {
        this.game.cardPlayed(cardClicked, playerCardClicked)
        this.updateGameStateAndRoomState();
    }

    handleGoBackGame({ roomIdGoBackGame }: { roomIdGoBackGame: string }) {
        this.game.goBackGame(roomIdGoBackGame);
        this.updateGameStateAndRoomState();
    }

    handleDisconnect(socket: Socket) {
        console.info(`User disconnected: ${socket.id}`);
        /** Remove user from users */
        const uid = this.getUidFromSocketID(socket.id);
        if (uid) {
            delete this.users[uid];
        }
        /** Send disconnected user to all connected users */
        this.io.emit("user_disconnected", uid);
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