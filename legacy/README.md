# legacy

운영 기간(2026.08.08 ~ 2026.09.30)에 쓰던 화면 코드입니다. 운영 종료 후 빌드에서 제외되어 있습니다.

- `App.jsx` · `StatusPanel.jsx` · `ChatPanel.jsx` · `JoinToastStack.jsx` — 공개 로비(점검 상태, 카운트다운, 접속자 수, 익명 채팅)
- `AdminPage.jsx` — 관리자 화면
- `socket.js` — Socket.io 연결

`src/`에서 import하지 않으므로 번들에 포함되지 않습니다. 다시 살리려면 `src/`로 옮기고 `socket.io-client`를 설치한 뒤 `VITE_SERVER_URL`을 설정해야 합니다.
