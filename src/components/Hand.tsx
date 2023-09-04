//import { useGameContext } from '../utils/gameUtils';

type Card = {
  value: string;
  suit: string;
}

interface HandProps {
  cards: Card[];
  highlighted: number | undefined;
  onCardClick: (cardIndex: number) => void;
}

const Hand = ({ cards, highlighted, onCardClick }: HandProps) => {
  return (
    <div className="hand">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`hand-card ${highlighted && index === highlighted ? 'highlighted' : ''}`}
          onClick={() => onCardClick(index)}

        >
          <span className={card.suit === '♥' || card.suit === '♦' ? 'suit card-red' : 'suit card-black'}>{card.suit}</span>
          <span>{card.value}</span>
        </div>
      ))}
    </div>
  );
};

export default Hand;