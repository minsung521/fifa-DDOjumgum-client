import './ClosedPage.css';

const RETRO_URL = 'https://sungdotio.bearblog.dev/ddojumgum-retro/';

function ClosedPage() {
  return (
    <div className="closed-shell">
      <main className="closed-card">
        <div className="closed-brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="closed-logo">
            또점검<span className="brand-period">.</span>
          </span>
        </div>
        <h1 className="closed-title">또점검은 운영을 종료했어요</h1>
        <p className="closed-desc">FC 온라인 점검 시간에 열리던 실시간 익명 채팅방이었어요.</p>
        <p className="closed-period">
          <span className="closed-period-label">운영 기간</span>
          <span>2026.08.08 ~ 2026.09.30</span>
        </p>
        <a className="closed-link" href={RETRO_URL} target="_blank" rel="noopener noreferrer">
          왜 접었는지 읽어보기
        </a>
      </main>
    </div>
  );
}

export default ClosedPage;
