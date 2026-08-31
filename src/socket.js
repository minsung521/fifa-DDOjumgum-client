import { io } from 'socket.io-client';

// VITE_SERVER_URL이 없으면(로컬 .env 미설정 등) 현재 운영 서버로 fallback —
// 서버 이전/CORS 재설정 시 .env만 바꾸면 되도록 하드코딩을 걷어냄
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || 'https://fifa-ddojumgum-server.onrender.com';

// 지금은 FC 온라인 단일 게임만 지원. 나중에 다른 게임으로
// 확장할 때 이 값만 바꾸거나 라우트 파라미터로 대체하면 됨
export const GAME_ID = 'fc-online';

// 커뮤니티 홍보 링크(?src=dc, ?src=femco 등)의 유입 채널을 서버 로깅으로 넘기기 위한 값.
// 없으면 키 자체를 생략 — null을 그대로 넘기면 socket.io가 문자열 "null"로 직렬화해버림
const src = new URLSearchParams(window.location.search).get('src');

export const socket = io(SERVER_URL, {
  query: {
    gameId: GAME_ID,
    ...(src ? { src } : {}),
  },
});