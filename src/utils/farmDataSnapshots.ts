import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Define the structure of farm data snapshots
export interface FarmDataSnapshot {
  id?: string;
  created_at?: string;
  user_id: string;
  type: string;
  timestamp: string;
  data: any;
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

export const saveFarmSnapshot = async (snapshot: Omit<FarmDataSnapshot, "id" | "created_at">) => {
  try {
    // Sanitize the data before saving to prevent circular references
    const sanitizedSnapshot = {
      ...snapshot,
      data: sanitizeDataForStorage(snapshot.data)
    };
    
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
