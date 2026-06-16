// Socket.IO Client Service for Real-Time Community Chat
import { io } from 'socket.io-client';

const apiStr = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = apiStr.includes('/api') ? apiStr.replace('/api', '') : 'http://localhost:5005';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL || undefined, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
