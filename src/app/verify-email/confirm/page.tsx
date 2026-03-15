"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/client";

export default function VerifyEmailConfirmPage() {
  return (
    <Suspense>
      <VerifyEmailConfirmContent />
    </Suspense>
  );
}

function VerifyEmailConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan.");
      return;
    }

    authApi()
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Email Berhasil Diverifikasi!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Verifikasi gagal. Silakan coba lagi.");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ptba-navy via-[#1e4570] to-ptba-navy-light px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-ptba-gold/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ptba-steel-blue/5" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/ptba-logo.svg" alt="PT Bukit Asam Tbk" width={200} height={36} priority />
        </div>
        <div className="mx-auto mb-8 h-[3px] w-16 rounded-full bg-ptba-gold" />

        <div className="flex flex-col items-center text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-ptba-steel-blue" />
              <p className="text-sm text-ptba-gray">Memverifikasi email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-ptba-charcoal">{message}</h1>
              <p className="mb-6 text-sm text-ptba-gray">
                Akun Anda telah aktif. Silakan login untuk melanjutkan.
              </p>
              <Link
                href="/login?verified=1"
                className="w-full rounded-lg bg-ptba-gold py-3 text-center text-sm font-bold text-ptba-charcoal shadow-md transition-all hover:bg-ptba-gold-light hover:shadow-lg active:scale-[0.98]"
              >
                Masuk
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-ptba-charcoal">Verifikasi Gagal</h1>
              <p className="mb-6 text-sm text-red-600">{message}</p>
              <Link
                href="/login"
                className="text-sm font-semibold text-ptba-steel-blue hover:text-ptba-navy transition-colors"
              >
                Kembali ke Login
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ptba-gray">
          &copy; 2024 PT Bukit Asam Tbk. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}
