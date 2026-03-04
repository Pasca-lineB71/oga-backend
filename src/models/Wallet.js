import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  solde: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalDepose: {
    type: Number,
    default: 0,
  },
  totalDepense: {
    type: Number,
    default: 0,
  },
  totalRembourse: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Wallet', walletSchema);