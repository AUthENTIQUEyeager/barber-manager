import React, { useState, useEffect } from 'react';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' F'; }

export default function BossCoiffures() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [coiffures, setCoiffures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: '', prix: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/api/coiffures', token).then(setCoiffures).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const set = k => e => setForm(p => ({...p, [k]: e.target.value}));

  async function addCoiffure(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const c = await api.post('/api/coiffures', form, token);
      setCoiffures(prev => [...prev, c]);
      setForm({ nom: '', prix: '', description: '' });
      setShowAdd(false);
      toast(`"${c.nom}" ajouté`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function deleteCoiffure(c) {
    if (!confirm(`Supprimer "${c.nom}" ?`)) return;
    try {
      await api.delete(`/api/coiffures/${c.id}`, token);
      setCoiffures(prev => prev.filter(x => x.id !== c.id));
      toast(`"${c.nom}" supprimé`);
    } catch (err) { toast(err.message, 'error'); }
  }

  const addBtn = (
    <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Ajouter
    </button>
  );

  return (
    <BossLayout title="Services" action={addBtn}>
      {loading ? (
        <div className="loading-screen" style={{height:200}}><div className="spinner"/></div>
      ) : coiffures.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/></svg>
          </div>
          <div className="empty-state-text">Aucun service configuré. Ajoutez vos prestations.</div>
          <button className="btn btn-primary btn-sm" style={{marginTop:16,width:'auto'}} onClick={() => setShowAdd(true)}>
            Ajouter un service
          </button>
        </div>
      ) : (
        <div className="card">
          {coiffures.map(c => (
            <div key={c.id} className="list-item">
              <div className="list-item-left">
                <div className="list-item-avatar gray">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/></svg>
                </div>
                <div>
                  <div className="list-item-name">{c.nom}</div>
                  {c.description && <div className="list-item-sub">{c.description}</div>}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div className="list-item-amount">{fmt(c.prix)}</div>
                <button className="btn btn-danger btn-icon" onClick={() => deleteCoiffure(c)} aria-label="Supprimer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">Nouveau service</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={addCoiffure}>
              <div className="form-group">
                <label className="form-label">Nom du service</label>
                <input className="form-input" placeholder="Ex: Dégradé américain" value={form.nom} onChange={set('nom')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Prix (FCFA)</label>
                <input className="form-input" type="number" placeholder="1000" value={form.prix} onChange={set('prix')} required />
              </div>
              <div className="form-group" style={{marginBottom:20}}>
                <label className="form-label">Description (optionnel)</label>
                <input className="form-input" placeholder="Courte description" value={form.description} onChange={set('description')} />
              </div>
              <div style={{display:'flex',gap:10}}>
                <button className="btn btn-secondary" type="button" onClick={() => setShowAdd(false)}>Annuler</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BossLayout>
  );
}
