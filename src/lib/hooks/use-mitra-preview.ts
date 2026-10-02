"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Read-only "Lihat sebagai Mitra" preview mode.
 * Internal PIC users open mitra pages with `?preview=<applicationId>` to see
 * exactly what that mitra sees. All write actions must be disabled when active.
 */
export function useMitraPreview() {
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const previewAppId = searchParams.get("preview");
  const isPreview = !!previewAppId && !!role && role !== "mitra";

  const withPreview = useCallback(
    (href: string) => {
      if (!isPreview || !previewAppId) return href;
      const sep = href.includes("?") ? "&" : "?";
      return `${href}${sep}preview=${encodeURIComponent(previewAppId)}`;
    },
    [isPreview, previewAppId]
  );

  return { isPreview, previewAppId: isPreview ? previewAppId : null, withPreview };
}
