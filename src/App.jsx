import { useEffect, useState } from 'react';
import { socket } from './socket';
import Countdown from './Countdown';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      console.log('소켓 연결됨:', socket.id);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onStatusUpdate(data) {
      setStatus(data);
    }
    function onUsersCount(data) {
      // 서버가 { gameId, count } 형태로 보냄 (기존 number에서 변경됨)
      setUsersCount(data.count);
    }
    function onChatMessage(msg) {
      setMessages((prev) => [...prev, msg]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('status:update', onStatusUpdate);
    socket.on('users:count', onUsersCount);
    socket.on('chat:message', onChatMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('status:update', onStatusUpdate);
      socket.off('users:count', onUsersCount);
      socket.off('chat:message', onChatMessage);
    };
  }, []);

  const handleJoin = () => {
    if (nickname.trim()) setJoined(true);
  };

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    socket.emit('chat:message', { nickname, message: inputMessage });
    setInputMessage('');
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>피파 또 점검이네</h2>
      <p>소켓 연결 상태: {connected ? '🟢 연결됨' : '🔴 끊김'}</p>
      <p>현재 {usersCount}명이 기다리는 중</p>
      <Countdown status={status} />

      {!joined ? (
        <div>
          <input
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button onClick={handleJoin}>입장</button>
        </div>
      ) : (
        <div>
          <div style={{ border: '1px solid #ccc', height: 200, overflowY: 'auto', padding: 8 }}>
            {messages.map((m, i) => (
              <div key={i}>
                <b>[{m.nickname}]</b> {m.message}
              </div>
            ))}
          </div>
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
          />
          <button onClick={handleSend}>전송</button>
        </div>
      )}
    </div>
  );
}

export default App;