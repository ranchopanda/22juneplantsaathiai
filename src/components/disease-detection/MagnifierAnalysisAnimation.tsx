import React, { useEffect, useRef, useState } from "react";

interface MagnifierAnalysisAnimationProps {
  imageUrl: string;
  loadingText?: string;
}

const LENS_SIZE = 120;
const ZOOM = 2;
const ANIMATION_INTERVAL = 1200;

export const MagnifierAnalysisAnimation: React.FC<MagnifierAnalysisAnimationProps> = ({ imageUrl, loadingText }) => {
  const [lensPos, setLensPos] = useState({ x: 60, y: 60 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgDims, setImgDims] = useState({ width: 400, height: 300 });

  // Move lens to a random position every interval
  useEffect(() => {
    const moveLens = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const x = Math.random() * (width - LENS_SIZE) + LENS_SIZE / 2;
      const y = Math.random() * (height - LENS_SIZE) + LENS_SIZE / 2;
      setLensPos({ x, y });
    };
    const interval = setInterval(moveLens, ANIMATION_INTERVAL);
    moveLens();
    return () => clearInterval(interval);
  }, []);

  // Get image dimensions
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setImgDims({ width: img.width, height: img.height });
    img.src = imageUrl;
  }, [imageUrl]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-72 bg-gray-100 rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt="Analysing..."
        className="object-contain w-full h-full"
        style={{ maxWidth: 400, maxHeight: 300 }}
      />
      {/* Magnifier Lens */}
      <div
        className="absolute border-4 border-kisan-green rounded-full shadow-lg bg-white/40 backdrop-blur-sm"
        style={{
          left: lensPos.x - LENS_SIZE / 2,
          top: lensPos.y - LENS_SIZE / 2,
          width: LENS_SIZE,
          height: LENS_SIZE,
          pointerEvents: "none",
          boxShadow: "0 4px 24px 0 rgba(33,145,80,0.18)",
          overflow: "hidden",
        }}
      >
        <img
          src={imageUrl}
          alt="Zoom"
          style={{
            position: "absolute",
            left: -(lensPos.x * ZOOM - LENS_SIZE / 2),
            top: -(lensPos.y * ZOOM - LENS_SIZE / 2),
            width: imgDims.width * ZOOM,
            height: imgDims.height * ZOOM,
            objectFit: "contain",
            filter: "contrast(1.1) saturate(1.2)",
            transition: "left 0.7s, top 0.7s",
          }}
        />
        {/* Magnifier handle */}
        <div
          style={{
            position: "absolute",
            bottom: -28,
            left: LENS_SIZE / 2 - 12,
            width: 24,
            height: 40,
            background: "#219150",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(33,145,80,0.18)",
            transform: "rotate(20deg)",
          }}
        />
        {/* AI text on handle */}
        <span
          style={{
            position: "absolute",
            bottom: -12,
            left: LENS_SIZE / 2 - 8,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            transform: "rotate(20deg)",
            letterSpacing: 1,
          }}
        >AI</span>
      </div>
      {/* Loading text */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="text-kisan-green font-semibold text-lg animate-pulse">
          {loadingText || "Analyzing with Plant Saathi AI..."}
        </span>
      </div>
    </div>
  );
}; 