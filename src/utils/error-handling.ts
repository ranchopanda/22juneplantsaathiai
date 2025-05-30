// import { toast } from "@/hooks/use-toast";
// TODO: Move toast notifications to be handled by React components using useToast hook.

interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoff?: boolean;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = { maxAttempts: 3, delayMs: 1000, backoff: true }
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxAttempts) {
        break;
      }
      
      const delay = options.backoff 
        ? options.delayMs * Math.pow(2, attempt - 1)
        : options.delayMs;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // toast({
      //   title: "Retrying...",
      //   description: `Attempt ${attempt} of ${options.maxAttempts}`,
      //   variant: "default",
      // });
    }
  }
  
  throw lastError;
}

export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    // toast({
    //   title: "Error",
    //   description: error.message,
    //   variant: error.recoverable ? "default" : "destructive",
    // });
  } else {
    // toast({
    //   title: "Unexpected Error",
    //   description: "An unexpected error occurred. Please try again.",
    //   variant: "destructive",
    // });
  }
  
  console.error("Error:", error);
}

// Offline support
export const isOnline = () => navigator.onLine;

export function setupOfflineSupport() {
  window.addEventListener('online', () => {
    // toast({
    //   title: "Back Online",
    //   description: "You're back online. Changes will be synced.",
    //   variant: "default",
    // });
  });
  
  window.addEventListener('offline', () => {
    // toast({
    //   title: "Offline Mode",
    //   description: "You're offline. Some features may be limited.",
    //   variant: "default",
    // });
  });
}

// Data persistence
export async function persistData<T>(key: string, data: T): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error("Failed to persist data:", error);
    throw new AppError("Failed to save data", "PERSIST_ERROR");
  }
}

export async function retrieveData<T>(key: string): Promise<T | null> {
  try {
    const serialized = localStorage.getItem(key);
    return serialized ? JSON.parse(serialized) : null;
  } catch (error) {
    console.error("Failed to retrieve data:", error);
    throw new AppError("Failed to load data", "RETRIEVE_ERROR");
  }
}

// Error recovery
export async function recoverFromError<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleError(error);
    return fallback;
  }
}

// Image compression
export async function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new AppError("Failed to create canvas context", "COMPRESS_ERROR"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new AppError("Failed to compress image", "COMPRESS_ERROR"));
            return;
          }
          
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          });
          
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new AppError("Failed to load image", "COMPRESS_ERROR"));
    };
  });
} 