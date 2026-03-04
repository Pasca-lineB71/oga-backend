import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  numeroTransaction: {
    type: String,
    unique: true,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['paiement_billet', 'paiement_livraison', 'remboursement', 'recharge'],
    required: true,
  },
  montant: {
    type: Number,
    required: true, // positif = crédit, négatif = débit
  },
  description: {
    type: String,
    required: true,
  },
  statut: {
    type: String,
    enum: ['en_attente', 'reussi', 'echoue', 'rembourse'],
default: 'reussi',
  },
  // Référence optionnelle à la commande liée
  refBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  refDelivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
  },
  methodePaiement: {
    type: String,
    enum: ['orange_money', 'moov_money', 'telecel_money', 'carte_bancaire', 'especes', 'portefeuille'],
  },
  soldeAvant: {
    type: Number,
    required: true,
  },
  soldeApres: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Générer un numéro de transaction automatique
transactionSchema.pre('validate', async function () {
  if (!this.numeroTransaction) {
    const count = await mongoose.model('Transaction').countDocuments();
    this.numeroTransaction = `TXN${String(count + 1).padStart(6, '0')}`;
  }
});

export default mongoose.model('Transaction', transactionSchema);