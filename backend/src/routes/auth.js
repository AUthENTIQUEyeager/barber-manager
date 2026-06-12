import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase.js';

const router = express.Router();

// Générer un code salon unique (ex: BAR-4821)
function genSalonCode() {
  return 'BAR-' + Math.floor(1000 + Math.random() * 9000);
}

// ═══════════════════════════════════
// POST /api/auth/register-salon
// Créer un nouveau salon + compte boss
// ═══════════════════════════════════
router.post('/register-salon', async (req, res) => {
  const { nom_salon, telephone, password } = req.body;
  if (!nom_salon || !telephone || !password) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  // Vérifier si le téléphone existe déjà
  const { data: existing } = await supabase
    .from('salons')
    .select('id')
    .eq('telephone', telephone)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Ce numéro est déjà utilisé' });
  }

  // Générer un code unique
  let salon_code = genSalonCode();
  let codeExists = true;
  while (codeExists) {
    const { data } = await supabase.from('salons').select('id').eq('salon_code', salon_code).single();
    if (!data) codeExists = false;
    else salon_code = genSalonCode();
  }

  // Créer le salon
  const { data: salon, error: salonErr } = await supabase
    .from('salons')
    .insert({
      nom: nom_salon,
      telephone,
      salon_code,
      subscription_status: 'active',
      expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
    })
    .select()
    .single();

  if (salonErr) return res.status(500).json({ error: salonErr.message });

  // Créer le boss
  const password_hash = await bcrypt.hash(password, 10);
  const { data: boss, error: bossErr } = await supabase
    .from('users')
    .insert({
      salon_id: salon.id,
      nom: 'Boss',
      role: 'boss',
      telephone,
      password_hash,
      actif: true
    })
    .select()
    .single();

  if (bossErr) return res.status(500).json({ error: bossErr.message });

  const token = jwt.sign(
    { id: boss.id, salon_id: salon.id, role: 'boss', nom: boss.nom },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, salon, user: { id: boss.id, nom: boss.nom, role: 'boss' } });
});

// ═══════════════════════════════════
// POST /api/auth/login-boss
// Connexion boss : téléphone + password
// ═══════════════════════════════════
router.post('/login-boss', async (req, res) => {
  const { telephone, password } = req.body;
  if (!telephone || !password) return res.status(400).json({ error: 'Champs manquants' });

  const { data: user } = await supabase
    .from('users')
    .select('*, salons(*)')
    .eq('telephone', telephone)
    .eq('role', 'boss')
    .eq('actif', true)
    .single();

  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

  // Vérifier abonnement
  const salon = user.salons;
  if (salon.subscription_status === 'suspended') {
    return res.status(403).json({ error: 'Abonnement suspendu. Contactez le support.' });
  }
  if (salon.expiration_date && new Date(salon.expiration_date) < new Date()) {
    return res.status(403).json({ error: 'Abonnement expiré. Renouvelez votre abonnement.' });
  }

  const token = jwt.sign(
    { id: user.id, salon_id: salon.id, role: 'boss', nom: user.nom },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    salon: { id: salon.id, nom: salon.nom, salon_code: salon.salon_code },
    user: { id: user.id, nom: user.nom, role: 'boss' }
  });
});

// ═══════════════════════════════════
// POST /api/auth/login-coiffeur
// Connexion coiffeur : salon_code + user_id + pin
// ═══════════════════════════════════
router.post('/login-coiffeur', async (req, res) => {
  const { salon_code, user_id, pin } = req.body;
  if (!salon_code || !user_id || !pin) return res.status(400).json({ error: 'Champs manquants' });

  // Vérifier le salon
  const { data: salon } = await supabase
    .from('salons')
    .select('*')
    .eq('salon_code', salon_code)
    .single();

  if (!salon) return res.status(404).json({ error: 'Salon introuvable' });
  if (salon.subscription_status === 'suspended') {
    return res.status(403).json({ error: 'Salon suspendu' });
  }

  // Vérifier le coiffeur
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .eq('salon_id', salon.id)
    .eq('role', 'coiffeur')
    .eq('actif', true)
    .single();

  if (!user) return res.status(401).json({ error: 'Coiffeur introuvable' });

  const valid = await bcrypt.compare(pin, user.pin);
  if (!valid) return res.status(401).json({ error: 'PIN incorrect' });

  const token = jwt.sign(
    { id: user.id, salon_id: salon.id, role: 'coiffeur', nom: user.nom },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    salon: { id: salon.id, nom: salon.nom, salon_code: salon.salon_code },
    user: { id: user.id, nom: user.nom, role: 'coiffeur' }
  });
});

// ═══════════════════════════════════
// GET /api/auth/coiffeurs-list/:salon_code
// Lister les coiffeurs d'un salon (pour la page login coiffeur)
// ═══════════════════════════════════
router.get('/coiffeurs-list/:salon_code', async (req, res) => {
  const { salon_code } = req.params;

  const { data: salon } = await supabase
    .from('salons')
    .select('id, nom')
    .eq('salon_code', salon_code)
    .single();

  if (!salon) return res.status(404).json({ error: 'Salon introuvable' });

  const { data: coiffeurs } = await supabase
    .from('users')
    .select('id, nom')
    .eq('salon_id', salon.id)
    .eq('role', 'coiffeur')
    .eq('actif', true);

  res.json({ salon, coiffeurs: coiffeurs || [] });
});

// ═══════════════════════════════════
// POST /api/auth/login-admin
// ═══════════════════════════════════
router.post('/login-admin', async (req, res) => {
  const { email, password } = req.body;
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Identifiants admin incorrects' });
  }
  const token = jwt.sign(
    { id: 'admin', role: 'admin', nom: 'Admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: 'admin', nom: 'Admin', role: 'admin' } });
});

export default router;
