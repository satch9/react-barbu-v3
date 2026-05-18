import { useEffect } from 'react';
import socketService from '../services/socketService';
import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';

export const useSocketSetup = () => {
  const { SocketDispatch } = useSocketContext();
  const { GameDispatch } = useGameContext();

  useEffect(() => {
    const socket = socketService.connect();
    SocketDispatch({ type: "UPDATE_SOCKET", payload: socket });

    socketService.setupEventListeners({
      onUserConnected: (players) => {
        SocketDispatch({ type: "UPDATE_USERS", payload: players });
      },
      onUserDisconnected: (uid) => {
        SocketDispatch({ type: "REMOVE_USER", payload: uid });
      },
      onGameState: (gameState) => {
        GameDispatch({ type: "SET_GAME_STATE", payload: gameState });
      },
      onRoomsState: (roomsState) => {
        GameDispatch({ type: "SET_ROOMS_STATE", payload: roomsState });
      },
      onStartedGame: () => {
        GameDispatch({ type: "GAME_STARTED", payload: true });
      },
      onError: (error) => {
        console.error("Socket error:", error);
      }
    });

    socketService.sendHandshake((uid, players, gameState, roomsState) => {
      SocketDispatch({ type: "UPDATE_UID", payload: uid });
      SocketDispatch({ type: "UPDATE_USERS", payload: players });
      if (gameState) GameDispatch({ type: "SET_GAME_STATE", payload: gameState });
      if (roomsState) GameDispatch({ type: "SET_ROOMS_STATE", payload: roomsState });
    });

    return () => {
      socketService.removeEventListeners();
      socketService.disconnect();
    };
  }, [SocketDispatch, GameDispatch]);
};