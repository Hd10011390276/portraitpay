"use client";

/**
 * FaceApiDetector — Client-side face detection using face-api.js
 *
 * Usage:
 *   <FaceApiDetector onFaceDetected={(descriptor) => console.log(descriptor)} />
 *
 * Renders:
 *   - Canvas overlay on the image showing detected face bounding boxes
 *   - Face detection status
 *   - Produces a 128-d Float32Array face descriptor (from TinyFaceDetector)
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { descriptorToArray } from "@/lib/face";

interface FaceApiDetectorProps {
  image: string | null; // base64 or object URL
  onFaceDetected: (descriptor: number[], box: { x: number; y: number; width: number; height: number }) => void;
  onError?: (message: string) => void;
}

export default function FaceApiDetector({
  image,
  onFaceDetected,
  onError,
}: FaceApiDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number>(0);

  const log = useCallback((msg: string) => {
    console.log(`[FaceApi] ${msg}`);
  }, []);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      if (modelsLoaded) return;
      setLoadingModels(true);
      try {
        // Dynamically import face-api.js to avoid SSR issues
        const faceapi = await import("@vladmandic/face-api");

        const MODEL_URL = "/models"; // Place .tar.gz models in /public/models

        log("Loading face-api.js models from /models...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        log("✅ Models loaded");
        setModelsLoaded(true);
      } catch (err) {
        const msg = `Failed to load face-api models: ${(err as Error).message}`;
        console.error("[FaceApi]", msg);
        setError(msg);
        onError?.(msg);
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, [log, modelsLoaded, onError]);

  // Detect faces in the image
  useEffect(() => {
    if (!image || !modelsLoaded || !canvasRef.current) return;

    const detect = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        const canvas = canvasRef.current!;

        // Size canvas to match image
        const img = new window.Image();
        img.onload = async () => {
          canvas.width = img.offsetWidth;
          canvas.height = img.offsetHeight;

          const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.5,
          });

          const detections = await faceapi.detectAllFaces(img, options);

          setFaceCount(detections.length);

          // Draw boxes
          const ctx = canvas.getContext("2d")!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detections.length === 0) {
            setError("No face detected. Please use a clearer portrait photo.");
            onError?.("No face detected");
            return;
          }

          detections.forEach((det) => {
            const box = det.box;
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            // Label
            ctx.fillStyle = "#3b82f6";
            ctx.fillText(
              `Face (${(det.probability * 100).toFixed(1)}%)`,
              box.x,
              box.y > 20 ? box.y - 5 : box.y + box.height + 15
            );
          });

          // Extract descriptor from the largest/most confident face
          const largest = detections.reduce((a, b) =>
            a.box.area > b.box.area ? a : b
          );

          const aligned = await faceapi.fetchImage(img.src);
          const fullDetection = await faceapi
            .detectSingleFace(aligned, new faceapi.FaceLandmark68Net({}));
              // Note: actually we need faceLandmark68Net to get aligned face
              // For simplicity, use full face detection descriptor
          // Actually let's use detectSingleFace + faceRecognitionNet
          const singleDetection = await faceapi
            .detectSingleFace(aligned, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (singleDetection?.descriptor) {
            setDescriptor(singleDetection.descriptor);
            const arr = descriptorToArray(singleDetection.descriptor);
            onFaceDetected(arr, largest.box);
          } else {
            setError("Could not extract face descriptor");
          }
        };
        img.src = image;
      } catch (err) {
        const msg = `Face detection failed: ${(err as Error).message}`;
        console.error("[FaceApi]", msg);
        setError(msg);
        onError?.(msg);
      }
    };

    detect();
  }, [image, modelsLoaded, onFaceDetected, onError]);

  return (
    <div className="flex flex-col gap-3">
      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        {loadingModels && (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-gray-500">Loading face detection models...</span>
          </>
        )}
        {modelsLoaded && !error && (
          <>
            <span className="text-green-500">●</span>
            <span className="text-gray-600">
              {faceCount === 0 ? "Scanning for faces..." : `${faceCount} face(s) detected`}
            </span>
          </>
        )}
        {error && (
          <>
            <span className="text-red-500">●</span>
            <span className="text-red-600">{error}</span>
          </>
        )}
      </div>

      {/* Canvas overlay hint */}
      {!modelsLoaded && (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
          Face detection models will load automatically from <code className="bg-gray-100 px-1 rounded">/models</code>
          <br />
          <span className="text-xs">Download from: <a href="https://github.com/justadudewhohacks/face-api.js/tree/master/weights" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">face-api.js weights</a></span>
        </div>
      )}

      {descriptor && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
          ✅ Face embedding extracted ({descriptor.length} dimensions)
        </div>
      )}
    </div>
  );
}
