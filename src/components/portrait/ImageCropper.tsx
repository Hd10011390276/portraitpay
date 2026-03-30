"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

interface ImageCropperProps {
  image: string | null; // base64 or object URL
  onCropComplete: (croppedBlob: Blob, croppedFile: File) => void;
  aspectRatio?: number;
  circular?: boolean;
}

export default function ImageCropper({
  image,
  onCropComplete,
  aspectRatio = 1,
  circular = false,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Draw image and crop overlay
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;
    if (!canvas || !ctx || !img || !isReady) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image scaled to fit container
    const scale = Math.min(containerSize.width / naturalSize.width, containerSize.height / naturalSize.height);
    const scaledW = naturalSize.width * scale;
    const scaledH = naturalSize.height * scale;
    const offsetX = (containerSize.width - scaledW) / 2;
    const offsetY = (containerSize.height - scaledH) / 2;

    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

    // Draw darkened overlay outside crop area
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    if (circular) {
      const cx = cropBox.x + cropBox.width / 2;
      const cy = cropBox.y + cropBox.height / 2;
      const r = cropBox.width / 2;

      // Punch hole
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 100, 0, Math.PI * 2);
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fill();
      ctx.restore();

      // Border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Punch rectangular hole
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      ctx.restore();
    }
  }, [cropBox, containerSize, naturalSize, isReady, circular]);

  useEffect(() => {
    if (!image || !containerRef.current) return;
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    setContainerSize({ width, height });

    const img = new window.Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });

      // Initialize crop box centered
      const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
      const scaledW = img.naturalWidth * scale;
      const scaledH = img.naturalHeight * scale;
      const offsetX = (width - scaledW) / 2;
      const offsetY = (height - scaledH) / 2;

      const cropW = Math.min(scaledW, scaledH) * 0.8;
      const cropH = circular ? cropW : cropW / aspectRatio;
      setCropBox({
        x: offsetX + (scaledW - cropW) / 2,
        y: offsetY + (scaledH - cropH) / 2,
        width: cropW,
        height: cropH,
      });

      setIsReady(true);
    };
    img.src = image;
    imageRef.current = img;
  }, [image, circular, aspectRatio]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Drag crop box
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - cropBox.width / 2, rect.width - cropBox.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top - cropBox.height / 2, rect.height - cropBox.height));
    setCropBox((prev) => ({ ...prev, x, y }));
  };

  const onMouseUp = () => setIsDragging(false);

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !isReady) return;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Map crop box back to natural image coordinates
    const scale = Math.min(containerSize.width / naturalSize.width, containerSize.height / naturalSize.height);
    const scaledW = naturalSize.width * scale;
    const scaledH = naturalSize.height * scale;
    const offsetX = (containerSize.width - scaledW) / 2;
    const offsetY = (containerSize.height - scaledH) / 2;

    const natX = (cropBox.x - offsetX) / scale;
    const natY = (cropBox.y - offsetY) / scale;
    const natW = cropBox.width / scale;
    const natH = cropBox.height / scale;

    if (circular) {
      const size = Math.min(natW, natH);
      tempCanvas.width = size;
      tempCanvas.height = size;
      tempCtx.drawImage(
        img,
        natX + (natW - size) / 2,
        natY + (natH - size) / 2,
        size,
        size,
        0,
        0,
        size,
        size
      );
    } else {
      tempCanvas.width = natW;
      tempCanvas.height = natH;
      tempCtx.drawImage(img, natX, natY, natW, natH, 0, 0, natW, natH);
    }

    tempCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "portrait-cropped.jpg", { type: "image/jpeg" });
        onCropComplete(blob, file);
      }
    }, "image/jpeg", 0.92);
  };

  if (!image) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ height: "400px", borderRadius: circular ? "50%" : "8px", overflow: "hidden" }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          ref={imageRef}
          src={image}
          alt="Crop preview"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          width={containerSize.width}
          height={containerSize.height}
          className="absolute inset-0 w-full h-full cursor-move"
          onMouseDown={onMouseDown}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCrop}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Apply Crop
        </button>
        <p className="text-xs text-gray-500">Drag the {circular ? "circle" : "box"} to reposition</p>
      </div>
    </div>
  );
}
