import express from 'express';
import { supabase } from '../supabase.js';
import { auth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// POST /api/sync/push — envoyer les données locales non synchronisées
// Body: { prestations: [...] }
router.post('/push', auth, async (req, res) => {
  const { prestations = [] } = req.body;
  const results = { synced: [], errors: [] };

  for (const p of prestations) {
    // Vérifier si déjà synced (via local_id)
    if (p.local_id) {
      const { data: existing } = await supabase
        .from('prestations')
        .select('id')
        .eq('local_id', p.local_id)
        .single();
      if (existing) {
        results.synced.push({ local_id: p.local_id, server_id: existing.id, already_existed: true });
        continue;
      }
    }

    // Récupérer le prix de la coiffure
    const { data: coiffure } = await supabase
      .from('coiffures')
      .select('prix')
      .eq('id', p.coiffure_id)
      .eq('salon_id', req.user.salon_id)
      .single();

    const prix = coiffure?.prix || p.prix || 0;

    const { data, error } = await supabase
      .from('prestations')
      .insert({
        salon_id: req.user.salon_id,
        coiffeur_id: p.coiffeur_id || req.user.id,
        coiffure_id: p.coiffure_id,
        prix,
        note: p.note,
        local_id: p.local_id,
        synced: true,
        created_at: p.created_at || new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      results.errors.push({ local_id: p.local_id, error: error.message });
    } else {
      results.synced.push({ local_id: p.local_id, server_id: data.id });
    }
  }

  // Log de sync
  await supabase.from('sync_logs').insert({
    salon_id: req.user.salon_id,
    user_id: req.user.id,
    action: 'push',
    payload: { synced_count: results.synced.length, error_count: results.errors.length }
  });

  res.json(results);
});

// GET /api/sync/pull — récupérer les dernières données serveur
router.get('/pull', auth, async (req, res) => {
  const { since } = req.query;
  const salonId = req.user.salon_id;

  let presQuery = supabase
    .from('prestations')
    .select('*, coiffures(nom, prix), users!coiffeur_id(nom)')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (since) presQuery = presQuery.gte('created_at', since);

  const [{ data: prestations }, { data: coiffures }, { data: coiffeurs }] = await Promise.all([
    presQuery,
    supabase.from('coiffures').select('*').eq('salon_id', salonId).eq('actif', true),
    supabase.from('users').select('id, nom, actif').eq('salon_id', salonId).eq('role', 'coiffeur').eq('actif', true)
  ]);

  res.json({
    prestations: prestations || [],
    coiffures: coiffures || [],
    coiffeurs: coiffeurs || [],
    pulled_at: new Date().toISOString()
  });
});

export default router;
