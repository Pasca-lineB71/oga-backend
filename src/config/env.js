import dotenv from 'dotenv';
dotenv.config();

// Vérifications au démarrage
const required = ['JWT_SECRET', 'MONGO_URI'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Variable d'environnement manquante: ${key}`);
    process.exit(1);
  }
}

console.log('✅ Variables d\'environnement chargées');