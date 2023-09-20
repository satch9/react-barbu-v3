import { Card } from "./Card";

export function customCompare(card1: Card, card2: Card): number {
    const cardOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    // Comparaison par suit
    const suitComparison = card1.suit.localeCompare(card2.suit);
    //console.log('suitComparison', suitComparison)

    // Si les suits sont différentes, retourne le résultat de la comparaison par suit
    if (suitComparison !== 0) {
        return suitComparison;
    }

    // Si les suits sont les mêmes, compare par value en utilisant cardOrder
    const valueIndex1 = cardOrder.indexOf(card1.value);
    const valueIndex2 = cardOrder.indexOf(card2.value);
    //console.log('valueIndex1', valueIndex1);
    //console.log('valueIndex2', valueIndex2);
    //console.log('valueIndex1 - valueIndex2', valueIndex1 - valueIndex2)

    return valueIndex1 - valueIndex2;
}