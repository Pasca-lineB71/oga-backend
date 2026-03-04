import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transporteur from './src/models/Transporteur.js';
import Route from './src/models/Route.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const JOURS_SEMAINE = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const transporteursData = [
  { 
    nom: 'TSR (Transport Sahel Royal)', 
    type: 'bus', 
    nombrePlaces: 70, 
    telephone: '+226 25 30 11 22',
    email: 'contact@tsr.bf',
    actif: true
  },
  { 
    nom: 'STMB (Société de Transport du Mouhoun et de la Boucle)', 
    type: 'bus', 
    nombrePlaces: 60, 
    telephone: '+226 25 97 00 10',
    email: 'info@stmb.bf',
    actif: true
  },
  { 
    nom: 'Rakiéta Transport', 
    type: 'bus', 
    nombrePlaces: 65, 
    telephone: '+226 25 36 00 14',
    email: 'contact@rakieta.bf',
    actif: true
  },
  { 
    nom: 'TCV (Transport Confort Voyageurs)', 
    type: 'minibus', 
    nombrePlaces: 25, 
    telephone: '+226 70 11 22 33',
    email: 'info@tcv.bf',
    actif: true
  },
  { 
    nom: 'Rimkieta Express', 
    type: 'minibus', 
    nombrePlaces: 30, 
    telephone: '+226 76 44 55 66',
    email: 'contact@rimkieta.bf',
    actif: true
  },
];

const buildRoutes = (t) => {
  const [TSR, STMB, Rakieta, TCV, Rimkieta] = t;
  return [
    { villeDepart: 'Ouagadougou', villeArrivee: 'Bobo-Dioulasso', transporteur: TSR._id, tarif: 5000, distance: 360, dureeEstimee: '4h30', heuresDepart: ['06:00','08:00','10:00','14:00','18:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: 'Bobo-Dioulasso', transporteur: Rakieta._id, tarif: 4500, distance: 360, dureeEstimee: '4h30', heuresDepart: ['07:00','11:00','15:00','19:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Bobo-Dioulasso', villeArrivee: 'Ouagadougou', transporteur: TSR._id, tarif: 5000, distance: 360, dureeEstimee: '4h30', heuresDepart: ['06:00','08:00','12:00','16:00','20:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Bobo-Dioulasso', villeArrivee: 'Ouagadougou', transporteur: STMB._id, tarif: 4800, distance: 360, dureeEstimee: '4h30', heuresDepart: ['07:30','13:00','17:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: 'Koudougou', transporteur: TCV._id, tarif: 2000, distance: 100, dureeEstimee: '1h30', heuresDepart: ['07:00','10:00','14:00','17:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: 'Koudougou', transporteur: Rimkieta._id, tarif: 1800, distance: 100, dureeEstimee: '1h30', heuresDepart: ['08:00','12:00','16:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Koudougou', villeArrivee: 'Ouagadougou', transporteur: TCV._id, tarif: 2000, distance: 100, dureeEstimee: '1h30', heuresDepart: ['06:30','09:00','13:00','16:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: 'Ouahigouya', transporteur: STMB._id, tarif: 3000, distance: 180, dureeEstimee: '2h30', heuresDepart: ['07:00','11:00','15:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: 'Ouahigouya', transporteur: Rakieta._id, tarif: 2800, distance: 180, dureeEstimee: '2h30', heuresDepart: ['09:00','13:00'], joursActifs: ['lundi','mercredi','vendredi','samedi'], actif: true },
    { villeDepart: 'Ouahigouya', villeArrivee: 'Ouagadougou', transporteur: STMB._id, tarif: 3000, distance: 180, dureeEstimee: '2h30', heuresDepart: ['06:00','10:00','14:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: 'Banfora', transporteur: TSR._id, tarif: 6000, distance: 440, dureeEstimee: '5h30', heuresDepart: ['06:00','10:00','16:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Banfora', villeArrivee: 'Ouagadougou', transporteur: TSR._id, tarif: 6000, distance: 440, dureeEstimee: '5h30', heuresDepart: ['05:30','09:00','15:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: "Fada N'Gourma", transporteur: Rakieta._id, tarif: 3500, distance: 220, dureeEstimee: '3h00', heuresDepart: ['07:00','12:00','16:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: "Fada N'Gourma", villeArrivee: 'Ouagadougou', transporteur: Rakieta._id, tarif: 3500, distance: 220, dureeEstimee: '3h00', heuresDepart: ['06:00','11:00','15:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: 'Tenkodogo', transporteur: TCV._id, tarif: 2500, distance: 185, dureeEstimee: '2h30', heuresDepart: ['08:00','13:00','17:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Tenkodogo', villeArrivee: 'Ouagadougou', transporteur: TCV._id, tarif: 2500, distance: 185, dureeEstimee: '2h30', heuresDepart: ['07:00','11:00','15:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Ouagadougou', villeArrivee: 'Dédougou', transporteur: STMB._id, tarif: 4000, distance: 230, dureeEstimee: '3h00', heuresDepart: ['07:00','13:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Dédougou', villeArrivee: 'Ouagadougou', transporteur: STMB._id, tarif: 4000, distance: 230, dureeEstimee: '3h00', heuresDepart: ['06:00','12:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Bobo-Dioulasso', villeArrivee: 'Banfora', transporteur: Rimkieta._id, tarif: 2000, distance: 85, dureeEstimee: '1h00', heuresDepart: ['08:00','12:00','16:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Banfora', villeArrivee: 'Bobo-Dioulasso', transporteur: Rimkieta._id, tarif: 2000, distance: 85, dureeEstimee: '1h00', heuresDepart: ['07:00','11:00','15:00'], joursActifs: JOURS_SEMAINE, actif: true },
    { villeDepart: 'Bobo-Dioulasso', villeArrivee: 'Dédougou', transporteur: STMB._id, tarif: 3000, distance: 265, dureeEstimee: '3h30', heuresDepart: ['07:00','14:00'], joursActifs: ['lundi','mercredi','vendredi','dimanche'], actif: true },
    { villeDepart: 'Dédougou', villeArrivee: 'Bobo-Dioulasso', transporteur: STMB._id, tarif: 3000, distance: 265, dureeEstimee: '3h30', heuresDepart: ['06:30','13:00'], joursActifs: ['lundi','mercredi','vendredi','dimanche'], actif: true },
    { villeDepart: 'Koudougou', villeArrivee: 'Dédougou', transporteur: TCV._id, tarif: 2500, distance: 155, dureeEstimee: '2h00', heuresDepart: ['08:00','14:00'], joursActifs: ['mardi','jeudi','samedi'], actif: true },
    { villeDepart: 'Dédougou', villeArrivee: 'Koudougou', transporteur: TCV._id, tarif: 2500, distance: 155, dureeEstimee: '2h00', heuresDepart: ['07:00','13:00'], joursActifs: ['mardi','jeudi','samedi'], actif: true },
  ];
};

const seed = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('🗑️  Suppression des anciennes données...');
    await Transporteur.deleteMany({});
    await Route.deleteMany({});
    console.log('✅ Anciennes données supprimées');

    console.log('📦 Création des transporteurs...');
    const transporteurs = await Transporteur.insertMany(transporteursData);
    console.log(`✅ ${transporteurs.length} transporteurs créés`);

    console.log('🛣️  Création des routes...');
    const routes = await Route.insertMany(buildRoutes(transporteurs));
    console.log(`✅ ${routes.length} routes créées`);

    console.log('\n📋 TRANSPORTEURS :');
    transporteurs.forEach(t => console.log(`  - ${t.nom} (${t.nombrePlaces} places)`));

    console.log('\n🎉 SEED TERMINÉ AVEC SUCCÈS !');
    console.log(`💡 Démarrez le serveur avec: npm run dev\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur seed:', error);
    process.exit(1);
  }
};

seed();