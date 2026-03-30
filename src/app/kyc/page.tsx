"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";

type KYCStep = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: "身份信息", icon: "👤" },
  { num: 2, label: "证件上传", icon: "🪪" },
  { num: 3, label: "人脸验证", icon: "📸" },
  { num: 4, label: "审核完成", icon: "✅" },
];

export default function KYCPage() {
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("pp_user");
    if (!raw) { window.location.href = "/login"; return; }
    try { setUser(JSON.parse(raw)); } catch { window.location.href = "/login"; }
    finally { setChecking(false); }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardShell
      title="KYC 身份认证"
      subtitle="完成身份验证以解锁企业授权和更多功能"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress header */}
        <KYCProgress currentStep={2} />

        {/* Main step card — ID document upload */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              📋 步骤 2：证件上传
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              请上传您的有效身份证件。我们支持以下证件类型：
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* ID type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">证件类型</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "id_card", label: "居民身份证", icon: "🪪" },
                  { value: "passport", label: "护照", icon: "🌍" },
                  { value: "hk_pass", label: "港澳通行证", icon: "🛂" },
                  { value: "tw_pass", label: "台湾居民证", icon: "✈️" },
                ].map((opt) => (
                  <button key={opt.value}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">支持</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Front / Back upload */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "证件人像面", sub: "正面" },
                { label: "证件国徽面", sub: "背面" },
              ].map((side) => (
                <div key={side.label} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {side.label} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group">
                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                        📷
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">点击上传</p>
                      <p className="text-xs text-gray-400 mt-1">JPG/PNG，最大 10MB</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">💡 拍摄要求</p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• 确保证件信息清晰可读，无反光、无遮挡</li>
                <li>• 证件必须为真实有效，未过期</li>
                <li>• 上传的图片必须完整，包含证件全部四个边角</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button className="flex-1 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                提交证件
              </button>
              <button className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm">
                保存草稿
              </button>
            </div>
          </div>
        </div>

        {/* Steps overview */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">全部步骤概览</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { num: 1, label: "身份信息", status: "completed", desc: "姓名、证件类型、证件号码" },
              { num: 2, label: "证件上传", status: "active",   desc: "上传证件正反面照片" },
              { num: 3, label: "人脸验证", status: "pending",  desc: "通过支付宝/微信进行人脸比对" },
              { num: 4, label: "审核完成", status: "pending",  desc: "等待 1-3 个工作日人工审核" },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${step.status === "completed" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                    step.status === "active" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"}`}>
                  {step.status === "completed" ? "✓" : step.num}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${step.status === "pending" ? "text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full
                  ${step.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    step.status === "active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"}`}>
                  {step.status === "completed" ? "已完成" : step.status === "active" ? "进行中" : "待完成"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function KYCProgress({ currentStep }: { currentStep: KYCStep }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">当前状态</p>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              🔍 审核中
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">预计 1-3 个工作日</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">认证级别</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Basic KYC</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = step.num < currentStep;
          const active = step.num === currentStep;
          return (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                  ${done ? "bg-green-500 text-white" :
                    active ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40" :
                    "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"}`}>
                  {done ? "✅" : step.icon}
                </div>
                <p className={`text-xs mt-2 font-medium ${done || active ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                  {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
