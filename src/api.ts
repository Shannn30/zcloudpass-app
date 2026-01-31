const API_BASE = "http://localhost:3000/api/v1";

type SessionInfo = {
  token: string;
  expires_at: string;
};

type ApiError = {
  code?: string;
  message: string;
  status?: number;
};

function normalizeExpiresToISO(expires: string): string {
  if (!expires) return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  let d = new Date(expires);
  if (isFinite(d.getTime())) return d.toISOString();

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(expires)) {
    const s = expires.replace(" ", "T") + "Z";
    d = new Date(s);
    if (isFinite(d.getTime())) return d.toISOString();
  }

  try {
    const s = expires.replace(" ", "T") + "Z";
    d = new Date(s);
    if (isFinite(d.getTime())) return d.toISOString();
  } catch {}

  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

async function saveSession(info: SessionInfo) {
  const normalized = {
    ...info,
    expires_at: normalizeExpiresToISO(String(info.expires_at)),
  };
  localStorage.setItem("zcloudpass_session", JSON.stringify(normalized));
}

function loadSession(): SessionInfo | null {
  const raw = localStorage.getItem("zcloudpass_session");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionInfo;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("zcloudpass_session");
}

function isSessionExpired(session: SessionInfo) {
  try {
    const exp = Date.parse(String(session.expires_at));
    if (isNaN(exp)) return true;
    return Date.now() > exp;
  } catch {
    return true;
  }
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  const status = res.status;
  try {
    const body = await res.json();
    const code = body?.error || body?.code;
    const message = body?.message || body?.error || JSON.stringify(body);
    return { code, message, status };
  } catch {
    const text = await res.text().catch(() => "");
    return { message: text || `HTTP ${status}`, status };
  }
}

async function tryPostJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

async function createSessionForEmail(
  email: string,
  masterPassword?: string,
): Promise<SessionInfo> {
  const payload: any = { email };
  if (masterPassword) payload.master_password = masterPassword;

  let res = await tryPostJson(`${API_BASE}/auth/session`, payload);

  if (res.status === 404) {
    res = await tryPostJson(`${API_BASE}/auth/login`, payload);
  }

  if (res.status === 404) {
    const rootBase = API_BASE.replace("/api/v1", "");
    res = await tryPostJson(`${rootBase}/auth/session`, payload);
  }

  if (res.status === 404) {
    const rootBase = API_BASE.replace("/api/v1", "");
    res = await tryPostJson(`${rootBase}/auth/login`, payload);
  }

  if (!res.ok) {
    const err = await parseErrorResponse(res);
    const e: any = new Error(err.message || "Failed to create session");
    e.code = err.code || `http_${err.status}`;
    throw e;
  }

  const data = await res.json();
  const info: SessionInfo = {
    token: data.session_token,
    expires_at: normalizeExpiresToISO(String(data.expires_at)),
  };
  await saveSession(info);
  return info;
}

async function ensureSession(
  email: string,
  masterPassword?: string,
): Promise<SessionInfo> {
  const s = loadSession();
  if (!s || isSessionExpired(s)) {
    return await createSessionForEmail(email, masterPassword);
  }
  return s;
}

function authHeadersIfAvailable(): Record<string, string> {
  const s = loadSession();
  if (!s || isSessionExpired(s)) return {};
  return { Authorization: `Bearer ${s.token}` };
}

export async function fetchHealth(): Promise<string> {
  const res = await fetch(`${API_BASE.replace("/api/v1", "")}/health`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Health check failed: ${res.status} ${txt}`);
  }
  return res.text();
}

export async function fetchAuthHealth(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/health`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Auth health check failed: ${res.status} ${txt}`);
  }
  return res.text();
}

export async function registerUser(
  email: string,
  encryptedVault: string | null,
  masterPassword?: string,
  username?: string,
) {
  if (!email) throw new Error("email is required");
  if (!masterPassword) {
    throw new Error("masterPassword is required for registration");
  }

  const payload: any = {
    email,
    master_password: masterPassword,
    encrypted_vault: encryptedVault,
  };
  if (username) payload.username = username;

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await parseErrorResponse(res);
    const e: any = new Error(err.message);
    e.code = err.code || `http_${err.status}`;
    throw e;
  }

  await createSessionForEmail(email, masterPassword);

  return res.json();
}

export async function getVault(
  email: string,
  masterPassword?: string,
): Promise<{ encrypted_vault: string | null; vault_version?: number }> {
  if (!email) throw new Error("email is required to fetch vault");
  await ensureSession(email, masterPassword);

  const headers: Record<string, string> = {
    ...authHeadersIfAvailable(),
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_BASE}/vault/`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const err = await parseErrorResponse(res);
    const e: any = new Error(err.message);
    e.code = err.code || `http_${err.status}`;
    throw e;
  }

  const data = await res.json();
  return {
    encrypted_vault: data?.encrypted_vault ?? null,
    vault_version:
      typeof data?.vault_version === "number" ? data.vault_version : undefined,
  };
}

export async function updateVault(
  email: string,
  encryptedVault: string,
  masterPassword?: string,
  vault_version?: number,
): Promise<{ vault_version?: number } | null> {
  if (!email) throw new Error("email is required to update vault");
  await ensureSession(email, masterPassword);

  const headers: Record<string, string> = {
    ...authHeadersIfAvailable(),
    "Content-Type": "application/json",
  };

  const payload: any = { encrypted_vault: encryptedVault };
  if (typeof vault_version === "number") payload.vault_version = vault_version;

  const res = await fetch(`${API_BASE}/vault/`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    const err = await parseErrorResponse(res);
    const e: any = new Error(err.message || "Conflict updating vault");
    e.code = err.code || "conflict";
    throw e;
  }

  if (!res.ok) {
    const err = await parseErrorResponse(res);
    const e: any = new Error(err.message || "Failed to update vault");
    e.code = err.code || `http_${err.status}`;
    throw e;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  masterPassword?: string,
): Promise<SessionInfo> {
  if (!email || !masterPassword)
    throw new Error("email and masterPassword required for login");
  return await createSessionForEmail(email, masterPassword);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const headers: Record<string, string> = {
    ...authHeadersIfAvailable(),
    "Content-Type": "application/json",
  };

  if (!headers.Authorization) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!res.ok) {
    const err = await parseErrorResponse(res);
    const e: any = new Error(err.message || "Failed to change password");
    e.code = err.code || `http_${err.status}`;
    throw e;
  }

  return res.json();
}

export async function logout() {
  try {
    const headers: Record<string, string> = {
      ...authHeadersIfAvailable(),
      "Content-Type": "application/json",
    };
    if (headers.Authorization) {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers });
    }
  } catch {
  } finally {
    clearSession();
  }
}

export function getSessionToken(): string | null {
  const s = loadSession();
  if (!s || isSessionExpired(s)) return null;
  return s.token;
}
