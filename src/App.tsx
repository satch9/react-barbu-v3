import { useState } from 'react';
import { useSocketContext } from './utils/socketUtils';
import { useGameContext } from './utils/gameUtils';
import ListOfGames from './components/ListOfGames';
import Board from './components/Board';
import RulesPage from './components/RulesPage';
import { useSocketSetup } from './hooks/useSocket';

const App = () => {
  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();
  const [showRules, setShowRules] = useState(false);

  useSocketSetup();

  if (!SocketState.socket) {
    return (
      <div className="min-h-[100dvh] bg-felt-dark flex items-center justify-center">
        <p className="text-card text-sm">Connexion au serveur…</p>
      </div>
    );
  }

  if (GameState.gameState.startedGame) return <Board />;
  if (showRules) return <RulesPage onBack={() => setShowRules(false)} />;
  return <ListOfGames onShowRules={() => setShowRules(true)} />;
};

export default App;
