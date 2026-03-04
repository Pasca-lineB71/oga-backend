import express from 'express';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { authMiddleware } from './auth.routes.js';

const router = express.Router();

// Helper : obtenir ou créer le wallet
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, solde: 0 });
  }
  return wallet;
};

// Helper : créer une transaction
export const createTransaction = async ({
  userId,
  type,
  montant,
  description,
  methodePaiement,
  refBooking,
  refDelivery,
}) => {
  const wallet = await getOrCreateWallet(userId);
  const soldeAvant = wallet.solde;
  const soldeApres = soldeAvant + montant;

  const transaction = await Transaction.create({
    wallet: wallet._id,
    user: userId,
    type,
    montant,
    description,
    statut: 'reussi',
    methodePaiement,
    refBooking,
    refDelivery,
    soldeAvant,
    soldeApres,
  });

  wallet.solde = Math.max(0, soldeApres);
  if (montant > 0) {
    if (type === 'recharge') wallet.totalDepose += montant;
    if (type === 'remboursement') wallet.totalRembourse += montant;
  } else {
    wallet.totalDepense += Math.abs(montant);
  }
  await wallet.save();

  return transaction;
};

/**
 * @route   GET /api/wallet
 * @desc    Obtenir le wallet
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json({ success: true, data: wallet });
  } catch (error) {
    console.error('❌ Erreur wallet:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/wallet/transactions
 * @desc    Historique des transactions
 * @access  Private
 */
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('refBooking', 'numeroReservation villeDepart villeArrivee')
      .populate('refDelivery', 'numeroLivraison typeLivraison');

    const total = await Transaction.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: transactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    console.error('❌ Erreur transactions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/wallet/recharge
 * @desc    Recharger le wallet
 * @access  Private
 */
router.post('/recharge', authMiddleware, async (req, res) => {
  try {
    const { montant, methodePaiement } = req.body;

    if (!montant || montant <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide',
      });
    }

    if (!methodePaiement) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de paiement requise',
      });
    }

    const montantMin = 500;
    const montantMax = 500000;
    if (montant < montantMin || montant > montantMax) {
      return res.status(400).json({
        success: false,
        message: `Le montant doit être entre ${montantMin} F et ${montantMax} F`,
      });
    }

    const transaction = await createTransaction({
      userId: req.user._id,
      type: 'recharge',
      montant: parseInt(montant),
      description: `Recharge de ${montant} F via ${methodePaiement.replace('_', ' ')}`,
      methodePaiement,
    });

    const wallet = await getOrCreateWallet(req.user._id);

    res.json({
      success: true,
      message: `Wallet rechargé de ${montant} F`,
      data: { transaction, solde: wallet.solde },
    });
  } catch (error) {
    console.error('❌ Erreur recharge:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la recharge' });
  }
});

export default router;