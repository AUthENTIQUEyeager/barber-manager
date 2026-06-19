import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { ToastContainer, useToast } from '../../components/Toast.jsx';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n||0)) + ' F'; }
function fmtDate(d) { return new Date(d).toLocaleDateString('fr-FR'); }
const isExpired = s => s.expiration_date && new Date(s.expiration_date) < new Date();

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/stats', token);
      setStats(data);
      setSalons(data.salons || []);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  async function toggleSalon(salon) {
    const newStatus = salon.subscription_status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/api/admin/salons/${salon.id}/status`, { subscription_status: newStatus }, token);
      setSalons(prev => prev.map(s => s.id === salon.id ? { ...s, subscription_status: newStatus } : s));
      toast(`${salon.nom} — ${newStatus === 'active' ? 'réactivé' : 'suspendu'}`);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function renewSalon(salon) {
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await api.patch(`/api/admin/salons/${salon.id}/status`,
        { subscription_status: 'active', expiration_date: newExpiry }, token);
      setSalons(prev => prev.map(s => s.id === salon.id
        ? { ...s, subscription_status: 'active', expiration_date: newExpiry } : s));
      toast(`Abonnement renouvelé — ${salon.nom}`);
    } catch (err) { toast(err.message, 'error'); }
  }

  const filtered = salons.filter(s => {
    const matchSearch = s.nom.toLowerCase().includes(search.toLowerCase()) ||
      s.salon_code.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? s.subscription_status === 'active' :
      filterStatus === 'suspended' ? s.subscription_status === 'suspended' :
      filterStatus === 'expired' ? isExpired(s) : true;
    return matchSearch && matchStatus;
  });

  // Total encaissé des salons filtrés
  const totalFiltreEncaisse = filtered.reduce((acc, s) => acc + (s.total_encaisse || 0), 0);

  return (
    <div style={{ background: 'var(--bg2)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font)' }}>
      <ToastContainer />

      {/* Header */}
      <header style={{
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        padding: '12px 20px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Administration</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>BarberManager Platform</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {loading ? '...' : 'Actualiser'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={async () => { await logout(); navigate('/'); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Quitter
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div className="loading-screen" style={{ height: 300 }}><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats globales — ligne 1 */}
            <div className="section-title">Vue d'ensemble</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 10 }}>
              <div className="stat-card">
                <div className="stat-label">Total salons</div>
                <div className="stat-value">{stats?.total_salons}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total coiffeurs</div>
                <div className="stat-value">{stats?.total_coiffeurs}</div>
              </div>
            </div>

            {/* Stats globales — ligne 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              <div className="stat-card">
                <div className="stat-label">Actifs</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.salons_actifs}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Suspendus</div>
                <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.salons_suspendus}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Expirés</div>
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats?.salons_expires}</div>
              </div>
            </div>

            {/* Total encaissé global */}
            <div className="card" style={{ marginBottom: 20, background: 'var(--accent-light)', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-label" style={{ color: '#3B82F6' }}>Total encaissé — tous salons</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                    {fmt(stats?.total_encaisse)}
                  </div>
                </div>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'var(--accent)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtres + Recherche */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {[
                ['all', 'Tous'],
                ['active', 'Actifs'],
                ['suspended', 'Suspendus'],
                ['expired', 'Expirés']
              ].map(([val, label]) => (
                <button key={val}
                  className={`btn btn-sm ${filterStatus === val ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterStatus(val)}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', marginBottom: 14 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="form-input" placeholder="Rechercher par nom ou code..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 38 }} />
            </div>

            {/* Résumé filtré */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="section-title" style={{ margin: 0 }}>
                {filtered.length} salon(s)
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
                Total filtré : <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(totalFiltreEncaisse)}</span>
              </div>
            </div>

            {/* Liste salons */}
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className="empty-state-text">Aucun salon trouvé</div>
              </div>
            ) : (
              filtered.map(s => (
                <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                  {/* Header salon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{s.nom}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: 'var(--text2)',
                          background: 'var(--bg3)', padding: '2px 8px', borderRadius: 6
                        }}>
                          {s.salon_code}
                        </span>
                        {isExpired(s)
                          ? <span className="badge badge-amber">Expiré</span>
                          : s.subscription_status === 'active'
                            ? <span className="badge badge-green">Actif</span>
                            : <span className="badge badge-red">Suspendu</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                        {s.telephone} · Créé le {fmtDate(s.created_at)}
                      </div>
                      {s.expiration_date && (
                        <div style={{ fontSize: 12, color: isExpired(s) ? 'var(--danger)' : 'var(--text3)', marginTop: 2 }}>
                          Expire le {fmtDate(s.expiration_date)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className={`btn btn-sm ${s.subscription_status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleSalon(s)}>
                        {s.subscription_status === 'active' ? 'Suspendre' : 'Réactiver'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => renewSalon(s)}>
                        +30 jours
                      </button>
                    </div>
                  </div>

                  {/* Stats du salon */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Coiffeurs</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{s.nb_coiffeurs}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Prestations</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{s.nb_prestations}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Encaissé</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{fmt(s.total_encaisse)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
