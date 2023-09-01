import { Card } from "./Card";
import { Contracts } from "./Contracts";
import { Deck } from "./Deck";
import { Contract, GameState, Player, Room, RoomsState } from "./gameInterface";
import { ServerSocket } from "./socket";
import { v4 as uuidv4 } from "uuid";

export class Game {
    private contracts: Contract[];
    public gameState: GameState;
    public roomsState: RoomsState;
    private serverSocket: ServerSocket;
    private deck: Deck;

    constructor(serverSocket: ServerSocket, contracts: Contract[]) {
        this.serverSocket = serverSocket;
        this.contracts = contracts;
        this.gameState = this.initializeGameState();
        this.roomsState = {
            rooms: [],
        };
        this.deck = new Deck
    }

    private initializeGameState(): GameState {
        return {
            players: [],
            currentPlayer: this.createEmptyPlayer(),
            currentTurn: null,
            ranking: [],
            contracts: this.contracts,
            currentContract: null,
            turnResult: null,
            startedGame: false
        }
    }

    private createEmptyPlayer(): Player {
        return {
            uid: "",
            name: "",
            startedHand: [],
            myFoldsDuringTurn: [],
            chosenContracts: [],
            socketId: "",
            score: 0,
            isReady: false,
            isPlaying: false,
            isDisconnected: false,
        };
    }

    private createEmptyRoom(): Room {
        return {
            roomId: "",
            name: "",
            players: [],
            chosenContracts: [],
            isGameInProgress: false,
            isFinished: false,
            ranking: [],
            currentContract: null,
        };
    }


    private generateRandomRoomName(): string {
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
        let result = "";
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }
        return result;
    }

    private randomCurrentPlayer(): number {
        return Math.floor(Math.random() * 4);
    }



    public createRoom() {
        const roomName = this.generateRandomRoomName();
        const roomId = uuidv4();

        const room = { ...this.createEmptyRoom(), roomId: roomId, name: roomName }
        this.roomsState.rooms.push(room);

        return room
    }

    public createGame(uid: string, socketId: string, pseudo: string) {
        console.log(
            `Create game received from =>uid: ${uid} - socketId: ${socketId} - pseudo: ${pseudo}`
        );

        const room_created = this.createRoom();

        const newCreator: Player = { ...this.createEmptyPlayer(), uid: uid, name: pseudo, socketId: socketId };
        this.gameState.players.push(newCreator);

        const roomForPlayer = this.roomsState.rooms.find((room) => room.roomId === room_created.roomId);
        roomForPlayer?.players.push(newCreator);
    }

    public joinGame(uid: string, socketId: string, pseudo: string, roomId: string) {
        console.log(
            `Join game received from =>uid: ${uid} - socketId: ${socketId} - pseudo: ${pseudo} - roomId: ${roomId}`
        );

        const room = this.roomsState.rooms.find((room) => room.roomId === roomId);

        if (room) {
            const newPlayer: Player = { ...this.createEmptyPlayer(), uid: uid, name: pseudo, socketId: socketId }

            room.players.push(newPlayer);
            this.gameState.players.push(newPlayer);

            this.serverSocket.io.socketsJoin(roomId);
        }
    }

    public startGame(roomId: string) {
        console.log(`Start game received from => roomId: ${roomId}`);

        this.deck.shuffle();

        const room = this.roomsState.rooms.find((room) => room.roomId === roomId);

        if (room) {
            room.isGameInProgress = true;

            room.players.forEach((player) => {
                player.isPlaying = true;
            });

            this.deck.dealCardsToPlayers(room.players);

            room.players.forEach((player) => {
                player.startedHand = this.deck.sort(player.startedHand);
            });

            // Synchronize player.hand values to this.gameState.players
            this.gameState.players.forEach((gamePlayer) => {
                if (room.players.some((roomPlayer) => roomPlayer.socketId === gamePlayer.socketId)) {
                    const matchingRoomPlayer = room.players.find((roomPlayer) => roomPlayer.socketId === gamePlayer.socketId);
                    if (matchingRoomPlayer) {
                        gamePlayer.startedHand = [...matchingRoomPlayer.startedHand]; // Copy the hand values
                    }
                }
            });
        }

        this.gameState.players.forEach((player) => {
            player.isPlaying = true;
        });

        this.gameState.contracts = this.contracts;
        const randomCurrentPlayerIndex = this.randomCurrentPlayer();

        this.gameState.currentPlayer = this.gameState.players[randomCurrentPlayerIndex];

        const startingPlayerIndex = (randomCurrentPlayerIndex + 1) % 4;
        this.gameState.currentTurn = {
            dealer: this.gameState.currentPlayer,
            startingPlayer: this.gameState.players[startingPlayerIndex],
            folds: [],
        };
        this.gameState.turnResult = {
            pickUpFold: null,
            secondPlace: null,

        }
        this.gameState.ranking = [];
        this.gameState.startedGame = true;
    }

    public chooseContract(playerChooseContract: Player, contractIndex: number) {
        console.log(
            `Contract choice received from ${playerChooseContract.name} => contract: ${contractIndex}`
        );

        const chosenContract: Contract = this.gameState.contracts[contractIndex];

        console.log("chosenContract", chosenContract)

        const playerIndex = this.gameState.players.findIndex(
            (player) => player.name === playerChooseContract.name
        );

        console.log("playerIndex", playerIndex)

        if (chosenContract) {
            console.log("if chosenContract")
            this.gameState.currentContract = {
                player: playerChooseContract,
                contract: chosenContract,
                successful: false,
            };
            playerChooseContract.chosenContracts.push(this.gameState.currentContract);
        }
        console.log("after if chosenContract")

        this.roomsState.rooms.forEach((room) => {
            console.log("inside roomstate foreach")
            room.currentContract = {
                player: playerChooseContract,
                contract: chosenContract,
                successful: false,
            };
            room.chosenContracts.push(room.currentContract);
        });

        console.log("inside roomstate foreach")

        //this.gameState.currentTurn!.startingPlayer = this.gameState.players[(playerIndex + 1) % 4];
    }





    public goBackGame(roomIdGoBackGame: string) {
        console.log(
            `Go back to game received from => roomId: ${roomIdGoBackGame}`
        );

        const room = this.roomsState.rooms.find(
            (room) => room.roomId === roomIdGoBackGame
        );

        if (room) {
            console.log("Room found");
        }

    }

    public cardPlayed(cardClicked: Card, playerClickedCards: Player) {
        console.log(
            `Carte par player: ${playerClickedCards.name} => ${cardClicked.value} de ${cardClicked.suit}`
        );

        const playerIndex = this.gameState.players.findIndex(
            (player) => player.name === playerClickedCards.name
        );

        if (playerIndex !== -1) {
            this.gameState.players[playerIndex].startedHand = this.gameState.players[
                playerIndex
            ].startedHand.filter(
                (card) =>
                    card.value !== cardClicked.value ||
                    card.suit !== cardClicked.suit
            );

            this.gameState.players[playerIndex].myFoldsDuringTurn.push(cardClicked);
        }

        this.roomsState.rooms.forEach((room) => {
            room.players[playerIndex].startedHand = room.players[
                playerIndex
            ].startedHand.filter(
                (card) =>
                    card.value !== cardClicked.value ||
                    card.suit !== cardClicked.suit
            );

            room.players[playerIndex].myFoldsDuringTurn.push(cardClicked);
        });

        this.gameState.currentTurn?.folds.push(cardClicked);


        if (this.gameState.currentTurn?.folds.length === 4) {
            this.gameState.turnResult = this.calculateTurnResult();
        }
    }

    private calculateTurnResult() {
        const foldsWith4Cards = this.gameState.currentTurn?.folds;
        const currentContract = this.gameState.currentContract;

        if (foldsWith4Cards && currentContract) {
            Contracts.calculateScore(this.gameState.players, this.gameState.currentPlayer, currentContract);
        }

        return null

    }

}