"use client";

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
} from "lucide-react";

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
    title: "Ajukan Lamaran",
    desc: "Daftarkan perusahaan Anda sebagai calon mitra untuk proyek yang tersedia.",
    color: "bg-green-600",
  },
  {
    icon: ShieldCheck,
    title: "Pantau Status Evaluasi",
    desc: "Ikuti progres evaluasi lamaran Anda secara real-time dari pendaftaran hingga kontrak.",
    color: "bg-ptba-navy",
  },
];

const steps = [
  { num: 1, label: "Daftar Akun", desc: "Buat akun mitra baru dengan data perusahaan Anda" },
  { num: 2, label: "Lengkapi Profil & Dokumen", desc: "Upload dokumen legalitas, keuangan, dan teknis" },
  { num: 3, label: "Pilih Proyek", desc: "Lihat proyek yang tersedia dan ajukan lamaran" },
  { num: 4, label: "Upload Dokumen Proyek", desc: "Lengkapi dokumen spesifik yang dipersyaratkan proyek" },
  { num: 5, label: "Tunggu Evaluasi", desc: "Tim PTBA akan mengevaluasi dokumen dan kelayakan Anda" },
  { num: 6, label: "Hasil & Kontrak", desc: "Jika terpilih, proses penunjukan dan penandatanganan kontrak" },
];

export default function MitraPortalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-ptba-off-white">
      {/* Header */}
      <header className="border-b border-ptba-light-gray bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/ptba-logo.svg"
              alt="PT Bukit Asam Persero Tbk"
              width={140}
              height={25}
              priority
            />
            <div className="h-6 w-px bg-ptba-light-gray" />
            <span className="text-sm font-semibold text-ptba-navy">
              Portal Mitra
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Masuk
            </button>
            <button
              onClick={() => router.push("/register")}
              className="flex items-center gap-2 rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Daftar
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
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Portal Mitra PT Bukit Asam
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Sistem pemilihan mitra terintegrasi untuk proyek-proyek strategis PT Bukit Asam Persero Tbk.
            Daftarkan perusahaan Anda, unggah dokumen, dan ikuti proses seleksi secara transparan.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => router.push("/register")}
              className="flex items-center gap-2 rounded-xl bg-ptba-gold px-6 py-3 text-sm font-bold text-ptba-navy hover:bg-ptba-gold/90 transition-colors shadow-lg"
            >
              <UserPlus className="h-5 w-5" />
              Daftar Sebagai Mitra
            </button>
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Sudah Punya Akun
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ptba-charcoal">
          Apa yang Bisa Anda Lakukan
        </h2>
        <p className="mt-2 text-center text-sm text-ptba-gray">
          Fitur-fitur portal mitra untuk mendukung proses pendaftaran dan evaluasi
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${f.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 font-semibold text-ptba-charcoal">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-ptba-gray leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-ptba-charcoal">
            Alur Pendaftaran Mitra
          </h2>
          <p className="mt-2 text-center text-sm text-ptba-gray">
            Langkah-langkah untuk menjadi mitra PT Bukit Asam
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-4 rounded-xl border border-ptba-light-gray p-5 hover:border-ptba-steel-blue/30 transition-colors"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ptba-navy text-white text-sm font-bold">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-semibold text-ptba-charcoal">
                    {step.label}
                  </h3>
                  <p className="mt-1 text-sm text-ptba-gray leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-10 text-center">
          <h2 className="text-2xl font-bold text-white">
            Siap Bergabung?
          </h2>
          <p className="mt-2 text-white/80">
            Daftarkan perusahaan Anda sekarang dan mulai ikuti proses seleksi mitra.
          </p>
          <button
            onClick={() => router.push("/register")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ptba-gold px-8 py-3 text-sm font-bold text-ptba-navy hover:bg-ptba-gold/90 transition-colors shadow-lg"
          >
            Daftar Sekarang
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ptba-light-gray bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Image
            src="/ptba-logo.svg"
            alt="PT Bukit Asam Persero Tbk"
            width={120}
            height={22}
            className="mx-auto"
          />
          <p className="mt-3 text-xs text-ptba-gray">
            PT Bukit Asam Persero Tbk - Sistem Pemilihan Mitra
          </p>
        </div>
      </footer>
    </div>
  );
}
