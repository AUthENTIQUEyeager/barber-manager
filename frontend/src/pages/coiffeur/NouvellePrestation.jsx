import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { queuePrestation, getCoiffures, cacheCoiffures } from '../../db/indexeddb.js';
import { syncPendingData } from '../../sync/syncManager.js';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(n||0) + ' F'; }

export default function NouvellePrestation() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [coiffures, setCoiffures] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCoiffures().then(cached => { if (cached.length > 0) setCoiffures(cached); });
    if (navigator.onLine && token) {
      api.get('/api/coiffures', token).then(list => { setCoiffures(list); cacheCoiffures(list); }).catch(console.warn);
    }
  }, [token]);

  async function enregistrer() {
    if (!selected) return;
    setLoading(true);
    try {
      await queuePrestation({ coiffure_id: selected.id, coiffeur_id: user.id, prix: selected.prix, note });
      if (navigator.onLine && token) await syncPendingData(token);
      setSuccess(true);
      setTimeout(() => navigate('/coiffeur'), 1800);
    } catch (err) { alert('Erreur: ' + err.message); }
    finally { setLoading(false); }
  }

  if (success) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)',gap:12,padding:20}}>
        <div style={{width:72,height:72,borderRadius:20,background:'var(--success-light)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{fontSize:20,fontWeight:600,color:'var(--text)'}}>Enregistré</div>
        <div style={{fontSize:28,fontWeight:700,color:'var(--accent)'}}>{fmt(selected?.prix)}</div>
        <div style={{fontSize:14,color:'var(--text2)'}}>{selected?.nom}</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/coiffeur')} style={{width:'auto',color:'var(--text2)'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Retour
        </button>
        <div className="app-header-title">Nouvelle coiffure</div>
        <div style={{width:60}}/>
      </header>

      <main className="app-content">
        {coiffures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="empty-state-text">Aucun service disponible. Le patron doit en configurer.</div>
          </div>
        ) : (
          <>
            <div className="section-title">Choisir le service</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
              {coiffures.map(c => (
                <div key={c.id}
                  className={`service-card ${selected?.id === c.id ? 'selected' : ''}`}
                  onClick={() => setSelected(selected?.id === c.id ? null : c)}>
                  <div>
                    <div className="service-card-name">{c.nom}</div>
                    {c.description && <div className="service-card-desc">{c.description}</div>}
                  </div>
                  <div className="service-card-price">{fmt(c.prix)}</div>
                </div>
              ))}
            </div>

            {selected && (
              <>
                <div className="form-group" style={{marginBottom:20}}>
                  <label className="form-label">Note (optionnel)</label>
                  <input className="form-input" placeholder="Remarque particulière..."
                    value={note} onChange={e => setNote(e.target.value)} />
                </div>

                {/* Récapitulatif */}
                <div className="card" style={{marginBottom:14,background:'var(--accent-light)',border:'1px solid #BFDBFE'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:13,color:'#3B82F6',fontWeight:500}}>À enregistrer</div>
                      <div style={{fontSize:16,fontWeight:600,color:'var(--text)',marginTop:2}}>{selected.nom}</div>
                    </div>
                    <div style={{fontSize:24,fontWeight:700,color:'var(--accent)'}}>{fmt(selected.prix)}</div>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={enregistrer} disabled={loading}
                  style={{fontSize:16,padding:'14px'}}>
                  {loading ? 'Enregistrement...' : 'Confirmer'}
                </button>

                {!navigator.onLine && (
                  <p style={{textAlign:'center',color:'var(--text2)',fontSize:12,marginTop:10}}>
                    Hors ligne — sera synchronisé automatiquement
                  </p>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
