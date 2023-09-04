type Card = {
    value: string;
    suit: string;
}

interface PlayedCardsProps {
  cards: Card[];
}

const PlayedCards = ({ cards }: PlayedCardsProps) => {
  return (
    <div className="played-cards">
      {cards.map((card, index) => (
        <div key={index} className={`played-card ${card.suit}`}>
          {card.value}
        </div>
      ))}
    </div>
  );
};

export default PlayedCards;