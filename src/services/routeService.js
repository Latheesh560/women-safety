const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export const routeService = {
  async getCoordinates(place) {
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

  async getRoute(start, end, incidents = []) {
    const apiKey = import.meta.env.VITE_OPENROUTESERVICE_KEY;
    if (!apiKey) {
      throw new Error('OpenRouteService API key not found in .env. Please add VITE_OPENROUTESERVICE_KEY.');
    }

    const validIncidents = incidents.filter(inc => !isNaN(parseFloat(inc.lat)) && !isNaN(parseFloat(inc.lon)));
    const polygons = validIncidents.map(inc => {
      const d = 0.001; // ~111 meters
      const lat = parseFloat(inc.lat);
      const lon = parseFloat(inc.lon);
      return [
        [lon - d, lat - d],
        [lon + d, lat - d],
        [lon + d, lat + d],
        [lon - d, lat + d],
        [lon - d, lat - d]
      ];
    });

    const body = {
      coordinates: [[start.lon, start.lat], [end.lon, end.lat]]
    };

    if (polygons.length > 0) {
      body.options = {
        avoid_polygons: {
          type: 'MultiPolygon',
          coordinates: [polygons]
        }
      };
    }

    const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to fetch safe route');
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0];
    }
    throw new Error('Route not found');
  },

  async getNearbyAmenities(lat, lon, type, radius = 5000, retries = 1) {
    const query = `[out:json];node["amenity"="${type}"](around:${radius},${lat},${lon});out;`;
    try {
      const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Overpass API returned ' + response.status);
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, 1000));
        return this.getNearbyAmenities(lat, lon, type, radius, retries - 1);
      }
      console.error(`Failed to fetch ${type}:`, error);
      return [];
    }
  },

  calculateSafetyScore(routeFeature, policeStations, hospitals, incidents = []) {
    let score = 75;

    if (policeStations.length > 0) {
      score += Math.min(policeStations.length * 5, 15);
    }

    if (hospitals.length > 0) {
      score += Math.min(hospitals.length * 2, 10);
    }

    const distance = routeFeature.properties.summary.distance / 1000;
    if (distance > 20) {
      score -= 10;
    }

    if (Array.isArray(incidents) && incidents.length > 0 && routeFeature.geometry?.coordinates?.length > 0) {
      const coords = routeFeature.geometry.coordinates;
      const mid = coords[Math.floor(coords.length / 2)];
      const midLat = mid[1];
      const midLon = mid[0];

      let incidentPenalty = 0;
      incidents.forEach((inc) => {
        const iLat = parseFloat(inc.lat);
        const iLon = parseFloat(inc.lon);
        if (!isNaN(iLat) && !isNaN(iLon)) {
          const approxDistKm = Math.hypot(iLat - midLat, iLon - midLon) * 111;
          if (approxDistKm <= 5) {
            const weight = inc.severity === 'Critical' ? 8 : inc.severity === 'High' ? 5 : inc.severity === 'Medium' ? 3 : 1;
            incidentPenalty += weight;
          }
        }
      });
      score -= Math.min(incidentPenalty, 30);
    }

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
