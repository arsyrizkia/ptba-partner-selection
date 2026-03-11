"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Building2,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { mockApplications } from "@/lib/mock-data/applications";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type DecisionState = "pending" | "approved" | "rejected";

export default function PaymentVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="space-y-4">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <p className="text-ptba-gray">Proyek tidak ditemukan.</p>
      </div>
    );
  }

  // Get shortlisted partner applications
  const shortlistedIds = project.shortlistedPartners ?? [];
  const applications = mockApplications.filter(
    (a) => a.projectId === id && shortlistedIds.includes(a.partnerId)
  );

  // Payment decision state per application
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>(() => {
    const init: Record<string, DecisionState> = {};
    for (const app of applications) {
      if (app.feePaymentStatus === "Sudah Bayar") init[app.id] = "approved";
      else if (app.feePaymentStatus === "Ditolak") init[app.id] = "rejected";
      else init[app.id] = "pending";
    }
    return init;
  });
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const pendingCount = applications.filter(
    (a) => a.feePaymentStatus === "Menunggu Verifikasi" && decisions[a.id] === "pending"
  ).length;
  const verifiedCount = applications.filter(
    (a) => decisions[a.id] === "approved"
  ).length;
  const allVerified = applications.length > 0 && applications.every(
    (a) => decisions[a.id] === "approved" || a.feePaymentStatus === "Belum Bayar"
  );

  function handleApprove(appId: string) {
    setDecisions((prev) => ({ ...prev, [appId]: "approved" }));
    setShowRejectForm(null);
  }

  function handleReject(appId: string) {
    setDecisions((prev) => ({ ...prev, [appId]: "rejected" }));
    setShowRejectForm(null);
  }

  function getPaymentStatusBadge(app: typeof applications[0]) {
    const decision = decisions[app.id];
    if (decision === "approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3 w-3" /> Terverifikasi
        </span>
      );
    }
    if (decision === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
          <XCircle className="h-3 w-3" /> Ditolak
        </span>
      );
    }
    if (app.feePaymentStatus === "Menunggu Verifikasi") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
          <Clock className="h-3 w-3" /> Menunggu Verifikasi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
        <AlertCircle className="h-3 w-3" /> Belum Bayar
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      {/* Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-5 w-5 text-ptba-navy" />
              <span className="rounded-full bg-ptba-navy/10 px-2.5 py-0.5 text-xs font-semibold text-ptba-navy">
                Pra-Fase 2
              </span>
            </div>
            <h1 className="text-xl font-bold text-ptba-charcoal">Verifikasi Pembayaran</h1>
            <p className="text-sm text-ptba-gray mt-0.5">{project.name}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-[10px] text-ptba-gray">Menunggu</p>
            </div>
            <div className="h-8 w-px bg-ptba-light-gray" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
              <p className="text-[10px] text-ptba-gray">Terverifikasi</p>
            </div>
            <div className="h-8 w-px bg-ptba-light-gray" />
            <div className="text-center">
              <p className="text-2xl font-bold text-ptba-navy">{applications.length}</p>
              <p className="text-[10px] text-ptba-gray">Total Mitra</p>
            </div>
          </div>
        </div>

        {/* Fee info */}
        <div className="mt-4 rounded-lg bg-ptba-section-bg p-3 flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-ptba-navy shrink-0" />
          <span className="text-xs text-ptba-gray">
            Biaya pendaftaran Fase 2: <span className="font-bold text-ptba-navy">{formatCurrency(project.registrationFee ?? 0)}</span> per mitra
          </span>
        </div>
      </div>

      {/* Partner Payment List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-ptba-gray mb-3" />
            <p className="text-sm text-ptba-gray">Belum ada mitra shortlist untuk proyek ini.</p>
          </div>
        ) : (
          applications.map((app) => {
            const partner = mockPartners.find((p) => p.id === app.partnerId);
            const decision = decisions[app.id];
            const hasPendingPayment = app.feePaymentStatus === "Menunggu Verifikasi" && decision === "pending";

            return (
              <div
                key={app.id}
                className={cn(
                  "rounded-xl bg-white shadow-sm overflow-hidden",
                  hasPendingPayment && "ring-1 ring-amber-300"
                )}
              >
                {/* Partner header */}
                <div className={cn(
                  "px-6 py-4 flex items-center justify-between",
                  hasPendingPayment ? "bg-amber-50 border-b border-amber-200" : "border-b border-ptba-light-gray"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ptba-section-bg">
                      <Building2 className="h-5 w-5 text-ptba-navy" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ptba-charcoal">{partner?.name ?? app.partnerId}</p>
                      <p className="text-[10px] text-ptba-gray">{partner?.code ?? app.partnerId}</p>
                    </div>
                  </div>
                  {getPaymentStatusBadge(app)}
                </div>

                {/* Payment details */}
                <div className="px-6 py-4">
                  {app.feePaymentStatus === "Belum Bayar" && decision === "pending" && (
                    <div className="flex items-center gap-2 text-sm text-ptba-gray">
                      <AlertCircle className="h-4 w-4" />
                      Mitra belum melakukan pembayaran
                    </div>
                  )}

                  {(app.feePaymentStatus === "Menunggu Verifikasi" || app.feePaymentProof) && decision === "pending" && (
                    <>
                      {/* Proof info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-ptba-gray" />
                          <div>
                            <p className="text-sm font-medium text-ptba-charcoal">{app.feePaymentProof}</p>
                            <p className="text-[10px] text-ptba-gray">
                              Diunggah: {app.feePaymentDate ? formatDate(app.feePaymentDate) : '-'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingProof(viewingProof === app.id ? null : app.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs font-medium text-ptba-navy hover:bg-ptba-section-bg transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat Bukti
                        </button>
                      </div>

                      {/* Proof preview (mock) */}
                      {viewingProof === app.id && (
                        <div className="mb-4 rounded-lg border border-ptba-light-gray bg-ptba-section-bg p-6 text-center">
                          <div className="mx-auto h-40 w-64 rounded-lg bg-white border border-ptba-light-gray flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="mx-auto h-8 w-8 text-ptba-gray mb-2" />
                              <p className="text-xs text-ptba-gray">Preview Bukti Transfer</p>
                              <p className="text-[10px] text-ptba-gray mt-1">{app.feePaymentProof}</p>
                              <p className="text-xs font-bold text-ptba-navy mt-2">{formatCurrency(project.registrationFee ?? 0)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reject form */}
                      {showRejectForm === app.id && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                          <p className="text-xs font-semibold text-red-800 mb-2">Alasan Penolakan</p>
                          <textarea
                            value={rejectNotes[app.id] ?? ""}
                            onChange={(e) => setRejectNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                            placeholder="Jelaskan alasan penolakan bukti pembayaran..."
                            className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-ptba-charcoal placeholder:text-red-300 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 mb-3"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowRejectForm(null)}
                              className="rounded-lg border border-ptba-light-gray px-3 py-1.5 text-xs font-medium text-ptba-gray hover:bg-white transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                            >
                              Konfirmasi Tolak
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {showRejectForm !== app.id && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Verifikasi Pembayaran
                          </button>
                          <button
                            onClick={() => setShowRejectForm(app.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Tolak
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {decision === "approved" && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Pembayaran telah diverifikasi — mitra dapat melanjutkan proses Fase 2
                    </div>
                  )}

                  {decision === "rejected" && (
                    <div className="flex items-start gap-2 text-sm text-red-700">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <p>Bukti pembayaran ditolak</p>
                        {rejectNotes[app.id] && (
                          <p className="text-xs text-red-600 mt-0.5">Catatan: {rejectNotes[app.id]}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary / next step */}
      {allVerified && applications.some((a) => decisions[a.id] === "approved") && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800">Semua pembayaran terverifikasi</p>
              <p className="text-xs text-green-700 mt-0.5">
                Mitra yang telah membayar dapat mulai mengunduh dokumen PTBA dan mengunggah dokumen Fase 2.
              </p>
            </div>
            <Link
              href={`/projects/${id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ptba-navy px-4 py-2 text-xs font-semibold text-white hover:bg-ptba-steel-blue transition-colors shrink-0"
            >
              Kembali ke Proyek
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
