import { Player, ChosenContract } from "./gameInterface";

export class Contracts {
    static CONTRACTS = [
        { name: 'Le barbu', maxNumberOfTurns: 0, description: 'Le joueur qui possède le roi de coeur à la fin de la partie perd 70 points', value: -70 },
        { name: 'Pas de coeurs', maxNumberOfTurns: 13, description: 'Le joueur qui possède des coeurs à la fin de la partie perd 5 points par coeur', value: -5 },
        { name: 'Pas de plis', maxNumberOfTurns: 13, description: 'Le joueur qui possède des plis à la fin de la partie perd 5 points par plis', value: -5 },
        { name: 'Pas de dames', maxNumberOfTurns: 0, description: 'Le joueur qui possède des dames à la fin de la partie perd 15 points par plis', value: -15 },
        { name: 'Salade', maxNumberOfTurns: 13, description: 'On reprend les contrats le barbu, pas de coeurs, pas de plis, pas de dames ', value: [-70, -5, -5, -15] },
        { name: 'Réussite', maxNumberOfTurns: 0, description: 'Le joueur qui possède qui gagne la réussite remporte 100 et le deuxième 50 points', value: [100, 50] }
    ];

    static calculateScore(players: Player[], currentPlayer: Player, currentContract: ChosenContract | null): Player[] {
        if (currentContract) {
            const contract = Contracts.CONTRACTS.find((c) => c.name === currentContract.contract.name);
            if (contract) {
                switch (contract.name) {
                    case 'Le barbu':
                        return Array.isArray(contract.value)
                            ? this.calculateScoreBarbu(players, currentPlayer, contract.value[0])
                            : this.calculateScoreBarbu(players, currentPlayer, contract.value as number);
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

    static calculateScoreBarbu(players: Player[], currentPlayer: Player, contractValue: number) {
        return players.map((player) => {
            if (player.uid === currentPlayer.uid) {
                player.myFoldsDuringTurn.forEach((card) => {
                    if (card.suit === '♥' && card.value === 'K') {

                        player.score = player.score + contractValue;

                    }
                });
            }
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