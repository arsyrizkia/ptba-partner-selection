"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { key: 1, label: "Informasi Perusahaan" },
  { key: 2, label: "Pemegang Saham" },
  { key: 3, label: "Kontak" },
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

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [industry, setIndustry] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [npwp, setNpwp] = useState("");
  const [siup, setSiup] = useState("");

  // Step 2 state
  const [shareholders, setShareholders] = useState<Shareholder[]>([
    { id: 1, name: "", percentage: "", nationality: "Indonesia" },
  ]);

  // Step 3 state
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handleAddShareholder = () => {
    setShareholders((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: "",
        percentage: "",
        nationality: "Indonesia",
      },
    ]);
  };

  const handleRemoveShareholder = (id: number) => {
    if (shareholders.length <= 1) return;
    setShareholders((prev) => prev.filter((s) => s.id !== id));
  };

  const handleShareholderChange = (
    id: number,
    field: keyof Shareholder,
    value: string
  ) => {
    setShareholders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const goNext = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    // Just UI, no actual submission - show alert
    alert("Data mitra berhasil disimpan (simulasi).");
    router.push("/partners");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-ptba-charcoal">
        Registrasi Mitra Baru
      </h1>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = step.key < currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-ptba-gold text-ptba-charcoal"
                        : "bg-ptba-light-gray text-ptba-gray"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.key
                  )}
                </div>
                <p
                  className={cn(
                    "mt-2 text-xs font-medium text-center w-24",
                    isActive
                      ? "text-ptba-navy"
                      : isCompleted
                        ? "text-green-600"
                        : "text-ptba-gray"
                  )}
                >
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 w-16 mx-2 mb-6",
                    isCompleted ? "bg-green-500" : "bg-ptba-light-gray"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <Card padding="lg">
        {/* Step 1: Informasi Perusahaan */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">
              Informasi Perusahaan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nama Perusahaan"
                placeholder="PT Contoh Perusahaan"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                label="Kode Perusahaan"
                placeholder="ABC"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
              />
            </div>

            <Select
              label="Industri"
              options={industryOptions}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />

            <Textarea
              label="Alamat"
              placeholder="Jl. Contoh No. 123, Jakarta"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telepon"
                placeholder="(021) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="info@perusahaan.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Input
              label="Website"
              placeholder="https://www.perusahaan.co.id"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="NPWP"
                placeholder="01.000.000.0-000.000"
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
              />
              <Input
                label="SIUP"
                placeholder="503/0000/SIUP/PM/2024"
                value={siup}
                onChange={(e) => setSiup(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Pemegang Saham */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ptba-charcoal">
                Pemegang Saham
              </h2>
              <Button variant="outline" size="sm" onClick={handleAddShareholder}>
                + Tambah Pemegang Saham
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-ptba-light-gray">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ptba-navy text-white">
                    <th className="px-4 py-3 text-left font-medium">No</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Nama Pemegang Saham
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Persentase (%)
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Kewarganegaraan
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.map((sh, index) => (
                    <tr
                      key={sh.id}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-ptba-off-white"
                      }
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Nama pemegang saham"
                          value={sh.name}
                          onChange={(e) =>
                            handleShareholderChange(
                              sh.id,
                              "name",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-ptba-light-gray px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue focus:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          max="100"
                          value={sh.percentage}
                          onChange={(e) =>
                            handleShareholderChange(
                              sh.id,
                              "percentage",
                              e.target.value
                            )
                          }
                          className="w-24 rounded-lg border border-ptba-light-gray px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue focus:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Indonesia"
                          value={sh.nationality}
                          onChange={(e) =>
                            handleShareholderChange(
                              sh.id,
                              "nationality",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-ptba-light-gray px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue focus:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveShareholder(sh.id)}
                          disabled={shareholders.length <= 1}
                          className="text-ptba-red hover:text-red-700 disabled:text-ptba-light-gray disabled:cursor-not-allowed text-xs font-medium"
                        >
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
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">
              Kontak Penanggung Jawab
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nama Kontak"
                placeholder="Nama lengkap"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <Input
                label="Jabatan"
                placeholder="Direktur Utama"
                value={contactPosition}
                onChange={(e) => setContactPosition(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telepon Kontak"
                placeholder="0812-3456-7890"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              <Input
                label="Email Kontak"
                type="email"
                placeholder="kontak@perusahaan.co.id"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-ptba-light-gray">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => router.push("/partners") : goPrev}
          >
            {currentStep === 1 ? "Batal" : "Sebelumnya"}
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < 3 ? (
              <Button variant="navy" onClick={goNext}>
                Selanjutnya
              </Button>
            ) : (
              <Button variant="gold" onClick={handleSubmit}>
                Simpan
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
