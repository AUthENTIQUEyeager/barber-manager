import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/client.js';

export default function LoginAdmin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.post('/api/auth/login-admin', { email, password });
      await login(data.token, data.user, null);
      navigate('/admin');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo" style={{background:'var(--text)'}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h1 className="auth-title">Administration</h1>
      <p className="auth-subtitle">Accès restreint aux administrateurs</p>
      <div className="auth-card">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="admin@barber.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group" style={{marginBottom:18}}>
            <label className="form-label">Mot de passe</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Accéder'}
          </button>
        </form>
        <hr className="divider" />
        <Link to="/" className="btn btn-secondary">Retour</Link>
      </div>
    </div>
  );
}
