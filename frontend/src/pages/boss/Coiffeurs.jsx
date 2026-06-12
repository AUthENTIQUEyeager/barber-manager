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
    if (!/^\d{4}$/.test(form.pin)) return setError('PIN doit être 4 chiffres');
    setSaving(true); setError('');
    try {
      const c = await api.post('/api/coiffeurs', form, token);
      setCoiffeurs(prev => [...prev, c]);
      setForm({ nom: '', pin: '' });
      setShowAdd(false);
      toast(`${c.nom} ajouté avec succès`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActif(c) {
    try {
      const updated = await api.patch(`/api/coiffeurs/${c.id}`, { actif: !c.actif }, token);
      setCoiffeurs(prev => prev.map(x => x.id === c.id ? updated : x));
      toast(`${c.nom} ${updated.actif ? 'activé' : 'désactivé'}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function deleteCoiffeur(c) {
    if (!confirm(`Supprimer ${c.nom} ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/api/coiffeurs/${c.id}`, token);
      setCoiffeurs(prev => prev.filter(x => x.id !== c.id));
      toast(`${c.nom} supprimé`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <BossLayout title="Coiffeurs">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>
          {coiffeurs.length} coiffeur(s)
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ajouter</button>
      </div>

      {loading ? <div className="loading-screen" style={{ height: 200 }}><div className="spinner" /></div> : (
        <>
          {coiffeurs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👨‍🔧</div>
              <div className="empty-state-text">Aucun coiffeur. Ajoutez-en un!</div>
            </div>
          ) : (
            <div className="card">
              {coiffeurs.map(c => (
                <div key={c.id} className="list-item">
                  <div className="list-item-left">
                    <div className="list-item-avatar">💈</div>
                    <div>
                      <div className="list-item-name">{c.nom}</div>
                      <span className={`badge ${c.actif ? 'badge-green' : 'badge-red'}`}>
                        {c.actif ? '● Actif' : '● Inactif'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label className="switch">
                      <input type="checkbox" checked={c.actif} onChange={() => toggleActif(c)} />
                      <span className="switch-slider" />
                    </label>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteCoiffeur(c)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal ajout */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">👨‍🔧 Nouveau Coiffeur</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={addCoiffeur}>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" placeholder="Ex: Mamadou" value={form.nom}
                  onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">PIN (4 chiffres)</label>
                <input className="form-input" type="tel" inputMode="numeric" maxLength={4}
                  placeholder="Ex: 1234" value={form.pin}
                  onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
                  required />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" type="button" onClick={() => setShowAdd(false)}>Annuler</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? '...' : '✅ Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BossLayout>
  );
}
