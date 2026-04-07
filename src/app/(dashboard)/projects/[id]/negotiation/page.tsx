"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileText,
  Download,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Handshake,
  Play,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { projectApi, negotiationApi, ApiClientError } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Negotiation, NegotiationRound } from "@/lib/types";

// ─── Status helpers ───

function negotiationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Belum Dimulai",
    waiting_mitra_proposal: "Menunggu Proposal Mitra",
    waiting_ptba_review: "Menunggu Review PTBA",
    countered: "Counter-offer Dikirim",
    agreed: "Disepakati",
    failed: "Gagal",
  };
  return map[status] ?? status;
}

function negotiationStatusBadge(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    waiting_mitra_proposal: "bg-amber-100 text-amber-700",
    waiting_ptba_review: "bg-blue-100 text-blue-700",
    countered: "bg-purple-100 text-purple-700",
    agreed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function roundStatusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: "Diajukan",
    accepted: "Diterima",
    countered: "Di-counter",
    rejected: "Ditolak",
  };
  return map[status] ?? status;
}

function roundStatusBadge(status: string): string {
  const map: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    countered: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function varianceColor(pct: number): string {
  const abs = Math.abs(pct);
  if (abs <= 5) return "text-green-600";
  if (abs <= 10) return "text-amber-600";
  return "text-red-600";
}

function varianceBg(pct: number): string {
  const abs = Math.abs(pct);
  if (abs <= 5) return "bg-green-50 border-green-200";
  if (abs <= 10) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export default function AdminNegotiationPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [counterValue, setCounterValue] = useState("");
  const [counterNotes, setCounterNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [failNotes, setFailNotes] = useState("");
  const [showFailForm, setShowFailForm] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const projRes = await projectApi(accessToken).getById(projectId);
      setProject(projRes.data);
      try {
        const negRes = await negotiationApi(accessToken).get(projectId);
        setNegotiation(negRes.negotiation);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 404) {
          setNegotiation(null);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [projectId, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Actions ───

  const handleStart = async () => {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      // The applicationId should come from the top-ranked mitra
      // For now we use a placeholder - the backend should handle this
      const res = await negotiationApi(accessToken).start(projectId, "");
      setNegotiation(res.negotiation);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memulai negosiasi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      await negotiationApi(accessToken).submitPTBAResponse(projectId, {
        action: "accept",
        notes: "Proposal diterima",
      });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menerima proposal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounter = async () => {
    if (!accessToken || !counterValue) return;
    setActionLoading(true);
    try {
      await negotiationApi(accessToken).submitPTBAResponse(projectId, {
        action: "counter",
        counterValue: parseFloat(counterValue.replace(/\D/g, "")),
        notes: counterNotes,
      });
      setShowCounterForm(false);
      setCounterValue("");
      setCounterNotes("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengirim counter-offer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      await negotiationApi(accessToken).submitPTBAResponse(projectId, {
        action: "reject",
        notes: rejectNotes || "Proposal ditolak",
      });
      setShowRejectForm(false);
      setRejectNotes("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak proposal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConclude = async () => {
    if (!accessToken) return;
    if (!confirm("Apakah Anda yakin ingin menyetujui dan menyimpulkan negosiasi ini?")) return;
    setActionLoading(true);
    try {
      await negotiationApi(accessToken).conclude(projectId);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpulkan negosiasi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFail = async () => {
    if (!accessToken || !failNotes) return;
    setActionLoading(true);
    try {
      await negotiationApi(accessToken).fail(projectId, failNotes);
      setShowFailForm(false);
      setFailNotes("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membatalkan negosiasi");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Loading / Error ───

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">Memuat data negosiasi...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-ptba-gray/40 mb-3" />
          <p className="text-ptba-gray">{error || "Proyek tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  // Compute current values
  const latestMitraRound = negotiation?.rounds
    ?.filter((r) => r.party === "mitra")
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];
  const latestRound = negotiation?.rounds
    ?.sort((a, b) => b.roundNumber - a.roundNumber)[0];
  const currentProposed = latestMitraRound?.proposedValue ?? negotiation?.initialValue ?? 0;
  const initialValue = negotiation?.initialValue ?? 0;
  const variance = initialValue > 0 ? ((currentProposed - initialValue) / initialValue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push(`/projects/${projectId}`)}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Detail Proyek
      </button>

      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Handshake className="h-5 w-5" />
          <span className="text-sm font-medium text-white/70">Langkah 11 - Klarifikasi & Negosiasi Harga</span>
        </div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
          {negotiation?.partnerName && <span>Mitra: {negotiation.partnerName}</span>}
          <span>Nilai Proyek: {formatCurrency(initialValue)}</span>
        </div>
        {negotiation && (
          <div className="mt-3">
            <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", negotiationStatusBadge(negotiation.status))}>
              {negotiationStatusLabel(negotiation.status)}
            </span>
          </div>
        )}
      </div>

      {/* No negotiation yet */}
      {!negotiation && (
        <div className="rounded-xl bg-white p-8 shadow-sm text-center">
          <Play className="mx-auto h-12 w-12 text-ptba-steel-blue/30 mb-4" />
          <h2 className="text-lg font-semibold text-ptba-charcoal mb-2">Negosiasi Belum Dimulai</h2>
          <p className="text-sm text-ptba-gray mb-6 max-w-md mx-auto">
            Mulai proses negosiasi dengan mitra peringkat teratas. Sistem akan mengirim undangan proposal ke mitra terpilih.
          </p>
          <button
            onClick={handleStart}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-ptba-steel-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-ptba-steel-blue/90 transition-colors disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Mulai Negosiasi
          </button>
        </div>
      )}

      {/* Negotiation Active */}
      {negotiation && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Value Comparison Card */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">Perbandingan Nilai</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Initial Value */}
                <div className="rounded-lg bg-ptba-section-bg p-4 text-center">
                  <p className="text-xs text-ptba-gray mb-1">Nilai Awal (HPS)</p>
                  <p className="text-lg font-bold text-ptba-navy">{formatCurrency(initialValue)}</p>
                </div>
                {/* Current Proposed */}
                <div className="rounded-lg bg-ptba-section-bg p-4 text-center">
                  <p className="text-xs text-ptba-gray mb-1">Proposal Terakhir</p>
                  <p className="text-lg font-bold text-ptba-charcoal">{formatCurrency(currentProposed)}</p>
                </div>
                {/* Variance */}
                <div className={cn("rounded-lg border p-4 text-center", varianceBg(variance))}>
                  <p className="text-xs text-ptba-gray mb-1">Variansi</p>
                  <div className="flex items-center justify-center gap-1">
                    {variance > 0 ? (
                      <TrendingUp className={cn("h-4 w-4", varianceColor(variance))} />
                    ) : (
                      <TrendingDown className={cn("h-4 w-4", varianceColor(variance))} />
                    )}
                    <p className={cn("text-lg font-bold", varianceColor(variance))}>
                      {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              {negotiation.agreedValue !== undefined && negotiation.agreedValue !== null && (
                <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-xs text-green-600 mb-1">Nilai Disepakati</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(negotiation.agreedValue)}</p>
                </div>
              )}
            </div>

            {/* Negotiation Timeline */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">Riwayat Negosiasi</h2>
              {negotiation.rounds.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-8 w-8 text-ptba-gray/30 mb-2" />
                  <p className="text-sm text-ptba-gray">Belum ada putaran negosiasi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {negotiation.rounds
                    .sort((a, b) => a.roundNumber - b.roundNumber)
                    .map((round) => (
                      <RoundCard key={round.id} round={round} initialValue={initialValue} />
                    ))}
                </div>
              )}
            </div>

            {/* Action Panel: Waiting PTBA Review */}
            {negotiation.status === "waiting_ptba_review" && latestMitraRound && (
              <div className="rounded-xl bg-white p-6 shadow-sm border-2 border-ptba-steel-blue/30">
                <h2 className="text-lg font-semibold text-ptba-charcoal mb-1">Tindakan Diperlukan</h2>
                <p className="text-sm text-ptba-gray mb-4">
                  Mitra telah mengajukan proposal sebesar {formatCurrency(latestMitraRound.proposedValue)}.
                  Silakan tinjau dan berikan respons.
                </p>

                {/* Mitra's proposal summary */}
                {latestMitraRound.justification && (
                  <div className="rounded-lg bg-ptba-section-bg p-4 mb-4">
                    <p className="text-xs font-medium text-ptba-gray mb-1">Justifikasi Mitra:</p>
                    <p className="text-sm text-ptba-charcoal">{latestMitraRound.justification}</p>
                  </div>
                )}

                {/* BOQ if present */}
                {latestMitraRound.costBreakdown && latestMitraRound.costBreakdown.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <p className="text-xs font-medium text-ptba-gray mb-2">Rincian Biaya (BOQ):</p>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-ptba-section-bg">
                          <th className="text-left p-2 text-xs font-medium text-ptba-gray">Item</th>
                          <th className="text-left p-2 text-xs font-medium text-ptba-gray">Deskripsi</th>
                          <th className="text-right p-2 text-xs font-medium text-ptba-gray">Jumlah</th>
                          <th className="text-left p-2 text-xs font-medium text-ptba-gray">Satuan</th>
                          <th className="text-right p-2 text-xs font-medium text-ptba-gray">Harga Satuan</th>
                          <th className="text-right p-2 text-xs font-medium text-ptba-gray">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestMitraRound.costBreakdown.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="p-2 text-ptba-charcoal">{item.item}</td>
                            <td className="p-2 text-ptba-gray">{item.description}</td>
                            <td className="p-2 text-right text-ptba-charcoal">{item.quantity}</td>
                            <td className="p-2 text-ptba-gray">{item.unit}</td>
                            <td className="p-2 text-right text-ptba-charcoal">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2 text-right font-medium text-ptba-charcoal">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {/* Accept */}
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Terima Proposal
                  </button>

                  {/* Counter */}
                  <button
                    onClick={() => { setShowCounterForm(!showCounterForm); setShowRejectForm(false); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-ptba-gold px-5 py-2.5 text-sm font-semibold text-ptba-charcoal hover:bg-ptba-gold/90 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Counter-offer
                  </button>

                  {/* Reject */}
                  <button
                    onClick={() => { setShowRejectForm(!showRejectForm); setShowCounterForm(false); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Tolak
                  </button>
                </div>

                {/* Counter-offer Form */}
                {showCounterForm && (
                  <div className="mt-4 rounded-lg border border-ptba-gold/30 bg-ptba-gold/5 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-ptba-charcoal">Counter-offer</h3>
                    <div>
                      <label className="block text-xs font-medium text-ptba-gray mb-1">Nilai Counter (Rp)</label>
                      <input
                        type="text"
                        value={counterValue}
                        onChange={(e) => setCounterValue(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="Masukkan nilai counter-offer"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ptba-steel-blue focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
                      />
                      {counterValue && (
                        <p className="mt-1 text-xs text-ptba-gray">
                          = {formatCurrency(parseFloat(counterValue) || 0)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ptba-gray mb-1">Catatan</label>
                      <textarea
                        value={counterNotes}
                        onChange={(e) => setCounterNotes(e.target.value)}
                        placeholder="Jelaskan alasan counter-offer..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ptba-steel-blue focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
                      />
                    </div>
                    <button
                      onClick={handleCounter}
                      disabled={actionLoading || !counterValue}
                      className="inline-flex items-center gap-2 rounded-lg bg-ptba-steel-blue px-4 py-2 text-sm font-semibold text-white hover:bg-ptba-steel-blue/90 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Kirim Counter-offer
                    </button>
                  </div>
                )}

                {/* Reject Form */}
                {showRejectForm && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-red-800">Tolak Proposal</h3>
                    <div>
                      <label className="block text-xs font-medium text-ptba-gray mb-1">Alasan Penolakan</label>
                      <textarea
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Jelaskan alasan penolakan..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                      />
                    </div>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Konfirmasi Tolak
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Agreed State */}
            {negotiation.status === "agreed" && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-green-800">Negosiasi Berhasil Disepakati</h2>
                    <p className="mt-1 text-sm text-green-700">
                      Nilai akhir yang disepakati: <strong>{formatCurrency(negotiation.agreedValue ?? 0)}</strong>
                    </p>
                    {negotiation.agreedAt && (
                      <p className="mt-1 text-xs text-green-600">Disepakati pada: {formatDate(negotiation.agreedAt)}</p>
                    )}
                    {negotiation.conclusionNotes && (
                      <p className="mt-2 text-sm text-green-700">{negotiation.conclusionNotes}</p>
                    )}
                    <button
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                      onClick={() => alert("Fitur download Berita Acara akan segera tersedia")}
                    >
                      <Download className="h-4 w-4" />
                      Download Berita Acara
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Failed State */}
            {negotiation.status === "failed" && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-red-800">Negosiasi Gagal</h2>
                    <p className="mt-1 text-sm text-red-700">
                      Negosiasi dengan mitra tidak mencapai kesepakatan.
                    </p>
                    {negotiation.conclusionNotes && (
                      <p className="mt-2 text-sm text-red-600">{negotiation.conclusionNotes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">Status Negosiasi</h3>
              <div className={cn("rounded-lg p-4 text-center", negotiationStatusBadge(negotiation.status))}>
                <p className="text-sm font-bold">{negotiationStatusLabel(negotiation.status)}</p>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ptba-gray">Putaran Saat Ini</span>
                  <span className="font-medium text-ptba-charcoal">{negotiation.currentRound}</span>
                </div>
                {negotiation.deadline && (
                  <div className="flex justify-between">
                    <span className="text-ptba-gray">Deadline</span>
                    <span className="font-medium text-ptba-charcoal">{formatDate(negotiation.deadline)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {negotiation.status !== "agreed" && negotiation.status !== "failed" && negotiation.status !== "pending" && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">Tindakan Cepat</h3>
                <div className="space-y-2">
                  {negotiation.status === "waiting_ptba_review" && (
                    <button
                      onClick={handleConclude}
                      disabled={actionLoading}
                      className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Terima & Setuju
                    </button>
                  )}
                  <button
                    onClick={() => setShowFailForm(!showFailForm)}
                    className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Gagalkan Negosiasi
                  </button>
                </div>
                {showFailForm && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={failNotes}
                      onChange={(e) => setFailNotes(e.target.value)}
                      placeholder="Catatan kegagalan negosiasi..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                    />
                    <button
                      onClick={handleFail}
                      disabled={actionLoading || !failNotes}
                      className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "Memproses..." : "Konfirmasi Gagalkan"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">Dokumen Negosiasi</h3>
              {negotiation.documents.length === 0 ? (
                <p className="text-sm text-ptba-gray text-center py-4">Belum ada dokumen.</p>
              ) : (
                <div className="space-y-2">
                  {negotiation.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ptba-steel-blue/10">
                        <FileText className="h-4 w-4 text-ptba-steel-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ptba-charcoal truncate">{doc.name}</p>
                        <p className="text-xs text-ptba-gray">
                          {doc.uploadedByRole === "mitra" ? "Mitra" : "PTBA"} - {doc.type}
                        </p>
                      </div>
                      {doc.fileKey && (
                        <button className="shrink-0 text-ptba-steel-blue hover:text-ptba-navy">
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Round Card Component ───

function RoundCard({ round, initialValue }: { round: NegotiationRound; initialValue: number }) {
  const variance = initialValue > 0 ? ((round.proposedValue - initialValue) / initialValue) * 100 : 0;
  const isMitra = round.party === "mitra";

  return (
    <div className={cn(
      "rounded-lg border p-4",
      isMitra ? "border-blue-200 bg-blue-50/30" : "border-ptba-gold/30 bg-ptba-gold/5"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
            isMitra ? "bg-blue-100 text-blue-700" : "bg-ptba-gold/20 text-ptba-gold"
          )}>
            {round.roundNumber}
          </span>
          <div>
            <p className="text-sm font-semibold text-ptba-charcoal">
              Putaran {round.roundNumber} - {isMitra ? "Mitra" : "PTBA"}
            </p>
            <p className="text-xs text-ptba-gray">{formatDate(round.submittedAt)}</p>
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", roundStatusBadge(round.status))}>
          {roundStatusLabel(round.status)}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-bold text-ptba-charcoal">{formatCurrency(round.proposedValue)}</span>
        <span className={cn("text-xs font-medium", varianceColor(variance))}>
          ({variance >= 0 ? "+" : ""}{variance.toFixed(1)}%)
        </span>
      </div>

      {round.justification && (
        <p className="text-sm text-ptba-gray mt-1">{round.justification}</p>
      )}

      {round.responseNotes && (
        <div className="mt-2 rounded bg-white/70 p-2 text-sm text-ptba-gray">
          <span className="text-xs font-medium text-ptba-charcoal">Catatan Respons: </span>
          {round.responseNotes}
        </div>
      )}
    </div>
  );
}
