import React, { useEffect } from 'react';

interface CameraViewProps {
  onFrame?: (video: HTMLVideoElement) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const CameraView: React.FC<CameraViewProps> = ({ videoRef }) => {
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Use back camera on mobile
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef]);

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover opacity-80" // Slightly dimmed for UI visibility
      />
    </div>
  );
};

export const captureFrame = (videoElement: HTMLVideoElement): string | null => {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.7);
};