// Location coordinate to name mapper for NER region

interface LocationMapping {
  coords: string;
  city: string;
  state: string;
  fullName: string;
}

const LOCATION_MAPPINGS: LocationMapping[] = [
  // Assam
  { coords: "26.1445,91.7362", city: "Guwahati", state: "Assam", fullName: "Guwahati, Assam" },
  { coords: "26.15,91.74", city: "Guwahati", state: "Assam", fullName: "Guwahati, Assam" },
  { coords: "26.12,91.7", city: "Kamrup", state: "Assam", fullName: "Kamrup, Assam" },
  { coords: "26.125,91.705", city: "Kamrup", state: "Assam", fullName: "Kamrup, Assam" },
  { coords: "26.118,91.703", city: "Kamrup", state: "Assam", fullName: "Kamrup, Assam" },
  { coords: "26.323,91.005", city: "Barpeta", state: "Assam", fullName: "Barpeta, Assam" },
  { coords: "26.3474,92.6869", city: "Nagaon", state: "Assam", fullName: "Nagaon, Assam" },
  { coords: "24.8333,92.7789", city: "Silchar", state: "Assam", fullName: "Silchar, Assam" },
  { coords: "27.4728,94.912", city: "Dibrugarh", state: "Assam", fullName: "Dibrugarh, Assam" },
  { coords: "27.48,94.92", city: "Dibrugarh", state: "Assam", fullName: "Dibrugarh, Assam" },
  { coords: "27.49,95.36", city: "Tinsukia", state: "Assam", fullName: "Tinsukia, Assam" },
  { coords: "26.6338,92.8", city: "Tezpur", state: "Assam", fullName: "Tezpur, Assam" },
  { coords: "26.7509,94.2037", city: "Jorhat", state: "Assam", fullName: "Jorhat, Assam" },
  { coords: "26.52,93.96", city: "Golaghat", state: "Assam", fullName: "Golaghat, Assam" },
  
  // Meghalaya
  { coords: "25.5788,91.8933", city: "Shillong", state: "Meghalaya", fullName: "Shillong, Meghalaya" },
  
  // Add more as needed
];

/**
 * Convert coordinate string to readable location name
 * @param coords - Coordinate string in format "lat,lon"
 * @returns Readable location name or original coords if not found
 */
export const coordsToLocation = (coords: string | undefined): string => {
  if (!coords) return "Unknown Location";
  
  // Normalize coords (remove extra spaces)
  const normalizedCoords = coords.trim();
  
  // Find exact match
  const mapping = LOCATION_MAPPINGS.find(m => m.coords === normalizedCoords);
  if (mapping) {
    return mapping.fullName;
  }
  
  // Find approximate match (within 0.01 degrees ~1km)
  const [lat, lon] = normalizedCoords.split(',').map(Number);
  if (!isNaN(lat) && !isNaN(lon)) {
    const approxMatch = LOCATION_MAPPINGS.find(m => {
      const [mLat, mLon] = m.coords.split(',').map(Number);
      return Math.abs(mLat - lat) < 0.01 && Math.abs(mLon - lon) < 0.01;
    });
    if (approxMatch) {
      return approxMatch.fullName;
    }
  }
  
  // Return coords if no match found
  return coords;
};

/**
 * Extract state from location string
 * @param location - Location string (coords or name)
 * @returns State name or empty string
 */
export const extractState = (location: string | undefined): string => {
  if (!location) return "";
  
  // Check if it's coordinates
  const mapping = LOCATION_MAPPINGS.find(m => m.coords === location.trim());
  if (mapping) {
    return mapping.state;
  }
  
  // Check if state name is in the location string
  const states = ["Assam", "Meghalaya", "Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura", "Sikkim"];
  for (const state of states) {
    if (location.toLowerCase().includes(state.toLowerCase())) {
      return state;
    }
  }
  
  return "";
};

/**
 * Check if location matches filter state
 * @param location - Location string (coords or name)
 * @param filterState - State to filter by
 * @returns true if matches
 */
export const matchesState = (location: string | undefined, filterState: string | undefined): boolean => {
  if (!filterState) return true;
  if (!location) return false;
  
  const state = extractState(location);
  return state.toLowerCase().includes(filterState.toLowerCase());
};

/**
 * Fetch allowed device IDs based on global filter
 * This is the proper way to filter data across all pages
 */
export const getAllowedDeviceIds = async (filter: {
  state?: string | null;
  district?: string | null;
  city?: string | null;
  village?: string | null;
}): Promise<Set<string>> => {
  try {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const params = new URLSearchParams();
    
    if (filter.state) params.append('state', filter.state);
    if (filter.district) params.append('district', filter.district);
    if (filter.city) params.append('city', filter.city);
    if (filter.village) params.append('village', filter.village);
    
    const url = `${API_BASE}/api/locations/devices${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch devices:', response.status);
      return new Set();
    }
    
    const devices = await response.json();
    return new Set(devices.map((d: any) => d.deviceId));
  } catch (error) {
    console.error('Error fetching allowed device IDs:', error);
    return new Set();
  }
};
