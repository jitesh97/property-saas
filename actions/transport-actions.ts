"use server";

import { ActionResult } from "@/types/actions/actions-types";

export interface Station {
  name: string;
  type: 'railway' | 'subway' | 'tram'; 
  distance: number; // in miles
  lat: number;
  lon: number;
}

export interface TravelTime {
  walking: number; // minutes
  cycling: number; // minutes
  driving: number; // minutes
}

export interface School {
  name: string;
  type: 'primary' | 'secondary';
  distance: number; // in miles
  lat: number;
  lon: number;
}

export interface SchoolData {
  primary: School[];
  secondary: School[];
}

export interface TransportData {
  stations: Station[];
  travelTimes: TravelTime;
}

/**
 * Convert meters to miles
 */
function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Get coordinates for a UK postcode using Nominatim (free)
 */
async function getPostcodeCoordinates(postcode: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&q=${encodeURIComponent(postcode)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Property-SaaS-App'
        }
      }
    );

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting postcode coordinates:', error);
    return null;
  }
}

/**
 * Find nearby railway stations using Nominatim (free)
 */
async function findNearbyStations(lat: number, lon: number): Promise<Station[]> {
  try {
    const radius = 0.05; // Approximately 5km radius
    const bbox = `${lon - radius},${lat - radius},${lon + radius},${lat + radius}`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&q=railway+station&bounded=1&viewbox=${bbox}&limit=50`,
      {
        headers: {
          'User-Agent': 'Property-SaaS-App'
        }
      }
    );

    const data = await response.json();
    const stations: Station[] = [];

    for (const item of data) {
      if (item.class === 'railway' || item.type === 'station') {
        const stationLat = parseFloat(item.lat);
        const stationLon = parseFloat(item.lon);
        const distance = calculateDistance(lat, lon, stationLat, stationLon);
        const distanceInMiles = metersToMiles(distance);

        stations.push({
          name: item.display_name.split(',')[0], // Get station name before first comma
          type: item.type === 'subway' ? 'subway' : item.type === 'tram' ? 'tram' : 'railway',
          distance: Math.round(distanceInMiles * 10) / 10, // Round to 1 decimal place
          lat: stationLat,
          lon: stationLon
        });
      }
    }

    // Sort by distance and return top 3
    return stations
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

  } catch (error) {
    console.error('Error finding nearby stations:', error);
    return [];
  }
}

/**
 * Get travel times using OSRM (free)
 */
async function getTravelTimes(fromLat: number, fromLon: number, toLat: number, toLon: number): Promise<TravelTime> {
  const defaultTimes = { walking: 0, cycling: 0, driving: 0 };
  
  try {
    // Get walking time
    const walkResponse = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${fromLon},${fromLat};${toLon},${toLat}?overview=false&alternatives=false&steps=false`
    );
    
    // Get cycling time  
    const cycleResponse = await fetch(
      `https://router.project-osrm.org/route/v1/bicycle/${fromLon},${fromLat};${toLon},${toLat}?overview=false&alternatives=false&steps=false`
    );
    
    // Get driving time
    const driveResponse = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false&alternatives=false&steps=false`
    );

    const walkData = await walkResponse.json();
    const cycleData = await cycleResponse.json();
    const driveData = await driveResponse.json();

    return {
      walking: walkData.routes?.[0]?.duration ? Math.round(walkData.routes[0].duration / 60) : 0,
      cycling: cycleData.routes?.[0]?.duration ? Math.round(cycleData.routes[0].duration / 60) : 0,
      driving: driveData.routes?.[0]?.duration ? Math.round(driveData.routes[0].duration / 60) : 0,
    };

  } catch (error) {
    console.error('Error getting travel times:', error);
    return defaultTimes;
  }
}

/**
 * Find nearby schools using Nominatim (free)
 */
async function findNearbySchools(lat: number, lon: number): Promise<SchoolData> {
  try {
    const radius = 0.02; // Approximately 2km radius for schools
    const bbox = `${lon - radius},${lat - radius},${lon + radius},${lat + radius}`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&q=school&bounded=1&viewbox=${bbox}&limit=50`,
      {
        headers: {
          'User-Agent': 'Property-SaaS-App'
        }
      }
    );

    const data = await response.json();
    const primary: School[] = [];
    const secondary: School[] = [];

    for (const item of data) {
      if (item.class === 'amenity' && item.type === 'school') {
        const schoolLat = parseFloat(item.lat);
        const schoolLon = parseFloat(item.lon);
        const distance = calculateDistance(lat, lon, schoolLat, schoolLon);
        const distanceInMiles = metersToMiles(distance);

        const schoolName = item.display_name.split(',')[0];
        const lowerName = schoolName.toLowerCase();
        
        // Determine if it's primary or secondary based on name patterns
        const isPrimary = lowerName.includes('primary') || 
                         lowerName.includes('infant') || 
                         lowerName.includes('junior') ||
                         lowerName.includes('first') ||
                         lowerName.includes('nursery');
                         
        const isSecondary = lowerName.includes('secondary') || 
                           lowerName.includes('high school') || 
                           lowerName.includes('comprehensive') ||
                           lowerName.includes('academy') ||
                           lowerName.includes('college');

        const school: School = {
          name: schoolName,
          type: isPrimary ? 'primary' : isSecondary ? 'secondary' : 'primary', // Default to primary if uncertain
          distance: Math.round(distanceInMiles * 10) / 10,
          lat: schoolLat,
          lon: schoolLon
        };

        if (school.type === 'primary') {
          primary.push(school);
        } else {
          secondary.push(school);
        }
      }
    }

    // Sort by distance and return top 5 of each type
    return {
      primary: primary.sort((a, b) => a.distance - b.distance).slice(0, 5),
      secondary: secondary.sort((a, b) => a.distance - b.distance).slice(0, 5)
    };

  } catch (error) {
    console.error('Error finding nearby schools:', error);
    return { primary: [], secondary: [] };
  }
}

/**
 * Get school data for a postcode
 */
export async function getSchoolDataAction(postcode: string): Promise<ActionResult<SchoolData>> {
  try {
    if (!postcode || postcode.trim().length === 0) {
      return {
        isSuccess: false,
        message: "Postcode is required"
      };
    }

    const trimmedPostcode = postcode.trim().toUpperCase();
    
    // Get coordinates for the postcode
    const coordinates = await getPostcodeCoordinates(trimmedPostcode);
    if (!coordinates) {
      return {
        isSuccess: false,
        message: "Could not find coordinates for the postcode"
      };
    }

    console.log(`Getting school data for ${trimmedPostcode} at ${coordinates.lat}, ${coordinates.lon}`);

    // Find nearby schools
    const schoolData = await findNearbySchools(coordinates.lat, coordinates.lon);
    
    const totalSchools = schoolData.primary.length + schoolData.secondary.length;
    
    if (totalSchools === 0) {
      return {
        isSuccess: false,
        message: "No nearby schools found"
      };
    }

    console.log(`Found ${schoolData.primary.length} primary and ${schoolData.secondary.length} secondary schools near ${trimmedPostcode}`);

    return {
      isSuccess: true,
      message: `Found ${totalSchools} nearby schools`,
      data: schoolData
    };

  } catch (error) {
    console.error('Error in getSchoolDataAction:', error);
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch school data"
    };
  }
}

/**
 * Get transport data for a postcode
 */
export async function getTransportDataAction(postcode: string): Promise<ActionResult<TransportData>> {
  try {
    if (!postcode || postcode.trim().length === 0) {
      return {
        isSuccess: false,
        message: "Postcode is required"
      };
    }

    const trimmedPostcode = postcode.trim().toUpperCase();
    
    // Get coordinates for the postcode
    const coordinates = await getPostcodeCoordinates(trimmedPostcode);
    if (!coordinates) {
      return {
        isSuccess: false,
        message: "Could not find coordinates for the postcode"
      };
    }

    console.log(`Getting transport data for ${trimmedPostcode} at ${coordinates.lat}, ${coordinates.lon}`);

    // Find nearby stations
    const stations = await findNearbyStations(coordinates.lat, coordinates.lon);
    
    if (stations.length === 0) {
      return {
        isSuccess: false,
        message: "No nearby stations found"
      };
    }

    // Get travel times to the closest station
    const closestStation = stations[0];
    const travelTimes = await getTravelTimes(
      coordinates.lat, 
      coordinates.lon, 
      closestStation.lat, 
      closestStation.lon
    );

    console.log(`Found ${stations.length} stations near ${trimmedPostcode}`);
    console.log(`Travel times to ${closestStation.name}: walking ${travelTimes.walking}min, cycling ${travelTimes.cycling}min, driving ${travelTimes.driving}min`);

    return {
      isSuccess: true,
      message: `Found ${stations.length} nearby stations`,
      data: {
        stations,
        travelTimes
      }
    };

  } catch (error) {
    console.error('Error in getTransportDataAction:', error);
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch transport data"
    };
  }
}