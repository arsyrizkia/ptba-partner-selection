"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, FileText, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface UploadConfirmDialogProps {
  /** File picked by the user; the dialog is hidden while null */
  file: File | null;
  /** Shown above the file name, e.g. the document type */
  title?: string;
  /** An uploaded file already exists and will be replaced */
  replacing?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Previews a picked file locally and asks for confirmation before it is uploaded
export function UploadConfirmDialog({ file, title, replacing, onCancel, onConfirm }: UploadConfirmDialogProps) {
  const tc = useTranslations("common");
  const [url, setUrl] = useState<string | null>(null);

  const path = file?.name.toLowerCase() || "";
  const isPdf = file?.type === "application/pdf" || path.endsWith(".pdf");
  const isImage = file?.type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/.test(path);
  const canPreview = isPdf || isImage;

  useEffect(() => {
    if (!file || !canPreview) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [file, canPreview]);

  useEffect(() => {
    if (!file) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [file, onCancel]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-confirm-title"
        className={`flex w-full flex-col rounded-xl bg-white shadow-xl ${canPreview ? "h-full max-h-[90vh] max-w-3xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-ptba-light-gray px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ptba-steel-blue/10">
            <Upload className="h-4 w-4 text-ptba-steel-blue" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="upload-confirm-title" className="text-base font-bold text-ptba-charcoal">
              {tc("uploadConfirmTitle")}
            </h2>
            {title && <p className="truncate text-xs text-ptba-gray">{title}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={tc("close")}
            className="shrink-0 rounded-lg p-1.5 text-ptba-gray hover:bg-ptba-section-bg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview */}
        {canPreview ? (
          <div className="min-h-0 flex-1 bg-ptba-section-bg p-3">
            {url && isPdf && (
              <iframe src={url} title={file.name} className="h-full w-full rounded border border-ptba-light-gray bg-white" />
            )}
            {url && isImage && (
              <div className="flex h-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 bg-ptba-section-bg px-5 py-6 text-center">
            <FileText className="h-10 w-10 text-ptba-gray/60" />
            <p className="text-xs text-ptba-gray">{tc("uploadPreviewUnavailable")}</p>
          </div>
        )}

        {/* File info + actions */}
        <div className="space-y-3 border-t border-ptba-light-gray px-5 py-4">
          <div className="flex items-center gap-2 rounded-lg bg-ptba-section-bg px-3 py-2">
            <FileText className="h-4 w-4 shrink-0 text-ptba-steel-blue" />
            <p className="min-w-0 flex-1 break-all text-sm font-medium text-ptba-charcoal">{file.name}</p>
            <span className="shrink-0 text-xs text-ptba-gray">{formatFileSize(file.size)}</span>
          </div>
          <p className="text-sm text-ptba-charcoal">{tc("uploadConfirmMessage")}</p>
          {replacing && (
            <p className="flex items-start gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {tc("uploadConfirmReplace")}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-ptba-light-gray px-4 py-2.5 text-sm font-medium text-ptba-charcoal hover:bg-ptba-section-bg transition-colors"
            >
              {tc("uploadConfirmCancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-ptba-navy/90 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {tc("uploadConfirmAction")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
