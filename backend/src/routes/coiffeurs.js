import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../supabase.js';
import { auth, requireBoss } from '../middleware/auth.js';

const router = express.Router();

// GET /api/coiffeurs — liste des coiffeurs du salon
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nom, actif, created_at')
    .eq('salon_id', req.user.salon_id)
    .eq('role', 'coiffeur')
    .order('nom');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/coiffeurs — ajouter un coiffeur
router.post('/', auth, requireBoss, async (req, res) => {
  const { nom, pin } = req.body;
  if (!nom || !pin || pin.length !== 4) {
    return res.status(400).json({ error: 'Nom et PIN à 4 chiffres obligatoires' });
  }

  // Vérifier doublon
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('salon_id', req.user.salon_id)
    .eq('nom', nom)
    .eq('role', 'coiffeur')
    .single();

  if (existing) return res.status(400).json({ error: 'Un coiffeur avec ce nom existe déjà' });

  const pin_hash = await bcrypt.hash(pin, 10);

  const { data, error } = await supabase
    .from('users')
    .insert({
      salon_id: req.user.salon_id,
      nom,
      role: 'coiffeur',
      pin: pin_hash,
      actif: true
    })
    .select('id, nom, actif, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/coiffeurs/:id — activer/désactiver
router.patch('/:id', auth, requireBoss, async (req, res) => {
  const { actif } = req.body;

  const { data, error } = await supabase
    .from('users')
    .update({ actif })
    .eq('id', req.params.id)
    .eq('salon_id', req.user.salon_id)
    .eq('role', 'coiffeur')
    .select('id, nom, actif')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/coiffeurs/:id
router.delete('/:id', auth, requireBoss, async (req, res) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', req.params.id)
    .eq('salon_id', req.user.salon_id)
    .eq('role', 'coiffeur');

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
