import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { queuePrestation, getCoiffures, cacheCoiffures } from '../../db/indexeddb.js';
import { syncPendingData } from '../../sync/syncManager.js';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA'; }

export default function NouvellePrestation() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [coiffures, setCoiffures] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // D'abord essayer le cache local
    getCoiffures().then(cached => {
      if (cached.length > 0) setCoiffures(cached);
    });
    // Puis mettre à jour depuis le serveur si en ligne
    if (navigator.onLine && token) {
      api.get('/api/coiffures', token).then(list => {
        setCoiffures(list);
        cacheCoiffures(list);
      }).catch(console.warn);
    }
  }, [token]);

  async function enregistrer() {
    if (!selected) return;
    setLoading(true);
    try {
      const item = await queuePrestation({
        coiffure_id: selected.id,
        coiffeur_id: user.id,
        prix: selected.prix,
        note
      });

      // Tenter sync immédiate si en ligne
      if (navigator.onLine && token) {
        await syncPendingData(token);
      }

      setSuccess(true);
      setTimeout(() => navigate('/coiffeur'), 1500);
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', gap: 16 }}>
        <div style={{ fontSize: 80 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>Enregistré!</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--gold)' }}>{fmt(selected?.prix)}</div>
        <div style={{ color: 'var(--text2)', fontSize: 15 }}>{selected?.nom}</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/coiffeur')} style={{ width: 'auto' }}>
          ← Retour
        </button>
        <div className="app-header-title">✂️ Nouvelle coiffure</div>
        <div style={{ width: 60 }} />
      </header>

      <main className="app-content">
        {coiffures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div>Aucun service disponible. Le patron doit en ajouter.</div>
          </div>
        ) : (
          <>
            <div className="section-title">Choisir le service</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {coiffures.map(c => (
                <button key={c.id}
                  onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  style={{
                    background: selected?.id === c.id ? 'rgba(232,184,75,0.15)' : 'var(--card)',
                    border: `2px solid ${selected?.id === c.id ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s'
                  }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{c.nom}</div>
                    {c.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{c.description}</div>}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: selected?.id === c.id ? 'var(--gold)' : 'var(--text2)', flexShrink: 0, marginLeft: 12 }}>
                    {fmt(c.prix)}
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <>
                <div className="form-group">
                  <label className="form-label">Note (optionnel)</label>
                  <input className="form-input" placeholder="Ex: client fidèle, demande spéciale..."
                    value={note} onChange={e => setNote(e.target.value)} />
                </div>

                <button className="btn btn-primary"
                  onClick={enregistrer}
                  disabled={loading}
                  style={{ fontSize: 18, padding: '18px', borderRadius: 14 }}>
                  {loading ? '⏳ Enregistrement...' : `✅ Enregistrer — ${fmt(selected.prix)}`}
                </button>

                {!navigator.onLine && (
                  <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 12, marginTop: 10 }}>
                    📶 Hors ligne — synchronisation automatique au retour
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
