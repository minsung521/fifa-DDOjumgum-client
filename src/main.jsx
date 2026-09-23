import React, {useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminPage from './AdminPage.jsx';
import './index.css';
import { initAnalytics, trackPageView } from './analytics';

initAnalytics();

// const isAdmin = window.location.hash === '#admin';

function Root() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 공개 화면 진입 시에만 page_view 전송 (관리자 화면 #admin은 집계 제외)
  useEffect(() => {
    if (hash !== '#admin') trackPageView();
  }, [hash]);

  return hash === '#admin' ? <AdminPage /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root/>
  </React.StrictMode>
);