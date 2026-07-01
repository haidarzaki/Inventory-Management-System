
  # Asset Tracking App (AssetTrace) — Frontend

  This is a code bundle for Asset Tracking App. The original project is available at https://www.figma.com/design/EFv5YhoZxAl9cq51r7fH25/Asset-Tracking-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Menyambungkan ke Backend

  Frontend ini sekarang sudah terhubung ke backend AssetTrace (NestJS + PostgreSQL) lewat REST API, bukan lagi data dummy.

  1. **Pastikan backend sudah jalan** di `http://localhost:3000/api` (lihat README di folder `assettrace-backend`).
  2. (Opsional) Copy `.env.example` jadi `.env` kalau backend kamu jalan di alamat selain `http://localhost:3000/api`:
     ```bash
     cp .env.example .env
     ```
     Lalu sesuaikan `VITE_API_BASE_URL`.
  3. `npm install`
  4. `npm run dev`
  5. Buka browser ke alamat yang muncul (biasanya `http://localhost:5173`), lalu login dengan akun yang dibuat lewat `npm run seed` di backend:
     - Admin: `admin@assettrace.com` / `admin123`
     - User: `rina@assettrace.com` / `user123`

  Semua aksi (login, lihat aset, pinjam/kembalikan, stock-in/out) sekarang akan benar-benar tersimpan di database PostgreSQL lewat backend, bukan cuma di memory browser.

  ### Catatan
  - File baru: `src/app/lib/api.ts` — semua pemanggilan ke backend terpusat di sini.
  - Token login disimpan di `localStorage` (key: `assettrace_token`), jadi kalau halaman di-refresh, sesi login tetap tersimpan sampai logout atau token expired.
  