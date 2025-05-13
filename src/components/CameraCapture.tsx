import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Image as ImageIcon, RefreshCw } from "lucide-react";
import { 
  requestCameraAccess, 
  stopCameraStream, 
  capturePhoto,
  isMobileDevice 
} from "@/utils/cameraUtils";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose?: () => void;
  fullscreen?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  onCapture,
  onClose,
  fullscreen = false
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = isMobileDevice();

  useEffect(() => {
    // Try to auto-start camera on mobile
    if (isMobile && fullscreen) {
      startCamera();
    }
    
    return () => {
      // Clean up stream when component unmounts
      if (stream) {
        stopCameraStream(stream);
      }
    };
  }, [stream, isMobile, fullscreen]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsActive(true);
      
      const mediaStream = await requestCameraAccess();
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
    } catch (error: unknown) {
      console.error("Error starting camera:", error);
      let errorMessage = "Failed to access camera";
      
      if (error instanceof Error) {
        if (error.message.includes("denied")) {
          errorMessage = "Camera permission denied. Please enable camera access in your browser settings.";
        } else if (error.message.includes("NotFoundError")) {
          errorMessage = "No camera found. Please use a device with a camera or upload an image instead.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setIsActive(false);
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: "Upload Instead",
          onClick: () => document.getElementById('file-upload')?.click()
        }
      });
    }
  };

  const takePicture = async () => {
    if (!videoRef.current || !stream) return;
    
    try {
      const blob = await capturePhoto(videoRef.current);
      
      // Convert blob to file
      const file = new File([blob], `capture_${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });
      
      onCapture(file);
      
      // Stop camera after capturing
      stopCamera();
    } catch (error: unknown) {
      console.error("Error taking picture:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to capture image";
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stopCameraStream(stream);
      setStream(null);
    }
    setIsActive(false);
  };
  
  const containerClasses = `
    overflow-hidden w-full max-w-full camera-container
    ${fullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}
  `;

  return (
    <Card className={containerClasses}>
      {fullscreen && onClose && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-50 rounded-full bg-black/30 hover:bg-black/50 text-white border-none"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
      <CardContent className={`p-0 ${fullscreen ? 'h-screen' : ''}`}>
        <div className="relative h-full">
          {isActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full object-cover bg-black ${fullscreen ? 'h-full' : 'h-[300px] md:h-[350px]'}`}
                onCanPlay={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
              />
              
              <div className="camera-footer camera-controls">
                <Button
                  variant="outline"
                  size="lg"
                  className="camera-button camera-button-large"
                  onClick={stopCamera}
                >
                  <X className="h-6 w-6" />
                </Button>
                
                <Button
                  size="lg"
                  className="camera-button camera-button-large"
                  onClick={takePicture}
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 flex flex-col items-center space-y-5">
              {error && (
                <div className="text-red-500 text-sm mb-2 p-4 bg-red-50 rounded-md w-full">
                  {error}
                  <p className="mt-2 text-gray-600">
                    You can upload an image instead:
                  </p>
                  <div className="mt-3">
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onCapture(e.target.files[0]);
                          onClose?.();
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-kisan-green hover:bg-kisan-green-dark cursor-pointer w-full md:w-auto camera-button"
                    >
                      <ImageIcon className="mr-2 h-5 w-5" />
                      Upload Image
                    </label>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row w-full sm:space-x-4 space-y-3 sm:space-y-0 mobile-stack">
                <Button
                  size="lg"
                  className="bg-kisan-green hover:bg-kisan-green-dark w-full py-6 text-base camera-button"
                  onClick={startCamera}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Open Camera
                </Button>
                
                {onClose && !fullscreen && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={onClose}
                    className="w-full py-6 text-base camera-button"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
