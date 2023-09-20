export type ICard = {
    suit: string;
    value: string;
    [Symbol.iterator](): Iterator<ICard>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export type Card = {
    suit: string;
    value: string;
    [Symbol.iterator](): Iterator<ICard>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;

};

// Ajoutez cette interface pour gérer les tours de jeu
export interface Turn {
    dealer: Player; // Joueur qui a décidé du contrat
    startingPlayer: Player; // Joueur qui suit le playerDealer
    folds: ICard[]; // Pli en cours
}

// Ajoutez ces interfaces pour gérer les contrats choisis par les joueurs
export interface ChosenContract {
    player: Player; // Joueur qui a choisi le contrat
    contract: Contract; // Contrat choisi
    successful: boolean; // Le contrat a été réussi ou non
}

// Ajoutez cette interface pour gérer les résultats finaux
/* export interface TurnResult {
    pickUpFold: Player | null; // Joueur qui ramasse le pli
    secondPlace?: Player | null; // Deuxième place

} */

/** Interface de GameState pour le jeu du barbu */
export interface GameState {
    players: Player[];
    currentPlayer: Player;
    currentContract: ChosenContract | null; // Contrat choisit par le joueur
    currentTurn: Turn; // Tour en cours
    ranking: Player[];
    contracts: Contract[];
    startedGame: boolean;
    currentRound: number; // Ajout de la manche en cours
    isOver: boolean; // La partie est terminée
}

/** Interface de player pour le jeu du barbu */
export interface Player {
    uid: string; // Identifiant unique du joueur
    name: string; // Nom du joueur
    startedHand: ICard[]; // Cartes reçues au début du tour
    myFoldsDuringTurn: ICard[]; // Cartes jouées pendant le tour
    chosenContracts: ChosenContract[]; // Contrats choisis par le joueur
    socketId: string; // Identifiant du socket du joueur
    score: number; // Score du joueur
    isReady: boolean; // Le joueur est prêt à jouer
    isPlaying: boolean; // Le joueur est en train de jouer
    isDisconnected: boolean; // Le joueur est déconnecté
    roundScores: number[]; // Ajout des scores de la manche pour fournir un historique détaillé des scores à la fin du jeu, montrant combien de points chaque joueur a gagné ou perdu lors de chaque manche,
    position: number; // Ajout de la position du joueur dans le classement
}

/** Interface de Contract pour le jeu du barbu */
export interface Contract {
    name: string; // Nom du contrat
    description: string; // Description du contrat
    value: number | number[]; // Valeur du contrat
    maxNumberOfTurns: number; // Nombre maximum de tours
}

/** Interface de RoomsState */
export interface RoomsState {
    rooms: Room[]; // Liste des rooms
}

/** Interface de Room */
export interface Room {
    roomId: string; // Identifiant de la room
    name: string; // Nom de la room
    players: Player[]; // Liste des joueurs dans la room
    chosenContracts: ChosenContract[]; // Liste des contrats choisis par les joueurs
    isGameInProgress: boolean; // La partie est en cours
    isOver: boolean; // La partie est terminée
    ranking: Player[]; // Classement des joueurs
    currentContract: ChosenContract | null; // Contrat en cours
}