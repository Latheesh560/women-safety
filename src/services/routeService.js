const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export const routeService = {
  /**
   * Geocode a place name to coordinates using Nominatim
   */
  async getCoordinates(place) {
    // Check if the place is already coordinates (e.g. "lat, lon" or "lat,lon")
    const coordRegex = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/;
    const match = place.trim().match(coordRegex);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lon: parseFloat(match[2]),
        displayName: 'Specified Location'
      };
    }

    const response = await fetch(`${NOMINATIM_URL}?format=json&q=${encodeURIComponent(place)}&accept-language=en`, {
      headers: {
        'User-Agent': 'WomenSafetyApp/1.0'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    throw new Error('Location not found');
  },

  /**
   * Get driving route from OpenRouteService
   */
  async getRoute(start, end) {
    const apiKey = import.meta.env.VITE_OPENROUTESERVICE_KEY;
    if (!apiKey) {
      throw new Error('OpenRouteService API key not found in .env. Please add VITE_OPENROUTESERVICE_KEY.');
    }
    
    const response = await fetch(`${ORS_URL}?api_key=${apiKey}&start=${start.lon},${start.lat}&end=${end.lon},${end.lat}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch route');
    }
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0];
    }
    throw new Error('Route not found');
  },

  /**
   * Fetch nearby amenities using Overpass API (OpenStreetMap)
   * This makes the safety data REAL and dynamic.
   */
  async getNearbyAmenities(lat, lon, type, radius = 5000) {
    const query = `[out:json];node["amenity"="${type}"](around:${radius},${lat},${lon});out;`;
    try {
      const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
      return [];
    }
  },

  /**
   * Calculate a dynamic safety score based on route conditions and nearby safety infrastructure
   */
  calculateSafetyScore(routeFeature, policeStations, hospitals) {
    let score = 75; // Base score
    
    // 1. Reward for nearby police stations
    if (policeStations.length > 0) {
      score += Math.min(policeStations.length * 5, 15); // Max +15
    }
    
    // 2. Reward for nearby hospitals
    if (hospitals.length > 0) {
      score += Math.min(hospitals.length * 2, 10); // Max +10
    }
    
    // 3. Analyze route distance/duration
    const distance = routeFeature.properties.summary.distance / 1000; // km
    if (distance > 20) {
      score -= 10; // Longer routes are generally riskier at night
    }
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(score, 100));
    
    let riskLevel = 'Moderate Risk';
    let corridorStatus = 'Standard Corridor';
    
    if (score >= 85) {
      riskLevel = 'Highly Safe';
      corridorStatus = 'Secure Corridor';
    } else if (score < 60) {
      riskLevel = 'Unsafe Route';
      corridorStatus = 'Caution Required';
    }
    
    return {
      score,
      riskLevel,
      corridorStatus
    };
  }
};
