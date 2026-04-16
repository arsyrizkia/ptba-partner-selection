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
import PopupBanner from "@/components/features/popup-banner";

const features = [
  {
    icon: FolderKanban,
    title: "Lihat Proyek Tersedia",
    desc: "Akses daftar proyek yang sedang membuka pendaftaran mitra baru.",
    color: "bg-ptba-steel-blue",
  },
  {
    icon: FileCheck,
    title: "Upload Dokumen",
    desc: "Unggah dokumen persyaratan seperti SIUP, NPWP, Laporan Keuangan, dan lainnya.",
    color: "bg-ptba-gold",
  },
  {
    icon: ClipboardList,
    title: "Ajukan Pendaftaran",
    desc: "Daftarkan perusahaan Anda sebagai calon mitra untuk proyek yang tersedia.",
    color: "bg-green-600",
  },
  {
    icon: ShieldCheck,
    title: "Pantau Status Evaluasi",
    desc: "Ikuti progres evaluasi pendaftaran Anda secara real-time dari pendaftaran hingga kontrak.",
    color: "bg-ptba-navy",
  },
];

const steps = [
  { num: 1, label: "Daftar Akun", desc: "Buat akun mitra baru dengan data perusahaan Anda" },
  { num: 2, label: "Lengkapi Profil & Dokumen", desc: "Upload dokumen legalitas, keuangan, dan teknis" },
  { num: 3, label: "Pilih Proyek", desc: "Lihat proyek yang tersedia dan ajukan pendaftaran" },
  { num: 4, label: "Upload Dokumen Proyek", desc: "Lengkapi dokumen spesifik yang dipersyaratkan proyek" },
  { num: 5, label: "Tunggu Evaluasi", desc: "Tim PTBA akan mengevaluasi dokumen dan kelayakan Anda" },
  { num: 6, label: "Hasil & Kontrak", desc: "Jika terpilih, proses penunjukan dan penandatanganan kontrak" },
];

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
  coverImageKey: string | null;
  location: string | null;
  capacityMw: string | null;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [activeProjects, setActiveProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    if (user) {
      if (role === "mitra") {
        router.replace("/mitra/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, role, router]);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
    fetch(`${API}/projects/public`)
      .then((r) => r.json())
      .then((d) => setActiveProjects(d.data || []))
      .catch(() => {});
  }, []);

  if (user) return null;

  return (
    <div className="min-h-screen bg-ptba-off-white">
      <PopupBanner />
      {/* Header */}
      <header className="border-b border-ptba-light-gray bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image src="/ptba-logo.svg" alt="PT Bukit Asam (Persero) Tbk" width={140} height={25} priority />
            <div className="h-6 w-px bg-ptba-light-gray" />
            <div>
              <span className="text-sm font-semibold text-ptba-navy">PRIMA</span>
              <span className="hidden sm:inline text-[10px] text-ptba-gray ml-1">Platform Registrasi, Informasi & Manajemen Mitra</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/login")} className="flex items-center gap-2 rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors">
              <LogIn className="h-4 w-4" /> Masuk
            </button>
            <button onClick={() => router.push("/register")} className="flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
              <UserPlus className="h-4 w-4" /> Daftar
            </button>
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
            <span className="text-[11px] text-white/60">Platform Registrasi, Informasi & Manajemen Mitra</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-extrabold text-white sm:text-6xl tracking-tight">
            Selamat Datang di
            <br />
            <span className="bg-gradient-to-r from-ptba-gold via-yellow-300 to-ptba-gold bg-clip-text text-transparent">Portal Mitra</span>
          </h1>

          {/* Subtitle — single line */}
          <p className="mt-5 text-base sm:text-lg text-white/70 font-medium">
            Sistem pemilihan mitra terintegrasi untuk proyek-proyek strategis PT Bukit Asam (Persero) Tbk.
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
              <UserPlus className="h-5 w-5" /> Daftar Sebagai Mitra
              <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
            <button onClick={() => router.push("/login")} className="flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 backdrop-blur-sm px-7 py-3.5 text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 transition-all">
              <LogIn className="h-5 w-5" /> Sudah Punya Akun
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ptba-charcoal">Apa yang Bisa Anda Lakukan</h2>
        <p className="mt-2 text-center text-sm text-ptba-gray">Fitur-fitur portal mitra untuk mendukung proses pendaftaran dan evaluasi</p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
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

      {/* Active Project */}
      {activeProjects.length > 0 && (() => {
        const project = activeProjects[0];
        return (
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-ptba-navy to-ptba-steel-blue py-20">
            {/* Background decorations */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-ptba-gold/5 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-ptba-steel-blue/10 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="relative mx-auto max-w-6xl px-6">
              {/* Section header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-400/20 px-5 py-2 mb-5">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-bold text-green-300 tracking-wide">Pendaftaran Dibuka</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Proyek Aktif</h2>
                <p className="mt-3 text-base text-white/50">Proyek yang saat ini membuka pendaftaran mitra</p>
              </div>

              {/* Project showcase */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                {/* Project header bar */}
                <div className="bg-white/5 border-b border-white/10 px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${TYPE_COLORS[project.type] || TYPE_COLORS.others}`}>
                      {TYPE_LABELS[project.type] || project.type}
                    </span>
                  </div>
                  {project.phase1Deadline && (
                    <div className="flex items-center gap-2 rounded-full bg-ptba-red/10 border border-ptba-red/20 px-4 py-1.5">
                      <Calendar className="h-4 w-4 text-ptba-red" />
                      <span className="text-sm font-semibold text-red-300">
                        Deadline: {new Date(project.phase1Deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}, {new Date(project.phase1Deadline).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB
                      </span>
                    </div>
                  )}
                </div>

                {/* Project content */}
                <div className="px-8 py-8 sm:py-10">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{project.name}</h3>

                  {project.description && (
                    <p className="mt-5 text-base text-white/60 leading-relaxed max-w-3xl">
                      {project.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")}
                    </p>
                  )}

                  {/* Info pills */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {project.location && (
                      <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2">
                        <MapPin className="h-4 w-4 text-ptba-gold" />
                        <span className="text-sm text-white/80">{project.location}</span>
                      </div>
                    )}
                    {project.capacityMw && (
                      <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2">
                        <Zap className="h-4 w-4 text-ptba-gold" />
                        <span className="text-sm text-white/80">{project.capacityMw} MW</span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-8">
                    <button
                      onClick={() => router.push("/register")}
                      className="group inline-flex items-center gap-3 rounded-xl bg-ptba-gold px-8 py-4 text-base font-bold text-ptba-navy hover:bg-yellow-400 transition-all shadow-lg shadow-ptba-gold/20 hover:shadow-ptba-gold/40 hover:-translate-y-0.5"
                    >
                      Daftar Sekarang
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-ptba-charcoal">Alur Pendaftaran Mitra</h2>
          <p className="mt-2 text-center text-sm text-ptba-gray">Langkah-langkah untuk menjadi mitra PT Bukit Asam (Persero) Tbk</p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
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
          <h2 className="text-2xl font-bold text-white">Siap Bergabung?</h2>
          <p className="mt-2 text-white/80">Daftarkan perusahaan Anda sekarang dan mulai ikuti proses seleksi mitra.</p>
          <button onClick={() => router.push("/register")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ptba-gold px-8 py-3 text-sm font-bold text-ptba-navy hover:bg-ptba-gold/90 transition-colors shadow-lg">
            Daftar Sekarang <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ptba-light-gray bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Image src="/ptba-logo.svg" alt="PT Bukit Asam (Persero) Tbk" width={120} height={22} className="mx-auto" />
          <p className="mt-3 text-xs text-ptba-gray">PT Bukit Asam (Persero) Tbk — PRIMA (Platform Registrasi, Informasi & Manajemen Mitra)</p>
        </div>
      </footer>
    </div>
  );
}
