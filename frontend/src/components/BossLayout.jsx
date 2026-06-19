import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import SyncBadge from './SyncBadge.jsx';
import { ToastContainer } from './Toast.jsx';

const IC = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  hist: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  serv: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  team: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  sett: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  out: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
};

const NAV = [
  { to: '/boss',            icon: IC.home, label: 'Tableau de bord' },
  { to: '/boss/historique', icon: IC.hist, label: 'Historique' },
  { to: '/boss/coiffures',  icon: IC.serv, label: 'Services' },
  { to: '/boss/coiffeurs',  icon: IC.team, label: 'Coiffeurs' },
  { to: '/boss/parametres', icon: IC.sett, label: 'Paramètres' },
];

export default function BossLayout({ title, subtitle, children, actions }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { salon, user, logout } = useAuth();

  const initiales = user?.nom?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'B';

  async function handleLogout() { await logout(); navigate('/'); }

  return (
    <div className="app-layout">
      <ToastContainer />

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="sidebar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              </svg>
            </div>
            <div>
              <div className="sidebar-logo-name">BarberManager</div>
              <div className="sidebar-logo-sub">{salon?.nom}</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Navigation</div>
          {NAV.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className={`sidebar-item ${location.pathname === to ? 'active' : ''}`}>
              {icon}{label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <SyncBadge />
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initiales}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nom}</div>
              <div className="sidebar-user-role">Patron</div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-icon" title="Déconnexion">
              {IC.out}
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content">
        <header className="page-header">
          <div className="page-header-left">
            <div className="page-title">{title}</div>
            {subtitle && <div className="page-subtitle">{subtitle}</div>}
          </div>
          <div className="page-header-right">
            {actions}
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>

      {/* ── BOTTOM NAV MOBILE ── */}
      <nav className="bottom-nav">
        {NAV.map(({ to, icon, label }) => (
          <Link key={to} to={to}
            className={`bottom-nav-item ${location.pathname === to ? 'active' : ''}`}>
            <span className="bottom-nav-icon">{icon}</span>
            <span className="bottom-nav-label">{label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
