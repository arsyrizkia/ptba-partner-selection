"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi, ApiClientError } from "@/lib/api/client";
import type { UserRole } from "@/lib/types";

interface TokenUser {
  name: string;
  email: string;
  department: string;
  role: string;
}

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { setAuthUser } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenUser, setTokenUser] = useState<TokenUser | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    if (!token) {
      setTokenLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const apiClient = authApi();
        const data = await apiClient.verifyToken(token);
        setTokenUser(data);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setTokenError(err.message);
        } else {
          setTokenError("Link aktivasi sudah tidak berlaku atau sudah digunakan.");
        }
      } finally {
        setTokenLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  if (tokenLoading) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-ptba-navy border-t-transparent" />
        <p className="mt-3 text-sm text-ptba-gray">Memverifikasi token...</p>
      </div>
    );
  }

  if (!token || tokenError) {
    return (
      <div className="text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-ptba-charcoal mb-2">Link Tidak Berlaku</h2>
        <p className="text-sm text-ptba-gray mb-6">
          {tokenError || "Link aktivasi sudah kedaluwarsa atau sudah digunakan sebelumnya. Silakan hubungi admin untuk mengirim ulang undangan."}
        </p>
        <a
          href="/login"
          className="inline-block rounded-lg bg-ptba-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-ptba-steel-blue transition-colors"
        >
          Ke Halaman Login
        </a>
      </div>
    );
  }

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setIsLoading(true);

    try {
      const api = authApi();
      const res = await api.activate(token, password);

      setAuthUser(
        {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role as UserRole,
          department: res.user.department,
        },
        res.accessToken,
        res.refreshToken
      );

      setSuccess(true);
      setTimeout(() => {
        if (res.user.role === "mitra") {
          router.push("/mitra/dashboard");
        } else {
          router.push("/dashboard");
        }
      }, 2000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-ptba-charcoal mb-2">Akun Berhasil Diaktifkan!</h2>
        <p className="text-sm text-ptba-gray">
          Anda akan diarahkan ke dashboard...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ptba-navy/10 mb-3">
          <Shield className="h-6 w-6 text-ptba-navy" />
        </div>
        <h2 className="text-lg font-bold text-ptba-charcoal">Aktivasi Akun</h2>
        {tokenUser ? (
          <p className="text-sm text-ptba-gray mt-1">
            Halo <span className="font-semibold text-ptba-charcoal">{tokenUser.name}</span> dari divisi{" "}
            <span className="font-semibold text-ptba-charcoal">{tokenUser.department}</span>,
            silakan buat kata sandi untuk mengaktifkan akun Anda
          </p>
        ) : (
          <p className="text-sm text-ptba-gray mt-1">
            Buat kata sandi untuk mengaktifkan akun Anda
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ptba-charcoal">
            Kata Sandi Baru
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ptba-gray" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white py-3 pl-10 pr-10 text-sm text-ptba-charcoal placeholder-ptba-gray/60 outline-none transition-colors focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ptba-gray hover:text-ptba-charcoal"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {password && !passwordValid && (
            <p className="mt-1 text-xs text-red-500">Minimal 8 karakter</p>
          )}
          {password && passwordValid && (
            <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" /> Kata sandi valid
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-ptba-charcoal">
            Konfirmasi Kata Sandi
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ptba-gray" />
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white py-3 pl-10 pr-10 text-sm text-ptba-charcoal placeholder-ptba-gray/60 outline-none transition-colors focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ptba-gray hover:text-ptba-charcoal"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-500">Kata sandi tidak cocok</p>
          )}
          {confirmPassword && passwordsMatch && passwordValid && (
            <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" /> Kata sandi cocok
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "w-full rounded-lg bg-ptba-navy py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-ptba-steel-blue hover:shadow-lg active:scale-[0.98]",
            !canSubmit && "cursor-not-allowed opacity-50"
          )}
        >
          {isLoading ? "Mengaktifkan..." : "Aktifkan Akun"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ptba-gray">
        Sudah punya akun?{" "}
        <a href="/login" className="font-semibold text-ptba-steel-blue hover:text-ptba-navy transition-colors">
          Masuk
        </a>
      </p>
    </>
  );
}

export default function ActivatePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ptba-navy via-[#1e4570] to-ptba-navy-light px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-ptba-gold/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ptba-steel-blue/5" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
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
            Sistem Pemilihan Mitra
          </p>
        </div>

        <div className="mx-auto mb-6 h-[3px] w-16 rounded-full bg-ptba-gold" />

        <Suspense fallback={<div className="text-center text-sm text-ptba-gray">Memuat...</div>}>
          <ActivateForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-ptba-gray">
          &copy; 2026 PT Bukit Asam (Persero) Tbk. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}
