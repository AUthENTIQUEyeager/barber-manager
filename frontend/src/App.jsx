import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import RegisterSalon from './pages/RegisterSalon.jsx';
import LoginCoiffeur from './pages/LoginCoiffeur.jsx';
import LoginAdmin from './pages/LoginAdmin.jsx';

import BossDashboard from './pages/boss/Dashboard.jsx';
import BossCoiffeurs from './pages/boss/Coiffeurs.jsx';
import BossCoiffures from './pages/boss/Coiffures.jsx';
import BossParametres from './pages/boss/Parametres.jsx';
import BossHistorique from './pages/boss/Historique.jsx';

import CoiffeurDashboard from './pages/coiffeur/Dashboard.jsx';
import NouvellePrestation from './pages/coiffeur/NouvellePrestation.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={
        user?.role === 'boss' ? <Navigate to="/boss" replace /> :
        user?.role === 'coiffeur' ? <Navigate to="/coiffeur" replace /> :
        user?.role === 'admin' ? <Navigate to="/admin" replace /> :
        <LoginPage />
      } />
      <Route path="/register" element={<RegisterSalon />} />
      <Route path="/coiffeur-login" element={<LoginCoiffeur />} />
      <Route path="/admin-login" element={<LoginAdmin />} />

      {/* Boss routes */}
      <Route path="/boss" element={<ProtectedRoute role="boss"><BossDashboard /></ProtectedRoute>} />
      <Route path="/boss/coiffeurs" element={<ProtectedRoute role="boss"><BossCoiffeurs /></ProtectedRoute>} />
      <Route path="/boss/coiffures" element={<ProtectedRoute role="boss"><BossCoiffures /></ProtectedRoute>} />
      <Route path="/boss/historique" element={<ProtectedRoute role="boss"><BossHistorique /></ProtectedRoute>} />
      <Route path="/boss/parametres" element={<ProtectedRoute role="boss"><BossParametres /></ProtectedRoute>} />

      {/* Coiffeur routes */}
      <Route path="/coiffeur" element={<ProtectedRoute role="coiffeur"><CoiffeurDashboard /></ProtectedRoute>} />
      <Route path="/coiffeur/nouvelle" element={<ProtectedRoute role="coiffeur"><NouvellePrestation /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

      {/* Redirect based on role */}
      <Route path="*" element={
        user?.role === 'boss' ? <Navigate to="/boss" /> :
        user?.role === 'coiffeur' ? <Navigate to="/coiffeur" /> :
        user?.role === 'admin' ? <Navigate to="/admin" /> :
        <Navigate to="/" />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
