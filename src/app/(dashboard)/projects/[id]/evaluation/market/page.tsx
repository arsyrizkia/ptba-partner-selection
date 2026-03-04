"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RatingInput } from "@/components/features/evaluation/rating-input";
import { Textarea } from "@/components/ui/textarea";
import { mockEvaluations } from "@/lib/mock-data";
import { mockProjects } from "@/lib/mock-data/projects";
import { mockPartners } from "@/lib/mock-data/partners";
import { formatPercent } from "@/lib/utils/format";
import { PartnerInfoPanel } from "@/components/features/evaluation/partner-info-panel";

interface SubScore {
  name: string;
  score: number;
  weight: number;
  notes: string;
}

interface SectionData {
  key: string;
  title: string;
  weight: number;
  subScores: SubScore[];
}

const DEFAULT_SECTIONS: SectionData[] = [
  {
    key: "market",
    title: "Pasar",
    weight: 15,
    subScores: [
      { name: "Pangsa Pasar & Posisi Kompetitif",  score: 0, weight: 0.30, notes: "" },
      { name: "Pertumbuhan Industri & Tren Pasar",  score: 0, weight: 0.25, notes: "" },
      { name: "Reputasi & Brand Value",             score: 0, weight: 0.25, notes: "" },
      { name: "Jaringan Distribusi & Pemasaran",    score: 0, weight: 0.20, notes: "" },
    ],
  },
  {
    key: "technical",
    title: "Teknis",
    weight: 20,
    subScores: [
      { name: "Kapabilitas Teknis & Teknologi",    score: 0, weight: 0.30, notes: "" },
      { name: "Pengalaman Proyek Sejenis",          score: 0, weight: 0.25, notes: "" },
      { name: "Sumber Daya Manusia Teknis",         score: 0, weight: 0.25, notes: "" },
      { name: "Fasilitas & Peralatan",              score: 0, weight: 0.20, notes: "" },
    ],
  },
  {
    key: "esg",
    title: "ESG",
    weight: 10,
    subScores: [
      { name: "Environmental (Lingkungan)", score: 0, weight: 0.40, notes: "" },
      { name: "Social (Sosial)",            score: 0, weight: 0.30, notes: "" },
      { name: "Governance (Tata Kelola)",   score: 0, weight: 0.30, notes: "" },
    ],
  },
];

function buildFormData(ev: (typeof mockEvaluations)[0] | undefined): Record<string, SectionData> {
  if (!ev) {
    const result: Record<string, SectionData> = {};
    DEFAULT_SECTIONS.forEach((s) => { result[s.key] = { ...s, subScores: s.subScores.map((ss) => ({ ...ss })) }; });
    return result;
  }
  return {
    market: {
      key: "market", title: "Pasar", weight: 15,
      subScores: ev.market?.subScores.map((s) => ({ name: s.name, score: Math.round(s.score), weight: s.weight, notes: s.notes || "" })) ?? [],
    },
    technical: {
      key: "technical", title: "Teknis", weight: 20,
      subScores: ev.technical?.subScores.map((s) => ({ name: s.name, score: Math.round(s.score), weight: s.weight, notes: s.notes || "" })) ?? [],
    },
    esg: {
      key: "esg", title: "ESG", weight: 10,
      subScores: ev.esg?.subScores.map((s) => ({ name: s.name, score: Math.round(s.score), weight: s.weight, notes: s.notes || "" })) ?? [],
    },
  };
}

export default function MarketTechnicalESGPage({
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

  const [formData, setFormData] = useState<Record<string, SectionData>>(
    () => buildFormData(evalData)
  );

  const updateScore = (sectionKey: string, subIndex: number, score: number) => {
    setFormData((prev) => {
      const section = { ...prev[sectionKey] };
      const newSubScores = [...section.subScores];
      newSubScores[subIndex] = { ...newSubScores[subIndex], score };
      section.subScores = newSubScores;
      return { ...prev, [sectionKey]: section };
    });
  };

  const updateNotes = (sectionKey: string, subIndex: number, notes: string) => {
    setFormData((prev) => {
      const section = { ...prev[sectionKey] };
      const newSubScores = [...section.subScores];
      newSubScores[subIndex] = { ...newSubScores[subIndex], notes };
      section.subScores = newSubScores;
      return { ...prev, [sectionKey]: section };
    });
  };

  const calculateSectionTotal = (section: SectionData): number => {
    if (!section.subScores.length) return 0;
    const weightedSum = section.subScores.reduce((sum, s) => sum + s.score * s.weight, 0);
    const totalWeight = section.subScores.reduce((sum, s) => sum + s.weight, 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const sectionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(formData).forEach(([key, section]) => { totals[key] = calculateSectionTotal(section); });
    return totals;
  }, [formData]);

  const overallTotal = useMemo(() => {
    let sum = 0;
    Object.entries(formData).forEach(([key, section]) => { sum += sectionTotals[key] * (section.weight / 100); });
    return sum;
  }, [formData, sectionTotals]);

  const sections = Object.values(formData);
  const partnerName = evalData?.partnerName ?? partner?.name ?? partnerId ?? "—";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ptba-gray">
        <Link href="/projects" className="hover:text-ptba-navy">Proyek</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-ptba-navy">{project?.name ?? id}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ptba-charcoal font-medium">Evaluasi Pasar & Teknis</span>
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
          <h1 className="text-2xl font-bold text-ptba-navy">Evaluasi Pasar, Teknis & ESG</h1>
          {isNew && (
            <span className="rounded-full bg-ptba-gold/15 px-2.5 py-0.5 text-xs font-semibold text-ptba-gold">
              Formulir Baru
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Penilaian aspek pasar, teknis, dan ESG untuk mitra terpilih</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ptba-section-bg px-3 py-1.5 text-sm font-medium text-ptba-navy">
          Mitra: {partnerName}
        </p>
      </div>

      {/* Evaluation Sections */}
      {sections.map((section) => (
        <Card key={section.key} padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-ptba-navy">{section.title}</h2>
            <span className="text-sm font-medium text-gray-500">Bobot: {section.weight}%</span>
          </div>

          <div className="space-y-6">
            {section.subScores.map((sub, subIdx) => (
              <div key={sub.name} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-ptba-charcoal">{sub.name}</p>
                    <p className="text-xs text-gray-400">Bobot: {formatPercent(sub.weight * 100)}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1.5">Skor</label>
                  <RatingInput value={sub.score} onChange={(val) => updateScore(section.key, subIdx, val)} />
                </div>
                <div>
                  <Textarea
                    label="Catatan"
                    value={sub.notes}
                    onChange={(e) => updateNotes(section.key, subIdx, e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Skor {section.title}</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-ptba-navy">
                {sectionTotals[section.key]?.toFixed(2) || "0.00"}
              </span>
              <span className="text-sm text-gray-400">/ 5.00</span>
            </div>
          </div>
        </Card>
      ))}

      {/* Overall Summary */}
      <Card accent="navy" padding="lg">
        <h2 className="text-lg font-semibold text-ptba-navy mb-4">Ringkasan Skor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {sections.map((section) => (
            <div key={section.key} className="bg-ptba-section-bg rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">{section.title}</p>
              <p className="text-2xl font-extrabold text-ptba-navy mt-1">
                {sectionTotals[section.key]?.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Bobot: {section.weight}% | Tertimbang:{" "}
                {((sectionTotals[section.key] || 0) * (section.weight / 100)).toFixed(3)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-600">Total Nilai Tertimbang (Pasar + Teknis + ESG)</span>
          <span className="text-3xl font-extrabold text-ptba-gold">{overallTotal.toFixed(3)}</span>
        </div>
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
