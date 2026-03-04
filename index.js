// ⚠️ DOIT être le tout premier import pour charger le .env avant tous les autres modules
import './src/config/env.js';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './src/routes/auth.routes.js';
// import bookingRoutes from './src/routes/booking.routes.js';
// import deliveryRoutes from './src/routes/delivery.routes.js';
// import notificationRoutes from './src/routes/notification.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARES
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// CONNEXION MONGODB
// ========================================
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error.message);
    process.exit(1);
  }
};

await connectDB();

// ========================================
// ROUTES
// ========================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚌 OGA Technologie - Backend',
    version: '1.0.0',
    database: 'MongoDB Atlas',
    endpoints: {
      auth: '/api/auth',
      bookings: '/api/bookings',
      deliveries: '/api/deliveries',
      notifications: '/api/notifications',
      health: '/health',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

app.use('/api/auth', authRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/deliveries', deliveryRoutes);
// app.use('/api/notifications', notificationRoutes);

// ========================================
// GESTION DES ERREURS
// ========================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
});

// ========================================
// DÉMARRER LE SERVEUR
// ========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ================================================');
  console.log('🚌 OGA TECHNOLOGIE - BACKEND');
  console.log('🚀 ================================================');
  console.log(`✅ Serveur:  http://0.0.0.0:${PORT}`);
  console.log(`🌿 MongoDB:  Atlas (ogaDB)`);
  console.log(`🌐 API Auth: http://localhost:${PORT}/api/auth`);
  console.log('🚀 ================================================');
  console.log('');
});