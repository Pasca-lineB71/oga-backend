import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  villeDepart: {
    type: String,
    required: [true, 'La ville de départ est requise'],
    trim: true,
  },
  villeArrivee: {
    type: String,
    required: [true, 'La ville d\'arrivée est requise'],
    trim: true,
  },
  distance: {
    type: Number, // en km
    required: true,
  },
  dureeEstimee: {
    type: String, // Format: "4h30"
    required: true,
  },
  tarif: {
    type: Number, // en FCFA
    required: true,
  },
  transporteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transporteur',
    required: true,
  },
  heuresDepart: [{
    type: String, // Format: "06:00"
  }],
  joursActifs: [{
    type: String,
    enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  }],
  actif: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index pour recherche rapide
routeSchema.index({ villeDepart: 1, villeArrivee: 1 });

export default mongoose.model('Route', routeSchema);