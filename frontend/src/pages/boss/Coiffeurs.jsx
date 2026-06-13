import React, { useState, useEffect } from 'react';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';

export default function BossCoiffeurs() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [coiffeurs, setCoiffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: '', pin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/api/coiffeurs', token).then(setCoiffeurs).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function addCoiffeur(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(form.pin)) return setError('Le PIN doit être 4 chiffres');
    setSaving(true); setError('');
    try {
      const c = await api.post('/api/coiffeurs', form, token);
      setCoiffeurs(prev => [...prev, c]);
      setForm({ nom: '', pin: '' });
      setShowAdd(false);
      toast(`${c.nom} ajouté avec succès`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function toggleActif(c) {
    try {
      const updated = await api.patch(`/api/coiffeurs/${c.id}`, { actif: !c.actif }, token);
      setCoiffeurs(prev => prev.map(x => x.id === c.id ? updated : x));
    } catch (err) { toast(err.message, 'error'); }
  }

  async function deleteCoiffeur(c) {
    if (!confirm(`Supprimer ${c.nom} ?`)) return;
    try {
      await api.delete(`/api/coiffeurs/${c.id}`, token);
      setCoiffeurs(prev => prev.filter(x => x.id !== c.id));
      toast(`${c.nom} supprimé`);
    } catch (err) { toast(err.message, 'error'); }
  }

  const addBtn = (
    <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Ajouter
    </button>
  );

  return (
    <BossLayout title="Coiffeurs" action={addBtn}>
      {loading ? (
        <div className="loading-screen" style={{height:200}}><div className="spinner"/></div>
      ) : coiffeurs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="empty-state-text">Aucun coiffeur. Ajoutez-en un pour commencer.</div>
          <button className="btn btn-primary btn-sm" style={{marginTop:16,width:'auto'}} onClick={() => setShowAdd(true)}>
            Ajouter un coiffeur
          </button>
        </div>
      ) : (
        <div className="card">
          {coiffeurs.map(c => (
            <div key={c.id} className="list-item">
              <div className="list-item-left">
                <div className="list-item-avatar" style={{fontWeight:600,fontSize:14}}>
                  {c.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="list-item-name">{c.nom}</div>
                  <span className={`badge ${c.actif ? 'badge-green' : 'badge-gray'}`}>
                    {c.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <label className="switch">
                  <input type="checkbox" checked={c.actif} onChange={() => toggleActif(c)} />
                  <span className="switch-slider"/>
                </label>
                <button className="btn btn-danger btn-icon" onClick={() => deleteCoiffeur(c)} aria-label="Supprimer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
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
            <div className="modal-title">Nouveau coiffeur</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={addCoiffeur}>
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input className="form-input" placeholder="Ex: Mamadou Koné" value={form.nom}
                  onChange={e => setForm(p => ({...p, nom: e.target.value}))} required />
              </div>
              <div className="form-group" style={{marginBottom:20}}>
                <label className="form-label">Code PIN (4 chiffres)</label>
                <input className="form-input" type="tel" inputMode="numeric" maxLength={4}
                  placeholder="0000" value={form.pin}
                  onChange={e => setForm(p => ({...p, pin: e.target.value.replace(/\D/g,'').slice(0,4)}))}
                  style={{textAlign:'center',fontSize:24,letterSpacing:10}} required />
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
