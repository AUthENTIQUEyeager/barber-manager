import React, { useState, useEffect } from 'react';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';

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

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function addCoiffure(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const c = await api.post('/api/coiffures', form, token);
      setCoiffures(prev => [...prev, c]);
      setForm({ nom: '', prix: '', description: '' });
      setShowAdd(false);
      toast(`Service "${c.nom}" ajouté`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoiffure(c) {
    if (!confirm(`Supprimer "${c.nom}" ?`)) return;
    try {
      await api.delete(`/api/coiffures/${c.id}`, token);
      setCoiffures(prev => prev.filter(x => x.id !== c.id));
      toast(`"${c.nom}" supprimé`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function fmt(n) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  }

  return (
    <BossLayout title="Services">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>{coiffures.length} service(s)</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ajouter</button>
      </div>

      {loading ? <div className="loading-screen" style={{ height: 200 }}><div className="spinner" /></div> : (
        coiffures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✂️</div>
            <div className="empty-state-text">Aucun service. Ajoutez vos coiffures!</div>
          </div>
        ) : (
          <div className="card">
            {coiffures.map(c => (
              <div key={c.id} className="list-item">
                <div className="list-item-left">
                  <div className="list-item-avatar">✂️</div>
                  <div>
                    <div className="list-item-name">{c.nom}</div>
                    {c.description && <div className="list-item-sub">{c.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="list-item-amount">{fmt(c.prix)}</div>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteCoiffure(c)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">✂️ Nouveau Service</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={addCoiffure}>
              <div className="form-group">
                <label className="form-label">Nom du service</label>
                <input className="form-input" placeholder="Ex: Dégradé américain" value={form.nom} onChange={set('nom')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Prix (FCFA)</label>
                <input className="form-input" type="number" placeholder="Ex: 1000" value={form.prix} onChange={set('prix')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optionnel)</label>
                <input className="form-input" placeholder="Courte description" value={form.description} onChange={set('description')} />
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
