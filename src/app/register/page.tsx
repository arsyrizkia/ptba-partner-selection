"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { authApi, api, ApiClientError } from "@/lib/api/client";

const STEPS = [
  { key: 1, label: "Data Perusahaan" },
  { key: 2, label: "Kontak & Dokumen" },
  { key: 3, label: "Buat Akun" },
];

// --- Validation helpers ---
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v: string) => {
  const digitsOnly = v.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};
const isPhoneChar = (v: string) => /^[\d\s()+\-]*$/.test(v);
const isValidCompanyCode = (v: string) => /^[a-zA-Z0-9\-]{2,20}$/.test(v);

type FieldErrors = Record<string, string>;

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Step 1: Data Perusahaan
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [businessOverview, setBusinessOverview] = useState("");
  const [address, setAddress] = useState("");
  const [indonesiaOfficeAddress, setIndonesiaOfficeAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  // Step 2: Kontak & Dokumen
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [nib, setNib] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Buat Akun
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const handleChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      setTimeout(() => validateField(field), 0);
    }
  };

  const handlePhoneChange = (field: string, value: string, setter: (v: string) => void) => {
    if (!isPhoneChar(value)) return;
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length > 15) return;
    handleChange(field, value, setter);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({ ...prev, logo: "File harus berupa gambar" }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, logo: "Ukuran file maksimal 2MB" }));
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.logo;
      return next;
    });
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      case "businessOverview":
        if (!businessOverview.trim()) err = "Overview bidang usaha wajib diisi";
        break;
      case "address":
        if (!address.trim()) err = "Alamat kantor pusat wajib diisi";
        break;
      case "phone":
        if (!phone.trim()) err = "Nomor telepon wajib diisi";
        else if (!isValidPhone(phone.trim()))
          err = "Nomor telepon harus 7-15 digit";
        break;
      case "companyEmail":
        if (!companyEmail.trim()) err = "Email perusahaan wajib diisi";
        else if (!isValidEmail(companyEmail.trim()))
          err = "Format email tidak valid";
        break;
      case "contactName":
        if (!contactName.trim()) err = "Nama contact person wajib diisi";
        break;
      case "contactPhone":
        if (!contactPhone.trim()) err = "Nomor telepon CP wajib diisi";
        else if (!isValidPhone(contactPhone.trim()))
          err = "Nomor telepon harus 7-15 digit";
        break;
      case "contactEmail":
        if (!contactEmail.trim()) err = "Email CP wajib diisi";
        else if (!isValidEmail(contactEmail.trim()))
          err = "Format email tidak valid";
        break;
      case "nib":
        if (!nib.trim()) err = "NIB wajib diisi";
        break;
      case "email":
        if (!email.trim()) err = "Email akun wajib diisi";
        else if (!isValidEmail(email.trim()))
          err = "Format email tidak valid";
        break;
      case "password":
        if (!password) err = "Kata sandi wajib diisi";
        else if (password.length < 8) err = "Minimal 8 karakter";
        break;
      case "confirmPassword":
        if (!confirmPassword) err = "Konfirmasi kata sandi wajib diisi";
        else if (confirmPassword !== password)
          err = "Kata sandi tidak cocok";
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
      1: ["companyName", "companyCode", "businessOverview", "address", "phone", "companyEmail"],
      2: ["contactName", "contactPhone", "contactEmail", "nib"],
      3: ["email", "password", "confirmPassword"],
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

  const goNext = () => {
    setError("");
    if (!validateStep(currentStep)) return;
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const goPrev = () => {
    setError("");
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const authClient = authApi();
      await authClient.register({
        name: contactName || companyName,
        email,
        password,
        companyName,
        companyCode,
        industry: businessOverview,
        businessOverview,
        address,
        indonesiaOfficeAddress: indonesiaOfficeAddress || undefined,
        phone,
        companyEmail,
        nib,
        contactPerson: contactName,
        contactPhone,
        contactEmail,
      });

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
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

  const getError = (field: string) =>
    touched[field] ? fieldErrors[field] : undefined;

  const inputClass =
    "w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20";

  const errorInputClass =
    "w-full rounded-lg border border-red-400 bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200";

  const fieldWrapper = (
    field: string,
    label: string,
    children: React.ReactNode,
    hint: string,
    required = true
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-ptba-charcoal">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {getError(field) ? (
        <p className="mt-1 text-xs text-red-500">{getError(field)}</p>
      ) : (
        <p className="mt-1 text-xs text-ptba-gray">{hint}</p>
      )}
    </div>
  );

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

        {/* Global Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Data Perusahaan */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Data Perusahaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldWrapper("companyName", "Nama Perusahaan",
                <input
                  type="text"
                  placeholder="Contoh: PT Maju Bersama"
                  value={companyName}
                  onChange={(e) => handleChange("companyName", e.target.value, setCompanyName)}
                  onBlur={() => handleBlur("companyName")}
                  className={getError("companyName") ? errorInputClass : inputClass}
                />,
                "Nama lengkap perusahaan sesuai akta"
              )}
              {fieldWrapper("companyCode", "Kode Perusahaan",
                <input
                  type="text"
                  placeholder="Contoh: MJB"
                  value={companyCode}
                  onChange={(e) => handleChange("companyCode", e.target.value, setCompanyCode)}
                  onBlur={() => handleBlur("companyCode")}
                  className={getError("companyCode") ? errorInputClass : inputClass}
                />,
                "Kode singkat unik (huruf, angka, strip)"
              )}
            </div>
            {fieldWrapper("businessOverview", "Overview Bidang Usaha",
              <textarea
                placeholder="Jelaskan bidang usaha utama perusahaan Anda"
                value={businessOverview}
                onChange={(e) => handleChange("businessOverview", e.target.value, setBusinessOverview)}
                onBlur={() => handleBlur("businessOverview")}
                className={cn(getError("businessOverview") ? errorInputClass : inputClass, "min-h-[70px] resize-y")}
              />,
              "Deskripsi singkat bidang usaha dan kegiatan utama perusahaan"
            )}
            {fieldWrapper("address", "Alamat Kantor Pusat",
              <textarea
                placeholder="Contoh: Jl. Sudirman No. 10, Jakarta Pusat 10340"
                value={address}
                onChange={(e) => handleChange("address", e.target.value, setAddress)}
                onBlur={() => handleBlur("address")}
                className={cn(getError("address") ? errorInputClass : inputClass, "min-h-[70px] resize-y")}
              />,
              "Alamat lengkap kantor pusat beserta kode pos"
            )}
            {fieldWrapper("indonesiaOfficeAddress", "Alamat Kantor Rep. Indonesia",
              <textarea
                placeholder="Contoh: Jl. Gatot Subroto No. 5, Jakarta Selatan"
                value={indonesiaOfficeAddress}
                onChange={(e) => handleChange("indonesiaOfficeAddress", e.target.value, setIndonesiaOfficeAddress)}
                onBlur={() => handleBlur("indonesiaOfficeAddress")}
                className={cn(inputClass, "min-h-[70px] resize-y")}
              />,
              "Isi jika berbeda dengan alamat kantor pusat",
              false
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldWrapper("phone", "Nomor Telp Perusahaan",
                <input
                  type="text"
                  placeholder="Contoh: (021) 123-4567"
                  value={phone}
                  onChange={(e) => handlePhoneChange("phone", e.target.value, setPhone)}
                  onBlur={() => handleBlur("phone")}
                  className={getError("phone") ? errorInputClass : inputClass}
                />,
                "Nomor telepon kantor, 7-15 digit"
              )}
              {fieldWrapper("companyEmail", "Alamat Email Perusahaan",
                <input
                  type="email"
                  placeholder="Contoh: info@perusahaan.co.id"
                  value={companyEmail}
                  onChange={(e) => handleChange("companyEmail", e.target.value, setCompanyEmail)}
                  onBlur={() => handleBlur("companyEmail")}
                  className={getError("companyEmail") ? errorInputClass : inputClass}
                />,
                "Email resmi perusahaan untuk korespondensi"
              )}
            </div>
          </div>
        )}

        {/* Step 2: Kontak & Dokumen */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Contact Person & Dokumen</h2>
            <p className="text-sm text-ptba-gray">Data penanggung jawab dan dokumen identitas perusahaan.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldWrapper("contactName", "Nama CP",
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={contactName}
                  onChange={(e) => handleChange("contactName", e.target.value, setContactName)}
                  onBlur={() => handleBlur("contactName")}
                  className={getError("contactName") ? errorInputClass : inputClass}
                />,
                "Nama lengkap contact person"
              )}
              {fieldWrapper("contactPhone", "Nomor Telp CP",
                <input
                  type="text"
                  placeholder="Contoh: 0812-3456-7890"
                  value={contactPhone}
                  onChange={(e) => handlePhoneChange("contactPhone", e.target.value, setContactPhone)}
                  onBlur={() => handleBlur("contactPhone")}
                  className={getError("contactPhone") ? errorInputClass : inputClass}
                />,
                "Nomor HP contact person, 7-15 digit"
              )}
            </div>
            {fieldWrapper("contactEmail", "Email CP",
              <input
                type="email"
                placeholder="Contoh: budi@perusahaan.co.id"
                value={contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value, setContactEmail)}
                onBlur={() => handleBlur("contactEmail")}
                className={getError("contactEmail") ? errorInputClass : inputClass}
              />,
              "Email contact person untuk komunikasi"
            )}

            <div className="border-t border-ptba-light-gray pt-4 mt-2">
              {fieldWrapper("nib", "NIB (Nomor Induk Berusaha)",
                <input
                  type="text"
                  placeholder="Contoh: 1234567890123"
                  value={nib}
                  onChange={(e) => handleChange("nib", e.target.value, setNib)}
                  onBlur={() => handleBlur("nib")}
                  className={getError("nib") ? errorInputClass : inputClass}
                />,
                "Nomor Induk Berusaha dari OSS"
              )}
            </div>

            {/* Logo Upload */}
            <div className="border-t border-ptba-light-gray pt-4 mt-2">
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">
                Upload Logo Perusahaan
              </label>
              {logoPreview ? (
                <div className="flex items-center gap-4 rounded-lg border border-ptba-light-gray bg-ptba-off-white p-4">
                  <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-lg object-contain border border-ptba-light-gray bg-white" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ptba-charcoal">{logoFile?.name}</p>
                    <p className="text-xs text-ptba-gray">{logoFile ? (logoFile.size / 1024).toFixed(1) + " KB" : ""}</p>
                  </div>
                  <button onClick={removeLogo} className="rounded-lg p-1.5 text-ptba-gray hover:bg-red-50 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ptba-light-gray bg-ptba-off-white px-4 py-6 text-sm text-ptba-gray hover:border-ptba-steel-blue hover:bg-ptba-section-bg transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span>Klik untuk upload logo (maks. 2MB)</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              {fieldErrors.logo && <p className="mt-1 text-xs text-red-500">{fieldErrors.logo}</p>}
              <p className="mt-1 text-xs text-ptba-gray">Format: JPG, PNG, SVG. Opsional.</p>
            </div>
          </div>
        )}

        {/* Step 3: Buat Akun */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">Buat Akun Login</h2>
            <p className="text-sm text-ptba-gray">Buat akun untuk mengakses Portal Mitra PTBA.</p>
            {fieldWrapper("email", "Email Akun",
              <input
                type="email"
                placeholder="Contoh: akun@perusahaan.co.id"
                value={email}
                onChange={(e) => handleChange("email", e.target.value, setEmail)}
                onBlur={() => handleBlur("email")}
                className={getError("email") ? errorInputClass : inputClass}
              />,
              "Email ini akan digunakan untuk login ke portal"
            )}
            {fieldWrapper("password", "Kata Sandi",
              <input
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => handleChange("password", e.target.value, setPassword)}
                onBlur={() => handleBlur("password")}
                className={getError("password") ? errorInputClass : inputClass}
              />,
              "Gunakan kombinasi huruf besar, kecil, dan angka"
            )}
            {fieldWrapper("confirmPassword", "Konfirmasi Kata Sandi",
              <input
                type="password"
                placeholder="Ketik ulang kata sandi"
                value={confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value, setConfirmPassword)}
                onBlur={() => handleBlur("confirmPassword")}
                className={getError("confirmPassword") ? errorInputClass : inputClass}
              />,
              "Harus sama dengan kata sandi di atas"
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-ptba-light-gray">
          <button
            onClick={currentStep === 1 ? () => router.push("/login") : goPrev}
            className="rounded-lg border border-ptba-navy px-4 py-2 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
            disabled={loading}
          >
            {currentStep === 1 ? "Kembali ke Login" : "Sebelumnya"}
          </button>
          {currentStep < 3 ? (
            <button onClick={goNext} className="rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
              Selanjutnya
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Mendaftar..." : "Daftar"}
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
