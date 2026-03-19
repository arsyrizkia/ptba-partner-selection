"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { projectApi, ApiClientError } from "@/lib/api/client";
import ProjectForm, {
  type ProjectFormData,
  type SupportingFileExisting,
} from "@/components/features/project/project-form";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [projectData, setProjectData] = useState<any>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

  // Fetch existing project data
  useEffect(() => {
    if (!accessToken) return;
    setLoadingProject(true);
    setLoadError("");
    projectApi(accessToken)
      .getById(id)
      .then((res) => {
        const project = res.data;
        if (!project) {
          setLoadError("Proyek tidak ditemukan.");
          return;
        }
        setProjectData(project);
      })
      .catch((err) => {
        if (err instanceof ApiClientError) {
          setLoadError(err.message);
        } else {
          setLoadError("Gagal memuat data proyek.");
        }
      })
      .finally(() => {
        setLoadingProject(false);
      });
  }, [accessToken, id]);

  // Upload a file immediately (edit mode)
  const handleFileUpload = async (file: File): Promise<SupportingFileExisting | null> => {
    if (!accessToken) return null;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("type", "supporting");

      const res = await fetch(`${API_BASE}/projects/${id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengunggah");
      }

      const data = await res.json();
      return {
        id: data.document.id,
        name: data.document.name,
        fileKey: data.document.fileKey,
      };
    } catch (err: any) {
      setSubmitError(err.message || "Gagal mengunggah dokumen");
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  // Delete an existing supporting file
  const handleFileDelete = async (fileId: string) => {
    if (!accessToken) return;
    try {
      await fetch(`${API_BASE}/projects/${id}/documents/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (
    formData: ProjectFormData,
    templateFiles: Record<string, File>,
  ) => {
    if (!accessToken || !formData.projectType) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      // Build PIC assignments from form data
      const picAssignments = Object.entries(formData.picAssignments)
        .filter(([, userId]) => userId)
        .map(([role, userId]) => {
          const user = formData.internalUsers.find((u) => u.id === userId);
          return { role, userId, userName: user?.name };
        });

      // Update basic fields + PIC
      await projectApi(accessToken).update(id, {
        name: formData.projectName,
        type: formData.projectType as any,
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        phase1Deadline: formData.phase1Deadline || undefined,
        phase2Deadline: formData.phase2Deadline || undefined,
        phase3Deadline: formData.phase3Deadline || undefined,
        picAssignments: picAssignments.length > 0 ? picAssignments : undefined,
      });

      // Update requirements
      const reqs = formData.requirements.filter((r) => r.trim());
      await projectApi(accessToken).updateRequirements(id, reqs);

      // Update required documents (phase1 + phase2 + phase3 + legacy + custom)
      const allDocs: { documentTypeId: string; phase: string }[] = [
        ...formData.selectedPhase1Docs.map((docId) => ({ documentTypeId: docId, phase: "phase1" })),
        ...formData.selectedPhase2Docs.map((docId) => ({ documentTypeId: docId, phase: "phase2" })),
        ...formData.selectedPhase3Docs.map((docId) => ({ documentTypeId: docId, phase: "phase3" })),
        ...Object.entries(formData.selectedLegacyDocs).map(([docId, phase]) => ({ documentTypeId: docId, phase })),
        ...formData.customDocuments.filter((d) => d.name.trim()).map((d) => ({ documentTypeId: `custom_${d.name.replace(/\s+/g, "_").toLowerCase()}`, phase: d.phase })),
      ];
      await projectApi(accessToken).updateRequiredDocuments(id, allDocs);

      // Upload template files if any
      if (Object.keys(templateFiles).length > 0) {
        // Fetch updated project to get new required document IDs
        const updatedProject = await projectApi(accessToken).getById(id);
        const reqDocs = (updatedProject.data as any)?.requiredDocuments || [];

        // Build mapping from custom_N index keys to actual document type IDs
        const customDocIdMap: Record<string, string> = {};
        formData.customDocuments.forEach((d, i) => {
          if (d.name.trim()) {
            customDocIdMap[`custom_${i}`] = `custom_${d.name.replace(/\s+/g, "_").toLowerCase()}`;
          }
        });

        // Get fresh token (accessToken may have expired during save)
        const freshToken = typeof window !== "undefined" ? localStorage.getItem("ptba_access_token") : accessToken;

        for (const [templateKey, file] of Object.entries(templateFiles)) {
          const docTypeId = customDocIdMap[templateKey] || templateKey;
          const reqDoc = reqDocs.find((d: any) => d.documentTypeId === docTypeId);
          if (reqDoc?.id) {
            const fd = new FormData();
            fd.append("file", file);
            await fetch(`${API_BASE}/projects/${id}/required-documents/${reqDoc.id}/template`, {
              method: "POST",
              headers: { Authorization: `Bearer ${freshToken}` },
              body: fd,
            });
          }
        }
      }

      router.push(`/projects/${id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Gagal menyimpan perubahan. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loadingProject) {
    return (
      <div className="mx-auto max-w-3xl flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ptba-navy mb-4" />
        <p className="text-sm text-ptba-gray">Memuat data proyek...</p>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl flex flex-col items-center justify-center py-20">
        <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-center">
          <p className="text-sm text-red-700 mb-3">{loadError}</p>
          <Link
            href={`/projects/${id}`}
            className="text-sm font-medium text-ptba-navy hover:underline"
          >
            Kembali ke Detail Proyek
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProjectForm
      mode="edit"
      projectId={id}
      initialData={projectData}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitError={submitError}
      onFileUpload={handleFileUpload}
      onFileDelete={handleFileDelete}
      uploadingFile={uploadingFile}
      cancelHref={`/projects/${id}`}
    />
  );
}
