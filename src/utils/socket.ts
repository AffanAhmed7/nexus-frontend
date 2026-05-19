import { io } from 'socket.io-client';

const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
};
const SOCKET_URL = getSocketUrl();

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
});

export const connectSocket = (token: string) => {
    socket.auth = { token };
    socket.connect();
};

export const disconnectSocket = () => {
    socket.disconnect();
};
