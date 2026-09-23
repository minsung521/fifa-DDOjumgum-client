import { useEffect, useState } from 'react';

const STATUS_CONFIG = {
  online: { color: 'var(--status-normal)', label: '정상 운영 중' },
  checking: { color: 'var(--status-checking)', label: '점검 중' },
  scheduled: { color: 'var(--status-scheduled)', label: '점검 예정' },
};

function formatTime(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function useRemaining(endTime) {
  const [remaining, setRemaining] = useState(
    endTime ? endTime - Date.now() : 0,
  );

  useEffect(() => {
    if (!endTime) return;
    const tick = () => setRemaining(endTime - Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return remaining;
}

// connected가 아닐 때만 보여줄 짧은 문구
function connectionLabel(connectionState) {
  if (connectionState === 'reconnecting') return '재연결 시도 중…';
  if (connectionState === 'disconnected') return '서버와 연결이 끊겼어요';
  return null;
}

export default function StatusPanel({ status, usersCount, connectionState }) {
  const remaining = useRemaining(status?.endTime);
  const config = status ? STATUS_CONFIG[status.state] : null;
  const connMsg = connectionLabel(connectionState);

  const isOnline = status?.state === 'online';
  const countdownLabel =
    status?.state === 'checking' ? '점검 종료까지' : '점검 시작까지';

  return (
    <aside className="status-panel" aria-label="FC 온라인 서버 상태">
      <div className="status-heading">
        <span className="section-eyebrow">MATCH LOBBY</span>
        <span className="status-game">FC 온라인</span>
      </div>

      <div className="scoreboard">
        <div className="scoreboard-topline">
          <span className="scoreboard-caption">SERVER STATUS</span>
          {config && (
            <span
              className="status-chip"
              style={{ '--chip-color': config.color }}
            >
              <span className="status-dot" aria-hidden="true" />
              {config.label}
            </span>
          )}
        </div>

        {!config ? (
          <div className="status-loading" role="status">
            <span className="loading-dash" aria-hidden="true">
              — : — : —
            </span>
            상태 정보를 불러오는 중…
          </div>
        ) : isOnline ? (
          <div className="status-online">
            <p className="status-online-title">
              지금, 킥오프<span>.</span>
            </p>
            <p className="status-online-message">
              지금은 서버가 정상 운영 중이에요
            </p>
          </div>
        ) : (
          <div className="countdown-block">
            <p className="countdown-label">{countdownLabel}</p>
            <div
              className="status-countdown"
              role="timer"
              aria-label={countdownLabel}
            >
              {formatTime(remaining)}
            </div>
            <div className="countdown-units" aria-hidden="true">
              <span>HOURS</span>
              <span>MINUTES</span>
              <span>SECONDS</span>
            </div>
          </div>
        )}

        <div className="status-audience">
          <span className="audience-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" />
            </svg>
          </span>
          <p className="status-users-sentence">
            지금 <strong>{usersCount}</strong>명
            <span>{isOnline ? '이 함께 있어요' : '이 함께 기다리는 중'}</span>
          </p>
        </div>
        {connMsg && (
          <p className="status-connection" role="status">
            {connMsg}
          </p>
        )}
      </div>

      <div className="lobby-note">
        <span className="lobby-note-rule" aria-hidden="true" />
        <p>
          경기는 잠시 멈춰도,
          <br />
          우리의 이야기는 계속.
        </p>
        <span className="lobby-note-label">THE WAITING ROOM</span>
      </div>
    </aside>
  );
}
