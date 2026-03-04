import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  typeReduction: {
    type: String,
    enum: ['pourcentage', 'montant_fixe'],
    required: true,
  },
  valeurReduction: {
    type: Number,
    required: true, // Ex: 20 pour 20% ou 1000 pour 1000 F
  },
  applicableSur: {
    type: String,
    enum: ['billet', 'livraison', 'les_deux'],
    required: true,
  },
  dateDebut: {
    type: Date,
    required: true,
  },
  dateFin: {
    type: Date,
    required: true,
  },
  actif: {
    type: Boolean,
    default: true,
  },
  // Optionnel : limiter le nombre d'utilisations
  nombreUtilisationsMax: {
    type: Number,
    default: null, // null = illimité
  },
  nombreUtilisations: {
    type: Number,
    default: 0,
  },
  // Créé par quel compagnie/admin
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index pour les promotions actives et non expirées
promotionSchema.index({ actif: 1, dateFin: 1 });

export default mongoose.model('Promotion', promotionSchema);