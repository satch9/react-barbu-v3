/* type Card = {
  value: string;
  suit: string;
} */

import { ICard } from "../backend/gameInterface";

interface PlayedCardsProps {
  cards: (ICard | null)[];
}

const PlayedCards = ({ cards }: PlayedCardsProps) => {
  const nonNullCards = cards.filter((card): card is ICard => card !== null);
  return (
    <div className="played-cards">
      {nonNullCards.map((card, index) => (
        <div key={index} className={`played-card ${card.suit}`}>
          <span className={card.suit === '♥' || card.suit === '♦' ? 'suit card-red' : 'suit card-black'}>{card.suit}</span>
          <span>{card.value}</span>
        </div>
      ))}
    </div>
  );
};

export default PlayedCards;