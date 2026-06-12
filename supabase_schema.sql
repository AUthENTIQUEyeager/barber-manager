-- ════════════════════════════════════════════════════
-- BarberManager — Schéma Supabase complet
-- Coller dans l'éditeur SQL de Supabase
-- ════════════════════════════════════════════════════

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────
-- SALONS
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT UNIQUE NOT NULL,
  salon_code TEXT UNIQUE NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'suspended')),
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salons_code ON salons(salon_code);
CREATE INDEX IF NOT EXISTS idx_salons_status ON salons(subscription_status);

-- ────────────────────────────────────────────────────
-- USERS (boss + coiffeurs)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('boss', 'coiffeur')),
  telephone TEXT,
  password_hash TEXT,    -- boss uniquement
  pin TEXT,              -- coiffeur uniquement (bcrypt)
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_salon ON users(salon_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tel ON users(telephone);

-- ────────────────────────────────────────────────────
-- COIFFURES (types de services proposés)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coiffures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prix NUMERIC(10, 2) NOT NULL CHECK (prix >= 0),
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coiffures_salon ON coiffures(salon_id);

-- ────────────────────────────────────────────────────
-- PRESTATIONS (coiffures réalisées)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT UNIQUE,            -- ID généré côté client (offline)
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  coiffeur_id UUID NOT NULL REFERENCES users(id),
  coiffure_id UUID NOT NULL REFERENCES coiffures(id),
  prix NUMERIC(10, 2) NOT NULL,
  note TEXT,
  synced BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestations_salon ON prestations(salon_id);
CREATE INDEX IF NOT EXISTS idx_prestations_coiffeur ON prestations(coiffeur_id);
CREATE INDEX IF NOT EXISTS idx_prestations_date ON prestations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prestations_local_id ON prestations(local_id);

-- ────────────────────────────────────────────────────
-- SYNC LOGS
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  payload JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-nettoyage des logs > 30 jours (optionnel, via cron Supabase)
-- DELETE FROM sync_logs WHERE synced_at < NOW() - INTERVAL '30 days';

-- ════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — désactiver si backend service key
-- Si tu utilises le backend Node.js avec la service_role key,
-- les politiques RLS sont bypassées automatiquement.
-- Active RLS uniquement si tu utilises le client Supabase directement depuis le front.
-- ════════════════════════════════════════════════════

-- ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE coiffures ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════
-- DONNÉES DE TEST (facultatif)
-- ════════════════════════════════════════════════════

-- INSERT INTO salons (nom, telephone, salon_code, expiration_date)
-- VALUES ('Salon Test', '70000001', 'BAR-0001', NOW() + INTERVAL '30 days');
