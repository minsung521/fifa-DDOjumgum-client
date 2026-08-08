import { useEffect, useState } from 'react';

function formatTime(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const STATE_LABEL = {
  online: { emoji: '🟢', text: '정상 운영' },
  checking: { emoji: '🔴', text: '점검 중' },
  scheduled: { emoji: '🟡', text: '점검 예정' },
};

export default function Countdown({ status }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!status?.endTime) return;

    const tick = () => {
      setRemaining(status.endTime - Date.now());
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status?.endTime]);

  if (!status) return null;

  const label = STATE_LABEL[status.state] || STATE_LABEL.checking;

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <div style={{ fontSize: 20 }}>
        {label.emoji} {label.text}
      </div>
      {status.state !== 'online' && (
        <>
          <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
            {status.state === 'checking' ? '점검 종료까지' : '점검 시작까지'}
          </div>
          <div style={{ fontSize: 48, fontWeight: 'bold', fontFamily: 'monospace' }}>
            {formatTime(remaining)}
          </div>
        </>
      )}
    </div>
  );
}