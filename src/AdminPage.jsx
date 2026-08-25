import { useEffect, useRef, useState } from 'react';
import { socket, GAME_ID } from './socket';
import './AdminPage.css';

const SERVER_URL = 'https://fifa-ddojumgum-server.onrender.com';
const ADMIN_KEY_STORAGE_KEY = 'ddojumgum_admin_key';
const ADMIN_STATE_POLL_MS = 30000;

const STATE_VALUES = ['online', 'checking', 'scheduled'];

// 상태 배지 등 서술적인 문구용
const BADGE_LABEL = {
  online: { emoji: '🟢', label: '정상 운영 중' },
  checking: { emoji: '🔴', label: '점검 중' },
  scheduled: { emoji: '🟡', label: '점검 예정' },
};

// 상태 변경 버튼용 — 좁은 폭에서도 한 줄에 들어가도록 축약
const BUTTON_LABEL = {
  online: { emoji: '🟢', label: '정상' },
  checking: { emoji: '🔴', label: '점검중' },
  scheduled: { emoji: '🟡', label: '점검예정' },
};

// StatusPanel과 동일한 상태색 토큰(정상=normal) 재사용
const STATE_COLOR_VAR = {
  online: 'var(--status-normal)',
  checking: 'var(--status-checking)',
  scheduled: 'var(--status-scheduled)',
};

function formatDateTime(ms) {
  if (!ms) return null;
  const d = new Date(ms);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const ampm = d.getHours() < 12 ? '오전' : '오후';
  const h = d.getHours() % 12 || 12;
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day} ${ampm} ${h}:${mi}`;
}

function formatShortRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const hm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const sameDay = s.toDateString() === e.toDateString();
  const startLabel = `${s.getMonth() + 1}/${s.getDate()} ${hm(s)}`;
  const endLabel = sameDay ? hm(e) : `${e.getMonth() + 1}/${e.getDate()} ${hm(e)}`;
  return `${startLabel} ~ ${endLabel}`;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || ''
  );
  const [keyInput, setKeyInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');

  const [liveStatus, setLiveStatus] = useState(null); // 소켓으로 받는 { state, endTime }
  const [adminState, setAdminState] = useState(null); // GET /admin/state 응답
  const [adminStateNotice, setAdminStateNotice] = useState(null); // { type, message }

  const [actionMessage, setActionMessage] = useState(null); // { type, text }
  const [submittingState, setSubmittingState] = useState(null); // 클릭된 state 값
  const [submittingEndTime, setSubmittingEndTime] = useState(false);

  const messageTimerRef = useRef(null);
  const hasKey = Boolean(adminKey);

  // 실사용자 화면과 동일한 소켓으로 현재 상태를 실시간 수신 (새 API 없이도 항상 동작)
  useEffect(() => {
    function onStatusUpdate(data) {
      if (data.gameId && data.gameId !== GAME_ID) return;
      setLiveStatus({ state: data.state, endTime: data.endTime });
    }
    socket.on('status:update', onStatusUpdate);
    return () => socket.off('status:update', onStatusUpdate);
  }, []);

  // GET /admin/state — 자동 스케줄 정보. 서버에 아직 없을 수 있어 실패를 부드럽게 처리
  useEffect(() => {
    if (!hasKey) {
      setAdminState(null);
      setAdminStateNotice(null);
      return undefined;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${SERVER_URL}/admin/state`, {
          headers: { 'x-admin-key': adminKey },
        });

        if (res.status === 404) {
          if (!cancelled) {
            setAdminState(null);
            setAdminStateNotice({
              type: 'missing',
              message: '자동 스케줄 조회 API가 아직 서버에 없어요 (스케줄러 작업 반영 대기 중)',
            });
          }
          return;
        }

        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          if (!cancelled) {
            setAdminState(null);
            setAdminStateNotice({
              type: res.status === 401 ? 'auth' : 'error',
              message:
                res.status === 401
                  ? '키가 틀렸습니다'
                  : data?.error || `자동 스케줄 정보를 불러오지 못했습니다 (${res.status})`,
            });
          }
          return;
        }

        if (!cancelled) {
          setAdminState(data);
          setAdminStateNotice(null);
        }
      } catch (err) {
        if (!cancelled) {
          setAdminState(null);
          setAdminStateNotice({ type: 'network', message: `서버 연결 실패: ${err.message}` });
        }
      }
    }

    load();
    const interval = setInterval(load, ADMIN_STATE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [adminKey, hasKey]);

  useEffect(() => () => clearTimeout(messageTimerRef.current), []);

  const showMessage = (type, text) => {
    clearTimeout(messageTimerRef.current);
    setActionMessage({ type, text });
    messageTimerRef.current = setTimeout(
      () => setActionMessage(null),
      type === 'success' ? 2500 : 4000
    );
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    localStorage.setItem(ADMIN_KEY_STORAGE_KEY, trimmed);
    setAdminKey(trimmed);
    setKeyInput('');
  };

  const handleClearKey = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
    setAdminKey('');
    setAdminState(null);
    setAdminStateNotice(null);
    setActionMessage(null);
  };

  const sendStatus = async (state) => {
    if (!adminKey) {
      showMessage('error', 'ADMIN_KEY를 먼저 입력하세요');
      return;
    }

    setSubmittingState(state);

    const body = { state, gameId: GAME_ID };
    if (endTimeInput) {
      const parsed = new Date(endTimeInput).getTime();
      if (!Number.isNaN(parsed)) body.endTime = parsed;
    }

    try {
      const res = await fetch(`${SERVER_URL}/admin/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        showMessage('error', '키가 틀렸습니다. "키 지우기" 후 다시 입력해주세요.');
      } else if (!res.ok) {
        showMessage('error', data?.error || '요청 실패');
      } else {
        const label = BADGE_LABEL[data.status.state]?.label ?? data.status.state;
        showMessage('success', `${label} 상태로 변경했습니다`);
      }
    } catch (err) {
      showMessage('error', `서버 연결 실패: ${err.message}`);
    } finally {
      setSubmittingState(null);
    }
  };

  const currentState = liveStatus?.state ?? adminState?.current?.status?.state ?? null;
  const currentEndTime = liveStatus?.endTime ?? adminState?.current?.status?.endTime ?? null;

  const handleApplyEndTime = async (e) => {
    e.preventDefault();
    if (!endTimeInput) {
      showMessage('error', '종료 시각을 입력하세요');
      return;
    }
    if (!currentState) {
      showMessage('error', '현재 상태를 아직 불러오지 못했어요. 아래 상태 버튼으로 먼저 지정해주세요.');
      return;
    }
    setSubmittingEndTime(true);
    await sendStatus(currentState);
    setSubmittingEndTime(false);
  };

  const scheduler = adminState?.scheduler ?? null;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">관리자 페이지</h1>
        <p className="admin-gameid">gameId: {GAME_ID}</p>
      </header>

      <section className="admin-section">
        <h2 className="admin-section-title">ADMIN_KEY</h2>
        {hasKey ? (
          <div className="admin-key-status">
            <span className="admin-key-badge">🔑 인증키 저장됨</span>
            <button type="button" className="admin-secondary-button" onClick={handleClearKey}>
              키 지우기
            </button>
          </div>
        ) : (
          <form className="admin-inline-form" onSubmit={handleSaveKey}>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="관리자 인증키 입력"
              className="admin-input"
              autoFocus
            />
            <button type="submit" className="admin-primary-button" disabled={!keyInput.trim()}>
              저장
            </button>
          </form>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">현재 상태 &amp; 자동 스케줄</h2>

        <div className="admin-status-row">
          {currentState ? (
            <span
              className="admin-status-chip"
              style={{ '--chip-color': STATE_COLOR_VAR[currentState] }}
            >
              {BADGE_LABEL[currentState].emoji} {BADGE_LABEL[currentState].label}
            </span>
          ) : (
            <span className="admin-status-chip admin-status-chip-loading">상태 확인 중…</span>
          )}
          {currentEndTime && (
            <span className="admin-countdown-target">
              카운트다운 타겟: {formatDateTime(currentEndTime)}
            </span>
          )}
        </div>

        <div className="admin-scheduler-info">
          {scheduler ? (
            <>
              <p
                className={`admin-scheduler-line ${
                  scheduler.manualOverrideActive ? 'is-warning' : 'is-ok'
                }`}
              >
                {scheduler.manualOverrideActive
                  ? '⚠️ 수동 개입됨 — 스케줄러 비활성 (다음 재시작 전까지)'
                  : '자동 스케줄러가 관리 중'}
              </p>
              <p className="admin-scheduler-line">
                {scheduler.configured
                  ? `자동 스케줄 설정됨 (${formatShortRange(
                      scheduler.startAt,
                      scheduler.endAt
                    )}, 완충 ${scheduler.graceMinutes}분)`
                  : '자동 스케줄 미설정'}
              </p>
            </>
          ) : (
            <p className="admin-scheduler-line admin-scheduler-line-muted">
              {adminStateNotice?.message || '자동 스케줄 정보를 불러오는 중…'}
            </p>
          )}
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">상태 변경</h2>
        <div className="admin-action-buttons">
          {STATE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              className={`admin-state-button ${currentState === value ? 'is-active' : ''}`}
              style={{ '--chip-color': STATE_COLOR_VAR[value] }}
              onClick={() => sendStatus(value)}
              disabled={!hasKey || submittingState !== null}
            >
              {submittingState === value
                ? '처리 중…'
                : `${BUTTON_LABEL[value].emoji} ${BUTTON_LABEL[value].label}`}
            </button>
          ))}
        </div>

        {actionMessage && (
          <p className={`admin-action-message admin-action-message-${actionMessage.type}`}>
            {actionMessage.text}
          </p>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">카운트다운 종료 시각 수동 설정</h2>
        <form className="admin-inline-form" onSubmit={handleApplyEndTime}>
          <input
            type="datetime-local"
            value={endTimeInput}
            onChange={(e) => setEndTimeInput(e.target.value)}
            className="admin-input"
          />
          <button
            type="submit"
            className="admin-secondary-button"
            disabled={!hasKey || submittingEndTime}
          >
            {submittingEndTime ? '적용 중…' : '적용'}
          </button>
        </form>
        <p className="admin-hint">
          현재 상태({currentState ? BADGE_LABEL[currentState].label : '알 수 없음'})를 유지한 채
          종료 시각만 갱신합니다.
        </p>
      </section>
    </div>
  );
}
