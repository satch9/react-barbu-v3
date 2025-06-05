import { useEffect, useRef } from "react";
import io, { ManagerOptions, SocketOptions, Socket } from "socket.io-client";

export const useSocket = (uri: string, opts?: Partial<ManagerOptions & SocketOptions> | undefined): Socket => {
    const { current: socket } = useRef(io(uri, {
        ...opts,
        transports: ['websocket'],
        upgrade: false
    }));

    useEffect(() => {
        return () => {
            if (socket) socket.close();
        }
    }, [socket]);

    return socket;
}