import { useCallback, useEffect, useRef, useState } from 'react';
import { socket, GAME_ID, SERVER_URL } from './socket';
import './AdminPage.css';

const ADMIN_KEY_STORAGE_KEY = 'ddojumgum_admin_key';
const ADMIN_STATE_POLL_MS = 30000;
const DEFAULT_GRACE_MINUTES = 60;

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

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

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

function formatReservationRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const hm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const dateLabel = (d) => `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY_KO[d.getDay()]})`;
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay
    ? `${dateLabel(s)} ${hm(s)} ~ ${hm(e)}`
    : `${dateLabel(s)} ${hm(s)} ~ ${dateLabel(e)} ${hm(e)}`;
}

// 로딩 상태 없이 성공/실패 인라인 메시지만 다루는 액션 피드백 — 8/23에 만든 것과 동일한 패턴을
// 상태 변경 버튼 / 예약 등록 폼 양쪽에서 각자의 타이머로 재사용
function useActionMessage() {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const show = (type, text) => {
    clearTimeout(timerRef.current);
    setMessage({ type, text });
    timerRef.current = setTimeout(() => setMessage(null), type === 'success' ? 2500 : 4000);
  };

  return [message, show];
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || ''
  );
  const [keyInput, setKeyInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');

  const [reservationStart, setReservationStart] = useState('');
  const [reservationEnd, setReservationEnd] = useState('');
  const [reservationGrace, setReservationGrace] = useState('');

  const [liveStatus, setLiveStatus] = useState(null); // 소켓으로 받는 { state, endTime }
  const [adminState, setAdminState] = useState(null); // GET /admin/state 응답
  const [adminStateNotice, setAdminStateNotice] = useState(null); // { type, message }

  const [actionMessage, showActionMessage] = useActionMessage();
  const [reservationMessage, showReservationMessage] = useActionMessage();

  const [submittingState, setSubmittingState] = useState(null); // 클릭된 state 값
  const [submittingEndTime, setSubmittingEndTime] = useState(false);
  const [submittingReservation, setSubmittingReservation] = useState(false);

  const hasKey = Boolean(adminKey);

  // 실사용자 화면과 동일한 소켓으로 현재 상태를 실시간 수신 (GET /admin/state 없이도 항상 동작)
  useEffect(() => {
    function onStatusUpdate(data) {
      if (data.gameId && data.gameId !== GAME_ID) return;
      setLiveStatus({ state: data.state, endTime: data.endTime });
    }
    socket.on('status:update', onStatusUpdate);
    return () => socket.off('status:update', onStatusUpdate);
  }, []);

  // GET /admin/state — 현재 상태 + 예약 목록. 서버에 아직 없을 수 있어 실패를 부드럽게 처리
  const loadAdminState = useCallback(async () => {
    if (!adminKey) return;

    try {
      const res = await fetch(`${SERVER_URL}/admin/state`, {
        headers: { 'x-admin-key': adminKey },
      });

      if (res.status === 404) {
        setAdminState(null);
        setAdminStateNotice({
          type: 'missing',
          message: '예약/자동 스케줄 조회 API가 아직 서버에 없어요 (서버단 작업 반영 대기 중)',
        });
        return;
      }

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setAdminState(null);
        setAdminStateNotice({
          type: res.status === 401 ? 'auth' : 'error',
          message:
            res.status === 401
              ? '키가 틀렸습니다'
              : data?.error || `상태 정보를 불러오지 못했습니다 (${res.status})`,
        });
        return;
      }

      setAdminState(data);
      setAdminStateNotice(null);
    } catch (err) {
      setAdminState(null);
      setAdminStateNotice({ type: 'network', message: `서버 연결 실패: ${err.message}` });
    }
  }, [adminKey]);

  useEffect(() => {
    if (!hasKey) {
      setAdminState(null);
      setAdminStateNotice(null);
      return undefined;
    }

    loadAdminState();
    const interval = setInterval(loadAdminState, ADMIN_STATE_POLL_MS);
    return () => clearInterval(interval);
  }, [hasKey, loadAdminState]);

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
  };

  const sendStatus = async (state) => {
    if (!adminKey) {
      showActionMessage('error', 'ADMIN_KEY를 먼저 입력하세요');
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
        showActionMessage('error', '키가 틀렸습니다. "키 지우기" 후 다시 입력해주세요.');
      } else if (!res.ok) {
        showActionMessage('error', data?.error || '요청 실패');
      } else {
        const label = BADGE_LABEL[data.status.state]?.label ?? data.status.state;
        showActionMessage('success', `${label} 상태로 변경했습니다`);
      }
    } catch (err) {
      showActionMessage('error', `서버 연결 실패: ${err.message}`);
    } finally {
      setSubmittingState(null);
    }
  };

  const currentState = liveStatus?.state ?? adminState?.currentStatus ?? null;

  const fallbackEndTime =
    currentState === 'checking' && adminState?.activeReservation
      ? new Date(adminState.activeReservation.endAt).getTime()
      : currentState === 'scheduled' && adminState?.upcomingReservations?.[0]
        ? new Date(adminState.upcomingReservations[0].startAt).getTime()
        : null;
  const currentEndTime = liveStatus?.endTime ?? fallbackEndTime;

  const handleApplyEndTime = async (e) => {
    e.preventDefault();
    if (!endTimeInput) {
      showActionMessage('error', '종료 시각을 입력하세요');
      return;
    }
    if (!currentState) {
      showActionMessage('error', '현재 상태를 아직 불러오지 못했어요. 아래 상태 버튼으로 먼저 지정해주세요.');
      return;
    }
    setSubmittingEndTime(true);
    await sendStatus(currentState);
    setSubmittingEndTime(false);
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();

    if (!adminKey) {
      showReservationMessage('error', 'ADMIN_KEY를 먼저 입력하세요');
      return;
    }
    if (!reservationStart || !reservationEnd) {
      showReservationMessage('error', '시작/종료 일시를 입력하세요');
      return;
    }

    const startAt = new Date(reservationStart);
    const endAt = new Date(reservationEnd);
    if (endAt.getTime() <= startAt.getTime()) {
      showReservationMessage('error', '종료 시각은 시작 시각보다 늦어야 합니다');
      return;
    }

    // trim()으로 빈 입력만 걸러내고 숫자 자체는 그대로 씀 — "0"(완충 없이 즉시 복귀)도
    // 유효한 값이라 value/기본값 사이를 falsy(0)로 판단하면 안 됨
    const trimmedGrace = reservationGrace.trim();
    const graceMinutes = trimmedGrace === '' ? DEFAULT_GRACE_MINUTES : Number(trimmedGrace);
    if (Number.isNaN(graceMinutes) || graceMinutes < 0) {
      showReservationMessage('error', '완충 시간은 0 이상의 숫자여야 합니다');
      return;
    }

    setSubmittingReservation(true);

    try {
      const res = await fetch(`${SERVER_URL}/admin/reservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          graceMinutes,
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        showReservationMessage('error', '키가 틀렸습니다. "키 지우기" 후 다시 입력해주세요.');
      } else if (!res.ok) {
        showReservationMessage('error', data?.error || '예약 등록 실패');
      } else {
        showReservationMessage('success', '예약을 등록했습니다');
        setReservationStart('');
        setReservationEnd('');
        setReservationGrace('');
        loadAdminState();
      }
    } catch (err) {
      showReservationMessage('error', `서버 연결 실패: ${err.message}`);
    } finally {
      setSubmittingReservation(false);
    }
  };

  const reservations = [
    ...(adminState?.activeReservation
      ? [{ ...adminState.activeReservation, isActive: true }]
      : []),
    ...(adminState?.upcomingReservations ?? []).map((r) => ({ ...r, isActive: false })),
  ];

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
        <h2 className="admin-section-title">현재 상태</h2>

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
          {adminState ? (
            <p
              className={`admin-scheduler-line ${
                adminState.manualOverrideActive ? 'is-warning' : 'is-ok'
              }`}
            >
              {adminState.manualOverrideActive
                ? '⚠️ 수동 개입됨 — 스케줄러 비활성 (다음 재시작 전까지)'
                : '자동 스케줄러가 관리 중'}
            </p>
          ) : (
            <p className="admin-scheduler-line admin-scheduler-line-muted">
              {adminStateNotice?.message || '상태 정보를 불러오는 중…'}
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

      <section className="admin-section">
        <h2 className="admin-section-title">점검 예약 등록</h2>
        <form className="admin-reservation-form" onSubmit={handleCreateReservation}>
          <label className="admin-field">
            <span className="admin-field-label">시작 일시</span>
            <input
              type="datetime-local"
              value={reservationStart}
              onChange={(e) => setReservationStart(e.target.value)}
              className="admin-input"
            />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">종료 일시</span>
            <input
              type="datetime-local"
              value={reservationEnd}
              onChange={(e) => setReservationEnd(e.target.value)}
              className="admin-input"
            />
          </label>
          <label className="admin-field admin-field-grace">
            <span className="admin-field-label">완충 시간(분)</span>
            <input
              type="number"
              min="0"
              value={reservationGrace}
              onChange={(e) => setReservationGrace(e.target.value)}
              placeholder={String(DEFAULT_GRACE_MINUTES)}
              className="admin-input"
            />
          </label>
          <button
            type="submit"
            className="admin-primary-button admin-reservation-submit"
            disabled={!hasKey || submittingReservation}
          >
            {submittingReservation ? '등록 중…' : '예약 등록'}
          </button>
        </form>

        {reservationMessage && (
          <p
            className={`admin-action-message admin-action-message-${reservationMessage.type}`}
          >
            {reservationMessage.text}
          </p>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">예약 목록</h2>
        {adminState ? (
          reservations.length > 0 ? (
            <ul className="admin-reservation-list">
              {reservations.map((r) => (
                <li
                  key={r.id}
                  className={`admin-reservation-item ${r.isActive ? 'is-active' : ''}`}
                >
                  <span
                    className="admin-reservation-badge"
                    style={{
                      '--chip-color': r.isActive
                        ? STATE_COLOR_VAR.checking
                        : STATE_COLOR_VAR.scheduled,
                    }}
                  >
                    {r.isActive ? '🔴 점검중' : '🟡 점검예정'}
                  </span>
                  <span className="admin-reservation-range">
                    {formatReservationRange(r.startAt, r.endAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty-state">등록된 예약 없음</p>
          )
        ) : (
          <p className="admin-scheduler-line admin-scheduler-line-muted">
            {adminStateNotice?.message || '예약 정보를 불러오는 중…'}
          </p>
        )}
      </section>
    </div>
  );
}
