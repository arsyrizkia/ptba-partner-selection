"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function PopupBanner({ alwaysShow = false }: { alwaysShow?: boolean } = {}) {
  const { accessToken } = useAuth();
  const [banner, setBanner] = useState<{ id: string; title: string; imageUrl: string; linkUrl?: string | null } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    fetch(`${API_BASE}/banners/active`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (!data.banner) return;
        if (!alwaysShow) {
          const dismissed = sessionStorage.getItem(`popup_dismissed_${data.banner.id}`);
          if (dismissed) return;
        }
        setBanner(data.banner);
        setVisible(true);
      })
      .catch(() => {});
  }, [accessToken, alwaysShow]);

  const handleClose = () => {
    if (banner) {
      sessionStorage.setItem(`popup_dismissed_${banner.id}`, "1");
    }
    setVisible(false);
  };

  if (!visible || !banner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
      <div className="relative z-10 max-w-lg w-full">
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg text-ptba-gray hover:text-ptba-charcoal transition-colors"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>
        <img
          src={banner.imageUrl}
          alt={banner.title || "Pengumuman"}
          className={`w-full max-h-[85vh] object-contain rounded-xl shadow-2xl${banner.linkUrl ? " cursor-pointer" : ""}`}
          onClick={() => {
            if (banner.linkUrl) {
              window.open(banner.linkUrl, "_blank", "noopener,noreferrer");
            }
            handleClose();
          }}
        />
      </div>
    </div>
  );
}
