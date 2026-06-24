import { io } from 'socket.io-client';

let socket = null;

// Connects (or returns the existing) authenticated socket.
export function connectSocket() {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('resqpk_token');
  const socketUrl =
    import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
