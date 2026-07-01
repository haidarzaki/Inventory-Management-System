# AssetTrace — Backend API

Backend untuk aplikasi **AssetTrace** (IT Asset Management), dibangun dengan:

- **NestJS** (Node.js + TypeScript)
- **PostgreSQL** sebagai database
- **Prisma** sebagai ORM
- **JWT** untuk autentikasi (email + password)

Backend ini dirancang untuk menggantikan data dummy/in-memory yang ada di frontend (`App.tsx`) dengan data sungguhan dari database, lewat REST API.

---

## 1. Prasyarat

- Node.js 18 atau lebih baru
- PostgreSQL (lokal atau cloud, misal Supabase/Railway/Neon)

## 2. Instalasi

```bash
cd assettrace-backend
npm install
```

## 3. Konfigurasi environment

Copy `.env.example` menjadi `.env`, lalu sesuaikan:

```bash
cp .env.example .env
```

Isi minimal yang wajib diubah:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/assettrace?schema=public"
JWT_SECRET="ganti-dengan-string-acak-yang-panjang"
CORS_ORIGIN="http://localhost:5173"   # alamat frontend kamu
```

## 4. Setup database

Buat tabel-tabel di database sesuai schema Prisma:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client (biasanya otomatis ikut jalan saat `npm install` / `migrate dev`, tapi kalau perlu manual):

```bash
npx prisma generate
```

(Opsional tapi direkomendasikan) Isi database dengan data contoh + akun login default:

```bash
npm run seed
```

Akun yang dibuat oleh seed:

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@assettrace.com   | admin123  |
| User  | rina@assettrace.com    | user123   |
| User  | budi@assettrace.com    | user123   |
| User  | siti@assettrace.com    | user123   |

> ⚠️ Ganti password ini sebelum dipakai di production.

## 5. Jalankan server

```bash
npm run start:dev     # mode development (auto-reload)
# atau
npm run build && npm run start:prod   # mode production
```

Server berjalan di `http://localhost:3000/api` (prefix `/api` otomatis ditambahkan ke semua route).

---

## Daftar Endpoint API

Semua endpoint (kecuali `/auth/register` dan `/auth/login`) butuh header:
`Authorization: Bearer <accessToken>`

### Auth
| Method | Endpoint        | Akses       | Keterangan                  |
|--------|-----------------|-------------|------------------------------|
| POST   | `/auth/register`| Publik      | Daftar akun baru (role: user)|
| POST   | `/auth/login`   | Publik      | Login, dapat `accessToken`   |
| GET    | `/auth/me`      | Login       | Data user yang sedang login  |

### Users (kelola pengguna)
| Method | Endpoint        | Akses  | Keterangan          |
|--------|-----------------|--------|----------------------|
| GET    | `/users`        | Admin  | List semua user      |
| POST   | `/users`        | Admin  | Tambah user baru (bisa set role) |
| PATCH  | `/users/:id`    | Admin  | Edit user             |
| DELETE | `/users/:id`    | Admin  | Hapus user            |

### Unique Assets (laptop, monitor, dll)
| Method | Endpoint                     | Akses          | Keterangan                       |
|--------|-------------------------------|----------------|------------------------------------|
| GET    | `/unique-assets`             | Login          | List aset (filter: `site`, `status`, `category`, `search`) |
| GET    | `/unique-assets/:id`         | Login          | Detail satu aset                   |
| POST   | `/unique-assets`             | Admin          | Tambah aset baru (Stock In)         |
| PATCH  | `/unique-assets/:id`         | Admin          | Edit data aset                     |
| DELETE | `/unique-assets/:id`         | Admin          | Hapus aset                         |
| POST   | `/unique-assets/:id/borrow`  | Login          | Pinjam aset (body: `{ note? }`)     |
| POST   | `/unique-assets/:id/return`  | Login (pemilik atau admin) | Kembalikan aset (body: `{ note? }`) |

### Consumable Assets (stok: tinta, kabel, dll)
| Method | Endpoint                            | Akses  | Keterangan                              |
|--------|--------------------------------------|--------|-------------------------------------------|
| GET    | `/consumable-assets`                | Login  | List item (filter: `site`, `category`, `search`, `lowStockOnly`) |
| GET    | `/consumable-assets/:id`            | Login  | Detail satu item                          |
| POST   | `/consumable-assets`                | Admin  | Tambah item baru                           |
| PATCH  | `/consumable-assets/:id`            | Admin  | Edit data item                             |
| DELETE | `/consumable-assets/:id`            | Admin  | Hapus item                                |
| POST   | `/consumable-assets/:id/stock-in`   | Admin  | Tambah stok (body: `{ quantity, note? }`)  |
| POST   | `/consumable-assets/:id/stock-out`  | Login  | Ambil stok / "Take" (body: `{ quantity, note? }`) |

### Logs (riwayat aktivitas)
| Method | Endpoint  | Akses | Keterangan                                              |
|--------|-----------|-------|-----------------------------------------------------------|
| GET    | `/logs`   | Admin | List log (filter: `type`, `assetKind`, `search`, `page`, `pageSize`) |

### Dashboard
| Method | Endpoint           | Akses | Keterangan                                   |
|--------|---------------------|-------|-------------------------------------------------|
| GET    | `/dashboard/stats`  | Login | Statistik ringkasan (filter: `site`)            |

---

## Contoh pemakaian (curl)

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assettrace.com","password":"admin123"}'

# Pakai token dari response login di atas
curl http://localhost:3000/api/unique-assets \
  -H "Authorization: Bearer <accessToken>"

# Pinjam aset
curl -X POST http://localhost:3000/api/unique-assets/<id>/borrow \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"note":"Pakai untuk kerja remote"}'
```

---

## Aturan bisnis penting (sesuai logic di frontend)

- **Borrow**: aset harus berstatus `available`. Jatuh tempo default 14 hari (bisa diubah lewat `durationDays` di body).
- **Return**: hanya bisa dilakukan oleh **admin** atau **peminjam aset itu sendiri**.
- **Stock-out** (consumable): ditolak kalau jumlah yang diminta melebihi stok yang tersedia.
- **Stock-in / tambah aset baru**: khusus **admin**.
- **Activity log**: hanya **admin** yang bisa melihat daftar lengkap.
- Setiap transaksi (borrow/return/stock-in/stock-out) otomatis tercatat di tabel `log_entries`.

---

## Struktur folder

```
src/
  auth/              -> register, login, JWT, guard role
  users/             -> CRUD user (admin)
  unique-assets/     -> CRUD aset unik + borrow/return
  consumable-assets/ -> CRUD aset stok + stock-in/stock-out
  logs/              -> riwayat aktivitas
  dashboard/         -> statistik ringkasan
  prisma/            -> koneksi database (PrismaService)
  common/            -> exception filter, dll
prisma/
  schema.prisma      -> definisi tabel database
  seed.ts            -> data contoh untuk development
```

## Langkah selanjutnya: menyambungkan ke frontend

Frontend (`App.tsx`) saat ini masih pakai `useState` lokal untuk semua data. Untuk menyambungkannya ke backend ini, langkah besarnya:

1. Tambahkan halaman login yang memanggil `POST /auth/login`, simpan `accessToken` (di memory/context, atau localStorage).
2. Ganti `SEED_UNIQUE`, `SEED_CONSUMABLE`, `SEED_LOGS` dengan `fetch`/`axios` ke endpoint terkait saat komponen mount.
3. Ganti `handleBorrow`, `handleReturn`, `handleStockInConsumable`, dll agar memanggil endpoint API yang sesuai, lalu refresh data dari server (bukan update state lokal saja).
4. Set `VITE_API_BASE_URL` di frontend mengarah ke `http://localhost:3000/api` (atau domain production nanti).

Kalau mau, saya bisa bantu kerjakan langkah ini juga (integrasi frontend ke backend) di percakapan berikutnya.
