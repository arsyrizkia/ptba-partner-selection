"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, FileText, Clock, Home } from "lucide-react";
import { mockProjects } from "@/lib/mock-data/projects";
import { formatDate } from "@/lib/utils/format";

export default function ApplicationSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const project = mockProjects.find((p) => p.id === projectId);

  const submittedAt = new Date().toISOString().split("T")[0];

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        {/* Success Card */}
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-ptba-charcoal">
            Lamaran Berhasil Dikirim!
          </h1>

          <p className="mt-3 text-sm text-ptba-gray leading-relaxed">
            Lamaran Anda untuk proyek berikut telah berhasil diajukan.
            Tim evaluasi PT Bukit Asam akan meninjau dokumen Anda.
          </p>

          {/* Project Info */}
          {project && (
            <div className="mt-6 rounded-xl bg-ptba-section-bg p-4 text-left">
              <p className="text-xs font-medium text-ptba-gray">Proyek</p>
              <p className="mt-0.5 text-sm font-semibold text-ptba-charcoal">
                {project.name}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-ptba-gray">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {project.requiredDocuments?.length ?? 0} dokumen
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Dikirim: {formatDate(submittedAt)}
                </span>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="mt-6 rounded-xl border border-ptba-light-gray p-4 text-left">
            <p className="text-sm font-semibold text-ptba-charcoal">
              Langkah Selanjutnya
            </p>
            <ul className="mt-3 space-y-2.5">
              {[
                "Tim PTBA akan memverifikasi dokumen yang Anda kirimkan",
                "Anda akan menerima notifikasi jika ada dokumen yang perlu dilengkapi",
                "Proses evaluasi akan dimulai setelah penutupan pendaftaran",
                "Pantau progres lamaran Anda melalui halaman Status",
              ].map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ptba-navy text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-ptba-gray leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/mitra/status")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
            >
              Pantau Status Lamaran
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push("/mitra/dashboard")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ptba-navy px-5 py-2.5 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
            >
              <Home className="h-4 w-4" />
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
