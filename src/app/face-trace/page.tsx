"use client";

import React, { useState } from "react";
import FaceTraceUploader from "@/components/face-trace/FaceTraceUploader";
import FaceTraceResults from "@/components/face-trace/FaceTraceResults";
import type { TraceResult, TraceStage } from "@/components/face-trace/FaceTraceUploader";

export default function FaceTracePage() {
  const [results, setResults] = useState<TraceResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stage, setStage] = useState<TraceStage>("idle");

  const handleResults = (r: TraceResult[]) => {
    setResults(r);
    setErrorMsg(null);
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
  };

  const handleReset = () => {
    setResults(null);
    setErrorMsg(null);
    setStage("idle");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      {/* Top nav bar */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors">
            ← 控制台
          </a>
          <h1 className="font-semibold text-gray-800 text-sm">人脸溯源</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            AI 人脸溯源
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            上传 AI 生成的人像图片，系统将提取人脸向量，与链上已登记的真实名人数据库进行余弦相似度匹配，揭示权属来源。
          </p>
        </div>

        {/* Architecture callout */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { step: "01", icon: "📤", title: "拖拽上传", desc: "AI 生成人脸图片" },
            { step: "02", icon: "🧠", title: "向量提取", desc: "face-api.js 提取 128 维向量" },
            { step: "03", icon: "⚖️", title: "相似度匹配", desc: "余弦相似度查询名人数据库" },
          ].map(({ step, icon, title, desc }) => (
            <div
              key={step}
              className="flex flex-col items-center gap-1.5 p-4 bg-white border border-gray-200 rounded-xl text-center shadow-sm"
            >
              <div className="text-xl">{icon}</div>
              <div className="text-xs font-bold text-indigo-600">{step}</div>
              <div className="text-sm font-semibold text-gray-800">{title}</div>
              <div className="text-xs text-gray-400 leading-tight">{desc}</div>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Error banner */}
          {errorMsg && stage === "error" && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-base">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">{errorMsg}</p>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
              >
                重试
              </button>
            </div>
          )}

          {/* Show results or uploader */}
          {results !== null && stage === "done" ? (
            <FaceTraceResults results={results} onReset={handleReset} />
          ) : (
            <FaceTraceUploader
              onResults={handleResults}
              onError={handleError}
              onStageChange={setStage}
            />
          )}
        </div>

        {/* Info footer */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-800 mb-1.5">🔗 区块链溯源</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              所有权属记录均上链存证，可查验，不可篡改。匹配结果可作为侵权取证的技术依据。
            </p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-800 mb-1.5">🔮 预留接口</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              真实名人数据库接口（pgvector ANN 查询）已预留，替换{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">celebrityDb.ts</code>{" "}
              即可接入生产数据。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
