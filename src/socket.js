import { io } from 'socket.io-client';

const SERVER_URL =
  'https://stackblitzstartersxuvo6dns-gkww--3000--017acfb7.local-credentialless.webcontainer.io';

export const socket = io(SERVER_URL, {
  transports: ['websocket'],
});
