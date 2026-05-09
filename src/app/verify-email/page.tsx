"use client";
/**
 * /verify-email — Email verification page
 * Receives code + userId from URL ?code=XXXXXX&userId=xxx
 * Shows code input form and verifies with API
 */
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") ?? "";
  const userIdParam = searchParams.get("userId") ?? "";

  const [code, setCode] = useState("");
  const [userId] = useState(userIdParam);
  const [status, setStatus] = useState<"input" | "loading" | "success" | "error">(
    codeParam && userIdParam ? "loading" : "input"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (codeParam && userIdParam) {
      handleVerify(codeParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(submitCode?: string) {
    const codeToVerify = submitCode ?? code;
    if (!codeToVerify || codeToVerify.length !== 6) {
      setErrorMsg("Please enter the 6-digit code");
      return;
    }
    if (!userId) {
      setErrorMsg("Invalid verification link — missing user info");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToVerify, userId }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(json.error ?? "Verification failed");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-3 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Verifying email...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="PortraitPay AI" className="h-8 w-8 rounded-lg" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">PortraitPay AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{errorMsg}</p>
              <div className="space-y-3">
                <button
                  onClick={() => { setStatus("input"); setCode(""); setErrorMsg(""); }}
                  className="block w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
                <Link href="/login" className="block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  ← Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="PortraitPay AI" className="h-8 w-8 rounded-lg" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">PortraitPay AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Your email has been verified. Redirecting to login...
              </p>
              <Link href="/login" className="block w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors">
                Go to Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Input state
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="PortraitPay AI" className="h-8 w-8 rounded-lg" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">PortraitPay AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
              <h1 className="text-2xl font-bold text-white">Verify Email Address</h1>
              <p className="text-purple-200 text-sm mt-1">Enter the 6-digit code sent to your email</p>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
              className="p-8 space-y-6"
            >
              {errorMsg && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(val);
                    setErrorMsg("");
                  }}
                  placeholder="6-digit code"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <p className="mt-2 text-xs text-gray-400 text-center">
                  Code expires in 30 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!userId) return;
                      setErrorMsg("");
                      try {
                        const res = await fetch("/api/auth/send-verification", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId }),
                        });
                        const json = await res.json();
                        if (json.success) {
                          setErrorMsg("");
                        } else {
                          setErrorMsg(json.error ?? "Send failed");
                        }
                      } catch {
                        setErrorMsg("Network error");
                      }
                    }}
                    className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
                  >
                    Resend
                  </button>
                </p>
              </div>

              <div className="text-center pt-2">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  ← Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}