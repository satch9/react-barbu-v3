import { useGameContext } from '../utils/gameUtils';

type Card = { value: string; suit: string }
const SUITS = ['♥', '♦', '♣', '♠'];
const isRed = (suit: string) => suit === '♥' || suit === '♦';

const ReussiteArea = () => {
  const { GameState } = useGameContext();

  const getCardsBySuit = (suit: string): Card[] =>
    GameState.gameState.currentPlayer.startedHand.filter(c => c.suit === suit);

  return (
    <div className="bg-felt-dark/50 rounded-xl p-2 mx-2 flex flex-col gap-1 shrink-0">
      {SUITS.map(suit => {
        const cards = getCardsBySuit(suit);
        if (cards.length === 0) return null;
        return (
          <div key={suit} className="flex gap-1 flex-wrap items-center">
            <span className={`text-sm font-bold w-5 ${isRed(suit) ? 'text-red-400' : 'text-card'}`}>
              {suit}
            </span>
            {cards.map((card, i) => (
              <span key={i} className={`text-sm ${isRed(suit) ? 'text-red-400' : 'text-card'}`}>
                {card.value}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ReussiteArea;