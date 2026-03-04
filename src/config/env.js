import dotenv from 'dotenv';
dotenv.config();

const required = ['JWT_SECRET', 'MONGO_URI'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn('?? Variable manquante: ' + key);
  }
}

console.log('? Variables chargees');
