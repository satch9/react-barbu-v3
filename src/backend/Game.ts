import { Card } from "./Card";
import { Contracts } from "./Contracts";
import { Deck } from "./Deck";
import { ChosenContract, Contract, GameState, Player, Room, RoomsState, TurnResult } from "./gameInterface";
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

    private updateGameState(newState: Partial<GameState>): void {
        this.gameState = { ...this.gameState, ...newState };
    }

    private updateRoomsState(newState: Partial<RoomsState>): void {
        this.roomsState = { ...this.roomsState, ...newState };
    }

    public createRoom() {
        const roomName = this.generateRandomRoomName();
        const roomId = uuidv4();

        const room = { ...this.createEmptyRoom(), roomId: roomId, name: roomName }
        this.updateRoomsState({ rooms: [...this.roomsState.rooms, room] });

        return room
    }

    public createGame(uid: string, socketId: string, pseudo: string): void {
        console.log(`Create game received from => uid: ${uid} - socketId: ${socketId} - pseudo: ${pseudo}`);

        const createdRoom = this.createRoom();

        const newCreator: Player = {
            ...this.createEmptyPlayer(),
            uid,
            name: pseudo,
            socketId
        };

        this.updateGameState({ players: [...this.gameState.players, newCreator] });

        const roomForPlayer = this.roomsState.rooms.find(room => room.roomId === createdRoom.roomId);

        if (!roomForPlayer) {
            console.log(`Room with ID ${createdRoom.roomId} not found.`);
            return;
        }

        roomForPlayer.players.push(newCreator);
    }


    public joinGame(uid: string, socketId: string, pseudo: string, roomId: string): void {
        console.log(`Join game received from =>uid: ${uid} - socketId: ${socketId} - pseudo: ${pseudo} - roomId: ${roomId}`);

        const room = this.roomsState.rooms.find((room) => room.roomId === roomId);

        if (!room) {
            console.log(`Room with ID ${roomId} not found.`);
            return;
        }

        const newPlayer: Player = {
            ...this.createEmptyPlayer(),
            uid,
            name: pseudo,
            socketId,
        };

        this.updateGameState({ players: [...this.gameState.players, newPlayer] });
        room.players.push(newPlayer);

        this.serverSocket.io.socketsJoin(roomId);
    }


    public startGame(roomId: string): void {
        console.log(`Start game received from => roomId: ${roomId}`);

        const room = this.roomsState.rooms.find((room) => room.roomId === roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        // Shuffle and deal cards
        this.deck.shuffle();
        this.deck.dealCardsToPlayers(room.players);

        // Update room state
        const updatedRoom = { ...room, isGameInProgress: true, players: room.players.map(player => ({ ...player, isPlaying: true, startedHand: this.deck.sort(player.startedHand) })) };
        this.updateRoomsState({ rooms: this.roomsState.rooms.map(r => r.roomId === roomId ? updatedRoom : r) });

        // Synchronize gameState players with room players
        const updatedPlayers = this.gameState.players.map(gamePlayer => {
            const matchingRoomPlayer = updatedRoom.players.find((roomPlayer) => roomPlayer.socketId === gamePlayer.socketId);
            if (matchingRoomPlayer) {
                return { ...gamePlayer, startedHand: [...matchingRoomPlayer.startedHand] }; // Copy the hand values
            }
            return gamePlayer;
        });
        this.updateGameState({ players: updatedPlayers });

        // Update gameState
        const randomCurrentPlayerIndex = this.randomCurrentPlayer();
        const currentPlayer = this.gameState.players[randomCurrentPlayerIndex];
        const startingPlayerIndex = (randomCurrentPlayerIndex + 1) % 4;
        const currentTurn = {
            dealer: currentPlayer,
            startingPlayer: this.gameState.players[startingPlayerIndex],
            folds: [],
        };
        this.updateGameState({ currentPlayer, currentTurn, startedGame: true });

        // Initialize the turn result
        this.updateGameState({ turnResult: { pickUpFold: null, secondPlace: null } });

    }



    public chooseContract(p: Player, contractIndex: number, roomId: string): void {
        console.log(
            `Contract choice received from ${p.name} => contract: ${contractIndex}`
        );

        const chosenContract: Contract | undefined = this.gameState.contracts[contractIndex];
        console.log("chosenContract", chosenContract)

        if (!chosenContract) return;

        const playerIndex: number = this.gameState.players.findIndex(
            (existingPlayer) => existingPlayer.name === p.name
        );

        if (playerIndex === -1) return;


        // Mise à jour de gameState
        const newContract: ChosenContract = {
            player: p,
            contract: chosenContract,
            successful: false,
        };

        console.log("newContract", newContract)


        this.updateGameState({ currentContract: newContract });
        this.updateRoomsState({ rooms: this.roomsState.rooms.map(r => r.roomId === roomId ? { ...r, currentContract: newContract } : r) });

    }

    public updateChosenContracts(p: Player, c: number) {
        const newChosenContract = {
            player: p,
            contract: this.gameState.contracts[c],
            successful: true
        };
        const updatedPlayers = this.gameState.players.map(player => {
            if (player.name === p.name) {
                return { ...player, chosenContracts: [...player.chosenContracts, newChosenContract] };
            }
            return player;
        });
        this.updateGameState({ players: updatedPlayers, currentPlayer: { ...this.gameState.currentPlayer, chosenContracts: [...this.gameState.currentPlayer.chosenContracts, newChosenContract] } });
        this.updateRoomsState({ rooms: this.roomsState.rooms.map(room => ({ ...room, chosenContracts: [...room.chosenContracts, newChosenContract], players: room.players.map(player => player.name === p.name ? { ...player, chosenContracts: [...player.chosenContracts, newChosenContract] } : player) })) });
    }

    public turnRound(): void {
        console.log("turnRound");
        const { currentTurn, currentPlayer, players } = this.gameState;

        if (!currentTurn) {
            console.log("No current turn");
            return;
        }

        const nextPlayerIndex = (players.findIndex(player => player.name === currentPlayer.name) + 1) % 4;
        const nextPlayer = players[nextPlayerIndex];

        this.updateGameState({ currentPlayer: nextPlayer });
        this.updateRoomsState({ rooms: this.roomsState.rooms.map(room => ({ ...room, players: room.players.map(player => player.name === nextPlayer.name ? { ...player, isPlaying: true } : { ...player, isPlaying: false }) })) });
    }


    public goBackGame(roomIdGoBackGame: string): void {
        console.log(`Go back to game received from => roomId: ${roomIdGoBackGame}`);

        const room = this.roomsState.rooms.find(room => room.roomId === roomIdGoBackGame);

        if (!room) {
            console.log(`Room with ID ${roomIdGoBackGame} not found.`);
            return;
        }

        console.log("Room found");
    }


    public cardPlayed(cardClicked: Card, playerClickedCards: Player): void {
        console.log(`Carte jouée par le player: ${playerClickedCards.name} => ${cardClicked.value} de ${cardClicked.suit}`);

        const updatePlayerState = (player: Player) => {
            player.startedHand = player.startedHand.filter(card => card.value !== cardClicked.value || card.suit !== cardClicked.suit);
            player.myFoldsDuringTurn.push(cardClicked);
        };

        const playerIndex = this.gameState.players.findIndex(player => player.name === playerClickedCards.name);

        if (playerIndex !== -1) {
            updatePlayerState(this.gameState.players[playerIndex]);
        }

        this.updateRoomsState({ rooms: this.roomsState.rooms.map(room => {
            if (playerIndex !== -1) {
                updatePlayerState(room.players[playerIndex]);
            }
            return room;
        })});

        if (this.gameState.currentTurn) {
            this.gameState.currentTurn.folds.push(cardClicked);

            if (this.gameState.currentTurn.folds.length === 4) {
                this.updateGameState({ turnResult: this.calculateTurnResult() });
            }
        }
    }


    private calculateTurnResult(): TurnResult | null {
        const { currentTurn, currentContract, players, currentPlayer } = this.gameState;

        if (currentTurn?.folds && currentContract && currentTurn.folds.length === 4) {
            Contracts.calculateScore(players, currentPlayer, currentContract);
            // Votre logique supplémentaire ici pour retourner le résultat du tour si nécessaire
            return null; // Retourner le résultat ici
        }

        return null;
    }


}