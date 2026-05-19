import { useGameContext } from '../utils/gameUtils';

interface BoardHeaderProps {
  onScoreClick: () => void;
}

const BoardHeader = ({ onScoreClick }: BoardHeaderProps) => {
  const { GameState } = useGameContext();
  const { currentContract, currentTurn, currentPlayer } = GameState.gameState;

  return (
    <div className="h-10 bg-felt-dark/80 flex items-center justify-between px-3 shrink-0">
      <div className="w-8" />
      {currentContract ? (
        <p className="text-card text-sm font-semibold truncate">
          {`Contrat : ${currentContract.contract.name} — Dealer : ${currentTurn.dealer.name}`}
        </p>
      ) : (
        <p className="text-card text-sm truncate">
          {`${currentPlayer.name} choisit un contrat`}
        </p>
      )}
      <button
        onClick={onScoreClick}
        className="w-8 h-8 flex items-center justify-center text-card/70 hover:text-card text-lg shrink-0"
        aria-label="Voir le classement"
      >
        ≡
      </button>
    </div>
  );
};

export default BoardHeader;
