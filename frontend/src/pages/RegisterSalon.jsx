import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/client.js';

export default function RegisterSalon() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom_salon: '', telephone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas');
    if (form.password.length < 6) return setError('Mot de passe trop court (min 6 caractères)');
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/api/auth/register-salon', {
        nom_salon: form.nom_salon,
        telephone: form.telephone,
        password: form.password
      });
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
      <h1 className="auth-title">Nouveau Salon</h1>
      <p className="auth-subtitle">Créez votre espace de gestion gratuitement</p>

      <div className="auth-card">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom du salon</label>
            <input className="form-input" placeholder="Ex: Salon Élégance" value={form.nom_salon} onChange={set('nom_salon')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone du patron</label>
            <input className="form-input" type="tel" placeholder="Ex: 70000000" value={form.telephone} onChange={set('telephone')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input className="form-input" type="password" placeholder="Min 6 caractères" value={form.password} onChange={set('password')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <input className="form-input" type="password" placeholder="Retaper le mot de passe" value={form.confirm} onChange={set('confirm')} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Création...' : '✅ Créer le salon'}
          </button>
        </form>
        <hr className="divider" />
        <Link to="/" className="btn btn-secondary">← Déjà un compte</Link>
      </div>
    </div>
  );
}
