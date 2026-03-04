import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ResetCode from '../models/ResetCode.js';
import Notification from '../models/Notification.js';
import { OAuth2Client } from 'google-auth-library';

// Vérifier que JWT_SECRET existe

const JWT_SECRET = process.env.JWT_SECRET;

const googleClient = new OAuth2Client(
  '66428355221-sn77e62jcbkun0c38nsgltt1lt9p62kn.apps.googleusercontent.com'
);


const router = express.Router();

// ========================================
// 🔐 MIDDLEWARE D'AUTHENTIFICATION
// ========================================
export const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Accès non autorisé - Token manquant' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token invalide ou expiré' 
    });
  }
};

// ========================================
// 📝 INSCRIPTION
// ========================================
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, telephone, email, password } = req.body;

    // Validation
    if (!nom || !prenom || !telephone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs obligatoires doivent être remplis' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ telephone });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ce numéro de téléphone est déjà utilisé' 
      });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cet email est déjà utilisé' 
        });
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await User.create({
      nom,
      prenom,
      telephone,
      email: email || null,
      password: hashedPassword,
      role: 'client',
    });

    // Créer notification de bienvenue
    await Notification.create({
      title: 'Bienvenue',
      message: `Bienvenue ${newUser.prenom} ! Merci de rejoindre OGA TECHNOLOGIE.`,
      type: 'info',
      user: newUser._id,
    });

    // Générer le token
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '30d' });

    // Retourner sans le mot de passe
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    res.status(201).json({ 
      success: true, 
      message: 'Inscription réussie', 
      data: { 
        user: userWithoutPassword, 
        token 
      } 
    });
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'inscription',
      error: error.message 
    });
  }
});

// ========================================
// 🔐 CONNEXION CLASSIQUE
// ========================================
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Identifiant et mot de passe requis' 
      });
    }

    // Trouver l'utilisateur (par téléphone ou email)
    const user = await User.findOne({ 
      $or: [
        { telephone: identifier }, 
        { email: identifier }
      ] 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiant ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiant ou mot de passe incorrect' 
      });
    }

    // Générer le token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    // Retourner sans le mot de passe
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({ 
      success: true, 
      message: 'Connexion réussie', 
      data: { 
        user: userWithoutPassword, 
        token 
      } 
    });
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la connexion',
      error: error.message 
    });
  }
});

// ========================================
// 🔵 CONNEXION GOOGLE (SÉCURISÉE)
// ========================================
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Token Google manquant',
      });
    }

    // Vérifier le token auprès de Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: '66428355221-sn77e62jcbkun0c38nsgltt1lt9p62kn.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email manquant dans le profil Google',
      });
    }

    // Chercher ou créer l'utilisateur
    let user = await User.findOne({ email });

    if (!user) {
      // Créer un nouvel utilisateur
      user = await User.create({
        nom: family_name || '',
        prenom: given_name || 'Utilisateur',
        email,
        telephone: null, // Pas de téléphone pour Google login
        password: '', // Pas de mot de passe pour Google login
        role: 'client',
        googleId, // Optionnel : stocker l'ID Google
      });

      // Notification de bienvenue
      await Notification.create({
        title: 'Bienvenue',
        message: `Bienvenue ${user.prenom} ! Merci de rejoindre OGA TECHNOLOGIE via Google.`,
        type: 'info',
        user: user._id,
      });
    }

    // Générer le token JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    // Retourner sans le mot de passe
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({
      success: true,
      message: 'Connexion Google réussie',
      data: { 
        user: userWithoutPassword, 
        token 
      },
    });

  } catch (error) {
    console.error('❌ Erreur Google Login:', error);
    
    // Erreur spécifique pour token invalide
    if (error.message.includes('Token')) {
      return res.status(401).json({
        success: false,
        message: 'Token Google invalide',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion Google',
      error: error.message,
    });
  }
});

// ========================================
// 👤 PROFIL UTILISATEUR
// ========================================
router.get('/profile', authMiddleware, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user.toObject();
  res.json({ 
    success: true, 
    data: userWithoutPassword 
  });
});

// ========================================
// 🔑 RÉINITIALISATION MOT DE PASSE
// ========================================

// Envoi du code de réinitialisation
router.post('/send-reset-code', async (req, res) => {
  try {
    const { telephone } = req.body;

    if (!telephone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Numéro de téléphone requis' 
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findOne({ telephone });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aucun compte associé à ce numéro' 
      });
    }

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Sauvegarder le code (expire dans 10 minutes)
    await ResetCode.findOneAndUpdate(
      { telephone },
      { 
        code, 
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
      },
      { upsert: true, new: true }
    );

    // TODO: Envoyer le code par SMS (intégration SMS à faire)
    console.log(`📱 Code de réinitialisation pour ${telephone}: ${code}`);

    res.json({ 
      success: true, 
      message: 'Code de vérification envoyé',
      debug: { code } // À RETIRER EN PRODUCTION
    });
  } catch (error) {
    console.error('❌ Erreur envoi code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi du code' 
    });
  }
});

// Vérification du code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { telephone, code } = req.body;

    if (!telephone || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Téléphone et code requis' 
      });
    }

    const storedCode = await ResetCode.findOne({ telephone });

    if (!storedCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun code de vérification trouvé' 
      });
    }

    // Vérifier si le code a expiré
    if (Date.now() > storedCode.expiresAt.getTime()) {
      await ResetCode.deleteOne({ telephone });
      return res.status(400).json({ 
        success: false, 
        message: 'Le code a expiré. Demandez un nouveau code.' 
      });
    }

    // Vérifier si le code est correct
    if (storedCode.code !== code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code incorrect' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Code vérifié avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur vérification code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification' 
    });
  }
});

// Réinitialisation du mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { telephone, code, newPassword } = req.body;

    if (!telephone || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont requis' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier le code
    const storedCode = await ResetCode.findOne({ telephone });

    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expiresAt.getTime()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code invalide ou expiré' 
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ telephone });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Supprimer le code utilisé
    await ResetCode.deleteOne({ telephone });

    res.json({ 
      success: true, 
      message: 'Mot de passe réinitialisé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur réinitialisation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la réinitialisation' 
    });
  }
});

export default router;