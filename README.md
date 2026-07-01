# Inventory Management System

Aplikasi manajemen aset IT perusahaan — tracking laptop, monitor, dan stok habis pakai (kabel, tinta, dll) lintas lokasi.

![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/backend-NestJS-E0234E?logo=nestjs)
![Database](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker)
![Vercel](https://img.shields.io/badge/vercel-demo-000000?logo=vercel)

---

## ✨ Fitur

- 🔐 Login dengan email + password (JWT), role Admin / User
- 💻 Tracking aset unik (laptop, monitor) — borrow & return
- 📦 Manajemen stok consumable (kabel, tinta, kertas) — stock in/out
- 📋 Activity log seluruh transaksi
- 📊 Dashboard statistik per site
- 🏢 Multi-site (Jakarta HQ, Surabaya, Bandung, dll)

---

## 🗂 Struktur Project

```
assettrace/
├── frontend/          # React + Vite (tampilan)
├── backend/           # NestJS + Prisma (API & database)
├── docker-compose.yml # Jalankan semua sekaligus
├── .env.example       # Template environment variable
└── README.md
```

---

## 🚀 Cara Deploy

Project ini punya **dua mode**, dikontrol dari satu environment variable:

```
VITE_DEMO_MODE=true   → Portofolio (Vercel, tanpa backend)
VITE_DEMO_MODE=false  → Operasional (Docker, backend + database penuh)
```

---

### 🌐 Mode 1: Portofolio (Vercel) — tanpa backend

Frontend berjalan sendiri dengan data dummy di browser. Cocok untuk demo atau pamer ke recruiter.

**Langkah:**

1. Push folder `frontend/` ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import repository
3. Di Vercel settings, set **Root Directory** ke `frontend`
4. Vercel otomatis baca `vercel.json` yang sudah ada — `VITE_DEMO_MODE=true` sudah diset di sana
5. Deploy → selesai ✅

Demo credentials yang bisa dipakai siapapun:
| Role | Email | Password |
|-------|----------------------------|-----------|
| Admin | admin@assettrace.com | admin123 |
| User | rina@assettrace.com | user123 |

---

### 🐳 Mode 2: Operasional (Docker) — backend + database penuh

Semua service (frontend, backend, PostgreSQL) jalan di satu server/komputer dengan satu perintah.

**Prasyarat:** Docker Desktop sudah terinstall

**Langkah:**

1. Copy file environment variable:
   ```bash
   cp .env.example .env
   ```
2. Buka `.env`, ganti `DB_PASSWORD` dan `JWT_SECRET` sesuai keinginan kamu
3. Jalankan semua service:
   ```bash
   docker-compose up -d
   ```
4. (Opsional) Isi database dengan data awal:
   ```bash
   docker exec assettrace_backend npm run seed
   ```
5. Buka browser ke `http://localhost` → aplikasi siap dipakai ✅

**Perintah berguna:**

```bash
docker-compose up -d        # Jalankan semua (background)
docker-compose down         # Matikan semua
docker-compose logs -f      # Lihat log real-time
docker-compose restart      # Restart semua service
```

---

## 🛠 Development Lokal (tanpa Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: isi DATABASE_URL dengan koneksi PostgreSQL lokal kamu

npx prisma migrate dev --name init
npm run seed       # isi data contoh
npm run start:dev  # jalan di http://localhost:3000/api
```

### Frontend

```bash
cd frontend
npm install
# Buat file .env:
echo 'VITE_API_BASE_URL=http://localhost:3000/api' > .env
echo 'VITE_DEMO_MODE=false' >> .env

npm run dev        # jalan di http://localhost:5173
```

---

## 🔑 Akun Default (setelah seed)

| Role  | Email                | Password |
| ----- | -------------------- | -------- |
| Admin | admin@assettrace.com | admin123 |
| User  | rina@assettrace.com  | user123  |
| User  | budi@assettrace.com  | user123  |

---

## 🔒 Hak Akses

| Fitur                 | Admin | User               |
| --------------------- | ----- | ------------------ |
| Lihat daftar aset     | ✅    | ✅                 |
| Pinjam aset           | ✅    | ✅                 |
| Kembalikan aset       | ✅    | ✅ (milik sendiri) |
| Ambil stok consumable | ✅    | ✅                 |
| Tambah / hapus aset   | ✅    | ❌                 |
| Restock consumable    | ✅    | ❌                 |
| Lihat activity log    | ✅    | ❌                 |
| Kelola user           | ✅    | ❌                 |

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api`

| Method | Endpoint                           | Akses  | Keterangan          |
| ------ | ---------------------------------- | ------ | ------------------- |
| POST   | `/auth/login`                      | Publik | Login               |
| GET    | `/auth/me`                         | Login  | Info user aktif     |
| GET    | `/unique-assets`                   | Login  | List aset           |
| POST   | `/unique-assets/:id/borrow`        | Login  | Pinjam aset         |
| POST   | `/unique-assets/:id/return`        | Login  | Kembalikan aset     |
| GET    | `/consumable-assets`               | Login  | List stok           |
| POST   | `/consumable-assets/:id/stock-out` | Login  | Ambil stok          |
| POST   | `/consumable-assets/:id/stock-in`  | Admin  | Tambah stok         |
| GET    | `/logs`                            | Admin  | Activity log        |
| GET    | `/dashboard/stats`                 | Login  | Statistik dashboard |
