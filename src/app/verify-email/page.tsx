"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { authApi } from "@/lib/api/client";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setResendMessage("");
    try {
      const res = await authApi().resendVerification(email);
      setResendMessage(res.message);
      setCooldown(60);
    } catch {
      setResendMessage("Gagal mengirim ulang. Silakan coba lagi.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ptba-navy via-[#1e4570] to-ptba-navy-light px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-ptba-gold/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ptba-steel-blue/5" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/ptba-logo.svg" alt="PT Bukit Asam Persero Tbk" width={200} height={36} priority />
        </div>
        <div className="mx-auto mb-8 h-[3px] w-16 rounded-full bg-ptba-gold" />

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ptba-steel-blue/10">
            <MailCheck className="h-8 w-8 text-ptba-steel-blue" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-ptba-charcoal">Cek Email Anda</h1>
          <p className="mb-6 text-sm text-ptba-gray">
            Kami telah mengirim link verifikasi ke{" "}
            <strong className="text-ptba-charcoal">{email}</strong>
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full rounded-lg bg-ptba-gold py-3 text-sm font-bold text-ptba-charcoal shadow-md transition-all hover:bg-ptba-gold-light hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resending
                ? "Mengirim..."
                : cooldown > 0
                ? `Kirim Ulang Email (${cooldown}s)`
                : "Kirim Ulang Email"}
            </button>

            <button
              onClick={() => window.open("https://mail.google.com", "_blank")}
              className="w-full rounded-lg border border-ptba-navy py-3 text-sm font-medium text-ptba-navy transition-colors hover:bg-ptba-navy/5"
            >
              Buka Gmail
            </button>
          </div>

          {resendMessage && (
            <p className="mt-4 text-sm text-green-600">{resendMessage}</p>
          )}

          <Link
            href="/login"
            className="mt-6 text-sm font-semibold text-ptba-steel-blue hover:text-ptba-navy transition-colors"
          >
            Kembali ke Login
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-ptba-gray">
          &copy; 2026 PT Bukit Asam Persero Tbk. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}
