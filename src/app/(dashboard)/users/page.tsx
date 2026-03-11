"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { mockUsers } from "@/lib/mock-data";
import { ROLES, INTERNAL_ROLES } from "@/lib/constants/roles";
import type { UserRole, User } from "@/lib/types";
import { UserPlus, Shield, X, CheckCircle2, Mail, Building2, AlertCircle, Loader2 } from "lucide-react";
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

type UserRow = (typeof mockUsers)[number] & Record<string, unknown>;

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

export default function UsersPage() {
  const { accessToken } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<User[]>([...mockUsers]);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [isSending, setIsSending] = useState(false);

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
      if (accessToken) {
        // Real API call
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
        const newUser: User = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role as UserRole,
          department: res.user.department,
        };
        setUsers((prev) => [...prev, newUser]);
      } else {
        // Fallback: mock create
        const newUser: User = {
          id: `U${String(users.length + 1).padStart(3, "0")}`,
          name: newName,
          email: newEmail,
          role: newRole,
          department: newDepartment || departmentSuggestions[newRole] || "",
        };
        setUsers((prev) => [...prev, newUser]);
      }

      setShowCreateModal(false);
      resetForm();
      setShowSuccess(newName);
      setTimeout(() => setShowSuccess(null), 3000);
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

  const canCreate = newName.trim() && newEmail.trim() && !isSending;

  const columns = [
    {
      key: "name",
      label: "Nama",
      sortable: true,
      render: (item: UserRow) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ptba-navy text-white text-xs font-medium">
            {(item.name as string)
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <span className="font-medium text-ptba-charcoal">
            {item.name as string}
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
      render: (item: UserRow) => (
        <Badge variant={getRoleBadgeVariant(item.role as UserRole)}>
          {getRoleLabel(item.role as UserRole)}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: () => (
        <Badge variant="success">Aktif</Badge>
      ),
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

      {/* Success message */}
      {showSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Undangan berhasil dikirim ke <span className="font-semibold">{showSuccess}</span>. Menunggu pengguna mengaktifkan akun.
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

      {/* User Table */}
      <DataTable columns={columns} data={users as UserRow[]} />

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
