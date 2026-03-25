const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

const TOKEN_KEY = "ptba_access_token";
const REFRESH_KEY = "ptba_refresh_token";
const STORAGE_KEY = "ptba_auth_user";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

interface ApiError {
  error: string;
  status: number;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;
  data?: Record<string, unknown>;
  constructor(message: string, status: number, code?: string, data?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
    this.name = "ApiClientError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  // Deduplicate concurrent refresh calls
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function forceLogout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = "/login";
}

async function rawFetch<T>(path: string, options: ApiOptions): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const errData = data as Record<string, unknown>;
    throw new ApiClientError(
      (errData.error as string) || "Terjadi kesalahan",
      res.status,
      errData.code as string | undefined,
      errData
    );
  }

  return data as T;
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  try {
    return await rawFetch<T>(path, options);
  } catch (err) {
    if (
      err instanceof ApiClientError &&
      err.status === 401 &&
      options.token &&
      !path.includes("/auth/refresh") &&
      !path.includes("/auth/login")
    ) {
      // Token expired — try auto-refresh
      const newToken = await tryRefreshToken();
      if (newToken) {
        // Retry with new token
        return await rawFetch<T>(path, { ...options, token: newToken });
      }
      // Refresh failed — force logout
      forceLogout();
    }
    throw err;
  }
}

// Auth-specific helpers

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    partnerId: string | null;
  };
}

export interface VerifyTokenResponse {
  name: string;
  email: string;
  department: string;
  role: string;
}

export interface ActivateResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  };
}

export interface CreateUserResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: string;
    createdAt: string;
  };
  invitationToken: string;
  activationLink: string;
}

export interface ListUsersResponse {
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: string;
    partnerId: string | null;
    createdAt: string;
  }[];
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  companyName: string;
  companyCode: string;
  industry: string;
  businessOverview?: string;
  address?: string;
  indonesiaOfficeAddress?: string;
  phone?: string;
  companyDomain?: string;
  website?: string;
  npwp?: string;
  siup?: string;
  nib?: string;
  contactPerson?: string;
  contactPosition?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    partner_id: string;
  };
  partner: {
    id: string;
    name: string;
    code: string;
  };
  verificationEmail: string;
}

export interface VerifyEmailResponse {
  message: string;
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export function authApi() {
  return {
    register: (data: RegisterInput) =>
      api<RegisterResponse>("/auth/register", {
        method: "POST",
        body: data,
      }),

    login: (email: string, password: string) =>
      api<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      }),

    verifyEmail: (token: string) =>
      api<VerifyEmailResponse>("/auth/verify-email", {
        method: "POST",
        body: { token },
      }),

    resendVerification: (email: string) =>
      api<ResendVerificationResponse>("/auth/resend-verification", {
        method: "POST",
        body: { email },
      }),

    verifyToken: (token: string) =>
      api<VerifyTokenResponse>(`/auth/verify-token?token=${encodeURIComponent(token)}`),

    activate: (token: string, password: string) =>
      api<ActivateResponse>("/auth/activate", {
        method: "POST",
        body: { token, password },
      }),

    createInternalUser: (
      data: { name: string; email: string; role: string; department?: string },
      token: string
    ) =>
      api<CreateUserResponse>("/auth/create-internal-user", {
        method: "POST",
        body: data,
        token,
      }),

    listUsers: (token: string) =>
      api<ListUsersResponse>("/auth/users", { token }),

    resendInvitation: (userId: string, token: string) =>
      api<{ message: string; activationLink: string }>(
        `/auth/users/${userId}/resend-invitation`,
        { method: "POST", token }
      ),

    deleteUser: (userId: string, token: string) =>
      api<{ message: string }>(`/auth/users/${userId}`, {
        method: "DELETE",
        token,
      }),

    refresh: (refreshToken: string) =>
      api<LoginResponse>("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      }),

    me: (token: string) =>
      api<{ user: LoginResponse["user"] }>("/auth/me", { token }),

    logout: (refreshToken: string, token: string) =>
      api("/auth/logout", {
        method: "POST",
        body: { refreshToken },
        token,
      }),

    changePassword: (currentPassword: string, newPassword: string, token: string) =>
      api<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
        token,
      }),
  };
}

// Partner API

export interface PartnerProfile {
  id: string;
  name: string;
  code: string;
  industry: string;
  business_overview: string | null;
  status: string;
  registration_date: string;
  address: string | null;
  indonesia_office_address: string | null;
  phone: string | null;
  company_domain: string | null;
  website: string | null;
  npwp: string | null;
  siup: string | null;
  nib: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  logo_file_key: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdatePartnerInput {
  name?: string;
  business_overview?: string;
  address?: string;
  indonesia_office_address?: string;
  phone?: string;
  company_domain?: string;
  website?: string;
  npwp?: string;
  siup?: string;
  nib?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
}

// Project API

export interface CreateProjectInput {
  name: string;
  type: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  phase1Deadline?: string;
  phase2Deadline?: string;
  phase3Deadline?: string;
  requirements?: string[];
  requiredDocuments?: { documentTypeId: string; phase?: string }[];
  phase1Documents?: { documentTypeId: string }[];
  phase2Documents?: { documentTypeId: string }[];
  phase3Documents?: { documentTypeId: string }[];
  picAssignments?: { role: string; userId: string; userName?: string }[];
  phasePics?: { phase: string; role: string; subcategory?: string; userId: string; userName?: string }[];
  ptbaDocuments?: { name: string; type: string }[];
}

export interface ProjectResponse {
  data: {
    id: string;
    name: string;
    type: string;
    status: string;
    [key: string]: unknown;
  };
}

export function projectApi(token: string) {
  return {
    create: (data: CreateProjectInput) =>
      api<ProjectResponse>("/projects", {
        method: "POST",
        body: data,
        token,
      }),

    list: () =>
      api<{ data: ProjectResponse["data"][] }>("/projects", { token }),

    getById: (id: string) =>
      api<{ data: ProjectResponse["data"] }>(`/projects/${id}`, { token }),

    publish: (id: string) =>
      api<ProjectResponse>(`/projects/${id}/publish`, { method: "POST", token }),

    openRegistration: (id: string) =>
      api<ProjectResponse>(`/projects/${id}/open-registration`, { method: "POST", token }),

    closeRegistration: (id: string) =>
      api<ProjectResponse>(`/projects/${id}/close-registration`, { method: "POST", token }),

    update: (id: string, data: Record<string, any>) =>
      api<ProjectResponse>(`/projects/${id}`, { method: "PUT", body: data, token }),

    updateRequirements: (id: string, requirements: string[]) =>
      api<ProjectResponse>(`/projects/${id}/requirements`, { method: "PUT", body: { requirements }, token }),

    updateRequiredDocuments: (id: string, documents: { documentTypeId: string; phase: string }[]) =>
      api<ProjectResponse>(`/projects/${id}/required-documents`, { method: "PUT", body: { documents }, token }),
  };
}

// Negotiation API

export function negotiationApi(token: string) {
  return {
    get: (projectId: string) =>
      api<{ negotiation: import("@/lib/types").Negotiation }>(`/negotiations/${projectId}`, { token }),

    start: (projectId: string, applicationId: string) =>
      api<{ negotiation: import("@/lib/types").Negotiation }>(`/negotiations/${projectId}/start`, {
        method: "POST",
        body: { applicationId },
        token,
      }),

    submitMitraProposal: (
      projectId: string,
      data: {
        proposedValue: number;
        justification: string;
        costBreakdown?: import("@/lib/types").CostBreakdownItem[];
      }
    ) =>
      api<{ round: import("@/lib/types").NegotiationRound }>(`/negotiations/${projectId}/mitra-proposal`, {
        method: "POST",
        body: data,
        token,
      }),

    submitPTBAResponse: (
      projectId: string,
      data: { action: "accept" | "counter" | "reject"; counterValue?: number; notes: string }
    ) =>
      api<{ round: import("@/lib/types").NegotiationRound }>(`/negotiations/${projectId}/ptba-response`, {
        method: "POST",
        body: data,
        token,
      }),

    conclude: (projectId: string) =>
      api<{ negotiation: import("@/lib/types").Negotiation }>(`/negotiations/${projectId}/conclude`, {
        method: "POST",
        token,
      }),

    fail: (projectId: string, notes: string) =>
      api<{ negotiation: import("@/lib/types").Negotiation }>(`/negotiations/${projectId}/fail`, {
        method: "POST",
        body: { notes },
        token,
      }),
  };
}

// Document download helper — gets presigned URL from API and opens it
export async function downloadDocument(fileKey: string, token: string): Promise<void> {
  try {
    const res = await api<{ url: string }>(`/documents/download/${encodeURIComponent(fileKey)}`, { token });
    if (res.url) window.open(res.url, "_blank");
  } catch {
    // ignore
  }
}

export function partnerApi(token: string) {
  return {
    getById: (id: string) =>
      api<PartnerProfile>(`/partners/${id}`, { token }),

    update: (id: string, data: UpdatePartnerInput) =>
      api<PartnerProfile>(`/partners/${id}`, {
        method: "PUT",
        body: data,
        token,
      }),

    uploadLogo: async (id: string, file: File): Promise<PartnerProfile> => {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch(`${API_BASE}/partners/${id}/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new ApiClientError(err.error || "Upload failed", res.status);
      }
      return res.json();
    },

    deleteLogo: (id: string) =>
      api<PartnerProfile>(`/partners/${id}/logo`, {
        method: "DELETE",
        token,
      }),
  };
}
