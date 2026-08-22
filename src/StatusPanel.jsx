import { useEffect, useState } from 'react';

const STATUS_CONFIG = {
  online: { color: 'var(--status-normal)', icon: '🟢', label: '정상 운영 중' },
  checking: { color: 'var(--status-checking)', icon: '🔴', label: '점검 중' },
  scheduled: { color: 'var(--status-scheduled)', icon: '🟡', label: '점검 예정' },
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
    endTime ? endTime - Date.now() : 0
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

  if (!status || !config) {
    return (
      <aside className="status-panel">
        <div className="status-card">
          <p className="status-loading">상태 정보를 불러오는 중…</p>
        </div>
      </aside>
    );
  }

  const isOnline = status.state === 'online';
  const countdownLabel = status.state === 'checking' ? '종료까지' : '시작까지';

  return (
    <aside className="status-panel">
      {/* 데스크톱: 통합 카드 (핵심 정보 클러스터) */}
      <div className="status-card">
        <span
          className="status-chip"
          style={{ '--chip-color': config.color }}
        >
          <span className="status-chip-icon" aria-hidden="true">{config.icon}</span>
          <span className="status-chip-text">
            {config.label}
            {!isOnline && <> · {countdownLabel}</>}
          </span>
        </span>

        {isOnline ? (
          <p className="status-online-message">지금은 서버가 정상 운영 중이에요</p>
        ) : (
          <div className="status-countdown">{formatTime(remaining)}</div>
        )}

        <p className="status-users-sentence">
          {isOnline ? (
            <>지금 <strong>{usersCount}</strong>명이 함께 있어요</>
          ) : (
            <>지금 <strong>{usersCount}</strong>명이 함께 기다리는 중</>
          )}
        </p>

        {connMsg && <p className="status-connection">{connMsg}</p>}
      </div>

      {/* 모바일: 압축 상단 바 */}
      <div className="status-compact">
        <span
          className="status-chip status-chip-compact"
          style={{ '--chip-color': config.color }}
        >
          <span className="status-chip-icon" aria-hidden="true">{config.icon}</span>
          <span className="status-chip-text">{config.label}</span>
        </span>
        {!isOnline ? (
          <span className="status-compact-text">{formatTime(remaining)}</span>
        ) : null}
        <span className="status-compact-users">
          <strong>{usersCount}</strong>명
        </span>
        {connMsg && <span className="status-connection-compact">{connMsg}</span>}
      </div>
    </aside>
  );
}