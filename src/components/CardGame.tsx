type Card = {
    value: string;
    suit: string;
}

type CardProps = {
    card: Card;
    highlighted?: boolean;
    onClick?: () => void;
}
const CardGame: React.FC<CardProps> = ({ card, highlighted = false, onClick }) => {
    return (
        <div className="card-game">
            <div className={`card ${highlighted ? 'highlighted' : ''}`} onClick={onClick}>
                <span className={card.suit === '♥' || card.suit === '♦' ? 'suit card-red' : 'suit card-black'}>{card.suit}</span>
                <span>{card.value}</span>

            </div>
        </div>
    )
}

export default CardGame