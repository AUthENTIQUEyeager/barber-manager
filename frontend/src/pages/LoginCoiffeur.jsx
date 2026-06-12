import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/client.js';

export default function LoginCoiffeur() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: code salon, 2: choix coiffeur, 3: PIN
  const [salonCode, setSalonCode] = useState('');
  const [salonInfo, setSalonInfo] = useState(null);
  const [coiffeurs, setCoiffeurs] = useState([]);
  const [selectedCoiffeur, setSelectedCoiffeur] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadSalon(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/api/auth/coiffeurs-list/${salonCode.toUpperCase()}`);
      setSalonInfo(data.salon);
      setCoiffeurs(data.coiffeurs);
      setStep(2);
    } catch (err) {
      setError('Code salon incorrect');
    } finally {
      setLoading(false);
    }
  }

  function selectCoiffeur(c) {
    setSelectedCoiffeur(c);
    setPin('');
    setStep(3);
  }

  function pressKey(k) {
    if (k === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) doLogin(newPin);
  }

  async function doLogin(pinValue) {
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/api/auth/login-coiffeur', {
        salon_code: salonCode.toUpperCase(),
        user_id: selectedCoiffeur.id,
        pin: pinValue
      });
      await login(data.token, data.user, data.salon);
      navigate('/coiffeur');
    } catch (err) {
      setError('PIN incorrect');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div className="auth-page">
      <div className="auth-logo">✂️</div>
      <h1 className="auth-title">Espace Coiffeur</h1>

      {step === 1 && (
        <div className="auth-card">
          <p className="auth-subtitle" style={{ marginBottom: 20, textAlign: 'left' }}>
            Entrez le code de votre salon
          </p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={loadSalon}>
            <div className="form-group">
              <label className="form-label">Code Salon</label>
              <input
                className="form-input"
                placeholder="Ex: BAR-4821"
                value={salonCode}
                onChange={e => setSalonCode(e.target.value)}
                style={{ textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center', fontSize: 22, fontWeight: 700 }}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '...' : 'Continuer →'}
            </button>
          </form>
          <hr className="divider" />
          <Link to="/" className="btn btn-secondary">← Patron</Link>
        </div>
      )}

      {step === 2 && (
        <div className="auth-card" style={{ width: '100%', maxWidth: 400 }}>
          <p style={{ color: 'var(--text2)', marginBottom: 16, fontSize: 14 }}>
            {salonInfo?.nom} — Choisissez votre nom
          </p>
          {coiffeurs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">😕</div>
              <div>Aucun coiffeur enregistré</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {coiffeurs.map(c => (
                <button key={c.id} className="btn btn-secondary" onClick={() => selectCoiffeur(c)}
                  style={{ justifyContent: 'flex-start', gap: 12, fontSize: 16 }}>
                  <span style={{ fontSize: 24 }}>👨‍🔧</span> {c.nom}
                </button>
              ))}
            </div>
          )}
          <hr className="divider" />
          <button className="btn btn-secondary" onClick={() => setStep(1)}>← Changer de salon</button>
        </div>
      )}

      {step === 3 && (
        <div className="auth-card" style={{ width: '100%', maxWidth: 380 }}>
          <p style={{ textAlign: 'center', color: 'var(--text2)', marginBottom: 4 }}>PIN pour</p>
          <p style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selectedCoiffeur?.nom}</p>

          {error && <div className="error-msg" style={{ textAlign: 'center' }}>{error}</div>}

          <div className="pin-display">
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
            ))}
          </div>

          {loading && <div style={{ textAlign: 'center', color: 'var(--gold)', marginBottom: 10 }}>Vérification...</div>}

          <div className="pin-pad">
            {KEYS.map((k, i) => {
              if (k === '') return <div key={i} />;
              return (
                <button key={i}
                  className={`pin-btn ${k === 'del' ? 'danger' : ''}`}
                  onClick={() => pressKey(k)}
                  disabled={loading}>
                  {k === 'del' ? '⌫' : k}
                </button>
              );
            })}
          </div>

          <hr className="divider" />
          <button className="btn btn-secondary" onClick={() => { setStep(2); setError(''); }}>← Changer</button>
        </div>
      )}
    </div>
  );
}
