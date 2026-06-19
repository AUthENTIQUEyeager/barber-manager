import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { startAutoSync, stopAutoSync } from '../sync/syncManager.js';
import { api } from '../api/client.js';

const AuthContext = createContext(null);
const LS_KEY = 'bm_session';

function saveToLS(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {} }
function loadFromLS() { try { const d = localStorage.getItem(LS_KEY); return d ? JSON.parse(d) : null; } catch { return null; } }
function clearLS() { try { localStorage.removeItem(LS_KEY); } catch {} }

// Modale d'abonnement suspendu — non fermable
function SuspendedModal({ salonNom }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32,
        maxWidth: 380, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Icone */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: '#FEF2F2', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Accès suspendu
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
          L'abonnement du salon <strong style={{color:'#111827'}}>{salonNom}</strong> est suspendu.
          Veuillez contacter l'administrateur pour renouveler votre abonnement et retrouver l'accès.
        </div>

        {/* Bouton WhatsApp contact */}
        <a
          href="https://wa.me/22665189025?text=Bonjour%2C%20je%20voudrais%20renouveler%20mon%20abonnement%20BarberManager"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#25D366', color: 'white', borderRadius: 8,
            padding: '12px 20px', fontWeight: 600, fontSize: 14,
            textDecoration: 'none', marginBottom: 12
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          Contacter via WhatsApp
        </a>

        <p style={{ fontSize: 12, color: '#9CA3AF' }}>
          Cette fenêtre se fermera automatiquement après réactivation.
        </p>
      </div>
    </div>
  );
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [salon, setSalon] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suspended, setSuspended] = useState(false);

  // Vérifier le statut de l'abonnement périodiquement
  useEffect(() => {
    if (!token || !salon?.id || user?.role === 'admin') return;

    const check = async () => {
      try {
        const data = await api.get('/api/salons/me', token);
        if (data.subscription_status === 'suspended') {
          setSuspended(true);
          // Mettre à jour le salon en cache
          const session = loadFromLS();
          if (session) {
            session.salon = { ...session.salon, subscription_status: 'suspended' };
            saveToLS(session);
          }
        } else {
          setSuspended(false);
        }
      } catch {}
    };

    check();
    const t = setInterval(check, 30000); // vérifier toutes les 30s
    return () => clearInterval(t);
  }, [token, salon?.id]);

  useEffect(() => {
    const session = loadFromLS();
    if (session?.token) {
      setToken(session.token);
      setUser(session.user);
      setSalon(session.salon);
      // Vérifier si déjà suspendu en cache
      if (session.salon?.subscription_status === 'suspended') {
        setSuspended(true);
      }
      startAutoSync(() => session.token);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (token, user, salon) => {
    setToken(token);
    setUser(user);
    setSalon(salon);
    saveToLS({ token, user, salon });
    if (salon?.subscription_status === 'suspended') setSuspended(true);
    else setSuspended(false);
    startAutoSync(() => token);
  }, []);

  const logout = useCallback(async () => {
    stopAutoSync();
    setToken(null);
    setUser(null);
    setSalon(null);
    setSuspended(false);
    clearLS();
  }, []);

  const showSuspended = suspended && user?.role !== 'admin';

  return (
    <AuthContext.Provider value={{ user, salon, token, login, logout, loading }}>
      {children}
      {showSuspended && <SuspendedModal salonNom={salon?.nom} />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
