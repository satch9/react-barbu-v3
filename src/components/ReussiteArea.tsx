import { ICard } from '../backend/gameInterface';

const SUITS: ('♥' | '♦' | '♣' | '♠')[] = ['♥', '♦', '♣', '♠'];
const VALUES_52 = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const VALUES_32 = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const isRed = (suit: string) => suit === '♥' || suit === '♦';

interface ReussiteAreaProps {
  chains: { [suit: string]: ICard[] };
  deckSize: 32 | 52;
}

const ReussiteArea = ({ chains, deckSize }: ReussiteAreaProps) => {
  const values = deckSize === 32 ? VALUES_32 : VALUES_52;

  return (
    <div className="bg-felt-dark/40 rounded-xl p-2 mx-2 my-1 flex flex-col gap-1 shrink-0">
      {SUITS.map(suit => {
        const chain = chains[suit] ?? [];
        const cardsByValue = new Map(chain.map(c => [c.value, c]));
        return (
          <div key={suit} className="flex items-center gap-1 overflow-x-auto">
            <span className={`text-base font-bold w-5 shrink-0 ${isRed(suit) ? 'text-red-400' : 'text-card'}`}>
              {suit}
            </span>
            <div className="flex gap-0.5">
              {values.map(value => {
                const card = cardsByValue.get(value);
                if (card) {
                  return (
                    <div
                      key={value}
                      className={`w-6 h-9 bg-card rounded-sm shadow flex items-center justify-center text-xs font-bold shrink-0 ${
                        isRed(card.suit) ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {card.value}
                    </div>
                  );
                }
                return (
                  <div
                    key={value}
                    className="w-6 h-9 border border-dashed border-card/30 rounded-sm flex items-center justify-center text-card/30 text-[10px] shrink-0"
                  >
                    {value}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReussiteArea;
