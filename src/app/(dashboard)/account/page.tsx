"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Building2,
  Shield,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLES } from "@/lib/constants/roles";
import { cn } from "@/lib/utils/cn";

type Tab = "profil" | "keamanan" | "notifikasi";

export default function AccountPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("0812-3456-7890");
  const [showSaved, setShowSaved] = useState(false);

  // Security state
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    emailProyek: true,
    emailEvaluasi: true,
    emailPersetujuan: true,
    emailSLA: false,
    systemProyek: true,
    systemEvaluasi: true,
    systemPersetujuan: true,
    systemSLA: true,
  });

  const roleLabel = ROLES.find((r) => r.value === role)?.label ?? "";
  const roleDescription = ROLES.find((r) => r.value === role)?.description ?? "";

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  const handleSaveProfile = () => {
    setIsEditing(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleSavePassword = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profil", label: "Profil", icon: <User className="h-4 w-4" /> },
    { key: "keamanan", label: "Keamanan", icon: <Lock className="h-4 w-4" /> },
    { key: "notifikasi", label: "Notifikasi", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ptba-navy text-2xl font-bold text-white">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ptba-steel-blue text-white shadow-md hover:bg-ptba-navy transition-colors">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-ptba-charcoal">{user?.name ?? "—"}</h1>
            <p className="text-sm text-ptba-gray">{user?.email ?? "—"}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-ptba-navy/10 px-2.5 py-0.5 text-xs font-semibold text-ptba-navy">
                <Shield className="h-3 w-3" />
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-ptba-section-bg px-2.5 py-0.5 text-xs text-ptba-gray">
                <Building2 className="h-3 w-3" />
                {user?.department ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-ptba-section-bg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all",
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

      {/* Profile Tab */}
      {activeTab === "profil" && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-ptba-charcoal">Informasi Profil</h2>
              <p className="text-xs text-ptba-gray mt-0.5">Kelola informasi akun Anda</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg border border-ptba-steel-blue px-4 py-2 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue hover:text-white transition-colors"
              >
                Edit Profil
              </button>
            )}
          </div>

          {showSaved && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Profil berhasil disimpan
            </div>
          )}

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                <User className="h-4 w-4 text-ptba-gray" />
                Nama Lengkap
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-charcoal focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                />
              ) : (
                <p className="rounded-lg bg-ptba-section-bg px-4 py-2.5 text-sm text-ptba-charcoal">{name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                <Mail className="h-4 w-4 text-ptba-gray" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-charcoal focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                />
              ) : (
                <p className="rounded-lg bg-ptba-section-bg px-4 py-2.5 text-sm text-ptba-charcoal">{email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                <Phone className="h-4 w-4 text-ptba-gray" />
                Nomor Telepon
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-charcoal focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                />
              ) : (
                <p className="rounded-lg bg-ptba-section-bg px-4 py-2.5 text-sm text-ptba-charcoal">{phone}</p>
              )}
            </div>

            {/* Department (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                <Building2 className="h-4 w-4 text-ptba-gray" />
                Departemen
              </label>
              <p className="rounded-lg bg-ptba-section-bg px-4 py-2.5 text-sm text-ptba-charcoal">{user?.department ?? "—"}</p>
              {isEditing && <p className="text-[10px] text-ptba-gray mt-1">Departemen dikelola oleh admin</p>}
            </div>

            {/* Role (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                <Shield className="h-4 w-4 text-ptba-gray" />
                Peran
              </label>
              <div className="rounded-lg bg-ptba-section-bg px-4 py-2.5">
                <p className="text-sm font-medium text-ptba-charcoal">{roleLabel}</p>
                <p className="text-xs text-ptba-gray">{roleDescription}</p>
              </div>
              {isEditing && <p className="text-[10px] text-ptba-gray mt-1">Peran dikelola oleh admin</p>}
            </div>

            {/* ID */}
            <div>
              <label className="text-sm font-medium text-ptba-charcoal mb-1.5 block">ID Pengguna</label>
              <p className="rounded-lg bg-ptba-section-bg px-4 py-2.5 text-sm text-ptba-gray font-mono">{user?.id ?? "—"}</p>
            </div>

            {/* Save / Cancel buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setIsEditing(false); setName(user?.name ?? ""); setEmail(user?.email ?? ""); setPhone("0812-3456-7890"); }}
                  className="rounded-lg border border-ptba-light-gray px-5 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ptba-steel-blue transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "keamanan" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-1">Ubah Kata Sandi</h2>
            <p className="text-xs text-ptba-gray mb-6">Pastikan kata sandi baru memiliki minimal 8 karakter</p>

            {passwordSaved && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Kata sandi berhasil diubah
              </div>
            )}

            <div className="space-y-4 max-w-md">
              {/* Old password */}
              <div>
                <label className="text-sm font-medium text-ptba-charcoal mb-1.5 block">Kata Sandi Lama</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama"
                    className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 pr-10 text-sm text-ptba-charcoal placeholder:text-ptba-gray/50 focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ptba-gray hover:text-ptba-charcoal"
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-sm font-medium text-ptba-charcoal mb-1.5 block">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 pr-10 text-sm text-ptba-charcoal placeholder:text-ptba-gray/50 focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ptba-gray hover:text-ptba-charcoal"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && newPassword.length < 8 && (
                  <p className="text-xs text-red-500 mt-1">Minimal 8 karakter</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-sm font-medium text-ptba-charcoal mb-1.5 block">Konfirmasi Kata Sandi</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-charcoal placeholder:text-ptba-gray/50 focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Kata sandi tidak cocok</p>
                )}
              </div>

              <button
                onClick={handleSavePassword}
                disabled={!oldPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                className="rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ptba-steel-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ubah Kata Sandi
              </button>
            </div>
          </div>

          {/* Session info */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-1">Sesi Aktif</h2>
            <p className="text-xs text-ptba-gray mb-4">Perangkat yang saat ini masuk ke akun Anda</p>

            <div className="rounded-lg border border-ptba-light-gray p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ptba-charcoal">Browser ini</p>
                  <p className="text-xs text-ptba-gray">Aktif sekarang · Jakarta, Indonesia</p>
                </div>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Aktif</span>
            </div>
          </div>
        </div>
      )}

      {/* Notification Tab */}
      {activeTab === "notifikasi" && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ptba-charcoal mb-1">Preferensi Notifikasi</h2>
          <p className="text-xs text-ptba-gray mb-6">Atur notifikasi yang ingin Anda terima</p>

          <div className="overflow-hidden rounded-lg border border-ptba-light-gray">
            <table className="w-full">
              <thead>
                <tr className="bg-ptba-section-bg">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ptba-charcoal">Kategori</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-ptba-charcoal">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-ptba-charcoal">Sistem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ptba-light-gray">
                {[
                  { label: "Proyek Baru & Update", emailKey: "emailProyek" as const, systemKey: "systemProyek" as const, desc: "Pembuatan proyek, perubahan fase, undangan" },
                  { label: "Evaluasi", emailKey: "emailEvaluasi" as const, systemKey: "systemEvaluasi" as const, desc: "Tugas evaluasi, deadline, hasil" },
                  { label: "Persetujuan", emailKey: "emailPersetujuan" as const, systemKey: "systemPersetujuan" as const, desc: "Permintaan persetujuan, keputusan direksi" },
                  { label: "SLA & Peringatan", emailKey: "emailSLA" as const, systemKey: "systemSLA" as const, desc: "Pelanggaran SLA, mendekati deadline" },
                ].map((item) => (
                  <tr key={item.emailKey}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-ptba-charcoal">{item.label}</p>
                      <p className="text-xs text-ptba-gray">{item.desc}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={notifPrefs[item.emailKey]}
                        onChange={(e) => setNotifPrefs((prev) => ({ ...prev, [item.emailKey]: e.target.checked }))}
                        className="h-4 w-4 rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-navy"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={notifPrefs[item.systemKey]}
                        onChange={(e) => setNotifPrefs((prev) => ({ ...prev, [item.systemKey]: e.target.checked }))}
                        className="h-4 w-4 rounded border-ptba-light-gray text-ptba-navy focus:ring-ptba-navy"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setShowSaved(true);
                setTimeout(() => setShowSaved(false), 2000);
              }}
              className="rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ptba-steel-blue transition-colors"
            >
              Simpan Preferensi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
