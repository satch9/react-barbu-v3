import { useGameContext } from '../utils/gameUtils';

const BoardHeader = () => {
  const { GameState } = useGameContext();

  return (
    <div className="board-header">
      <h2>{`${GameState.gameState.currentTurn?.dealer.name} a choisi le contrat : ${GameState.gameState.currentContract?.contract.name}`}</h2>
      <p>{`C'est à ${GameState.gameState.currentPlayer.name} de poser sa carte!`}</p>
    </div>
  );
};

export default BoardHeader;