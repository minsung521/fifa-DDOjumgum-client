import { useEffect, useRef, useState } from 'react';
import { socket } from './socket';
import StatusPanel from './StatusPanel';
import ChatPanel from './ChatPanel';
import './App.css';

let messageIdCounter = 0;
const nextMessageId = () => `m${++messageIdCounter}`;

function App() {
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connected' | 'disconnected' | 'reconnecting'
  const [status, setStatus] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [messages, setMessages] = useState([]);
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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on('status:update', onStatusUpdate);
    socket.on('users:count', onUsersCount);
    socket.on('chat:message', onChatMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('status:update', onStatusUpdate);
      socket.off('users:count', onUsersCount);
      socket.off('chat:message', onChatMessage);
    };
  }, []);

  const handleJoin = (nick) => {
    setNickname(nick);
    setJoined(true);
    // 로컬 전용 입장 안내 (서버에 다른 유저의 입장/퇴장을 알리는 이벤트가
    // 아직 없어서, 우선 본인 입장만 표시함 — 자세한 내용은 대화 마지막 참고)
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), system: true, text: `${nick}님이 입장했어요` },
    ]);
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
      />
    </div>
  );
}

export default App;