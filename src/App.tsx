import { useSocketContext } from './utils/socketUtils';
import { useGameContext } from './utils/gameUtils';
import ListOfGames from './components/ListOfGames';
import Board from './components/Board';
import { useSocketSetup } from './hooks/useSocket';

const App = () => {
  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();

  useSocketSetup();

  if (!SocketState.socket) {
    return (
      <div className="min-h-[100dvh] bg-felt-dark flex items-center justify-center">
        <p className="text-card text-sm">Connexion au serveur…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh]">
      {GameState.gameState.startedGame ? <Board /> : <ListOfGames />}
    </div>
  );
};

export default App;
