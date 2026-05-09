"use client";

import React, { useState } from "react";
import FaceTraceUploader from "@/components/face-trace/FaceTraceUploader";
import FaceTraceResults from "@/components/face-trace/FaceTraceResults";
import type { TraceResult, TraceStage } from "@/components/face-trace/FaceTraceUploader";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function FaceTracePage() {
  const { t } = useLanguage();
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
            {t.faceTrace.backToConsole}
          </a>
          <h1 className="font-semibold text-gray-800 text-sm">{t.faceTrace.title}</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t.faceTrace.title}
            </h1>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200 tracking-wide">
              DEMO
            </span>
          </div>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            {t.faceTrace.subtitle}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <span>⚠️</span>
            <span>{t.faceTrace.demoWarning}</span>
          </div>
        </div>

        {/* Architecture callout */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { step: "01", icon: "📤", title: t.faceTrace.dragUpload, desc: t.faceTrace.dragUploadDesc },
            { step: "02", icon: "🧠", title: t.faceTrace.vectorExtract, desc: t.faceTrace.vectorExtractDesc },
            { step: "03", icon: "⚖️", title: t.faceTrace.similarityMatch, desc: t.faceTrace.similarityMatchDesc },
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
                {t.faceTrace.retry}
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
            <h3 className="text-sm font-semibold text-gray-800 mb-1.5">🔗 {t.faceTrace.blockchainTrace}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t.faceTrace.blockchainTraceDesc}
            </p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
              🔮 {t.faceTrace.reservedInterface}
              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">{t.faceTrace.productionReady}</span>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t.faceTrace.replaceDesc.split("{code}").map((part, i) =>
                i === 0 ? part : <code key="code" className="bg-gray-100 px-1 rounded text-xs">celebrityDb.ts</code>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
