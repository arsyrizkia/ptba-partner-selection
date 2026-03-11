"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLES } from "@/lib/constants/roles";
import { mockUsers } from "@/lib/mock-data/users";

const demoAccounts = mockUsers.map((u) => ({
  email: u.email,
  role: ROLES.find((r) => r.value === u.role)?.label ?? u.role,
  name: u.name,
}));

export default function LoginPage() {
  const router = useRouter();
  const { login, loginApi } = useAuth();
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
      // Try real API first
      const user = await loginApi(email, password);
      redirectByRole(user.role);
      return;
    } catch {
      // Fall back to mock login if API is unavailable
      const mockUser = login(email);
      if (mockUser) {
        setTimeout(() => redirectByRole(mockUser.role), 300);
        return;
      }
      setError("Email atau password salah.");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
    const user = login(demoEmail);
    if (user) {
      setIsLoading(true);
      setTimeout(() => redirectByRole(user.role), 300);
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
        {/* Branding */}
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/ptba-logo.svg"
            alt="PT Bukit Asam Tbk"
            width={200}
            height={36}
            priority
          />
          <p className="mt-3 text-sm text-ptba-gray">
            Sistem Pemilihan Mitra
          </p>
        </div>

        {/* Gold Accent Line */}
        <div className="mx-auto mb-8 h-[3px] w-16 rounded-full bg-ptba-gold" />

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ptba-charcoal"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ptba-gray" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@bukitasam.co.id"
                className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white py-3 pl-10 pr-4 text-sm text-ptba-charcoal placeholder-ptba-gray/60 outline-none transition-colors focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ptba-charcoal"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ptba-gray" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white py-3 pl-10 pr-10 text-sm text-ptba-charcoal placeholder-ptba-gray/60 outline-none transition-colors focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ptba-gray hover:text-ptba-charcoal"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-ptba-red">{error}</p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full rounded-lg bg-ptba-gold py-3 text-sm font-bold text-ptba-charcoal shadow-md transition-all hover:bg-ptba-gold-light hover:shadow-lg active:scale-[0.98]",
              isLoading && "cursor-not-allowed opacity-70"
            )}
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 border-t border-ptba-light-gray pt-4">
          <p className="mb-3 text-xs font-semibold text-ptba-gray uppercase tracking-wide">
            Akun Demo
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoLogin(account.email)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-ptba-section-bg"
              >
                <span className="font-mono text-ptba-charcoal">
                  {account.email}
                </span>
                <span className="ml-2 shrink-0 rounded-full bg-ptba-navy/10 px-2 py-0.5 text-[10px] font-medium text-ptba-navy">
                  {account.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Registration Link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-ptba-gray">
            Belum punya akun?{" "}
            <a
              href="/register"
              className="font-semibold text-ptba-steel-blue hover:text-ptba-navy transition-colors"
            >
              Daftar sebagai Mitra
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-ptba-gray">
          &copy; 2024 PT Bukit Asam Tbk. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}
