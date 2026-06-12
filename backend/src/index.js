import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import salonRoutes from './routes/salons.js';
import coiffeurRoutes from './routes/coiffeurs.js';
import coiffureRoutes from './routes/coiffures.js';
import prestationRoutes from './routes/prestations.js';
import syncRoutes from './routes/sync.js';
import adminRoutes from './routes/admin.js';
import statsRoutes from './routes/stats.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/coiffeurs', coiffeurRoutes);
app.use('/api/coiffures', coiffureRoutes);
app.use('/api/prestations', prestationRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`✅ BarberManager API en ligne sur port ${PORT}`);
});
