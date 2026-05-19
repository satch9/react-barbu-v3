import CardGame from './CardGame';

type Card = {
  value: string;
  suit: string;
}

interface HandProps {
  cards: Card[];
  highlighted: number | undefined;
  onCardClick: (cardIndex: number) => void;
  playableIndices?: number[]; // Si défini, seules ces cartes sont cliquables (Réussite)
}

const Hand = ({ cards, highlighted, onCardClick, playableIndices }: HandProps) => {
  const row1 = cards.slice(0, 7);
  const row2 = cards.slice(7);

  const isPlayable = (idx: number) => playableIndices === undefined || playableIndices.includes(idx);

  const handleClick = (idx: number) => {
    if (isPlayable(idx)) onCardClick(idx);
  };

  const renderCard = (card: Card, index: number) => (
    <div
      key={index}
      className={isPlayable(index) ? '' : 'opacity-40 pointer-events-none'}
    >
      <CardGame
        card={card}
        highlighted={highlighted === index}
        onClick={() => handleClick(index)}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-1 w-full py-1">
      <div className="flex justify-center gap-1">
        {row1.map((card, index) => renderCard(card, index))}
      </div>
      <div className="flex justify-center gap-1">
        {row2.map((card, index) => renderCard(card, index + 7))}
      </div>
    </div>
  );
};

export default Hand;
