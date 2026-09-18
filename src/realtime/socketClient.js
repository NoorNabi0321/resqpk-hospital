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

/**
 * A connection scoped to a single case, for the public tracking page.
 *
 * Separate from the dashboard socket above on purpose: it authenticates with a
 * case token rather than a staff login, and it must not replace the shared
 * instance if someone happens to have the dashboard open in another tab. The
 * server puts this connection in that one case room and registers no role
 * handlers for it.
 */
export function connectCaseSocket(caseToken) {
  const socketUrl =
    import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

  return io(socketUrl, {
    auth: { token: caseToken },
    transports: ['websocket', 'polling'], // polling fallback for restrictive mobile networks
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
