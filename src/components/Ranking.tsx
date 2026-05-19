import { useGameContext } from '../utils/gameUtils';
import { useSocketContext } from '../utils/socketUtils';
import { Button } from '@/components/ui/button';
import { formatLiveScore, liveScoreColor } from '../utils/liveScore';

interface RankingProps {
  isGameOver?: boolean;
  onClose?: () => void;
  liveScores?: Record<string, number | null>;
}

const Ranking = ({ isGameOver = false, onClose, liveScores }: RankingProps) => {
  const { GameState } = useGameContext();
  const { SocketState } = useSocketContext();
  const ranking = GameState.gameState.ranking;

  const handleNewGame = () => {
    const roomId = GameState.roomsState.rooms.find(room =>
      room.players.some(p => p.uid === SocketState.uid)
    )?.roomId;
    if (roomId) SocketState.socket?.emit('gobackgame', { roomIdGoBackGame: roomId });
  };

  if (isGameOver) {
    return (
      <div className="fixed inset-0 bg-felt flex flex-col items-center justify-center gap-6 z-50">
        <h2 className="text-card text-2xl font-bold">Partie terminée !</h2>
        <div className="bg-felt-dark/70 rounded-xl p-4 w-full max-w-xs mx-4">
          <p className="text-card font-semibold text-sm mb-3 text-center">Classement final</p>
          <div className="flex flex-col gap-2">
            {ranking.map((player, index) => (
              <div key={player.uid} className="flex justify-between text-card text-sm">
                <span>{index + 1}. {player.name}</span>
                <span className="font-mono">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>
        <Button
          className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold"
          onClick={handleNewGame}
        >
          Nouvelle partie
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-felt-dark/95 rounded-xl p-4 w-full max-w-xs mx-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-card font-semibold text-sm">Classement</p>
          {onClose && (
            <button onClick={onClose} className="text-card/60 hover:text-card text-lg leading-none px-1">✕</button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {ranking.map((player, index) => {
            const live = liveScores?.[player.uid] ?? null;
            const liveStr = formatLiveScore(live);
            return (
              <div key={player.uid} className="flex items-center justify-between text-card text-sm">
                <span>{index + 1}. {player.name}</span>
                <span className="flex items-center gap-2 font-mono">
                  <span>{player.score} pts</span>
                  {liveStr !== null && (
                    <span className={`text-xs font-semibold ${liveScoreColor(live)}`}>{liveStr}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Ranking;
