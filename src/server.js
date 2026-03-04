
import './config/env.js';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import deliveriesRoutes from './routes/deliveries.routes.js';
import promotionsRoutes from './routes/promotions.routes.js';
import walletRoutes from './routes/wallet.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.log('❌ Erreur MongoDB :', err));

// 🔥 Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: '✅ API OGA TECHNOLOGIE is running!' });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log(`📍 Google Maps: ${process.env.GOOGLE_MAPS_API_KEY ? 'Configuré ✅' : 'Non configuré ⚠️'}`);
});