import mongoose from 'mongoose';

const resetCodeSchema = new mongoose.Schema({
  telephone: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('ResetCode', resetCodeSchema);
