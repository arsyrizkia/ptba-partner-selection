"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, MapPin, Phone, Mail, Globe, FileText, User, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi, partnerApi, ApiClientError, type PartnerProfile, type UpdatePartnerInput } from "@/lib/api/client";

// ─── Types ───

interface ProfileFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  npwp: string;
  siup: string;
  contactPerson: string;
  contactPhone: string;
  industry: string;
}

function toFormData(p: PartnerProfile): ProfileFormData {
  return {
    name: p.name || "",
    address: p.address || "",
    phone: p.phone || "",
    email: p.email || "",
    website: p.website || "",
    npwp: p.npwp || "",
    siup: p.siup || "",
    contactPerson: p.contact_person || "",
    contactPhone: p.contact_phone || "",
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
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editForm, setEditForm] = useState<ProfileFormData>({
    name: "", address: "", phone: "", email: "", website: "",
    npwp: "", siup: "", contactPerson: "", contactPhone: "", industry: "",
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
      setError(err instanceof Error ? err.message : "Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  }, [user?.partnerId, accessToken]);

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
        address: editForm.address,
        phone: editForm.phone,
        email: editForm.email || undefined,
        website: editForm.website || undefined,
        npwp: editForm.npwp,
        siup: editForm.siup,
        contact_person: editForm.contactPerson,
        contact_phone: editForm.contactPhone,
      };
      const updated = await partnerApi(accessToken).update(partner.id, payload);
      setPartner(updated);
      setEditForm(toFormData(updated));
      setIsEditing(false);
      setSaveMessage("Profil berhasil disimpan");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : "Gagal menyimpan profil");
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
        <span className="ml-3 text-ptba-gray">Memuat profil...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button onClick={fetchPartner} className="mt-3 text-sm font-medium text-ptba-steel-blue hover:underline">
          Coba lagi
        </button>
      </div>
    );
  }

  if (!partner) return null;

  const profile = toFormData(partner);

  if (isEditing) {
    const fields: { key: keyof ProfileFormData; label: string }[] = [
      { key: "name", label: "Nama Perusahaan" },
      { key: "address", label: "Alamat" },
      { key: "phone", label: "Telepon" },
      { key: "email", label: "Email" },
      { key: "website", label: "Website" },
      { key: "npwp", label: "NPWP" },
      { key: "siup", label: "SIUP" },
      { key: "contactPerson", label: "Kontak Person" },
      { key: "contactPhone", label: "Telepon Kontak" },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ptba-charcoal">Edit Profil Perusahaan</h2>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">{field.label}</label>
              <input
                type="text"
                value={editForm[field.key]}
                onChange={(e) => setEditForm((p) => ({ ...p, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-4 py-2.5 text-sm text-ptba-charcoal focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20 outline-none"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handleCancel} disabled={saving} className="rounded-lg border border-ptba-light-gray px-4 py-2 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-ptba-gold px-6 py-2 text-sm font-bold text-ptba-charcoal shadow-md hover:bg-ptba-gold-light transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ptba-charcoal">Informasi Perusahaan</h2>
        <button
          onClick={() => { setEditForm(toFormData(partner)); setIsEditing(true); }}
          className="rounded-lg border border-ptba-steel-blue px-4 py-2 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue hover:text-white transition-colors"
        >
          Edit Profil
        </button>
      </div>

      {saveMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-ptba-charcoal">Data Perusahaan</h3>
          <ProfileField icon={<Building2 className="h-4 w-4" />} label="Nama Perusahaan" value={profile.name} />
          <ProfileField icon={<MapPin className="h-4 w-4" />} label="Alamat" value={profile.address} />
          <ProfileField icon={<Phone className="h-4 w-4" />} label="Telepon" value={profile.phone} />
          <ProfileField icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
          <ProfileField icon={<Globe className="h-4 w-4" />} label="Website" value={profile.website} />
          <ProfileField icon={<FileText className="h-4 w-4" />} label="Industri" value={profile.industry} />
          <ProfileField icon={<FileText className="h-4 w-4" />} label="Tanggal Registrasi" value={partner.registration_date ? new Date(partner.registration_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"} />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-ptba-charcoal">Dokumen Legal</h3>
            <ProfileField icon={<FileText className="h-4 w-4" />} label="NPWP" value={profile.npwp} />
            <ProfileField icon={<FileText className="h-4 w-4" />} label="SIUP" value={profile.siup} />
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-ptba-charcoal">Kontak Person</h3>
            <ProfileField icon={<User className="h-4 w-4" />} label="Nama" value={profile.contactPerson} />
            <ProfileField icon={<Phone className="h-4 w-4" />} label="Telepon" value={profile.contactPhone} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Akun ───

function AccountTab() {
  const { user, accessToken } = useAuth();
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
      setMessage("Password lama wajib diisi");
      setMessageType("error");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Password baru minimal 8 karakter");
      setMessageType("error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Konfirmasi password tidak cocok");
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
        setMessage("Gagal mengubah password");
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
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Informasi Akun</h2>
        <ProfileField icon={<User className="h-4 w-4" />} label="Nama" value={user?.name || "-"} />
        <ProfileField icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email || "-"} />
        <ProfileField icon={<FileText className="h-4 w-4" />} label="Role" value="Mitra" />
      </div>

      {/* Change Password */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Ubah Password</h2>
        <p className="mb-4 text-sm text-ptba-gray">Pastikan password baru minimal 8 karakter.</p>

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
          {passwordInput("Password Lama", currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent(!showCurrent), "Masukkan password lama")}
          {passwordInput("Password Baru", newPassword, setNewPassword, showNew, () => setShowNew(!showNew), "Minimal 8 karakter")}
          {passwordInput("Konfirmasi Password Baru", confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(!showConfirm), "Ketik ulang password baru")}

          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="rounded-lg bg-ptba-gold px-6 py-2.5 text-sm font-bold text-ptba-charcoal shadow-md hover:bg-ptba-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Ubah Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───

type TabKey = "company" | "account";

export default function MitraProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("company");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "company", label: "Profil Perusahaan", icon: <Building2 className="h-4 w-4" /> },
    { key: "account", label: "Akun", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ptba-charcoal">Profil</h1>

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
