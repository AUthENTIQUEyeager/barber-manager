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

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/stats', token);
      setStats(data); setSalons(data.salons || []);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  async function toggleSalon(salon) {
    const newStatus = salon.subscription_status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/api/admin/salons/${salon.id}/status`, { subscription_status: newStatus }, token);
      setSalons(prev => prev.map(s => s.id === salon.id ? {...s, subscription_status: newStatus} : s));
      toast(`${salon.nom} — ${newStatus === 'active' ? 'activé' : 'suspendu'}`);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function renewSalon(salon) {
    const newExpiry = new Date(Date.now() + 30*24*60*60*1000).toISOString();
    try {
      await api.patch(`/api/admin/salons/${salon.id}/status`, { subscription_status: 'active', expiration_date: newExpiry }, token);
      setSalons(prev => prev.map(s => s.id === salon.id ? {...s, subscription_status:'active', expiration_date: newExpiry} : s));
      toast(`Abonnement renouvelé — ${salon.nom}`);
    } catch (err) { toast(err.message, 'error'); }
  }

  const filtered = salons.filter(s =>
    s.nom.toLowerCase().includes(search.toLowerCase()) ||
    s.salon_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{background:'var(--bg2)',minHeight:'100vh',color:'var(--text)',fontFamily:'var(--font)'}}>
      <ToastContainer />
      <header style={{background:'var(--bg)',borderBottom:'1px solid var(--border)',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div>
          <div style={{fontSize:16,fontWeight:600}}>Admin — BarberManager</div>
          <div style={{fontSize:12,color:'var(--text2)'}}>Tableau de bord plateforme</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={async () => { await logout(); navigate('/'); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Quitter
        </button>
      </header>

      <div style={{maxWidth:800,margin:'0 auto',padding:'20px 16px'}}>
        {loading ? (
          <div className="loading-screen" style={{height:300}}><div className="spinner"/></div>
        ) : (
          <>
            {/* Stats */}
            <div className="admin-grid">
              <div className="stat-card">
                <div className="stat-label">Total salons</div>
                <div className="stat-value">{stats?.total_salons}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Salons actifs</div>
                <div className="stat-value" style={{color:'var(--success)'}}>{stats?.salons_actifs}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Suspendus</div>
                <div className="stat-value" style={{color:'var(--danger)'}}>{stats?.salons_suspendus}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Expirés</div>
                <div className="stat-value" style={{color:'var(--warning)'}}>{stats?.salons_expires}</div>
              </div>
            </div>

            {/* Recherche */}
            <div style={{position:'relative',marginBottom:14}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="form-input" placeholder="Rechercher un salon..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{paddingLeft:38}} />
            </div>

            {/* Liste salons */}
            <div className="section-title">{filtered.length} salon(s)</div>
            {filtered.map(s => (
              <div key={s.id} className="card" style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                      <span style={{fontSize:15,fontWeight:600}}>{s.nom}</span>
                      <span style={{fontSize:12,fontWeight:600,color:'var(--text2)',background:'var(--bg3)',padding:'2px 8px',borderRadius:6}}>
                        {s.salon_code}
                      </span>
                      {isExpired(s)
                        ? <span className="badge badge-amber">Expiré</span>
                        : s.subscription_status === 'active'
                          ? <span className="badge badge-green">Actif</span>
                          : <span className="badge badge-red">Suspendu</span>}
                    </div>
                    <div style={{fontSize:13,color:'var(--text2)'}}>
                      {s.telephone} · Créé le {fmtDate(s.created_at)}
                    </div>
                    {s.expiration_date && (
                      <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>
                        Expire le {fmtDate(s.expiration_date)}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',gap:8,flexShrink:0}}>
                    <button
                      className={`btn btn-sm ${s.subscription_status==='active'?'btn-danger':'btn-success'}`}
                      onClick={() => toggleSalon(s)}>
                      {s.subscription_status==='active' ? 'Suspendre' : 'Activer'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => renewSalon(s)}>
                      +30j
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
