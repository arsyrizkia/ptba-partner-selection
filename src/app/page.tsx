"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileCheck,
  FolderKanban,
  ShieldCheck,
  ClipboardList,
  ArrowRight,
  UserPlus,
  LogIn,
  Calendar,
  MapPin,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils/cn";
import PopupBanner from "@/components/features/popup-banner";
import type { Locale } from "@/lib/i18n/config";

const i18n = {
  id: {
    login: "Masuk",
    register: "Daftar",
    prima_desc: "Platform Registrasi, Informasi & Manajemen Mitra",
    hero_title_1: "Selamat Datang di",
    hero_title_2: "Portal Mitra",
    hero_subtitle: "Sistem pemilihan mitra terintegrasi untuk proyek-proyek strategis PT Bukit Asam (Persero) Tbk.",
    register_cta: "Daftar Sebagai Mitra",
    have_account: "Sudah Punya Akun",
    active_open: "Pendaftaran Dibuka",
    active_title: "Proyek Aktif",
    active_subtitle: "Proyek yang saat ini membuka pendaftaran mitra",
    register_now: "Daftar Sekarang",
    deadline: "Deadline",
    features_title: "Apa yang Bisa Anda Lakukan",
    features_subtitle: "Fitur-fitur portal mitra untuk mendukung proses pendaftaran dan evaluasi",
    feat_1_title: "Lihat Proyek Tersedia",
    feat_1_desc: "Akses daftar proyek yang sedang membuka pendaftaran mitra baru.",
    feat_2_title: "Upload Dokumen",
    feat_2_desc: "Unggah dokumen persyaratan perusahaan melalui platform.",
    feat_3_title: "Ajukan Pendaftaran",
    feat_3_desc: "Daftarkan perusahaan Anda sebagai calon mitra untuk proyek yang tersedia.",
    feat_4_title: "Pantau Status Evaluasi",
    feat_4_desc: "Ikuti progres evaluasi pendaftaran Anda secara real-time melalui dashboard mitra.",
    steps_title: "Alur Pendaftaran Mitra",
    steps_subtitle: "Langkah-langkah untuk menjadi mitra PT Bukit Asam (Persero) Tbk",
    step_1: "Daftar Akun", step_1d: "Buat akun mitra baru dengan data perusahaan Anda",
    step_2: "Lengkapi Profil & Dokumen", step_2d: "Upload dokumen yang dipersyaratkan",
    step_3: "Pilih Proyek", step_3d: "Lihat proyek yang tersedia dan ajukan pendaftaran",
    step_4: "Upload Dokumen Proyek", step_4d: "Lengkapi dokumen spesifik yang dipersyaratkan",
    step_5: "Proses Evaluasi", step_5d: "Dokumen dan kelayakan perusahaan Anda akan dievaluasi oleh tim penilai",
    step_6: "Pengumuman Hasil", step_6d: "Hasil evaluasi akan disampaikan kepada seluruh mitra yang mengikuti proses seleksi",
    cta_title: "Siap Bergabung?",
    cta_subtitle: "Daftarkan perusahaan Anda sekarang dan mulai ikuti proses seleksi mitra.",
    footer: "PT Bukit Asam (Persero) Tbk — PRIMA (Platform Registrasi, Informasi & Manajemen Mitra)",
  },
  en: {
    login: "Login",
    register: "Register",
    prima_desc: "Partner Registration, Information & Management Platform",
    hero_title_1: "Welcome to",
    hero_title_2: "Partner Portal",
    hero_subtitle: "Integrated partner selection system for strategic projects of PT Bukit Asam (Persero) Tbk.",
    register_cta: "Register as Partner",
    have_account: "Already Have an Account",
    active_open: "Registration Open",
    active_title: "Active Project",
    active_subtitle: "Project currently open for partner registration",
    register_now: "Register Now",
    deadline: "Deadline",
    features_title: "What You Can Do",
    features_subtitle: "Portal features to support the registration and evaluation process",
    feat_1_title: "View Available Projects",
    feat_1_desc: "Access the list of projects currently open for new partner registration.",
    feat_2_title: "Upload Documents",
    feat_2_desc: "Upload your company's required documents digitally through the portal to complete the selection process.",
    feat_3_title: "Submit Registration",
    feat_3_desc: "Register your company as a partner candidate for available projects.",
    feat_4_title: "Track Evaluation Status",
    feat_4_desc: "Follow the evaluation progress of your registration in real-time through the partner dashboard.",
    steps_title: "Partner Registration Process",
    steps_subtitle: "Steps to become a partner of PT Bukit Asam (Persero) Tbk",
    step_1: "Register Account", step_1d: "Create a new partner account with your company data",
    step_2: "Complete Profile & Documents", step_2d: "Upload legal, financial, and technical documents",
    step_3: "Choose Project", step_3d: "View available projects and submit registration",
    step_4: "Upload Project Documents", step_4d: "Complete project-specific required documents",
    step_5: "Evaluation Process", step_5d: "Your documents and company eligibility will be evaluated by the assessment team",
    step_6: "Results Announcement", step_6d: "Evaluation results will be communicated to all partners participating in the selection process",
    cta_title: "Ready to Join?",
    cta_subtitle: "Register your company now and start the partner selection process.",
    footer: "PT Bukit Asam (Persero) Tbk — PRIMA (Partner Registration, Information & Management Platform)",
  },
} as const;

const TYPE_LABELS: Record<string, string> = {
  mining: "Pertambangan",
  power_generation: "Pembangkit Listrik",
  coal_processing: "Pengolahan Batubara",
  infrastructure: "Infrastruktur",
  environmental: "Lingkungan",
  corporate: "Korporat",
  others: "Lainnya",
};

const TYPE_COLORS: Record<string, string> = {
  mining: "bg-amber-100 text-amber-800",
  power_generation: "bg-blue-100 text-blue-800",
  coal_processing: "bg-orange-100 text-orange-800",
  infrastructure: "bg-purple-100 text-purple-800",
  environmental: "bg-green-100 text-green-800",
  corporate: "bg-ptba-steel-blue/10 text-ptba-steel-blue",
  others: "bg-gray-100 text-gray-700",
};

interface PublicProject {
  id: string;
  name: string;
  type: string;
  description: string;
  phase1Deadline: string | null;
  coverImageUrl: string | null;
  location: string | null;
  capacityMw: string | null;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = i18n[locale];
  const dateLocale = locale === "en" ? "en-GB" : "id-ID";
  const [activeProjects, setActiveProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    // Only redirect non-mitra (admin/internal) users away from landing page
    if (user && role !== "mitra") {
      router.replace("/dashboard");
    }
  }, [user, role, router]);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
    fetch(`${API}/projects/public`)
      .then((r) => r.json())
      .then((d) => setActiveProjects(d.data || []))
      .catch(() => {});
  }, []);

  // Only hide page for non-mitra logged-in users (they get redirected above)
  if (user && role !== "mitra") return null;

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-ptba-off-white">
      <PopupBanner alwaysShow />
      {/* Header */}
      <header className="border-b border-ptba-light-gray bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image src="/ptba-logo.svg" alt="PT Bukit Asam (Persero) Tbk" width={140} height={25} priority />
            <div className="h-6 w-px bg-ptba-light-gray" />
            <div>
              <span className="text-sm font-semibold text-ptba-navy">PRIMA</span>
              <span className="hidden sm:inline text-[10px] text-ptba-gray ml-1">{t.prima_desc}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === "id" ? "en" : "id" as Locale)}
              className="flex items-center rounded-lg border border-ptba-light-gray px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-ptba-section-bg"
            >
              <span className={cn("px-1", locale === "id" ? "text-ptba-navy" : "text-ptba-gray")}>ID</span>
              <span className={cn("px-1", locale === "en" ? "text-ptba-navy" : "text-ptba-gray")}>EN</span>
            </button>
            {isLoggedIn ? (
              <button onClick={() => router.push("/mitra/dashboard")} className="flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
                {locale === "en" ? "Go to Dashboard" : "Ke Dashboard"} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button onClick={() => router.push("/login")} className="flex items-center gap-2 rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors">
                  <LogIn className="h-4 w-4" /> {t.login}
                </button>
                <button onClick={() => router.push("/register")} className="flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
                  <UserPlus className="h-4 w-4" /> {t.register}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ptba-navy via-ptba-steel-blue to-ptba-navy">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-ptba-gold blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          {/* PRIMA Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-5 py-2 mb-8">
            <div className="h-2 w-2 rounded-full bg-ptba-gold animate-pulse" />
            <span className="text-xs font-bold text-ptba-gold tracking-wider">PRIMA</span>
            <span className="text-[11px] text-white/60">{t.prima_desc}</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-extrabold text-white sm:text-6xl tracking-tight">
            {t.hero_title_1}
            <br />
            <span className="bg-gradient-to-r from-ptba-gold via-yellow-300 to-ptba-gold bg-clip-text text-transparent">{t.hero_title_2}</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-white/70 font-medium">
            {t.hero_subtitle}
          </p>

          {/* Decorative divider */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-ptba-gold/50" />
            <div className="h-1.5 w-1.5 rounded-full bg-ptba-gold" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-ptba-gold/50" />
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => router.push("/register")} className="group flex items-center gap-2 rounded-xl bg-ptba-gold px-7 py-3.5 text-sm font-bold text-ptba-navy hover:bg-yellow-400 transition-all shadow-lg shadow-ptba-gold/20 hover:shadow-ptba-gold/40 hover:-translate-y-0.5">
              <UserPlus className="h-5 w-5" /> {t.register_cta}
              <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
            <button onClick={() => router.push("/login")} className="flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 backdrop-blur-sm px-7 py-3.5 text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 transition-all">
              <LogIn className="h-5 w-5" /> {t.have_account}
            </button>
          </div>
        </div>
      </section>

      {/* Active Project — right under hero */}
      {activeProjects.length > 0 && (() => {
        const project = activeProjects[0];
        return (
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-ptba-navy to-ptba-steel-blue py-20">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-ptba-gold/5 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-ptba-steel-blue/10 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="relative mx-auto max-w-6xl px-6">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-400/20 px-5 py-2 mb-5">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-bold text-green-300 tracking-wide">{t.active_open}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{t.active_title}</h2>
                <p className="mt-3 text-base text-white/50">{t.active_subtitle}</p>
              </div>

              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                <div className="bg-white/5 border-b border-white/10 px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${TYPE_COLORS[project.type] || TYPE_COLORS.others}`}>
                    {TYPE_LABELS[project.type] || project.type}
                  </span>
                  {project.phase1Deadline && (
                    <div className="flex items-center gap-2 rounded-full bg-ptba-red/10 border border-ptba-red/20 px-4 py-1.5">
                      <Calendar className="h-4 w-4 text-ptba-red" />
                      <span className="text-sm font-semibold text-red-300">
                        {t.deadline}: {new Date(project.phase1Deadline).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}, {new Date(project.phase1Deadline).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row">
                  {project.coverImageUrl && (
                    <div className="md:w-80 lg:w-96 shrink-0">
                      <img src={project.coverImageUrl} alt={project.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 px-8 py-8 sm:py-10">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{project.name}</h3>
                    {project.description && (
                      <p className="mt-5 text-base text-white/60 leading-relaxed max-w-3xl text-justify">
                        {project.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")}
                      </p>
                    )}
                    <div className="mt-8">
                      <button
                        onClick={() => router.push("/register")}
                        className="group inline-flex items-center gap-3 rounded-xl bg-ptba-gold px-8 py-4 text-base font-bold text-ptba-navy hover:bg-yellow-400 transition-all shadow-lg shadow-ptba-gold/20 hover:shadow-ptba-gold/40 hover:-translate-y-0.5"
                      >
                        {t.register_now}
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ptba-charcoal">{t.features_title}</h2>
        <p className="mt-2 text-center text-sm text-ptba-gray">{t.features_subtitle}</p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {([
            { icon: FolderKanban, title: t.feat_1_title, desc: t.feat_1_desc, color: "bg-ptba-steel-blue" },
            { icon: FileCheck, title: t.feat_2_title, desc: t.feat_2_desc, color: "bg-ptba-gold" },
            { icon: ClipboardList, title: t.feat_3_title, desc: t.feat_3_desc, color: "bg-green-600" },
            { icon: ShieldCheck, title: t.feat_4_title, desc: t.feat_4_desc, color: "bg-ptba-navy" },
          ]).map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${f.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 font-semibold text-ptba-charcoal">{f.title}</h3>
                <p className="mt-2 text-sm text-ptba-gray leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-ptba-charcoal">{t.steps_title}</h2>
          <p className="mt-2 text-center text-sm text-ptba-gray">{t.steps_subtitle}</p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {([
              { num: 1, label: t.step_1, desc: t.step_1d },
              { num: 2, label: t.step_2, desc: t.step_2d },
              { num: 3, label: t.step_3, desc: t.step_3d },
              { num: 4, label: t.step_4, desc: t.step_4d },
              { num: 5, label: t.step_5, desc: t.step_5d },
              { num: 6, label: t.step_6, desc: t.step_6d },
            ]).map((step) => (
              <div key={step.num} className="flex items-start gap-4 rounded-xl border border-ptba-light-gray p-5 hover:border-ptba-steel-blue/30 transition-colors">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ptba-navy text-white text-sm font-bold">{step.num}</span>
                <div>
                  <h3 className="font-semibold text-ptba-charcoal">{step.label}</h3>
                  <p className="mt-1 text-sm text-ptba-gray leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-10 text-center">
          <h2 className="text-2xl font-bold text-white">{t.cta_title}</h2>
          <p className="mt-2 text-white/80">{t.cta_subtitle}</p>
          <button onClick={() => router.push("/register")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ptba-gold px-8 py-3 text-sm font-bold text-ptba-navy hover:bg-ptba-gold/90 transition-colors shadow-lg">
            {t.register_now} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ptba-light-gray bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Image src="/ptba-logo.svg" alt="PT Bukit Asam (Persero) Tbk" width={120} height={22} className="mx-auto" />
          <p className="mt-3 text-xs text-ptba-gray">{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
