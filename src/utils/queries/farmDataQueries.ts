import { supabase } from "@/integrations/supabase/client";
import { FarmDataSnapshotRow } from "../farmDataSnapshots";

/**
 * Get all farm data snapshots with flattened data
 * @param userId The user ID to filter by
 * @param type Optional type filter (e.g., 'plant_disease')
 * @param limit Optional result limit
 * @returns Array of farm data snapshots
 */
export const getFarmDataSnapshots = async (
  userId: string, 
  type?: string, 
  limit?: number
) => {
  try {
    let query = supabase
      .from("farm_data_snapshots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (type) {
      query = query.eq("type", type);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching farm data snapshots:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getFarmDataSnapshots:", error);
    return [];
  }
};

/**
 * Get farm data snapshots for a specific crop
 * @param crop The crop to filter by
 * @param limit Optional result limit
 * @returns Array of farm data snapshots
 */
export const getSnapshotsByCrop = async (crop: string, limit?: number) => {
  try {
    let query = supabase
      .from("farm_data_snapshots")
      .select("*")
      .eq("crop", crop)
      .order("created_at", { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching snapshots by crop:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getSnapshotsByCrop:", error);
    return [];
  }
};

/**
 * Get farm data snapshots for a specific disease
 * @param disease The disease to filter by
 * @param limit Optional result limit
 * @returns Array of farm data snapshots
 */
export const getSnapshotsByDisease = async (disease: string, limit?: number) => {
  try {
    let query = supabase
      .from("farm_data_snapshots")
      .select("*")
      .eq("disease", disease)
      .order("created_at", { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching snapshots by disease:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getSnapshotsByDisease:", error);
    return [];
  }
};

/**
 * Get farm data snapshots within a certain distance of a location
 * @param lat Latitude
 * @param lng Longitude
 * @param radiusKm Radius in kilometers
 * @param limit Optional result limit
 * @returns Array of farm data snapshots
 */
export const getSnapshotsByLocation = async (
  lat: number,
  lng: number,
  radiusKm: number = 10,
  limit?: number
) => {
  try {
    // This uses a simple bounding box approach
    // For more precise distance calculations, you'd use PostGIS or a more complex query
    const latDelta = radiusKm / 111.32; // 1 degree latitude is approximately 111.32 km
    const lngDelta = radiusKm / (111.32 * Math.cos(lat * (Math.PI / 180))); // Adjust for longitude based on latitude
    
    let query = supabase
      .from("farm_data_snapshots")
      .select("*")
      .gte("lat", lat - latDelta)
      .lte("lat", lat + latDelta)
      .gte("lng", lng - lngDelta)
      .lte("lng", lng + lngDelta)
      .order("created_at", { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching snapshots by location:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getSnapshotsByLocation:", error);
    return [];
  }
};

/**
 * Get farm data snapshot counts by crop
 * @returns Object with crop names as keys and counts as values
 */
export const getSnapshotCountsByCrop = async () => {
  try {
    // For this we'd use a Postgres function or a custom query
    // Since we can't use Postgres-specific aggregations here, we'll fetch all and count
    const { data, error } = await supabase
      .from("farm_data_snapshots")
      .select("crop")
      .not("crop", "is", null);
    
    if (error) {
      console.error("Error fetching snapshot counts by crop:", error);
      throw error;
    }
    
    // Count occurrences of each crop
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const crop = item.crop as string;
      counts[crop] = (counts[crop] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error("Error in getSnapshotCountsByCrop:", error);
    return {};
  }
};

/**
 * Get farm data snapshot counts by disease
 * @returns Object with disease names as keys and counts as values
 */
export const getSnapshotCountsByDisease = async () => {
  try {
    const { data, error } = await supabase
      .from("farm_data_snapshots")
      .select("disease")
      .not("disease", "is", null);
    
    if (error) {
      console.error("Error fetching snapshot counts by disease:", error);
      throw error;
    }
    
    // Count occurrences of each disease
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const disease = item.disease as string;
      counts[disease] = (counts[disease] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error("Error in getSnapshotCountsByDisease:", error);
    return {};
  }
}; 