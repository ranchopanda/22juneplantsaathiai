import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Camera, 
  Upload, 
  X, 
  RotateCcw, 
  ImageIcon, 
  Eye, 
  Image as ImageLucide, 
  AlertTriangle,
  Trash2,
  ImagePlus
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { MagnifierAnalysisAnimation } from "./MagnifierAnalysisAnimation";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
  loading: boolean;
}

export const ImageUploader = ({ onImageChange, selectedImage, loading }: ImageUploaderProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStartTime, setCameraStartTime] = useState(0);
  const [forceReadyTimer, setForceReadyTimer] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const { toast } = useToast();

  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice || window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      stopCamera();
    };
  }, []);

  // Force ready timer
  useEffect(() => {
    if (showCamera && cameraStartTime > 0) {
      const timer = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - cameraStartTime) / 1000);
        setForceReadyTimer(elapsedTime >= 5 ? 5 : elapsedTime);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [showCamera, cameraStartTime]);

  // Clean up camera stream when component unmounts or camera is closed
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setForceReadyTimer(0);
    setCameraStartTime(0);
  };

  useEffect(() => {
    if (!showCamera) {
      stopCamera();
    }
  }, [showCamera]);

  const startCamera = async () => {
    try {
      stopCamera();
      setCaptureError(null);
      setCameraStartTime(Date.now());

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in your browser");
      }

      // Simplified camera constraints
      const constraints = {
        video: {
          facingMode: facingMode,
          // Very basic constraints for maximum compatibility
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      toast({
        title: "Accessing Camera",
        description: "Please allow camera access when prompted",
      });

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          console.error("Error playing video:", e);
          setCaptureError("Could not play video stream. Please try uploading an image instead.");
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown camera error";
      setCaptureError(errorMessage);
      toast({
        title: "Camera Error",
        description: `Could not access the camera: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const toggleCamera = () => {
    if (showCamera) {
      setShowCamera(false);
    } else {
      startCamera();
    }
  };

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
    if (showCamera) {
      startCamera();
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera Not Ready",
        description: "Unable to access camera. Please try again or upload an image.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Could not create canvas context");
      }
      
      // Super basic approach - just use the element dimensions if needed
      canvas.width = video.videoWidth || video.clientWidth || 640;
      canvas.height = video.videoHeight || video.clientHeight || 480;
      
      // Draw the video frame to the canvas - this works even if video isn't fully ready on some devices
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Generate image data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      
      // Process the image
      processImageData(dataUrl);
      
    } catch (error) {
      setIsCapturing(false);
      console.error("Error capturing image:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setCaptureError(errorMessage);
      toast({
        title: "Image Capture Failed",
        description: `Error: ${errorMessage}. Try uploading an image instead.`,
        variant: "destructive",
      });
    }
  };

  // Helper to process the image data once captured
  const processImageData = (dataUrl: string) => {
    // Create a temporary image element
    const img = new window.Image();
    
    img.onload = () => {
      // Convert to a File object via Blob
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const fileName = `captured-image-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          
          // Create a synthetic event
          const syntheticEvent = {
            target: { 
              files: [file] 
            },
            currentTarget: fileInputRef.current,
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          
          // Pass the file to the parent component
          onImageChange(syntheticEvent);
          
          // Close camera and show success
          setShowCamera(false);
          toast({
            title: "Image Captured",
            description: "Image has been successfully captured",
            variant: "success",
          });
        })
        .catch(error => {
          console.error("Error processing image:", error);
          toast({
            title: "Processing Failed",
            description: "Could not process the captured image",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsCapturing(false);
        });
    };
    
    img.onerror = () => {
      setIsCapturing(false);
      toast({
        title: "Image Error",
        description: "Could not load the captured image",
        variant: "destructive",
      });
    };
    
    img.src = dataUrl;
  };

  const clearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageChange({
      target: { files: null }
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    
    toast({
      title: "Image Removed",
      description: "Upload a new image or take another photo.",
      variant: "default",
    });
  };

  return (
    <div className="relative">
      {loading && selectedImage ? (
        <MagnifierAnalysisAnimation imageUrl={selectedImage} />
      ) : (
        <>
          {showCamera ? (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
              {captureError ? (
                <div className="text-center text-white p-4 bg-red-500/20 rounded-lg">
                  <p className="mb-2">Camera Error: {captureError}</p>
                  <Button 
                    onClick={() => {
                      setCaptureError(null);
                      startCamera();
                    }}
                    className="bg-white text-red-500 hover:bg-gray-100"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative w-full max-w-md">
                    {/* Video element */}
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="max-w-full max-h-[70vh] rounded-lg mx-auto bg-gray-900"
                      style={{ minHeight: '200px' }}
                    />
                    
                    {/* Force ready countdown */}
                    {forceReadyTimer > 0 && forceReadyTimer < 5 && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Ready in {5 - forceReadyTimer}s
                      </div>
                    )}
                    
                    {/* Show "Force Capture" button after 5 seconds */}
                    {forceReadyTimer >= 5 && (
                      <div className="absolute top-0 left-0 right-0 bg-green-500/80 text-white text-sm py-1 text-center">
                        Camera Ready
                      </div>
                    )}
                    
                    {/* Hidden canvas for image processing */}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-4 p-4">
                    <Button
                      onClick={switchCamera}
                      variant="outline"
                      className="rounded-full p-3 bg-white/20 text-white hover:bg-white/30"
                      disabled={isCapturing}
                    >
                      <RotateCcw className="h-6 w-6" />
                    </Button>
                    
                    <Button
                      onClick={captureImage}
                      className="rounded-full p-6 bg-white text-kisan-green hover:bg-gray-200"
                      disabled={isCapturing}
                    >
                      {isCapturing ? (
                        <div className="h-12 w-12 rounded-full border-2 border-kisan-green border-t-transparent animate-spin"></div>
                      ) : (
                        <div className="h-12 w-12 rounded-full border-2 border-kisan-green"></div>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => setShowCamera(false)}
                      variant="outline"
                      className="rounded-full p-3 bg-white/20 text-white hover:bg-white/30"
                      disabled={isCapturing}
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                  
                  {/* Upload fallback button */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <Label
                      htmlFor="camera-fallback-upload"
                      className="cursor-pointer flex items-center text-xs text-white/70 hover:text-white"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Camera not working? Upload instead
                      <Input 
                        id="camera-fallback-upload" 
                        type="file" 
                        className="sr-only" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            onImageChange(e);
                            setShowCamera(false);
                          }
                        }}
                        accept="image/*" 
                      />
                    </Label>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {selectedImage ? (
                // Image preview mode
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <ImageLucide className="h-4 w-4 mr-1.5" />
                      Uploaded Image
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearImage}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span className="text-xs">Remove</span>
                    </Button>
                  </div>

                  <Card className="border-2 border-kisan-green/20 dark:border-kisan-green/10 overflow-hidden">
                    <CardContent className="p-0 relative">
                      <img 
                        src={selectedImage} 
                        alt="Uploaded Plant" 
                        className="w-full rounded-md"
                      />
                      <div className="absolute bottom-2 right-2 flex space-x-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="bg-white/80 hover:bg-white text-gray-700 border border-gray-200"
                          onClick={() => window.open(selectedImage, '_blank')}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Fullscreen</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={toggleCamera}
                    >
                      <Camera className="h-4 w-4 mr-1.5" />
                      Take New Photo
                    </Button>
                    
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      Upload New
                      <Input 
                        id="image-upload" 
                        ref={fileInputRef}
                        type="file" 
                        className="sr-only" 
                        onChange={onImageChange} 
                        accept="image/*" 
                      />
                    </Label>
                  </div>
                </div>
              ) : (
                // Upload mode
                <div className="space-y-3">
                  <Label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-1.5" />
                    Upload or Capture Plant Image
                  </Label>
                  <div className="mt-2 flex flex-col justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-600">
                    <div className="space-y-2 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L40 8m0 0v4"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex flex-col sm:flex-row justify-center text-sm text-gray-600 dark:text-gray-300">
                        <Label
                          htmlFor="image-upload"
                          className="relative cursor-pointer rounded-md font-medium text-kisan-green hover:text-kisan-green-dark dark:text-kisan-gold dark:hover:text-kisan-gold-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-kisan-green mx-2"
                        >
                          <span className="flex items-center">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload a file
                          </span>
                          <Input 
                            id="image-upload" 
                            ref={fileInputRef}
                            type="file" 
                            className="sr-only" 
                            onChange={onImageChange} 
                            accept="image/*" 
                          />
                        </Label>
                        <Button
                          type="button"
                          onClick={toggleCamera}
                          className="mt-2 sm:mt-0 mx-2 flex items-center justify-center text-sm font-medium text-white bg-kisan-green hover:bg-kisan-green-dark rounded-md py-2 px-3"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Take Picture
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
