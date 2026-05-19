import { ICard, Player } from '../backend/gameInterface';

interface PlayedCardsProps {
  folds: (ICard | null)[];
  players: Player[];
}

const isRed = (suit: string) => suit === '♥' || suit === '♦';

const PlayedCards = ({ folds, players }: PlayedCardsProps) => {
  return (
    <div className="h-28 flex items-center justify-center gap-3 shrink-0">
      {players.map((player, index) => {
        const card = folds[index] ?? null;
        return (
          <div key={player.uid} className="flex flex-col items-center gap-1">
            {card ? (
              <div className="w-10 h-16 bg-card rounded-md shadow-md flex flex-col justify-between p-1">
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
            ) : (
              <div className="w-10 h-16 border-2 border-dashed border-card/30 rounded-md" />
            )}
            <span className="text-xs text-card/70 max-w-[40px] truncate">{player.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PlayedCards;