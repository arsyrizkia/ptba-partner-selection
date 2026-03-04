"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { mockUsers } from "@/lib/mock-data";
import { ROLES } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";
import { UserPlus, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
        <Button variant="gold" size="md">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Tambah Pengguna
        </Button>
      </div>

      {/* User Table */}
      <DataTable columns={columns} data={mockUsers as UserRow[]} />

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
