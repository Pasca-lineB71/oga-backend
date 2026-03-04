import express from 'express';
import Booking from '../models/Booking.js';
import Route from '../models/Route.js';
import Transporteur from '../models/Transporteur.js';
import { authMiddleware } from './auth.routes.js';
import { calculateDistance } from '../utils/googleMaps.js';
import { createTransaction } from './wallet.routes.js';


const router = express.Router();

/**
 * @route   GET /api/bookings/routes
 * @desc    Obtenir les trajets disponibles avec distance Google Maps
 * @access  Public
 */
router.get('/routes', async (req, res) => {
  try {
    const { depart, arrivee } = req.query;

    let query = { actif: true };
    
    if (depart) query.villeDepart = depart;
    if (arrivee) query.villeArrivee = arrivee;

    const routes = await Route.find(query).populate('transporteur');

    // Si départ ET arrivée fournis, calculer la distance avec Google Maps
    if (depart && arrivee && routes.length > 0) {
      const distanceResult = await calculateDistance(
        `${depart}, Burkina Faso`,
        `${arrivee}, Burkina Faso`
      );

      if (distanceResult.success) {
        // Mettre à jour la distance pour toutes les routes
        routes.forEach(route => {
          route.distance = distanceResult.distance;
          route.dureeEstimee = distanceResult.duration;
        });
      }
    }

    res.json({
      success: true,
      count: routes.length,
      routes,
    });
  } catch (error) {
    console.error('❌ Erreur récupération trajets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des trajets',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/check-availability
 * @desc    Vérifier si le bus a encore de la place (sans afficher les sièges occupés)
 * @access  Public
 */
router.get('/check-availability', async (req, res) => {
  try {
    const { routeId, transporteurId, dateVoyage, heureDepart } = req.query;

    if (!routeId || !transporteurId || !dateVoyage || !heureDepart) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants',
      });
    }

    const transporteur = await Transporteur.findById(transporteurId);
    
    if (!transporteur) {
      return res.status(404).json({
        success: false,
        message: 'Transporteur non trouvé',
      });
    }

    // Compter le nombre total de réservations pour ce trajet/date/heure
    const nombreReservations = await Booking.countDocuments({
      route: routeId,
      transporteur: transporteurId,
      dateVoyage: new Date(dateVoyage),
      heureDepart,
      statut: { $in: ['en_attente', 'confirmé'] },
    });

    const placesDisponibles = transporteur.nombrePlaces - nombreReservations;
    const busComplet = placesDisponibles <= 0;

    res.json({
      success: true,
      totalPlaces: transporteur.nombrePlaces,
      placesReservees: nombreReservations,
      placesDisponibles,
      busComplet,
    });
  } catch (error) {
    console.error('❌ Erreur vérification disponibilité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/bookings
 * @desc    Créer une nouvelle réservation
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      routeId,
      transporteurId,
      villeDepart,
      villeArrivee,
      dateVoyage,
      heureDepart,
      numeroPlace,
      tarif,
      methodePaiement,
    } = req.body;

    // Récupérer le transporteur
    const transporteur = await Transporteur.findById(transporteurId);
    if (!transporteur) {
      return res.status(404).json({
        success: false,
        message: 'Transporteur non trouvé',
      });
    }

    // ✅ VÉRIFIER LE NOMBRE TOTAL DE RÉSERVATIONS (pas les places spécifiques)
    const nombreReservations = await Booking.countDocuments({
      route: routeId,
      transporteur: transporteurId,
      dateVoyage: new Date(dateVoyage),
      heureDepart,
      statut: { $in: ['en_attente', 'confirmé'] },
    });

    // Si le bus est complet, refuser la réservation
    if (nombreReservations >= transporteur.nombrePlaces) {
      return res.status(400).json({
        success: false,
        message: `Bus complet pour l'heure ${heureDepart}. Veuillez choisir une autre heure de départ.`,
        placesDisponibles: 0,
      });
    }

    const fraisPlateforme = parseInt(process.env.PLATFORM_FEE_BILLETTERIE) || 300;
    const montantTotal = tarif + fraisPlateforme;

    // Créer la réservation
    const booking = await Booking.create({
      client: req.user._id,
      route: routeId,
      transporteur: transporteurId,
      villeDepart,
      villeArrivee,
      dateVoyage: new Date(dateVoyage),
      heureDepart,
      numeroPlace,
      tarif,
      fraisPlateforme,
      montantTotal,
      methodePaiement,
      statut: 'confirmé',
      statutPaiement: 'payé',
    });

    await booking.populate('transporteur');
    await booking.populate('route');
    await createTransaction({
       userId: req.user._id,
       type: 'paiement_billet',
       montant: -montantTotal, // débit
       description: `Billet ${villeDepart} → ${villeArrivee}`,
       methodePaiement,
       refBooking: booking._id,
    });

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: booking,
      placesRestantes: transporteur.nombrePlaces - nombreReservations - 1,
    });
  } catch (error) {
    console.error('❌ Erreur création réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Obtenir les réservations de l'utilisateur connecté
 * @access  Private
 */
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ client: req.user._id })
      .populate('transporteur')
      .populate('route')
      .sort('-dateReservation');

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('❌ Erreur récupération réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Obtenir les détails d'une réservation
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'nom prenom telephone')
      .populate('transporteur')
      .populate('route');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (booking.client._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('❌ Erreur récupération réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Annuler une réservation
 * @access  Private
 */
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée',
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (booking.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    if (booking.statut === 'annulé') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation est déjà annulée',
      });
    }

    if (booking.statut === 'terminé') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une réservation terminée',
      });
    }

    // Vérifier délai d'annulation (2h avant départ)
    const now = new Date();
    const voyageDate = new Date(booking.dateVoyage);
    const [heures, minutes] = booking.heureDepart.split(':');
    voyageDate.setHours(parseInt(heures), parseInt(minutes));
    
    const diffHours = (voyageDate - now) / (1000 * 60 * 60);
    
    if (diffHours < 2) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler moins de 2 heures avant le départ',
      });
    }

    booking.statut = 'annulé';
    booking.dateAnnulation = new Date();
    booking.raisonAnnulation = req.body.raison || 'Annulation client';
    await booking.save();

    await createTransaction({
       userId: req.user._id,
       type: 'remboursement',
       montant: booking.montantTotal, // crédit
       description: `Remboursement billet ${booking.villeDepart} → ${booking.villeArrivee}`,
       refBooking: booking._id,
    });


    res.json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: booking,
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