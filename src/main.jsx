import React from 'react';
import ReactDOM from 'react-dom/client';
import ClosedPage from './ClosedPage.jsx';
import './index.css';
import { initAnalytics, trackPageView } from './analytics';

// 운영 종료 — 모든 경로(/#admin 포함)에서 종료 안내만 노출. 이전 화면은 legacy/ 참고
initAnalytics();
trackPageView();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClosedPage />
  </React.StrictMode>
);
