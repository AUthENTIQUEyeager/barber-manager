# 💈 BarberManager

Système de gestion de salons de coiffure — PWA offline-first pour l'Afrique.

---

## 🏗️ Architecture

```
Frontend (React + Vite PWA)  →  Vercel
Backend (Node.js + Express)  →  Render
Base de données              →  Supabase (PostgreSQL)
Stockage offline             →  IndexedDB (navigateur)
```

---

## 📁 Structure du projet

```
barber-manager/
├── frontend/               # React + Vite + PWA
│   ├── src/
│   │   ├── api/            # Client HTTP
│   │   ├── contexts/       # AuthContext (session globale)
│   │   ├── db/             # IndexedDB wrapper (offline)
│   │   ├── sync/           # SyncManager (auto-sync)
│   │   ├── components/     # SyncBadge, BossLayout, Toast
│   │   └── pages/
│   │       ├── boss/       # Dashboard, Coiffeurs, Services, Historique, Paramètres
│   │       ├── coiffeur/   # Dashboard + Nouvelle Prestation
│   │       └── admin/      # Dashboard plateforme
│   └── vite.config.js      # Config PWA (vite-plugin-pwa)
│
├── backend/                # Node.js + Express
│   └── src/
│       ├── routes/         # auth, coiffeurs, coiffures, prestations, sync, stats, admin
│       ├── middleware/      # JWT auth + role check
│       └── supabase.js     # Client Supabase (service key)
│
└── supabase_schema.sql     # Schéma complet à coller dans Supabase
```

---

## 🚀 Déploiement étape par étape

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** → coller le contenu de `supabase_schema.sql` → **Run**
3. Récupérer dans **Settings > API** :
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_KEY`

---

### 2. Backend → Render

1. Pusher le dossier `backend/` sur GitHub
2. Sur [render.com](https://render.com) → **New Web Service** → connecter le repo
3. Configurer :
   - **Build Command** : `npm install`
   - **Start Command** : `node src/index.js`
   - **Node version** : 18+
4. Ajouter les variables d'environnement :

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=un_secret_min_32_caracteres_aleatoires
FRONTEND_URL=https://barber-manager.vercel.app
ADMIN_EMAIL=ton@email.com
ADMIN_PASSWORD=motDePasseAdmin123
```

5. Déployer — noter l'URL (ex: `https://barber-manager-api.onrender.com`)

---

### 3. Frontend → Vercel

1. Pusher le dossier `frontend/` sur GitHub
2. Sur [vercel.com](https://vercel.com) → **New Project** → connecter le repo
3. Framework : **Vite**
4. Ajouter la variable d'environnement :
```env
VITE_API_URL=https://barber-manager-api.onrender.com
```
5. Déployer

---

### 4. Ajouter les icônes PWA

Créer `frontend/public/icons/` et y placer :
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Tu peux générer ces icônes sur [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator) ou [realfavicongenerator.net](https://realfavicongenerator.net).

---

## 🧑‍💻 Développement local

### Backend
```bash
cd backend
npm install
cp .env.example .env      # Remplir les variables
npm run dev               # Port 4000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm run dev               # Port 5173
```

---

## 👥 Flux d'utilisation

### 1. Patron crée le salon
- Va sur l'app → "Créer un salon"
- Reçoit son **code salon** (ex: `BAR-4821`)

### 2. Patron ajoute ses coiffeurs
- Dashboard → Coiffeurs → "+ Ajouter"
- Définit un nom + PIN à 4 chiffres

### 3. Coiffeur se connecte
- Clique "Connexion coiffeur"
- Saisit le code salon → choisit son nom → saisit son PIN

### 4. Coiffeur enregistre une prestation
- "Nouvelle coiffure" → choisit le service → "Enregistrer"
- **2 clics max**, fonctionne hors ligne

### 5. Synchronisation automatique
- Dès que le réseau revient → sync automatique vers Supabase
- Indicateur `SyncBadge` visible dans le header

---

## 📱 PWA — Installation

**Android (Chrome)** :
1. Ouvrir l'URL dans Chrome
2. Menu ⋮ → "Ajouter à l'écran d'accueil"

**iOS (Safari)** :
1. Ouvrir dans Safari
2. Partager → "Sur l'écran d'accueil"

---

## 🔒 Sécurité

- Mots de passe hashés avec **bcrypt** (salt 10)
- PINs coiffeurs hashés avec **bcrypt**
- Auth par **JWT** (30j boss, 7j coiffeur)
- Routes backend protégées par middleware `auth` + `requireRole`
- Admin séparé avec credentials ENV (pas en base)

---

## 💰 Monétisation

Le système d'abonnement est intégré :

| Champ | Valeur |
|-------|--------|
| `subscription_status` | `active` ou `suspended` |
| `expiration_date` | Date d'expiration |

**Via admin dashboard** :
- Suspendre un salon expiré
- Renouveler de 30 jours
- Voir tous les salons et leur statut

**Tarification suggérée** :
- 2 000 FCFA / mois (petit salon)
- 5 000 FCFA / mois (salon avec 3+ coiffeurs)

---

## ⚙️ Variables d'environnement

### Backend
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL projet Supabase |
| `SUPABASE_SERVICE_KEY` | Clé service_role (accès total) |
| `JWT_SECRET` | Secret signature JWT (min 32 chars) |
| `FRONTEND_URL` | URL du frontend déployé (CORS) |
| `ADMIN_EMAIL` | Email login admin plateforme |
| `ADMIN_PASSWORD` | Mot de passe admin plateforme |
| `PORT` | Port serveur (4000 par défaut) |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL de l'API backend |

---

## 🔄 Logique Sync Offline

```
Action coiffeur
    │
    ▼
queuePrestation() → IndexedDB (local_id, synced=false)
    │
    ├── Si en ligne → syncPendingData() → POST /api/sync/push
    │       └── markPrestationSynced(local_id, server_id)
    │
    └── Si hors ligne → attente
              │
              └── navigator.onLine event → sync auto
                  + setInterval(20s) si connecté
```

---

## 📞 Support

Bouton "Demander un site" dans Paramètres → lien WhatsApp direct avec le nom du salon pré-rempli.

Modifier le numéro dans `frontend/src/pages/boss/Parametres.jsx` :
```js
const WA_NUMBER = '22670000000'; // ← ton numéro
```
