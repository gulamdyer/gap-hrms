import { io } from 'socket.io-client';

let socket;

export function connectNotificationSocket(token) {
  if (!socket) {
    socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('🔔 Connected to notification server');
    });
    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('🔕 Disconnected from notification server');
    });
  }
  return socket;
}

export function onNotification(callback) {
  if (!socket) return;
  socket.on('notification', callback);
}

export function disconnectNotificationSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
