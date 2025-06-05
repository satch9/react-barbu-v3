import './App.css'
import { useEffect, useState } from 'react'

import { useSocket } from "./hooks/useSocket";
import { useSocketContext } from './utils/socketUtils';
import { useGameContext } from './utils/gameUtils';
import ListOfGames from './components/ListOfGames';
import { GameState, RoomsState } from './backend/gameInterface';
import Board from './components/Board';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [messageError, setMessageError] = useState("");
  const { SocketState, SocketDispatch } = useSocketContext();
  const { GameState, GameDispatch } = useGameContext();

  useEffect(() => {
    console.log("SocketState", SocketState);
    console.log("GameState state", GameState.gameState);
    console.log("GameState rooms state", GameState.roomsState);
    //console.log("GameDispatch", GameDispatch);
    //console.log("SocketDispatch", SocketDispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GameState]);

  const socket = useSocket(`http://${window.location.hostname}:4003`, {
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
  });

  useEffect(() => {
    socket.connect();

    /** Save the socket in context */
    SocketDispatch({ type: "UPDATE_SOCKET", payload: socket });
    /** Start the event listeners */
    StartListeners();
    /** Send the handshake */
    SendHandshake();

    return () => {
      socket.disconnect();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const StartListeners = () => {
    /** User connected event */
    socket.on("user_connected", (players: string[]) => {
      console.info("User connected, new user list received");
      SocketDispatch({ type: "UPDATE_USERS", payload: players });
    });

    /** User disconnected event */
    socket.on("user_disconnected", (uid: string) => {
      console.info("User disconnected");
      SocketDispatch({ type: "REMOVE_USER", payload: uid });
      SendHandshake();
    });

    /** Reconnect event*/
    socket.io.on("reconnect", (attempt) => {
      console.info(`Reconnected on attempt: ${attempt}`);
    });

    /** Reconnect attempt event*/
    socket.io.on("reconnect_attempt", (attempt) => {
      console.info(`Reconnection attempt : ${attempt}`);
    });

    /** Reconnection error*/
    socket.io.on("reconnect_error", (error) => {
      console.info(`Reconnection error : ${error}`);
    });

    /** Reconnection failed*/
    socket.io.on("reconnect_failed", () => {
      console.info(`Reconnection failure`);
      alert("We are unable to connect you to the web socket");
    });

    // ----------------------------------------- //
    //             Game section
    // ----------------------------------------- //

    socket.on("gameState", (gameState: GameState) => {
      //console.log("gameState", gameState);
      GameDispatch({ type: "SET_GAME_STATE", payload: gameState });
    });

    socket.on("roomsState", (roomsState: RoomsState) => {
      //console.log("roomsState", roomsState);
      GameDispatch({ type: "SET_ROOMS_STATE", payload: roomsState });
    });

    socket.on("started_game", () => {
      GameDispatch({ type: "GAME_STARTED", payload: true });
    });
  };

  const SendHandshake = () => {
    //console.info('Sending handshake to server ...');
    socket.emit(
      "handshake",
      (
        uid: string,
        players: string[],
      ) => {
        //console.log("User handshake callback message received");
        SocketDispatch({ type: "UPDATE_UID", payload: uid });
        SocketDispatch({ type: "UPDATE_USERS", payload: players });
        GameDispatch({ type: "SET_GAME_STATE", payload: GameState.gameState });
        GameDispatch({ type: "SET_ROOMS_STATE", payload: GameState.roomsState });
        setMessageError("");
        setLoading(false);
      }
    );
  };

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