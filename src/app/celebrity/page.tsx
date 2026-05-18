"use client";
/**
 * /celebrity — Redirects to /register
 * All actor/creator registration now goes through /register
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CelebrityRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/register");
  }, [router]);
  return null;
}