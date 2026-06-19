import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n||0)) + ' F'; }

export default function BossDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/stats/dashboard', token).then(setStats).catch(console.warn).finally(() => setLoading(false));
  }, [token]);

  const chartData = stats?.graph_semaine ? {
    labels: stats.graph_semaine.map(d => d.date),
    datasets: [{
      data: stats.graph_semaine.map(d => d.total),
      borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.06)',
      fill: true, tension: 0.4, pointBackgroundColor: '#2563EB',
      pointRadius: 3, pointHoverRadius: 5, borderWidth: 2
    }]
  } : null;

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827', titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB', padding: 10, cornerRadius: 8,
        callbacks: { label: ctx => fmt(ctx.raw) }
      }
    },
    scales: {
      x: { ticks: { color: '#9CA3AF', font: { size: 12 } }, grid: { display: false }, border: { display: false } },
      y: {
        ticks: { color: '#9CA3AF', font: { size: 12 }, callback: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v },
        grid: { color: '#F3F4F6' }, border: { display: false }
      }
    }
  };

  if (loading) return (
    <BossLayout title="Tableau de bord">
      <div className="loading-screen" style={{height:300}}><div className="spinner"/></div>
    </BossLayout>
  );

  return (
    <BossLayout title="Tableau de bord" subtitle="Vue d'ensemble de votre salon">

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Recettes aujourd'hui", value: fmt(stats?.revenu_jour), sub: `${stats?.clients_jour||0} client(s)`, accent: true },
          { label: 'Cette semaine', value: fmt(stats?.revenu_semaine), sub: `${stats?.clients_semaine||0} client(s)` },
          { label: 'Ce mois', value: fmt(stats?.revenu_mois), sub: `${stats?.clients_mois||0} client(s)` },
          { label: 'Top coiffeur', value: stats?.top_coiffeur?.nom || '—', sub: fmt(stats?.top_coiffeur?.total) },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.accent ? 'stat-accent' : ''}`} style={{fontSize: i===3?16:undefined}}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Graphique + classement */}
      <div className="dashboard-grid">
        {/* Graphique */}
        {chartData && (
          <div className="card" style={{marginBottom:0}}>
            <div className="card-header">
              <span className="card-title">Revenus — 7 derniers jours</span>
            </div>
            <div className="chart-container">
              <Line data={chartData} options={chartOptions}/>
            </div>
          </div>
        )}

        {/* Classement */}
        {stats?.stats_coiffeurs?.length > 0 && (
          <div className="card" style={{marginBottom:0}}>
            <div className="card-header">
              <span className="card-title">Classement du mois</span>
            </div>
            {stats.stats_coiffeurs.map((c, i) => (
              <div key={c.nom} className="list-item">
                <div className="list-item-left">
                  <div className="list-item-avatar" style={{
                    background: i===0?'#FEF3C7':'var(--bg3)',
                    color: i===0?'#92400E':'var(--text2)',
                    fontWeight: 600, fontSize: 12
                  }}>#{i+1}</div>
                  <div>
                    <div className="list-item-name">{c.nom}</div>
                    <div className="list-item-sub">{c.count} prestation(s)</div>
                  </div>
                </div>
                <div className="list-item-amount">{fmt(c.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!stats?.revenu_mois && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="empty-state-text">Aucune prestation enregistrée. Commencez dès maintenant.</div>
        </div>
      )}
    </BossLayout>
  );
}
