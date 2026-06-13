import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/client.js';

export default function LoginCoiffeur() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [salonCode, setSalonCode] = useState('');
  const [salonInfo, setSalonInfo] = useState(null);
  const [coiffeurs, setCoiffeurs] = useState([]);
  const [selectedCoiffeur, setSelectedCoiffeur] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadSalon(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.get(`/api/auth/coiffeurs-list/${salonCode.toUpperCase()}`);
      setSalonInfo(data.salon);
      setCoiffeurs(data.coiffeurs);
      setStep(2);
    } catch { setError('Code salon introuvable'); }
    finally { setLoading(false); }
  }

  function selectCoiffeur(c) {
    setSelectedCoiffeur(c); setPin(''); setStep(3);
  }

  function pressKey(k) {
    if (k === 'del') { setPin(p => p.slice(0,-1)); return; }
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) doLogin(newPin);
  }

  async function doLogin(pinValue) {
    setLoading(true); setError('');
    try {
      const data = await api.post('/api/auth/login-coiffeur', {
        salon_code: salonCode.toUpperCase(), user_id: selectedCoiffeur.id, pin: pinValue
      });
      await login(data.token, data.user, data.salon);
      navigate('/coiffeur');
    } catch { setError('PIN incorrect'); setPin(''); }
    finally { setLoading(false); }
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
      </div>
      <h1 className="auth-title">Espace coiffeur</h1>

      {step === 1 && (
        <div className="auth-card">
          <p style={{fontSize:14,color:'var(--text2)',marginBottom:18}}>Entrez le code de votre salon</p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={loadSalon}>
            <div className="form-group" style={{marginBottom:18}}>
              <label className="form-label">Code salon</label>
              <input className="form-input"
                placeholder="BAR-0000"
                value={salonCode}
                onChange={e => setSalonCode(e.target.value)}
                style={{textTransform:'uppercase', textAlign:'center', fontSize:20, fontWeight:600, letterSpacing:4}}
                required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Recherche...' : 'Continuer'}
            </button>
          </form>
          <hr className="divider" />
          <Link to="/" className="btn btn-secondary">Connexion patron</Link>
        </div>
      )}

      {step === 2 && (
        <div className="auth-card" style={{width:'100%',maxWidth:400}}>
          <div style={{marginBottom:16}}>
            <p style={{fontSize:13,color:'var(--text2)'}}>Salon</p>
            <p style={{fontSize:16,fontWeight:600,color:'var(--text)'}}>{salonInfo?.nom}</p>
          </div>
          <p style={{fontSize:13,color:'var(--text2)',marginBottom:12}}>Choisissez votre nom</p>
          {coiffeurs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{margin:'0 auto 12px'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="empty-state-text">Aucun coiffeur enregistré</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {coiffeurs.map(c => (
                <button key={c.id} className="btn btn-secondary" onClick={() => selectCoiffeur(c)}
                  style={{justifyContent:'flex-start', gap:10, fontSize:15}}>
                  <span style={{width:32,height:32,borderRadius:8,background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)',fontSize:13,fontWeight:600,flexShrink:0}}>
                    {c.nom.charAt(0).toUpperCase()}
                  </span>
                  {c.nom}
                </button>
              ))}
            </div>
          )}
          <hr className="divider" />
          <button className="btn btn-ghost" onClick={() => setStep(1)} style={{color:'var(--text2)'}}>
            Changer de salon
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="auth-card" style={{width:'100%',maxWidth:380}}>
          <div style={{textAlign:'center',marginBottom:4}}>
            <div style={{width:44,height:44,borderRadius:12,background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',fontSize:18,fontWeight:600,color:'var(--accent)'}}>
              {selectedCoiffeur?.nom.charAt(0).toUpperCase()}
            </div>
            <p style={{fontSize:13,color:'var(--text2)'}}>Code PIN pour</p>
            <p style={{fontSize:17,fontWeight:600,color:'var(--text)'}}>{selectedCoiffeur?.nom}</p>
          </div>
          {error && <div className="error-msg" style={{textAlign:'center',marginTop:12}}>{error}</div>}
          <div className="pin-display">
            {[0,1,2,3].map(i => <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />)}
          </div>
          {loading && <p style={{textAlign:'center',fontSize:13,color:'var(--text2)',marginBottom:12}}>Vérification...</p>}
          <div className="pin-pad">
            {KEYS.map((k,i) => {
              if (k === '') return <div key={i} />;
              return (
                <button key={i} className={`pin-btn ${k==='del'?'del':''}`}
                  onClick={() => pressKey(k)} disabled={loading}>
                  {k === 'del' ? '⌫' : k}
                </button>
              );
            })}
          </div>
          <hr className="divider" />
          <button className="btn btn-ghost" onClick={() => {setStep(2);setError('');}} style={{color:'var(--text2)'}}>
            Changer de coiffeur
          </button>
        </div>
      )}
    </div>
  );
}
