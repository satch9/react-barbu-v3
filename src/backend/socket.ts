import { Server as HttpServer } from "http";
import { Socket, Server as ServerSocketIo, ServerOptions } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Game } from "./Game";
import { Contracts } from "./Contracts";
import { GameState, RoomsState } from "./gameInterface";
//import parse from 'json-stringify-safe'

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
                origin: "http://localhost:5173",
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

        socket.on("handshake", (callback: (uid: string, users: string[], gameState: GameState, roomsState: RoomsState) => void) => {
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
        );

        /** GAME SECTION */

        socket.on("create_game", ({ uid, socketId, pseudo }) => {

            this.game.createGame(uid, socketId, pseudo);
            this.updateGameStateAndRoomState();

        });

        socket.on("join_game", ({ uid, socketId, pseudo, roomId }) => {
            this.game.joinGame(uid, socketId, pseudo, roomId);
            this.updateGameStateAndRoomState();
        });

        socket.on("start_game", ({ roomId }) => {
            this.game.startGame(roomId);
            this.io.emit("started_game");
            this.updateGameStateAndRoomState();
        });

        socket.on("choose_contract", ({ playerContract, contractIndex, roomId }) => {
            console.log("choose_contract", playerContract, contractIndex, roomId)
            this.game.chooseContract(playerContract, contractIndex, roomId);
            this.game.updateChosenContracts(playerContract, contractIndex);

            this.game.turnRound();

            this.updateGameStateAndRoomState();
        });

        socket.on("card_played", ({ cardClicked, playerCardClicked }) => {
            this.game.cardPlayed(cardClicked, playerCardClicked)
            this.updateGameStateAndRoomState();
        })

        socket.on("gobackgame", ({ roomIdGoBackGame }) => {
            this.game.goBackGame(roomIdGoBackGame);
            this.updateGameStateAndRoomState();
        })



        /** END GAME SECTION */

        socket.on("disconnect", () => {
            console.info(`User disconnected: ${socket.id}`);

            /** Remove user from users */
            const uid = this.getUidFromSocketID(socket.id);
            if (uid) {
                delete this.users[uid];
            }

            /** Send disconnected user to all connected users */
            this.io.emit("user_disconnected", uid);
        });

        socket.on("message", (message: string) => {
            console.info(`Message received from ${socket.id}: ${message}`);

            /** Send message to all connected users */
            socket.broadcast.emit("message", message);
        });
    }

    updateGameStateAndRoomState() {
        // Update gameState and emit changes to clients
        //console.log("this.game.gameState updateGameStateAndRoomState", this.game.gameState)
        //console.log("this.game.roomsState updateGameStateAndRoomState", this.game.roomsState)
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
