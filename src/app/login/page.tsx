"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiClientError } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "success";
  const { loginApi, user, role } = useAuth();
  const { locale, setLocale } = useLocale();

  useEffect(() => {
    if (user) {
      if (role === "mitra") {
        router.replace("/mitra/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, role, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectByRole = (role: string) => {
    if (role === "mitra") {
      router.push("/mitra/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await loginApi(email, password);
      redirectByRole(user.role);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "EMAIL_NOT_VERIFIED" && err.data?.email) {
          router.push(`/verify-email?email=${encodeURIComponent(err.data.email as string)}`);
          return;
        }
        setError(err.message);
      } else {
        setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ptba-navy via-[#1e4570] to-ptba-navy-light px-4">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-ptba-gold/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ptba-steel-blue/5" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setLocale(locale === "id" ? "en" : "id" as Locale)}
            className="flex items-center rounded-lg border border-ptba-light-gray px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-ptba-section-bg"
          >
            <span className={cn("px-1", locale === "id" ? "text-ptba-navy" : "text-ptba-gray")}>ID</span>
            <span className={cn("px-1", locale === "en" ? "text-ptba-navy" : "text-ptba-gray")}>EN</span>
          </button>
        </div>
        {/* Branding */}
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/ptba-logo.svg"
            alt="PT Bukit Asam (Persero) Tbk"
            width={200}
            height={36}
            priority
          />
          <p className="mt-3 text-sm text-ptba-gray">
            {locale === "en" ? "Partner Selection System" : "Sistem Pemilihan Mitra"}
          </p>
        </div>

        {/* Gold Accent Line */}
        <div className="mx-auto mb-8 h-[3px] w-16 rounded-full bg-ptba-gold" />

        {/* Success messages */}
        {justRegistered && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {locale === "en" ? "Registration successful! Please log in with your account." : "Pendaftaran berhasil! Silakan login dengan akun Anda."}
          </div>
        )}
        {justVerified && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {locale === "en" ? "Email verified successfully! Please log in." : "Email berhasil diverifikasi! Silakan login."}
          </div>
        )}
        {justReset && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {locale === "en" ? "Password reset successfully! Please log in with your new password." : "Password berhasil direset! Silakan login dengan password baru."}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ptba-charcoal">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ptba-gray" />
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@bukitasam.co.id" className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white py-3 pl-10 pr-4 text-sm text-ptba-charcoal placeholder-ptba-gray/60 outline-none transition-colors focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ptba-charcoal">
              {locale === "en" ? "Password" : "Kata Sandi"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ptba-gray" />
              <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={locale === "en" ? "Enter your password" : "Masukkan kata sandi"} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white py-3 pl-10 pr-10 text-sm text-ptba-charcoal placeholder-ptba-gray/60 outline-none transition-colors focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ptba-gray hover:text-ptba-charcoal">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>{error && <p className="text-sm text-ptba-red">{error}</p>}</div>
            <a href="/forgot-password" className="text-xs font-medium text-ptba-steel-blue hover:text-ptba-navy transition-colors">
              {locale === "en" ? "Forgot Password?" : "Lupa Password?"}
            </a>
          </div>

          <button type="submit" disabled={isLoading || !email || !password} className={cn("w-full rounded-lg bg-ptba-gold py-3 text-sm font-bold text-ptba-charcoal shadow-md transition-all hover:bg-ptba-gold-light hover:shadow-lg active:scale-[0.98]", (isLoading || !email || !password) && "cursor-not-allowed opacity-70")}>
            {isLoading ? (locale === "en" ? "Processing..." : "Memproses...") : (locale === "en" ? "Sign In" : "Masuk")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-ptba-gray">
            {locale === "en" ? "Don't have an account?" : "Belum punya akun?"}{" "}
            <a href="/register" className="font-semibold text-ptba-steel-blue hover:text-ptba-navy transition-colors">
              {locale === "en" ? "Register as Partner" : "Daftar sebagai Mitra"}
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ptba-gray">
          &copy; 2026 PT Bukit Asam (Persero) Tbk. {locale === "en" ? "All Rights Reserved." : "Hak Cipta Dilindungi."}
        </p>
      </div>
    </div>
  );
}
