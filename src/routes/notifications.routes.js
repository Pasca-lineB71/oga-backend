import express from 'express';
import Notification from '../models/Notification.js';
import { authMiddleware } from './auth.routes.js'; // utiliser le middleware JWT

const router = express.Router();

// 🔹 GET /api/notifications -> récupérer les notifications de l'utilisateur connecté
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications' });
  }
});

// 🔹 POST /api/notifications -> créer une notification pour un utilisateur (optionnel)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title et message requis' });

    const notif = await Notification.create({
      title,
      message,
      type: type || 'info',
      user: req.user._id
    });

    res.status(201).json({ success: true, data: notif });
  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la notification' });
  }
});

// Marquer toutes comme lues
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { read: true });
    res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur' });
  }
});

// 🔹 PUT /api/notifications/:id/read -> marquer comme lu
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification non trouvée' });

    notif.read = true;
    await notif.save();

    res.json({ success: true, data: notif });
  } catch (error) {
    console.error('❌ Erreur marquer notification lu:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la notification' });
  }
});

// Supprimer une notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur' });
  }
});

export default router;
