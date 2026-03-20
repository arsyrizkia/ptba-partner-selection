"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Power, PowerOff, Loader2, ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils/cn";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

interface Banner {
  id: string;
  title: string;
  imageFileKey: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function BannersPage() {
  const { accessToken } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/banners`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setBanners(data.banners || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [accessToken]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);

      const res = await fetch(`${API_BASE}/banners`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });

      if (res.ok) {
        setTitle("");
        if (fileRef.current) fileRef.current.value = "";
        await fetchBanners();
      }
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (!accessToken) return;
    setActionLoading(id);
    try {
      await fetch(`${API_BASE}/banners/${id}/activate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchBanners();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!accessToken) return;
    setActionLoading(id);
    try {
      await fetch(`${API_BASE}/banners/${id}/deactivate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchBanners();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken || !confirm("Hapus banner ini?")) return;
    setActionLoading(id);
    try {
      await fetch(`${API_BASE}/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchBanners();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ptba-charcoal">Popup Banner</h1>
        <p className="text-sm text-ptba-gray">Upload gambar popup yang ditampilkan ke mitra saat login.</p>
      </div>

      {/* Upload form */}
      <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-ptba-charcoal">Upload Banner Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ptba-charcoal">Judul (opsional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengumuman Hari Libur"
              className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2.5 text-sm outline-none focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ptba-charcoal">File Gambar</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ptba-navy file:px-3 file:py-1 file:text-xs file:font-medium file:text-white"
            />
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Mengunggah..." : "Upload"}
        </button>
      </div>

      {/* Banner list */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">Daftar Banner</h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-ptba-steel-blue" />
          </div>
        ) : banners.length === 0 ? (
          <div className="py-10 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-ptba-light-gray" />
            <p className="mt-2 text-sm text-ptba-gray">Belum ada banner.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "rounded-xl border-2 overflow-hidden transition-colors",
                  b.isActive ? "border-green-500" : "border-ptba-light-gray"
                )}
              >
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt={b.title || "Banner"} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-ptba-off-white flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-ptba-light-gray" />
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ptba-charcoal truncate">{b.title || "Tanpa judul"}</p>
                    {b.isActive && (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ptba-gray">
                    {new Date(b.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <div className="flex items-center gap-2">
                    {b.isActive ? (
                      <button
                        onClick={() => handleDeactivate(b.id)}
                        disabled={actionLoading === b.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PowerOff className="h-3 w-3" />}
                        Nonaktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(b.id)}
                        disabled={actionLoading === b.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                        Aktifkan
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={actionLoading === b.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
