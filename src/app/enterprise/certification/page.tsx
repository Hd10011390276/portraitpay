"use client";
/**
 * 企业认证页面
 * /enterprise/certification
 * 营业执照 + 联系人信息提交
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  companyName: z.string().min(2, "公司名称至少2个字符"),
  unifiedCreditCode: z.string().length(18, "统一社会信用代码为18位"),
  legalPersonName: z.string().min(2, "请输入法人姓名"),
  legalPersonIdCard: z.string().length(18, "身份证号为18位"),
  registeredCapital: z.string().optional(),
  establishedDate: z.string().optional(),
  businessTerm: z.string().optional(),
  businessScope: z.string().optional(),
  licenseImageUrl: z.string().url("请上传营业执照"),
  legalPersonIdCardFrontUrl: z.string().url("请上传法人身份证正面").optional(),
  legalPersonIdCardBackUrl: z.string().url("请上传法人身份证背面").optional(),
  contactName: z.string().min(2, "请输入联系人姓名"),
  contactPhone: z.string().min(11, "手机号格式不正确"),
  contactEmail: z.string().email("邮箱格式不正确"),
  isAgency: z.boolean().optional(),
  agencyLicenseUrl: z.string().url("请上传经纪许可证").optional(),
});

type FormData = z.infer<typeof schema>;

export default function EnterpriseCertificationPage() {
  const [step, setStep] = useState<"form" | "success" | "pending">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const isAgency = watch("isAgency");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/enterprise/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setStep("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setLoading(false);
    }
  };

  if (step === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">提交成功</h2>
          <p className="text-gray-600 mb-6">
            您的企业认证申请已提交，平台将在 <strong>48 小时内</strong>完成审核。
            审核结果将通过邮件/短信通知您。
          </p>
          <button
            onClick={() => setStep("form")}
            className="text-purple-600 font-medium hover:underline"
          >
            返回填写
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">企业认证</h1>
            <p className="text-purple-200 mt-1">提交营业执照及联系人信息，等待平台审核</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* 公司基本信息 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                公司基本信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司名称 *</label>
                  <input {...register("companyName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="请输入公司全称" />
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码 *</label>
                  <input {...register("unifiedCreditCode")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="18位信用代码" maxLength={18} />
                  {errors.unifiedCreditCode && <p className="text-red-500 text-xs mt-1">{errors.unifiedCreditCode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">法人姓名 *</label>
                  <input {...register("legalPersonName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="与营业执照一致" />
                  {errors.legalPersonName && <p className="text-red-500 text-xs mt-1">{errors.legalPersonName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">法人身份证号 *</label>
                  <input {...register("legalPersonIdCard")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="18位身份证号" maxLength={18} />
                  {errors.legalPersonIdCard && <p className="text-red-500 text-xs mt-1">{errors.legalPersonIdCard.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">注册资本</label>
                  <input {...register("registeredCapital")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="如：1000万元" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成立日期</label>
                  <input {...register("establishedDate")} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">营业期限</label>
                  <input {...register("businessTerm")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="如：长期或2020-01-01至长期" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">经营范围</label>
                  <textarea {...register("businessScope")} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="请输入营业执照上的经营范围" />
                </div>
              </div>
            </section>

            {/* 证照上传 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                证照上传
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">营业执照扫描件 *</label>
                  <input {...register("licenseImageUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="图片 URL（上传后自动填充）" />
                  <p className="text-xs text-gray-500 mt-1">支持 JPG/PNG，建议小于 5MB</p>
                  {errors.licenseImageUrl && <p className="text-red-500 text-xs mt-1">{errors.licenseImageUrl.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">法人身份证正面</label>
                    <input {...register("legalPersonIdCardFrontUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">法人身份证背面</label>
                    <input {...register("legalPersonIdCardBackUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                  </div>
                </div>
              </div>
            </section>

            {/* 经纪公司额外选项 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                联系信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人姓名 *</label>
                  <input {...register("contactName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                  {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人手机 *</label>
                  <input {...register("contactPhone")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="11位手机号" maxLength={11} />
                  {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人邮箱 *</label>
                  <input {...register("contactEmail")} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                  {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>}
                </div>
              </div>
            </section>

            {/* 经纪公司 */}
            <section className="bg-purple-50 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register("isAgency")} className="w-5 h-5 text-purple-600 rounded" />
                <div>
                  <span className="font-medium text-gray-800">我是经纪公司</span>
                  <p className="text-xs text-gray-500">勾选后可批量管理旗下艺人肖像授权</p>
                </div>
              </label>
              {isAgency && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">经纪许可证 URL</label>
                  <input {...register("agencyLicenseUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="经纪业务许可证扫描件" />
                </div>
              )}
            </section>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "提交中..." : "提交认证申请"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
