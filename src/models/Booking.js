import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  numeroReservation: {
    type: String,
    unique: true,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
  },
  transporteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transporteur',
    required: true,
  },
  villeDepart: {
    type: String,
    required: true,
  },
  villeArrivee: {
    type: String,
    required: true,
  },
  dateVoyage: {
    type: Date,
    required: true,
  },
  heureDepart: {
    type: String,
    required: true,
  },
  numeroPlace: {
    type: Number,
    required: true,
  },
  tarif: {
    type: Number,
    required: true,
  },
  fraisPlateforme: {
    type: Number,
    default: 300,
  },
  montantTotal: {
    type: Number,
    required: true,
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmé', 'annulé', 'terminé', 'reporté'],
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
  qrCode: {
    type: String,
  },
  dateReservation: {
    type: Date,
    default: Date.now,
  },
  dateAnnulation: {
    type: Date,
  },
  raisonAnnulation: {
    type: String,
  },
}, {
  timestamps: true,
});

// Générer un numéro de réservation automatique
// ✅ Par ceci :
bookingSchema.pre('validate', async function () {
  if (!this.numeroReservation) {
    const count = await mongoose.model('Booking').countDocuments();
    this.numeroReservation = `BKG${String(count + 1).padStart(6, '0')}`;
  }
});

export default mongoose.model('Booking', bookingSchema);