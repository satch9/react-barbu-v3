export class Card {

    suit: string;
    value: string;

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
}