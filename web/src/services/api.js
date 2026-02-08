const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to geocode city name to coordinates (you'll need this)
async function getCityCoordinates(cityName) {
  // For now, hardcode Norman, Oklahoma
  // Later you can use Google Geocoding API
  const cityCoords = {
    'Norman, Oklahoma': { lat: 35.2226, lng: -97.4395 },
    'Oklahoma City, Oklahoma': { lat: 35.4676, lng: -97.5164 },
  };
  
  return cityCoords[cityName] || { lat: 35.2226, lng: -97.4395 };
}

export async function getSuggestions(userData) {
  try {
    // Get coordinates for the city
    const origin = await getCityCoordinates(userData.city);
    
    // Convert hours to minutes
    const windowMinutes = Math.round(userData.time * 60);
    
    // Map travel mode (you might want to add this to the form)
    const travelMode = userData.travelMode || 'WALK';

    const response = await fetch(`api/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        windowMinutes: windowMinutes,
        origin: origin,
        travelMode: travelMode,
        vibes: userData.vibe,  // This is already an array
        maxTravelMinutes: 15
      })
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