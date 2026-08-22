import { useEffect, useRef, useState } from 'react';
import { socket, GAME_ID } from './socket';
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
    function onUserJoined({ gameId, nickname: joinedNickname }) {
      if (gameId !== GAME_ID) return;
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), system: true, text: `${joinedNickname}님이 입장했어요` },
      ]);
    }
    function onUserLeft({ gameId, nickname: leftNickname }) {
      if (gameId !== GAME_ID) return;
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), system: true, text: `${leftNickname}님이 나갔어요` },
      ]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on('status:update', onStatusUpdate);
    socket.on('users:count', onUsersCount);
    socket.on('chat:message', onChatMessage);
    socket.on('user:joined', onUserJoined);
    socket.on('user:left', onUserLeft);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('status:update', onStatusUpdate);
      socket.off('users:count', onUsersCount);
      socket.off('chat:message', onChatMessage);
      socket.off('user:joined', onUserJoined);
      socket.off('user:left', onUserLeft);
    };
  }, []);

  const handleJoin = (nick) => {
    setNickname(nick);
    setJoined(true);
    // 서버는 본인에게는 user:joined를 보내지 않으므로 로컬에서 직접 추가
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