/**
 * /portraits/upload — Portrait upload page
 * Supports drag & drop, cropping, and face-api.js face detection
 */

"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/portrait/UploadZone";
import ImageCropper from "@/components/portrait/ImageCropper";

type Stage = "form" | "upload" | "certify" | "done";

export default function UploadPortraitPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("form");
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [portraitId, setPortraitId] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  // Form fields
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    tags: "",
    isPublic: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const computeHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (form.title.length > 200) errs.title = "Title must be under 200 characters";
    if (!croppedFile) errs.image = "Please upload and crop a portrait image";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelected = useCallback(async (file: File) => {
    setCroppedFile(file);
    try {
      const hash = await computeHash(file);
      setImageHash(hash);
    } catch (e) {
      console.error("Hash computation failed:", e);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStage("upload");
    setProgress("Creating portrait record...");

    try {
      // Step 1: Create portrait draft
      const createRes = await fetch("/api/portraits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          category: form.category,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          isPublic: form.isPublic,
        }),
      });

      const createJson = await createRes.json();
      if (!createJson.success) throw new Error(createJson.error);
      const id = createJson.data.id as string;
      setPortraitId(id);
      setProgress("Fetching upload URL...");

      // Step 2: Get presigned S3 URL
      const uploadUrlRes = await fetch(`/api/portraits/${id}/upload`);
      const uploadUrlJson = await uploadUrlRes.json();
      if (!uploadUrlRes.ok) throw new Error(uploadUrlJson.error);

      const { original } = uploadUrlJson.data;

      setProgress("Uploading image to storage...");

      // Step 3: Upload directly to S3
      const s3Res = await fetch(original.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: croppedFile!,
      });

      if (!s3Res.ok) throw new Error("S3 upload failed");

      setProgress("Registering image with portrait...");

      // Step 4: Register image URL in DB
      const registerRes = await fetch(`/api/portraits/${id}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalImageUrl: original.objectUrl,
          thumbnailUrl: original.objectUrl,
          imageHash,
        }),
      });

      const registerJson = await registerRes.json();
      if (!registerJson.success) throw new Error(registerJson.error);

      setProgress("Portrait created successfully!");

      // Redirect to manage page
      setTimeout(() => router.push("/portraits"), 1500);
    } catch (err) {
      console.error("Upload failed:", err);
      setProgress(`❌ Error: ${(err as Error).message}`);
      setTimeout(() => setStage("form"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Upload Portrait</h1>
          <p className="text-xs text-gray-500 mt-0.5">Register a new portrait for blockchain certification</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* ── Image Upload ── */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📸 Portrait Image
            </h2>

            <UploadZone
              onFileSelected={handleFileSelected}
              maxSizeMB={10}
            />

            {errors.image && (
              <p className="mt-2 text-sm text-red-600">{errors.image}</p>
            )}

            {/* Image hash preview */}
            {imageHash && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400">SHA-256 (for on-chain certification):</p>
                <p className="text-xs font-mono text-gray-600 break-all mt-0.5">{imageHash}</p>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 <strong>Tip:</strong> For best results, use a clear frontal portrait with good lighting.
                The image will be cropped to a square and certified on Ethereum Sepolia.
              </p>
            </div>
          </section>

          {/* ── Metadata ── */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📝 Portrait Details
            </h2>

            <div className="flex flex-col gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Official Portrait of Jane Doe"
                  maxLength={200}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    errors.title
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-blue-200 focus:border-blue-300"
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                <p className="mt-0.5 text-xs text-gray-400 text-right">{form.title.length}/200</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description of the portrait..."
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none"
                />
                <p className="mt-0.5 text-xs text-gray-400 text-right">{form.description.length}/2000</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                >
                  <option value="general">General</option>
                  <option value="celebrity">Celebrity / Public Figure</option>
                  <option value="artist">Artist / Creative</option>
                  <option value="athlete">Athlete</option>
                  <option value="business">Business Professional</option>
                  <option value="political">Political Figure</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags <span className="text-xs text-gray-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="actor, entertainment, drama..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
              </div>

              {/* Public toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isPublic ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      form.isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700">Public listing</p>
                  <p className="text-xs text-gray-400">Allow others to discover this portrait</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Submit ── */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={stage === "upload"}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {stage === "upload" ? "Uploading..." : "Create Portrait"}
            </button>

            {stage === "upload" && progress && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span>{progress}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => router.push("/portraits")}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
