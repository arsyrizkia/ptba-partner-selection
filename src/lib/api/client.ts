const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

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
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiClientError";
  }
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
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
    throw new ApiClientError(
      (data as ApiError).error || "Terjadi kesalahan",
      res.status
    );
  }

  return data as T;
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

export function authApi() {
  return {
    login: (email: string, password: string) =>
      api<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      }),

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
  };
}
