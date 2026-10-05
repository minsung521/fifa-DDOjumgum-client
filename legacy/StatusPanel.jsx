import { Fragment, useEffect, useState } from 'react';

// 상태색(강조선·배지 배경·글자)은 App.css의 scoreboard-{state} 클래스가 정함
const STATUS_CONFIG = {
  online: { label: '정상 운영 중' },
  checking: { label: '점검 중' },
  scheduled: { label: '점검 예정' },
};

const COUNTDOWN_UNITS = ['HOURS', 'MINUTES', 'SECONDS'];

// [시, 분, 초] 두 자리 문자열 — 숫자와 단위 라벨을 그룹 단위로 묶어 그리기 위해 분리
function splitTime(ms) {
  if (ms <= 0) return ['00', '00', '00'];
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return [h, m, s];
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
  if (connectionState === 'disconnected') return '서버 연결 끊김';
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
      <div
        className={`scoreboard${config ? ` scoreboard-${status.state}` : ''}`}
      >
        <div className="scoreboard-topline">
          <span className="scoreboard-caption">서버 상태</span>
          {config && (
            <span className="status-chip">
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
            <p className="status-online-title">점검 없음</p>
            <p className="status-online-message">
              진행 중이거나 예정된 점검이 없습니다.
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
              {splitTime(remaining).map((value, i) => (
                <Fragment key={COUNTDOWN_UNITS[i]}>
                  {i > 0 && (
                    <span className="countdown-sep" aria-hidden="true">
                      :
                    </span>
                  )}
                  <span className="countdown-group">
                    <span className="countdown-digits">{value}</span>
                    <span className="countdown-unit" aria-hidden="true">
                      {COUNTDOWN_UNITS[i]}
                    </span>
                  </span>
                </Fragment>
              ))}
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
    </aside>
  );
}
