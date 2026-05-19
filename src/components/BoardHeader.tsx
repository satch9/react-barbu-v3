import { useGameContext } from '../utils/gameUtils';

const BoardHeader = () => {
  const { GameState } = useGameContext();
  const { currentContract, currentTurn, currentPlayer } = GameState.gameState;

  return (
    <div className="h-10 bg-felt-dark/80 flex items-center justify-center px-3 shrink-0">
      {currentContract ? (
        <p className="text-card text-sm font-semibold truncate">
          {`Contrat : ${currentContract.contract.name} — Dealer : ${currentTurn.dealer.name}`}
        </p>
      ) : (
        <p className="text-card text-sm">
          {`${currentPlayer.name} choisit un contrat`}
        </p>
      )}
    </div>
  );
};

export default BoardHeader;