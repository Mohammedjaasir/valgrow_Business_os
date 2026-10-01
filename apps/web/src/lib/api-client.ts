const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta?.env ? import.meta.env["VITE_API_URL"] : undefined) ||
  "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let activeOrgId: string | null = null;
let refreshTokenPromise: Promise<boolean> | null = null;

export function setActiveOrgId(orgId: string | null) {
  activeOrgId = orgId;
  if (orgId) {
    localStorage.setItem("valgrow_active_org_id", orgId);
  } else {
    localStorage.removeItem("valgrow_active_org_id");
  }
}

export function getActiveOrgId(): string | null {
  if (activeOrgId) return activeOrgId;
  if (typeof window !== "undefined") {
    return localStorage.getItem("valgrow_active_org_id");
  }
  return null;
}

async function refreshAuthTokens(): Promise<boolean> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      return response.ok;
    } catch {
      return false;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const orgId = getActiveOrgId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (orgId && !headers["X-Organization-Id"]) {
    headers["X-Organization-Id"] = orgId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Sends httpOnly cookies
  });

  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/refresh") ||
    endpoint.includes("/auth/logout");

  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    const refreshed = await refreshAuthTokens();
    if (refreshed) {
      return apiClient<T>(endpoint, options, true);
    } else {
      setActiveOrgId(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || `Request failed with status ${response.status}`,
      data,
    );
  }

  return data as T;
}

export async function downloadFile(
  endpoint: string,
  fallbackFilename: string,
): Promise<void> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const orgId = getActiveOrgId();

  const headers: Record<string, string> = {};
  if (orgId) {
    headers["X-Organization-Id"] = orgId;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMsg = `Download failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) errorMsg = data.message;
    } catch {}
    throw new ApiError(response.status, errorMsg);
  }

  let filename = fallbackFilename;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const matches = /filename="?([^";]+)"?/.exec(disposition);
    if (matches && matches[1]) {
      filename = matches[1];
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
