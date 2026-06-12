import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import SyncBadge from './SyncBadge.jsx';
import { ToastContainer } from './Toast.jsx';

export default function BossLayout({ title, children }) {
  const location = useLocation();
  const { salon } = useAuth();
  const active = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="app-layout">
      <ToastContainer />
      <header className="app-header">
        <div>
          <div className="app-header-title">💈 {title}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{salon?.nom}</div>
        </div>
        <SyncBadge />
      </header>

      <main className="app-content">{children}</main>

      <nav className="bottom-nav">
        <Link to="/boss" className={`bottom-nav-item ${active('/boss')}`}>
          <span className="bottom-nav-icon">📊</span>
          <span className="bottom-nav-label">Dashboard</span>
        </Link>
        <Link to="/boss/coiffeurs" className={`bottom-nav-item ${active('/boss/coiffeurs')}`}>
          <span className="bottom-nav-icon">👨‍🔧</span>
          <span className="bottom-nav-label">Coiffeurs</span>
        </Link>
        <Link to="/boss/coiffures" className={`bottom-nav-item ${active('/boss/coiffures')}`}>
          <span className="bottom-nav-icon">✂️</span>
          <span className="bottom-nav-label">Services</span>
        </Link>
        <Link to="/boss/historique" className={`bottom-nav-item ${active('/boss/historique')}`}>
          <span className="bottom-nav-icon">📋</span>
          <span className="bottom-nav-label">Historique</span>
        </Link>
        <Link to="/boss/parametres" className={`bottom-nav-item ${active('/boss/parametres')}`}>
          <span className="bottom-nav-icon">⚙️</span>
          <span className="bottom-nav-label">Paramètres</span>
        </Link>
      </nav>
    </div>
  );
}
