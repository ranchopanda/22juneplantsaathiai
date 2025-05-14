import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Image as ImageIcon } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = isMobileDevice();

  useEffect(() => {
    if (isMobile && fullscreen) startCamera();
    return () => {
      if (stream) stopCameraStream(stream);
    };
  }, [stream, isMobile, fullscreen]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);
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
      const blob = await capturePhoto(videoRef.current);
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      stopCamera();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to capture image";
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) stopCameraStream(stream);
    setStream(null);
    setIsActive(false);
  };

  const containerClasses = `overflow-hidden w-full max-w-full camera-container ${fullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'rounded-2xl shadow-xl backdrop-blur-md border border-white/10'}`;

  return (
    <Card className={containerClasses}>
      {fullscreen && onClose && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full"
            onClick={onClose}
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
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
              >
                <Lottie animationData={loaderAnimation} className="w-24 h-24" />
              </motion.div>
            )}
          </AnimatePresence>

          {isActive ? (
            <>
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
                  onClick={stopCamera}
                  className="p-4 bg-white/10 text-white rounded-full backdrop-blur-md"
                >
                  <X className="h-6 w-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={takePicture}
                  className="p-4 bg-kisan-green hover:bg-kisan-green-dark text-white rounded-full shadow-lg"
                >
                  <Lottie animationData={cameraAnimation} className="h-8 w-8" loop={false} />
                </motion.button>
              </div>
            </>
          ) : (
            <div className="p-6 flex flex-col items-center space-y-5">
              {error && (
                <div className="text-red-500 text-sm mb-2 p-4 bg-red-50 rounded-md w-full">
                  {error}
                  <p className="mt-2 text-gray-600">You can upload an image instead:</p>
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
                      className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-kisan-green hover:bg-kisan-green-dark cursor-pointer w-full md:w-auto"
                    >
                      <ImageIcon className="mr-2 h-5 w-5" /> Upload Image
                    </label>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row w-full sm:space-x-4 space-y-3 sm:space-y-0">
                <Button
                  size="lg"
                  className="bg-kisan-green hover:bg-kisan-green-dark w-full py-6 text-base"
                  onClick={startCamera}
                >
                  <Camera className="mr-2 h-5 w-5" /> Open Camera
                </Button>
                {onClose && !fullscreen && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={onClose}
                    className="w-full py-6 text-base"
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
