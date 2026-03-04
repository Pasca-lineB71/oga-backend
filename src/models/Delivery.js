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
  typeVehicule: {
    type: String,
    enum: ['moto', 'tricycle', 'voiture'],
    required: true,
  },
  sousTypeVoiture: {
    type: String,
    enum: ['berline', 'pickup', 'camionnette'],
  },
  distance: {
    type: Number, // en km
    required: true,
  },
  dureeEstimee: {
    type: String,
  },
  tarif: {
    type: Number,
    required: true,
  },
  fraisPlateforme: {
    type: Number,
    default: 500,
  },
  montantTotal: {
    type: Number,
    required: true,
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
    enum: ['orange_money', 'moov_money', 'carte_bancaire', 'especes'],
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
  dateAcceptation: {
    type: Date,
  },
  dateDepart: {
    type: Date,
  },
  dateLivraison: {
    type: Date,
  },
  dateAnnulation: {
    type: Date,
  },
  note: {
    type: Number,
    min: 1,
    max: 5,
  },
  commentaire: {
    type: String,
  },
}, {
  timestamps: true,
});

// Générer un numéro de livraison automatique
deliverySchema.pre('save', async function(next) {
  if (!this.numeroLivraison) {
    const count = await mongoose.model('Delivery').countDocuments();
    this.numeroLivraison = `LIV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Delivery', deliverySchema);