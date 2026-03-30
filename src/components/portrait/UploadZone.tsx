"use client";

import React, { useCallback, useState } from "react";
import ImageCropper from "./ImageCropper";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export type ProcessingStage = "idle" | "cropping" | "uploading" | "done" | "error";

export default function UploadZone({
  onFileSelected,
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMB = 10,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!accept.split(",").includes(file.type)) {
      return `Invalid file type. Accepted: ${accept}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Max size: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validation = validateFile(file);
      if (validation) {
        setError(validation);
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setStage("cropping");
    },
    [maxSizeMB, accept]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleCropComplete = (blob: Blob, file: File) => {
    setCroppedBlob(blob);
    setStage("uploading");
    onFileSelected(file);
    setStage("done");
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCroppedBlob(null);
    setStage("idle");
    setError(null);
  };

  const stageLabel: Record<ProcessingStage, string> = {
    idle: "",
    cropping: "Crop your portrait",
    uploading: "Uploading to storage...",
    done: "✅ Ready!",
    error: "❌ Error",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop Zone */}
      {stage === "idle" && (
        <div
          className={`
            relative flex flex-col items-center justify-center
            border-2 border-dashed rounded-xl transition-all cursor-pointer
            ${isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
            }
          `}
          style={{ height: "280px" }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="text-5xl mb-4">📸</div>
          <p className="text-base font-medium text-gray-700">
            {isDragOver ? "Drop image here" : "Drag & drop your portrait"}
          </p>
          <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP · max {maxSizeMB}MB</p>
          <input
            id="file-input"
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Stage indicator */}
      {stage !== "idle" && stage !== "error" && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{stageLabel[stage]}</span>
          {stage !== "done" && (
            <div className="ml-auto animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          )}
        </div>
      )}

      {/* Image Cropper */}
      {stage === "cropping" && previewUrl && (
        <ImageCropper
          image={previewUrl}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          circular={true}
        />
      )}

      {/* Preview after crop */}
      {stage === "done" && croppedBlob && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-600 text-lg">✅</span>
            <div>
              <p className="text-sm font-medium text-green-800">Image ready!</p>
              <p className="text-xs text-green-600">{(croppedBlob.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={handleReset}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Replace
            </button>
          </div>
          <img
            src={URL.createObjectURL(croppedBlob)}
            alt="Preview"
            className="w-48 h-48 object-cover rounded-xl border border-gray-200"
          />
        </div>
      )}
    </div>
  );
}
