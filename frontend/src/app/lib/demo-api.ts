// ─── Demo/Mock API ─────────────────────────────────────────────────────────────
// Dipakai saat VITE_DEMO_MODE=true (deploy ke Vercel untuk portofolio).
// Data tersimpan di memory browser — reset saat refresh, tidak butuh backend.

import type {
  ApiUser,
  ApiUniqueAsset,
  ApiConsumableAsset,
  ApiLogEntry,
  DashboardStats,
} from "./api";

// ── Demo users ──

const DEMO_USERS: (ApiUser & { password: string })[] = [
  { id: "demo-admin", name: "Admin", email: "admin@assettrace.com", role: "admin", password: "admin123" },
  { id: "demo-rina",  name: "Rina Kusuma",  email: "rina@assettrace.com",  role: "user", password: "user123" },
  { id: "demo-budi",  name: "Budi Santoso", email: "budi@assettrace.com",  role: "user", password: "user123" },
  { id: "demo-siti",  name: "Siti Rahayu",  email: "siti@assettrace.com",  role: "user", password: "user123" },
];

// ── In-memory stores (module-level, persist across renders) ──

let _uniqueAssets: ApiUniqueAsset[] = [
  { id:"U001", name:'MacBook Pro 14"', category:"Laptop", serialNumber:"C02XY1234ABC", status:"available", location:"IT Room A", site:"Jakarta HQ", borrowedById:null, borrowedBy:null, borrowedAt:null, returnDue:null },
  { id:"U002", name:'MacBook Pro 14"', category:"Laptop", serialNumber:"C02XY5678DEF", status:"borrowed",  location:"IT Room A", site:"Jakarta HQ", borrowedById:"demo-rina", borrowedBy:{id:"demo-rina",name:"Rina Kusuma",email:"rina@assettrace.com"}, borrowedAt:"2026-06-10T09:15:00Z", returnDue:"2026-06-24T09:15:00Z" },
  { id:"U003", name:"Dell XPS 15",     category:"Laptop", serialNumber:"DXPS9087GHI",  status:"available", location:"IT Room A", site:"Jakarta HQ", borrowedById:null, borrowedBy:null, borrowedAt:null, returnDue:null },
  { id:"U004", name:"Dell XPS 15",     category:"Laptop", serialNumber:"DXPS9022JKL",  status:"borrowed",  location:"Server Room", site:"Surabaya Office", borrowedById:"demo-budi", borrowedBy:{id:"demo-budi",name:"Budi Santoso",email:"budi@assettrace.com"}, borrowedAt:"2026-06-15T11:30:00Z", returnDue:"2026-06-29T11:30:00Z" },
  { id:"U005", name:"Logitech MX Master 3", category:"Peripheral", serialNumber:"LGT-MX3-00123", status:"available", location:"Storage B", site:"Jakarta HQ", borrowedById:null, borrowedBy:null, borrowedAt:null, returnDue:null },
  { id:"U006", name:"Logitech MX Master 3", category:"Peripheral", serialNumber:"LGT-MX3-00456", status:"available", location:"Storage B", site:"Surabaya Office", borrowedById:null, borrowedBy:null, borrowedAt:null, returnDue:null },
  { id:"U007", name:'Dell 27" Monitor', category:"Monitor", serialNumber:"DLM27-9900MNO", status:"borrowed", location:"IT Room A", site:"Bandung Branch", borrowedById:"demo-siti", borrowedBy:{id:"demo-siti",name:"Siti Rahayu",email:"siti@assettrace.com"}, borrowedAt:"2026-06-18T08:45:00Z", returnDue:"2026-07-02T08:45:00Z" },
  { id:"U008", name:'Dell 27" Monitor', category:"Monitor", serialNumber:"DLM27-9901PQR", status:"available", location:"IT Room A", site:"Bandung Branch", borrowedById:null, borrowedBy:null, borrowedAt:null, returnDue:null },
  { id:"U009", name:'iPad Pro 12.9"',   category:"Tablet",  serialNumber:"IPD12-A2378STU", status:"available", location:"Cabinet C", site:"Bali Remote", borrowedById:null, borrowedBy:null, borrowedAt:null, returnDue:null },
  { id:"U010", name:"Jabra Evolve2 85", category:"Headset", serialNumber:"JBR-E285-77001", status:"retired",  location:"Storage B", site:"Jakarta HQ", borrowedById:null, borrowedBy:null, borrowedAt:null, returnDue:null },
];

let _consumableAssets: ApiConsumableAsset[] = [
  { id:"C001", name:"HP 63XL Black Ink",       category:"Ink Cartridge", unit:"pcs",  quantity:8,  minStock:5,  location:"Supply Room", site:"Jakarta HQ" },
  { id:"C002", name:"HP 63XL Tri-color Ink",   category:"Ink Cartridge", unit:"pcs",  quantity:3,  minStock:5,  location:"Supply Room", site:"Jakarta HQ" },
  { id:"C003", name:"USB-A to USB-C Cable 1m", category:"Cable",         unit:"pcs",  quantity:24, minStock:10, location:"Storage B",   site:"Surabaya Office" },
  { id:"C004", name:"HDMI Cable 2m",            category:"Cable",         unit:"pcs",  quantity:6,  minStock:8,  location:"Storage B",   site:"Surabaya Office" },
  { id:"C005", name:"A4 Printing Paper",        category:"Stationery",    unit:"ream", quantity:40, minStock:15, location:"Supply Room", site:"Bandung Branch" },
  { id:"C006", name:"AA Battery",               category:"Battery",       unit:"pcs",  quantity:52, minStock:20, location:"Supply Room", site:"Jakarta HQ" },
  { id:"C007", name:"AAA Battery",              category:"Battery",       unit:"pcs",  quantity:12, minStock:20, location:"Supply Room", site:"Bali Remote" },
  { id:"C008", name:"Ethernet RJ45 Cat6 5m",   category:"Cable",         unit:"pcs",  quantity:9,  minStock:5,  location:"Storage B",   site:"Bandung Branch" },
];

let _logs: ApiLogEntry[] = [
  { id:"L001", type:"borrow",    assetKind:"unique",     assetId:"U002", assetName:'MacBook Pro 14"', serial:"C02XY5678DEF", quantity:null, note:"Project Alpha WFH", timestamp:"2026-06-10T09:15:00Z", userName:"Rina Kusuma" },
  { id:"L002", type:"borrow",    assetKind:"unique",     assetId:"U004", assetName:"Dell XPS 15",     serial:"DXPS9022JKL",  quantity:null, note:null,                timestamp:"2026-06-15T11:30:00Z", userName:"Budi Santoso" },
  { id:"L003", type:"stock-out", assetKind:"consumable", assetId:"C003", assetName:"USB-A to USB-C Cable 1m", serial:null,  quantity:2,    note:null,                timestamp:"2026-06-17T14:00:00Z", userName:"Siti Rahayu" },
  { id:"L004", type:"borrow",    assetKind:"unique",     assetId:"U007", assetName:'Dell 27" Monitor', serial:"DLM27-9900MNO", quantity:null, note:"Dual-screen setup", timestamp:"2026-06-18T08:45:00Z", userName:"Siti Rahayu" },
  { id:"L005", type:"stock-in",  assetKind:"consumable", assetId:"C005", assetName:"A4 Printing Paper", serial:null,          quantity:20,   note:"Monthly restock",   timestamp:"2026-06-19T10:00:00Z", userName:"Admin" },
  { id:"L006", type:"stock-out", assetKind:"consumable", assetId:"C006", assetName:"AA Battery",       serial:null,          quantity:8,    note:null,                timestamp:"2026-06-20T13:20:00Z", userName:"Budi Santoso" },
  { id:"L007", type:"return",    assetKind:"unique",     assetId:"U001", assetName:'MacBook Pro 14"', serial:"C02XY1234ABC", quantity:null, note:null,                timestamp:"2026-06-21T16:50:00Z", userName:"Rina Kusuma" },
  { id:"L008", type:"stock-in",  assetKind:"unique",     assetId:"U006", assetName:"Logitech MX Master 3", serial:"LGT-MX3-00456", quantity:1, note:"New procurement", timestamp:"2026-06-21T17:00:00Z", userName:"Admin" },
];

let _currentDemoUser: ApiUser | null = null;

function uid() { return "D" + Math.random().toString(36).slice(2, 8).toUpperCase(); }
function now() { return new Date().toISOString(); }
function dueDate(days = 14) { return new Date(Date.now() + days * 86400000).toISOString(); }
function delay<T>(val: T, ms = 300): Promise<T> { return new Promise(r => setTimeout(() => r(val), ms)); }

// ── Demo auth ──

export const demoAuth = {
  login: async (email: string, password: string) => {
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (!user) throw { message: "Email atau password salah", status: 401 };
    const { password: _, ...safeUser } = user;
    _currentDemoUser = safeUser;
    return delay({ accessToken: "demo-token-" + safeUser.id, user: safeUser });
  },
  register: async () => { throw { message: "Register tidak tersedia di demo mode", status: 403 }; },
  me: async () => {
    if (!_currentDemoUser) throw { message: "Unauthorized", status: 401 };
    return delay(_currentDemoUser);
  },
};

// ── Demo unique assets ──

export const demoUniqueAssets = {
  list: async (params: { site?: string; status?: string; category?: string; search?: string } = {}) => {
    let result = [..._uniqueAssets];
    if (params.site && params.site !== "all") result = result.filter(a => a.site === params.site);
    if (params.status) result = result.filter(a => a.status === params.status);
    if (params.category) result = result.filter(a => a.category === params.category);
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.serialNumber.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    }
    return delay(result);
  },

  create: async (data: { name: string; category: string; serialNumber: string; location: string; site: string }) => {
    const exists = _uniqueAssets.find(a => a.serialNumber === data.serialNumber);
    if (exists) throw { message: "Serial number sudah terdaftar", status: 400 };
    const newAsset: ApiUniqueAsset = { ...data, id: uid(), status: "available", borrowedById: null, borrowedBy: null, borrowedAt: null, returnDue: null };
    _uniqueAssets = [newAsset, ..._uniqueAssets];
    _logs = [{ id: uid(), type: "stock-in", assetKind: "unique", assetId: newAsset.id, assetName: newAsset.name, serial: newAsset.serialNumber, quantity: 1, note: null, timestamp: now(), userName: _currentDemoUser?.name ?? "Demo" }, ..._logs];
    return delay(newAsset);
  },

  borrow: async (id: string, note?: string) => {
    const idx = _uniqueAssets.findIndex(a => a.id === id);
    if (idx === -1) throw { message: "Aset tidak ditemukan", status: 404 };
    if (_uniqueAssets[idx].status !== "available") throw { message: "Aset sedang tidak tersedia", status: 400 };
    const user = _currentDemoUser!;
    _uniqueAssets[idx] = { ..._uniqueAssets[idx], status: "borrowed", borrowedById: user.id, borrowedBy: { id: user.id, name: user.name, email: user.email }, borrowedAt: now(), returnDue: dueDate(14) };
    _logs = [{ id: uid(), type: "borrow", assetKind: "unique", assetId: id, assetName: _uniqueAssets[idx].name, serial: _uniqueAssets[idx].serialNumber, quantity: null, note: note ?? null, timestamp: now(), userName: user.name }, ..._logs];
    return delay(_uniqueAssets[idx]);
  },

  returnAsset: async (id: string, note?: string) => {
    const idx = _uniqueAssets.findIndex(a => a.id === id);
    if (idx === -1) throw { message: "Aset tidak ditemukan", status: 404 };
    if (_uniqueAssets[idx].status !== "borrowed") throw { message: "Aset tidak sedang dipinjam", status: 400 };
    const assetName = _uniqueAssets[idx].name;
    const serial = _uniqueAssets[idx].serialNumber;
    _uniqueAssets[idx] = { ..._uniqueAssets[idx], status: "available", borrowedById: null, borrowedBy: null, borrowedAt: null, returnDue: null };
    _logs = [{ id: uid(), type: "return", assetKind: "unique", assetId: id, assetName, serial, quantity: null, note: note ?? null, timestamp: now(), userName: _currentDemoUser?.name ?? "Demo" }, ..._logs];
    return delay(_uniqueAssets[idx]);
  },
};

// ── Demo consumable assets ──

export const demoConsumableAssets = {
  list: async (params: { site?: string; category?: string; search?: string } = {}) => {
    let result = [..._consumableAssets];
    if (params.site && params.site !== "all") result = result.filter(a => a.site === params.site);
    if (params.category) result = result.filter(a => a.category === params.category);
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    }
    return delay(result);
  },

  create: async (data: { name: string; category: string; unit: string; quantity: number; minStock: number; location: string; site: string }) => {
    const newItem: ApiConsumableAsset = { ...data, id: uid() };
    _consumableAssets = [newItem, ..._consumableAssets];
    _logs = [{ id: uid(), type: "stock-in", assetKind: "consumable", assetId: newItem.id, assetName: newItem.name, serial: null, quantity: data.quantity, note: null, timestamp: now(), userName: _currentDemoUser?.name ?? "Demo" }, ..._logs];
    return delay(newItem);
  },

  stockIn: async (id: string, quantity: number, note?: string) => {
    const idx = _consumableAssets.findIndex(a => a.id === id);
    if (idx === -1) throw { message: "Item tidak ditemukan", status: 404 };
    _consumableAssets[idx] = { ..._consumableAssets[idx], quantity: _consumableAssets[idx].quantity + quantity };
    _logs = [{ id: uid(), type: "stock-in", assetKind: "consumable", assetId: id, assetName: _consumableAssets[idx].name, serial: null, quantity, note: note ?? null, timestamp: now(), userName: _currentDemoUser?.name ?? "Demo" }, ..._logs];
    return delay(_consumableAssets[idx]);
  },

  stockOut: async (id: string, quantity: number, note?: string) => {
    const idx = _consumableAssets.findIndex(a => a.id === id);
    if (idx === -1) throw { message: "Item tidak ditemukan", status: 404 };
    if (_consumableAssets[idx].quantity < quantity) throw { message: `Stok tidak cukup. Tersisa ${_consumableAssets[idx].quantity} ${_consumableAssets[idx].unit}`, status: 400 };
    _consumableAssets[idx] = { ..._consumableAssets[idx], quantity: _consumableAssets[idx].quantity - quantity };
    _logs = [{ id: uid(), type: "stock-out", assetKind: "consumable", assetId: id, assetName: _consumableAssets[idx].name, serial: null, quantity, note: note ?? null, timestamp: now(), userName: _currentDemoUser?.name ?? "Demo" }, ..._logs];
    return delay(_consumableAssets[idx]);
  },
};

// ── Demo logs ──

export const demoLogs = {
  list: async (params: { type?: string; assetKind?: string; search?: string; page?: number; pageSize?: number } = {}) => {
    let result = [..._logs];
    if (params.type) result = result.filter(l => l.type === params.type);
    if (params.assetKind) result = result.filter(l => l.assetKind === params.assetKind);
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(l => l.assetName.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q));
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return delay({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  },
};

// ── Demo dashboard ──

export const demoDashboard = {
  stats: async (site?: string): Promise<DashboardStats> => {
    const ua = site && site !== "all" ? _uniqueAssets.filter(a => a.site === site) : _uniqueAssets;
    const ca = site && site !== "all" ? _consumableAssets.filter(a => a.site === site) : _consumableAssets;
    return delay({
      totalUnique:     ua.filter(a => a.status !== "retired").length,
      availableUnique: ua.filter(a => a.status === "available").length,
      borrowedUnique:  ua.filter(a => a.status === "borrowed").length,
      lowStock:        ca.filter(a => a.quantity <= a.minStock).length,
      totalConsumable: ca.length,
      recentLogs:      _logs.slice(0, 8),
    });
  },
};
