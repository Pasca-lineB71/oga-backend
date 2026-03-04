import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Calculer la distance entre deux adresses avec Google Distance Matrix API
 * @param {string} origin - Adresse de départ (ex: "Ouagadougou, Burkina Faso")
 * @param {string} destination - Adresse d'arrivée (ex: "Bobo-Dioulasso, Burkina Faso")
 * @returns {Promise<Object>} - { success, distance (km), duration, distanceText }
 */
export const calculateDistance = async (origin, destination) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ GOOGLE_MAPS_API_KEY non définie dans .env');
      return {
        success: false,
        message: 'Clé API Google Maps manquante',
      };
    }

    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    
    const response = await axios.get(url, {
      params: {
        origins: origin,
        destinations: destination,
        key: GOOGLE_MAPS_API_KEY,
        language: 'fr',
      },
    });

    console.log('📍 Google Maps API Response:', response.data.status);

    if (response.data.status === 'OK') {
      const element = response.data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        const distanceKm = Math.round(element.distance.value / 1000);
        console.log(`✅ Distance calculée: ${distanceKm} km`);
        
        return {
          success: true,
          distance: distanceKm,
          distanceText: element.distance.text,
          duration: element.duration.text,
          durationSeconds: element.duration.value,
        };
      } else {
        console.error('❌ Element status:', element.status);
      }
    } else {
      console.error('❌ API status:', response.data.status);
    }

    return {
      success: false,
      message: 'Impossible de calculer la distance',
    };
  } catch (error) {
    console.error('❌ Erreur Google Maps Distance:', error.message);
    return {
      success: false,
      message: 'Erreur lors du calcul de la distance',
      error: error.message,
    };
  }
};

/**
 * Géocoder une adresse (obtenir latitude et longitude)
 * @param {string} address - Adresse à géocoder
 * @returns {Promise<Object>} - { success, latitude, longitude, formatted_address }
 */
export const geocodeAddress = async (address) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return {
        success: false,
        message: 'Clé API Google Maps manquante',
      };
    }

    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    
    const response = await axios.get(url, {
      params: {
        address: address,
        key: GOOGLE_MAPS_API_KEY,
        language: 'fr',
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      return {
        success: true,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formatted_address: result.formatted_address,
      };
    }

    return {
      success: false,
      message: 'Adresse introuvable',
    };
  } catch (error) {
    console.error('❌ Erreur Google Maps Geocoding:', error.message);
    return {
      success: false,
      message: 'Erreur lors du géocodage',
      error: error.message,
    };
  }
};

/**
 * Calculer le tarif de livraison selon la distance
 * @param {number} distance - Distance en km
 * @param {boolean} conditionsSpeciales - Si conditions spéciales activées
 * @returns {number} - Tarif en FCFA
 */
export const calculateDeliveryPrice = (distance, conditionsSpeciales = false) => {
  const TARIF_SPECIAL     = parseInt(process.env.TARIF_SPECIAL)     || 3000;
  const TARIF_1_4_KM      = parseInt(process.env.TARIF_1_4_KM)      || 1000;
  const TARIF_4_9_KM      = parseInt(process.env.TARIF_4_9_KM)      || 1500; // ✅ Utilise votre variable
  const TARIF_9_PLUS_KM   = parseInt(process.env.TARIF_9_PLUS_KM)   || 2000;

  // Plus de 9 km avec conditions spéciales → 3000 F
  if (distance > 9 && conditionsSpeciales) {
    return TARIF_SPECIAL;
  }

  // Tranches normales
  if (distance >= 1 && distance < 4) {
    return TARIF_1_4_KM;      // 1 000 F
  } else if (distance >= 4 && distance <= 9) {
    return TARIF_4_9_KM;      // 1 500 F (simplifié : 4-9 km)
  } else {
    return TARIF_9_PLUS_KM;   // 2 000 F
  }
};