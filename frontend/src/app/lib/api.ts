// ─── API client untuk backend AssetTrace ──────────────────────────────────────
// Semua pemanggilan ke backend NestJS lewat sini, supaya rapi dan terpusat.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "assettrace_token";

// ── Token storage ──

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Error khusus dari API ──

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ── Fetch wrapper inti ──

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // Beberapa endpoint (mis. DELETE) bisa balas tanpa body
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent("assettrace:unauthorized"));
  }

  if (!res.ok) {
    const message = (data && (data.message as string)) || "Terjadi kesalahan, coba lagi.";
    throw new ApiError(Array.isArray(message) ? message.join(", ") : message, res.status);
  }

  return data as T;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== "all");
  if (filtered.length === 0) return "";
  return "?" + filtered.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

// ── Tipe data dari backend ──

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export interface ApiUniqueAsset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  status: "available" | "borrowed" | "retired";
  location: string;
  site: string;
  borrowedById: string | null;
  borrowedBy: { id: string; name: string; email: string } | null;
  borrowedAt: string | null;
  returnDue: string | null;
}

export interface ApiConsumableAsset {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  location: string;
  site: string;
}

export interface ApiLogEntry {
  id: string;
  type: "borrow" | "return" | "stock-in" | "stock-out";
  assetKind: "unique" | "consumable";
  assetId: string;
  assetName: string;
  serial?: string | null;
  quantity?: number | null;
  note?: string | null;
  timestamp: string;
  userName: string;
}

export interface DashboardStats {
  totalUnique: number;
  availableUnique: number;
  borrowedUnique: number;
  lowStock: number;
  totalConsumable: number;
  recentLogs: ApiLogEntry[];
}

// ── Auth ──

const _realAuth = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ accessToken: string; user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => request<ApiUser>("/auth/me"),
};

// ── Unique assets ──

const _realUniqueAssets = {
  list: (params: { site?: string; status?: string; category?: string; search?: string } = {}) =>
    request<ApiUniqueAsset[]>(`/unique-assets${qs(params)}`),

  create: (data: { name: string; category: string; serialNumber: string; location: string; site: string }) =>
    request<ApiUniqueAsset>("/unique-assets", { method: "POST", body: JSON.stringify(data) }),

  borrow: (id: string, note?: string) =>
    request<ApiUniqueAsset>(`/unique-assets/${id}/borrow`, { method: "POST", body: JSON.stringify({ note }) }),

  returnAsset: (id: string, note?: string) =>
    request<ApiUniqueAsset>(`/unique-assets/${id}/return`, { method: "POST", body: JSON.stringify({ note }) }),
};

// ── Consumable assets ──

const _realConsumableAssets = {
  list: (params: { site?: string; category?: string; search?: string } = {}) =>
    request<ApiConsumableAsset[]>(`/consumable-assets${qs(params)}`),

  create: (data: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
    minStock: number;
    location: string;
    site: string;
  }) => request<ApiConsumableAsset>("/consumable-assets", { method: "POST", body: JSON.stringify(data) }),

  stockIn: (id: string, quantity: number, note?: string) =>
    request<ApiConsumableAsset>(`/consumable-assets/${id}/stock-in`, {
      method: "POST",
      body: JSON.stringify({ quantity, note }),
    }),

  stockOut: (id: string, quantity: number, note?: string) =>
    request<ApiConsumableAsset>(`/consumable-assets/${id}/stock-out`, {
      method: "POST",
      body: JSON.stringify({ quantity, note }),
    }),
};

// ── Logs ──

const _realLogs = {
  list: (params: { type?: string; assetKind?: string; search?: string; page?: number; pageSize?: number } = {}) =>
    request<{ data: ApiLogEntry[]; total: number }>(`/logs${qs(params)}`),
};

// ── Dashboard ──

const _realDashboard = {
  stats: (site?: string) => request<DashboardStats>(`/dashboard/stats${qs({ site })}`),
};

// ── Switch demo / real berdasarkan VITE_DEMO_MODE ─────────────────────────────

import {
  demoAuth,
  demoUniqueAssets,
  demoConsumableAssets,
  demoLogs,
  demoDashboard,
} from "./demo-api";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export const auth          = DEMO_MODE ? demoAuth           : _realAuth;
export const uniqueAssets  = DEMO_MODE ? demoUniqueAssets   : _realUniqueAssets;
export const consumableAssets = DEMO_MODE ? demoConsumableAssets : _realConsumableAssets;
export const logs          = DEMO_MODE ? demoLogs           : _realLogs;
export const dashboard     = DEMO_MODE ? demoDashboard      : _realDashboard;

export { DEMO_MODE };
