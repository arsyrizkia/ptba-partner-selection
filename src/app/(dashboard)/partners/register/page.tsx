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
  { key: 2, label: "Kontak" },
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

// --- Validation helpers ---
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v: string) => {
  const digitsOnly = v.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};
const isPhoneChar = (v: string) => /^[\d\s()+\-]*$/.test(v);
const isValidNpwp = (v: string) => /^[\d.\-]{15,20}$/.test(v);
const isValidUrl = (v: string) =>
  /^https?:\/\/.+\..+/.test(v) || /^www\..+\..+/.test(v);
const isValidCompanyCode = (v: string) => /^[a-zA-Z0-9\-]{2,20}$/.test(v);

type FieldErrors = Record<string, string>;

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Re-validate on change if field was already touched (immediate feedback)
  const handleChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      // Defer to next tick so state is updated
      setTimeout(() => validateField(field), 0);
    }
  };

  // Restrict phone input to only valid chars and max 15 digits
  const handlePhoneChange = (field: string, value: string, setter: (v: string) => void) => {
    if (!isPhoneChar(value)) return; // reject invalid chars
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length > 15) return; // reject if too many digits
    handleChange(field, value, setter);
  };

  const validateField = (field: string): string => {
    let err = "";
    switch (field) {
      case "companyName":
        if (!companyName.trim()) err = "Nama perusahaan wajib diisi";
        else if (companyName.trim().length < 3) err = "Minimal 3 karakter";
        break;
      case "companyCode":
        if (!companyCode.trim()) err = "Kode perusahaan wajib diisi";
        else if (!isValidCompanyCode(companyCode.trim()))
          err = "Hanya huruf, angka, dan strip (2-20 karakter)";
        break;
      case "industry":
        if (!industry) err = "Pilih industri perusahaan";
        break;
      case "phone":
        if (!phone.trim()) err = "Nomor telepon wajib diisi";
        else if (!isValidPhone(phone.trim()))
          err = "Nomor telepon harus 7-15 digit";
        break;
      case "email":
        if (!email.trim()) err = "Email perusahaan wajib diisi";
        else if (!isValidEmail(email.trim()))
          err = "Format email tidak valid";
        break;
      case "website":
        if (!website.trim()) err = "Website wajib diisi";
        else if (!isValidUrl(website.trim()))
          err = "Gunakan format: https://www.contoh.com";
        break;
      case "npwp":
        if (!npwp.trim()) err = "NPWP wajib diisi";
        else if (!isValidNpwp(npwp.trim()))
          err = "Format NPWP tidak valid (15 digit)";
        break;
      case "siup":
        if (!siup.trim()) err = "SIUP/NIB wajib diisi";
        break;
      case "address":
        if (!address.trim()) err = "Alamat wajib diisi";
        break;
      case "contactName":
        if (!contactName.trim()) err = "Nama kontak wajib diisi";
        break;
      case "contactPosition":
        if (!contactPosition.trim()) err = "Jabatan wajib diisi";
        break;
      case "contactPhone":
        if (!contactPhone.trim()) err = "Nomor telepon kontak wajib diisi";
        else if (!isValidPhone(contactPhone.trim()))
          err = "Nomor telepon harus 7-15 digit";
        break;
      case "contactEmail":
        if (!contactEmail.trim()) err = "Email kontak wajib diisi";
        else if (!isValidEmail(contactEmail.trim()))
          err = "Format email tidak valid";
        break;
    }
    setFieldErrors((prev) => {
      if (err) return { ...prev, [field]: err };
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return err;
  };

  const validateStep = (step: number): boolean => {
    const fieldsPerStep: Record<number, string[]> = {
      1: ["companyName", "companyCode", "industry", "address", "phone", "email", "website", "npwp", "siup"],
      2: ["contactName", "contactPosition", "contactPhone", "contactEmail"],
    };
    const fields = fieldsPerStep[step] || [];
    const newTouched: Record<string, boolean> = {};
    fields.forEach((f) => (newTouched[f] = true));
    setTouched((prev) => ({ ...prev, ...newTouched }));

    let hasError = false;
    fields.forEach((f) => {
      if (validateField(f)) hasError = true;
    });
    return !hasError;
  };

  const getError = (field: string) =>
    touched[field] ? fieldErrors[field] : undefined;

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 2) setCurrentStep((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(2)) return;
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
                required
                placeholder="Contoh: PT Maju Bersama"
                hint="Nama lengkap perusahaan sesuai akta"
                value={companyName}
                onChange={(e) => handleChange("companyName", e.target.value, setCompanyName)}
                onBlur={() => handleBlur("companyName")}
                error={getError("companyName")}
              />
              <Input
                label="Kode Perusahaan"
                required
                placeholder="Contoh: MJB"
                hint="Kode singkat unik (huruf, angka, strip)"
                value={companyCode}
                onChange={(e) => handleChange("companyCode", e.target.value, setCompanyCode)}
                onBlur={() => handleBlur("companyCode")}
                error={getError("companyCode")}
              />
            </div>

            <Select
              label="Industri"
              required
              options={industryOptions}
              hint="Pilih bidang usaha utama perusahaan"
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                setTouched((prev) => ({ ...prev, industry: true }));
                setTimeout(() => validateField("industry"), 0);
              }}
              onBlur={() => handleBlur("industry")}
              error={getError("industry")}
            />

            <Textarea
              label="Alamat"
              required
              placeholder="Contoh: Jl. Sudirman No. 10, Kel. Kebon Sirih, Kec. Menteng, Jakarta Pusat 10340"
              hint="Alamat lengkap kantor pusat beserta kode pos"
              value={address}
              onChange={(e) => handleChange("address", e.target.value, setAddress)}
              onBlur={() => handleBlur("address")}
              error={getError("address")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telepon"
                required
                placeholder="Contoh: (021) 123-4567"
                hint="Nomor telepon kantor, 7-15 digit"
                value={phone}
                onChange={(e) => handlePhoneChange("phone", e.target.value, setPhone)}
                onBlur={() => handleBlur("phone")}
                error={getError("phone")}
              />
              <Input
                label="Email Perusahaan"
                required
                type="email"
                placeholder="Contoh: info@perusahaan.co.id"
                hint="Email resmi perusahaan untuk korespondensi"
                value={email}
                onChange={(e) => handleChange("email", e.target.value, setEmail)}
                onBlur={() => handleBlur("email")}
                error={getError("email")}
              />
            </div>

            <Input
              label="Website"
              required
              placeholder="Contoh: https://www.perusahaan.co.id"
              hint="Alamat website perusahaan (awali dengan https://)"
              value={website}
              onChange={(e) => handleChange("website", e.target.value, setWebsite)}
              onBlur={() => handleBlur("website")}
              error={getError("website")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="NPWP"
                required
                placeholder="Contoh: 01.234.567.8-901.234"
                hint="Nomor Pokok Wajib Pajak (15 digit)"
                value={npwp}
                onChange={(e) => handleChange("npwp", e.target.value, setNpwp)}
                onBlur={() => handleBlur("npwp")}
                error={getError("npwp")}
              />
              <Input
                label="SIUP/NIB"
                required
                placeholder="Contoh: 503/1234/SIUP/PM/2024"
                hint="Surat Izin Usaha Perdagangan / Nomor Induk Berusaha"
                value={siup}
                onChange={(e) => handleChange("siup", e.target.value, setSiup)}
                onBlur={() => handleBlur("siup")}
                error={getError("siup")}
              />
            </div>
          </div>
        )}

        {/* Step 2: Kontak */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-ptba-charcoal">
                Kontak Penanggung Jawab
              </h2>
              <p className="mt-1 text-sm text-ptba-gray">
                Data penanggung jawab yang dapat dihubungi terkait kemitraan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nama Kontak"
                required
                placeholder="Contoh: Budi Santoso"
                hint="Nama lengkap penanggung jawab perusahaan"
                value={contactName}
                onChange={(e) => handleChange("contactName", e.target.value, setContactName)}
                onBlur={() => handleBlur("contactName")}
                error={getError("contactName")}
              />
              <Input
                label="Jabatan"
                required
                placeholder="Contoh: Direktur Utama"
                hint="Jabatan di perusahaan"
                value={contactPosition}
                onChange={(e) => handleChange("contactPosition", e.target.value, setContactPosition)}
                onBlur={() => handleBlur("contactPosition")}
                error={getError("contactPosition")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telepon Kontak"
                required
                placeholder="Contoh: 0812-3456-7890"
                hint="Nomor HP yang bisa dihubungi, 7-15 digit"
                value={contactPhone}
                onChange={(e) => handlePhoneChange("contactPhone", e.target.value, setContactPhone)}
                onBlur={() => handleBlur("contactPhone")}
                error={getError("contactPhone")}
              />
              <Input
                label="Email Kontak"
                required
                type="email"
                placeholder="Contoh: budi@perusahaan.co.id"
                hint="Email penanggung jawab untuk komunikasi"
                value={contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value, setContactEmail)}
                onBlur={() => handleBlur("contactEmail")}
                error={getError("contactEmail")}
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
            {currentStep < 2 ? (
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
