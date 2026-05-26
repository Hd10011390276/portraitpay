/**
 * /portraits/upload — Portrait Upload
 *
 * Flow:
 *  1. Upload portrait photo (with crop)
 *  2. Upload ID card front (stored for face verification at mint time)
 *  3. Create portrait record
 *  4. Upload to R2 storage
 *  5. Register URL + save face embedding (for similarity search, NOT identity verification)
 *
 * Note: Face identity verification happens at mint time on the blockchain API, not at upload time.
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/portrait/UploadZone";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";
import ImageCropper from "@/components/portrait/ImageCropper";

type Stage = "form" | "uploading" | "done";

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
  const [portraitCount, setPortraitCount] = useState<number>(0);
  const [countLoaded, setCountLoaded] = useState(false);

  // ── Portrait ─────────────────────────────────────────────────
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);

  // ── ID Card ──────────────────────────────────────────────────
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState<string | null>(null);

  // ── Form ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "", description: "", category: "general", tags: "", isPublic: false,
    idCardType: "", idCardName: "", idCardNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Test account bypass ────────────────────────────────────
  const TEST_ACCOUNTS = ["799096322@qq.com"];
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setUserEmail(json.data?.user?.email || json.user?.email || "");
          setUserRole(json.data?.user?.role || json.user?.role || "");
        }
      } catch {}
    };
    checkAuth();
  }, []);

  const isTestAccount = TEST_ACCOUNTS.includes(userEmail);
  const MAX_PORTRAITS = userRole === "AGENT" ? 50 : 5;

  // ── Portrait count check ─────────────────────────────────────
  useEffect(() => {
    const checkCount = async () => {
      try {
        const res = await fetch("/api/portraits?limit=1", { credentials: "include" });
        const json = await res.json();
        if (json.success) setPortraitCount(json.meta?.total ?? 0);
      } catch { /* non-fatal */ }
      setCountLoaded(true);
    };
    checkCount();
  }, []);

  if (countLoaded && portraitCount >= MAX_PORTRAITS && !isTestAccount) {
    return (
      <DashboardShell title={t.upload?.title} subtitle={t.upload?.subtitle}>
        <div className="max-w-3xl">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Maximum Portrait Limit Reached</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">You can only upload up to {MAX_PORTRAITS} portraits. You currently have {portraitCount}.</p>
            <button
              onClick={() => router.push("/portraits")}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to My Portraits
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────
  const handleIdCardFrontChange = useCallback((file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(t.upload?.clickToUploadID ?? "Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(t.upload?.idDocSupported ?? "Image size must be under 10MB");
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
    if (!idCardFront) errs.idCardFront = t.upload?.idCardRequiredError ?? "Please upload your ID card photo";
    if (!form.idCardType) errs.idCardType = t.upload?.idCardTypeRequired ?? "Please select ID type";
    if (!form.idCardName.trim()) errs.idCardName = t.upload?.idCardNameRequired ?? "Please enter your name as on ID card";
    if (!form.idCardNumber.trim()) errs.idCardNumber = t.upload?.idCardNumberRequired ?? "Please enter your ID card number";
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
      const idCardHash = await computeHash(idCardFront!);
      const createRes = await fetch("/api/portraits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          category: form.category,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          isPublic: form.isPublic,
          imageHash,
          idCardType: form.idCardType,
          idCardName: form.idCardName,
          idCardNumber: form.idCardNumber,
          idCardFrontHash: idCardHash,
        }),
      });
      const createJson = await createRes.json();
      if (!createJson.success) throw new Error(createJson.error);
      const id = createJson.data.id as string;

      // 2. Upload ID card front to R2 (stored for face verification at mint time)
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
          idCardFrontUrl = idCardJson.data.idCardFrontUrl ?? idCardJson.data.originalImageUrl ?? "";
          if (idCardFrontUrl) sessionStorage.setItem(`idCardFront_${id}`, idCardFrontUrl);
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
              🔒 <strong>{t.upload?.privacyLabel || "Privacy"}:</strong> {t.upload?.uploadTip}
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
              🪪 {t.upload?.idCardSectionTitle} <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t.upload?.idCardSectionDesc}
            </p>

            {/* Legal Warning */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                ⚠️ <strong>{t.upload?.legalWarningTitle || "Important"}:</strong> {t.upload?.legalWarningDesc || "If the portrait does not match the ID card information, the certificate will not have legal effect."}
              </p>
            </div>

            {/* ID Card fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.upload?.idCardType || "ID Type"} <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.idCardType}
                  onChange={e => { setForm(f => ({ ...f, idCardType: e.target.value })); setErrors(prev => ({ ...prev, idCardType: "" })); }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">{t.upload?.selectIdType || "Select ID type"}</option>
                  <option value="passport">Passport</option>
                  <option value="driver_license">Driver License</option>
                  <option value="us_id">ID Card</option>
                  <option value="other">Other</option>
                </select>
                {errors.idCardType && <p className="mt-1 text-sm text-red-600">{errors.idCardType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.upload?.idCardName || "Full Name"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.idCardName}
                  onChange={e => { setForm(f => ({ ...f, idCardName: e.target.value })); setErrors(prev => ({ ...prev, idCardName: "" })); }}
                  placeholder={t.upload?.idCardNamePlaceholder || "Enter name as on ID card"}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                {errors.idCardName && <p className="mt-1 text-sm text-red-600">{errors.idCardName}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.upload?.idCardNumber || "ID Number"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.idCardNumber}
                  onChange={e => { setForm(f => ({ ...f, idCardNumber: e.target.value })); setErrors(prev => ({ ...prev, idCardNumber: "" })); }}
                  placeholder={t.upload?.idCardNumberPlaceholder || "Enter ID number"}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                {errors.idCardNumber && <p className="mt-1 text-sm text-red-600">{errors.idCardNumber}</p>}
              </div>
            </div>

            {/* ID Card photo upload */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t.upload?.idCardFront || "ID Card Photo (Front)"} <span className="text-red-500">*</span></p>
            {!idCardFrontPreview ? (
              <label
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                style={{ height: "200px" }}
              >
                <div className="text-4xl mb-3">🪪</div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t.upload?.clickToUploadIdFront}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t.upload?.idDocSupported}</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleIdCardFrontChange(file);
                    setErrors(prev => ({ ...prev, idCardFront: "" }));
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
            {errors.idCardFront && <p className="mt-2 text-sm text-red-600">{errors.idCardFront}</p>}
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
