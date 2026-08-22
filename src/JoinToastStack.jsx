import { useEffect, useState } from 'react';

const VISIBLE_MS = 3600; // 노출 유지 시간
const FADE_MS = 700; // 페이드아웃 전환 시간

function JoinToastItem({ toast, onExpire }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const removeTimer = setTimeout(() => onExpire(toast.id), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, onExpire]);

  return (
    <div className={`join-toast${leaving ? ' join-toast-leaving' : ''}`}>
      {toast.text}
    </div>
  );
}

// 입장 알림 전용 토스트 스택. 채팅 메시지 목록과 완전히 분리된 상태(joinToasts)를
// 그대로 받아서 그리기만 함 — messages 배열에는 절대 관여하지 않음
export default function JoinToastStack({ toasts, onExpire }) {
  if (toasts.length === 0) return null;

  return (
    <div className="join-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <JoinToastItem key={toast.id} toast={toast} onExpire={onExpire} />
      ))}
    </div>
  );
}
