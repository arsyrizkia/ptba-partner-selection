"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { api, ApiClientError } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-4 py-3 text-sm text-ptba-charcoal outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20 pl-11";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ptba-navy via-[#1e4570] to-ptba-navy-light px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-ptba-gold/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ptba-steel-blue/5" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-4 flex flex-col items-center">
          <Image src="/ptba-logo.svg" alt="PT Bukit Asam Persero Tbk" width={200} height={36} priority />
          <p className="mt-3 text-sm text-ptba-gray">Lupa Password</p>
        </div>
        <div className="mx-auto mb-6 h-[3px] w-16 rounded-full bg-ptba-gold" />

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-ptba-charcoal">Email Terkirim</h2>
            <p className="text-sm text-ptba-gray">
              Jika email <strong>{email}</strong> terdaftar, kami telah mengirim link untuk mereset password. Cek inbox atau folder spam Anda.
            </p>
            <p className="text-xs text-ptba-gray">Link berlaku selama 1 jam.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-ptba-gray text-center">
              Masukkan email yang terdaftar. Kami akan mengirim link untuk mereset password Anda.
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ptba-charcoal">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ptba-gray" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    className={inputClass}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className={cn(
                  "w-full rounded-lg bg-ptba-gold py-3 text-sm font-bold text-ptba-charcoal shadow-md transition-all hover:bg-ptba-gold-light",
                  (loading || !email.trim()) && "cursor-not-allowed opacity-70"
                )}
              >
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-ptba-gray">
              <Link href="/login" className="font-semibold text-ptba-steel-blue hover:text-ptba-navy transition-colors">
                Kembali ke Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
