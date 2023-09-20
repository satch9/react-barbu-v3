import { ICard } from "./gameInterface";

export class Card implements ICard {

    suit: string;
    value: string;
    [Symbol.iterator](): Iterator<ICard> {
        let index = 0;
        const cards: ICard[] = [this]; // Ajoutez les autres cartes à itérer si nécessaire

        return {
            next(): IteratorResult<ICard> {
                if (index < cards.length) {
                    const value = cards[index];
                    index++;
                    return { value, done: false };
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
    }

    static SUITS = ['♠', '♥', '♦', '♣'];
    static VALUES = [
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        'J',
        'Q',
        'K',
        'A'];

    constructor(suit: string, value: string) {
        this.suit = suit;
        this.value = value;
    }

    // sort by suit, then by descending value using STATIC VALUES
    static sort(cards: Card[]) {
        return cards.sort((a, b) => a.suit.localeCompare(b.suit) || Card.VALUES.indexOf(b.value) - Card.VALUES.indexOf(a.value));
    }
}