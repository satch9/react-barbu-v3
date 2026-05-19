type Card = {
  value: string;
  suit: string;
}

type CardProps = {
  card: Card;
  highlighted?: boolean;
  onClick?: () => void;
}

const isRed = (suit: string) => suit === '♥' || suit === '♦';

const CardGame: React.FC<CardProps> = ({ card, highlighted = false, onClick }) => {
  return (
    <div
      className={`w-10 h-16 bg-card rounded-md shadow-md flex flex-col justify-between p-1 cursor-pointer select-none
        transition-transform duration-150
        ${highlighted ? 'ring-2 ring-yellow-400 -translate-y-2' : ''}`}
      onClick={onClick}
    >
      <div className={`text-xs font-bold leading-none ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
        {card.value}<span className="ml-0.5">{card.suit}</span>
      </div>
      <div className={`text-xl text-center leading-none ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
        {card.suit}
      </div>
      <div className={`text-xs font-bold leading-none text-right rotate-180 ${isRed(card.suit) ? 'text-red-600' : 'text-gray-900'}`}>
        {card.value}<span className="ml-0.5">{card.suit}</span>
      </div>
    </div>
  );
};

export default CardGame;
