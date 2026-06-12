import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { ToastContainer, useToast } from '../../components/Toast.jsx';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA'; }
function fmtDate(d) { return new Date(d).toLocaleDateString('fr-FR'); }

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/stats', token);
      setStats(data);
      setSalons(data.salons || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  async function toggleSalon(salon) {
    const newStatus = salon.subscription_status === 'active' ? 'suspended' : 'active';
    try {
      const updated = await api.patch(`/api/admin/salons/${salon.id}/status`,
        { subscription_status: newStatus }, token);
      setSalons(prev => prev.map(s => s.id === salon.id ? { ...s, subscription_status: newStatus } : s));
      toast(`${salon.nom} — ${newStatus === 'active' ? 'activé' : 'suspendu'}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function renewSalon(salon) {
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await api.patch(`/api/admin/salons/${salon.id}/status`,
        { subscription_status: 'active', expiration_date: newExpiry }, token);
      setSalons(prev => prev.map(s => s.id === salon.id
        ? { ...s, subscription_status: 'active', expiration_date: newExpiry } : s));
      toast(`Abonnement renouvelé pour ${salon.nom}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const isExpired = (s) => s.expiration_date && new Date(s.expiration_date) < new Date();

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font)' }}>
      <ToastContainer />
      <header style={{ background: 'var(--bg2)', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>👑 Admin BarberManager</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>Dashboard plateforme</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={async () => { await logout(); navigate('/'); }}>
          🚪 Quitter
        </button>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
        {loading ? (
          <div className="loading-screen" style={{ height: 300 }}><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats globales */}
            <div className="admin-grid">
              <div className="stat-card"><div className="stat-label">🏪 Total Salons</div><div className="stat-value">{stats?.total_salons}</div></div>
              <div className="stat-card"><div className="stat-label">✅ Actifs</div><div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.salons_actifs}</div></div>
              <div className="stat-card"><div className="stat-label">🚫 Suspendus</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.salons_suspendus}</div></div>
              <div className="stat-card"><div className="stat-label">⏰ Expirés</div><div className="stat-value" style={{ color: 'var(--gold)' }}>{stats?.salons_expires}</div></div>
            </div>

            {/* Liste salons */}
            <div style={{ marginTop: 8 }}>
              <div className="section-title">Liste des salons</div>
              {salons.map(s => (
                <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{s.nom}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>
                        📞 {s.telephone} · 🔑 {s.salon_code}
                      </div>
                      <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>
                        Créé: {fmtDate(s.created_at)} ·
                        Expire: {s.expiration_date ? fmtDate(s.expiration_date) : '—'}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {isExpired(s)
                          ? <span className="badge badge-gold">⏰ Expiré</span>
                          : s.subscription_status === 'active'
                            ? <span className="badge badge-green">● Actif</span>
                            : <span className="badge badge-red">● Suspendu</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className={`btn btn-sm ${s.subscription_status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleSalon(s)}>
                        {s.subscription_status === 'active' ? '🚫 Suspendre' : '✅ Activer'}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => renewSalon(s)}>
                        🔄 +30j
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
