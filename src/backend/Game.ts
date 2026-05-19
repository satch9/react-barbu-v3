import { ServerSocket } from "./socket";
import CustomError from "./CustomError";
import { Contracts } from "./Contracts";
import { Deck } from "./Deck";
import { v4 as uuidv4 } from "uuid";
import { ChosenContract, Contract, GameState, ICard, Card, Player, Room, RoomsState } from "./gameInterface";

type PartialGameState = Partial<GameState>;
type PartialRoomsState = Partial<RoomsState>;

const MAX_PLAYERS = 4;
// Chaque joueur est dealer une fois par contrat : 4 joueurs × 6 contrats = 24 manches
const MAX_ROUNDS = MAX_PLAYERS * Contracts.CONTRACTS.length;

const CARD_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

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
        this.roomsState = { rooms: [] };
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
                ledSuit: null,
            },
            ranking: [],
            contracts: this.contracts,
            currentContract: null,
            startedGame: false,
            currentRound: 0,
            currentTrick: 0,
            isOver: false,
        };
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
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
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
        return this.roomsState.rooms.find((room) =>
            room.players.find(player => player.socketId === socketId)
        );
    }

    /** Synchronise les joueurs et le contrat courant depuis gameState vers les rooms. */
    private syncRoomsWithGameState(): void {
        this.updateRoomsState({
            rooms: this.roomsState.rooms.map(room => ({
                ...room,
                currentContract: this.gameState.currentContract,
                players: room.players.map(roomPlayer => {
                    const gamePlayer = this.gameState.players.find(p => p.uid === roomPlayer.uid);
                    return gamePlayer ? { ...gamePlayer } : roomPlayer;
                }),
            })),
        });
    }

    // ─── Rooms ────────────────────────────────────────────────────────────────

    public createRoom() {
        const roomName = this.generateRandomRoomName();
        const roomId = uuidv4();
        const room = { ...this.createEmptyRoom(), roomId, name: roomName };
        this.updateRoomsState({ rooms: [...this.roomsState.rooms, room] });
        return room;
    }

    public createGame(uid: string, socketId: string, pseudo: string): void {
        const createdRoom = this.createRoom();
        const newCreator: Player = { ...this.createEmptyPlayer(), uid, name: pseudo, socketId };

        this.updateGameState({ players: [...this.gameState.players, newCreator] });

        const room = this.findRoomById(createdRoom.roomId);
        if (!room) return;
        room.players.push(newCreator);
    }

    public joinGame(uid: string, socketId: string, pseudo: string, roomId: string): void {
        const room = this.findRoomById(roomId);
        if (!room) {
            console.log(`Room ${roomId} not found.`);
            return;
        }

        // Refuse si la room est déjà pleine
        if (room.players.length >= MAX_PLAYERS) {
            const socket = this.serverSocket.io.sockets.sockets.get(socketId);
            if (socket) socket.emit("error", "Cette partie est déjà complète.");
            return;
        }

        const newPlayer: Player = { ...this.createEmptyPlayer(), uid, name: pseudo, socketId };
        this.updateGameState({ players: [...this.gameState.players, newPlayer] });
        room.players.push(newPlayer);

        const playerSocket = this.serverSocket.io.sockets.sockets.get(socketId);
        if (playerSocket) {
            playerSocket.join(roomId);
        }
    }

    // ─── Démarrage ────────────────────────────────────────────────────────────

    public startGame(roomId: string): void {
        const room = this.findRoomById(roomId);
        if (!room) throw new Error("Room not found");

        this.deck = new Deck();
        this.deck.shuffle();
        this.deck.dealCardsToPlayers(room.players);

        // Réinitialise gameState.players avec UNIQUEMENT les joueurs de la room
        // (évite l'accumulation de joueurs de sessions précédentes)
        const gamePlayers = room.players.map(p => ({
            ...p,
            startedHand: [...p.startedHand],
            myFoldsDuringTurn: [],
            chosenContracts: [],
            score: 0,
            roundScores: [],
            isPlaying: true,
        }));

        const dealerIndex = Math.floor(Math.random() * MAX_PLAYERS);
        const dealer = gamePlayers[dealerIndex];
        const startingPlayer = gamePlayers[(dealerIndex + 1) % MAX_PLAYERS];

        this.updateGameState({
            players: gamePlayers,
            currentPlayer: gamePlayers[dealerIndex],
            currentTurn: {
                dealer,
                startingPlayer,
                folds: [],
                ledSuit: null,
            },
            currentContract: null,
            currentRound: 0,
            currentTrick: 0,
            startedGame: true,
            isOver: false,
            ranking: [],
        });

        this.updateRoomsState({
            rooms: this.roomsState.rooms.map(r =>
                r.roomId === roomId
                    ? { ...r, isGameInProgress: true, players: gamePlayers }
                    : r
            ),
        });
    }

    // ─── Choix de contrat ─────────────────────────────────────────────────────

    public chooseContract(p: Player, contractIndex: number, roomId: string): void {
        const chosenContract = this.gameState.contracts[contractIndex];
        if (!chosenContract) return;

        const playerIndex = this.gameState.players.findIndex(pl => pl.name === p.name);
        if (playerIndex === -1) return;

        const newContract: ChosenContract = {
            player: p,
            contract: chosenContract,
            successful: false,
        };

        this.updateGameState({
            currentContract: newContract,
            currentTrick: 0,
            currentTurn: {
                ...this.gameState.currentTurn,
                folds: [],
                ledSuit: null,
            },
        });

        this.updateRoomsState({
            rooms: this.roomsState.rooms.map(r =>
                r.roomId === roomId ? { ...r, currentContract: newContract } : r
            ),
        });
    }

    /** Enregistre le contrat choisi dans l'historique du joueur. */
    public updateChosenContracts(p: Player, contractIndex: number) {
        const newChosenContract: ChosenContract = {
            player: p,
            contract: this.gameState.contracts[contractIndex],
            successful: true,
        };
        const updatedPlayers = this.gameState.players.map(player =>
            player.name === p.name
                ? { ...player, chosenContracts: [...player.chosenContracts, newChosenContract] }
                : player
        );
        this.updateGameState({ players: updatedPlayers });
        this.syncRoomsWithGameState();
    }

    // ─── Rotation des joueurs ─────────────────────────────────────────────────

    public nextPlayer(): void {
        const { currentPlayer, players } = this.gameState;
        const currentIndex = players.findIndex(p => p.uid === currentPlayer.uid);
        const nextIndex = (currentIndex + 1) % MAX_PLAYERS;
        this.updateGameState({ currentPlayer: players[nextIndex] });
    }

    public nextDealer(): void {
        const { currentTurn, players } = this.gameState;
        const currentDealerIndex = players.findIndex(p => p.uid === currentTurn.dealer.uid);
        const nextDealerIndex = (currentDealerIndex + 1) % MAX_PLAYERS;
        const nextDealer = players[nextDealerIndex];
        const nextStarting = players[(nextDealerIndex + 1) % MAX_PLAYERS];

        this.updateGameState({
            currentPlayer: nextDealer,
            currentTurn: {
                ...currentTurn,
                dealer: nextDealer,
                startingPlayer: nextStarting,
                folds: [],
                ledSuit: null,
            },
        });
    }

    // ─── Jeu de cartes ────────────────────────────────────────────────────────

    public cardPlayed(cardClicked: Card, playerCardClicked: Player): void {
        try {
            const { players, currentTurn, currentContract } = this.gameState;
            const playerIndex = this.findPlayerIndexByName(playerCardClicked.name);
            if (playerIndex === -1) return;

            this.validateCardPlay(cardClicked, playerCardClicked, currentTurn);

            // Retire la carte de la main du joueur
            const updatedPlayers = players.map((p, i) =>
                i === playerIndex
                    ? { ...p, startedHand: p.startedHand.filter(c => c.value !== cardClicked.value || c.suit !== cardClicked.suit) }
                    : p
            );

            // Ajoute la carte dans le pli en cours
            const updatedFolds: (ICard | null)[] = Array.from({ length: MAX_PLAYERS }, (_, i) => currentTurn.folds[i] ?? null);
            updatedFolds[playerIndex] = cardClicked;

            // La première carte posée fixe la couleur demandée
            const ledSuit = currentTurn.ledSuit ?? cardClicked.suit;
            const cardsInTrick = updatedFolds.filter(Boolean).length;

            if (cardsInTrick < MAX_PLAYERS) {
                // Pli incomplet — on attend les autres joueurs
                this.updateGameState({
                    players: updatedPlayers,
                    currentTurn: { ...currentTurn, folds: updatedFolds, ledSuit },
                });
                this.nextPlayer();
            } else {
                // Pli complet — on détermine le gagnant
                const winnerIndex = this.determineTrickWinner(updatedFolds, ledSuit);
                const trickCards = updatedFolds.filter(Boolean) as ICard[];

                // Le gagnant du pli récupère toutes les cartes
                let playersAfterTrick = updatedPlayers.map((p, i) =>
                    i === winnerIndex
                        ? { ...p, myFoldsDuringTurn: [...p.myFoldsDuringTurn, ...trickCards] }
                        : p
                );

                // Le barbu et la Salade : score immédiat si ♥K est dans le pli
                const isBarbu = currentContract?.contract.name === 'Le barbu';
                const isSalade = currentContract?.contract.name === 'Salade';
                if (isBarbu || isSalade) {
                    const hasKingOfHearts = trickCards.some(c => c.suit === '♥' && c.value === 'K');
                    if (hasKingOfHearts) {
                        const barbuPenalty = isBarbu
                            ? (currentContract!.contract.value as number)
                            : (currentContract!.contract.value as number[])[0];
                        playersAfterTrick = playersAfterTrick.map((p, i) =>
                            i === winnerIndex ? { ...p, score: p.score + barbuPenalty } : p
                        );
                    }
                }

                const newTrickCount = this.gameState.currentTrick + 1;
                const winner = playersAfterTrick[winnerIndex];

                if (newTrickCount >= 13) {
                    // Dernière levée — fin de manche
                    this.updateGameState({
                        players: playersAfterTrick,
                        currentTrick: newTrickCount,
                        currentTurn: { ...currentTurn, folds: [], ledSuit: null },
                    });
                    this.endHand();
                } else {
                    // Pli suivant — le gagnant entame
                    this.updateGameState({
                        players: playersAfterTrick,
                        currentTrick: newTrickCount,
                        currentPlayer: winner,
                        currentTurn: {
                            ...currentTurn,
                            startingPlayer: winner,
                            folds: [],
                            ledSuit: null,
                        },
                    });
                }
            }

            this.syncRoomsWithGameState();

        } catch (error: unknown) {
            this.handleError(error as Error, playerCardClicked.socketId);
        }
    }

    /** Détermine l'index du joueur qui remporte le pli. */
    private determineTrickWinner(folds: (ICard | null)[], ledSuit: string): number {
        let winnerIndex = 0;
        let highestRank = -1;

        folds.forEach((card, playerIndex) => {
            if (card && card.suit === ledSuit) {
                const rank = CARD_ORDER.indexOf(card.value);
                if (rank > highestRank) {
                    highestRank = rank;
                    winnerIndex = playerIndex;
                }
            }
        });

        return winnerIndex;
    }

    private findPlayerIndexByName(name: string): number {
        return this.gameState.players.findIndex(p => p.name === name);
    }

    private validateCardPlay(cardClicked: Card, playerClickedCards: Player, currentTurn: { ledSuit: string | null }): void {
        if (currentTurn.ledSuit) {
            const hasLedSuitCard = playerClickedCards.startedHand.some(c => c.suit === currentTurn.ledSuit);
            if (cardClicked.suit !== currentTurn.ledSuit && hasLedSuitCard) {
                throw new CustomError("Vous devez jouer la même couleur que la première carte jouée", 400);
            }
        }
    }

    private handleError(error: Error, socketId?: string): void {
        console.error('Erreur:', error.message);
        const room = this.findRoomBySocketId(socketId ?? "");
        if (socketId && room) {
            this.serverSocket.io.to(room.roomId).emit("error", error.message);
        }
    }

    // ─── Fin de manche ────────────────────────────────────────────────────────

    public endHand(): void {
        const { players, currentContract } = this.gameState;

        // Calcul des scores de fin de manche (sauf Le barbu, scoré par pli)
        let updatedPlayers = [...players];
        if (currentContract) {
            updatedPlayers = Contracts.calculateHandScore(players, currentContract);
        }

        this.updateGameState({ players: updatedPlayers });
        this.calculateRanking();

        const newRound = this.gameState.currentRound + 1;

        if (newRound >= MAX_ROUNDS) {
            // Fin de partie
            this.updateGameState({
                currentRound: newRound,
                isOver: true,
                currentContract: null,
            });
            this.updateRoomsState({
                rooms: this.roomsState.rooms.map(r => ({ ...r, isOver: true })),
            });
            this.syncRoomsWithGameState();
            return;
        }

        // Réinitialise les mains pour la prochaine manche
        const resetPlayers = this.gameState.players.map(p => ({
            ...p,
            myFoldsDuringTurn: [],
            startedHand: [],
            isPlaying: true,
        }));

        this.updateGameState({
            players: resetPlayers,
            currentRound: newRound,
            currentTrick: 0,
            currentContract: null,
            currentTurn: {
                ...this.gameState.currentTurn,
                folds: [],
                ledSuit: null,
            },
        });

        // Avance le dealer
        this.nextDealer();

        // Distribue de nouvelles cartes
        this.deck = new Deck();
        this.deck.shuffle();
        this.deck.dealCardsToPlayers(this.gameState.players);
        // Force la mise à jour de l'état avec les nouvelles mains (mutation directe par dealCardsToPlayers)
        this.updateGameState({ players: [...this.gameState.players] });

        this.syncRoomsWithGameState();
    }

    // ─── Classement ───────────────────────────────────────────────────────────

    public calculateRanking(): void {
        const sorted = [...this.gameState.players].sort((a, b) => b.score - a.score);
        const ranking = sorted.map((player, index) => ({ ...player, position: index + 1 }));
        this.updateGameState({ ranking });
    }

    // ─── Nettoyage ────────────────────────────────────────────────────────────

    /** Supprime les rooms non démarrées dont le socket était créateur ou membre. */
    public cleanupRoomsForSocket(socketId: string): void {
        this.updateRoomsState({
            rooms: this.roomsState.rooms.filter(room => {
                // Garde les rooms en cours de jeu
                if (room.isGameInProgress) return true;
                // Supprime les rooms en attente où ce socket était présent
                const isInRoom = room.players.some(p => p.socketId === socketId);
                return !isInRoom;
            }),
        });
        // Retire aussi le joueur du gameState global
        this.updateGameState({
            players: this.gameState.players.filter(p => p.socketId !== socketId),
        });
    }

    // ─── Reconnexion ──────────────────────────────────────────────────────────

    /** Met à jour le socketId d'un joueur identifié par son uid (post-reconnexion). */
    public updatePlayerSocketId(uid: string, newSocketId: string): void {
        this.updateRoomsState({
            rooms: this.roomsState.rooms.map(room => ({
                ...room,
                players: room.players.map(p =>
                    p.uid === uid ? { ...p, socketId: newSocketId } : p
                ),
            })),
        });
        this.updateGameState({
            players: this.gameState.players.map(p =>
                p.uid === uid ? { ...p, socketId: newSocketId } : p
            ),
        });
    }

    // ─── goBackGame ───────────────────────────────────────────────────────────

    public goBackGame(roomIdGoBackGame: string): void {
        const room = this.findRoomById(roomIdGoBackGame);
        if (!room) {
            console.log(`Room ${roomIdGoBackGame} not found.`);
            return;
        }
        // La mise à jour de l'état via updateGameStateAndRoomState() dans socket.ts
        // suffit à renvoyer l'état courant à tous les clients.
        console.log(`GoBackGame: room ${room.name} found, re-emitting state.`);
    }
}
