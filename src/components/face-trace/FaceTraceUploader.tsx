"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { descriptorToArray } from "@/lib/face";

export type TraceStage =
  | "idle"
  | "loading-models"
  | "detecting"
  | "tracing"
  | "done"
  | "error";

export interface TraceResult {
  name: string;
  category: string;
  ownershipStatus: "claimed" | "pending" | "unclaimed";
  claimable: boolean;
  similarityScore: number;
  note?: string;
}

interface FaceTraceUploaderProps {
  onResults: (results: TraceResult[]) => void;
  onError: (msg: string) => void;
  onStageChange: (stage: TraceStage) => void;
}

export default function FaceTraceUploader({
  onResults,
  onError,
  onStageChange,
}: FaceTraceUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [stage, setStage] = useState<TraceStage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [detectedFaceCount, setDetectedFaceCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const modelsLoadedRef = useRef(false);

  const setStage_ = useCallback(
    (s: TraceStage) => {
      setStage(s);
      onStageChange(s);
    },
    [onStageChange]
  );

  // Load face-api.js models once
  useEffect(() => {
    if (modelsLoadedRef.current) return;
    modelsLoadedRef.current = true;
    setStage_("loading-models");
    setStatusMsg("Loading face detection models…");

    const loadModels = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        const MODEL_URL = "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setModelsReady(true);
        setStage_("idle");
        setStatusMsg("");
      } catch (err) {
        const msg =
          "Failed to load face detection models. Please download weights to /public/models. See: https://github.com/justadudewhohacks/face-api.js/tree/master/weights";
        console.error("[FaceTrace]", msg, err);
        setStage_("error");
        onError(msg);
      }
    };

    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageLoaded(false);
      setDetectedFaceCount(0);
      setStage_("detecting");
      setStatusMsg("Analyzing face…");
      setProgress(10);
    },
    [setStage_]
  );

  // When previewUrl changes, load image and run detection
  useEffect(() => {
    if (!previewUrl || !modelsReady) return;

    const img = new window.Image();
    img.onload = async () => {
      imageRef.current = img;
      setImageLoaded(true);
      setProgress(30);

      // Draw preview with canvas overlay
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Scale canvas to fit display
      const maxW = 400;
      const scale = Math.min(1, maxW / img.offsetWidth);
      canvas.width = img.offsetWidth * scale;
      canvas.height = img.offsetHeight * scale;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      setProgress(40);
      setStatusMsg("Detecting face landmarks…");

      try {
        const faceapi = await import("@vladmandic/face-api");
        const displayScale = canvas.width / img.offsetWidth;

        const tinyOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        });

        const detections = await faceapi.detectAllFaces(img, tinyOptions);
        setDetectedFaceCount(detections.length);
        setProgress(60);

        if (detections.length === 0) {
          setStage_("error");
          onError("No face detected. Please upload a clearer portrait photo.");
          return;
        }

        if (detections.length > 1) {
          setStage_("error");
          onError(
            `Multiple faces detected (${detections.length}). Please upload an image with exactly one person.`
          );
          return;
        }

        // Draw bounding box
        const det = detections[0];
        const box = det.box;
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(
          box.x * displayScale,
          box.y * displayScale,
          box.width * displayScale,
          box.height * displayScale
        );

        // Label
        ctx.fillStyle = "#6366f1";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(
          `Face ${(det.probability * 100).toFixed(1)}%`,
          box.x * displayScale,
          box.y * displayScale - 6
        );

        setStatusMsg("Extracting face embedding…");
        setProgress(70);

        // Extract 128-d descriptor
        const withLandmarks = await faceapi
          .detectSingleFace(img, tinyOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!withLandmarks?.descriptor) {
          setStage_("error");
          onError("Could not extract face embedding. Try a different image.");
          return;
        }

        setProgress(80);
        setStatusMsg("Querying celebrity database…");
        setStage_("tracing");

        const descriptorArr = descriptorToArray(withLandmarks.descriptor);

        // Send to API
        const res = await fetch("/api/face-trace/trace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ descriptor: descriptorArr, topK: 5, minScore: 0.3 }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error ?? "API error");
        }

        const data = await res.json();
        setProgress(100);
        setStage_("done");
        setStatusMsg("");
        onResults(data.matches ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Detection failed";
        setStage_("error");
        onError(msg);
      }
    };

    img.src = previewUrl;
  }, [previewUrl, modelsReady, setStage_, onError]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleFile(file);
      else onError("Please upload an image file (JPG, PNG, WebP)");
    },
    [handleFile, onError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageLoaded(false);
    setDetectedFaceCount(0);
    setProgress(0);
    setStatusMsg("");
    setStage_("idle");
  };

  const isWorking =
    stage === "loading-models" || stage === "detecting" || stage === "tracing";

  return (
    <div className="flex flex-col gap-5">
      {/* Drop Zone — only show when idle */}
      {stage === "idle" && (
        <div
          className={`
            relative flex flex-col items-center justify-center
            border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none
            ${isDragOver
              ? "border-indigo-500 bg-indigo-50/60 scale-[1.01]"
              : "border-gray-300 bg-gray-50/50 hover:border-indigo-400 hover:bg-gray-100/60"
            }
          `}
          style={{ minHeight: "300px" }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("facetrace-input")?.click()}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50 via-transparent to-purple-50 opacity-60 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
            <div className="text-5xl">🔍</div>
            <p className="text-base font-semibold text-gray-700">
              {isDragOver ? "Drop image here" : "Upload AI-generated face"}
            </p>
            <p className="text-sm text-gray-400">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG · PNG · WebP · max 10 MB
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {["face-api.js vector extraction", "cosine similarity matching", "celebrity DB search"].map(
                (feat) => (
                  <span
                    key={feat}
                    className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-600 font-medium"
                  >
                    {feat}
                  </span>
                )
              )}
            </div>
          </div>

          <input
            id="facetrace-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* Model loading hint */}
      {stage === "loading-models" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="animate-spin h-10 w-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full" />
          <p className="text-sm text-gray-500 font-medium">
            Loading face detection models…
          </p>
          <p className="text-xs text-gray-400">
            Downloading ~5 MB from{" "}
            <code className="bg-gray-100 px-1 rounded">/public/models</code>
          </p>
        </div>
      )}

      {/* Detection progress */}
      {(stage === "detecting" || stage === "tracing") && previewUrl && (
        <div className="flex flex-col gap-4">
          {/* Preview + canvas overlay */}
          <div className="relative w-fit">
            <img
              src={previewUrl}
              alt="Uploaded face"
              className="rounded-xl max-h-72 object-contain border border-gray-200"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full rounded-xl"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{statusMsg}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {detectedFaceCount > 0 && (
            <p className="text-xs text-gray-400 text-center">
              {detectedFaceCount} face{detectedFaceCount > 1 ? "s" : ""} detected
            </p>
          )}
        </div>
      )}

      {/* Done — preview stays with replace button */}
      {stage === "done" && previewUrl && (
        <div className="flex flex-col gap-4">
          <div className="relative w-fit">
            <img
              src={previewUrl}
              alt="Uploaded face"
              className="rounded-xl max-h-72 object-contain border border-gray-200"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full rounded-xl"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>
          <button
            onClick={handleReset}
            className="self-start text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
          >
            ← Trace another image
          </button>
        </div>
      )}

      {/* Error state */}
      {stage === "error" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">{stage === "error" && previewUrl ? "Detection failed" : "Error"}</p>
              <p className="text-xs text-red-600 mt-0.5">{statusMsg}</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
            >
              Try again
            </button>
          </div>
          {previewUrl && (
            <button
              onClick={handleReset}
              className="self-start text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
            >
              ← Upload a different image
            </button>
          )}
        </div>
      )}
    </div>
  );
}
