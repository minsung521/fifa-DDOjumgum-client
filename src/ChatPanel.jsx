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
    <section className="chat-panel" aria-labelledby="chat-title">
      <header className="chat-header">
        <div className="chat-heading">
          <span className="chat-heading-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M20 11.5a8 8 0 0 1-8 8H4v-8a8 8 0 0 1 16 0Z" />
              <path d="M8 10h8M8 14h5" />
            </svg>
          </span>
          <h2 id="chat-title">같이 기다려요</h2>
        </div>
        <span className="chat-header-caption">실시간 채팅</span>
      </header>
      <JoinToastStack toasts={joinToasts} onExpire={onExpireToast} />

      <div className="chat-list" ref={listRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <span className="empty-chat-icon" aria-hidden="true">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M38 22a14 14 0 0 1-14 14H10V22a14 14 0 0 1 28 0Z" />
                <path d="M17 20h14M17 26h9" />
              </svg>
            </span>
            <strong>첫 이야기를 기다리고 있어요</strong>
            <p>아직 대화가 없어요. 첫 메시지를 남겨보세요</p>
          </div>
        )}

        {messages.map((m) =>
          m.system ? (
            <div key={m.id} className="chat-system-message">
              {m.text}
            </div>
          ) : (
            <div
              key={m.id}
              className={`chat-message${joined && m.nickname === nickname ? ' chat-message-own' : ''}`}
            >
              <span className="chat-message-nickname">{m.nickname}</span>
              <span className="chat-message-text">{m.message}</span>
              <span className="chat-message-time">
                {formatMessageTime(m.time)}
              </span>
            </div>
          ),
        )}
      </div>

      {!isAtBottom && newMessageCount > 0 && (
        <button className="chat-new-message-badge" onClick={scrollToBottom}>
          ↓ 새 메시지
        </button>
      )}

      <div className="chat-input-row">
        {!joined && (
          <button
            className="chat-input-trigger"
            onClick={startEntering}
            aria-haspopup="dialog"
          >
            <span>닉네임을 입력하고 대화에 참여하세요</span>
            <span aria-hidden="true">↗</span>
          </button>
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
              aria-label="채팅 메시지"
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
            <span className="section-eyebrow">JOIN THE LOBBY</span>
            <h2 id="nickname-modal-title" className="nickname-modal-title">
              어떤 이름으로 함께할까요?
            </h2>
            <p className="nickname-modal-description">
              대화에 사용할 닉네임을 입력하세요.
            </p>
            <input
              ref={nicknameInputRef}
              className="nickname-modal-input"
              placeholder="예: 민성"
              aria-label="닉네임"
              value={nicknameInput}
              maxLength={16}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitJoin()}
            />
            <div className="nickname-modal-actions">
              <button
                className="nickname-modal-cancel"
                onClick={cancelEntering}
              >
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
