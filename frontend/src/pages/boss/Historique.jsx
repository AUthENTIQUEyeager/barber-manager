import React, { useState, useEffect } from 'react';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n||0)) + ' F'; }
function fmtDate(d) { return new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }); }

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
    <BossLayout title="Historique" subtitle="Toutes les prestations enregistrées">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',gap:8}}>
          {[['today',"Aujourd'hui"],['all','Tout voir']].map(([val,label]) => (
            <button key={val} className={`btn btn-sm ${filter===val?'btn-primary':'btn-secondary'}`}
              onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:16}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12,color:'var(--text2)'}}>Total</div>
            <div style={{fontSize:18,fontWeight:700,color:'var(--accent)'}}>{fmt(total)}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12,color:'var(--text2)'}}>Prestations</div>
            <div style={{fontSize:18,fontWeight:700,color:'var(--text)'}}>{filtered.length}</div>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-screen" style={{height:200}}><div className="spinner"/></div>
      : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          </div>
          <div className="empty-state-text">Aucune prestation</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Service</th><th>Coiffeur</th><th>Date</th><th style={{textAlign:'right'}}>Montant</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id||p.local_id}>
                  <td><span style={{fontWeight:500}}>{p.coiffures?.nom||'Service'}</span></td>
                  <td style={{color:'var(--text2)'}}>{p['users!coiffeur_id']?.nom||p.users?.nom||'—'}</td>
                  <td style={{color:'var(--text2)',fontSize:13}}>{fmtDate(p.created_at)}</td>
                  <td style={{textAlign:'right',fontWeight:600,color:'var(--accent)'}}>{fmt(p.prix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BossLayout>
  );
}
