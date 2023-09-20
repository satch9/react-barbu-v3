import { ServerSocket } from "./socket";
import CustomError from "./CustomError";
import { Contracts } from "./Contracts";
import { Deck } from "./Deck";
import { v4 as uuidv4 } from "uuid";
import { customCompare } from "./utils";
import { ChosenContract, Contract, GameState, ICard, Card, Player, Room, RoomsState, Turn } from "./gameInterface";

type PartialGameState = Partial<GameState>;
type PartialRoomsState = Partial<RoomsState>;

const MAX_PLAYERS = 4;

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
        this.deck = new Deck();
    }

    private initializeGameState(): GameState {
        return {
            players: [],
            currentPlayer: this.createEmptyPlayer(),
            currentTurn: {
                dealer: this.createEmptyPlayer(),
                startingPlayer: this.createEmptyPlayer(),
                folds: [],
            },
            ranking: [],
            contracts: this.contracts,
            currentContract: null,
            startedGame: false,
            currentRound: 0,
            isOver: false,

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
            roundScores: [],
            position: 0,
        };
    }

    private createEmptyRoom(): Room {
        return {
            roomId: "",
            name: "",
            players: [],
            chosenContracts: [],
            isGameInProgress: false,
            isOver: false,
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

    private updateGameState(newState: PartialGameState): void {
        this.gameState = { ...this.gameState, ...newState };
    }

    private updateRoomsState(newState: PartialRoomsState): void {
        this.roomsState = { ...this.roomsState, ...newState };
    }

    private findRoomById(roomId: string): Room | undefined {
        return this.roomsState.rooms.find((room) => room.roomId === roomId);
    }

    private findRoomBySocketId(socketId: string): Room | undefined {
        return this.roomsState.rooms.find((room) => room.players.find(player => player.socketId === socketId));
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
        console.log("this.gameState.players", this.gameState.players);

        this.updateGameState({ players: [...this.gameState.players, newCreator] });

        const roomForPlayer = this.findRoomById(createdRoom.roomId);

        if (!roomForPlayer) {
            console.log(`Room with ID ${createdRoom.roomId} not found.`);
            return;
        }

        roomForPlayer.players.push(newCreator);
    }


    public joinGame(uid: string, socketId: string, pseudo: string, roomId: string): void {
        console.log(`Join game received from =>uid: ${uid} - socketId: ${socketId} - pseudo: ${pseudo} - roomId: ${roomId}`);

        const room = this.findRoomById(roomId);

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

        const playerSocket = this.serverSocket.io.sockets.sockets.get(socketId);

        if (playerSocket) {
            playerSocket.join(roomId);
        } else {
            console.log(`Socket with ID ${socketId} not found.`);
        }
    }


    public startGame(roomId: string): void {
        console.log(`Start game received from => roomId: ${roomId}`);

        const room = this.findRoomById(roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        // Shuffle and deal cards
        this.deck.shuffle();
        this.deck.dealCardsToPlayers(room.players);

        /* room.players.forEach((player) => {
            console.log("player.startedHand", player.startedHand);
        }) */

        // Update room state
        const updatedRoom = { ...room, isGameInProgress: true, players: room.players.map(player => ({ ...player, isPlaying: true, startedHand: player.startedHand })) };
        //this.updateRoomsState({ rooms: this.roomsState.rooms.map(r => r.roomId === roomId ? updatedRoom : r) });

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
        const startingPlayerIndex = (randomCurrentPlayerIndex + 1) % MAX_PLAYERS;
        const currentTurn = {
            dealer: currentPlayer,
            startingPlayer: this.gameState.players[startingPlayerIndex],
            folds: [],
        };
        this.updateGameState({ currentPlayer, currentTurn, startedGame: true });

    }

    public chooseContract(p: Player, contractIndex: number, roomId: string): void {
        console.log(
            `Contract choice received from ${p.name} => contract: ${contractIndex}`
        );

        const chosenContract: Contract | undefined = this.gameState.contracts[contractIndex];
        //console.log("chosenContract", chosenContract)

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

        //console.log("newContract", newContract)


        this.updateGameState({ currentContract: newContract });
        this.updateRoomsState({ rooms: this.roomsState.rooms.map(r => r.roomId === roomId ? { ...r, currentContract: newContract } : r) });

    }

    /**
     * 
     * @param p 
     * @param c 
     * @returns 
     */
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
        this.updateGameState({
            players: updatedPlayers,
            currentPlayer: {
                ...this.gameState.currentPlayer,
                chosenContracts: [...this.gameState.currentPlayer.chosenContracts, newChosenContract]
            },
            currentRound: this.gameState.currentRound + 1,
        });
        this.updateRoomsState({ rooms: this.roomsState.rooms.map(room => ({ ...room, chosenContracts: [...room.chosenContracts, newChosenContract], players: room.players.map(player => player.name === p.name ? { ...player, chosenContracts: [...player.chosenContracts, newChosenContract] } : player) })) });
    }

    /**
     *  
     * @returns
     * 
     */
    public nextPlayer(): void {

        const { currentPlayer, players } = this.gameState;
        const { rooms } = this.roomsState;

        const currentPlayerIndex = players.findIndex(player => player.uid === currentPlayer.uid);
        const nextPlayerIndex = (currentPlayerIndex + 1) % MAX_PLAYERS;
        this.updateGameState({ currentPlayer: players[nextPlayerIndex] });
        this.updateRoomsState({ rooms: rooms.map(room => ({ ...room, players: room.players.map(player => player.name === this.gameState.players[nextPlayerIndex].name ? { ...player, isPlaying: true } : { ...player, isPlaying: false }) })) });
    }



    /**
     * 
     * @param roomIdGoBackGame 
     * @returns 
     */

    public goBackGame(roomIdGoBackGame: string): void {
        console.log(`Go back to game received from => roomId: ${roomIdGoBackGame}`);

        const room = this.findRoomById(roomIdGoBackGame);

        if (!room) {
            console.log(`Room with ID ${roomIdGoBackGame} not found.`);
            return;
        }

        console.log("Room found");
    }




    public cardPlayed(cardClicked: Card, playerClickedCards: Player): void {
        try {
            console.log(`Carte jouée par le player: ${playerClickedCards.name} => ${cardClicked.value} de ${cardClicked.suit}`);

            const { players, currentTurn } = this.gameState;

            const playerIndex = this.findPlayerIndexByName(playerClickedCards.name);

            console.log("playerIndex", playerIndex)

            if (playerIndex !== -1) {
                this.validateCardPlay(cardClicked, playerClickedCards, currentTurn);
                this.updatePlayerState(players[playerIndex], cardClicked);
                this.updateRoomsStateAfterPlay(playerIndex, cardClicked);

                const updatedCurrentTurnFolds: ICard[] = Array(MAX_PLAYERS);

                for (let i = 0; i < MAX_PLAYERS; i++) {
                    updatedCurrentTurnFolds[i] = currentTurn.folds[i] || null; // You can use null or another default value
                }

                updatedCurrentTurnFolds[playerIndex] = cardClicked;

                if (updatedCurrentTurnFolds.filter(Boolean).length === MAX_PLAYERS) {

                    updatedCurrentTurnFolds.sort(customCompare);

                    // Effectuer le calcul du résultat du tour
                    this.calculateTurnResult(updatedCurrentTurnFolds);

                } else {
                    this.updateGameState({
                        currentTurn: {
                            ...currentTurn,
                            folds: updatedCurrentTurnFolds,
                        },
                    });
                    this.nextPlayer();
                }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            this.handleError(error, playerClickedCards.socketId)
        }
    }

    private updatePlayerState(p: Player, cardClicked: Card) {
        p.startedHand = p.startedHand.filter(card => card.value !== cardClicked.value || card.suit !== cardClicked.suit);
        p.myFoldsDuringTurn.push(cardClicked);
    }

    private findPlayerIndexByName(playerName: string): number {
        const { players } = this.gameState;
        return players.findIndex(player => player.name === playerName);
    }

    private validateCardPlay(cardClicked: Card, playerClickedCards: Player, currentTurn: Turn): void {
        const firstCard = Object.values(currentTurn.folds)[0];

        if (firstCard) {
            if (
                firstCard.suit !== cardClicked.suit &&
                playerClickedCards.startedHand.filter(card => card.suit === firstCard.suit).length > 0
            ) {
                throw new CustomError("Vous devez jouer la même couleur que la première carte jouée", 500);
            }
        }
    }

    private updateRoomsStateAfterPlay(playerIndex: number, cardClicked: Card): void {
        this.updateRoomsState({
            rooms: this.roomsState.rooms.map(room => {
                if (playerIndex !== -1) {
                    this.updatePlayerState(room.players[playerIndex], cardClicked);
                }
                return room;
            })
        });
    }


    private handleError(error: Error, socketId?: string): void {
        console.error('Erreur dans cardPlayed:', error.message);
        const room = this.findRoomBySocketId(socketId ?? "");
        if (socketId && room) {
            this.serverSocket.io.to(room.roomId).emit("error", error.message);
        }
    }


    private calculateTurnResult(sortedIndexedFolds: ICard[]): void {
        const { currentTurn, currentContract, players, currentPlayer } = this.gameState;

        const numberOfFolds = Object.values(this.gameState.currentTurn?.folds ?? {}).filter(fold => fold !== undefined).length;

        if (currentTurn?.folds && currentContract && numberOfFolds) {
            if (currentContract.contract.name === 'Le barbu') {
                console.log("typeof sortedIndexedFolds", typeof sortedIndexedFolds);
                console.log("sortedIndexedFolds", sortedIndexedFolds);
                const hasKingOfHearts = sortedIndexedFolds.some((card) => card.suit === '♥' && card.value === 'K');

                if (hasKingOfHearts) {
                    // Le roi de cœur (le barbu) est présent, calculer les points
                    const updatedPlayers = Contracts.calculateScore(players, currentPlayer, currentContract, sortedIndexedFolds);

                    console.log("updatedPlayers", updatedPlayers);

                    this.updateGameState({
                        currentTurn: {
                            ...currentTurn,
                            folds: [],
                        },
                        players: [...updatedPlayers],
                    });
                } else {
                    // Le roi de cœur n'est pas présent, ne pas attribuer de points
                    this.updateGameState({
                        currentTurn: {
                            ...currentTurn,
                            folds: [],
                        },
                    });
                }

                this.nextRound();
                this.nextDealer();
            }
        }


    }

    public nextDealer(): void {

        const { currentTurn, players } = this.gameState;
        const { rooms } = this.roomsState;


        const currentDealerIndex = players.findIndex(player => player.uid === currentTurn.dealer.uid)
        const nextDealerIndex = (currentDealerIndex + 1) % MAX_PLAYERS;

        this.updateGameState({
            currentTurn: {
                ...currentTurn,
                dealer: players[nextDealerIndex],
                startingPlayer: players[(nextDealerIndex + 1) % MAX_PLAYERS]
            },
            currentPlayer: players[nextDealerIndex]
        });

        this.updateRoomsState({
            rooms: rooms.map(room => ({ ...room, players: room.players.map(player => player.name === this.gameState.players[nextDealerIndex].name ? { ...player, isPlaying: true } : { ...player, isPlaying: false }) }))
        });
    }

    public nextRound(): void {
        if (this.gameState.isOver) {
            this.endGame();
            return;
        } else {
            this.updateGameState({ currentRound: this.gameState.currentRound + 1 });
            this.calculateRanking();
            this.updateRoomsState({ rooms: this.roomsState.rooms.map(room => ({ ...room, isGameInProgress: false, players: room.players.map(player => ({ ...player, isPlaying: false, startedHand: [] })) })) });
        }



    }

    public endGame(): void {
        this.updateGameState({ currentRound: 0, });
        this.updateRoomsState({ rooms: this.roomsState.rooms.map(room => ({ ...room, isOver: true })) });
    }

    public calculateRanking(): void {
        const { players } = this.gameState;

        players.sort((a, b) => b.score - a.score);

        const ranking = players.map((player, index) => ({
            uid: player.uid,
            name: player.name,
            startedHand: player.startedHand,
            myFoldsDuringTurn: player.myFoldsDuringTurn,
            chosenContracts: player.chosenContracts,
            socketId: player.socketId,
            score: player.score,
            isReady: player.isReady,
            isPlaying: player.isPlaying,
            isDisconnected: player.isDisconnected,
            roundScores: player.roundScores,
            position: index + 1, // La première place est 1, la deuxième est 2, etc.
        }));

        this.updateGameState({ ranking });
    }


}