import { useEffect, useRef, useState } from 'react';

const BOTTOM_THRESHOLD = 48; // px

function formatMessageTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function ChatPanel({ messages, joined, nickname, onJoin, onSend }) {
  const [entering, setEntering] = useState(false); // 인라인 닉네임 입력 노출 여부
  const [nicknameInput, setNicknameInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const listRef = useRef(null);
  const nicknameInputRef = useRef(null);

  useEffect(() => {
    if (entering) nicknameInputRef.current?.focus();
  }, [entering]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (isAtBottom) {
      el.scrollTop = el.scrollHeight;
    } else {
      setNewMessageCount((n) => n + 1);
    }
    // messages 길이 변화에만 반응
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    setIsAtBottom(atBottom);
    if (atBottom) setNewMessageCount(0);
  };

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setIsAtBottom(true);
    setNewMessageCount(0);
  };

  const startEntering = () => {
    if (!joined) setEntering(true);
  };

  const submitJoin = () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) return;
    onJoin(trimmed);
    setEntering(false);
  };

  const submitMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessageInput('');
  };

  return (
    <section className="chat-panel">
      <div className="chat-list" ref={listRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <p className="chat-empty">아직 대화가 없어요. 첫 메시지를 남겨보세요</p>
        )}

        {messages.map((m) =>
          m.system ? (
            <div key={m.id} className="chat-system-message">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="chat-message">
              <span className="chat-message-nickname">{m.nickname}</span>
              <span className="chat-message-text">{m.message}</span>
              <span className="chat-message-time">{formatMessageTime(m.time)}</span>
            </div>
          )
        )}
      </div>

      {!isAtBottom && newMessageCount > 0 && (
        <button className="chat-new-message-badge" onClick={scrollToBottom}>
          새 메시지
        </button>
      )}

      <div className="chat-input-row">
        {!joined && !entering && (
          <input
            className="chat-input"
            placeholder="메시지를 보내려면 입장하세요"
            onFocus={startEntering}
            onClick={startEntering}
            readOnly
          />
        )}

        {!joined && entering && (
          <>
            <input
              ref={nicknameInputRef}
              className="chat-input"
              placeholder="닉네임을 입력하세요"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitJoin()}
            />
            <button className="chat-send-button" onClick={submitJoin}>
              입장
            </button>
          </>
        )}

        {joined && (
          <>
            <input
              className="chat-input"
              placeholder="메시지를 입력하세요"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitMessage()}
            />
            <button className="chat-send-button" onClick={submitMessage}>
              전송
            </button>
          </>
        )}
      </div>
    </section>
  );
}