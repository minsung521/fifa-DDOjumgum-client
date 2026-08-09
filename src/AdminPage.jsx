import { useState } from 'react';

const SERVER_URL = 'https://fifa-ddojumgum-server.onrender.com';
const GAME_ID = 'fc-online';

const STATE_OPTIONS = [
  { value: 'online', emoji: '🟢', label: '정상 운영' },
  { value: 'checking', emoji: '🔴', label: '점검 중' },
  { value: 'scheduled', emoji: '🟡', label: '점검 예정' },
];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendStatus = async (state) => {
    if (!adminKey) {
      setResult({ ok: false, message: 'ADMIN_KEY를 먼저 입력하세요' });
      return;
    }

    setLoading(true);
    setResult(null);

    const body = { state, gameId: GAME_ID };
    if (endTimeInput) {
      const parsed = new Date(endTimeInput).getTime();
      if (!Number.isNaN(parsed)) {
        body.endTime = parsed;
      }
    }

    try {
      const res = await fetch(`${SERVER_URL}/admin/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error || '요청 실패' });
      } else {
        setResult({ ok: true, message: `상태 변경 완료: ${data.status.state}` });
      }
    } catch (err) {
      setResult({ ok: false, message: `네트워크 오류: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 400 }}>
      <h2>관리자 페이지</h2>
      <p style={{ fontSize: 13, color: '#888' }}>gameId: {GAME_ID}</p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>ADMIN_KEY</label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="관리자 인증키 입력"
          style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>
          카운트다운 종료 시각 (선택, 비우면 기존 값 유지)
        </label>
        <input
          type="datetime-local"
          value={endTimeInput}
          onChange={(e) => setEndTimeInput(e.target.value)}
          style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {STATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => sendStatus(opt.value)}
            disabled={loading}
            style={{ flex: 1, padding: 10, cursor: 'pointer' }}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>

      {result && (
        <p style={{ color: result.ok ? 'green' : 'crimson' }}>{result.message}</p>
      )}
    </div>
  );
}