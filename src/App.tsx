import './App.css'
import { useSocketContext } from './utils/socketUtils';
import { useGameContext } from './utils/gameUtils';
import ListOfGames from './components/ListOfGames';
import Board from './components/Board';
import { useSocketSetup } from './hooks/useSocket';

const App = () => {
  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();

  useSocketSetup();

  // Attend que la connexion socket soit établie
  if (!SocketState.socket) return <p>Connexion au serveur...</p>;

  return (
    <div className='app'>
      {GameState.gameState.startedGame ? <Board /> : <ListOfGames />}
    </div>
  );
};

export default App;
