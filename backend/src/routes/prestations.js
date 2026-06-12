import express from 'express';
import { supabase } from '../supabase.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/prestations — ajouter une prestation
router.post('/', auth, async (req, res) => {
  const { coiffure_id, note, local_id, created_at } = req.body;
  if (!coiffure_id) return res.status(400).json({ error: 'coiffure_id obligatoire' });

  // Récupérer le prix de la coiffure
  const { data: coiffure } = await supabase
    .from('coiffures')
    .select('prix')
    .eq('id', coiffure_id)
    .eq('salon_id', req.user.salon_id)
    .single();

  if (!coiffure) return res.status(404).json({ error: 'Coiffure introuvable' });

  const { data, error } = await supabase
    .from('prestations')
    .insert({
      salon_id: req.user.salon_id,
      coiffeur_id: req.user.id,
      coiffure_id,
      prix: coiffure.prix,
      note,
      local_id,
      synced: true,
      created_at: created_at || new Date().toISOString()
    })
    .select('*, coiffures(nom, prix), users(nom)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/prestations — liste avec filtres
router.get('/', auth, async (req, res) => {
  const { coiffeur_id, date_debut, date_fin, limit = 50 } = req.query;

  let query = supabase
    .from('prestations')
    .select('*, coiffures(nom, prix), users!coiffeur_id(nom)')
    .eq('salon_id', req.user.salon_id)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  // Coiffeur ne voit que ses propres prestations
  if (req.user.role === 'coiffeur') {
    query = query.eq('coiffeur_id', req.user.id);
  } else if (coiffeur_id) {
    query = query.eq('coiffeur_id', coiffeur_id);
  }

  if (date_debut) query = query.gte('created_at', date_debut);
  if (date_fin) query = query.lte('created_at', date_fin);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
