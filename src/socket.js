import { io } from 'socket.io-client';

const SERVER_URL =
  'https://fifa-ddojumgum-server.onrender.com/';

export const socket = io(SERVER_URL, {
  transports: ['websocket'],
});
