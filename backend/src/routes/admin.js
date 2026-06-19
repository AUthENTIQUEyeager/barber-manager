import express from 'express';
import { supabase } from '../supabase.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/stats — stats globales
router.get('/stats', auth, requireAdmin, async (req, res) => {
  const [{ data: salons }, { count: totalUsers }] = await Promise.all([
    supabase.from('salons').select('*'),
    supabase.from('users').select('*', { count: 'exact', head: true })
  ]);

  const actifs = salons?.filter(s => s.subscription_status === 'active').length || 0;
  const suspendus = salons?.filter(s => s.subscription_status === 'suspended').length || 0;
  const expires = salons?.filter(s => s.expiration_date && new Date(s.expiration_date) < new Date()).length || 0;

  res.json({
    total_salons: salons?.length || 0,
    salons_actifs: actifs,
    salons_suspendus: suspendus,
    salons_expires: expires,
    total_users: totalUsers,
    salons
  });
});

// PATCH /api/admin/salons/:id/status — bloquer/activer un salon
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

// GET /api/admin/salons — liste tous les salons
router.get('/salons', auth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('salons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/salons/:id — détail d'un salon
router.get('/salons/:id', auth, requireAdmin, async (req, res) => {
  const [{ data: salon }, { data: users }, { data: prestations }] = await Promise.all([
    supabase.from('salons').select('*').eq('id', req.params.id).single(),
    supabase.from('users').select('id, nom, role, actif').eq('salon_id', req.params.id),
    supabase.from('prestations').select('prix, created_at').eq('salon_id', req.params.id)
  ]);

  const totalRevenu = prestations?.reduce((acc, p) => acc + parseFloat(p.prix), 0) || 0;

  res.json({ salon, users, totalRevenu, totalPrestations: prestations?.length || 0 });
});

export default router;
