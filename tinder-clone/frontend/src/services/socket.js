import { io, Socket } from 'socket.io-client';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
let socket = null;
/** Returns a shared, authenticated socket connection (created once per session). */
export const getSocket = () => {
    if (!socket) {
        socket = io(API_URL, {
            auth: { token: localStorage.getItem('token') || '' },
            transports: ['websocket', 'polling'],
        });
    }
    return socket;
};
export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
};
//# sourceMappingURL=socket.js.map