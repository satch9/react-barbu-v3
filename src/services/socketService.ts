import { Socket, io } from 'socket.io-client';
import { GameState, RoomsState } from '../backend/gameInterface';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(options = {}) {
    if (!this.socket) {
      this.socket = io('/', {
        autoConnect: false,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        ...options
      });
    }
    this.socket.connect();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setupEventListeners(callbacks: {
    onUserConnected: (players: string[]) => void;
    onUserDisconnected: (uid: string) => void;
    onGameState: (gameState: GameState) => void;
    onRoomsState: (roomsState: RoomsState) => void;
    onStartedGame: () => void;
    onError: (error: string) => void;
  }) {
    if (!this.socket) return;

    this.socket.on("user_connected", callbacks.onUserConnected);
    this.socket.on("user_disconnected", callbacks.onUserDisconnected);
    this.socket.on("gameState", callbacks.onGameState);
    this.socket.on("roomsState", callbacks.onRoomsState);
    this.socket.on("started_game", callbacks.onStartedGame);
    this.socket.on("error", callbacks.onError);

    // Reconnection events
    this.socket.io.on("reconnect", (attempt) => {
      console.info(`Reconnected on attempt: ${attempt}`);
    });

    this.socket.io.on("reconnect_attempt", (attempt) => {
      console.info(`Reconnection attempt: ${attempt}`);
    });

    this.socket.io.on("reconnect_error", (error) => {
      console.info(`Reconnection error: ${error}`);
    });

    this.socket.io.on("reconnect_failed", () => {
      console.info("Reconnection failure");
      callbacks.onError("Unable to connect to the web socket");
    });
  }

  removeEventListeners() {
    if (!this.socket) return;

    this.socket.removeAllListeners();
    this.socket.io.removeAllListeners();
  }

  sendHandshake(callback: (uid: string, players: string[]) => void) {
    if (!this.socket) return;
    this.socket.emit("handshake", callback);
  }

  getSocket() {
    return this.socket;
  }
}

export default SocketService.getInstance();