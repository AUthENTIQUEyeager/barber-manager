import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import SyncBadge from '../../components/SyncBadge.jsx';
import { ToastContainer } from '../../components/Toast.jsx';
import { getAllLocalPrestations, getCoiffures } from '../../db/indexeddb.js';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n||0)) + ' F'; }
function fmtTime(d) {
  return new Date(d).toLocaleString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

export default function CoiffeurDashboard() {
  const { user, salon, token, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [localPrestations, setLocalPrestations] = useState([]);
  const [coiffures, setCoiffures] = useState({});

  useEffect(() => {
    if (navigator.onLine && token) {
      api.get('/api/stats/coiffeur', token).then(setStats).catch(console.warn);
    }
    getAllLocalPrestations().then(setLocalPrestations);
    getCoiffures().then(list => {
      const map = {};
      list.forEach(c => map[c.id] = c);
      setCoiffures(map);
    });
  }, [token]);

  const today = new Date().toDateString();
  const gainJourLocal = localPrestations
    .filter(p => new Date(p.created_at).toDateString() === today)
    .reduce((acc, p) => acc + parseFloat(p.prix||0), 0);
  const clientsJourLocal = localPrestations.filter(p => new Date(p.created_at).toDateString() === today).length;

  const gainJour = stats?.gain_jour ?? gainJourLocal;
  const clientsJour = stats?.clients_jour ?? clientsJourLocal;

  const todayLocal = localPrestations.filter(p => new Date(p.created_at).toDateString() === today);

  const initiales = user?.nom?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'CO';

  return (
    <div className="app-layout">
      <ToastContainer />
      <header className="app-header">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:13,color:'var(--accent)',flexShrink:0}}>
            {initiales}
          </div>
          <div>
            <div className="app-header-title">{user?.nom}</div>
            <div className="app-header-sub">{salon?.nom}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <SyncBadge />
          <button className="btn btn-ghost btn-sm" onClick={async () => { await logout(); navigate('/'); }} aria-label="Déconnexion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      <main className="app-content">
        {/* Stats du jour */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Gain aujourd'hui</div>
            <div className="stat-value stat-accent">{fmt(gainJour)}</div>
            <div className="stat-sub">{clientsJour} client(s)</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cette semaine</div>
            <div className="stat-value">{fmt(stats?.gain_semaine ?? 0)}</div>
            <div className="stat-sub">{stats?.clients_semaine ?? '—'} client(s)</div>
          </div>
        </div>

        {/* Bouton principale */}
        <Link to="/coiffeur/nouvelle"
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            background:'var(--accent)', color:'white', borderRadius:12,
            padding:'16px', marginBottom:20, textDecoration:'none',
            fontWeight:500, fontSize:16, border:'none'
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
          Enregistrer une coiffure
        </Link>

        {/* Prestations du jour */}
        <div className="section-title">Aujourd'hui</div>
        {todayLocal.length === 0 && !stats?.derniers?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/></svg>
            </div>
            <div className="empty-state-text">Aucune prestation aujourd'hui</div>
          </div>
        ) : (
          <div className="card">
            {todayLocal.map(p => (
              <div key={p.local_id} className="list-item">
                <div className="list-item-left">
                  <div className="list-item-avatar" style={{
                    background: p.synced ? 'var(--success-light)' : 'var(--warning-light)',
                    color: p.synced ? '#065F46' : '#92400E'
                  }}>
                    {p.synced
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    }
                  </div>
                  <div>
                    <div className="list-item-name">{coiffures[p.coiffure_id]?.nom || 'Service'}</div>
                    <div className="list-item-sub">{fmtTime(p.created_at)}</div>
                  </div>
                </div>
                <div className="list-item-amount">{fmt(p.prix)}</div>
              </div>
            ))}
            {stats?.derniers?.filter(p => new Date(p.created_at).toDateString() === today).slice(0,10).map(p => (
              <div key={p.id} className="list-item">
                <div className="list-item-left">
                  <div className="list-item-avatar" style={{background:'var(--success-light)',color:'#065F46'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <div className="list-item-name">{p.coiffures?.nom || 'Service'}</div>
                    <div className="list-item-sub">{fmtTime(p.created_at)}</div>
                  </div>
                </div>
                <div className="list-item-amount">{fmt(p.prix)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
