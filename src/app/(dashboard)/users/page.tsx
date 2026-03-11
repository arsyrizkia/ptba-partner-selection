"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ROLES } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";
import { UserPlus, Shield, X, CheckCircle2, Mail, Building2, AlertCircle, Loader2, RotateCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { authApi, ApiClientError } from "@/lib/api/client";

function getRoleBadgeVariant(role: UserRole) {
  switch (role) {
    case "super_admin":
      return "error" as const;
    case "direksi":
      return "warning" as const;
    case "ebd":
      return "info" as const;
    case "keuangan":
      return "success" as const;
    case "hukum":
      return "success" as const;
    case "risiko":
      return "success" as const;
    case "mitra":
      return "info" as const;
    case "viewer":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function getRoleLabel(role: UserRole): string {
  const found = ROLES.find((r) => r.value === role);
  return found ? found.label : role;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  partnerId: string | null;
  createdAt: string;
  [key: string]: unknown;
}

// Updated RBAC Matrix for new 8 roles
const rbacModules = [
  "Dashboard",
  "Proyek",
  "Mitra",
  "Evaluasi",
  "Persetujuan",
  "Dokumen",
  "Notifikasi",
  "Pengguna",
];

const rbacMatrix: Record<string, boolean[]> = {
  super_admin: [true,  true,  true,  true,  true,  true,  true,  true],
  ebd:         [true,  true,  true,  true,  false, true,  true,  false],
  keuangan:    [true,  false, false, true,  false, true,  true,  false],
  hukum:       [true,  false, false, true,  false, true,  true,  false],
  risiko:      [true,  false, false, true,  false, true,  true,  false],
  direksi:     [true,  true,  false, true,  true,  true,  true,  false],
  mitra:       [true,  false, false, false, false, true,  false, false],
  viewer:      [true,  false, false, false, false, false, true,  false],
};

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Aktif</Badge>;
    case "invited":
      return <Badge variant="warning">Menunggu Aktivasi</Badge>;
    case "disabled":
      return <Badge variant="error">Nonaktif</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export default function UsersPage() {
  const { accessToken } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ApiUser | null>(null);

  // Create user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("ebd");

  const departmentSuggestions: Record<string, string> = {
    super_admin: "IT & Digital",
    ebd: "Pengembangan Energi",
    keuangan: "Keuangan Korporat",
    hukum: "Hukum & Regulasi",
    risiko: "Manajemen Risiko",
    direksi: "Direksi",
    viewer: "Sekretaris Perusahaan",
    mitra: "Mitra Eksternal",
  };

  // Fetch users from API on mount
  useEffect(() => {
    async function fetchUsers() {
      if (!accessToken) {
        setLoadError("Silakan login sebagai Super Admin untuk melihat daftar pengguna.");
        setIsLoading(false);
        return;
      }
      try {
        const api = authApi();
        const res = await api.listUsers(accessToken);
        setUsers(res.users as ApiUser[]);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setLoadError(err.message);
        } else {
          setLoadError("Gagal memuat data pengguna.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, [accessToken]);

  function resetForm() {
    setNewName("");
    setNewEmail("");
    setNewDepartment("");
    setNewRole("ebd");
    setCreateError("");
  }

  async function handleCreateUser() {
    setCreateError("");
    setIsSending(true);

    try {
      if (!accessToken) {
        setCreateError("Token tidak tersedia. Silakan login ulang.");
        return;
      }

      const api = authApi();
      const res = await api.createInternalUser(
        {
          name: newName,
          email: newEmail,
          role: newRole,
          department: newDepartment || departmentSuggestions[newRole] || undefined,
        },
        accessToken
      );

      const newUser: ApiUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        department: res.user.department,
        status: res.user.status,
        partnerId: null,
        createdAt: res.user.createdAt,
      };
      setUsers((prev) => [...prev, newUser]);

      setShowCreateModal(false);
      resetForm();
      setShowSuccess(newEmail);
      setTimeout(() => setShowSuccess(null), 5000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCreateError(err.message);
      } else {
        setCreateError("Gagal mengirim undangan. Silakan coba lagi.");
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleResendInvitation(user: ApiUser) {
    if (!accessToken || resendingId) return;
    setResendingId(user.id);
    try {
      const apiClient = authApi();
      await apiClient.resendInvitation(user.id, accessToken);
      setShowSuccess(user.email);
      setTimeout(() => setShowSuccess(null), 5000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setLoadError(err.message);
      } else {
        setLoadError("Gagal mengirim ulang undangan.");
      }
      setTimeout(() => setLoadError(""), 5000);
    } finally {
      setResendingId(null);
    }
  }

  async function handleDeleteUser() {
    if (!accessToken || !showDeleteConfirm || deletingId) return;
    const userId = showDeleteConfirm.id;
    setDeletingId(userId);
    try {
      const apiClient = authApi();
      await apiClient.deleteUser(userId, accessToken);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setShowDeleteConfirm(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setLoadError(err.message);
      } else {
        setLoadError("Gagal menghapus akun.");
      }
      setTimeout(() => setLoadError(""), 5000);
      setShowDeleteConfirm(null);
    } finally {
      setDeletingId(null);
    }
  }

  const canCreate = newName.trim() && newEmail.trim() && !isSending;

  const columns = [
    {
      key: "name",
      label: "Nama",
      sortable: true,
      render: (item: ApiUser) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ptba-navy text-white text-xs font-medium">
            {item.name
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <span className="font-medium text-ptba-charcoal">
            {item.name}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "department",
      label: "Departemen",
      sortable: true,
    },
    {
      key: "role",
      label: "Peran",
      render: (item: ApiUser) => (
        <Badge variant={getRoleBadgeVariant(item.role as UserRole)}>
          {getRoleLabel(item.role as UserRole)}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: ApiUser) => getStatusBadge(item.status),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (item: ApiUser) => {
        if (item.status !== "invited") return null;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleResendInvitation(item); }}
              disabled={resendingId === item.id}
              title="Kirim ulang undangan"
              className="inline-flex items-center gap-1 rounded-lg border border-ptba-light-gray px-2.5 py-1.5 text-xs font-medium text-ptba-steel-blue hover:bg-ptba-section-bg transition-colors disabled:opacity-50"
            >
              {resendingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
              Kirim Ulang
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(item); }}
              title="Hapus akun & batalkan undangan"
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Hapus
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ptba-charcoal">
          Manajemen Pengguna
        </h1>
        <Button variant="gold" size="md" onClick={() => setShowCreateModal(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg border border-green-200 min-w-[360px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ptba-charcoal">Undangan Terkirim</p>
              <p className="text-xs text-ptba-gray mt-0.5">
                Magic link dikirim ke <span className="font-medium text-ptba-charcoal">{showSuccess}</span>
              </p>
            </div>
            <button onClick={() => setShowSuccess(null)} className="text-ptba-gray hover:text-ptba-charcoal shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center rounded-xl bg-white p-12 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-ptba-navy mr-3" />
          <span className="text-sm text-ptba-gray">Memuat data pengguna...</span>
        </div>
      )}

      {/* Error state */}
      {loadError && !isLoading && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-ptba-charcoal">Tambah Pengguna Baru</h2>
                <p className="text-xs text-ptba-gray mt-0.5">Buat akun untuk stakeholder internal</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="rounded-lg p-1.5 hover:bg-ptba-section-bg transition-colors">
                <X className="h-5 w-5 text-ptba-gray" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                  <UserPlus className="h-4 w-4 text-ptba-gray" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-charcoal placeholder:text-ptba-gray/50 focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                  <Mail className="h-4 w-4 text-ptba-gray" />
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contoh@bukitasam.co.id"
                  className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-charcoal placeholder:text-ptba-gray/50 focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                />
              </div>

              {/* Role */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                  <Shield className="h-4 w-4 text-ptba-gray" />
                  Peran
                </label>
                <select
                  value={newRole}
                  onChange={(e) => {
                    const role = e.target.value as UserRole;
                    setNewRole(role);
                    setNewDepartment(departmentSuggestions[role] ?? "");
                  }}
                  className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-charcoal focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy bg-white"
                >
                  {ROLES.filter((r) => r.value !== "mitra").map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ptba-charcoal mb-1.5">
                  <Building2 className="h-4 w-4 text-ptba-gray" />
                  Departemen
                </label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Nama departemen"
                  className="w-full rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm text-ptba-charcoal placeholder:text-ptba-gray/50 focus:border-ptba-navy focus:outline-none focus:ring-1 focus:ring-ptba-navy"
                />
              </div>

              {/* Info */}
              <div className="rounded-lg bg-ptba-section-bg p-3 flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-ptba-steel-blue mt-0.5 shrink-0" />
                <p className="text-xs text-ptba-gray">
                  Undangan berisi magic link akan dikirim ke email pengguna. Pengguna akan diminta membuat kata sandi saat mengakses link tersebut.
                </p>
              </div>
            </div>

            {/* Error */}
            {createError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {createError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!canCreate}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ptba-steel-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isSending ? "Mengirim..." : "Kirim Undangan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ptba-charcoal">Hapus Akun</h3>
                <p className="text-xs text-ptba-gray">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-sm text-ptba-charcoal mb-1">
              Yakin ingin menghapus akun <span className="font-semibold">{showDeleteConfirm.name}</span>?
            </p>
            <p className="text-xs text-ptba-gray mb-5">
              Email: {showDeleteConfirm.email} — Link aktivasi akan dibatalkan dan akun dihapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={!!deletingId}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deletingId ? "Menghapus..." : "Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Table */}
      {!isLoading && !loadError && (
        <DataTable columns={columns} data={users} />
      )}

      {/* RBAC Matrix */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-ptba-steel-blue" />
          <h2 className="text-lg font-semibold text-ptba-charcoal">
            Matriks Hak Akses (RBAC)
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-ptba-light-gray">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ptba-navy text-white">
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                  Peran
                </th>
                {rbacModules.map((mod) => (
                  <th
                    key={mod}
                    className="px-4 py-3 text-center font-medium whitespace-nowrap"
                  >
                    {mod}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role, rowIdx) => (
                <tr
                  key={role.value}
                  className={cn(
                    rowIdx % 2 === 0 ? "bg-white" : "bg-ptba-off-white",
                    "hover:bg-ptba-section-bg transition-colors"
                  )}
                >
                  <td className="px-4 py-3 font-medium text-ptba-charcoal whitespace-nowrap">
                    {role.label}
                  </td>
                  {rbacMatrix[role.value]?.map((allowed, colIdx) => (
                    <td key={colIdx} className="px-4 py-3 text-center">
                      {allowed ? (
                        <span className="text-ptba-green font-bold text-base">
                          &#10003;
                        </span>
                      ) : (
                        <span className="text-ptba-gray">&#8212;</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-ptba-gray mt-3">
          &#10003; = Akses diizinkan &nbsp;&nbsp; &#8212; = Akses ditolak
        </p>
      </Card>
    </div>
  );
}
