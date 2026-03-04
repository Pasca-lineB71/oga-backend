import mongoose from 'mongoose';

const transporteurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['bus', 'minibus', 'voiture'],
    default: 'bus',
  },
  nombrePlaces: {
    type: Number,
    required: true,
  },
  telephone: {
    type: String,
  },
  email: {
    type: String,
  },
  logo: {
    type: String,
  },
  actif: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Transporteur', transporteurSchema);