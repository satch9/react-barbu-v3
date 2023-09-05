type Card = {
    value: string;
    suit: string;
}

interface PlayedCardsProps {
  cards: Card[];
}

const PlayedCards = ({ cards }: PlayedCardsProps) => {
  console.log("cards",cards)
  return (
    <div className="played-cards">
      {cards.map((card, index) => (
        <div key={index} className={`played-card ${card.suit}`}>
          <span className={card.suit === '♥' || card.suit === '♦' ? 'suit card-red' : 'suit card-black'}>{card.suit}</span>
          <span>{card.value}</span>
        </div>
      ))}
    </div>
  );
};

export default PlayedCards;