import express from 'express';
import { supabase } from '../supabase.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stats/dashboard — stats complètes pour le boss
router.get('/dashboard', auth, async (req, res) => {
  const salonId = req.user.salon_id;
  const now = new Date();
  const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const debutSemaine = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Toutes les prestations du salon
  const { data: prestations } = await supabase
    .from('prestations')
    .select('prix, coiffeur_id, created_at, users!coiffeur_id(nom)')
    .eq('salon_id', salonId);

  if (!prestations) return res.json({});

  // Calculs
  const pJour = prestations.filter(p => p.created_at >= debutJour);
  const pSemaine = prestations.filter(p => p.created_at >= debutSemaine);
  const pMois = prestations.filter(p => p.created_at >= debutMois);

  const sum = (arr) => arr.reduce((acc, p) => acc + parseFloat(p.prix), 0);

  // Top coiffeur du mois
  const coiffeurStats = {};
  pMois.forEach(p => {
    const nom = p['users']?.nom || 'Inconnu';
    if (!coiffeurStats[nom]) coiffeurStats[nom] = { nom, total: 0, count: 0 };
    coiffeurStats[nom].total += parseFloat(p.prix);
    coiffeurStats[nom].count += 1;
  });
  const topCoiffeur = Object.values(coiffeurStats).sort((a, b) => b.total - a.total)[0] || null;

  // Stats par coiffeur pour le mois
  const statsCoiffeurs = Object.values(coiffeurStats).sort((a, b) => b.total - a.total);

  // Données graphique 7 derniers jours
  const graphData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const debut = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
    const dayPrestations = prestations.filter(p => p.created_at >= debut && p.created_at <= fin);
    graphData.push({
      date: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      total: sum(dayPrestations),
      count: dayPrestations.length
    });
  }

  res.json({
    revenu_jour: sum(pJour),
    clients_jour: pJour.length,
    revenu_semaine: sum(pSemaine),
    clients_semaine: pSemaine.length,
    revenu_mois: sum(pMois),
    clients_mois: pMois.length,
    top_coiffeur: topCoiffeur,
    stats_coiffeurs: statsCoiffeurs,
    graph_semaine: graphData
  });
});

// GET /api/stats/coiffeur — stats personnelles du coiffeur connecté
router.get('/coiffeur', auth, async (req, res) => {
  const now = new Date();
  const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const debutSemaine = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: prestations } = await supabase
    .from('prestations')
    .select('prix, created_at, coiffures(nom)')
    .eq('coiffeur_id', req.user.id)
    .eq('salon_id', req.user.salon_id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!prestations) return res.json({});

  const pJour = prestations.filter(p => p.created_at >= debutJour);
  const pSemaine = prestations.filter(p => p.created_at >= debutSemaine);
  const sum = (arr) => arr.reduce((acc, p) => acc + parseFloat(p.prix), 0);

  res.json({
    gain_jour: sum(pJour),
    clients_jour: pJour.length,
    gain_semaine: sum(pSemaine),
    clients_semaine: pSemaine.length,
    derniers: prestations.slice(0, 20)
  });
});

export default router;
