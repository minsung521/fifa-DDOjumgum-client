import { io } from 'socket.io-client';

const SERVER_URL = 'https://fifa-ddojumgum-server.onrender.com';

// 지금은 FC 온라인 단일 게임만 지원. 나중에 다른 게임으로
// 확장할 때 이 값만 바꾸거나 라우트 파라미터로 대체하면 됨
export const GAME_ID = 'fc-online';

export const socket = io(SERVER_URL, {
  query: { gameId: GAME_ID },
});