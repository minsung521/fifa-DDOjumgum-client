import { useEffect, useRef, useState } from 'react';
import JoinToastStack from './JoinToastStack';

const BOTTOM_THRESHOLD = 48; // px

function formatMessageTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function ChatPanel({
  messages,
  joined,
  nickname,
  onJoin,
  onSend,
  joinToasts,
  onExpireToast,
}) {
  const [entering, setEntering] = useState(false); // 닉네임 입력 오버레이(모달/바텀시트) 노출 여부
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

  const cancelEntering = () => {
    setEntering(false);
    setNicknameInput('');
  };

  const submitJoin = () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) return;
    onJoin(trimmed);
    setEntering(false);
    setNicknameInput('');
  };

  const submitMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessageInput('');
  };

  return (
    <section className="chat-panel">
      <JoinToastStack toasts={joinToasts} onExpire={onExpireToast} />

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
        {!joined && (
          <input
            className="chat-input chat-input-trigger"
            placeholder="닉네임을 입력하고 대화에 참여하세요"
            onFocus={startEntering}
            onClick={startEntering}
            readOnly
            aria-haspopup="dialog"
          />
        )}

        {joined && (
          <>
            <span className="nickname-chip">
              <span className="nickname-chip-name">{nickname}</span>
              <span className="nickname-chip-suffix">님으로 참여 중</span>
            </span>
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

      {!joined && entering && (
        <div
          className="nickname-overlay"
          onClick={cancelEntering}
          onKeyDown={(e) => e.key === 'Escape' && cancelEntering()}
          role="presentation"
        >
          <div
            className="nickname-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nickname-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="nickname-modal-title" className="nickname-modal-title">닉네임을 입력하세요</h2>
            <input
              ref={nicknameInputRef}
              className="nickname-modal-input"
              placeholder="예: 민성"
              value={nicknameInput}
              maxLength={16}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitJoin()}
            />
            <div className="nickname-modal-actions">
              <button className="nickname-modal-cancel" onClick={cancelEntering}>
                취소
              </button>
              <button
                className="nickname-modal-submit"
                onClick={submitJoin}
                disabled={!nicknameInput.trim()}
              >
                입장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}