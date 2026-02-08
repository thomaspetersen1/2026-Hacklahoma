const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Hardcoded locations for demo
const LOCATIONS = {
  'norman':  { lat: 35.2087, lng: -97.4395, label: 'Norman, OK (Gallogly Hall)' },
  'okc':     { lat: 35.4676, lng: -97.5164, label: 'Oklahoma City, OK' },
  'dallas':  { lat: 32.7767, lng: -96.7970, label: 'Dallas, TX' },
};

// Map frontend transport labels → backend travel modes
const TRANSPORT_MAP = {
  'Car': 'DRIVE',
  'Bike': 'WALK',
  'Walking': 'WALK',
};

// Map frontend hobby labels → backend vibe keywords
// Frontend shows user-friendly labels, backend uses lowercase vibe keys
const HOBBY_TO_VIBE_MAP = {
  'Art & Museums': 'creative',
  'Food & Dining': 'food',
  'Nature & Parks': 'outdoors',
  'Music & Concerts': 'social',      // social events
  'Sports & Fitness': 'active',
  'Shopping': 'creative',             // creative/discovery (NOT generic retail!)
  'Nightlife': 'late-night',
  'Photography': 'outdoors',          // outdoors for scenery
  'History & Culture': 'creative',    // cultural activities
  'Wellness & Spa': 'chill',
  'Coffee & Cafés': 'chill',
  'Books & Reading': 'chill',
  'Tech & Gaming': 'social',          // gaming venues = social
  'Film & Theater': 'creative',
  'Cooking': 'food',
  'Pets & Animals': 'active',         // active/outdoors with animals
};

export function getLocations() {
  return LOCATIONS;
}

export async function getSuggestions(userData) {
  try {
    // Use provided origin, or location key, or default to Norman
    let origin;
    if (userData.origin) {
      origin = userData.origin;
    } else if (userData.location && LOCATIONS[userData.location]) {
      origin = LOCATIONS[userData.location];
    } else {
      origin = LOCATIONS['norman'];
    }

    // Convert hours to minutes
    const windowMinutes = Math.round(userData.time * 60);

    // Map transport label to API travel mode
    const travelMode = TRANSPORT_MAP[userData.transport] || 'WALK';

    // Convert hobby labels to backend vibe keywords
    // userData.vibe can be either array of hobby labels OR array of vibe keywords
    let vibes = userData.vibe || [];
    if (vibes.length > 0 && !['chill', 'social', 'active', 'creative', 'outdoors', 'food', 'late-night', 'surprise'].includes(vibes[0])) {
      // If first item is not a known vibe keyword, assume it's hobby labels
      vibes = vibes.map(hobby => HOBBY_TO_VIBE_MAP[hobby] || hobby).filter(Boolean);
    }
    // Deduplicate vibes
    vibes = [...new Set(vibes)];

    const body = {
      windowMinutes,
      origin: { lat: origin.lat, lng: origin.lng },
      travelMode,
      vibes,
    };

    // Send userId if provided (enables ML personalization)
    if (userData.userId) {
      body.userId = userData.userId;
    }

    console.log('Sending to backend:', body);

    const response = await fetch('/api/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);

    // Return suggestions array
    return data.suggestions || [];
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}