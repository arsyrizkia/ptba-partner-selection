"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Upload, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LegalChecklist } from "@/components/features/evaluation/legal-checklist";
import { GradeDisplay } from "@/components/features/evaluation/grade-display";
import { mockEvaluations } from "@/lib/mock-data";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import type { LegalAspect } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { getGrade, getGradeColor } from "@/lib/utils/scoring";
import { PartnerInfoPanel } from "@/components/features/evaluation/partner-info-panel";

type NotaDinas = { nomor: string; tanggal: string; fileName: string | null };

const DEFAULT_ASPECTS: LegalAspect[] = [
  { name: "Legalitas Badan Usaha",        status: "Lulus", notes: "" },
  { name: "Perizinan Usaha",               status: "Lulus", notes: "" },
  { name: "Kepatuhan Perpajakan",          status: "Lulus", notes: "" },
  { name: "Riwayat Hukum",                status: "Lulus", notes: "" },
  { name: "Kepatuhan Regulasi Sektoral",   status: "Lulus", notes: "" },
  { name: "Sanksi & Blacklist",            status: "Lulus", notes: "" },
  { name: "Kepemilikan & Afiliasi",        status: "Lulus", notes: "" },
];

const LEGAL_WEIGHTS: Record<string, number> = {
  "Legalitas Badan Usaha": 20,
  "Perizinan Usaha": 15,
  "Kepatuhan Perpajakan": 15,
  "Riwayat Hukum": 15,
  "Kepatuhan Regulasi Sektoral": 10,
  "Sanksi & Blacklist": 15,
  "Kepemilikan & Afiliasi": 10,
};

const STATUS_SCORE: Record<string, number> = {
  Lulus: 100,
  Bersyarat: 60,
  "Tidak Lulus": 0,
};

const GRADE_DESCRIPTIONS: Record<string, string> = {
  AAA: "Sangat Baik", AA: "Baik", A: "Cukup Baik",
  BBB: "Cukup", BB: "Kurang", B: "Sangat Kurang", C: "Buruk",
};

function calculateLegalScore(aspects: LegalAspect[]): number {
  return aspects.reduce(
    (sum, a) => sum + (STATUS_SCORE[a.status] ?? 0) * (LEGAL_WEIGHTS[a.name] ?? 0) / 100,
    0
  );
}

function getOverallStatus(aspects: LegalAspect[]): "Lulus" | "Bersyarat" | "Tidak Lulus" {
  if (aspects.some((a) => a.status === "Tidak Lulus")) return "Tidak Lulus";
  if (aspects.some((a) => a.status === "Bersyarat")) return "Bersyarat";
  return "Lulus";
}

function getStatusVariant(status: string): "success" | "warning" | "error" {
  if (status === "Lulus") return "success";
  if (status === "Bersyarat") return "warning";
  return "error";
}

function getStatusIcon(status: string): string {
  if (status === "Lulus") return "✓";
  if (status === "Bersyarat") return "!";
  return "✗";
}

export default function LegalEvaluationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ partnerId?: string }>;
}) {
  const { id } = use(params);
  const { partnerId } = use(searchParams);
  const router = useRouter();

  const project = mockProjects.find((p) => p.id === id);
  const partner = mockPartners.find((p) => p.id === partnerId);
  const evalData = mockEvaluations.find(
    (e) => e.projectId === id && e.partnerId === partnerId
  );
  const isNew = !evalData;

  const [aspects, setAspects] = useState<LegalAspect[]>(
    evalData?.legal?.aspects ?? DEFAULT_ASPECTS.map((a) => ({ ...a }))
  );
  const [notaDinas, setNotaDinas] = useState<NotaDinas>({
    nomor: evalData?.legal?.notaDinas ?? "",
    tanggal: "",
    fileName: null,
  });
  const [catatan, setCatatan] = useState("");

  const handleStatusChange = (index: number, status: LegalAspect["status"]) => {
    setAspects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status };
      return updated;
    });
  };

  const handleNotesChange = (index: number, notes: string) => {
    setAspects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], notes };
      return updated;
    });
  };

  const overallStatus = useMemo(() => getOverallStatus(aspects), [aspects]);
  const statusCounts = useMemo(() => ({
    lulus: aspects.filter((a) => a.status === "Lulus").length,
    bersyarat: aspects.filter((a) => a.status === "Bersyarat").length,
    tidakLulus: aspects.filter((a) => a.status === "Tidak Lulus").length,
  }), [aspects]);

  const totalScore = useMemo(() => calculateLegalScore(aspects), [aspects]);
  const grade = useMemo(() => getGrade(totalScore), [totalScore]);

  const partnerName = evalData?.partnerName ?? partner?.name ?? partnerId ?? "—";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project?.name ?? id}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Evaluasi Hukum</span>
      </nav>

      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
      </button>

      {/* Two-column layout: form left, partner info right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
      <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-ptba-navy">Evaluasi Aspek Hukum</h1>
          {isNew && (
            <span className="rounded-full bg-ptba-gold/15 px-2.5 py-0.5 text-xs font-semibold text-ptba-gold">
              Formulir Baru
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Penilaian 7 aspek hukum untuk mitra terpilih</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ptba-section-bg px-3 py-1.5 text-sm font-medium text-ptba-navy">
          Mitra: {partnerName}
        </p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Lulus",      count: statusCounts.lulus,      bg: "bg-green-100", text: "text-green-700" },
          { label: "Bersyarat",  count: statusCounts.bersyarat,  bg: "bg-amber-100", text: "text-amber-700" },
          { label: "Tidak Lulus",count: statusCounts.tidakLulus, bg: "bg-red-100",   text: "text-red-700"   },
        ].map(({ label, count, bg, text }) => (
          <Card key={label} padding="sm">
            <div className="text-center">
              <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-full mb-2", bg)}>
                <span className={cn("text-lg font-bold", text)}>{count}</span>
              </div>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Legal Checklist Table */}
      <Card padding="sm">
        <LegalChecklist
          aspects={aspects}
          weights={LEGAL_WEIGHTS}
          statusScores={STATUS_SCORE}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
        />
      </Card>

      {/* Overall Status & Nota Dinas */}
      <div className="flex flex-col gap-6">
        <Card accent="navy" padding="lg">
          <h3 className="text-lg font-semibold text-ptba-navy mb-4">Status Keseluruhan</h3>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold",
                overallStatus === "Lulus"      && "bg-green-100 text-green-700",
                overallStatus === "Bersyarat"  && "bg-amber-100 text-amber-700",
                overallStatus === "Tidak Lulus"&& "bg-red-100 text-red-700"
              )}
            >
              {getStatusIcon(overallStatus)}
            </div>
            <div>
              <Badge variant={getStatusVariant(overallStatus)}>{overallStatus}</Badge>
              <p className="text-sm text-gray-500 mt-2">
                {overallStatus === "Lulus"       && "Seluruh aspek hukum telah memenuhi persyaratan."}
                {overallStatus === "Bersyarat"   && "Terdapat aspek yang memerlukan pemenuhan syarat tambahan."}
                {overallStatus === "Tidak Lulus" && "Terdapat aspek yang tidak memenuhi persyaratan."}
              </p>
              <div className="mt-3 text-xs text-gray-400 space-y-0.5">
                <p>Lulus: {statusCounts.lulus} aspek</p>
                <p>Bersyarat: {statusCounts.bersyarat} aspek</p>
                <p>Tidak Lulus: {statusCounts.tidakLulus} aspek</p>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="md" accent="navy">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-ptba-navy" />
            <h3 className="text-sm font-semibold text-ptba-navy">Nota Dinas</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nomor Nota Dinas</label>
              {isNew ? (
                <input
                  type="text"
                  placeholder="Contoh: ND-PTBA/2024/001"
                  value={notaDinas.nomor}
                  onChange={(e) => setNotaDinas((prev) => ({ ...prev, nomor: e.target.value }))}
                  className="w-full rounded border border-ptba-light-gray px-3 py-1.5 text-sm text-ptba-charcoal focus:border-ptba-steel-blue focus:outline-none"
                />
              ) : (
                <div className="bg-ptba-section-bg rounded px-3 py-1.5 text-sm">
                  {notaDinas.nomor || <i className="text-gray-400">—</i>}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal</label>
              {isNew ? (
                <input
                  type="date"
                  value={notaDinas.tanggal}
                  onChange={(e) => setNotaDinas((prev) => ({ ...prev, tanggal: e.target.value }))}
                  className="w-full rounded border border-ptba-light-gray px-3 py-1.5 text-sm text-ptba-charcoal focus:border-ptba-steel-blue focus:outline-none"
                />
              ) : (
                <div className="bg-ptba-section-bg rounded px-3 py-1.5 text-sm">
                  {notaDinas.tanggal || <i className="text-gray-400">—</i>}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">File Nota Dinas</label>
            {isNew ? (
              <label className="flex items-center gap-2 cursor-pointer w-fit rounded-lg border border-dashed border-ptba-steel-blue/50 bg-ptba-section-bg px-4 py-2.5 text-sm text-ptba-steel-blue hover:bg-ptba-steel-blue/5 transition-colors">
                <Upload className="h-4 w-4" />
                <span>{notaDinas.fileName ?? "Unggah PDF / DOCX"}</span>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNotaDinas((prev) => ({ ...prev, fileName: file.name }));
                  }}
                />
              </label>
            ) : (
              <div className="bg-ptba-section-bg rounded px-3 py-1.5 text-sm">
                {notaDinas.fileName ? (
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-ptba-navy" />
                    {notaDinas.fileName}
                  </span>
                ) : (
                  <i className="text-gray-400">Tidak ada file.</i>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Grade Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GradeDisplay
          grade={grade}
          score={totalScore}
          description={GRADE_DESCRIPTIONS[grade] || "N/A"}
        />
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-ptba-navy mb-4">Skala Grade Hukum</h3>
          <div className="space-y-2">
            {[
              { grade: "AAA", min: 90, desc: "Sangat Baik" },
              { grade: "AA",  min: 80, desc: "Baik" },
              { grade: "A",   min: 70, desc: "Cukup Baik" },
              { grade: "BBB", min: 60, desc: "Cukup" },
              { grade: "BB",  min: 50, desc: "Kurang" },
              { grade: "B",   min: 40, desc: "Sangat Kurang" },
              { grade: "C",   min: 0,  desc: "Buruk" },
            ].map((g) => (
              <div
                key={g.grade}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                  grade === g.grade ? "bg-ptba-navy/10 ring-2 ring-ptba-navy" : "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center w-10 h-7 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: getGradeColor(g.grade) }}
                  >
                    {g.grade}
                  </span>
                  <span className="text-ptba-charcoal">{g.desc}</span>
                </div>
                <span className="text-gray-400 text-xs">{g.min > 0 ? `>= ${g.min}` : "< 40"}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="md" accent="navy">
        <h3 className="text-sm font-semibold text-ptba-navy mb-3">Catatan &amp; Rekomendasi Evaluator</h3>
        {isNew ? (
          <Textarea
            placeholder="Tulis catatan dan rekomendasi..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="min-h-[100px]"
          />
        ) : (
          <div className="bg-ptba-section-bg rounded px-3 py-2 text-sm">
            {catatan || <i className="text-gray-400">Tidak ada catatan.</i>}
          </div>
        )}
      </Card>

      {isNew && (
        <div className="flex justify-end">
          <button className="rounded-lg bg-ptba-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-ptba-navy/90 transition-colors">
            Simpan Evaluasi
          </button>
        </div>
      )}
      </div>

      {/* Sidebar: Partner Info */}
      <div className="xl:sticky xl:top-6">
        {partner && <PartnerInfoPanel partner={partner} />}
      </div>
      </div>
    </div>
  );
}
