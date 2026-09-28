/**
 * MEDISAVE Pune Locality & Deterministic Distance Constants
 * 
 * Community handover localities for Pune with coordinates and PIN codes.
 * Distance calculations are strictly deterministic using the Haversine formula.
 */

export const PUNE_LOCALITIES = [
  {
    name: "Kothrud",
    pinCode: "411038",
    lat: 18.5074,
    lng: 73.8077,
    defaultHandover: "City Pride Kothrud / Vanaz Metro Station",
  },
  {
    name: "Katraj",
    pinCode: "411046",
    lat: 18.4529,
    lng: 73.8652,
    defaultHandover: "Bharati Vidyapeeth Main Gate / Katraj Chowk",
  },
  {
    name: "Hinjewadi",
    pinCode: "411057",
    lat: 18.5913,
    lng: 73.7389,
    defaultHandover: "Hinjewadi Phase 1 Circle / Shivaji Chowk",
  },
  {
    name: "Baner",
    pinCode: "411045",
    lat: 18.5590,
    lng: 73.7868,
    defaultHandover: "Baner High Street / Balewadi Phata",
  },
  {
    name: "Wakad",
    pinCode: "411057",
    lat: 18.5987,
    lng: 73.7668,
    defaultHandover: "Dange Chowk / Datta Mandir Road",
  },
  {
    name: "Aundh",
    pinCode: "411007",
    lat: 18.5602,
    lng: 73.8031,
    defaultHandover: "Parihar Chowk / Medipoint Hospital Corner",
  },
  {
    name: "Shivaji Nagar",
    pinCode: "411005",
    lat: 18.5314,
    lng: 73.8446,
    defaultHandover: "Shivaji Nagar Metro Station Gate 2",
  },
  {
    name: "Swargate",
    pinCode: "411042",
    lat: 18.5018,
    lng: 73.8636,
    defaultHandover: "Swargate Bus Stand Entrance / Sarasbaug Corner",
  },
  {
    name: "Hadapsar",
    pinCode: "411028",
    lat: 18.5089,
    lng: 73.9259,
    defaultHandover: "Gadital Chowk / Hadapsar Bus Depot",
  },
  {
    name: "Viman Nagar",
    pinCode: "411014",
    lat: 18.5679,
    lng: 73.9143,
    defaultHandover: "Phoenix Marketcity Front Plaza / Datta Mandir Chowk",
  },
  {
    name: "Kharadi",
    pinCode: "411014",
    lat: 18.5516,
    lng: 73.9352,
    defaultHandover: "EON IT Park Gate 1 / World Trade Center Corner",
  },
  {
    name: "Magarpatta",
    pinCode: "411028",
    lat: 18.5158,
    lng: 73.9272,
    defaultHandover: "Magarpatta Main North Gate / Destination Center",
  },
  {
    name: "Pimpri",
    pinCode: "411018",
    lat: 18.6279,
    lng: 73.8009,
    defaultHandover: "Dr. D.Y. Patil Hospital Gate / Pimpri Metro",
  },
  {
    name: "Bavdhan",
    pinCode: "411021",
    lat: 18.5167,
    lng: 73.7738,
    defaultHandover: "Chandani Chowk Flyover / Bavdhan Police Chowki",
  },
  {
    name: "Dhayari",
    pinCode: "411041",
    lat: 18.4484,
    lng: 73.8097,
    defaultHandover: "Dhayari Phata / DSK Vishwa Main Gate",
  },
  {
    name: "Pune Station / Camp",
    pinCode: "411001",
    lat: 18.5284,
    lng: 73.8743,
    defaultHandover: "SGS Mall Camp / Pune Railway Station Portico",
  },
  {
    name: "Bibvewadi",
    pinCode: "411037",
    lat: 18.4722,
    lng: 73.8643,
    defaultHandover: "Kedareshwar Mandir / Chintamani Nagar Chowk",
  },
  {
    name: "Pashan",
    pinCode: "411021",
    lat: 18.5385,
    lng: 73.7928,
    defaultHandover: "Pashan Circle / NCL Innovation Park Gate",
  },
];

// Distance threshold boundaries (km)
export const DISTANCE_THRESHOLDS = {
  NEARBY_MAX_KM: 5,
  EXTENDED_MAX_KM: 15,
};

/**
 * Deterministic Haversine distance calculator between two geographic coordinates
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers (1 decimal precision)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Looks up locality by name or PIN code
 * @param {string} localityNameOrPin 
 * @returns {Object|null}
 */
export function findLocality(localityNameOrPin) {
  if (!localityNameOrPin || typeof localityNameOrPin !== "string") {
    const def = PUNE_LOCALITIES[0];
    return {
      ...def,
      coordinates: { latitude: def.lat, longitude: def.lng },
      defaultHandoverPoint: def.defaultHandover,
    };
  }
  const clean = localityNameOrPin.toLowerCase().trim();
  const match = PUNE_LOCALITIES.find(
    (loc) =>
      loc.name.toLowerCase().includes(clean) ||
      clean.includes(loc.name.toLowerCase()) ||
      loc.pinCode === clean
  );
  if (!match) return null;
  return {
    ...match,
    coordinates: { latitude: match.lat, longitude: match.lng },
    defaultHandoverPoint: match.defaultHandover,
  };
}

/**
 * Computes distance and proximity tier between buyer locality and seller locality
 * @param {string|Object} buyerLocality - Name, PIN, or { lat, lng }
 * @param {string|Object} sellerLocality - Name, PIN, or { lat, lng }
 * @returns {{ distanceKm: number|null, tier: 'nearby'|'extended'|'distant', label: string }}
 */
export function getProximityInfo(buyerLocality, sellerLocality) {
  let buyerCoords = null;
  let sellerCoords = null;

  if (typeof buyerLocality === "object" && buyerLocality) {
    if (buyerLocality.lat !== undefined && buyerLocality.lng !== undefined) {
      buyerCoords = { lat: Number(buyerLocality.lat), lng: Number(buyerLocality.lng) };
    } else if (buyerLocality.latitude !== undefined && buyerLocality.longitude !== undefined) {
      buyerCoords = { lat: Number(buyerLocality.latitude), lng: Number(buyerLocality.longitude) };
    }
  }
  
  if (!buyerCoords) {
    const loc = findLocality(buyerLocality);
    if (loc) buyerCoords = { lat: loc.lat, lng: loc.lng };
  }

  if (typeof sellerLocality === "object" && sellerLocality) {
    if (sellerLocality.lat !== undefined && sellerLocality.lng !== undefined) {
      sellerCoords = { lat: Number(sellerLocality.lat), lng: Number(sellerLocality.lng) };
    } else if (sellerLocality.latitude !== undefined && sellerLocality.longitude !== undefined) {
      sellerCoords = { lat: Number(sellerLocality.latitude), lng: Number(sellerLocality.longitude) };
    }
  }
  
  if (!sellerCoords) {
    const loc = findLocality(sellerLocality);
    if (loc) sellerCoords = { lat: loc.lat, lng: loc.lng };
  }

  if (!buyerCoords || !sellerCoords) {
    return {
      distanceKm: null,
      tier: "extended",
      label: "Community exchange",
    };
  }

  const distanceKm = calculateHaversineDistance(
    buyerCoords.lat,
    buyerCoords.lng,
    sellerCoords.lat,
    sellerCoords.lng
  );

  if (distanceKm <= DISTANCE_THRESHOLDS.NEARBY_MAX_KM) {
    return {
      distanceKm,
      tier: "nearby",
      label: `Nearby · ${distanceKm} km`,
    };
  }

  if (distanceKm <= DISTANCE_THRESHOLDS.EXTENDED_MAX_KM) {
    return {
      distanceKm,
      tier: "extended",
      label: `Extended area · ${distanceKm} km`,
    };
  }

  return {
    distanceKm,
    tier: "distant",
    label: `Far from you · ${distanceKm} km`,
  };
}

export default {
  PUNE_LOCALITIES,
  DISTANCE_THRESHOLDS,
  calculateHaversineDistance,
  findLocality,
  getProximityInfo,
};
