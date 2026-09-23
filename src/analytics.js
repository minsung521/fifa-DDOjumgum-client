// GA4 연동 — 측정 ID(VITE_GA_MEASUREMENT_ID)가 없거나 개발 모드면 전부 no-op.
// 원칙: 닉네임·메시지 원문 등 개인정보성 데이터는 GA로 절대 보내지 않는다 (EventLog 원칙과 동일).
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const ENABLED = Boolean(MEASUREMENT_ID) && import.meta.env.PROD;

// 홍보 링크 유입 채널(?src=dc / ?src=femco). 없으면 'direct' — 서버 로깅 규칙과 동일
const SRC = new URLSearchParams(window.location.search).get('src') || 'direct';

let initialized = false;

export function initAnalytics() {
  if (!ENABLED || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js는 arguments 객체 자체를 요구함 (배열로 바꾸면 동작 안 함)
    window.dataLayer.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    // 해시 라우팅(#admin) 때문에 page_view는 수동 전송 — 관리자 화면은 집계 제외
    send_page_view: false,
    // ?src= 값을 GA4 기본 획득 보고서(세션 소스)에 바로 반영
    ...(SRC !== 'direct' ? { campaign_source: SRC, campaign_medium: 'community' } : {}),
  });
  window.gtag('set', 'user_properties', { traffic_src: SRC });
}

export function trackPageView() {
  if (!initialized) return;
  window.gtag('event', 'page_view', {
    page_location: window.location.origin + window.location.pathname + window.location.search,
    page_title: document.title,
  });
}

export function trackEvent(name, params = {}) {
  if (!initialized) return;
  window.gtag('event', name, { traffic_src: SRC, ...params });
}
