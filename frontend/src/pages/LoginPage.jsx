import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/client.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.post('/api/auth/login-boss', { telephone, password });
      await login(data.token, data.user, data.salon);
      navigate('/boss');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12M6 21h12M12 3v4M12 21v-4M4 7l4 2M16 15l4 2M4 17l4-2M16 9l4-2M8 9l-2-2M18 9l-2 2M8 15l-2 2M18 15l2-2"/>
        </svg>
      </div>
      <h1 className="auth-title">BarberManager</h1>
      <p className="auth-subtitle">Connexion patron de salon</p>

      <div className="auth-card">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input className="form-input" type="tel" placeholder="70 00 00 00"
              value={telephone} onChange={e => setTelephone(e.target.value)} required />
          </div>
          <div className="form-group" style={{marginBottom: 18}}>
            <label className="form-label">Mot de passe</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <hr className="divider" />

        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          <Link to="/register" className="btn btn-secondary">Créer un salon</Link>
          <Link to="/coiffeur-login" className="btn btn-secondary">Espace coiffeur</Link>
          
        </div>
      </div>
    </div>
  );
}
