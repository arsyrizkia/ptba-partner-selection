"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { key: 1, label: "Informasi Perusahaan" },
  { key: 2, label: "Pemegang Saham" },
  { key: 3, label: "Kontak" },
  { key: 4, label: "Buat Akun" },
];

const industryOptions = [
  { value: "", label: "Pilih Industri" },
  { value: "Energy", label: "Energy" },
  { value: "Mining & Metals", label: "Mining & Metals" },
  { value: "Trading & Distribution", label: "Trading & Distribution" },
  { value: "Financial Services", label: "Financial Services" },
  { value: "Construction", label: "Konstruksi" },
  { value: "Technology", label: "Teknologi" },
  { value: "Consulting", label: "Konsultan" },
  { value: "Manufacturing", label: "Manufaktur" },
  { value: "Other", label: "Lainnya" },
];

interface Shareholder {
  id: number;
  name: string;
  percentage: string;
  nationality: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [industry, setIndustry] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [npwp, setNpwp] = useState("");
  const [siup, setSiup] = useState("");

  // Step 2
  const [shareholders, setShareholders] = useState<Shareholder[]>([
    { id: 1, name: "", percentage: "", nationality: "Indonesia" },
  ]);

  // Step 3
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Step 4
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAddShareholder = () => {
    setShareholders((prev) => [
      ...prev,
      { id: prev.length + 1, name: "", percentage: "", nationality: "Indonesia" },
    ]);
  };

  const handleRemoveShareholder = (id: number) => {
    if (shareholders.length <= 1) return;
    setShareholders((prev) => prev.filter((s) => s.id !== id));
  };

  const handleShareholderChange = (id: number, field: keyof Shareholder, value: string) => {
    setShareholders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const goNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };
  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      alert("Kata sandi tidak cocok.");
      return;
    }
    alert("Pendaftaran berhasil! Silakan login dengan akun Anda.");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ptba-navy via-[#1e4570] to-ptba-navy-light px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-ptba-gold/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ptba-steel-blue/5" />
      </div>

      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        {/* Branding */}
        <div className="mb-4 flex flex-col items-center">
          <Image src="/ptba-logo.svg" alt="PT Bukit Asam Tbk" width={200} height={36} priority />
          <p className="mt-3 text-sm text-ptba-gray">Pendaftaran Mitra Baru</p>
        </div>
        <div className="mx-auto mb-6 h-[3px] w-16 rounded-full bg-ptba-gold" />

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {STEPS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = step.key < currentStep;
            const isLast = index === STEPS.length - 1;
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all",
                      isCompleted ? "bg-green-500 text-white" : isActive ? "bg-ptba-gold text-ptba-charcoal" : "bg-ptba-light-gray text-ptba-gray"
                    )}
                  >
                    {isCompleted ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.key
                    )}
                  </div>
                  <p className={cn("mt-1.5 text-[10px] font-medium text-center w-20", isActive ? "text-ptba-navy" : isCompleted ? "text-green-600" : "text-ptba-gray")}>
                    {step.label}
                  </p>
                </div>
                {!isLast && (
                  <div className={cn("h-0.5 w-10 mx-1 mb-5", isCompleted ? "bg-green-500" : "bg-ptba-light-gray")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Informasi Perusahaan */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Informasi Perusahaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Nama Perusahaan</label>
                <input type="text" placeholder="PT Contoh Perusahaan" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Kode Perusahaan</label>
                <input type="text" placeholder="ABC" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Industri</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20">
                {industryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Alamat</label>
              <textarea placeholder="Jl. Contoh No. 123, Jakarta" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20 min-h-[70px] resize-y" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Telepon</label>
                <input type="text" placeholder="(021) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Email Perusahaan</label>
                <input type="email" placeholder="info@perusahaan.co.id" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Website</label>
              <input type="text" placeholder="https://www.perusahaan.co.id" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">NPWP</label>
                <input type="text" placeholder="01.000.000.0-000.000" value={npwp} onChange={(e) => setNpwp(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">SIUP</label>
                <input type="text" placeholder="503/0000/SIUP/PM/2024" value={siup} onChange={(e) => setSiup(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pemegang Saham */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ptba-charcoal">Pemegang Saham</h2>
              <button onClick={handleAddShareholder} className="rounded-lg border border-ptba-navy px-3 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors">
                + Tambah
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-ptba-light-gray">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ptba-navy text-white">
                    <th className="px-3 py-2.5 text-left font-medium">No</th>
                    <th className="px-3 py-2.5 text-left font-medium">Nama</th>
                    <th className="px-3 py-2.5 text-left font-medium">%</th>
                    <th className="px-3 py-2.5 text-left font-medium">Kewarganegaraan</th>
                    <th className="px-3 py-2.5 text-left font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.map((sh, index) => (
                    <tr key={sh.id} className={index % 2 === 0 ? "bg-white" : "bg-ptba-off-white"}>
                      <td className="px-3 py-2.5">{index + 1}</td>
                      <td className="px-3 py-2.5">
                        <input type="text" placeholder="Nama pemegang saham" value={sh.name} onChange={(e) => handleShareholderChange(sh.id, "name", e.target.value)} className="w-full rounded-lg border border-ptba-light-gray px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue" />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" placeholder="0" min="0" max="100" value={sh.percentage} onChange={(e) => handleShareholderChange(sh.id, "percentage", e.target.value)} className="w-20 rounded-lg border border-ptba-light-gray px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue" />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="text" placeholder="Indonesia" value={sh.nationality} onChange={(e) => handleShareholderChange(sh.id, "nationality", e.target.value)} className="w-full rounded-lg border border-ptba-light-gray px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue" />
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => handleRemoveShareholder(sh.id)} disabled={shareholders.length <= 1} className="text-ptba-red hover:text-red-700 disabled:text-ptba-light-gray disabled:cursor-not-allowed text-xs font-medium">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Kontak */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Kontak Penanggung Jawab</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Nama Kontak</label>
                <input type="text" placeholder="Nama lengkap" value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Jabatan</label>
                <input type="text" placeholder="Direktur Utama" value={contactPosition} onChange={(e) => setContactPosition(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Telepon Kontak</label>
                <input type="text" placeholder="0812-3456-7890" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Email Kontak</label>
                <input type="email" placeholder="kontak@perusahaan.co.id" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Buat Akun */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Buat Akun Login</h2>
            <p className="text-sm text-ptba-gray">Buat akun untuk mengakses Portal Mitra PTBA.</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Email Akun</label>
              <input type="email" placeholder="email@perusahaan.co.id" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Kata Sandi</label>
              <input type="password" placeholder="Minimal 8 karakter" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Konfirmasi Kata Sandi</label>
              <input type="password" placeholder="Ulangi kata sandi" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20" />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-ptba-light-gray">
          <button
            onClick={currentStep === 1 ? () => router.push("/login") : goPrev}
            className="rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
          >
            {currentStep === 1 ? "Kembali ke Login" : "Sebelumnya"}
          </button>
          {currentStep < 4 ? (
            <button onClick={goNext} className="rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
              Selanjutnya
            </button>
          ) : (
            <button onClick={handleSubmit} className="rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors">
              Daftar
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-ptba-gray">
          Sudah punya akun?{" "}
          <a href="/login" className="font-semibold text-ptba-steel-blue hover:text-ptba-navy transition-colors">
            Masuk
          </a>
        </p>
      </div>
    </div>
  );
}
