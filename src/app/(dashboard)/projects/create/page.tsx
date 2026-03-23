"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { projectApi, ApiClientError } from "@/lib/api/client";
import ProjectForm, {
  type ProjectFormData,
  type SupportingFileNew,
} from "@/components/features/project/project-form";

function isNewFile(f: { file?: File; name: string }): f is SupportingFileNew {
  return "file" in f && f.file instanceof File;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (
    formData: ProjectFormData,
    templateFiles: Record<string, File>,
    andPublish = false
  ) => {
    if (!accessToken || !formData.projectType) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const reqs = formData.requirements.filter((r) => r.trim());
      const p1Docs = formData.selectedPhase1Docs.map((id) => ({ documentTypeId: id }));
      const p2Docs = formData.selectedPhase2Docs.map((id) => ({ documentTypeId: id }));
      const p3Docs = formData.selectedPhase3Docs.map((id) => ({ documentTypeId: id }));
      const legacyDocs = Object.entries(formData.selectedLegacyDocs).map(([id, phase]) => ({
        documentTypeId: id,
        phase,
      }));
      const pics = Object.entries(formData.picAssignments)
        .filter(([, userId]) => userId)
        .map(([role, userId]) => {
          const user = formData.internalUsers.find((u) => u.id === userId);
          return { role, userId, userName: user?.name };
        });

      const res = await projectApi(accessToken).create({
        name: formData.projectName,
        type: formData.projectType as any,
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        phase1Deadline: formData.phase1Deadline || undefined,
        phase2Deadline: formData.phase2Deadline || undefined,
        phase3Deadline: formData.phase3Deadline || undefined,
        requirements: reqs,
        phase1Documents: p1Docs,
        phase2Documents: p2Docs,
        phase3Documents: p3Docs,
        requiredDocuments: legacyDocs,
        picAssignments: pics,
        phasePics: formData.phasePics,
        ptbaDocuments: [],
      });

      const newProjectId = res.data?.id;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

      // Upload cover image
      if (newProjectId && formData.coverImageFile) {
        const fd = new FormData();
        fd.append("file", formData.coverImageFile);
        await fetch(`${API_BASE}/projects/${newProjectId}/cover-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: fd,
        });
      }

      // Upload description images
      if (newProjectId && formData.descriptionImageFiles && formData.descriptionImageFiles.length > 0) {
        for (const file of formData.descriptionImageFiles) {
          const fd = new FormData();
          fd.append("file", file);
          await fetch(`${API_BASE}/projects/${newProjectId}/images`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: fd,
          });
        }
      }

      // Upload supporting files to MinIO
      if (newProjectId && formData.supportingFiles.length > 0) {
        for (const sf of formData.supportingFiles) {
          if (isNewFile(sf as any)) {
            const newFile = sf as SupportingFileNew;
            const fd = new FormData();
            fd.append("file", newFile.file);
            fd.append("name", newFile.name);
            fd.append("type", "supporting");
            fd.append("phase", newFile.phase || "phase1");
            await fetch(`${API_BASE}/projects/${newProjectId}/documents`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              body: fd,
            });
          }
        }
      }

      // Upload document templates
      if (newProjectId && Object.keys(templateFiles).length > 0) {
        const reqDocs = (res.data as any)?.requiredDocuments || [];

        // Build mapping from custom_N index keys to actual document type IDs
        const customDocIdMap: Record<string, string> = {};
        formData.customDocuments.forEach((d, i) => {
          if (d.name.trim()) {
            customDocIdMap[`custom_${i}`] = `custom_${d.name.replace(/\s+/g, "_").toLowerCase()}`;
          }
        });

        const freshToken = typeof window !== "undefined" ? localStorage.getItem("ptba_access_token") : accessToken;
        for (const [templateKey, file] of Object.entries(templateFiles)) {
          const docTypeId = customDocIdMap[templateKey] || templateKey;
          const reqDoc = reqDocs.find((d: any) => d.documentTypeId === docTypeId);
          if (reqDoc?.id) {
            const fd = new FormData();
            fd.append("file", file);
            await fetch(`${API_BASE}/projects/${newProjectId}/required-documents/${reqDoc.id}/template`, {
              method: "POST",
              headers: { Authorization: `Bearer ${freshToken}` },
              body: fd,
            });
          }
        }
      }

      if (andPublish && newProjectId) {
        await projectApi(accessToken).publish(newProjectId);
      }

      router.push("/projects");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Gagal membuat proyek. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProjectForm
      mode="create"
      onSubmit={handleSubmit}
      submitting={submitting}
      submitError={submitError}
      cancelHref="/projects"
    />
  );
}
