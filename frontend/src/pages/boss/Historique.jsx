import React, { useState, useEffect } from 'react';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n||0)) + ' F'; }
function fmtDate(d) {
  return new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

export default function BossHistorique() {
  const { token } = useAuth();
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');

  useEffect(() => {
    api.get('/api/prestations?limit=200', token).then(setPrestations).finally(() => setLoading(false));
  }, [token]);

  const today = new Date().toDateString();
  const filtered = filter === 'today'
    ? prestations.filter(p => new Date(p.created_at).toDateString() === today)
    : prestations;

  const total = filtered.reduce((acc, p) => acc + parseFloat(p.prix), 0);

  return (
    <BossLayout title="Historique">
      {/* Filtres */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[['today','Aujourd\'hui'],['all','Tout']].map(([val,label]) => (
          <button key={val}
            className={`btn btn-sm ${filter===val?'btn-primary':'btn-secondary'}`}
            onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Résumé */}
      <div className="stats-grid" style={{marginBottom:14}}>
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value stat-accent">{fmt(total)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prestations</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{height:200}}><div className="spinner"/></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          </div>
          <div className="empty-state-text">Aucune prestation</div>
        </div>
      ) : (
        <div className="card">
          {filtered.map(p => (
            <div key={p.id || p.local_id} className="list-item">
              <div className="list-item-left">
                <div className="list-item-avatar gray">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/></svg>
                </div>
                <div>
                  <div className="list-item-name">{p.coiffures?.nom || 'Service'}</div>
                  <div className="list-item-sub">
                    {p['users!coiffeur_id']?.nom || p.users?.nom || '—'} · {fmtDate(p.created_at)}
                  </div>
                </div>
              </div>
              <div className="list-item-amount">{fmt(p.prix)}</div>
            </div>
          ))}
        </div>
      )}
    </BossLayout>
  );
}
