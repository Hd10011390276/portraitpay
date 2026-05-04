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

function createSchema(t: any) {
  return z.object({
    companyName: z.string().min(2, t.companyNameMin2 || "公司名称至少2个字符"),
    unifiedCreditCode: z.string().length(18, t.unifiedCreditCodeLen18 || "统一社会信用代码为18位"),
    legalPersonName: z.string().min(2, t.legalPersonNameMin2 || "请输入法人姓名"),
    legalPersonIdCard: z.string().length(18, t.legalPersonIdCardLen18 || "身份证号为18位"),
    registeredCapital: z.string().optional(),
    establishedDate: z.string().optional(),
    businessTerm: z.string().optional(),
    businessScope: z.string().optional(),
    licenseImageUrl: z.string().url(t.uploadLicense || "请上传营业执照"),
    legalPersonIdCardFrontUrl: z.string().url(t.uploadIdCardFront || "请上传法人身份证正面").optional(),
    legalPersonIdCardBackUrl: z.string().url(t.uploadIdCardBack || "请上传法人身份证背面").optional(),
    contactName: z.string().min(2, t.enterContactName || "请输入联系人姓名"),
    contactPhone: z.string().min(11, t.phoneFormatInvalid || "手机号格式不正确"),
    contactEmail: z.string().email(t.emailFormatInvalid || "邮箱格式不正确"),
    isAgency: z.boolean().optional(),
    agencyLicenseUrl: z.string().url(t.uploadAgencyLicense || "请上传经纪许可证").optional(),
  });
}

type FormData = z.infer<ReturnType<typeof createSchema>>;

// PayPal.me links — amounts: personal/agency=$199, enterprise=$299
const PAYPAL_ENTERPRISE = "https://www.paypal.me/PortraitPayAI/299";
const PAYPAL_PERSONAL = "https://www.paypal.me/PortraitPayAI/199";
const STRIPE_ENTERPRISE = "https://buy.stripe.com/test";
const STRIPE_PERSONAL = "https://buy.stripe.com/test";

export default function EnterpriseCertificationPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";

  const [step, setStep] = useState<"form" | "payment" | "pending">("form");
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tc = isZh ? t.enterpriseCert : t.enterpriseCert;
  const lang = isZh ? "" : "En";

  const schema = createSchema(tc);

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const isAgency = watch("isAgency");
  const certificationFee = isAgency ? 299 : 199;
  const paypalLink = isAgency ? PAYPAL_ENTERPRISE : PAYPAL_PERSONAL;
  const stripeLink = isAgency ? STRIPE_ENTERPRISE : STRIPE_PERSONAL;

  const onFormSubmit = (data: FormData) => {
    setPendingData(data);
    setStep("payment");
  };

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
      setError(err instanceof Error ? err.message : (isZh ? "提交失败" : "Submission failed"));
    } finally {
      setLoading(false);
    }
  };

  const feeLabel = isAgency
    ? (isZh ? tc.feeAgency : tc.feeAgency)
    : (isZh ? tc.feePersonal : tc.feePersonal);

  const getLabel = (zh: string, en: string) => isZh ? zh : en;

  if (step === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{tc.submittedSuccessfully || tc.submittedSuccessfullyEn}</h2>
          <p className="text-gray-600 mb-6">
            {tc.submittedDesc || tc.submittedDescEn}
          </p>
          <button
            onClick={() => setStep("form")}
            className="text-purple-600 font-medium hover:underline"
          >
            {tc.backToForm || tc.backToFormEn}
          </button>
        </div>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {tc.payCertificationFee || tc.payCertificationFeeEn}
            </h2>
            <p className="text-gray-500 text-sm">
              {tc.payDesc || tc.payDescEn}
            </p>
          </div>

          {/* Fee card */}
          <div className="bg-purple-50 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{feeLabel}</p>
              <p className="text-xs text-gray-500 mt-0.5">{tc.validFor1Year || tc.validFor1YearEn}</p>
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
            <p className="text-sm font-medium text-gray-700 mb-2">{tc.selectPaymentMethod || tc.selectPaymentMethodEn}</p>

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
                <p className="font-semibold text-gray-900">{tc.paypal || tc.paypalEn}</p>
                <p className="text-xs text-gray-500">{tc.paypalDesc || tc.paypalDescEn}</p>
              </div>
              <span className="font-bold text-gray-900">${certificationFee}</span>
            </a>

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
                <p className="font-semibold text-gray-900">{tc.card || tc.cardEn}</p>
                <p className="text-xs text-gray-500">{tc.cardDesc || tc.cardDescEn}</p>
              </div>
              <span className="font-bold text-gray-900">${certificationFee}</span>
            </a>
          </div>

          {/* Payment note */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 mb-6">
            💡 {tc.paymentNote || tc.paymentNoteEn}
          </div>

          {/* Confirm + back buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("form")}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← {tc.goBack || tc.goBackEn}
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
                  {tc.submitting || tc.submittingEn}
                </>
              ) : (
                tc.paymentDoneSubmit || tc.paymentDoneSubmitEn
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
            <h1 className="text-2xl font-bold text-white">{tc.title || "企业认证"}</h1>
            <p className="text-purple-200 mt-1">
              {tc.subtitle || "提交营业执照及联系人信息，支付认证费用后完成认证"}
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
                <p className="font-semibold">{tc.certificationFee || tc.certificationFeeEn}</p>
                <p className="mt-0.5">
                  {tc.feeExplanation || tc.feeExplanationEn}
                </p>
              </div>
            </div>

            {/* 公司基本信息 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                {tc.basicInfo || tc.basicInfoEn}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.companyName || tc.companyNameEn} *</label>
                  <input {...register("companyName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={tc.companyNamePlaceholder || tc.companyNamePlaceholderEn} />
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.unifiedCreditCode || tc.unifiedCreditCodeEn} *</label>
                  <input {...register("unifiedCreditCode")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="18" maxLength={18} />
                  {errors.unifiedCreditCode && <p className="text-red-500 text-xs mt-1">{errors.unifiedCreditCode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.legalRep || tc.legalRepEn} *</label>
                  <input {...register("legalPersonName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.legalRepPlaceholder || tc.legalRepPlaceholderEn} />
                  {errors.legalPersonName && <p className="text-red-500 text-xs mt-1">{errors.legalPersonName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.idCardNumber || tc.idCardNumberEn} *</label>
                  <input {...register("legalPersonIdCard")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="18" maxLength={18} />
                  {errors.legalPersonIdCard && <p className="text-red-500 text-xs mt-1">{errors.legalPersonIdCard.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.registeredCapital || tc.registeredCapitalEn}</label>
                  <input {...register("registeredCapital")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.registeredCapitalPlaceholder || tc.registeredCapitalPlaceholderEn} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.establishedDate || tc.establishedDateEn}</label>
                  <input {...register("establishedDate")} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.businessTerm || tc.businessTermEn}</label>
                  <input {...register("businessTerm")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.businessTermPlaceholder || tc.businessTermPlaceholderEn} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.businessScope || tc.businessScopeEn}</label>
                  <textarea {...register("businessScope")} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.businessScopePlaceholder || tc.businessScopePlaceholderEn} />
                </div>
              </div>
            </section>

            {/* 证照上传 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                {tc.documentUpload || tc.documentUploadEn}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.businessLicense || tc.businessLicenseEn} *</label>
                  <input {...register("licenseImageUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                  <p className="text-xs text-gray-500 mt-1">{tc.businessLicenseHint || tc.businessLicenseHintEn}</p>
                  {errors.licenseImageUrl && <p className="text-red-500 text-xs mt-1">{errors.licenseImageUrl.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tc.idCardFront || tc.idCardFrontEn}</label>
                    <input {...register("legalPersonIdCardFrontUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tc.idCardBack || tc.idCardBackEn}</label>
                    <input {...register("legalPersonIdCardBackUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                  </div>
                </div>
              </div>
            </section>

            {/* 联系信息 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                {tc.contactInfo || tc.contactInfoEn}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.contactName || tc.contactNameEn} *</label>
                  <input {...register("contactName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                  {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.phone || tc.phoneEn} *</label>
                  <input {...register("contactPhone")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="11" maxLength={11} />
                  {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.email || tc.emailEn} *</label>
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
                  <span className="font-medium text-gray-800">{tc.iAmAgency || tc.iAmAgencyEn}</span>
                  <p className="text-xs text-gray-500">{tc.agencyDesc || tc.agencyDescEn}</p>
                </div>
              </label>
              {isAgency && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.agencyLicenseUrl || tc.agencyLicenseUrlEn}</label>
                  <input {...register("agencyLicenseUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder="URL" />
                </div>
              )}
            </section>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition-colors"
            >
              {tc.nextPayFee || tc.nextPayFeeEn}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}