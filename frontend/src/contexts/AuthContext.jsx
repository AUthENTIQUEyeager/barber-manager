import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { startAutoSync, stopAutoSync } from '../sync/syncManager.js';

const AuthContext = createContext(null);

const LS_KEY = 'bm_session';

function saveToLS(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}
function loadFromLS() {
  try { const d = localStorage.getItem(LS_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}
function clearLS() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [salon, setSalon] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurer depuis localStorage (persiste même si cache vidé)
    const session = loadFromLS();
    if (session?.token) {
      setToken(session.token);
      setUser(session.user);
      setSalon(session.salon);
      startAutoSync(() => session.token);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (token, user, salon) => {
    setToken(token);
    setUser(user);
    setSalon(salon);
    saveToLS({ token, user, salon });
    startAutoSync(() => token);
  }, []);

  const logout = useCallback(async () => {
    stopAutoSync();
    setToken(null);
    setUser(null);
    setSalon(null);
    clearLS();
  }, []);

  return (
    <AuthContext.Provider value={{ user, salon, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
