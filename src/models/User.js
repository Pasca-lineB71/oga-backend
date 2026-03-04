import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nom:       { type: String, required: true },
  prenom:    { type: String, required: true },
  telephone: { type: String, sparse: true, default: null },  // optionnel (Google login n'en a pas)
  email:     { type: String, unique: true, sparse: true },
  password:  { type: String, default: '' },                  // optionnel (Google login n'a pas de mot de passe)
  role:      { type: String, default: 'client' },
  googleId:  { type: String, sparse: true },                 // pour la connexion Google
}, { timestamps: true });

export default mongoose.model('User', userSchema);