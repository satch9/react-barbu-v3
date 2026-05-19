import CardGame from './CardGame';

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
  const row1 = cards.slice(0, 7);
  const row2 = cards.slice(7);

  return (
    <div className="flex flex-col gap-1 w-full py-1">
      <div className="flex justify-center gap-1">
        {row1.map((card, index) => (
          <CardGame
            key={index}
            card={card}
            highlighted={highlighted === index}
            onClick={() => onCardClick(index)}
          />
        ))}
      </div>
      <div className="flex justify-center gap-1">
        {row2.map((card, index) => (
          <CardGame
            key={index + 7}
            card={card}
            highlighted={highlighted === index + 7}
            onClick={() => onCardClick(index + 7)}
          />
        ))}
      </div>
    </div>
  );
};

export default Hand;
