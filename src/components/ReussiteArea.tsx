import { useGameContext } from '../utils/gameUtils';

type Card = {
    value: string;
    suit: string;
}

const ReussiteArea = () => {
    const { GameState } = useGameContext();

    const getCardsBySuit = (suit: string): Card[] => {
        return GameState.gameState.currentPlayer.startedHand.filter((card) => card.suit === suit);
    };

    return (
        <div className="reussite-area">
            <div className="reussite-row">
                {getCardsBySuit('♥').map((card, index) => (
                    <div key={index} className={`reussite-card ${card.suit}`}>
                        {card.value}
                    </div>
                ))}
            </div>
            <div className="reussite-row">
                {getCardsBySuit('♦').map((card, index) => (
                    <div key={index} className={`reussite-card ${card.suit}`}>
                        {card.value}
                    </div>
                ))}
            </div>
            <div className="reussite-row">
                {getCardsBySuit('♣').map((card, index) => (
                    <div key={index} className={`reussite-card ${card.suit}`}>
                        {card.value}
                    </div>
                ))}
            </div>
            <div className="reussite-row">
                {getCardsBySuit('♠').map((card, index) => (
                    <div key={index} className={`reussite-card ${card.suit}`}>
                        {card.value}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReussiteArea;