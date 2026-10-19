"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { downloadFromUrl } from "@/lib/api/client";

export interface FilePreviewItem {
  fileKey: string;
  fileName: string;
  /** Shown above the file name, e.g. the document type */
  title?: string;
}

interface FilePreviewOverlayProps {
  items: FilePreviewItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Resolves a file key to a viewable (presigned) URL */
  getUrl: (fileKey: string) => Promise<string>;
}

const SWIPE_THRESHOLD = 50;

// Full-screen dark viewer for PDFs and images, with prev/next between items
export function FilePreviewOverlay({ items, index, onIndexChange, onClose, getUrl }: FilePreviewOverlayProps) {
  const tc = useTranslations("common");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const item = items[index];
  const url = item ? urls[item.fileKey] : undefined;
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const path = item?.fileKey.toLowerCase() || "";
  const isPdf = path.endsWith(".pdf");
  const isImage = /\.(png|jpe?g|gif|webp)$/.test(path);

  const fileKey = item?.fileKey;
  useEffect(() => {
    if (!fileKey || urls[fileKey] || failed[fileKey]) return;
    let cancelled = false;
    getUrl(fileKey)
      .then((u) => { if (!cancelled) setUrls((prev) => ({ ...prev, [fileKey]: u })); })
      .catch(() => { if (!cancelled) setFailed((prev) => ({ ...prev, [fileKey]: true })); });
    return () => { cancelled = true; };
  }, [fileKey, urls, failed, getUrl]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onIndexChange(index - 1);
      else if (e.key === "ArrowRight" && hasNext) onIndexChange(index + 1);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [index, hasPrev, hasNext, onClose, onIndexChange]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!item) return null;

  const handleDownload = () => {
    if (url) downloadFromUrl(url, item.fileName, item.fileKey).catch(() => {});
  };

  // Touch swipe; doesn't fire over the PDF iframe, which keeps its own touch handling
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx > SWIPE_THRESHOLD && hasPrev) onIndexChange(index - 1);
    else if (dx < -SWIPE_THRESHOLD && hasNext) onIndexChange(index + 1);
  };

  const navButton = "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" role="dialog" aria-modal="true">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          {item.title && <p className="truncate text-xs text-white/60">{item.title}</p>}
          <p className="truncate text-sm font-medium">{item.fileName}</p>
        </div>
        {items.length > 1 && (
          <span className="shrink-0 text-xs text-white/60">{index + 1} / {items.length}</span>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!url}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 disabled:opacity-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          {tc("download")}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={tc("close")}
          className="shrink-0 rounded-lg p-1.5 hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={handleTouchEnd}
      >
        {hasPrev && (
          <button type="button" onClick={() => onIndexChange(index - 1)} aria-label={tc("previous")} className={`${navButton} left-2`}>
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {failed[item.fileKey] ? (
          <p className="text-sm text-white/80">{tc("previewFailed")}</p>
        ) : !url ? (
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        ) : isPdf ? (
          <iframe key={url} src={url} title={item.fileName} className="h-full w-full max-w-5xl rounded bg-white" />
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={item.fileName} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="flex max-w-sm flex-col items-center gap-4 text-center text-white/80">
            <FileText className="h-12 w-12 text-white/50" />
            <p className="text-sm">{tc("previewUnavailable")}</p>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-gold px-4 py-2 text-sm font-semibold text-ptba-navy hover:bg-ptba-gold/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              {tc("download")}
            </button>
          </div>
        )}

        {hasNext && (
          <button type="button" onClick={() => onIndexChange(index + 1)} aria-label={tc("next")} className={`${navButton} right-2`}>
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
