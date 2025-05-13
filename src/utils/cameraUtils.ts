import { toast } from "sonner";

// Types
export interface CameraOptions {
  onCapture: (blob: Blob) => void;
  onError?: (error: string) => void;
}

// Interface for camera related state
export interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  error: string | null;
}

// Helper to detect mobile devices
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Function to request camera access
export const requestCameraAccess = async (): Promise<MediaStream> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API not available in this environment");
    }
    
    const isMobile = isMobileDevice();
    
    // Use different constraints for mobile vs desktop
    const constraints = {
      video: isMobile ? 
        { 
          facingMode: { ideal: 'environment' }, // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
    };
    
    console.log('Using camera constraints:', constraints);
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    return stream;
  } catch (error: unknown) {
    console.error("Camera access error:", error);
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error("Camera access denied. Please grant permission to use the camera.");
      } else if (error.name === 'NotFoundError') {
        throw new Error("No camera found. Please make sure your device has a camera.");
      } else if (error.name === 'NotReadableError') {
        throw new Error("Camera is in use by another application.");
      } else if (error.name === 'AbortError' || error.name === 'NotSupportedError') {
        // This often happens on iOS Safari and other mobile browsers with restricted camera access
        throw new Error("Your browser doesn't fully support camera access. Try another browser or upload an image instead.");
      }
      throw new Error("Failed to access camera: " + (error.message || "Unknown error"));
    }
    throw new Error("Failed to access camera: Unknown error");
  }
};

// Function to stop camera stream
export const stopCameraStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

// Function to capture photo from video stream
export const capturePhoto = (
  videoElement: HTMLVideoElement | null
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!videoElement) {
      reject(new Error("Video element not found"));
      return;
    }
    
    try {
      const canvas = document.createElement('canvas');
      
      // Get video dimensions
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      
      // Set canvas size to match video
      canvas.width = width;
      canvas.height = height;
      
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Draw the video frame to the canvas
      context.drawImage(videoElement, 0, 0, width, height);
      
      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to capture image"));
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error("Error capturing photo:", error);
      reject(new Error("Failed to capture photo"));
    }
  });
};

// Component for camera UI
export const initializeCamera = async (
  videoRef: React.RefObject<HTMLVideoElement>,
  setStream: (stream: MediaStream | null) => void,
  setError: (error: string | null) => void
): Promise<void> => {
  try {
    const stream = await requestCameraAccess();
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    
    setStream(stream);
    setError(null);
  } catch (error: unknown) {
    console.error("Camera initialization error:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to initialize camera";
    setError(errorMessage);
    setStream(null);
    toast.error(errorMessage);
  }
};
