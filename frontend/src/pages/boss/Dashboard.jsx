import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

function fmt(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA';
}

export default function BossDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/stats/dashboard', token)
      .then(setStats)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [token]);

  const chartData = stats?.graph_semaine ? {
    labels: stats.graph_semaine.map(d => d.date),
    datasets: [{
      data: stats.graph_semaine.map(d => d.total),
      borderColor: '#e8b84b',
      backgroundColor: 'rgba(232,184,75,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#e8b84b',
      pointRadius: 4
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: {
      label: (ctx) => fmt(ctx.raw)
    }}},
    scales: {
      x: { ticks: { color: '#a0a0c0', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#a0a0c0', font: { size: 10 }, callback: v => v >= 1000 ? (v/1000)+'k' : v }, grid: { color: '#2a2a4a' } }
    }
  };

  if (loading) return (
    <BossLayout title="Dashboard">
      <div className="loading-screen" style={{ height: 300 }}><div className="spinner" /></div>
    </BossLayout>
  );

  return (
    <BossLayout title="Dashboard">
      {/* Stats du jour */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">💰 Aujourd'hui</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{fmt(stats?.revenu_jour)}</div>
          <div className="stat-sub">{stats?.clients_jour || 0} client(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📅 Cette semaine</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{fmt(stats?.revenu_semaine)}</div>
          <div className="stat-sub">{stats?.clients_semaine || 0} client(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📆 Ce mois</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{fmt(stats?.revenu_mois)}</div>
          <div className="stat-sub">{stats?.clients_mois || 0} client(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🏆 Top coiffeur</div>
          <div className="stat-value" style={{ fontSize: 15, paddingTop: 4 }}>{stats?.top_coiffeur?.nom || '—'}</div>
          <div className="stat-sub">{fmt(stats?.top_coiffeur?.total)}</div>
        </div>
      </div>

      {/* Graphique */}
      {chartData && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>📈 Revenus 7 jours</div>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Classement coiffeurs */}
      {stats?.stats_coiffeurs?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">👨‍🔧 Classement du mois</div>
          </div>
          {stats.stats_coiffeurs.map((c, i) => (
            <div key={c.nom} className="list-item">
              <div className="list-item-left">
                <div className="list-item-avatar">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</div>
                <div>
                  <div className="list-item-name">{c.nom}</div>
                  <div className="list-item-sub">{c.count} client(s)</div>
                </div>
              </div>
              <div className="list-item-amount">{fmt(c.total)}</div>
            </div>
          ))}
        </div>
      )}

      {!stats || (stats.revenu_mois === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">✂️</div>
          <div className="empty-state-text">Aucune prestation ce mois. Commencez à enregistrer!</div>
        </div>
      ))}
    </BossLayout>
  );
}
