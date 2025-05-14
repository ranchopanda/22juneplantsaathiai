interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

/**
 * Get the user's current geolocation
 * @returns Promise with the user's location (lat/lng)
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Get the user's location with a fallback to IP-based geolocation
 * @returns Promise with the user's best available location
 */
export const getUserLocation = async (): Promise<GeolocationPosition> => {
  try {
    // Try to get precise GPS location
    return await getCurrentPosition();
  } catch (error) {
    console.warn('Error getting GPS location, falling back to IP geolocation:', error);
    
    try {
      // Fallback to IP-based geolocation using a free API
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lng: data.longitude,
          accuracy: 5000, // IP geolocation is typically accurate to a few kilometers
          timestamp: Date.now()
        };
      }
      
      throw new Error('IP geolocation data incomplete');
    } catch (fallbackError) {
      console.error('IP geolocation also failed:', fallbackError);
      // Default to a generic location (This is just a fallback - in this case New Delhi)
      return {
        lat: 28.6139,
        lng: 77.2090,
        accuracy: 100000, // Very low accuracy since this is a default
        timestamp: Date.now()
      };
    }
  }
}; 