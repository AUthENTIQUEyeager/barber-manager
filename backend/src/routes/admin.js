import express from 'express';
import { supabase } from '../supabase.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/stats — stats globales enrichies
router.get('/stats', auth, requireAdmin, async (req, res) => {
  const [
    { data: salons },
    { data: allUsers },
    { data: allPrestations }
  ] = await Promise.all([
    supabase.from('salons').select('*').order('created_at', { ascending: false }),
    supabase.from('users').select('id, salon_id, role, actif, nom'),
    supabase.from('prestations').select('salon_id, prix')
  ]);

  const actifs    = salons?.filter(s => s.subscription_status === 'active').length || 0;
  const suspendus = salons?.filter(s => s.subscription_status === 'suspended').length || 0;
  const expires   = salons?.filter(s => s.expiration_date && new Date(s.expiration_date) < new Date()).length || 0;

  // Total coiffeurs (role coiffeur uniquement)
  const totalCoiffeurs = allUsers?.filter(u => u.role === 'coiffeur').length || 0;

  // Total encaissé tous salons confondus
  const totalEncaisse = allPrestations?.reduce((acc, p) => acc + parseFloat(p.prix || 0), 0) || 0;

  // Enrichir chaque salon avec ses stats
  const salonsEnrichis = salons?.map(s => {
    const coiffeurs = allUsers?.filter(u => u.salon_id === s.id && u.role === 'coiffeur') || [];
    const prestations = allPrestations?.filter(p => p.salon_id === s.id) || [];
    const encaisse = prestations.reduce((acc, p) => acc + parseFloat(p.prix || 0), 0);
    return {
      ...s,
      nb_coiffeurs: coiffeurs.length,
      total_encaisse: encaisse,
      nb_prestations: prestations.length
    };
  }) || [];

  res.json({
    total_salons: salons?.length || 0,
    salons_actifs: actifs,
    salons_suspendus: suspendus,
    salons_expires: expires,
    total_coiffeurs: totalCoiffeurs,
    total_encaisse: totalEncaisse,
    salons: salonsEnrichis
  });
});

// PATCH /api/admin/salons/:id/status
router.patch('/salons/:id/status', auth, requireAdmin, async (req, res) => {
  const { subscription_status, expiration_date } = req.body;

  const { data, error } = await supabase
    .from('salons')
    .update({ subscription_status, expiration_date })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
