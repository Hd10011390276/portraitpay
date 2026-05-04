/**
 * /kyc — KYC Identity Verification Entry Page
 *
 * Flow:
 *  1. Fetch current KYC status from /api/v1/kyc/status
 *  2. If APPROVED → show success state
 *  3. If NOT_STARTED / REJECTED / EXPIRED → show upload form:
 *     - Step 1: Upload ID card front
 *     - Step 2: Upload portrait/selfie
 *     - Step 3: Client-side face-api.js comparison
 *     - Step 4: Submit to /api/v1/kyc/submit
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";
import UploadZone from "@/components/portrait/UploadZone";
import { descriptorToArray } from "@/lib/face";

type KYCState = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
type Stage = "status" | "uploading" | "comparing" | "done" | "error";

const FACE_EMBEDDING_MODEL_URL = "/models";
const MIN_COSINE_SCORE = 0.65;

async function extractFaceDescriptor(file: File): Promise<Float32Array> {
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
  if (detections.length === 0) throw new Error("No face detected in portrait photo");
  const withDescriptor = await faceapi.detectSingleFace(canvas, tinyOptions).withFaceDescriptor();
  if (!withDescriptor?.descriptor) throw new Error("Could not extract face descriptor");
  return withDescriptor.descriptor;
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function computeHash(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: KYCState }) {
  const { t } = useLanguage();
  const config: Record<KYCState, { label: string; color: string; bg: string }> = {
    NOT_STARTED: { label: t.kyc.status?.notStarted ?? "未认证", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800" },
    PENDING:     { label: t.kyc.pending ?? "认证中", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
    APPROVED:    { label: t.kyc.approved ?? "已认证", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/30" },
    REJECTED:    { label: t.kyc.rejected ?? "认证被拒绝", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/30" },
    EXPIRED:     { label: t.kyc.status?.expired ?? "已过期", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/30" },
  };
  const c = config[status] ?? config.NOT_STARTED;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.color} ${c.bg}`}>
      {c.label}
    </span>
  );
}

// ── Step Indicator ─────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const { t } = useLanguage();
  const steps = [
    { n: 1, label: t.kyc.step1 ?? "基本信息" },
    { n: 2, label: t.kyc.step2 ?? "证件上传" },
    { n: 3, label: t.kyc.step3 ?? "人脸验证" },
    { n: 4, label: t.kyc.step4 ?? "完成" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map(({ n, label }) => (
        <React.Fragment key={n}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
              n < current ? "bg-purple-600 border-purple-600 text-white" :
              n === current ? "border-purple-600 text-purple-600" :
              "border-gray-300 text-gray-400"
            }`}>
              {n < current ? "✓" : n}
            </div>
            <span className={`text-xs ${n === current ? "text-purple-600 font-semibold" : "text-gray-400"}`}>{label}</span>
          </div>
          {n < 4 && <div className={`w-8 h-0.5 ${n < current ? "bg-purple-600" : "bg-gray-200"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function KYCPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [kycStatus, setKycStatus] = useState<KYCState>("NOT_STARTED");
  const [kycLevel, setKycLevel] = useState<number>(0);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [expiredAt, setExpiredAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("status");
  const [error, setError] = useState("");

  // Upload state
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [portraitHash, setPortraitHash] = useState<string>("");
  const [idCardHash, setIdCardHash] = useState<string>("");

  // Compare state
  const [compareScore, setCompareScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Fetch KYC status ───────────────────────────────────────────
  useEffect(() => {
    fetch("/api/v1/kyc/status", { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setKycStatus(j.data.status as KYCState);
          setKycLevel(j.data.level ?? 0);
          setVerifiedAt(j.data.verifiedAt);
          setExpiredAt(j.data.expiredAt);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── ID Card handler ───────────────────────────────────────────
  const handleIdCardChange = useCallback((file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert(t.kyc.clickToUpload ?? "请上传图片"); return; }
    if (file.size > 10 * 1024 * 1024) { alert(t.kyc.maxFileSize ?? "最大 10MB"); return; }
    setIdCardFile(file);
    setIdCardPreview(URL.createObjectURL(file));
    computeHash(file).then(h => setIdCardHash(h)).catch(() => {});
  }, [t]);

  // ── Portrait handler ──────────────────────────────────────────
  const handlePortraitChange = useCallback((file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert(t.kyc.clickToUpload ?? "请上传图片"); return; }
    if (file.size > 10 * 1024 * 1024) { alert(t.kyc.maxFileSize ?? "最大 10MB"); return; }
    setPortraitFile(file);
    setPortraitPreview(URL.createObjectURL(file));
    computeHash(file).then(h => setPortraitHash(h)).catch(() => {});
  }, [t]);

  // ── Start comparison ──────────────────────────────────────────
  const handleStartCompare = async () => {
    if (!idCardFile) { alert(t.kyc.idCardRequired ?? "请上传身份证正面照片"); return; }
    if (!portraitFile) { alert(t.kyc.portraitRequired ?? "请上传肖像照片"); return; }
    setStage("comparing");
    setError("");
    try {
      setError(t.kyc.comparingFaces ?? "正在进行人脸比对...");
      const [idCardDesc, portraitDesc] = await Promise.all([
        extractFaceDescriptor(idCardFile),
        extractFaceDescriptor(portraitFile),
      ]);
      const score = cosineSimilarity(idCardDesc, portraitDesc);
      const pct = Math.round(score * 100);
      setCompareScore(pct);
      if (pct < MIN_COSINE_SCORE * 100) {
        setError(t.kyc.compareFailed ?? "人脸比对失败，请确保证件照片和肖像照片为同一人");
        setStage("error");
        return;
      }
      setError(t.kyc.compareSuccess ?? "人脸比对成功！");
      setStage("done");
    } catch (err) {
      setError((err as Error).message || (t.kyc.verificationFailed ?? "验证失败"));
      setStage("error");
    }
  };

  // ── Submit KYC ────────────────────────────────────────────────
  const handleSubmitKYC = async () => {
    if (compareScore === null) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/v1/kyc/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: 2,
          idCardNumberHash: idCardHash || "local_hash_" + Date.now(),
          faceMatchScore: compareScore,
          portraitHash: portraitHash || "portrait_hash_" + Date.now(),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setSubmitError(json.error ?? "提交失败");
        return;
      }
      setKycStatus("APPROVED");
      setVerifiedAt(new Date().toISOString());
      setExpiredAt(json.data.expiredAt);
    } catch (err) {
      setSubmitError((err as Error).message || "提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // ── APPROVED state ─────────────────────────────────────────────
  if (!loading && kycStatus === "APPROVED") {
    return (
      <DashboardShell title={t.kyc.title} subtitle={t.kyc.subtitle}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t.kyc.approved?.title ?? "身份认证已完成"}
            </h2>
            <p className="text-gray-500 mb-6">{t.kyc.approved?.desc ?? "您的身份已通过认证，可以进行区块链上链操作"}</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">{t.kyc.certificationLevel ?? "认证级别"}</span>
                <span className="font-medium text-sm">{t.kyc.basicKyc ?? "基础 KYC"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">{t.kyc.approved?.valid ?? "有效"}</span>
                <span className="text-green-600 text-sm font-medium">✓</span>
              </div>
              {expiredAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">{t.kyc.approved?.expiredAt ?? "有效期至"}</span>
                  <span className="text-sm">{new Date(expiredAt).toLocaleDateString("zh-CN")}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/portraits")}
              className="mt-6 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              {t.portraits?.all ?? "查看我的肖像"}
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardShell title={t.kyc.title} subtitle={t.kyc.subtitle}>
        <div className="max-w-lg mx-auto pt-20 text-center">
          <div className="animate-spin h-10 w-10 border-3 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </DashboardShell>
    );
  }

  // ── Upload form ───────────────────────────────────────────────
  const currentStep = stage === "status" || stage === "uploading" ? 1
    : stage === "comparing" ? 3
    : stage === "done" ? 4 : 3;

  return (
    <DashboardShell title={t.kyc.title} subtitle={t.kyc.subtitle}>
      <div className="max-w-lg mx-auto">
        {/* Status badge */}
        {kycStatus !== "APPROVED" && (
          <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t.kyc.notStarted?.title ?? "请完成身份认证"}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {t.kyc.notStarted?.desc ?? "为了保护您的肖像权益，区块链上链前需要完成身份认证"}
                </p>
              </div>
            </div>
            <StatusBadge status={kycStatus} />
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <StepIndicator current={currentStep} />

          {stage === "uploading" && (
            <div className="space-y-6">
              {/* Step 2: ID Card */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t.kyc.step1 ?? "上传身份证"} <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-3">{t.kyc.step1Desc ?? "上传您身份证正面照片"}</p>
                {!idCardPreview ? (
                  <UploadZone onFileSelected={handleIdCardChange} />
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 border-purple-200">
                    <img src={idCardPreview} alt="ID Card" className="w-full max-h-60 object-contain" />
                    <button
                      onClick={() => { setIdCardFile(null); setIdCardPreview(null); }}
                      className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
                    >
                      移除
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Portrait */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t.kyc.step2 ?? "上传肖像照片"} <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-3">{t.kyc.step2Desc ?? "上传一张清晰的自拍或肖像照片"}</p>
                {!portraitPreview ? (
                  <UploadZone onFileSelected={handlePortraitChange} />
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 border-purple-200">
                    <img src={portraitPreview} alt="Portrait" className="w-full max-h-60 object-contain" />
                    <button
                      onClick={() => { setPortraitFile(null); setPortraitPreview(null); }}
                      className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
                    >
                      移除
                    </button>
                  </div>
                )}
              </div>

              {/* Start comparison */}
              <button
                onClick={handleStartCompare}
                disabled={!idCardFile || !portraitFile}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.kyc.step3 ?? "开始人脸比对"}
              </button>
            </div>
          )}

          {stage === "comparing" && (
            <div className="text-center py-8">
              <div className="animate-spin h-12 w-12 border-3 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">{t.kyc.comparingFaces ?? "正在进行人脸比对..."}</p>
              <p className="text-xs text-gray-400 mt-2">请稍候，不要关闭页面</p>
            </div>
          )}

          {stage === "done" && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-green-600 mb-2">
                {t.kyc.compareSuccess ?? "人脸比对成功！"}
              </h3>
              {compareScore !== null && (
                <p className="text-sm text-gray-500 mb-2">
                  {t.kyc.scoreLabel ?? "比对分数"}：<span className="font-bold text-purple-600">{compareScore}%</span>
                  <span className="text-gray-400 ml-2">(≥{MIN_COSINE_SCORE * 100}% = 通过)</span>
                </p>
              )}
              <button
                onClick={handleSubmitKYC}
                disabled={submitting}
                className="mt-4 w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? (t.kyc.submitting ?? "提交中...") : (t.kyc.submitKyc ?? "提交认证")}
              </button>
              {submitError && <p className="mt-3 text-sm text-red-500">{submitError}</p>}
            </div>
          )}

          {stage === "error" && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-bold text-red-600 mb-2">
                {t.kyc.compareFailed ?? "人脸比对失败"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={() => { setStage("uploading"); setCompareScore(null); }}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                重新上传
              </button>
            </div>
          )}

          {/* Initial state - show start button */}
          {stage === "status" && (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-6">{t.kyc.subtitle}</p>
              <button
                onClick={() => setStage("uploading")}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                {t.kyc.verify ?? "开始认证"}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
