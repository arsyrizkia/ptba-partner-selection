# PTBA Sistem Pemilihan Mitra - Akun Demo

## Cara Login

1. Buka `http://localhost:3000/login`
2. Klik salah satu akun demo di bawah form, atau ketik email manual
3. Password: `demo123` (atau apapun — mock auth tidak validasi password)

---

## Akun Demo Internal

| Email | Peran | Dashboard | Sidebar |
|---|---|---|---|
| `admin@bukitasam.co.id` | Super Admin | Project Dashboard | Semua menu |
| `ebd@bukitasam.co.id` | Divisi Pengembangan Energi | Project Dashboard | Dashboard, Proyek, Mitra, Dokumen, Notifikasi, SLA |
| `keuangan@bukitasam.co.id` | Divisi Keuangan | Evaluator Dashboard | Dashboard, Dokumen, Notifikasi |
| `hukum@bukitasam.co.id` | Divisi Hukum | Evaluator Dashboard | Dashboard, Dokumen, Notifikasi |
| `risiko@bukitasam.co.id` | Divisi Manajemen Risiko | Evaluator Dashboard | Dashboard, Dokumen, Notifikasi |
| `direksi@bukitasam.co.id` | Direksi | Executive Dashboard | Dashboard, Proyek, Persetujuan, Dokumen, Notifikasi, SLA |
| `viewer@bukitasam.co.id` | Viewer / Auditor | Viewer Dashboard | Dashboard, Dokumen, Notifikasi |

## Akun Demo Mitra (Portal Eksternal)

| Email | Peran | Redirect |
|---|---|---|
| `mitra_bei@bukitasam.co.id` | Mitra — PT Bara Energi Indonesia | `/mitra/dashboard` |
| `mitra_pgn@bukitasam.co.id` | Mitra — PT Perusahaan Gas Negara | `/mitra/dashboard` |

> Mitra login akan diarahkan ke Portal Mitra (layout terpisah dengan top navbar, bukan sidebar).

---

## Fitur Role Switcher

- Klik tombol bulat di **pojok kanan bawah** layar untuk switch role tanpa logout
- Tersedia di semua halaman (internal & mitra portal)

---

## Halaman per Role

### Internal (Sidebar Layout)
- `/dashboard` — Dashboard sesuai role
- `/projects` — Daftar proyek (Super Admin, EBD, Direksi)
- `/partners` — Daftar mitra (Super Admin, EBD)
- `/approvals` — Persetujuan (Direksi, Super Admin)
- `/documents` — Dokumen (semua internal)
- `/notifications` — Notifikasi (semua internal)
- `/notifications/sla` — SLA Monitoring (Super Admin, EBD, Direksi)
- `/users` — Manajemen Pengguna (Super Admin only)

### Portal Mitra (Top Navbar Layout)
- `/mitra/dashboard` — Dashboard mitra
- `/mitra/documents` — Upload & tracking 17 dokumen
- `/mitra/financial` — Input data keuangan 3 tahun
- `/mitra/profile` — Profil perusahaan
- `/mitra/status` — Timeline 13 langkah pemilihan mitra
