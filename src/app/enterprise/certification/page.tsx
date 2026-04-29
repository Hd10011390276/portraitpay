"use client";
/**
 * 企业认证页面
 * /enterprise/certification
 * 营业执照 + 联系人信息提交 + 支付认证费用
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/context/LanguageContext";

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

// PayPal.me links — amounts: personal/agency=$199, enterprise=$299
const PAYPAL_ENTERPRISE = "https://www.paypal.me/PortraitPayAI/299";
const PAYPAL_PERSONAL = "https://www.paypal.me/PortraitPayAI/199";
// Stripe Payment Links — operator must replace with real links from Stripe Dashboard
const STRIPE_ENTERPRISE = "https://buy.stripe.com/test"; // TODO: replace with real Stripe Payment Link for $299
const STRIPE_PERSONAL = "https://buy.stripe.com/test";   // TODO: replace with real Stripe Payment Link for $199

export default function EnterpriseCertificationPage() {
  const { locale } = useLanguage();
  const isZh = locale === "zh-CN";

  const [step, setStep] = useState<"form" | "payment" | "pending">("form");
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const isAgency = watch("isAgency");
  const certificationFee = isAgency ? 299 : 199;
  const paypalLink = isAgency ? PAYPAL_ENTERPRISE : PAYPAL_PERSONAL;
  const stripeLink = isAgency ? STRIPE_ENTERPRISE : STRIPE_PERSONAL;

  // Step 1: form submitted → show payment step
  const onFormSubmit = (data: FormData) => {
    setPendingData(data);
    setStep("payment");
  };

  // Step 2: after payment → call API and show pending
  const handlePaymentConfirm = async () => {
    if (!pendingData) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/enterprise/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingData),
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{isZh ? "提交成功" : "Submitted Successfully"}</h2>
          <p className="text-gray-600 mb-6">
            {isZh
              ? "您的企业认证申请已提交，平台将在 48 小时内完成审核。审核结果将通过邮件通知您。"
              : "Your enterprise certification application has been submitted. We will complete the review within 48 hours and notify you via email."}
          </p>
          <button
            onClick={() => setStep("form")}
            className="text-purple-600 font-medium hover:underline"
          >
            {isZh ? "返回填写" : "Back to form"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "payment") {
    const feeLabel = isZh
      ? (isAgency ? "企业认证（经纪公司）" : "企业认证（普通）")
      : (isAgency ? "Enterprise Certification (Agency)" : "Enterprise Certification (Personal)");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {isZh ? "支付认证费用" : "Pay Certification Fee"}
            </h2>
            <p className="text-gray-500 text-sm">
              {isZh ? "完成支付后即可提交认证申请" : "Complete payment to submit your certification application"}
            </p>
          </div>

          {/* Fee card */}
          <div className="bg-purple-50 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{feeLabel}</p>
              <p className="text-xs text-gray-500 mt-0.5">{isZh ? "认证有效期 1 年" : "Valid for 1 year"}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-purple-600">${certificationFee}</span>
              <span className="text-gray-400 text-sm ml-1">USD</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Payment options */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">{isZh ? "选择支付方式" : "Select Payment Method"}</p>

            {/* PayPal */}
            <a
              href={paypalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border-2 border-[#0070ba] rounded-xl hover:bg-[#0070ba]/5 transition-colors"
            >
              <div className="w-10 h-10 bg-[#0070ba] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">PayPal</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{isZh ? "PayPal 支付" : "Pay with PayPal"}</p>
                <p className="text-xs text-gray-500">{isZh ? "安全便捷的在线支付" : "Safe and secure online payment"}</p>
              </div>
              <span className="font-bold text-gray-900">${certificationFee}</span>
            </a>

            {/* Stripe */}
            <a
              href={stripeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border-2 border-[#635bff] rounded-xl hover:bg-[#635bff]/5 transition-colors"
            >
              <div className="w-10 h-10 bg-[#635bff] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">stripe</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{isZh ? "银行卡支付" : "Pay with Card"}</p>
                <p className="text-xs text-gray-500">{isZh ? "支持 Visa, Mastercard 等" : "Visa, Mastercard & more"}</p>
              </div>
              <span className="font-bold text-gray-900">${certificationFee}</span>
            </a>
          </div>

          {/* Payment note */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 mb-6">
            💡 {isZh
              ? "支付完成后，点击下方按钮提交认证申请。审核结果将在 48 小时内发送至您的邮箱。"
              : "After payment, click the button below to submit your application. Review results will be sent to your email within 48 hours."}
          </div>

          {/* Confirm + back buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("form")}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← {isZh ? "返回修改" : "Go Back"}
            </button>
            <button
              onClick={handlePaymentConfirm}
              disabled={loading}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isZh ? "提交中..." : "Submitting..."}
                </>
              ) : (
                isZh ? "支付完成，提交申请" : "Payment Done, Submit Application"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: form step
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{isZh ? "企业认证" : "Enterprise Certification"}</h1>
            <p className="text-purple-200 mt-1">
              {isZh
                ? "提交营业执照及联系人信息，支付认证费用后完成认证"
                : "Submit business license and contact info, pay the certification fee to complete"}
            </p>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Fee notice */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
              <span className="text-purple-600 text-lg flex-shrink-0 mt-0.5">💡</span>
              <div className="text-sm text-purple-800">
                <p className="font-semibold">{isZh ? "认证费用说明" : "Certification Fee"}</p>
                <p className="mt-0.5">
                  {isZh
                    ? "普通企业：$199/年 · 经纪公司：$299/年。支付完成后提交申请，审核通过后生效，有效期 1 年。"
                    : "Personal/Enterprise: $199/yr · Agency: $299/yr. Pay first, then submit. Valid for 1 year after approval."}
                </p>
              </div>
            </div>

            {/* 公司基本信息 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                {isZh ? "公司基本信息" : "Basic Information"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "公司名称 *" : "Company Name *"}</label>
                  <input {...register("companyName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={isZh ? "请输入公司全称" : "Full company name"} />
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "统一社会信用代码 *" : "Unified Credit Code *"}</label>
                  <input {...register("unifiedCreditCode")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="18" maxLength={18} />
                  {errors.unifiedCreditCode && <p className="text-red-500 text-xs mt-1">{errors.unifiedCreditCode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "法人姓名 *" : "Legal Representative *"}</label>
                  <input {...register("legalPersonName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={isZh ? "与营业执照一致" : "As on business license"} />
                  {errors.legalPersonName && <p className="text-red-500 text-xs mt-1">{errors.legalPersonName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "法人身份证号 *" : "ID Card Number *"}</label>
                  <input {...register("legalPersonIdCard")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="18" maxLength={18} />
                  {errors.legalPersonIdCard && <p className="text-red-500 text-xs mt-1">{errors.legalPersonIdCard.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "注册资本" : "Registered Capital"}</label>
                  <input {...register("registeredCapital")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={isZh ? "如：1000万元" : "e.g. 10,000,000"} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "成立日期" : "Established Date"}</label>
                  <input {...register("establishedDate")} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "营业期限" : "Business Term"}</label>
                  <input {...register("businessTerm")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={isZh ? "如：长期或2020-01-01至长期" : "e.g. Long-term or 2020-01-01 to long-term"} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "经营范围" : "Business Scope"}</label>
                  <textarea {...register("businessScope")} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={isZh ? "请输入营业执照上的经营范围" : "As stated on business license"} />
                </div>
              </div>
            </section>

            {/* 证照上传 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                {isZh ? "证照上传" : "Document Upload"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "营业执照扫描件 *" : "Business License *"}</label>
                  <input {...register("licenseImageUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL（上传后自动填充 / Auto-filled after upload）" />
                  <p className="text-xs text-gray-500 mt-1">{isZh ? "支持 JPG/PNG，建议小于 5MB" : "JPG/PNG, under 5MB recommended"}</p>
                  {errors.licenseImageUrl && <p className="text-red-500 text-xs mt-1">{errors.licenseImageUrl.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "法人身份证正面" : "ID Card Front"}</label>
                    <input {...register("legalPersonIdCardFrontUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "法人身份证背面" : "ID Card Back"}</label>
                    <input {...register("legalPersonIdCardBackUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                  </div>
                </div>
              </div>
            </section>

            {/* 联系信息 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                {isZh ? "联系信息" : "Contact Information"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "联系人姓名 *" : "Contact Name *"}</label>
                  <input {...register("contactName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                  {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "联系人手机 *" : "Phone *"}</label>
                  <input {...register("contactPhone")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="11" maxLength={11} />
                  {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "联系人邮箱 *" : "Email *"}</label>
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
                  <span className="font-medium text-gray-800">{isZh ? "我是经纪公司" : "I am an agency"}</span>
                  <p className="text-xs text-gray-500">{isZh ? "勾选后可批量管理旗下艺人肖像授权，认证费用 $299/年" : "Manage multiple artists, certification fee $299/yr"}</p>
                </div>
              </label>
              {isAgency && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isZh ? "经纪许可证 URL" : "Agency License URL"}</label>
                  <input {...register("agencyLicenseUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                </div>
              )}
            </section>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition-colors"
            >
              {isZh ? "下一步：支付认证费用 →" : "Next: Pay Certification Fee →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
