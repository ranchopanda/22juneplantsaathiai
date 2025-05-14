import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Image as ImageIcon, Undo, Maximize } from "lucide-react";
import { requestCameraAccess, stopCameraStream, capturePhoto, isMobileDevice } from "@/utils/cameraUtils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import cameraAnimation from "@/animations/camera.json";
import loaderAnimation from "@/animations/loader.json";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose?: () => void;
  fullscreen?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, fullscreen = false }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = isMobileDevice();

  // Monitor online status
  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isMobile && fullscreen) startCamera();
    return () => {
      if (stream) stopCameraStream(stream);
    };
  }, [stream, isMobile, fullscreen]);

  const triggerHapticFeedback = () => {
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50); // Short vibration
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setPreviewMode(false);
      setCapturedImage(null);
      triggerHapticFeedback();
      
      if (isOffline) {
        toast.warning("You appear to be offline. Camera might not work properly.");
      }
      
      const mediaStream = await requestCameraAccess();
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
    } catch (error: unknown) {
      let errorMessage = "Failed to access camera";
      if (error instanceof Error) {
        if (error.message.includes("denied")) {
          errorMessage = "Camera permission denied. Please enable camera access.";
        } else if (error.message.includes("NotFoundError")) {
          errorMessage = "No camera found. Try another device.";
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
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    if (!videoRef.current || !stream) return;
    
    try {
      triggerHapticFeedback();
      const blob = await capturePhoto(videoRef.current);
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);
      setPreviewMode(true);
      
      // Create file for later use
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Store in component state instead of immediately passing to parent
      // We'll pass it when user confirms in preview mode
      setCapturedFile(file);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to capture image";
      toast.error(errorMessage);
    }
  };
  
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  
  const confirmCapture = () => {
    if (capturedFile) {
      triggerHapticFeedback();
      onCapture(capturedFile);
      stopCamera();
    }
  };
  
  const retakePhoto = () => {
    triggerHapticFeedback();
    setPreviewMode(false);
    setCapturedImage(null);
    setCapturedFile(null);
  };

  const stopCamera = () => {
    if (stream) stopCameraStream(stream);
    setStream(null);
    setIsActive(false);
    setPreviewMode(false);
    setCapturedImage(null);
  };

  const containerClasses = `overflow-hidden w-full max-w-full camera-container ${fullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'rounded-2xl shadow-xl backdrop-blur-md border border-white/10'}`;

  return (
    <Card className={containerClasses}>
      {fullscreen && onClose && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full backdrop-blur-md border border-white/10"
            onClick={() => {
              triggerHapticFeedback();
              onClose?.();
            }}
          >
            <X className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
      
      <CardContent className={`p-0 ${fullscreen ? 'h-screen' : ''}`}>
        <div className="relative h-full">
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50"
              >
                <Lottie animationData={loaderAnimation} className="w-24 h-24" />
                <motion.p 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/80 text-sm mt-4"
                >
                  Initializing camera...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* CAMERA ACTIVE STATE */}
            {isActive && !previewMode && (
              <motion.div
                key="camera-active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <motion.video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`w-full object-cover bg-black ${fullscreen ? 'h-full' : 'h-[300px] md:h-[350px]'}`}
                />
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-40">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      triggerHapticFeedback();
                      stopCamera();
                    }}
                    className="p-4 bg-white/10 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg"
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={takePicture}
                    className="p-5 bg-kisan-green hover:bg-kisan-green-dark text-white rounded-full shadow-xl border border-kisan-green/30"
                  >
                    <Lottie animationData={cameraAnimation} className="h-10 w-10" loop={false} />
                  </motion.button>
                </div>
                
                {isOffline && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md"
                  >
                    ⚠️ Offline mode - Limited functionality
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {/* PREVIEW MODE */}
            {previewMode && capturedImage && (
              <motion.div
                key="preview-mode"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <div className="relative h-full">
                  <motion.img 
                    src={capturedImage}
                    alt="Captured"
                    className={`w-full object-cover bg-black ${fullscreen ? 'h-full' : 'h-[300px] md:h-[350px]'}`}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 25 }}
                  />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-4 right-4"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white bg-black/30 hover:bg-black/50 rounded-full backdrop-blur-md"
                      onClick={() => {
                        triggerHapticFeedback();
                        window.open(capturedImage, '_blank');
                      }}
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </motion.div>
                  
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-40">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={retakePhoto}
                      className="px-5 py-3 bg-white/10 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg flex items-center"
                    >
                      <Undo className="h-5 w-5 mr-2" />
                      <span>Retake</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={confirmCapture}
                      className="px-5 py-3 bg-kisan-green hover:bg-kisan-green-dark text-white rounded-full shadow-xl border border-kisan-green/30 flex items-center"
                    >
                      <span>Use Photo</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* INITIAL STATE OR ERROR STATE */}
            {!isActive && !isLoading && (
              <motion.div
                key="initial-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 flex flex-col items-center space-y-5"
              >
                {error ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mb-2 p-4 bg-red-50 rounded-md w-full border border-red-200"
                  >
                    <div className="flex items-center mb-2">
                      <div className="bg-red-100 p-1 rounded-full mr-2">
                        <X className="h-4 w-4 text-red-500" />
                      </div>
                      <span className="font-medium">{error}</span>
                    </div>
                    <p className="mt-2 text-gray-600">You can upload an image instead:</p>
                    <motion.div 
                      className="mt-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            triggerHapticFeedback();
                            onCapture(e.target.files[0]);
                            onClose?.();
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-kisan-green hover:bg-kisan-green-dark cursor-pointer w-full md:w-auto"
                      >
                        <ImageIcon className="mr-2 h-5 w-5" /> Upload Image
                      </label>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center mb-4 w-full"
                  >
                    <Lottie 
                      animationData={cameraAnimation} 
                      className="w-20 h-20 mb-2"
                    />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Capture a plant image
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      For best results, make sure the plant is well-lit and in focus
                    </p>
                  </motion.div>
                )}
                
                <div className="flex flex-col sm:flex-row w-full sm:space-x-4 space-y-3 sm:space-y-0">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                  >
                    <Button
                      size="lg"
                      className="bg-kisan-green hover:bg-kisan-green-dark w-full py-6 text-base"
                      onClick={startCamera}
                    >
                      <Camera className="mr-2 h-5 w-5" /> Open Camera
                    </Button>
                  </motion.div>
                  
                  {onClose && !fullscreen && (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          triggerHapticFeedback();
                          onClose();
                        }}
                        className="w-full py-6 text-base"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  )}
                </div>
                
                <div className="w-full flex justify-center">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <input
                      id="alt-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          triggerHapticFeedback();
                          onCapture(e.target.files[0]);
                          onClose?.();
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="alt-file-upload"
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-kisan-green hover:text-kisan-green-dark hover:underline cursor-pointer"
                    >
                      <ImageIcon className="mr-1.5 h-4 w-4" /> or upload from device
                    </label>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
