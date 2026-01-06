export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'user';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;    
  user: AuthUser;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
  details?: unknown;
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const DEFAULT_TIMEOUT_MS = 12_000;

// Helper: fetch con timeout
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Helper: tenta di estrarre un testo/JSON d’errore leggibile
async function readErrorBody(r: Response): Promise<string> {
  const text = await r.text().catch(() => '');
  if (!text) return `${r.status} ${r.statusText}`;
  try {
    const json = JSON.parse(text) as ApiErrorBody;
    return json.error || json.message || text;
  } catch {
    return text;
  }
}

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const r = await fetchWithTimeout(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });

  if (!r.ok) {
    const msg = await readErrorBody(r);
    throw new Error(msg || 'Login error');
  }
  // protezione: parsing sicuro
  try {
    return await r.json() as AuthResponse;
  } catch {
    throw new Error('Login: risposta non valida dal server');
  }
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
  const r = await fetchWithTimeout(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });

  if (!r.ok) {
    const msg = await readErrorBody(r);
    throw new Error(msg || 'Register error');
  }

  try {
    return await r.json() as AuthResponse;
  } catch {
    throw new Error('Register: risposta non valida dal server');
  }
}

export async function me(token: string): Promise<AuthUser> {
  const r = await fetchWithTimeout(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!r.ok) {
    const msg = await readErrorBody(r);
    throw new Error(msg || 'Invalid token');
  }

  try {
    return await r.json() as AuthUser;
  } catch {
    throw new Error('Me: risposta non valida dal server');
  }
}


export function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
