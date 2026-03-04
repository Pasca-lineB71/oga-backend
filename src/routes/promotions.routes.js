import express from 'express';
import Promotion from '../models/Promotion.js';
import { authMiddleware } from './auth.routes.js';

const router = express.Router();

/**
 * @route   GET /api/promotions
 * @desc    Obtenir toutes les promotions actives et non expirées
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const { type } = req.query; // 'billet', 'livraison' ou rien pour tout

    const query = {
      actif: true,
      dateDebut: { $lte: now },
      dateFin: { $gte: now },
    };

    // Filtrer par type si demandé
    if (type) {
      query.applicableSur = { $in: [type, 'les_deux'] };
    }

    // Exclure les promos ayant atteint leur limite d'utilisations
    query.$or = [
      { nombreUtilisationsMax: null },
      { $expr: { $lt: ['$nombreUtilisations', '$nombreUtilisationsMax'] } },
    ];

    const promotions = await Promotion.find(query).sort('-createdAt');

    res.json({
      success: true,
      count: promotions.length,
      data: promotions,
    });
  } catch (error) {
    console.error('❌ Erreur récupération promotions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/promotions/:id
 * @desc    Détails d'une promotion
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion non trouvée' });
    }

    const now = new Date();
    const estValide = promotion.actif && promotion.dateDebut <= now && promotion.dateFin >= now;

    res.json({ success: true, data: { ...promotion.toObject(), estValide } });
  } catch (error) {
    console.error('❌ Erreur promotion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/promotions (Admin seulement)
 * @desc    Créer une promotion
 * @access  Private/Admin
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux admins' });
    }

    const promotion = await Promotion.create({
      ...req.body,
      creePar: req.user._id,
    });

    res.status(201).json({ success: true, data: promotion });
  } catch (error) {
    console.error('❌ Erreur création promotion:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création' });
  }
});

export default router;