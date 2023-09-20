import { Card } from "./Card";
import { Player } from "./gameInterface";
import { customCompare } from "./utils";

export class Deck {
    cards: Card[] | undefined;


    constructor(cardsClass?: Card[]) {
        if (cardsClass === undefined) {
            this.cards = this.freshDeck();
        } else {
            this.cards = cardsClass;
        }
    }

    get numberOfCards() {
        return this.cards?.length;
    }

    freshDeck() {
        return Card.SUITS.flatMap(suit => {
            return Card.VALUES.map(value => {
                return new Card(suit, value);
            });
        });
    }

    // Add null checks to fix "Object is possibly 'undefined'" error
    shuffle() {
        if (this.cards) {
            for (let index = this.numberOfCards! - 1; index > 0; index--) {
                const newIndex = Math.floor(Math.random() * (index + 1));
                const oldValue = this.cards[newIndex];
                if (this.cards[index]) {
                    this.cards[newIndex] = this.cards[index];
                    this.cards[index] = oldValue;
                }
            }
        }
    }

    sort(playerCards: Card[]) {
        return playerCards.sort((a, b) => a.suit.localeCompare(b.suit) || a.value.localeCompare(b.value));
    }



    dealCardsToPlayers(players: Player[]) {
        const numPlayers = players.length;
        const numCardsPerPlayer = Math.floor(this.numberOfCards! / numPlayers);

        //console.log('numPlayers', numPlayers);
        //console.log('numCardsPerPlayer', numCardsPerPlayer);

        players.forEach(player => {
            const hand = [];
            for (let i = 0; i < numCardsPerPlayer; i++) {
                const card = this.cards?.pop();

                if (card) {
                    hand.push(card);
                }
            }
            //console.log('hand', hand)

            hand.sort(customCompare)
            //console.log('hand deck dealCardsToPlayers', hand);

            player.startedHand = hand;
            //console.log('player.startedHand deck dealCardsToPlayers', player.startedHand);
        });
    }
}

