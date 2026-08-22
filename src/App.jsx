import { useCallback, useEffect, useRef, useState } from 'react';
import { socket, GAME_ID } from './socket';
import StatusPanel from './StatusPanel';
import ChatPanel from './ChatPanel';
import './App.css';

let messageIdCounter = 0;
const nextMessageId = () => `m${++messageIdCounter}`;

let toastIdCounter = 0;
const nextToastId = () => `t${++toastIdCounter}`;

// 동시 입장이 몰려도 화면을 뒤덮지 않도록 최신 토스트만 유지
const MAX_VISIBLE_JOIN_TOASTS = 2;

function App() {
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connected' | 'disconnected' | 'reconnecting'
  const [status, setStatus] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [messages, setMessages] = useState([]);
  // 입장 알림 토스트 — 채팅 메시지(messages)와는 완전히 별도로 관리, 채팅 로그에는 절대 섞지 않음
  const [joinToasts, setJoinToasts] = useState([]);
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);

  const nicknameRef = useRef(nickname);
  nicknameRef.current = nickname;

  useEffect(() => {
    function onConnect() {
      setConnectionState('connected');
    }
    function onDisconnect() {
      setConnectionState('disconnected');
    }
    function onReconnectAttempt() {
      setConnectionState('reconnecting');
    }
    function onStatusUpdate(data) {
      setStatus(data);
    }
    function onUsersCount(data) {
      // 서버가 { gameId, count } 객체로 보냄
      setUsersCount(data.count);
    }
    function onChatMessage(msg) {
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), time: Date.now(), ...msg },
      ]);
    }
    // 다른 유저의 입장을 알리는 토스트. 서버가 본인은 제외하고 브로드캐스트하므로
    // 별도 필터링 없이 큐에 추가하면 됨. 채팅 메시지(messages)에는 절대 넣지 않음
    function onUserJoined(payload = {}) {
      const { gameId: joinedGameId, nickname: joinedNickname } = payload;
      if (joinedGameId && joinedGameId !== GAME_ID) return;
      if (!joinedNickname) return;
      setJoinToasts((prev) => {
        const next = [
          ...prev,
          { id: nextToastId(), text: `${joinedNickname}님이 입장했어요` },
        ];
        return next.length > MAX_VISIBLE_JOIN_TOASTS
          ? next.slice(next.length - MAX_VISIBLE_JOIN_TOASTS)
          : next;
      });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on('status:update', onStatusUpdate);
    socket.on('users:count', onUsersCount);
    socket.on('chat:message', onChatMessage);
    socket.on('user:joined', onUserJoined);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('status:update', onStatusUpdate);
      socket.off('users:count', onUsersCount);
      socket.off('chat:message', onChatMessage);
      socket.off('user:joined', onUserJoined);
    };
  }, []);

  const handleExpireToast = useCallback((id) => {
    setJoinToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleJoin = (nick) => {
    setNickname(nick);
    setJoined(true);
    socket.emit('chat:join', { nickname: nick });
    socket.emit('user:join', { gameId: GAME_ID, nickname: nick });
  };

  const handleSend = (text) => {
    socket.emit('chat:message', { nickname: nicknameRef.current, message: text });
  };

  return (
    <div className="app-shell">
      <StatusPanel
        status={status}
        usersCount={usersCount}
        connectionState={connectionState}
      />
      <ChatPanel
        messages={messages}
        joined={joined}
        nickname={nickname}
        onJoin={handleJoin}
        onSend={handleSend}
        joinToasts={joinToasts}
        onExpireToast={handleExpireToast}
      />
    </div>
  );
}

export default App;