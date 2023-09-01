import React, { useReducer } from 'react';
import { GameState, Player, RoomsState } from '../backend/gameInterface';

export interface IGameContextState {
    gameState: GameState;
    roomsState: RoomsState;
}

const defaultGameContextState: IGameContextState = {
    gameState: {
        players: [],
        currentPlayer: {
            uid: "",
            name: "",
            startedHand: [],
            myFoldsDuringTurn: [],
            chosenContracts: [],
            socketId: "",
            score: 0,
            isReady: false,
            isPlaying: false,
            isDisconnected: false,
        },
        currentContract: null,
        currentTurn: null,
        turnResult: null,
        ranking: [],
        contracts: [],
        startedGame: false,
    },
    roomsState: {
        rooms: [],
    },
}

export type Action =
    { type: 'SET_GAME_STATE'; payload: GameState; }
    | { type: 'SET_PLAYERS'; payload: Player[]; }
    | { type: 'UPDATE_GAME_PLAYER'; payload: Player; }
    | { type: 'SET_ROOMS_STATE'; payload: RoomsState; }
    | { type: 'JOIN_ROOM'; payload: { roomId: string; player: Player } }
    | { type: 'LEAVE_ROOM'; payload: { roomId: string; player: Player } }
    | { type: 'GAME_STARTED'; payload: boolean }

const gameReducer = (state: IGameContextState, action: Action): IGameContextState => {
    console.log('gameReducers - state:', state);
    console.log(`Message received - Action: ${action.type} - Payload:`, action.payload);

    switch (action.type) {
        case 'SET_GAME_STATE':
            return { ...state, gameState: action.payload };
        case 'SET_PLAYERS':
            return { ...state, gameState: { ...state.gameState, players: action.payload } };
        case 'UPDATE_GAME_PLAYER': {
            const newPlayers = state.gameState.players.map(player => {
                if (player.uid === action.payload.uid) {
                    return action.payload;
                }
                return player;
            });
            return { ...state, gameState: { ...state.gameState, players: newPlayers } };
        }
        case 'SET_ROOMS_STATE':
            return { ...state, roomsState: action.payload };
        case 'JOIN_ROOM':
            return {
                ...state,
                roomsState: {
                    ...state.roomsState,
                    rooms: state.roomsState.rooms.map(room => {
                        if (room.roomId === action.payload.roomId) {
                            return {
                                ...room,
                                players: [...room.players, action.payload.player],
                            };
                        }
                        return room;
                    }),
                },
            };
        case 'LEAVE_ROOM':
            return {
                ...state,
                roomsState: {
                    ...state.roomsState,
                    rooms: state.roomsState.rooms.map(room => {
                        if (room.roomId === action.payload.roomId) {
                            return {
                                ...room,
                                players: room.players.filter(player => player.uid !== action.payload.player.uid),
                            };
                        }
                        return room;
                    }),
                },
            };
        case 'GAME_STARTED':
            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    startedGame: action.payload,
                },
            };
        default:
            return { ...state };
    }
}

export interface IGameContextProps {
    GameState: IGameContextState;
    GameDispatch: React.Dispatch<Action>;
}

export const GameContext = React.createContext<IGameContextProps>({
    GameState: defaultGameContextState,
    GameDispatch: () => { }
});

export const GameContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    // Initial state and gameReducer setup here
    const [state, dispatch] = useReducer(gameReducer, defaultGameContextState);

    const contextValue: IGameContextProps = {
        GameState: state,
        GameDispatch: dispatch,
    };

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
}

