import express from 'express';
import Delivery from '../models/Delivery.js';
import { authMiddleware } from './auth.routes.js';
import { calculateDistance, geocodeAddress, calculateDeliveryPrice } from '../utils/googleMaps.js';
import { createTransaction } from './wallet.routes.js';

const router = express.Router();

/**
 * @route   POST /api/deliveries/calculate-price
 * @desc    Calculer le tarif de livraison avec Google Maps
 * @access  Public
 */
router.post('/calculate-price', async (req, res) => {
  try {
    const { adresseDepart, adresseArrivee, conditionsSpeciales } = req.body;

    if (!adresseDepart || !adresseArrivee) {
      return res.status(400).json({
        success: false,
        message: 'Adresses de départ et d\'arrivée requises',
      });
    }

    // Calculer la distance avec Google Maps
    const distanceResult = await calculateDistance(
      `${adresseDepart}, Ouagadougou, Burkina Faso`,
      `${adresseArrivee}, Ouagadougou, Burkina Faso`
    );

    if (!distanceResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de calculer la distance',
      });
    }

    const distance = distanceResult.distance;
    const tarif = calculateDeliveryPrice(distance, conditionsSpeciales);
    const fraisPlateforme = parseInt(process.env.PLATFORM_FEE_LIVRAISON) || 500;
    const montantTotal = tarif + fraisPlateforme;

    res.json({
      success: true,
      distance,
      distanceText: distanceResult.distanceText,
      duration: distanceResult.duration,
      tarif,
      fraisPlateforme,
      montantTotal,
    });
  } catch (error) {
    console.error('❌ Erreur calcul tarif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du tarif',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/deliveries
 * @desc    Créer une livraison
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      typeLivraison,
      expediteur,
      destinataire,
      colis,
      instructions,
      typeVehicule,
      sousTypeVoiture,
      conditionsSpeciales,
      methodePaiement,
    } = req.body;

    // Validation
    if (!typeLivraison || !expediteur || !destinataire || !typeVehicule) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes',
      });
    }

    // Géocoder les adresses pour obtenir les coordonnées
    const expediteurGeocode = await geocodeAddress(
      `${expediteur.adresse}, Ouagadougou, Burkina Faso`
    );
    const destinataireGeocode = await geocodeAddress(
      `${destinataire.adresse}, Ouagadougou, Burkina Faso`
    );

    // Calculer la distance
    const distanceResult = await calculateDistance(
      `${expediteur.adresse}, Ouagadougou, Burkina Faso`,
      `${destinataire.adresse}, Ouagadougou, Burkina Faso`
    );

    if (!distanceResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de calculer la distance entre les adresses',
      });
    }

    const distance = distanceResult.distance;
    const tarif = calculateDeliveryPrice(distance, conditionsSpeciales);
    const fraisPlateforme = parseInt(process.env.PLATFORM_FEE_LIVRAISON) || 500;
    const montantTotal = tarif + fraisPlateforme;

    // Créer la livraison
    const deliveryData = {
      client: req.user._id,
      typeLivraison,
      expediteur: {
        ...expediteur,
        coordonnees: expediteurGeocode.success
          ? {
              lat: expediteurGeocode.latitude,
              lng: expediteurGeocode.longitude,
            }
          : undefined,
      },
      destinataire: {
        ...destinataire,
        coordonnees: destinataireGeocode.success
          ? {
              lat: destinataireGeocode.latitude,
              lng: destinataireGeocode.longitude,
            }
          : undefined,
      },
      typeVehicule,
      sousTypeVoiture,
      distance,
      dureeEstimee: distanceResult.duration,
      tarif,
      fraisPlateforme,
      montantTotal,
      conditionsSpeciales,
      methodePaiement,
      statut: 'en_attente',
      statutPaiement: 'payé',
      dateCommande: new Date(),
    };

    // Ajouter colis ou instructions selon le type
    if (typeLivraison === 'ordinaire' && colis) {
      deliveryData.colis = colis;
    } else if (typeLivraison === 'pressing' && instructions) {
      deliveryData.instructions = instructions;
    }

    const delivery = await Delivery.create(deliveryData);

    await createTransaction({
       userId: req.user._id,
       type: 'paiement_livraison',
       montant: -montantTotal, // débit
       description: `Livraison ${typeLivraison === 'pressing' ? 'express' : 'ordinaire'} — ${expediteur.adresse} → ${destinataire.adresse}`,
       methodePaiement,
       refDelivery: delivery._id,
    });

    res.status(201).json({
      success: true,
      message: 'Livraison créée avec succès',
      data: delivery,
    });
  } catch (error) {
    console.error('❌ Erreur création livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la livraison',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/deliveries/my-deliveries
 * @desc    Obtenir les livraisons de l'utilisateur
 * @access  Private
 */
router.get('/my-deliveries', authMiddleware, async (req, res) => {
  try {
    const deliveries = await Delivery.find({ client: req.user._id })
      .populate('livreur', 'nom prenom telephone')
      .sort('-dateCommande');

    res.json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    console.error('❌ Erreur récupération livraisons:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/deliveries/:id
 * @desc    Obtenir les détails d'une livraison
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('client', 'nom prenom telephone')
      .populate('livreur', 'nom prenom telephone');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (delivery.client._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    console.error('❌ Erreur récupération livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/deliveries/:id/cancel
 * @desc    Annuler une livraison
 * @access  Private
 */
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (delivery.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    if (delivery.statut === 'annulé') {
      return res.status(400).json({
        success: false,
        message: 'Cette livraison est déjà annulée',
      });
    }

    if (delivery.statut === 'livré') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une livraison déjà effectuée',
      });
    }

    if (delivery.statut === 'en_cours') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une livraison en cours',
      });
    }

    delivery.statut = 'annulé';
    delivery.dateAnnulation = new Date();
    delivery.commentaire = req.body.raison || 'Annulation client';
    await delivery.save();
    await createTransaction({
       userId: req.user._id,
       type: 'remboursement',
       montant: delivery.montantTotal, // crédit
       description: `Remboursement livraison ${delivery.numeroLivraison}`,
       refDelivery: delivery._id,
    });


    res.json({
      success: true,
      message: 'Livraison annulée avec succès',
      data: delivery,
    });
  } catch (error) {
    console.error('❌ Erreur annulation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation',
      error: error.message,
    });
  }
});

export default router;