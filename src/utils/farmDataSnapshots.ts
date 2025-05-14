import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { uploadImageToStorage } from "./storage/supabaseStorage";
import { getUserLocation } from "./geolocation";

// Define the structure of farm data snapshots
export interface FarmDataSnapshot {
  id?: string;
  created_at?: string;
  user_id: string;
  type: string;
  timestamp: string;
  data: any;
  // Flattened fields
  image_url?: string | null;
  crop?: string | null;
  disease?: string | null;
  severity?: string | null;
  confidence?: number | null;
  lat?: number | null;
  lng?: number | null;
}

// Define the structure for structured data
export interface StructuredData {
  type: string;
  crop?: string;
  disease?: string;
  severity?: string;
  confidence?: number;
  image_url?: string;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  // Any additional data
  [key: string]: any;
}

// Use the Database types for better type safety
export type FarmDataSnapshotRow = Database['public']['Tables']['farm_data_snapshots']['Row'];

/**
 * Sanitizes data to prevent circular references in JSON
 * Only includes safe properties from the original object
 */
export const sanitizeDataForStorage = (data: any): any => {
  // Handle null or undefined
  if (data === null || data === undefined) {
    return null;
  }
  
  // Handle primitive types
  if (typeof data !== 'object') {
    return data;
  }
  
  // Handle arrays by mapping each item through sanitization
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForStorage(item));
  }
  
  // Handle objects by creating a new object with sanitized properties
  const sanitizedData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip DOM elements and functions
    if (
      value instanceof HTMLElement ||
      value instanceof Node ||
      typeof value === 'function' ||
      key.startsWith('_') || // Skip private properties
      key.includes('Fiber') || // Skip React Fiber nodes
      key === 'ref' // Skip React refs
    ) {
      continue; 
    }
    
    try {
      // Test if property is JSON-serializable
      JSON.stringify(value);
      sanitizedData[key] = sanitizeDataForStorage(value);
    } catch (error) {
      // If it's not JSON-serializable, convert to string or null
      if (value !== null && value !== undefined) {
        sanitizedData[key] = `[Unserializable: ${typeof value}]`;
      } else {
        sanitizedData[key] = null;
      }
    }
  }
  
  return sanitizedData;
};

/**
 * Save a farm snapshot with structured data
 * @param snapshot The snapshot data
 * @param imageFile Optional image file to upload
 * @returns The saved snapshot data
 */
export const saveFarmSnapshot = async (
  snapshot: Omit<FarmDataSnapshot, "id" | "created_at">,
  imageFile?: File
): Promise<FarmDataSnapshotRow | null> => {
  try {
    // Extract structured data if it exists
    const structuredData: StructuredData | null = snapshot.data?.structuredData || null;
    
    // Prepare the snapshot with sanitized data
    const sanitizedSnapshot: any = {
      ...snapshot,
      data: sanitizeDataForStorage(snapshot.data)
    };
    
    // If we have an image file, upload it to storage
    if (imageFile) {
      try {
        const folderStructure = snapshot.type || 'misc';
        const imageUrl = await uploadImageToStorage(imageFile, snapshot.user_id, folderStructure);
        
        // Add image URL to the structured data
        if (structuredData) {
          structuredData.image_url = imageUrl;
        }
        
        // Add image URL to the flattened fields
        sanitizedSnapshot.image_url = imageUrl;
      } catch (imageError) {
        console.error("Error uploading image:", imageError);
        // Continue even if image upload fails
      }
    } else if (structuredData?.image_url) {
      // Use the image URL from structured data if available
      sanitizedSnapshot.image_url = structuredData.image_url;
    }
    
    // Try to get location data if not already provided
    let locationData = structuredData?.location;
    if (!locationData) {
      try {
        locationData = await getUserLocation();
      } catch (locationError) {
        console.warn("Error getting location:", locationError);
        // Continue even if location retrieval fails
      }
    }
    
    // Add location data to the flattened fields if available
    if (locationData) {
      sanitizedSnapshot.lat = locationData.lat;
      sanitizedSnapshot.lng = locationData.lng;
      
      // Also add to the structured data
      if (structuredData) {
        structuredData.location = {
          lat: locationData.lat,
          lng: locationData.lng
        };
      }
    }
    
    // Add other structured data fields to flattened fields if available
    if (structuredData) {
      if (structuredData.crop) sanitizedSnapshot.crop = structuredData.crop;
      if (structuredData.disease) sanitizedSnapshot.disease = structuredData.disease;
      if (structuredData.severity) sanitizedSnapshot.severity = structuredData.severity;
      if (structuredData.confidence) sanitizedSnapshot.confidence = structuredData.confidence;
      
      // Update the snapshot data with the enriched structured data
      sanitizedSnapshot.data.structuredData = structuredData;
    }
    
    // Save to Supabase
    const { data, error } = await supabase
      .from("farm_data_snapshots")
      .insert(sanitizedSnapshot)
      .select();

    if (error) {
      console.error("Error saving farm snapshot:", error);
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error in saveFarmSnapshot:", error);
    // Return null instead of re-throwing to prevent app crashes
    return null;
  }
};

export const getFarmSnapshots = async (userId: string, type?: string) => {
  try {
    let query = supabase
      .from("farm_data_snapshots")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching farm snapshots:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getFarmSnapshots:", error);
    return []; // Return empty array instead of throwing
  }
};

export const getSnapshotById = async (snapshotId: string) => {
  try {
    const { data, error } = await supabase
      .from("farm_data_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .single();

    if (error) {
      console.error("Error fetching snapshot by ID:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getSnapshotById:", error);
    return null; // Return null instead of throwing
  }
};

/**
 * Create a basic structured data object from analysis data
 * @param analysisData The analysis data to structure
 * @param type The type of data (e.g., 'plant_disease', 'soil_analysis')
 */
export const createStructuredData = (analysisData: any, type: string): StructuredData => {
  const structuredData: StructuredData = {
    type
  };
  
  // Add common fields
  if (analysisData.crop || analysisData.crop_name) {
    structuredData.crop = analysisData.crop || analysisData.crop_name;
  }
  
  // Add type-specific fields
  if (type === 'plant_disease') {
    if (analysisData.disease_name || analysisData.diseaseOrPestName) {
      structuredData.disease = analysisData.disease_name || analysisData.diseaseOrPestName;
    }
    
    if (analysisData.diseaseStageEstimation) {
      structuredData.severity = analysisData.diseaseStageEstimation;
    }
    
    if (analysisData.confidence_score !== undefined) {
      structuredData.confidence = analysisData.confidence_score;
    } else if (analysisData.confidence !== undefined) {
      structuredData.confidence = analysisData.confidence / 100; // Convert percentage to 0-1 scale
    }
  } else if (type === 'soil_analysis') {
    if (analysisData.soil_type) {
      structuredData.soil_type = analysisData.soil_type;
    }
    
    if (analysisData.nutrient_levels) {
      structuredData.nutrient_levels = analysisData.nutrient_levels;
    }
  }
  
  // Add notes if available
  if (analysisData.notes || analysisData.additional_notes) {
    structuredData.notes = analysisData.notes || analysisData.additional_notes;
  }
  
  return structuredData;
};
