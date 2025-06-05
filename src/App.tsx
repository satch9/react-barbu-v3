import './App.css'
import { useEffect, useState } from 'react'
import { useSocketContext } from './utils/socketUtils';
import { useGameContext } from './utils/gameUtils';
import ListOfGames from './components/ListOfGames';
import Board from './components/Board';
import { useSocketSetup } from './hooks/useSocket';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [messageError, setMessageError] = useState("");
  const { SocketState } = useSocketContext();
  const { GameState } = useGameContext();

  useSocketSetup();

  useEffect(() => {
    console.log("SocketState", SocketState);
    console.log("GameState state", GameState.gameState);
    console.log("GameState rooms state", GameState.roomsState);
    setLoading(false);
    setMessageError("");
  }, [GameState, SocketState]);

  if (loading) return <p>Loading game ....</p>;

  return (
    <div className='app'>
      {
        GameState.gameState.startedGame ? <Board /> : <ListOfGames />
      }
      <p className="messageError">{messageError && messageError}</p>
      <div className="global">
        <span>
          Etat du jeu :<pre>{JSON.stringify(GameState.gameState, null, 1)}</pre>
        </span>
        <span>
          Etat des rooms :
          <pre>{JSON.stringify(GameState.roomsState, null, 1)}</pre>
        </span>
        <span>
          Etat des sockets :
          <pre>uid: {JSON.stringify(SocketState.uid, null, 1)}</pre>
          <pre>players :{JSON.stringify(SocketState.players, null, 1)}</pre>
        </span>
      </div>
    </div>
  )
}

export default App