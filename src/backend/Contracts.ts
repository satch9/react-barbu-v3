import { Player, ChosenContract, ReussiteState } from "./gameInterface";

export class Contracts {
    static CONTRACTS = [
        { name: 'Le barbu', description: 'Le joueur qui prend le roi de cœur perd 70 points', value: -70 },
        { name: 'Pas de coeurs', description: 'Le joueur qui possède des coeurs à la fin de la partie perd 5 points par coeur', value: -5 },
        { name: 'Pas de plis', description: 'Le joueur qui possède des plis à la fin de la partie perd 5 points par plis', value: -5 },
        { name: 'Pas de dames', description: 'Le joueur qui possède des dames à la fin de la partie perd 15 points par plis', value: -15 },
        { name: 'Salade', description: 'On reprend les contrats le barbu, pas de coeurs, pas de plis, pas de dames ', value: [-70, -5, -5, -15] },
        { name: 'Réussite', description: 'Le joueur qui gagne le plus de plis remporte 100 et le deuxième 50 points', value: [100, 50] }
    ];

    /**
     * Calcule les scores en fin de manche pour tous les joueurs.
     * "Le barbu" est scoré en cours de jeu (par pli), pas ici.
     */
    static calculateHandScore(players: Player[], currentContract: ChosenContract, reussite?: ReussiteState): Player[] {
        const contractName = currentContract.contract.name;
        const contractValue = currentContract.contract.value;
        const numPlayers = players.length;

        switch (contractName) {
            case 'Le barbu':
                // Scoré en temps réel pendant les plis (dans Game.ts)
                return players;

            case 'Pas de coeurs':
                return players.map(player => ({
                    ...player,
                    score: player.score + (contractValue as number) * player.myFoldsDuringTurn.filter(c => c.suit === '♥').length
                }));

            case 'Pas de plis':
                return players.map(player => ({
                    ...player,
                    score: player.score + (contractValue as number) * Math.floor(player.myFoldsDuringTurn.length / numPlayers)
                }));

            case 'Pas de dames':
                return players.map(player => ({
                    ...player,
                    score: player.score + (contractValue as number) * player.myFoldsDuringTurn.filter(c => c.value === 'Q').length
                }));

            case 'Salade': {
                // values: [-70 barbu, -5 plis, -5 coeurs, -15 dames]
                const values = contractValue as number[];
                return players.map(player => {
                    const kh = player.myFoldsDuringTurn.filter(c => c.suit === '♥' && c.value === 'K').length;
                    const hearts = player.myFoldsDuringTurn.filter(c => c.suit === '♥').length;
                    const queens = player.myFoldsDuringTurn.filter(c => c.value === 'Q').length;
                    const tricks = Math.floor(player.myFoldsDuringTurn.length / numPlayers);
                    return {
                        ...player,
                        score: player.score
                            + values[0] * kh
                            + values[1] * tricks
                            + values[2] * hearts
                            + values[3] * queens
                    };
                });
            }

            case 'Réussite': {
                // Le 1er joueur à vider sa main gagne +100, le 2e +50
                const values = contractValue as number[];
                const finishOrder = reussite?.finishOrder ?? [];
                return players.map(player => {
                    if (player.uid === finishOrder[0]) return { ...player, score: player.score + values[0] };
                    if (player.uid === finishOrder[1]) return { ...player, score: player.score + values[1] };
                    return player;
                });
            }

            default:
                return players;
        }
    }
}
