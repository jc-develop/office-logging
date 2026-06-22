"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

interface CameraCaptureProps {
  /** Called with the captured base64 data URL, or null when retaken/cleared. */
  onCapture: (image: string | null) => void;
}

const videoConstraints = {
  width: 480,
  height: 360,
  facingMode: "user",
};

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    const shot = webcamRef.current?.getScreenshot();
    if (shot) {
      setImage(shot);
      onCapture(shot);
    }
  }, [onCapture]);

  const retake = useCallback(() => {
    setImage(null);
    onCapture(null);
  }, [onCapture]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[480px] max-w-full aspect-[4/3] overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Captured"
            className="h-full w-full object-cover"
          />
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            mirrored
            videoConstraints={videoConstraints}
            onUserMedia={() => {
              setCameraReady(true);
              setError(null);
            }}
            onUserMediaError={() =>
              setError("Could not access the camera. Check browser permissions.")
            }
            className="h-full w-full object-cover"
          />
        )}

        {!image && !cameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
            Starting camera…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {image ? (
        <button
          type="button"
          onClick={retake}
          className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800"
        >
          Retake photo
        </button>
      ) : (
        <button
          type="button"
          onClick={capture}
          disabled={!cameraReady}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          📷 Capture photo
        </button>
      )}
    </div>
  );
}
