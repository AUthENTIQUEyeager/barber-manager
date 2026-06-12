import express from 'express';
import { supabase } from '../supabase.js';
import { auth, requireBoss } from '../middleware/auth.js';

const router = express.Router();

// GET /api/salons/me — infos du salon courant
router.get('/me', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('salons')
    .select('*')
    .eq('id', req.user.salon_id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/salons/me — modifier les infos du salon
router.patch('/me', auth, requireBoss, async (req, res) => {
  const { nom, telephone } = req.body;

  const { data, error } = await supabase
    .from('salons')
    .update({ nom, telephone })
    .eq('id', req.user.salon_id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
