import { Player, ChosenContract, ICard } from "./gameInterface";

export class Contracts {
    static CONTRACTS = [
        { name: 'Le barbu', maxNumberOfTurns: 0, description: 'Le joueur qui possède le roi de coeur à la fin de la partie perd 70 points', value: -70 },
        { name: 'Pas de coeurs', maxNumberOfTurns: 13, description: 'Le joueur qui possède des coeurs à la fin de la partie perd 5 points par coeur', value: -5 },
        { name: 'Pas de plis', maxNumberOfTurns: 13, description: 'Le joueur qui possède des plis à la fin de la partie perd 5 points par plis', value: -5 },
        { name: 'Pas de dames', maxNumberOfTurns: 0, description: 'Le joueur qui possède des dames à la fin de la partie perd 15 points par plis', value: -15 },
        { name: 'Salade', maxNumberOfTurns: 13, description: 'On reprend les contrats le barbu, pas de coeurs, pas de plis, pas de dames ', value: [-70, -5, -5, -15] },
        { name: 'Réussite', maxNumberOfTurns: 0, description: 'Le joueur qui possède qui gagne la réussite remporte 100 et le deuxième 50 points', value: [100, 50] }
    ];

    static calculateScore(players: Player[], currentPlayer: Player, currentContract: ChosenContract | null, sortedIndexedFolds: ICard[]): Player[] {
        if (currentContract) {
            const contract = Contracts.CONTRACTS.find((c) => c.name === currentContract.contract.name);
            if (contract) {
                switch (contract.name) {
                    case 'Le barbu':
                        return Array.isArray(contract.value)
                            ? this.calculateScoreBarbu(players, currentPlayer, contract.value[0], sortedIndexedFolds)
                            : this.calculateScoreBarbu(players, currentPlayer, contract.value as number, sortedIndexedFolds);
                    case 'Pas de coeurs':
                        return Array.isArray(contract.value)
                            ? this.calculateScorePasDeCoeurs(players, currentPlayer, contract.value[0])
                            : this.calculateScorePasDeCoeurs(players, currentPlayer, contract.value as number);
                    case 'Pas de plis':
                        return Array.isArray(contract.value)
                            ? this.calculateScorePasDePlis(players, currentPlayer, contract.value[0])
                            : this.calculateScorePasDePlis(players, currentPlayer, contract.value as number);
                    case 'Pas de dames':
                        return Array.isArray(contract.value)
                            ? this.calculateScorePasDeDames(players, currentPlayer, contract.value[0])
                            : this.calculateScorePasDeDames(players, currentPlayer, contract.value as number);
                    case 'Salade':
                        return this.calculateScoreSalade(players, currentPlayer, contract.value as number[]);
                    case 'Réussite':
                        return this.calculateScoreReussite(players, currentPlayer, contract.value as number[]);
                    default:
                        return players;
                }
            }
        }
        return players;
    }

    static calculateScoreBarbu(players: Player[], currentPlayer: Player, contractValue: number, sortedIndexedFolds: ICard[]) {
        return players.map((player, indexPlayer) => {
            const foundIndex = parseInt(Object.keys(sortedIndexedFolds)[0]);

            if (indexPlayer === foundIndex) {
                const foldsArray = Object.values(sortedIndexedFolds);
                player.myFoldsDuringTurn = [...player.myFoldsDuringTurn, ...foldsArray];
                //console.log("player.myFoldsDuringTurn", player.myFoldsDuringTurn);

                // Point 1: Toutes les cartes sont des cœurs et la plus grande est le Roi de cœur (♥K)
                if (
                    player.myFoldsDuringTurn.every((card) => card.suit === '♥') &&
                    player.myFoldsDuringTurn[0].value === 'K'
                ) {
                    console.log("player.score point1", player.score);
                    console.log("contractValue point1", contractValue);
                    player.score += contractValue;
                }

                // Point 2: Toutes les cartes sont des cœurs, mais la plus grande n'est pas le Roi de cœur (♥K)
                if (
                    player.myFoldsDuringTurn.every((card) => card.suit === '♥') &&
                    player.myFoldsDuringTurn[0].value !== 'K' &&
                    player.myFoldsDuringTurn.some((card) => card.suit === '♥' && card.value === 'K')
                ) {
                    const highestCardPlayer = players.reduce((highest, p) => {
                        const highestCard = highest.myFoldsDuringTurn[0];
                        const playerHighestCard = p.myFoldsDuringTurn[0];

                        if (highestCard && playerHighestCard) {
                            if (playerHighestCard.suit === '♥' && playerHighestCard.value > highestCard.value) {
                                return p;
                            }
                        }
                        return highest;
                    });

                    console.log("highestCardPlayer", highestCardPlayer)

                    if (highestCardPlayer.uid === player.uid) {
                        console.log("highestCardPlayer.score point2", highestCardPlayer.score);
                        console.log("contractValue point2", contractValue);
                        highestCardPlayer.score += contractValue;
                    }
                }

                // Point 3: le Roi de cœur (♥K) est parmi les 4 cartes mais 3 d'entre elles ne sont pas des cœurs
                if (
                    player.myFoldsDuringTurn.some((card) => card.suit === '♥' && card.value === 'K') &&
                    player.myFoldsDuringTurn.filter((card) => card.suit === '♥').length === 1 &&
                    player.myFoldsDuringTurn.filter((card) => card.suit !== '♥').length === 3 &&
                    player.myFoldsDuringTurn[0].value !== 'K'
                ) {
                    const highestCardPlayer = players.reduce((highest, p) => {
                        const highestCard = highest.myFoldsDuringTurn[0];
                        const playerHighestCard = p.myFoldsDuringTurn[0];

                        if (highestCard && playerHighestCard) {
                            if (playerHighestCard.suit === '♥' && playerHighestCard.value > highestCard.value) {
                                return p;
                            }
                        }
                        return highest;
                    });

                    if (highestCardPlayer.uid === player.uid) {
                        console.log("highestCardPlayer.score point3", highestCardPlayer.score);
                        console.log("contractValue point3", contractValue);
                        highestCardPlayer.score += contractValue;
                    }
                }

                // Point 4: toutes les cartes sont de couleur différente et aucune n'est un cœur
                // vérifier si dans chaque couleur quelle est la carte la plus haute
                if (
                    player.myFoldsDuringTurn.every((card) => card.suit !== '♥')
                ) {
                    console.log("point4")

                }


            }

            console.log("player.score", player.score)
            return player;
        });
    }

    static calculateScorePasDeCoeurs(players: Player[], currentPlayer: Player, contractValue: number) {
        return players.map((player) => {
            if (player.uid === currentPlayer.uid) {
                // déterminer le nombre de plis avec des coeurs
                let numberOfPlis: number = 0;
                player.myFoldsDuringTurn.forEach((card) => {
                    if (card.suit === '♥') {
                        numberOfPlis++;
                    }
                });

                player.score = player.score + (contractValue * numberOfPlis);

            }
            return player;
        });
    }

    static calculateScorePasDePlis(players: Player[], currentPlayer: Player, contractValue: number) {
        return players.map((player) => {
            if (player.uid === currentPlayer.uid) {
                // déterminer le nombre de plis
                let numberOfPlis: number;
                player.myFoldsDuringTurn.length % 4 === 0 ? numberOfPlis = player.myFoldsDuringTurn.length / 4 : numberOfPlis = Math.floor(player.myFoldsDuringTurn.length / 4) + 1;
                player.score = player.score + (contractValue * numberOfPlis);
            }
            return player;
        });
    }

    static calculateScorePasDeDames(players: Player[], currentPlayer: Player, contractValue: number) {
        return players.map((player) => {
            if (player.uid === currentPlayer.uid) {
                // déterminer le nombre de plis avec des coeurs
                let numberOfPlis: number = 0;
                player.myFoldsDuringTurn.forEach((card) => {
                    if (card.value === 'Q') {
                        numberOfPlis++;
                    }
                });
                player.score = player.score + (contractValue * numberOfPlis);
            }
            return player;
        });
    }

    static calculateScoreSalade(players: Player[], currentPlayer: Player, contractValue: number[]) {
        return players.map((player) => {
            if (player.uid === currentPlayer.uid) {
                // déterminer le nombre de plis avec des coeurs
                const numberOfPlis: number = 0;
                let numberOfCoeurs: number = 0;
                let numberOfDames: number = 0;
                let kingOfHearts: number = 0;
                player.myFoldsDuringTurn.forEach((card) => {
                    if (card.suit === '♥') {
                        numberOfCoeurs++;
                    }
                    if (card.value === 'Q') {
                        numberOfDames++;
                    }
                    if (card.suit === '♥' && card.value === 'K') {
                        kingOfHearts++;
                    }
                });
                player.score = player.score + (contractValue[0] * kingOfHearts) + (contractValue[1] * numberOfPlis) + (contractValue[2] * numberOfCoeurs) + (contractValue[2] * numberOfDames);
            }
            return player;
        });

    }

    static calculateScoreReussite(players: Player[], currentPlayer: Player, contractValue: number[]) {
        return players.map((player) => {
            if (player.uid === currentPlayer.uid) {
                // déterminer le premier qui n'a plus de cartes dans sa startedHand
                let numberOfPlayersWithNoCards: number = 0;
                players.forEach((player) => {
                    if (player.startedHand.length === 0) {
                        numberOfPlayersWithNoCards++;
                    }
                });
                if (numberOfPlayersWithNoCards === 1) {
                    player.score = player.score + contractValue[0];
                } else if (numberOfPlayersWithNoCards === 2) {
                    player.score = player.score + contractValue[1];
                }
            }

            return player;
        });
    }
}