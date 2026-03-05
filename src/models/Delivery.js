import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  numeroLivraison: {
    type: String,
    unique: true,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  livreur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  typeLivraison: {
    type: String,
    enum: ['ordinaire', 'pressing'],
    required: true,
  },
  expediteur: {
    nom: { type: String, required: true },
    telephone: { type: String, required: true },
    adresse: { type: String, required: true },
    coordonnees: {
      lat: Number,
      lng: Number,
    },
  },
  destinataire: {
    nom: { type: String, required: true },
    telephone: { type: String, required: true },
    adresse: { type: String, required: true },
    coordonnees: {
      lat: Number,
      lng: Number,
    },
  },
  colis: {
    description: String,
    poids: Number,
    fragile: Boolean,
  },
  instructions: {
    type: String,
  },
  // ✅ typeVehicule : requis mais avec valeur par défaut 'moto' pour livraison ordinaire
  typeVehicule: {
    type: String,
    enum: ['moto', 'tricycle', 'voiture'],
    required: true,
    default: 'moto',
  },
  // ✅ fourgonnette ajoutée dans l'enum
  sousTypeVoiture: {
    type: String,
    enum: ['berline', 'pickup', 'camionnette', 'fourgonnette'],
  },
  // ✅ distance non bloquante (0 si Google Maps indisponible)
  distance: {
    type: Number,
    default: 0,
  },
  dureeEstimee: {
    type: String,
    default: 'N/A',
  },
  tarif: {
    type: Number,
    required: true,
    default: 0,
  },
  fraisPlateforme: {
    type: Number,
    default: 500,
  },
  montantTotal: {
    type: Number,
    required: true,
    default: 500,
  },
  conditionsSpeciales: {
    type: Boolean,
    default: false,
  },
  statut: {
    type: String,
    enum: ['en_attente', 'accepté', 'en_cours', 'livré', 'annulé'],
    default: 'en_attente',
  },
  methodePaiement: {
    type: String,
    enum: ['orange_money', 'moov_money', 'telecel_money', 'carte_bancaire', 'especes'],
    required: true,
  },
  statutPaiement: {
    type: String,
    enum: ['en_attente', 'payé', 'échoué', 'remboursé'],
    default: 'en_attente',
  },
  dateCommande: {
    type: Date,
    default: Date.now,
  },
  dateAcceptation: { type: Date },
  dateDepart: { type: Date },
  dateLivraison: { type: Date },
  dateAnnulation: { type: Date },
  note: { type: Number, min: 1, max: 5 },
  commentaire: { type: String },
}, {
  timestamps: true,
});

// Générer un numéro de livraison automatique
deliverySchema.pre('validate', async function(next) {
  if (!this.numeroLivraison) {
    const count = await mongoose.model('Delivery').countDocuments();
    this.numeroLivraison = `LIV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Delivery', deliverySchema);