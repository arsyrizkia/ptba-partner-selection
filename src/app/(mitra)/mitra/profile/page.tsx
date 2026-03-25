"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, MapPin, Phone, Mail, Globe, FileText, User, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi, partnerApi, ApiClientError, type PartnerProfile, type UpdatePartnerInput } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";

// ─── Types ───

interface ProfileFormData {
  name: string;
  businessOverview: string;
  address: string;
  indonesiaOfficeAddress: string;
  phone: string;
  companyDomain: string;
  website: string;
  npwp: string;
  nib: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  industry: string;
}

function toFormData(p: PartnerProfile): ProfileFormData {
  return {
    name: p.name || "",
    businessOverview: p.business_overview || "",
    address: p.address || "",
    indonesiaOfficeAddress: p.indonesia_office_address || "",
    phone: p.phone || "",
    companyDomain: p.company_domain || "",
    website: p.website || "",
    npwp: p.npwp || "",
    nib: p.nib || "",
    contactPerson: p.contact_person || "",
    contactPhone: p.contact_phone || "",
    contactEmail: p.contact_email || "",
    industry: p.industry || "",
  };
}

// ─── Shared Components ───

function ProfileField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-ptba-light-gray/50 last:border-b-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ptba-section-bg text-ptba-steel-blue">
        {icon}
      </div>
      <div>
        <p className="text-xs text-ptba-gray">{label}</p>
        <p className="text-sm font-medium text-ptba-charcoal">{value || "-"}</p>
      </div>
    </div>
  );
}

// ─── Tab: Profil Perusahaan ───

function CompanyProfileTab() {
  const { user, accessToken } = useAuth();
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { locale } = useLocale();
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editForm, setEditForm] = useState<ProfileFormData>({
    name: "", businessOverview: "", address: "", indonesiaOfficeAddress: "",
    phone: "", companyDomain: "", website: "", npwp: "", nib: "",
    contactPerson: "", contactPhone: "", contactEmail: "", industry: "",
  });

  const fetchPartner = useCallback(async () => {
    if (!user?.partnerId || !accessToken) return;
    setLoading(true);
    setError("");
    try {
      const data = await partnerApi(accessToken).getById(user.partnerId);
      setPartner(data);
      setEditForm(toFormData(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("company.profileLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [user?.partnerId, accessToken, t]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  const handleSave = async () => {
    if (!partner || !accessToken) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const payload: UpdatePartnerInput = {
        name: editForm.name,
        business_overview: editForm.businessOverview || undefined,
        address: editForm.address,
        indonesia_office_address: editForm.indonesiaOfficeAddress || undefined,
        phone: editForm.phone,
        company_domain: editForm.companyDomain || undefined,
        website: editForm.website || undefined,
        npwp: editForm.npwp || undefined,
        nib: editForm.nib || undefined,
        contact_person: editForm.contactPerson,
        contact_phone: editForm.contactPhone,
        contact_email: editForm.contactEmail || undefined,
      };
      const updated = await partnerApi(accessToken).update(partner.id, payload);
      setPartner(updated);
      setEditForm(toFormData(updated));
      setIsEditing(false);
      setSaveMessage(t("company.profileSaved"));
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : t("company.profileSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (partner) setEditForm(toFormData(partner));
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">{tc("loadingProfile")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button onClick={fetchPartner} className="mt-3 text-sm font-medium text-ptba-steel-blue hover:underline">
          {tc("retry")}
        </button>
      </div>
    );
  }

  if (!partner) return null;

  const profile = toFormData(partner);

  if (isEditing) {
    const fields: { key: keyof ProfileFormData; label: string; multiline?: boolean }[] = [
      { key: "name", label: t("company.companyName") },
      { key: "businessOverview", label: t("company.businessOverview"), multiline: true },
      { key: "address", label: t("company.hqAddress"), multiline: true },
      { key: "indonesiaOfficeAddress", label: t("company.indonesiaOffice"), multiline: true },
      { key: "phone", label: t("company.companyPhone") },
      { key: "companyDomain", label: t("company.companyDomain") },
      { key: "nib", label: t("company.nib") },
      { key: "contactPerson", label: t("company.cpName") },
      { key: "contactPhone", label: t("company.cpPhone") },
      { key: "contactEmail", label: t("company.cpEmail") },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ptba-charcoal">{t("company.editTitle")}</h2>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">{field.label}</label>
              {field.multiline ? (
                <textarea
                  value={editForm[field.key]}
                  onChange={(e) => setEditForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-4 py-2.5 text-sm text-ptba-charcoal focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20 outline-none min-h-[70px] resize-y"
                />
              ) : (
                <input
                  type="text"
                  value={editForm[field.key]}
                  onChange={(e) => setEditForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-4 py-2.5 text-sm text-ptba-charcoal focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20 outline-none"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handleCancel} disabled={saving} className="rounded-lg border border-ptba-light-gray px-4 py-2 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors">
              {tc("cancel")}
            </button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-ptba-gold px-6 py-2 text-sm font-bold text-ptba-charcoal shadow-md hover:bg-ptba-gold-light transition-colors disabled:opacity-50">
              {saving ? tc("saving") : tc("save")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ptba-charcoal">{t("company.title")}</h2>
        <button
          onClick={() => { setEditForm(toFormData(partner)); setIsEditing(true); }}
          className="rounded-lg border border-ptba-steel-blue px-4 py-2 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue hover:text-white transition-colors"
        >
          {t("company.editProfile")}
        </button>
      </div>

      {saveMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-ptba-charcoal">{t("company.companyData")}</h3>
          <ProfileField icon={<Building2 className="h-4 w-4" />} label={t("company.companyName")} value={profile.name} />
          <ProfileField icon={<FileText className="h-4 w-4" />} label={t("company.businessOverview")} value={profile.businessOverview} />
          <ProfileField icon={<MapPin className="h-4 w-4" />} label={t("company.hqAddress")} value={profile.address} />
          <ProfileField icon={<MapPin className="h-4 w-4" />} label={t("company.indonesiaOffice")} value={profile.indonesiaOfficeAddress} />
          <ProfileField icon={<Phone className="h-4 w-4" />} label={t("company.companyPhone")} value={profile.phone} />
          <ProfileField icon={<Mail className="h-4 w-4" />} label={t("company.companyDomain")} value={profile.companyDomain ? `@${profile.companyDomain}` : "-"} />
          <ProfileField icon={<FileText className="h-4 w-4" />} label={t("company.registrationDate")} value={partner.registration_date ? new Date(partner.registration_date).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"} />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-ptba-charcoal">{t("company.identityDocs")}</h3>
            <ProfileField icon={<FileText className="h-4 w-4" />} label={t("company.nib")} value={profile.nib} />
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-ptba-charcoal">{t("company.contactPerson")}</h3>
            <ProfileField icon={<User className="h-4 w-4" />} label={t("company.cpName")} value={profile.contactPerson} />
            <ProfileField icon={<Phone className="h-4 w-4" />} label={t("company.cpPhone")} value={profile.contactPhone} />
            <ProfileField icon={<Mail className="h-4 w-4" />} label={t("company.cpEmail")} value={profile.contactEmail} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Akun ───

function AccountTab() {
  const { user, accessToken } = useAuth();
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const handleChangePassword = async () => {
    setMessage("");
    if (!currentPassword) {
      setMessage(t("account.errors.currentRequired"));
      setMessageType("error");
      return;
    }
    if (newPassword.length < 8) {
      setMessage(t("account.errors.newTooShort"));
      setMessageType("error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage(t("account.errors.confirmMismatch"));
      setMessageType("error");
      return;
    }

    setSaving(true);
    try {
      const res = await authApi().changePassword(currentPassword, newPassword, accessToken!);
      setMessage(res.message);
      setMessageType("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setMessage(err.message);
      } else {
        setMessage(t("account.errors.changeFailed"));
      }
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const passwordInput = (
    label: string,
    value: string,
    setter: (v: string) => void,
    show: boolean,
    toggleShow: () => void,
    placeholder: string,
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ptba-charcoal">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ptba-gray" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setter(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white py-2.5 pl-10 pr-10 text-sm text-ptba-charcoal outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ptba-gray hover:text-ptba-charcoal"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">{t("account.title")}</h2>
        <ProfileField icon={<User className="h-4 w-4" />} label={t("account.name")} value={user?.name || "-"} />
        <ProfileField icon={<Mail className="h-4 w-4" />} label={t("account.email")} value={user?.email || "-"} />
        <ProfileField icon={<FileText className="h-4 w-4" />} label={t("account.role")} value={tc("mitra")} />
      </div>

      {/* Change Password */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">{t("account.changePassword")}</h2>
        <p className="mb-4 text-sm text-ptba-gray">{t("account.passwordHint")}</p>

        {message && (
          <div className={cn(
            "mb-4 rounded-lg border px-4 py-3 text-sm",
            messageType === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            {message}
          </div>
        )}

        <div className="space-y-4 max-w-md">
          {passwordInput(t("account.currentPassword"), currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent(!showCurrent), t("account.currentPasswordPlaceholder"))}
          {passwordInput(t("account.newPassword"), newPassword, setNewPassword, showNew, () => setShowNew(!showNew), t("account.newPasswordPlaceholder"))}
          {passwordInput(t("account.confirmPassword"), confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(!showConfirm), t("account.confirmPasswordPlaceholder"))}

          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="rounded-lg bg-ptba-gold px-6 py-2.5 text-sm font-bold text-ptba-charcoal shadow-md hover:bg-ptba-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? tc("saving") : t("account.changePasswordBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───

type TabKey = "company" | "account";

export default function MitraProfilePage() {
  const t = useTranslations("profile");
  const [activeTab, setActiveTab] = useState<TabKey>("company");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "company", label: t("tabs.company"), icon: <Building2 className="h-4 w-4" /> },
    { key: "account", label: t("tabs.account"), icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">{t("title")}</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-ptba-section-bg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-white text-ptba-navy shadow-sm"
                : "text-ptba-gray hover:text-ptba-charcoal"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "company" && <CompanyProfileTab />}
      {activeTab === "account" && <AccountTab />}
    </div>
  );
}
