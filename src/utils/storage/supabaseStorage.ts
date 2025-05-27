import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'uploads';

/**
 * Upload an image file to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID (defaults to 'anonymous' if not authenticated)
 * @param folderStructure - Optional subfolder structure (e.g. "crops", "soil")
 * @returns URL of the uploaded file
 */
export const uploadImageToStorage = async (
  file: File,
  userId: string = 'anonymous',
  folderStructure?: string
): Promise<string> => {
  try {
    // Generate a folder path based on the current date
    const now = new Date();
    const datePath = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Structure: uploads/user_id/YYYY-MM-DD/[folderStructure]/file_uuid.ext
    let filePath = `${userId}/${datePath}`;
    
    // Add optional folder structure if provided
    if (folderStructure) {
      filePath += `/${folderStructure}`;
    }
    
    // Extract file extension
    const fileExtension = file.name.split('.').pop() || 'jpg';
    
    // Generate a unique file name with UUID
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${filePath}/${fileName}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      if (process.env.NODE_ENV === "development") {
        if (error instanceof Error) {
          console.error('Error uploading file:', error.message);
        } else {
          console.error('Error uploading file:', JSON.stringify(error, null, 2));
        }
      }
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fullPath);
    
    return publicUrl;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error) {
        console.error('Error in uploadImageToStorage:', error.message);
      } else {
        console.error('Error in uploadImageToStorage:', JSON.stringify(error, null, 2));
      }
    }
    throw error;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The URL of the image to delete
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const storageUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl('').data.publicUrl;
    const filePath = imageUrl.replace(storageUrl, '');
    
    // Delete the file
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);
    
    if (error) {
      if (process.env.NODE_ENV === "development") {
        if (error instanceof Error) {
          console.error('Error deleting file:', error.message);
        } else {
          console.error('Error deleting file:', JSON.stringify(error, null, 2));
        }
      }
      throw error;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error) {
        console.error('Error in deleteImageFromStorage:', error.message);
      } else {
        console.error('Error in deleteImageFromStorage:', JSON.stringify(error, null, 2));
      }
    }
    throw error;
  }
};

/**
 * Convert a File to base64 string for image processing
 * @param file - The file to convert
 * @returns Promise with base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}; 