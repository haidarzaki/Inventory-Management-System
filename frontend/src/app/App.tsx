import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Laptop,
  Package,
  ClipboardList,
  LogOut,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import * as api from "./lib/api";
import { ApiError, getToken, setToken, clearToken, DEMO_MODE } from "./lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "admin" | "user";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface UniqueAsset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  status: "available" | "borrowed" | "retired";
  borrowedBy?: string;
  borrowedAt?: string;
  returnDue?: string;
  location: string;
  site: string;
}

interface ConsumableAsset {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  location: string;
  site: string;
}

type LogType = "borrow" | "return" | "stock-in" | "stock-out";
type AssetKind = "unique" | "consumable";

interface LogEntry {
  id: string;
  type: LogType;
  assetKind: AssetKind;
  assetName: string;
  assetId: string;
  serial?: string;
  user: string;
  quantity?: number;
  timestamp: string;
  note?: string;
}

type View = "dashboard" | "unique" | "consumable" | "log";
type Modal =
  | { kind: "borrow"; asset: UniqueAsset }
  | { kind: "return"; asset: UniqueAsset }
  | { kind: "stock-in-unique" }
  | { kind: "stock-in-consumable" }
  | { kind: "stock-out-consumable"; asset: ConsumableAsset }
  | { kind: "add-unique" }
  | { kind: "add-consumable" }
  | null;

// ─── Sites ────────────────────────────────────────────────────────────────────

const SITES = [
  "Jakarta HQ",
  "Surabaya Office",
  "Bandung Branch",
  "Bali Remote",
];

// ─── Mapper: bentuk data dari API -> bentuk data yang dipakai komponen ────────
// (biar komponen di bawah tidak perlu berubah banyak)

function mapUniqueAsset(a: api.ApiUniqueAsset): UniqueAsset {
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    serialNumber: a.serialNumber,
    status: a.status,
    borrowedBy: a.borrowedBy?.name,
    borrowedAt: a.borrowedAt ?? undefined,
    returnDue: a.returnDue ?? undefined,
    location: a.location,
    site: a.site,
  };
}

function mapConsumableAsset(a: api.ApiConsumableAsset): ConsumableAsset {
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    unit: a.unit,
    quantity: a.quantity,
    minStock: a.minStock,
    location: a.location,
    site: a.site,
  };
}

function mapLogEntry(l: api.ApiLogEntry): LogEntry {
  return {
    id: l.id,
    type: l.type,
    assetKind: l.assetKind,
    assetName: l.assetName,
    assetId: l.assetId,
    serial: l.serial ?? undefined,
    user: l.userName,
    quantity: l.quantity ?? undefined,
    timestamp: l.timestamp,
    note: l.note ?? undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-500 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium border rounded-sm font-mono tracking-wide ${colorMap[color] ?? colorMap.slate}`}
    >
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-2xl font-bold ${color ?? "text-foreground"}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className="border border-border rounded px-3 py-2 text-sm bg-input-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        {...props}
      />
    </div>
  );
}

function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className="border border-border rounded px-3 py-2 text-sm bg-input-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors appearance-none"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className="border border-border rounded px-3 py-2 text-sm bg-input-background outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
        rows={3}
        {...props}
      />
    </div>
  );
}

function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center gap-1.5 font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed";
  const sz = size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm";
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-blue-700",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-blue-100 border border-blue-200",
    ghost:
      "bg-transparent text-muted-foreground hover:bg-muted border border-border",
    danger: "bg-destructive text-destructive-foreground hover:bg-red-700",
  };
  return (
    <button
      type={type}
      className={`${base} ${sz} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function ModalWrapper({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen({
  onLogin,
}: {
  onLogin: (user: CurrentUser, token: string) => void;
}) {
  const [email, setEmail] = useState(DEMO_MODE ? "admin@assettrace.com" : "");
  const [password, setPassword] = useState(DEMO_MODE ? "admin123" : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const { accessToken, user } = await api.auth.login(
        email.trim(),
        password,
      );
      onLogin(user, accessToken);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal login. Coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1923] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-4">
            <Package size={22} className="text-white" />
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight">
            Inventory Management System
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ICT Inventory Management System
          </p>
        </div>

        {/* Banner demo mode */}
        {DEMO_MODE && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
            <p className="text-amber-400 text-xs font-semibold mb-1">
              🚀 Demo Mode
            </p>
            <p className="text-slate-400 text-xs">
              Data tidak tersimpan permanen (reset saat refresh)
            </p>
            <div className="mt-2 flex gap-2 justify-center">
              <button
                onClick={() => {
                  setEmail("admin@assettrace.com");
                  setPassword("admin123");
                }}
                className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => {
                  setEmail("rina@assettrace.com");
                  setPassword("user123");
                }}
                className="text-xs px-2 py-1 rounded bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 transition-colors"
              >
                User
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-[#1A2535] border border-[#2A3A4D] rounded-lg p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              className="border border-[#2A3A4D] rounded px-3 py-2 text-sm bg-[#0F1923] text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors placeholder-slate-600"
              placeholder="admin@assettrace.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              className="border border-[#2A3A4D] rounded px-3 py-2 text-sm bg-[#0F1923] text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors placeholder-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={!email.trim() || !password || loading}
            className="mt-1 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          Inventory Management System v1.0
        </p>
      </div>
    </div>
  );
}

// ─── Log type helpers ─────────────────────────────────────────────────────────

const LOG_META: Record<
  LogType,
  { label: string; color: string; icon: React.ReactNode }
> = {
  borrow: {
    label: "Borrow",
    color: "amber",
    icon: <ArrowUpCircle size={13} />,
  },
  return: { label: "Return", color: "green", icon: <RotateCcw size={13} /> },
  "stock-in": {
    label: "Stock In",
    color: "blue",
    icon: <ArrowDownCircle size={13} />,
  },
  "stock-out": {
    label: "Stock Out",
    color: "purple",
    icon: <ArrowUpCircle size={13} />,
  },
};

// ─── Main app ─────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [uniqueAssets, setUniqueAssets] = useState<UniqueAsset[]>([]);
  const [consumableAssets, setConsumableAssets] = useState<ConsumableAsset[]>(
    [],
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<LogEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = currentUser?.role === "admin";

  // ── Pulihkan sesi login dari token tersimpan (saat refresh halaman) ──
  useEffect(() => {
    if (DEMO_MODE) {
      setAuthChecked(true);
      return;
    } // demo: tidak ada sesi persisten
    const token = getToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    api.auth
      .me()
      .then((user) => setCurrentUser(user))
      .catch(() => clearToken())
      .finally(() => setAuthChecked(true));
  }, []);

  // ── Auto logout kalau token invalid/expired ──
  useEffect(() => {
    function onUnauthorized() {
      setCurrentUser(null);
      toast.error("Sesi kamu sudah berakhir, silakan login lagi.");
    }
    window.addEventListener("assettrace:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("assettrace:unauthorized", onUnauthorized);
  }, []);

  function handleLogin(user: CurrentUser, token: string) {
    setToken(token);
    setCurrentUser(user);
  }

  function handleLogout() {
    clearToken();
    setCurrentUser(null);
    setUniqueAssets([]);
    setConsumableAssets([]);
    setLogs([]);
    setRecentActivity([]);
    setView("dashboard");
  }

  // ── Ambil semua data dari backend ──
  async function loadData(admin: boolean) {
    setDataLoading(true);
    try {
      const tasks: Promise<unknown>[] = [
        api.uniqueAssets
          .list()
          .then((res) => setUniqueAssets(res.map(mapUniqueAsset))),
        api.consumableAssets
          .list()
          .then((res) => setConsumableAssets(res.map(mapConsumableAsset))),
        api.dashboard
          .stats()
          .then((res) => setRecentActivity(res.recentLogs.map(mapLogEntry))),
      ];
      if (admin) {
        tasks.push(
          api.logs
            .list({ pageSize: 100 })
            .then((res) => setLogs(res.data.map(mapLogEntry))),
        );
      }
      await Promise.all(tasks);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Gagal memuat data dari server",
      );
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser) loadData(currentUser.role === "admin");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // ── Modal handlers (sekarang memanggil API backend sungguhan) ──

  function reportError(err: unknown, fallback: string) {
    toast.error(err instanceof ApiError ? err.message : fallback);
  }

  async function handleBorrow(asset: UniqueAsset, note: string) {
    setSubmitting(true);
    try {
      await api.uniqueAssets.borrow(asset.id, note || undefined);
      toast.success(`Berhasil meminjam "${asset.name}"`);
      setModal(null);
      await loadData(isAdmin);
    } catch (err) {
      reportError(err, "Gagal meminjam aset");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturn(asset: UniqueAsset, note: string) {
    setSubmitting(true);
    try {
      await api.uniqueAssets.returnAsset(asset.id, note || undefined);
      toast.success(`Berhasil mengembalikan "${asset.name}"`);
      setModal(null);
      await loadData(isAdmin);
    } catch (err) {
      reportError(err, "Gagal mengembalikan aset");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStockOutConsumable(
    asset: ConsumableAsset,
    qty: number,
    note: string,
  ) {
    setSubmitting(true);
    try {
      await api.consumableAssets.stockOut(asset.id, qty, note || undefined);
      toast.success(`Berhasil mengambil ${qty} ${asset.unit} "${asset.name}"`);
      setModal(null);
      await loadData(isAdmin);
    } catch (err) {
      reportError(err, "Gagal mengambil stok");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStockInConsumable(
    id: string,
    qty: number,
    note: string,
  ) {
    setSubmitting(true);
    try {
      await api.consumableAssets.stockIn(id, qty, note || undefined);
      toast.success("Stok berhasil ditambahkan");
      setModal(null);
      await loadData(isAdmin);
    } catch (err) {
      reportError(err, "Gagal menambah stok");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStockInUnique(data: {
    name: string;
    category: string;
    serialNumber: string;
    location: string;
    site: string;
  }) {
    setSubmitting(true);
    try {
      await api.uniqueAssets.create(data);
      toast.success(`"${data.name}" berhasil ditambahkan`);
      setModal(null);
      await loadData(isAdmin);
    } catch (err) {
      reportError(err, "Gagal menambah aset");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddConsumable(data: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
    minStock: number;
    location: string;
    site: string;
  }) {
    setSubmitting(true);
    try {
      await api.consumableAssets.create(data);
      toast.success(`"${data.name}" berhasil dibuat`);
      setModal(null);
      await loadData(isAdmin);
    } catch (err) {
      reportError(err, "Gagal membuat item");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Stats (dihitung dari data yang sudah diambil dari backend) ──

  const siteUnique = useMemo(
    () =>
      selectedSite === "all"
        ? uniqueAssets
        : uniqueAssets.filter((a) => a.site === selectedSite),
    [uniqueAssets, selectedSite],
  );
  const siteConsumable = useMemo(
    () =>
      selectedSite === "all"
        ? consumableAssets
        : consumableAssets.filter((a) => a.site === selectedSite),
    [consumableAssets, selectedSite],
  );

  const stats = useMemo(
    () => ({
      totalUnique: siteUnique.filter((a) => a.status !== "retired").length,
      availableUnique: siteUnique.filter((a) => a.status === "available")
        .length,
      borrowedUnique: siteUnique.filter((a) => a.status === "borrowed").length,
      lowStock: siteConsumable.filter((a) => a.quantity <= a.minStock).length,
      totalConsumable: siteConsumable.length,
    }),
    [siteUnique, siteConsumable],
  );

  // ── Belum selesai cek sesi login ──
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0F1923] flex items-center justify-center">
        <Loader2 size={24} className="text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  // ── Filtered lists ──

  const filteredUnique = uniqueAssets.filter(
    (a) =>
      (selectedSite === "all" || a.site === selectedSite) &&
      (a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredConsumable = consumableAssets.filter(
    (a) =>
      (selectedSite === "all" || a.site === selectedSite) &&
      (a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredLogs = logs.filter(
    (l) =>
      l.assetName.toLowerCase().includes(search.toLowerCase()) ||
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.type.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Sidebar nav ──

  const navItems: {
    id: View;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    { id: "unique", label: "Unique Assets", icon: <Laptop size={16} /> },
    { id: "consumable", label: "Consumables", icon: <Package size={16} /> },
    {
      id: "log",
      label: "Activity Log",
      icon: <ClipboardList size={16} />,
      adminOnly: true,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* Sidebar */}
      <aside
        className="bg-[#0F1923] flex flex-col shrink-0 transition-all duration-200 overflow-hidden"
        style={{ width: sidebarOpen ? "14rem" : "3.5rem" }}
      >
        {/* Logo row + toggle */}
        {sidebarOpen ? (
          <div className="border-b border-[#1E2F40] flex items-center gap-2.5 px-3 py-5">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center shrink-0">
              <Package size={14} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight flex-1 truncate">
              Inventory Management System
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        ) : (
          <div className="border-b border-[#1E2F40] flex items-center justify-center py-5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                title={!sidebarOpen ? item.label : undefined}
                onClick={() => {
                  setView(item.id);
                  setSearch("");
                }}
                className={`flex items-center gap-2.5 rounded text-sm font-medium w-full transition-colors ${
                  sidebarOpen
                    ? "px-3 py-2.5 justify-start"
                    : "px-0 py-2.5 justify-center"
                } ${active ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="py-4 border-t border-[#1E2F40] px-2">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2 px-1 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-slate-500 text-[10px] capitalize">
                    {currentUser.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-1 py-1.5 text-slate-500 hover:text-slate-300 text-xs w-full transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </>
          ) : (
            <button
              title="Sign out"
              onClick={handleLogout}
              className="flex items-center justify-center w-full py-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
          <div className="flex-1">
            <h2 className="font-semibold text-sm text-foreground">
              {view === "dashboard" && "Dashboard"}
              {view === "unique" && "Unique Assets"}
              {view === "consumable" && "Consumable Assets"}
              {view === "log" && "Activity Log"}
            </h2>
          </div>

          {/* Site filter */}
          <div className="relative flex items-center">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="pl-3 pr-7 py-1.5 text-xs border border-border rounded bg-input-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none font-medium text-foreground cursor-pointer"
            >
              <option value="all">All Sites</option>
              {SITES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>

          {view !== "dashboard" && (
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded bg-input-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-52"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Action buttons */}
          {view === "unique" && (
            <div className="flex gap-2">
              {isAdmin && (
                <Btn
                  size="sm"
                  onClick={() => setModal({ kind: "stock-in-unique" })}
                >
                  <Plus size={13} /> Stock In
                </Btn>
              )}
            </div>
          )}
          {view === "consumable" && isAdmin && (
            <div className="flex gap-2">
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => setModal({ kind: "add-consumable" })}
              >
                <Plus size={13} /> New Item
              </Btn>
              <Btn
                size="sm"
                onClick={() => setModal({ kind: "stock-in-consumable" })}
              >
                <Plus size={13} /> Stock In
              </Btn>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {dataLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Loader2 size={13} className="animate-spin" /> Memuat data dari
              server…
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {view === "dashboard" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  label="Unique Assets"
                  value={stats.totalUnique}
                  sub="serialized items"
                />
                <Stat
                  label="Available"
                  value={stats.availableUnique}
                  sub="ready to borrow"
                  color="text-emerald-600"
                />
                <Stat
                  label="Borrowed"
                  value={stats.borrowedUnique}
                  sub="currently out"
                  color="text-amber-600"
                />
                <Stat
                  label="Low Stock"
                  value={stats.lowStock}
                  sub="consumable items"
                  color={
                    stats.lowStock > 0 ? "text-red-600" : "text-emerald-600"
                  }
                />
              </div>

              {/* Recent activity */}
              <div className="bg-card border border-border rounded-md overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Activity
                  </span>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {recentActivity.map((log) => {
                      const meta = LOG_META[log.type];
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-4 py-2.5 w-24">
                            <Badge label={meta.label} color={meta.color} />
                          </td>
                          <td className="px-2 py-2.5 font-medium text-foreground max-w-[180px] truncate">
                            {log.assetName}
                          </td>
                          <td className="px-2 py-2.5 text-muted-foreground">
                            {log.serial && (
                              <span className="font-mono">{log.serial}</span>
                            )}
                            {log.quantity && (
                              <span>
                                {log.quantity}{" "}
                                {log.assetKind === "consumable"
                                  ? "units"
                                  : "pcs"}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-muted-foreground">
                            {log.user}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-right whitespace-nowrap">
                            {fmtDateTime(log.timestamp)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Borrowed assets */}
              <div className="bg-card border border-border rounded-md overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Currently Borrowed
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">
                        Asset
                      </th>
                      <th className="px-2 py-2 text-left text-muted-foreground font-medium">
                        Serial No.
                      </th>
                      <th className="px-2 py-2 text-left text-muted-foreground font-medium">
                        Borrowed By
                      </th>
                      <th className="px-2 py-2 text-left text-muted-foreground font-medium">
                        Site
                      </th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">
                        Due
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteUnique
                      .filter((a) => a.status === "borrowed")
                      .map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            {a.name}
                          </td>
                          <td className="px-2 py-2.5 font-mono text-muted-foreground">
                            {a.serialNumber}
                          </td>
                          <td className="px-2 py-2.5 text-muted-foreground">
                            {a.borrowedBy}
                          </td>
                          <td className="px-2 py-2.5 text-muted-foreground">
                            {a.site}
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">
                            {a.returnDue ? fmtDate(a.returnDue) : "—"}
                          </td>
                        </tr>
                      ))}
                    {siteUnique.filter((a) => a.status === "borrowed")
                      .length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-muted-foreground"
                        >
                          No items currently borrowed
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Low stock */}
              {stats.lowStock > 0 && (
                <div className="bg-card border border-border rounded-md overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-500" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Low Stock Alert
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {siteConsumable
                        .filter((a) => a.quantity <= a.minStock)
                        .map((a) => (
                          <tr
                            key={a.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-4 py-2.5 font-medium text-foreground">
                              {a.name}
                            </td>
                            <td className="px-2 py-2.5 text-muted-foreground">
                              {a.category}
                            </td>
                            <td className="px-2 py-2.5 text-muted-foreground">
                              {a.site}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="font-mono font-medium text-red-600">
                                {a.quantity}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                / {a.minStock} min
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── UNIQUE ASSETS ── */}
          {view === "unique" && (
            <div className="bg-card border border-border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-muted-foreground font-medium">
                      ID
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Name
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Category
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Serial Number
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Site
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Status
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Borrower
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Due Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-muted-foreground font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnique.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">
                        {asset.id}
                      </td>
                      <td className="px-2 py-2.5 font-medium text-foreground whitespace-nowrap">
                        {asset.name}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {asset.category}
                      </td>
                      <td className="px-2 py-2.5 font-mono text-[11px] text-muted-foreground">
                        {asset.serialNumber}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap">
                        {asset.site}
                      </td>
                      <td className="px-2 py-2.5">
                        {asset.status === "available" && (
                          <Badge label="Available" color="green" />
                        )}
                        {asset.status === "borrowed" && (
                          <Badge label="Borrowed" color="amber" />
                        )}
                        {asset.status === "retired" && (
                          <Badge label="Retired" color="slate" />
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {asset.borrowedBy ?? "—"}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {asset.returnDue ? fmtDate(asset.returnDue) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5">
                          {asset.status === "available" && (
                            <Btn
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setModal({ kind: "borrow", asset })
                              }
                            >
                              Borrow
                            </Btn>
                          )}
                          {asset.status === "borrowed" &&
                            (isAdmin ||
                              asset.borrowedBy === currentUser?.name) && (
                              <Btn
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setModal({ kind: "return", asset })
                                }
                              >
                                Return
                              </Btn>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUnique.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No assets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── CONSUMABLE ASSETS ── */}
          {view === "consumable" && (
            <div className="bg-card border border-border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-muted-foreground font-medium">
                      ID
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Name
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Category
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Unit
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Stock
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Min Stock
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Site
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Location
                    </th>
                    <th className="px-4 py-2.5 text-left text-muted-foreground font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsumable.map((asset) => {
                    const isLow = asset.quantity <= asset.minStock;
                    return (
                      <tr
                        key={asset.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">
                          {asset.id}
                        </td>
                        <td className="px-2 py-2.5 font-medium text-foreground">
                          {asset.name}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">
                          {asset.category}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">
                          {asset.unit}
                        </td>
                        <td className="px-2 py-2.5">
                          <span
                            className={`font-mono font-semibold ${isLow ? "text-red-600" : "text-foreground"}`}
                          >
                            {asset.quantity}
                          </span>
                          {isLow && (
                            <AlertTriangle
                              size={11}
                              className="inline ml-1.5 text-amber-500"
                            />
                          )}
                        </td>
                        <td className="px-2 py-2.5 font-mono text-muted-foreground">
                          {asset.minStock}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap">
                          {asset.site}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">
                          {asset.location}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1.5">
                            <Btn
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setModal({
                                  kind: "stock-out-consumable",
                                  asset,
                                })
                              }
                              disabled={asset.quantity === 0}
                            >
                              Take
                            </Btn>
                            {isAdmin && (
                              <Btn
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setModal({ kind: "stock-in-consumable" })
                                }
                              >
                                Stock In
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredConsumable.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ACTIVITY LOG (admin only) ── */}
          {view === "log" && isAdmin && (
            <div className="bg-card border border-border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-muted-foreground font-medium">
                      Type
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Asset
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Kind
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Serial / Qty
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      User
                    </th>
                    <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">
                      Note
                    </th>
                    <th className="px-4 py-2.5 text-right text-muted-foreground font-medium">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const meta = LOG_META[log.type];
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <Badge label={meta.label} color={meta.color} />
                        </td>
                        <td className="px-2 py-2.5 font-medium text-foreground max-w-[160px] truncate">
                          {log.assetName}
                        </td>
                        <td className="px-2 py-2.5">
                          <Badge
                            label={
                              log.assetKind === "unique"
                                ? "Unique"
                                : "Consumable"
                            }
                            color={
                              log.assetKind === "unique" ? "blue" : "purple"
                            }
                          />
                        </td>
                        <td className="px-2 py-2.5 font-mono text-[11px] text-muted-foreground">
                          {log.serial ??
                            (log.quantity ? `×${log.quantity}` : "—")}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">
                          {log.user}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground max-w-[160px] truncate">
                          {log.note ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap font-mono">
                          {fmtDateTime(log.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No log entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}

      {modal?.kind === "borrow" && (
        <BorrowModal
          asset={modal.asset}
          submitting={submitting}
          onClose={() => setModal(null)}
          onConfirm={handleBorrow}
        />
      )}
      {modal?.kind === "return" && (
        <ReturnModal
          asset={modal.asset}
          submitting={submitting}
          onClose={() => setModal(null)}
          onConfirm={handleReturn}
        />
      )}
      {modal?.kind === "stock-out-consumable" && (
        <StockOutConsumableModal
          asset={modal.asset}
          submitting={submitting}
          onClose={() => setModal(null)}
          onConfirm={handleStockOutConsumable}
        />
      )}
      {modal?.kind === "stock-in-consumable" && (
        <StockInConsumableModal
          assets={consumableAssets}
          submitting={submitting}
          onClose={() => setModal(null)}
          onConfirm={handleStockInConsumable}
        />
      )}
      {modal?.kind === "stock-in-unique" && (
        <StockInUniqueModal
          submitting={submitting}
          onClose={() => setModal(null)}
          onConfirm={handleStockInUnique}
        />
      )}
      {modal?.kind === "add-consumable" && (
        <AddConsumableModal
          submitting={submitting}
          onClose={() => setModal(null)}
          onConfirm={handleAddConsumable}
        />
      )}
    </div>
  );
}

// ─── Modal components ─────────────────────────────────────────────────────────

function BorrowModal({
  asset,
  submitting,
  onClose,
  onConfirm,
}: {
  asset: UniqueAsset;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (a: UniqueAsset, note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <ModalWrapper title="Borrow Asset" onClose={onClose}>
      <div className="bg-muted rounded p-3 flex flex-col gap-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Asset</span>
          <span className="font-medium">{asset.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Serial No.</span>
          <span className="font-mono">{asset.serialNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Location</span>
          <span>{asset.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Return Due</span>
          <span>
            {fmtDate(new Date(Date.now() + 14 * 86400000).toISOString())}
          </span>
        </div>
      </div>
      <Textarea
        label="Note (optional)"
        placeholder="Reason for borrowing…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Btn>
        <Btn onClick={() => onConfirm(asset, note)} disabled={submitting}>
          {submitting ? "Memproses…" : "Confirm Borrow"}
        </Btn>
      </div>
    </ModalWrapper>
  );
}

function ReturnModal({
  asset,
  submitting,
  onClose,
  onConfirm,
}: {
  asset: UniqueAsset;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (a: UniqueAsset, note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <ModalWrapper title="Return Asset" onClose={onClose}>
      <div className="bg-muted rounded p-3 flex flex-col gap-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Asset</span>
          <span className="font-medium">{asset.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Serial No.</span>
          <span className="font-mono">{asset.serialNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Borrowed By</span>
          <span>{asset.borrowedBy}</span>
        </div>
      </div>
      <Textarea
        label="Note (optional)"
        placeholder="Condition notes…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Btn>
        <Btn onClick={() => onConfirm(asset, note)} disabled={submitting}>
          {submitting ? "Memproses…" : "Confirm Return"}
        </Btn>
      </div>
    </ModalWrapper>
  );
}

function StockOutConsumableModal({
  asset,
  submitting,
  onClose,
  onConfirm,
}: {
  asset: ConsumableAsset;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (a: ConsumableAsset, qty: number, note: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  return (
    <ModalWrapper title="Take from Stock" onClose={onClose}>
      <div className="bg-muted rounded p-3 flex flex-col gap-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Item</span>
          <span className="font-medium">{asset.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Available</span>
          <span className="font-mono font-semibold">
            {asset.quantity} {asset.unit}
          </span>
        </div>
      </div>
      <Input
        label={`Quantity (${asset.unit})`}
        type="number"
        min={1}
        max={asset.quantity}
        value={qty}
        onChange={(e) =>
          setQty(Math.min(Number(e.target.value), asset.quantity))
        }
      />
      <Textarea
        label="Note (optional)"
        placeholder="Purpose or requester…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Btn>
        <Btn
          onClick={() => onConfirm(asset, qty, note)}
          disabled={qty < 1 || submitting}
        >
          {submitting ? "Memproses…" : "Confirm Take"}
        </Btn>
      </div>
    </ModalWrapper>
  );
}

function StockInConsumableModal({
  assets,
  submitting,
  onClose,
  onConfirm,
}: {
  assets: ConsumableAsset[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: (id: string, qty: number, note: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const selected = assets.find((a) => a.id === selectedId);
  return (
    <ModalWrapper title="Stock In — Consumable" onClose={onClose}>
      <Select
        label="Item"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {assets.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
      {selected && (
        <div className="text-xs text-muted-foreground bg-muted rounded p-2">
          Current stock:{" "}
          <span className="font-mono font-semibold text-foreground">
            {selected.quantity} {selected.unit}
          </span>
        </div>
      )}
      <Input
        label="Quantity to add"
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
      />
      <Textarea
        label="Note (optional)"
        placeholder="Supplier, PO number…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Btn>
        <Btn
          onClick={() => onConfirm(selectedId, qty, note)}
          disabled={qty < 1 || !selectedId || submitting}
        >
          {submitting ? "Memproses…" : "Confirm Stock In"}
        </Btn>
      </div>
    </ModalWrapper>
  );
}

function StockInUniqueModal({
  submitting,
  onClose,
  onConfirm,
}: {
  submitting: boolean;
  onClose: () => void;
  onConfirm: (data: {
    name: string;
    category: string;
    serialNumber: string;
    location: string;
    site: string;
  }) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    serialNumber: "",
    location: "",
    site: SITES[0],
  });
  const valid = form.name && form.serialNumber && form.category && form.site;
  return (
    <ModalWrapper title="Stock In — Unique Asset" onClose={onClose}>
      <Input
        label="Asset Name"
        placeholder='e.g. MacBook Pro 14"'
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Input
        label="Category"
        placeholder="e.g. Laptop"
        value={form.category}
        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
      />
      <Input
        label="Serial Number"
        placeholder="e.g. C02XY1234ABC"
        value={form.serialNumber}
        onChange={(e) =>
          setForm((f) => ({ ...f, serialNumber: e.target.value }))
        }
      />
      <Select
        label="Site"
        value={form.site}
        onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}
      >
        {SITES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Input
        label="Storage Location"
        placeholder="e.g. IT Room A"
        value={form.location}
        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
      />
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Btn>
        <Btn onClick={() => onConfirm(form)} disabled={!valid || submitting}>
          {submitting ? "Memproses…" : "Add Asset"}
        </Btn>
      </div>
    </ModalWrapper>
  );
}

function AddConsumableModal({
  submitting,
  onClose,
  onConfirm,
}: {
  submitting: boolean;
  onClose: () => void;
  onConfirm: (data: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
    minStock: number;
    location: string;
    site: string;
  }) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "pcs",
    quantity: 0,
    minStock: 5,
    location: "",
    site: SITES[0],
  });
  const valid = form.name && form.category && form.unit && form.site;
  return (
    <ModalWrapper title="Add Consumable Item" onClose={onClose}>
      <Input
        label="Item Name"
        placeholder="e.g. HP 63XL Black Ink"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Input
        label="Category"
        placeholder="e.g. Ink Cartridge"
        value={form.category}
        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
      />
      <Select
        label="Site"
        value={form.site}
        onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}
      >
        {SITES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Unit"
          placeholder="pcs / ream…"
          value={form.unit}
          onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
        />
        <Input
          label="Initial Stock"
          type="number"
          min={0}
          value={form.quantity}
          onChange={(e) =>
            setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min Stock"
          type="number"
          min={0}
          value={form.minStock}
          onChange={(e) =>
            setForm((f) => ({ ...f, minStock: Number(e.target.value) }))
          }
        />
        <Input
          label="Location"
          placeholder="e.g. Supply Room"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Btn>
        <Btn onClick={() => onConfirm(form)} disabled={!valid || submitting}>
          {submitting ? "Memproses…" : "Create Item"}
        </Btn>
      </div>
    </ModalWrapper>
  );
}
