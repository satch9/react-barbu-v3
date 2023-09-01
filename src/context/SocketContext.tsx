import React, { useReducer } from 'react';
import { Socket } from 'socket.io-client';

export interface ISocketContextState {
    socket: Socket | undefined;
    uid: string;
    players: string[];
}

const defaultSocketContextState: ISocketContextState = {
    socket: undefined,
    uid: "",
    players: [],
}

export type Action =
    { type: 'UPDATE_SOCKET'; payload: Socket }
    |
    { type: 'UPDATE_UID'; payload: string }
    |
    { type: 'UPDATE_USERS'; payload: string[] }
    |
    { type: 'REMOVE_USER'; payload: string }

const socketReducer = (state: ISocketContextState, action: Action): ISocketContextState => {
    console.log(`Message received - Action: ${action.type} - Payload:`, action.payload);

    switch (action.type) {
        case 'UPDATE_SOCKET':
            return { ...state, socket: action.payload };
        case 'UPDATE_UID':
            return { ...state, uid: action.payload };
        case 'UPDATE_USERS':
            return { ...state, players: action.payload };
        case 'REMOVE_USER':
            return { ...state, players: state.players.filter(uid => uid !== action.payload) };

        default:
            return { ...state };
    }
}

export interface ISocketContextProps {
    SocketState: ISocketContextState;
    SocketDispatch: React.Dispatch<Action>;
}

export const SocketContext = React.createContext<ISocketContextProps>({
    SocketState: defaultSocketContextState,
    SocketDispatch: () => { }
});

export const SocketContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    // Initial state and socketReducer setup here
    const [state, dispatch] = useReducer(socketReducer, defaultSocketContextState);

    const contextValue: ISocketContextProps = {
        SocketState: state,
        SocketDispatch: dispatch,
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};


