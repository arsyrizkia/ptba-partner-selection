"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { authApi, api, ApiClientError } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";

// --- Validation helpers ---
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidDomain = (v: string) => /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(v);
const isValidPhone = (v: string) => {
  const digitsOnly = v.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};
const isPhoneChar = (v: string) => /^[\d\s()+\-]*$/.test(v);
const isValidCompanyCode = (v: string) => /^[a-zA-Z0-9\-]{2,20}$/.test(v);
const getEmailDomain = (email: string) => {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : "";
};

type FieldErrors = Record<string, string>;
type FieldWarnings = Record<string, string>;

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("register");
  const { locale, setLocale } = useLocale();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fieldWarnings, setFieldWarnings] = useState<FieldWarnings>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const STEPS = [
    { key: 1, label: t("steps.companyData") },
    { key: 2, label: t("steps.contactDocs") },
    { key: 3, label: t("steps.createAccount") },
  ];

  // Step 1: Data Perusahaan
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [businessOverview, setBusinessOverview] = useState("");
  const [address, setAddress] = useState("");
  const [indonesiaOfficeAddress, setIndonesiaOfficeAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");

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
      setFieldErrors((prev) => ({ ...prev, logo: t("logo.imageOnly") }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, logo: t("logo.maxSize") }));
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
    let warn = "";
    switch (field) {
      case "companyName":
        if (!companyName.trim()) err = t("errors.companyNameRequired");
        else if (companyName.trim().length < 3) err = t("errors.companyNameMin");
        break;
      case "companyCode":
        if (!companyCode.trim()) err = t("errors.companyCodeRequired");
        else if (!isValidCompanyCode(companyCode.trim()))
          err = t("errors.companyCodeFormat");
        break;
      case "businessOverview":
        if (!businessOverview.trim()) err = t("errors.businessOverviewRequired");
        break;
      case "address":
        if (!address.trim()) err = t("errors.addressRequired");
        break;
      case "phone":
        if (!phone.trim()) err = t("errors.phoneRequired");
        else if (!isValidPhone(phone.trim()))
          err = t("errors.phoneFormat");
        break;
      case "companyDomain":
        if (!companyDomain.trim()) err = t("errors.domainRequired");
        else if (!isValidDomain(companyDomain.trim()))
          err = t("errors.domainFormat");
        break;
      case "contactName":
        if (!contactName.trim()) err = t("errors.contactNameRequired");
        break;
      case "contactPhone":
        if (!contactPhone.trim()) err = t("errors.contactPhoneRequired");
        else if (!isValidPhone(contactPhone.trim()))
          err = t("errors.phoneFormat");
        break;
      case "contactEmail":
        if (!contactEmail.trim()) err = t("errors.contactEmailRequired");
        else if (!isValidEmail(contactEmail.trim()))
          err = t("errors.contactEmailFormat");
        else if (companyDomain.trim() && getEmailDomain(contactEmail.trim()) !== companyDomain.trim().toLowerCase())
          warn = t("errors.contactEmailDomain", { domain: companyDomain.trim() });
        break;
      case "nib":
        if (!nib.trim()) err = t("errors.nibRequired");
        break;
      case "email":
        if (!email.trim()) err = t("errors.emailRequired");
        else if (!isValidEmail(email.trim()))
          err = t("errors.emailFormat");
        else if (companyDomain.trim() && getEmailDomain(email.trim()) !== companyDomain.trim().toLowerCase())
          warn = t("errors.emailDomain", { domain: companyDomain.trim() });
        break;
      case "password":
        if (!password) err = t("errors.passwordRequired");
        else if (password.length < 8) err = t("errors.passwordMin");
        break;
      case "confirmPassword":
        if (!confirmPassword) err = t("errors.confirmPasswordRequired");
        else if (confirmPassword !== password)
          err = t("errors.confirmPasswordMismatch");
        break;
    }
    setFieldErrors((prev) => {
      if (err) return { ...prev, [field]: err };
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFieldWarnings((prev) => {
      if (warn) return { ...prev, [field]: warn };
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return err;
  };

  const validateStep = (step: number): boolean => {
    const fieldsPerStep: Record<number, string[]> = {
      1: ["companyName", "companyCode", "businessOverview", "address", "phone", "companyDomain"],
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
    if (currentStep === 2 && !email) {
      setEmail(contactEmail);
    }
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
        companyDomain: companyDomain.trim(),
        nib,
        contactPerson: contactName,
        contactPhone,
        contactEmail,
      }, logoFile || undefined);

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(t("errors.submitFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) =>
    touched[field] ? fieldErrors[field] : undefined;

  const getWarning = (field: string) =>
    touched[field] && !fieldErrors[field] ? fieldWarnings[field] : undefined;

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
      ) : getWarning(field) ? (
        <p className="mt-1 text-xs text-amber-600">{getWarning(field)}</p>
      ) : (
        <p className="mt-1 text-xs text-ptba-gray">{hint}</p>
      )}
    </div>
  );

  const toggleLocale = () => {
    setLocale(locale === "id" ? "en" : "id" as Locale);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ptba-navy via-[#1e4570] to-ptba-navy-light px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-ptba-gold/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ptba-steel-blue/5" />
      </div>

      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleLocale}
            className="flex items-center rounded-lg border border-ptba-light-gray px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-ptba-section-bg"
          >
            <span className={cn("px-1", locale === "id" ? "text-ptba-navy" : "text-ptba-gray")}>
              ID
            </span>
            <span className="text-ptba-light-gray">|</span>
            <span className={cn("px-1", locale === "en" ? "text-ptba-navy" : "text-ptba-gray")}>
              EN
            </span>
          </button>
        </div>

        {/* Branding */}
        <div className="mb-4 flex flex-col items-center">
          <Image src="/ptba-logo.svg" alt="PT Bukit Asam Persero Tbk" width={200} height={36} priority />
          <p className="mt-3 text-sm text-ptba-gray">{t("subtitle")}</p>
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
            <h2 className="text-lg font-semibold text-ptba-charcoal">{t("step1Title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldWrapper("companyName", t("fields.companyName"),
                <input
                  type="text"
                  placeholder={t("fields.companyNamePlaceholder")}
                  value={companyName}
                  onChange={(e) => handleChange("companyName", e.target.value, setCompanyName)}
                  onBlur={() => handleBlur("companyName")}
                  className={getError("companyName") ? errorInputClass : inputClass}
                />,
                t("fields.companyNameHint")
              )}
              {fieldWrapper("companyCode", t("fields.companyCode"),
                <input
                  type="text"
                  placeholder={t("fields.companyCodePlaceholder")}
                  value={companyCode}
                  onChange={(e) => handleChange("companyCode", e.target.value, setCompanyCode)}
                  onBlur={() => handleBlur("companyCode")}
                  className={getError("companyCode") ? errorInputClass : inputClass}
                />,
                t("fields.companyCodeHint")
              )}
            </div>
            {fieldWrapper("businessOverview", t("fields.businessOverview"),
              <textarea
                placeholder={t("fields.businessOverviewPlaceholder")}
                value={businessOverview}
                onChange={(e) => handleChange("businessOverview", e.target.value, setBusinessOverview)}
                onBlur={() => handleBlur("businessOverview")}
                className={cn(getError("businessOverview") ? errorInputClass : inputClass, "min-h-[70px] resize-y")}
              />,
              t("fields.businessOverviewHint")
            )}
            {fieldWrapper("address", t("fields.address"),
              <textarea
                placeholder={t("fields.addressPlaceholder")}
                value={address}
                onChange={(e) => handleChange("address", e.target.value, setAddress)}
                onBlur={() => handleBlur("address")}
                className={cn(getError("address") ? errorInputClass : inputClass, "min-h-[70px] resize-y")}
              />,
              t("fields.addressHint")
            )}
            {fieldWrapper("indonesiaOfficeAddress", t("fields.indonesiaOffice"),
              <textarea
                placeholder={t("fields.indonesiaOfficePlaceholder")}
                value={indonesiaOfficeAddress}
                onChange={(e) => handleChange("indonesiaOfficeAddress", e.target.value, setIndonesiaOfficeAddress)}
                onBlur={() => handleBlur("indonesiaOfficeAddress")}
                className={cn(inputClass, "min-h-[70px] resize-y")}
              />,
              t("fields.indonesiaOfficeHint"),
              false
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldWrapper("phone", t("fields.phone"),
                <input
                  type="text"
                  placeholder={t("fields.phonePlaceholder")}
                  value={phone}
                  onChange={(e) => handlePhoneChange("phone", e.target.value, setPhone)}
                  onBlur={() => handleBlur("phone")}
                  className={getError("phone") ? errorInputClass : inputClass}
                />,
                t("fields.phoneHint")
              )}
              {fieldWrapper("companyDomain", t("fields.companyDomain"),
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ptba-gray">@</span>
                  <input
                    type="text"
                    placeholder={t("fields.companyDomainPlaceholder")}
                    value={companyDomain}
                    onChange={(e) => handleChange("companyDomain", e.target.value.replace(/^@/, ""), setCompanyDomain)}
                    onBlur={() => handleBlur("companyDomain")}
                    className={cn(getError("companyDomain") ? errorInputClass : inputClass, "pl-7")}
                  />
                </div>,
                t("fields.companyDomainHint")
              )}
            </div>
          </div>
        )}

        {/* Step 2: Kontak & Dokumen */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">{t("step2Title")}</h2>
            <p className="text-sm text-ptba-gray">{t("step2Desc")}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldWrapper("contactName", t("fields.contactName"),
                <input
                  type="text"
                  placeholder={t("fields.contactNamePlaceholder")}
                  value={contactName}
                  onChange={(e) => handleChange("contactName", e.target.value, setContactName)}
                  onBlur={() => handleBlur("contactName")}
                  className={getError("contactName") ? errorInputClass : inputClass}
                />,
                t("fields.contactNameHint")
              )}
              {fieldWrapper("contactPhone", t("fields.contactPhone"),
                <input
                  type="text"
                  placeholder={t("fields.contactPhonePlaceholder")}
                  value={contactPhone}
                  onChange={(e) => handlePhoneChange("contactPhone", e.target.value, setContactPhone)}
                  onBlur={() => handleBlur("contactPhone")}
                  className={getError("contactPhone") ? errorInputClass : inputClass}
                />,
                t("fields.contactPhoneHint")
              )}
            </div>
            {fieldWrapper("contactEmail", t("fields.contactEmail"),
              <input
                type="email"
                placeholder={companyDomain ? `name@${companyDomain}` : t("fields.contactEmailPlaceholder")}
                value={contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value, setContactEmail)}
                onBlur={() => handleBlur("contactEmail")}
                className={getError("contactEmail") ? errorInputClass : inputClass}
              />,
              companyDomain ? t("fields.contactEmailHint") + ` (@${companyDomain})` : t("fields.contactEmailHint")
            )}

            <div className="border-t border-ptba-light-gray pt-4 mt-2">
              {fieldWrapper("nib", t("fields.nib"),
                <input
                  type="text"
                  placeholder={t("fields.nibPlaceholder")}
                  value={nib}
                  onChange={(e) => handleChange("nib", e.target.value, setNib)}
                  onBlur={() => handleBlur("nib")}
                  className={getError("nib") ? errorInputClass : inputClass}
                />,
                t("fields.nibHint")
              )}
            </div>

            {/* Logo Upload */}
            <div className="border-t border-ptba-light-gray pt-4 mt-2">
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">
                {t("logo.label")}
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
                  <span>{t("logo.dropzone")}</span>
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
              <p className="mt-1 text-xs text-ptba-gray">{t("logo.format")}</p>
            </div>
          </div>
        )}

        {/* Step 3: Buat Akun */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ptba-charcoal">{t("step3Title")}</h2>
            <p className="text-sm text-ptba-gray">{t("step3Desc")}</p>
            {fieldWrapper("email", t("fields.email"),
              <input
                type="email"
                placeholder={companyDomain ? `name@${companyDomain}` : t("fields.emailPlaceholder")}
                value={email}
                onChange={(e) => handleChange("email", e.target.value, setEmail)}
                onBlur={() => handleBlur("email")}
                className={getError("email") ? errorInputClass : inputClass}
              />,
              t("fields.emailHint")
            )}
            {fieldWrapper("password", t("fields.password"),
              <input
                type="password"
                placeholder={t("fields.passwordPlaceholder")}
                value={password}
                onChange={(e) => handleChange("password", e.target.value, setPassword)}
                onBlur={() => handleBlur("password")}
                className={getError("password") ? errorInputClass : inputClass}
              />,
              t("fields.passwordHint")
            )}
            {fieldWrapper("confirmPassword", t("fields.confirmPassword"),
              <input
                type="password"
                placeholder={t("fields.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value, setConfirmPassword)}
                onBlur={() => handleBlur("confirmPassword")}
                className={getError("confirmPassword") ? errorInputClass : inputClass}
              />,
              t("fields.confirmPasswordHint")
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
            {currentStep === 1 ? t("buttons.backToLogin") : t("buttons.previous")}
          </button>
          {currentStep < 3 ? (
            <button onClick={goNext} className="rounded-lg bg-ptba-navy px-4 py-2 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors">
              {t("buttons.next")}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-ptba-gold px-4 py-2 text-sm font-bold text-ptba-charcoal hover:bg-ptba-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("buttons.registering") : t("buttons.register")}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-ptba-gray">
          {t("alreadyHaveAccount")}{" "}
          <a href="/login" className="font-semibold text-ptba-steel-blue hover:text-ptba-navy transition-colors">
            {t("login")}
          </a>
        </p>
      </div>
    </div>
  );
}
