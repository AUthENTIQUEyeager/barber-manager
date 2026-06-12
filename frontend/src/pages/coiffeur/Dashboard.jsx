import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import SyncBadge from '../../components/SyncBadge.jsx';
import { ToastContainer } from '../../components/Toast.jsx';
import { getAllLocalPrestations, getCoiffures } from '../../db/indexeddb.js';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA'; }
function fmtDate(d) {
  return new Date(d).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

export default function CoiffeurDashboard() {
  const { user, salon, token, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [localPrestations, setLocalPrestations] = useState([]);
  const [coiffures, setCoiffures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger stats serveur
    if (navigator.onLine && token) {
      api.get('/api/stats/coiffeur', token).then(setStats).catch(console.warn);
    }

    // Charger prestations locales
    getAllLocalPrestations().then(setLocalPrestations);

    // Charger coiffures du cache
    getCoiffures().then(list => {
      const map = {};
      list.forEach(c => map[c.id] = c);
      setCoiffures(map);
    });

    setLoading(false);
  }, [token]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  // Calcul offline si pas de stats serveur
  const today = new Date().toDateString();
  const gainJourLocal = localPrestations
    .filter(p => new Date(p.created_at).toDateString() === today)
    .reduce((acc, p) => acc + parseFloat(p.prix || 0), 0);
  const clientsJourLocal = localPrestations.filter(p => new Date(p.created_at).toDateString() === today).length;

  const gainJour = stats?.gain_jour ?? gainJourLocal;
  const clientsJour = stats?.clients_jour ?? clientsJourLocal;

  return (
    <div className="app-layout">
      <ToastContainer />
      <header className="app-header">
        <div>
          <div className="app-header-title">✂️ {user?.nom}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{salon?.nom}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SyncBadge />
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ padding: '6px 10px' }}>
            🚪
          </button>
        </div>
      </header>

      <main className="app-content">
        {/* Stats du jour */}
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">💰 Gain aujourd'hui</div>
            <div className="stat-value">{fmt(gainJour)}</div>
            <div className="stat-sub">{clientsJour} client(s)</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📅 Cette semaine</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{fmt(stats?.gain_semaine ?? 0)}</div>
            <div className="stat-sub">{stats?.clients_semaine ?? '—'} client(s)</div>
          </div>
        </div>

        {/* Bouton nouvelle prestation — CTA principal */}
        <Link to="/coiffeur/nouvelle" className="btn btn-primary"
          style={{ fontSize: 18, padding: '18px', marginBottom: 20, borderRadius: 14, display: 'flex' }}>
          ✂️ Nouvelle coiffure
        </Link>

        {/* Dernières prestations */}
        <div className="section-title">Aujourd'hui</div>
        {loading ? null : (
          localPrestations.filter(p => new Date(p.created_at).toDateString() === today).length === 0 &&
          (!stats?.derniers?.length) ? (
            <div className="empty-state">
              <div className="empty-state-icon">✂️</div>
              <div>Aucune prestation aujourd'hui</div>
            </div>
          ) : (
            <div className="card">
              {localPrestations
                .filter(p => new Date(p.created_at).toDateString() === today)
                .map(p => (
                  <div key={p.local_id} className="list-item">
                    <div className="list-item-left">
                      <div className="list-item-avatar" style={{ fontSize: 14 }}>
                        {p.synced ? '✅' : '⏳'}
                      </div>
                      <div>
                        <div className="list-item-name">{coiffures[p.coiffure_id]?.nom || 'Service'}</div>
                        <div className="list-item-sub">{fmtDate(p.created_at)}</div>
                      </div>
                    </div>
                    <div className="list-item-amount">{fmt(p.prix)}</div>
                  </div>
                ))}
              {/* Prestations serveur qui ne sont pas en local */}
              {stats?.derniers
                ?.filter(p => new Date(p.created_at).toDateString() === today)
                .slice(0, 10)
                .map(p => (
                  <div key={p.id} className="list-item">
                    <div className="list-item-left">
                      <div className="list-item-avatar">✅</div>
                      <div>
                        <div className="list-item-name">{p.coiffures?.nom || 'Service'}</div>
                        <div className="list-item-sub">{fmtDate(p.created_at)}</div>
                      </div>
                    </div>
                    <div className="list-item-amount">{fmt(p.prix)}</div>
                  </div>
                ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
