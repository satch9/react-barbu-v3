import { useEffect } from 'react';
import socketService from '../services/socketService';
import { useSocketContext } from '../utils/socketUtils';
import { useGameContext } from '../utils/gameUtils';

const UID_STORAGE_KEY = 'barbu_uid';

export const useSocketSetup = () => {
  const { SocketDispatch } = useSocketContext();
  const { GameDispatch } = useGameContext();

  useEffect(() => {
    const socket = socketService.connect();
    SocketDispatch({ type: "UPDATE_SOCKET", payload: socket });

    const doHandshake = () => {
      const existingUid = localStorage.getItem(UID_STORAGE_KEY);
      socketService.sendHandshake(existingUid, (uid, players, gameState, roomsState) => {
        localStorage.setItem(UID_STORAGE_KEY, uid);
        SocketDispatch({ type: "UPDATE_UID", payload: uid });
        SocketDispatch({ type: "UPDATE_USERS", payload: players });
        if (gameState) GameDispatch({ type: "SET_GAME_STATE", payload: gameState });
        if (roomsState) GameDispatch({ type: "SET_ROOMS_STATE", payload: roomsState });
      });
    };

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
      },
      // Re-handshake à chaque connexion (initiale ET reconnexion auto).
      onConnect: doHandshake,
    });

    // iOS suspend les onglets en arrière-plan : la WebSocket meurt et la
    // reconnexion auto de Socket.IO peut expirer. Quand l'onglet revient
    // au premier plan, on force une reconnexion si nécessaire.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socketService.removeEventListeners();
      socketService.disconnect();
    };
  }, [SocketDispatch, GameDispatch]);
};
