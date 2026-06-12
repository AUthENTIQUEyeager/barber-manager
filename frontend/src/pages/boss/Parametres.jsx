import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';

const WA_NUMBER = '22670000000'; // Remplacer par ton numéro WhatsApp

export default function BossParametres() {
  const { token, salon, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', telephone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (salon) setForm({ nom: salon.nom || '', telephone: salon.telephone || '' });
  }, [salon]);

  async function saveSalon(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/salons/me', form, token);
      toast('Salon mis à jour');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function openWhatsApp() {
    const msg = encodeURIComponent(`Bonjour! Je suis patron du salon "${salon?.nom}" (code: ${salon?.salon_code}). Je voudrais commander un site web.`);
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <BossLayout title="Paramètres">
      {/* Code salon */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div className="stat-label">Code salon (pour vos coiffeurs)</div>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: 'var(--gold)', margin: '10px 0' }}>
          {salon?.salon_code}
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width: 'auto', margin: '0 auto' }}
          onClick={() => { navigator.clipboard?.writeText(salon?.salon_code); toast('Code copié!'); }}>
          📋 Copier
        </button>
      </div>

      {/* Modifier infos salon */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>📝 Informations salon</div>
        <form onSubmit={saveSalon}>
          <div className="form-group">
            <label className="form-label">Nom du salon</label>
            <input className="form-input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input className="form-input" type="tel" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? '...' : '💾 Enregistrer'}
          </button>
        </form>
      </div>

      {/* Module site web */}
      <div className="card" style={{ background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.3)' }}>
        <div style={{ marginBottom: 10 }}>
          <div className="card-title">🌐 Site web pour votre salon</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
            Obtenez un site web professionnel pour votre salon. Vos clients pourront vous trouver en ligne.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openWhatsApp}>
          📱 Demander via WhatsApp
        </button>
      </div>

      {/* Abonnement */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>💳 Abonnement</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text2)', fontSize: 14 }}>Statut</span>
          <span className="badge badge-green">● Actif</span>
        </div>
      </div>

      {/* Déconnexion */}
      <button className="btn btn-danger" onClick={handleLogout} style={{ marginTop: 8 }}>
        🚪 Se déconnecter
      </button>
    </BossLayout>
  );
}
