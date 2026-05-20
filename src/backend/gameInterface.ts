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
    folds: (ICard | null)[]; // Pli en cours (null = joueur n'a pas encore joué)
    ledSuit: string | null; // Couleur de la première carte du pli en cours
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

/** État spécifique au contrat Réussite — null/undefined pour les autres contrats */
export interface ReussiteState {
    announcedValue: string | null;                  // Valeur annoncée par le dealer ('7', '8', 'J'...) — null avant annonce
    chains: { [suit: string]: ICard[] };            // Chaînes de cartes posées par couleur (♥/♦/♣/♠), dans l'ordre chronologique
    finishOrder: string[];                          // uid des joueurs ayant vidé leur main, dans l'ordre
    passedThisRound: string[];                      // uids ayant passé sur leur dernier tour (reset à chaque coup réel)
}

/** Interface de GameState pour le jeu du barbu */
export interface GameState {
    players: Player[];
    currentPlayer: Player;
    currentContract: ChosenContract | null; // Contrat choisit par le joueur
    currentTurn: Turn; // Tour en cours
    ranking: Player[];
    contracts: Contract[];
    startedGame: boolean;
    currentRound: number; // Manche en cours (0-indexed)
    currentTrick: number; // Pli en cours dans la manche (0-12)
    isOver: boolean; // La partie est terminée
    reussite?: ReussiteState; // État du contrat Réussite (présent uniquement pendant ce contrat)
    playableCardIndices?: number[]; // Indices des cartes jouables pour le joueur courant (Réussite uniquement)
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
    deckSize: 32 | 52; // Taille du jeu (choisie à la création)
    maxPlayers: number; // Nombre max de joueurs (choisi par le créateur)
}

/** Résultat d'une manche, émis par le serveur via l'événement 'hand_result'. */
export interface HandResult {
    contractName: string;
    winner: { name: string; scoreDelta: number } | null;
    loser:  { name: string; scoreDelta: number } | null;
    scores: { name: string; scoreDelta: number }[];
}