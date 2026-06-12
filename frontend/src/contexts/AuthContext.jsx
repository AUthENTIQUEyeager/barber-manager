import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { saveSession, getSession, clearSession } from '../db/indexeddb.js';
import { startAutoSync, stopAutoSync } from '../sync/syncManager.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [salon, setSalon] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurer session depuis IndexedDB
    getSession().then(session => {
      if (session?.token) {
        setToken(session.token);
        setUser(session.user);
        setSalon(session.salon);
        startAutoSync(() => session.token);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const login = useCallback(async (token, user, salon) => {
    setToken(token);
    setUser(user);
    setSalon(salon);
    await saveSession({ token, user, salon });
    startAutoSync(() => token);
  }, []);

  const logout = useCallback(async () => {
    stopAutoSync();
    setToken(null);
    setUser(null);
    setSalon(null);
    await clearSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, salon, token, login, logout, loading, isOnline: navigator.onLine }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
