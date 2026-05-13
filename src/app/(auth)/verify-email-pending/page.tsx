"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function VerifyEmailPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const name = searchParams.get("name") ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-3xl">📧</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Check Your Email
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            We&apos;ve sent a verification email to{" "}
            <span className="font-medium text-purple-600 dark:text-purple-400">{email || "your email"}</span>
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-left space-y-4">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">1</span>
              <p>Open the email and click the verification link, or enter the 6-digit code.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">2</span>
              <p>The link is valid for <strong>30 minutes</strong>.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
              <p>After verification, you can sign in and start using your account.</p>
            </div>
          </div>
        </div>

        {/* Resend link */}
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Didn&apos;t receive the email?{" "}
          <Link
            href={`/register`}
            className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
          >
            Try registering again
          </Link>
        </p>

        {/* Sign in link */}
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Already verified?{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}