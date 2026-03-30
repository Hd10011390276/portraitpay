"use client";

/**
 * Infringement Report Submission Page
 * Route: /report
 *
 * Allows any authenticated user to submit an infringement report.
 * Validates portrait ownership and required evidence before submission.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const INFRINGEMENT_TYPES = [
  { value: "UNAUTHORIZED_USE", label: "未经授权使用" },
  { value: "EXPIRED_LICENSE", label: "授权已过期" },
  { value: "SCOPE_VIOLATION", label: "超出授权范围使用" },
  { value: "RESALE", label: "二次转售/非法转让" },
  { value: "DEEPFAKE", label: "AI换脸/深度合成" },
];

interface FormData {
  portraitId: string;
  type: string;
  description: string;
  detectedUrl: string;
  evidenceUrls: string;
  originalImageUrl: string;
}

export default function ReportPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    portraitId: "",
    type: "UNAUTHORIZED_USE",
    description: "",
    detectedUrl: "",
    evidenceUrls: "",
    originalImageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const evidenceUrls = form.evidenceUrls
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  const isValid = form.portraitId && form.type && form.description.length >= 10 && evidenceUrls.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/infringements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraitId: form.portraitId,
          type: form.type,
          description: form.description,
          detectedUrl: form.detectedUrl,
          evidenceUrls,
          originalImageUrl: form.originalImageUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "提交失败，请重试");
        return;
      }

      setSuccess(`侵权举报已提交！举报编号：${json.data.id}`);
      setTimeout(() => router.push(`/infringements/${json.data.id}`), 2000);
    } catch {
      setError("网络错误，请检查网络连接后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">提交侵权举报</h1>
          <p className="mt-2 text-sm text-gray-600">
            发现有人在未经授权的情况下使用了您的肖像？请填写以下信息提交侵权举报。
            平台将在 24 小时内完成初审并通知您。
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-8 shadow-sm">
          {/* Portrait ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              您的肖像 ID <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 text-xs text-gray-500">
              前往「我的肖像」页面复制您要维权的肖像 ID
            </p>
            <input
              type="text"
              value={form.portraitId}
              onChange={(e) => setForm((f) => ({ ...f, portraitId: e.target.value }))}
              placeholder="例如：clx8k2f3j0001qsrr9abcd123"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Infringement Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              侵权类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {INFRINGEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Infringing URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              发现侵权的链接
            </label>
            <p className="mb-1 text-xs text-gray-500">请粘贴包含侵权内容的页面 URL</p>
            <input
              type="url"
              value={form.detectedUrl}
              onChange={(e) => setForm((f) => ({ ...f, detectedUrl: e.target.value }))}
              placeholder="https://..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Evidence URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              证据截图链接 <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 text-xs text-gray-500">
              请上传侵权截图到图床，粘贴每行一个 URL（最多10张）
            </p>
            <textarea
              value={form.evidenceUrls}
              onChange={(e) => setForm((f) => ({ ...f, evidenceUrls: e.target.value }))}
              placeholder={"https://example.com/screenshot1.jpg\nhttps://example.com/screenshot2.jpg"}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {evidenceUrls.length > 0 && (
              <p className="mt-1 text-xs text-green-600">已填写 {evidenceUrls.length} 个证据链接</p>
            )}
          </div>

          {/* Original Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              原始肖像图链接（选填）
            </label>
            <p className="mb-1 text-xs text-gray-500">如有原始肖像照片，请提供链接以便核实</p>
            <input
              type="url"
              value={form.originalImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, originalImageUrl: e.target.value }))}
              placeholder="https://..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 text-xs text-gray-500">请描述侵权内容的具体情况，至少 10 个字符</p>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="请详细描述发现的侵权行为，例如：此用户在XX平台发布了使用我肖像的AI生成图..."
              rows={5}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <p className={`mt-1 text-xs ${form.description.length >= 10 ? "text-green-600" : "text-gray-400"}`}>
              {form.description.length} / 10 字符（最低要求）
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">{success}</div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? "提交中..." : "提交侵权举报"}
          </button>
        </form>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-xs text-gray-400">
          提交举报即表示您确认上述信息真实有效。恶意举报将被追究法律责任。
          举报详情请查阅{" "}
          <a href="/terms" className="underline">
            侵权处理规则
          </a>
          。
        </p>
      </div>
    </div>
  );
}
