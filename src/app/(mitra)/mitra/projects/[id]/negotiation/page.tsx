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
  Plus,
  Trash2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Handshake,
  Upload,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { projectApi, negotiationApi, ApiClientError } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Negotiation, NegotiationRound, CostBreakdownItem } from "@/lib/types";

// ─── Status helpers ───

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

// ─── Empty BOQ row ───

function emptyBoqRow(): CostBreakdownItem {
  return { item: "", description: "", quantity: 0, unit: "", unitPrice: 0, subtotal: 0 };
}

export default function MitraNegotiationPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuth();
  const projectId = params.id as string;
  const t = useTranslations("negotiation");
  const tc = useTranslations("common");
  const { locale } = useLocale();

  const [project, setProject] = useState<any>(null);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proposal form state
  const [proposedValue, setProposedValue] = useState("");
  const [justification, setJustification] = useState("");
  const [boqRows, setBoqRows] = useState<CostBreakdownItem[]>([emptyBoqRow()]);
  const [submitting, setSubmitting] = useState(false);

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
      setError(err instanceof Error ? err.message : tc("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [projectId, accessToken, tc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── BOQ management ───

  const addBoqRow = () => {
    setBoqRows([...boqRows, emptyBoqRow()]);
  };

  const removeBoqRow = (index: number) => {
    if (boqRows.length <= 1) return;
    setBoqRows(boqRows.filter((_, i) => i !== index));
  };

  const updateBoqRow = (index: number, field: keyof CostBreakdownItem, value: string | number) => {
    const updated = [...boqRows];
    const row = { ...updated[index] };

    if (field === "item" || field === "description" || field === "unit") {
      row[field] = value as string;
    } else if (field === "quantity" || field === "unitPrice") {
      const numVal = typeof value === "string" ? parseFloat(value) || 0 : value;
      row[field] = numVal;
      row.subtotal = field === "quantity" ? numVal * row.unitPrice : row.quantity * numVal;
    }

    updated[index] = row;
    setBoqRows(updated);
  };

  const boqTotal = boqRows.reduce((sum, r) => sum + r.subtotal, 0);

  // ─── Submit proposal ───

  const handleSubmitProposal = async () => {
    if (!accessToken) return;
    const numValue = parseFloat(proposedValue.replace(/[^\d]/g, ""));
    if (!numValue || numValue <= 0) {
      alert(t("errors.enterValue"));
      return;
    }
    if (justification.length < 100) {
      alert(t("errors.minJustification"));
      return;
    }

    setSubmitting(true);
    try {
      const validBoq = boqRows.filter((r) => r.item.trim() !== "");
      await negotiationApi(accessToken).submitMitraProposal(projectId, {
        proposedValue: numValue,
        justification,
        costBreakdown: validBoq.length > 0 ? validBoq : undefined,
      });
      // Reset form
      setProposedValue("");
      setJustification("");
      setBoqRows([emptyBoqRow()]);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t("errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading / Error ───

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-steel-blue" />
        <span className="ml-3 text-ptba-gray">{tc("loadingNegotiation")}</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> {tc("back")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-ptba-gray/40 mb-3" />
          <p className="text-ptba-gray">{error || tc("projectNotFound")}</p>
        </div>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.push(`/mitra/projects/${projectId}`)} className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy">
          <ArrowLeft className="h-4 w-4" /> {tc("backToProjects")}
        </button>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Handshake className="mx-auto h-12 w-12 text-ptba-gray/30 mb-4" />
          <h2 className="text-lg font-semibold text-ptba-charcoal mb-2">{t("notStarted")}</h2>
          <p className="text-sm text-ptba-gray">
            {t("notStartedDesc")}
          </p>
        </div>
      </div>
    );
  }

  const initialValue = negotiation.initialValue;
  const numProposed = parseFloat(proposedValue.replace(/[^\d]/g, "")) || 0;
  const proposalVariance = initialValue > 0 ? ((numProposed - initialValue) / initialValue) * 100 : 0;

  // Latest PTBA counter-offer
  const latestPtbaRound = negotiation.rounds
    ?.filter((r) => r.party === "ptba")
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];

  const canSubmitProposal = negotiation.status === "waiting_mitra_proposal" || negotiation.status === "countered";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push(`/mitra/projects/${projectId}`)}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-steel-blue hover:text-ptba-navy"
      >
        <ArrowLeft className="h-4 w-4" /> {tc("backToProjects")}
      </button>

      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-ptba-navy to-ptba-steel-blue p-6 text-white">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Handshake className="h-5 w-5" />
          <span className="text-sm font-medium text-white/70">{t("title")}</span>
        </div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
          <span className={cn("inline-flex rounded-full px-3 py-0.5 text-xs font-semibold", negotiationStatusBadge(negotiation.status))}>
            {t("negotiationStatus." + negotiation.status)}
          </span>
          {negotiation.deadline && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {t("deadline")}: {formatDate(negotiation.deadline)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reference Value Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-ptba-charcoal mb-2">{t("referenceValue")}</h2>
            <div className="rounded-lg bg-ptba-section-bg p-4 text-center">
              <p className="text-xs text-ptba-gray mb-1">{t("hpsLabel")}</p>
              <p className="text-2xl font-bold text-ptba-navy">{formatCurrency(initialValue)}</p>
            </div>
          </div>

          {/* PTBA Counter-offer Display */}
          {negotiation.status === "countered" && latestPtbaRound && (
            <div className="rounded-xl bg-purple-50 border-2 border-purple-200 p-6">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-6 w-6 shrink-0 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-purple-800">{t("counterOffer")}</h2>
                  <p className="mt-1 text-sm text-purple-700">
                    {t("counterOfferDesc")}
                  </p>
                  <div className="mt-3 rounded-lg bg-white p-4">
                    <p className="text-xs text-ptba-gray mb-1">{t("counterValue")}</p>
                    <p className="text-xl font-bold text-purple-700">{formatCurrency(latestPtbaRound.proposedValue)}</p>
                    {latestPtbaRound.responseNotes && (
                      <div className="mt-2 text-sm text-ptba-gray">
                        <span className="font-medium text-ptba-charcoal">{t("notes")} </span>
                        {latestPtbaRound.responseNotes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proposal Form */}
          {canSubmitProposal && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-ptba-steel-blue/20">
              <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">
                {negotiation.status === "countered" ? t("newProposal") : t("submitProposal")}
              </h2>

              {/* Proposed Value */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-ptba-charcoal mb-1">
                  {t("proposedValue")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={t("proposedValuePlaceholder")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-ptba-steel-blue focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
                />
                {proposedValue && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-ptba-gray">= {formatCurrency(numProposed)}</span>
                    <span className={cn("text-xs font-medium", varianceColor(proposalVariance))}>
                      ({proposalVariance >= 0 ? "+" : ""}{proposalVariance.toFixed(1)}% {t("ofHps")})
                    </span>
                  </div>
                )}
              </div>

              {/* BOQ Table Builder */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-ptba-charcoal">
                    {t("boqTitle")}
                  </label>
                  <button
                    onClick={addBoqRow}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg bg-ptba-steel-blue/10 px-3 py-1.5 text-xs font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue/20 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> {t("addRow")}
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ptba-section-bg">
                        <th className="text-center p-2 text-xs font-medium text-ptba-gray w-10">{t("boqHeaders.no")}</th>
                        <th className="text-left p-2 text-xs font-medium text-ptba-gray min-w-[120px]">{t("boqHeaders.item")}</th>
                        <th className="text-left p-2 text-xs font-medium text-ptba-gray min-w-[140px]">{t("boqHeaders.description")}</th>
                        <th className="text-center p-2 text-xs font-medium text-ptba-gray w-20">{t("boqHeaders.quantity")}</th>
                        <th className="text-center p-2 text-xs font-medium text-ptba-gray w-20">{t("boqHeaders.unit")}</th>
                        <th className="text-right p-2 text-xs font-medium text-ptba-gray w-32">{t("boqHeaders.unitPrice")}</th>
                        <th className="text-right p-2 text-xs font-medium text-ptba-gray w-32">{t("boqHeaders.subtotal")}</th>
                        <th className="text-center p-2 text-xs font-medium text-ptba-gray w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {boqRows.map((row, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="p-2 text-center text-ptba-gray">{idx + 1}</td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.item}
                              onChange={(e) => updateBoqRow(idx, "item", e.target.value)}
                              placeholder={t("boqPlaceholders.item")}
                              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-ptba-steel-blue focus:outline-none"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => updateBoqRow(idx, "description", e.target.value)}
                              placeholder={t("boqPlaceholders.description")}
                              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-ptba-steel-blue focus:outline-none"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={row.quantity || ""}
                              onChange={(e) => updateBoqRow(idx, "quantity", e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-center focus:border-ptba-steel-blue focus:outline-none"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.unit}
                              onChange={(e) => updateBoqRow(idx, "unit", e.target.value)}
                              placeholder={t("boqPlaceholders.unit")}
                              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-center focus:border-ptba-steel-blue focus:outline-none"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={row.unitPrice || ""}
                              onChange={(e) => updateBoqRow(idx, "unitPrice", e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-right focus:border-ptba-steel-blue focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-right font-medium text-ptba-charcoal">
                            {row.subtotal > 0 ? formatCurrency(row.subtotal) : "-"}
                          </td>
                          <td className="p-1 text-center">
                            <button
                              onClick={() => removeBoqRow(idx)}
                              type="button"
                              disabled={boqRows.length <= 1}
                              className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 bg-ptba-section-bg">
                        <td colSpan={6} className="p-2 text-right text-sm font-semibold text-ptba-charcoal">
                          {t("grandTotal")}
                        </td>
                        <td className="p-2 text-right text-sm font-bold text-ptba-navy">
                          {boqTotal > 0 ? formatCurrency(boqTotal) : "-"}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Justification */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-ptba-charcoal mb-1">
                  {t("justification")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder={t("justificationPlaceholder")}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-ptba-steel-blue focus:outline-none focus:ring-1 focus:ring-ptba-steel-blue"
                />
                <p className={cn(
                  "mt-1 text-xs",
                  justification.length < 100 ? "text-red-500" : "text-green-600"
                )}>
                  {justification.length}/100 {t("minChars")}
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitProposal}
                  disabled={submitting || !proposedValue || justification.length < 100}
                  className="inline-flex items-center gap-2 rounded-lg bg-ptba-steel-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-ptba-steel-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("sendProposal")}
                </button>
              </div>
            </div>
          )}

          {/* Negotiation History Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ptba-charcoal mb-4">{t("history")}</h2>
            {negotiation.rounds.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-8 w-8 text-ptba-gray/30 mb-2" />
                <p className="text-sm text-ptba-gray">{t("noRounds")}</p>
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

          {/* Agreed State */}
          {negotiation.status === "agreed" && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-green-800">{t("agreed")}</h2>
                  <p className="mt-1 text-sm text-green-700">
                    {t("agreedDesc")}{" "}
                    <strong>{formatCurrency(negotiation.agreedValue ?? 0)}</strong>
                  </p>
                  {negotiation.agreedAt && (
                    <p className="mt-1 text-xs text-green-600">{t("agreedOn")} {formatDate(negotiation.agreedAt)}</p>
                  )}
                  {negotiation.conclusionNotes && (
                    <p className="mt-2 text-sm text-green-700">{negotiation.conclusionNotes}</p>
                  )}
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
                  <h2 className="text-lg font-semibold text-red-800">{t("failed")}</h2>
                  <p className="mt-1 text-sm text-red-700">
                    {t("failedDesc")}
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
            <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">{t("statusLabel")}</h3>
            <div className={cn("rounded-lg p-4 text-center", negotiationStatusBadge(negotiation.status))}>
              <p className="text-sm font-bold">{t("negotiationStatus." + negotiation.status)}</p>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ptba-gray">{t("round")}</span>
                <span className="font-medium text-ptba-charcoal">{negotiation.currentRound}</span>
              </div>
              {negotiation.deadline && (
                <div className="flex justify-between">
                  <span className="text-ptba-gray">{t("deadline")}</span>
                  <span className="font-medium text-ptba-charcoal">{formatDate(negotiation.deadline)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-xl bg-ptba-section-bg p-6">
            <h3 className="text-sm font-semibold text-ptba-charcoal mb-2">{t("guidelines")}</h3>
            <ul className="space-y-2 text-xs text-ptba-gray">
              <li className="flex gap-2">
                <span className="shrink-0 text-ptba-steel-blue">1.</span>
                {t("guideline1")}
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-ptba-steel-blue">2.</span>
                {t("guideline2")}
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-ptba-steel-blue">3.</span>
                {t("guideline3")}
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-ptba-steel-blue">4.</span>
                {t("guideline4")}
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-ptba-steel-blue">5.</span>
                {t("guideline5")}
              </li>
            </ul>
          </div>

          {/* Documents */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-ptba-charcoal mb-3">{t("docsLabel")}</h3>
            {negotiation.documents.length === 0 ? (
              <p className="text-sm text-ptba-gray text-center py-4">{t("noDocs")}</p>
            ) : (
              <div className="space-y-2">
                {negotiation.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ptba-steel-blue/10">
                      <FileText className="h-4 w-4 text-ptba-steel-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ptba-charcoal truncate">{doc.name}</p>
                      <p className="text-xs text-ptba-gray">{doc.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Round Card Component ───

function RoundCard({ round, initialValue }: { round: NegotiationRound; initialValue: number }) {
  const t = useTranslations("negotiation");
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
              {t("roundLabel", { number: round.roundNumber, party: isMitra ? t("partyMitra") : t("partyPtba") })}
            </p>
            <p className="text-xs text-ptba-gray">{formatDate(round.submittedAt)}</p>
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", roundStatusBadge(round.status))}>
          {t("roundStatus." + round.status)}
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
          <span className="text-xs font-medium text-ptba-charcoal">{t("notes")} </span>
          {round.responseNotes}
        </div>
      )}
    </div>
  );
}
