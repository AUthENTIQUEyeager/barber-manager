import React, { useState, useEffect } from 'react';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA'; }
function fmtDate(d) {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function BossHistorique() {
  const { token } = useAuth();
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | today

  useEffect(() => {
    api.get('/api/prestations?limit=100', token)
      .then(setPrestations)
      .finally(() => setLoading(false));
  }, [token]);

  const today = new Date().toDateString();
  const filtered = filter === 'today'
    ? prestations.filter(p => new Date(p.created_at).toDateString() === today)
    : prestations;

  const total = filtered.reduce((acc, p) => acc + parseFloat(p.prix), 0);

  return (
    <BossLayout title="Historique">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}>Tout</button>
        <button className={`btn btn-sm ${filter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('today')}>Aujourd'hui</button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="stat-label">Total affiché</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{fmt(total)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-label">Prestations</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{filtered.length}</div>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-screen" style={{ height: 200 }}><div className="spinner" /></div> : (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div>Aucune prestation</div>
          </div>
        ) : (
          <div className="card">
            {filtered.map(p => (
              <div key={p.id || p.local_id} className="list-item">
                <div className="list-item-left">
                  <div className="list-item-avatar">✂️</div>
                  <div>
                    <div className="list-item-name">{p.coiffures?.nom || 'Service'}</div>
                    <div className="list-item-sub">
                      {p.users?.nom || p['users!coiffeur_id']?.nom || '—'} · {fmtDate(p.created_at)}
                    </div>
                  </div>
                </div>
                <div className="list-item-amount">{fmt(p.prix)}</div>
              </div>
            ))}
          </div>
        )
      )}
    </BossLayout>
  );
}
