import express from 'express';
import { supabase } from '../supabase.js';
import { auth, requireBoss } from '../middleware/auth.js';

const router = express.Router();

// GET /api/coiffures
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('coiffures')
    .select('*')
    .eq('salon_id', req.user.salon_id)
    .eq('actif', true)
    .order('nom');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/coiffures
router.post('/', auth, requireBoss, async (req, res) => {
  const { nom, prix, description } = req.body;
  if (!nom || !prix) return res.status(400).json({ error: 'Nom et prix obligatoires' });

  const { data, error } = await supabase
    .from('coiffures')
    .insert({ salon_id: req.user.salon_id, nom, prix: parseFloat(prix), description })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/coiffures/:id
router.patch('/:id', auth, requireBoss, async (req, res) => {
  const { nom, prix, description, actif } = req.body;

  const { data, error } = await supabase
    .from('coiffures')
    .update({ nom, prix: prix ? parseFloat(prix) : undefined, description, actif })
    .eq('id', req.params.id)
    .eq('salon_id', req.user.salon_id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/coiffures/:id (soft delete)
router.delete('/:id', auth, requireBoss, async (req, res) => {
  const { error } = await supabase
    .from('coiffures')
    .update({ actif: false })
    .eq('id', req.params.id)
    .eq('salon_id', req.user.salon_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
