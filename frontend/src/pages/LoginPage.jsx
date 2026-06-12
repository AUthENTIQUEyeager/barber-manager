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
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/api/auth/login-boss', { telephone, password });
      await login(data.token, data.user, data.salon);
      navigate('/boss');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">💈</div>
      <h1 className="auth-title">BarberManager</h1>
      <p className="auth-subtitle">Connexion patron de salon</p>

      <div className="auth-card">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Numéro de téléphone</label>
            <input
              className="form-input"
              type="tel"
              placeholder="Ex: 70000000"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              className="form-input"
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <hr className="divider" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/register" className="btn btn-secondary" style={{ textAlign: 'center' }}>
            ➕ Créer un salon
          </Link>
          <Link to="/coiffeur-login" className="btn btn-secondary" style={{ textAlign: 'center' }}>
            👨‍🔧 Connexion coiffeur
          </Link>
          <Link to="/admin-login" className="btn btn-secondary" style={{ textAlign: 'center', fontSize: 12, opacity: 0.5 }}>
            🔐 Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
