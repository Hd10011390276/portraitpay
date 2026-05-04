/**
 * /portraits/upload — Portrait Upload
 *
 * Flow:
 *  1. Upload portrait photo (with crop)
 *  2. Upload ID card front (stored for KYC, used at mint time for face verification)
 *  3. Create portrait record
 *  4. Upload to S3 storage
 *  5. Register URL + save face embedding (for similarity search, NOT identity verification)
 *
 * Note: Face identity verification happens at mint time on the blockchain API, not at upload time.
 */

"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/portrait/UploadZone";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";
import ImageCropper from "@/components/portrait/ImageCropper";
import { descriptorToArray } from "@/lib/face";

type Stage = "form" | "uploading" | "done";

const FACE_EMBEDDING_MODEL_URL = "/models";

// ── Face embedding helpers ─────────────────────────────────────────────
async function extractFaceEmbedding(file: File): Promise<number[]> {
  const faceapi = await import("@vladmandic/face-api");
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(FACE_EMBEDDING_MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(FACE_EMBEDDING_MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(FACE_EMBEDDING_MODEL_URL),
  ]);
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const tinyOptions = new faceapi.TinyFaceDetectorOptions();
  const detections = await faceapi.detectAllFaces(canvas, tinyOptions);
  if (detections.length === 0) throw new Error("No face detected");
  const withDescriptor = await faceapi.detectSingleFace(canvas, tinyOptions).withFaceDescriptor();
  if (!withDescriptor?.descriptor) throw new Error("Could not extract face embedding");
  return descriptorToArray(withDescriptor.descriptor);
}


async function saveFaceEmbedding(portraitId: string, embedding: number[]) {
  const res = await fetch(`/api/portraits/${portraitId}/embedding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embedding }),
  });
  const json = await res.json();
  if (!json.success) console.error("[face-embedding] Save failed:", json.error);
  return json.success;
}

async function computeHash(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── IndexedDB helpers ─────────────────────────────────────────────
const DB_NAME = "portraitpay-local";
function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("portraits")) {
        db.createObjectStore("portraits", { keyPath: "portraitId" });
      }
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function savePortraitLocally(portraitId: string, imageBlob: Blob) {
  const db = await openDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction("portraits", "readwrite");
    tx.objectStore("portraits").put({ portraitId, imageBlob, savedAt: Date.now() });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// ── Component ─────────────────────────────────────────────────────
export default function UploadPortraitPage() {
  const router = useRouter();
  const { t } = useLanguage();

  // ── Stage ─────────────────────────────────────────────────────
  const [stage, setStage] = useState<Stage>("form");
  const [progress, setProgress] = useState("");

  // ── Portrait ─────────────────────────────────────────────────
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);

  // ── ID Card ──────────────────────────────────────────────────
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState<string | null>(null);

  // ── Form ─────────────────────────────────────────────────────
  const [form, setForm] = useState({ title: "", description: "", category: "general", tags: "", isPublic: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Handlers ─────────────────────────────────────────────────
  const handleIdCardFrontChange = useCallback((file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(t.upload?.clickToUploadID ?? "请上传图片文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(t.upload?.idDocSupported ?? "图片大小不能超过 10MB");
      return;
    }
    setIdCardFront(file);
    const preview = URL.createObjectURL(file);
    setIdCardFrontPreview(preview);
  }, []);

  const handleIdCardFrontRemove = useCallback(() => {
    setIdCardFront(null);
    if (idCardFrontPreview) URL.revokeObjectURL(idCardFrontPreview);
    setIdCardFrontPreview(null);
  }, [idCardFrontPreview]);

  const handleFileSelected = useCallback(async (file: File) => {
    setCroppedFile(file);
    setErrors(prev => ({ ...prev, image: "" }));
    try {
      setImageHash(await computeHash(file));
    } catch (e) { console.error(e); }
  }, []);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = t.upload?.titleRequiredError;
    if (form.title.length > 200) errs.title = t.upload?.titleLengthError;
    if (!croppedFile) errs.image = t.upload?.imageRequiredError;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!croppedFile) return;

    setStage("uploading");
    setProgress(t.upload?.creatingPortrait);

    try {
      // 1. Create portrait record
      const createRes = await fetch("/api/portraits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description || undefined, category: form.category, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), isPublic: form.isPublic, imageHash }),
      });
      const createJson = await createRes.json();
      if (!createJson.success) throw new Error(createJson.error);
      const id = createJson.data.id as string;

      // 2. Upload ID card front to R2 (stored for KYC verification at mint time)
      let idCardFrontUrl: string | null = null;
      if (idCardFront) {
        setProgress(t.upload?.uploadingIdDoc);
        const idCardFormData = new FormData();
        idCardFormData.append("image", idCardFront);
        idCardFormData.append("type", "idCardFront");
        const idCardRes = await fetch(`/api/portraits/${id}/upload/direct`, {
          method: "POST",
          body: idCardFormData,
        });
        const idCardJson = await idCardRes.json();
        if (!idCardRes.ok || !idCardJson.success) {
          console.error("[ID card] Upload failed:", idCardJson.error);
        } else {
          idCardFrontUrl = idCardJson.data.idCardFrontUrl ?? idCardJson.data.originalImageUrl;
          sessionStorage.setItem(`idCardFront_${id}`, idCardFrontUrl);
        }
      }

      // 3. Upload portrait to R2 via server proxy (avoids CORS)
      setProgress(t.upload?.uploadingToStorage);
      const uploadFormData = new FormData();
      uploadFormData.append("image", croppedFile);
      const s3Res = await fetch(`/api/portraits/${id}/upload/direct`, {
        method: "POST",
        body: uploadFormData,
      });
      const s3Json = await s3Res.json();
      if (!s3Res.ok || !s3Json.success) {
        const errMsg = s3Json.error || t.upload?.uploadFailed;
        throw new Error(errMsg);
      }
      const originalImageUrl = s3Json.data.originalImageUrl;

      // 3.5 立即做人脸比对（上传肖像+身份证后自动触发）
      if (idCardFrontUrl) {
        setProgress(t.upload?.faceVerifying);
        const verifyRes = await fetch(`/api/portraits/${id}/verify-face`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ originalImageUrl, idCardFrontUrl }),
        });
        const verifyJson = await verifyRes.json();
        if (!verifyRes.ok || !verifyJson.success) {
          throw new Error(verifyJson.error ?? t.upload?.faceVerifyFailed);
        }
        console.log("[face-verify] Passed! Score:", verifyJson.data.verifyScore);
      }

      await savePortraitLocally(id, croppedFile);

      // 4. Register URL
      setProgress(t.upload?.saving);
      const updateRes = await fetch(`/api/portraits/${id}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalImageUrl, imageHash, idCardFrontUrl }),
      });
      const updateJson = await updateRes.json();
      if (!updateRes.ok || !updateJson.success) {
        const msg = updateJson.error || t.upload?.saveFailed?.replace("{status}", String(updateRes.status));
        throw new Error(msg);
      }

      // 5. Save face embedding (for similarity search, not identity verification)
      try {
        setProgress(t.upload?.extractFeatures);
        const embedding = await extractFaceEmbedding(croppedFile);
        await saveFaceEmbedding(id, embedding);
      } catch (embErr) {
        console.error("[face-embedding] Failed to save:", embErr);
      }

      setProgress(t.upload?.uploadSuccess);
      setStage("done");
      setTimeout(() => router.push("/portraits"), 2000);
    } catch (err) {
      console.error("Upload failed:", err);
      setProgress(`${t.upload?.uploadError}: ${(err as Error).message}`);
      setTimeout(() => setStage("form"), 3000);
    }
  };

  // ── Done stage ────────────────────────────────────────────────
  if (stage === "uploading" || stage === "done") {
    return (
      <DashboardShell title={t.upload?.title} subtitle={t.upload?.subtitle}>
        <div className="max-w-3xl">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{stage === "uploading" ? "⏳" : "✅"}</div>
            <h2 className="text-xl font-semibold mb-2">
              {stage === "uploading"
                ? (t.upload?.uploading)
                : (t.upload?.uploadSuccess)}
            </h2>
            <p className="text-gray-500">
              {stage === "uploading"
                ? (t.upload?.savingProgress)
                : (t.upload?.uploadRetryHint)}
            </p>
            {progress && <p className="mt-4 text-sm text-gray-400 font-mono">{progress}</p>}
            {stage === "uploading" && <div className="mt-6 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" /></div>}
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={t.upload?.title} subtitle={t.upload?.subtitle}>
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              🔒 <strong>{t.upload?.uploadTip ? "隐私" : "隐私："}</strong>{t.upload?.uploadTip}
            </p>
          </div>

          {/* Section 1: Portrait */}
          <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              📸 {t.upload?.portraitImage} <span className="text-red-500">*</span>
            </h2>
            <UploadZone
              onFileSelected={handleFileSelected}
              maxSizeMB={10}
              dropzoneText={t.upload?.dropzone || "Drag & drop your portrait"}
              browseText={t.upload?.selectImage || "or click to browse"}
              supportedText={t.upload?.supported || "JPG, PNG, WebP"}
              cropPrompt={t.upload?.cropPrompt || "Crop your portrait"}
              uploadingText={t.upload?.uploading || "Uploading..."}
              imageReadyText={t.upload?.imageReady || "✅ Ready!"}
              imageSizeLabel={t.upload?.imageSize || "Size"}
              replaceText={t.upload?.replaceImage || "Replace"}
            />
            {errors.image && <p className="mt-2 text-sm text-red-600">{errors.image}</p>}
            {imageHash && (
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400">{t.upload?.sha256Label || "SHA-256"}: {imageHash.slice(0, 16)}...</p>
              </div>
            )}
          </section>

          {/* Section 2: ID Card */}
          <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🪪 {t.upload?.idCardSectionTitle}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t.upload?.idCardSectionDesc}
            </p>
            {!idCardFrontPreview ? (
              <label
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                style={{ height: "200px" }}
              >
                <div className="text-4xl mb-3">🪪</div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t.upload?.clickToUploadIdFront}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t.upload?.idDocSupported}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleIdCardFrontChange(file);
                  }}
                />
              </label>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative inline-block">
                  <img
                    src={idCardFrontPreview}
                    alt={t.upload?.idCardFront}
                    className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700"
                    style={{ maxHeight: "200px", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={handleIdCardFrontRemove}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600 transition-colors"
                    title={t.upload?.remove}
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✅ {t.upload?.idFrontUploaded}
                </p>
              </div>
            )}
          </section>

          {/* Section 3: Details */}
          <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">{t.upload?.details}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.upload?.titleRequired} <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(prev => ({ ...prev, title: "" })); }}
                placeholder={t.upload?.titlePlaceholder} maxLength={200}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.upload?.descriptionLabel}</label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t.upload?.descriptionPlaceholder} rows={3} maxLength={2000}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.upload?.categoryLabel}</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <option value="general">{t.upload?.categoryGeneral}</option>
                <option value="celebrity">{t.upload?.categoryCelebrity}</option>
                <option value="artist">{t.upload?.categoryArtist}</option>
                <option value="athlete">{t.upload?.categoryAthlete}</option>
                <option value="business">{t.upload?.categoryBusiness}</option>
                <option value="political">{t.upload?.categoryPolitical}</option>
                <option value="other">{t.upload?.categoryOther}</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPublic ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.isPublic ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.upload?.publicVisible}</p>
                <p className="text-xs text-gray-400">{t.upload?.publicListingDesc}</p>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button type="submit" disabled={(stage as Stage) === "uploading"}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto">
              {(stage as Stage) === "uploading" ? (t.upload?.submitting) : (t.upload?.createPortrait)}
            </button>
            {(stage as Stage) === "uploading" ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span>{progress || t.upload?.uploading}</span>
              </div>
            ) : null}
            <button type="button" onClick={() => router.push("/portraits")}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              {t.upload?.cancel}
            </button>
          </div>

        </form>
      </div>
    </DashboardShell>
  );
}
