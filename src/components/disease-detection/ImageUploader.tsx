import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, RotateCcw, ImageIcon, Eye, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

interface ImageUploaderProps {
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
}

export const ImageUploader = ({ onImageChange, selectedImage }: ImageUploaderProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
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
      setIsMobile(isMobileDevice || window.innerWidth < 768); // Also consider smaller screens as mobile
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      stopCamera();
    };
  }, []);

  // Clean up camera stream when component unmounts or camera is closed
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (!showCamera) {
      stopCamera();
    }
  }, [showCamera]);

  const startCamera = async () => {
    try {
      stopCamera(); // Stop any existing stream
      setCaptureError(null);

      // Check if the MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in your browser");
      }

      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          console.error("Error playing video:", e);
          toast({
            title: "Camera Error",
            description: "Could not start video preview. Please check your permissions.",
            variant: "destructive",
          });
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
      startCamera(); // Restart camera with new facing mode
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Could not create canvas context");
      }
      
      // Make sure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Video stream is not ready yet");
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Generate image data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Create a temporary image element to properly load the image
      const img = new Image();
      img.onload = () => {
        // Create a fake event that mimics a file input change
        if (fileInputRef.current) {
          // Create a temporary file input element to trigger the change
          const tempFileInput = document.createElement('input');
          tempFileInput.type = 'file';
          
          // Fetch the blob from the data URL
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              // Create a File object from the blob
              const fileName = `captured-image-${Date.now()}.jpg`;
              
              // Use the File constructor with the blob
              try {
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                
                // Modern browsers support the DataTransfer API
                if (window.DataTransfer && window.DataTransfer.prototype.items) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  
                  if (fileInputRef.current) {
                    fileInputRef.current.files = dataTransfer.files;
                    
                    // Trigger the change event manually
                    const event = new Event('change', { bubbles: true });
                    fileInputRef.current.dispatchEvent(event);
                    
                    // Also call the handler directly with a synthetic event object
                    onImageChange({
                      target: { files: dataTransfer.files },
                      currentTarget: fileInputRef.current,
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                    
                    // Close the camera
                    setShowCamera(false);
                    toast({
                      title: "Image Captured",
                      description: "Image has been successfully captured",
                      variant: "success",
                    });
                  }
                } else {
                  // Fallback for browsers that don't support DataTransfer
                  // Instead of trying to set the files property directly, set the selectedImage URL
                  onImageChange({
                    target: { 
                      // Use a custom property to pass the image data
                      dataset: { imageUrl: dataUrl },
                      // Empty files to indicate no real file was selected but we have an image
                      files: null
                    },
                    currentTarget: fileInputRef.current,
                  } as unknown as React.ChangeEvent<HTMLInputElement>);
                  
                  setShowCamera(false);
                  toast({
                    title: "Image Captured",
                    description: "Image has been successfully captured",
                    variant: "success",
                  });
                }
              } catch (error) {
                console.error("Error creating file:", error);
                throw new Error("Failed to create image file");
              }
            })
            .catch(error => {
              console.error("Error processing captured image:", error);
              setCaptureError("Failed to process the captured image");
              toast({
                title: "Image Capture Failed",
                description: "Could not process the captured image",
                variant: "destructive",
              });
            })
            .finally(() => {
              setIsCapturing(false);
            });
        }
      };
      
      img.onerror = () => {
        setIsCapturing(false);
        setCaptureError("Failed to load the captured image");
        toast({
          title: "Image Capture Failed",
          description: "Could not load the captured image",
          variant: "destructive",
        });
      };
      
      img.src = dataUrl;
    } catch (error) {
      setIsCapturing(false);
      console.error("Error capturing image:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setCaptureError(errorMessage);
      toast({
        title: "Image Capture Failed",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const clearImage = () => {
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Call onImageChange with an empty event to clear the image
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
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="max-w-full max-h-[70vh] rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
              
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
                  <Image className="h-4 w-4 mr-1.5" />
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
    </div>
  );
};
