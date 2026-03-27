"use client";

import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ApplySuccessPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const t = useTranslations("applySuccess");

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-ptba-charcoal">{t("title")}</h1>
        <p className="mt-2 text-sm text-ptba-gray leading-relaxed">
          {t("description")}
        </p>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => router.push(`/mitra/projects/${projectId}`)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ptba-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-ptba-navy/90 transition-colors"
          >
            {t("viewProjectDetail")} <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push(`/mitra/projects/${projectId}`)}
            className="w-full rounded-lg border border-ptba-navy px-4 py-2.5 text-sm font-medium text-ptba-navy hover:bg-ptba-navy/5 transition-colors"
          >
            {t("viewRegistrationStatus")}
          </button>
        </div>
      </div>
    </div>
  );
}
