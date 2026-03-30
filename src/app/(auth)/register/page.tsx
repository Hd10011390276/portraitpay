"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/auth/Input";
import { Button } from "@/components/auth/Button";
import { RoleSelector } from "@/components/auth/RoleSelector";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    role: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setGlobalError("");
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) errs.name = "姓名不能为空";
    if (!form.email) errs.email = "邮箱不能为空";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "请输入有效的邮箱地址";
    if (!form.password) errs.password = "密码不能为空";
    else if (form.password.length < 8) errs.password = "密码至少8位";
    else {
      if (!/[A-Z]/.test(form.password)) errs.password = "密码需包含至少一个大写字母";
      else if (!/[0-9]/.test(form.password)) errs.password = "密码需包含至少一个数字";
    }
    if (!form.confirmPassword) errs.confirmPassword = "请确认密码";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "两次密码不一致";
    if (!form.role) errs.role = "请选择角色";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGlobalError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          name: form.name,
          phone: form.phone || undefined,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors((prev) => ({ ...prev, ...data.errors }));
        } else {
          setGlobalError(data.message || "注册失败");
        }
        return;
      }

      if (data.data?.accessToken) {
        localStorage.setItem("pp_access_token", data.data.accessToken);
        localStorage.setItem("pp_refresh_token", data.data.refreshToken);
        localStorage.setItem("pp_user", JSON.stringify(data.data.user));
      }

      router.push("/dashboard");
    } catch {
      setGlobalError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            PortraitPay
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">创建账户</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            加入 PortraitPay，开启数字艺术之旅
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {globalError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {globalError}
              </div>
            )}

            <Input
              label="姓名"
              type="text"
              placeholder="请输入真实姓名"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              autoComplete="name"
            />

            <Input
              label="邮箱"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="手机号（选填）"
              type="tel"
              placeholder="可后续绑定"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              autoComplete="tel"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="密码"
                type="password"
                placeholder="8位，含大写字母和数字"
                value={form.password}
                onChange={set("password")}
                error={errors.password}
                autoComplete="new-password"
              />
              <Input
                label="确认密码"
                type="password"
                placeholder="再次输入密码"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            </div>

            <RoleSelector
              value={form.role}
              onChange={(val) => { setForm((prev) => ({ ...prev, role: val })); setErrors((prev) => ({ ...prev, role: "" })); }}
              error={errors.role}
            />

            <Button type="submit" size="lg" loading={loading} className="w-full">
              注册
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            注册即表示同意{" "}
            <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              服务条款
            </a>{" "}
            和{" "}
            <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              隐私政策
            </a>
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          已有账户？{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
}
