const API_BASE = "http://localhost:3000/api/v1";

type SessionInfo = {
  token: string;
  expires_at: string; // ISO timestamp
};

async function saveSession(info: SessionInfo) {
  localStorage.setItem("zcloudpass_session", JSON.stringify(info));
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
    const exp = new Date(session.expires_at).getTime();
    return Date.now() > exp;
  } catch {
    return true;
  }
}

async function createSessionForEmail(email: string): Promise<SessionInfo> {
  const res = await fetch(`${API_BASE}/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create session: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    session_token: string;
    expires_at: string;
  };

  const info: SessionInfo = {
    token: data.session_token,
    expires_at: data.expires_at,
  };
  await saveSession(info);
  return info;
}

async function ensureSession(email: string): Promise<SessionInfo> {
  const s = loadSession();
  if (!s || isSessionExpired(s)) {
    return await createSessionForEmail(email);
  }
  return s;
}

function authHeadersIfAvailable(): Record<string, string> {
  const s = loadSession();
  if (!s || isSessionExpired(s)) return {};
  return { Authorization: `Bearer ${s.token}` };
}

/**
 * Registers a user on the backend.
 *
 * Note: The backend expects registration data at POST /api/v1/auth/register.
 * We send { email, encrypted_vault } so the server can store the initial vault blob.
 *
 * This function preserves the previous signature: registerUser(email, encryptedVault)
 * and returns the parsed JSON response.
 */
export async function registerUser(email: string, encryptedVault: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, encrypted_vault: encryptedVault }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Registration failed: ${res.status} ${txt}`);
  }

  // Return whatever the backend returns (keeps compatibility with previous implementation)
  return res.json();
}

/**
 * GET the encrypted vault from the backend for the given email.
 *
 * Behavior:
 * - The frontend previously called getVault(email) directly, so to remain compatible we:
 *   1) Ensure there's a valid session (creating one via POST /auth/session if needed)
 *   2) Call GET /api/v1/vault/ with Authorization header
 *
 * Returns the string encrypted_vault (may be null/empty depending on server).
 */
export async function getVault(email: string): Promise<string> {
  // Ensure session exists (the backend currently issues sessions by email lookup)
  await ensureSession(email);

  const headers = {
    ...authHeadersIfAvailable(),
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_BASE}/vault/`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to get vault: ${res.status} ${txt}`);
  }

  const data = await res.json();
  // The backend returns { encrypted_vault: "<string|null>" }
  return data.encrypted_vault;
}

/**
 * Update the encrypted vault for the given email.
 *
 * Behavior:
 * - Ensures a session exists (creates one if missing/expired)
 * - Calls PUT /api/v1/vault/ with Authorization header and body { encrypted_vault }
 *
 * Keeps the previous signature updateVault(email, encryptedVault).
 */
export async function updateVault(email: string, encryptedVault: string) {
  await ensureSession(email);

  const headers = {
    ...authHeadersIfAvailable(),
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_BASE}/vault/`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ encrypted_vault: encryptedVault }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to update vault: ${res.status} ${txt}`);
  }
}

/**
 * Optional helper to explicitly login (create a session) and return stored session info.
 * Not used by current UI but exported for completeness.
 */
export async function login(email: string): Promise<SessionInfo> {
  return await createSessionForEmail(email);
}

/**
 * Logout and clear stored session token.
 */
export function logout() {
  clearSession();
}

/**
 * Return current session token (if present and not expired), otherwise null.
 */
export function getSessionToken(): string | null {
  const s = loadSession();
  if (!s || isSessionExpired(s)) return null;
  return s.token;
}
