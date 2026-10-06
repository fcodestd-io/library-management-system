# Perpustakaan Arunika — Library Management System

Aplikasi web manajemen perpustakaan untuk mengelola katalog buku, keanggotaan, peminjaman berbayar, pengembalian, denda, pembayaran kasir, dan laporan keuangan. Dibangun dengan Next.js (App Router), Drizzle ORM, dan PostgreSQL (Neon).

## Fitur

- **Autentikasi & RBAC** — login email/password (NextAuth v5, Credentials) dengan dua peran: `OWNER` dan `STAFF`. Halaman `/users` dan `/settings` hanya bisa diakses `OWNER` (dijaga di `middleware.ts`).
- **Dashboard** — ringkasan aktivitas perpustakaan dengan grafik (Chart.js).
- **Master data**
  - Anggota (`STUDENT`, `LECTURER`, `STAFF`) beserta riwayat transaksi per anggota
  - Kategori buku
  - Ruangan & rak penyimpanan
  - Buku & eksemplar (copy) per buku, lengkap dengan nomor inventaris, kondisi, dan lokasi rak
  - User/petugas
- **Peminjaman** — sewa dihitung per hari (`harga sewa per hari × lama pinjam`), dengan batas maksimal hari pinjam dan batas maksimal peminjaman aktif per anggota.
- **Pengembalian** — otomatis menghitung denda keterlambatan, denda buku rusak, atau denda buku hilang, lalu mencatat pembayaran yang diterima saat itu (termasuk pembayaran sebagian dan kembalian).
- **Pembayaran kasir** — pelunasan sisa piutang sewa dan denda, mendukung cicilan (partial payment). Metode: `CASH`, `QRIS`, `TRANSFER`.
- **Laporan** — log gabungan peminjaman dan pembayaran dengan pencarian, filter tanggal dan tipe transaksi, pengurutan, serta paginasi. Kartu ringkasan menampilkan total transaksi, nilai sewa, uang masuk, sisa piutang, dan total denda (keterlambatan, rusak, hilang).
- **Pengaturan** — tarif dan aturan perpustakaan yang dapat diubah `OWNER` tanpa deploy ulang.

## Tech Stack

| Bagian          | Teknologi                                                        |
| --------------- | ---------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Server Actions), React 19                |
| Bahasa          | TypeScript                                                       |
| Database        | PostgreSQL (Neon serverless, driver WebSocket `Pool`)            |
| ORM             | Drizzle ORM + drizzle-kit                                        |
| Auth            | NextAuth v5 (beta), bcryptjs                                     |
| UI              | Tailwind CSS v4, shadcn/ui, Base UI, Radix, lucide-react, sonner |
| Form & validasi | react-hook-form, zod                                             |
| Grafik          | Chart.js, react-chartjs-2                                        |
| Package manager | pnpm                                                             |

## Struktur Proyek

```
app/
  (auth)/              Halaman login (root "/")
  (dashboard)/         Halaman setelah login
    dashboard/  members/  categories/  rooms/  books/
    loans/  returns/  payments/  reports/  users/  settings/
  api/auth/            Handler NextAuth
actions/               Server Actions (logika bisnis & query per modul)
components/            Komponen bersama (sidebar, button, combobox) dan components/ui (shadcn)
db/
  schema/              Definisi tabel & relasi Drizzle
  seed/                Script seeding (users, members)
  index.ts             Koneksi database
drizzle/               Migrasi SQL hasil drizzle-kit
lib/                   Auth config, util, dan skema validasi zod
middleware.ts          Proteksi rute & RBAC
```

## Skema Database

Tabel utama: `users`, `members`, `categories`, `rooms`, `racks`, `books`, `book_copies`, `loans`, `fines`, `payments`, dan `library_settings`.

Alur data keuangan:

- `loans` menyimpan tagihan sewa utama (`amount`) dan sisa piutang berjalan (`remaining_amount`).
- `fines` dibuat saat pengembalian dengan alasan `OVERDUE`, `DAMAGE`, atau `LOST`, serta menyimpan `amount` (denda utama) dan `remaining_amount`.
- `payments` mencatat setiap pembayaran: `amount_to_pay` (sisa tagihan saat itu), `amount_paid` (uang diterima), `applied_amount` (yang dipotongkan ke tagihan), dan `change_amount` (kembalian). Satu tagihan dapat memiliki banyak pembayaran (cicilan).

## Aturan Bisnis (Pengaturan)

Nilai berikut disimpan di tabel `library_settings` dan diatur `OWNER` lewat menu **Setting**. Nilai awal jika pengaturan belum dibuat:

| Pengaturan                            | Nilai awal           |
| ------------------------------------- | -------------------- |
| Harga sewa per hari                   | Rp 2.000             |
| Maksimal lama pinjam                  | 7 hari               |
| Maksimal peminjaman aktif per anggota | 3                    |
| Denda keterlambatan per hari          | Rp 1.000             |
| Kompensasi buku rusak                 | 50% dari nilai buku  |
| Kompensasi buku hilang                | 100% dari nilai buku |

Perhitungan saat pengembalian:

- Denda keterlambatan = hari terlambat (dibulatkan ke atas) × denda per hari.
- Buku rusak/hilang dikenai denda kondisi = nilai buku × persentase kompensasi.
- Total tagihan = sisa piutang sewa + total denda. Uang yang diterima dialokasikan lebih dulu ke sewa, lalu ke denda; kelebihannya menjadi kembalian.

## Persiapan Lokal

### Prasyarat

- Node.js (sesuai kebutuhan Next.js 16)
- [pnpm](https://pnpm.io)
- Database PostgreSQL, disarankan [Neon](https://neon.tech)

### Instalasi

```bash
git clone https://github.com/fcodestd-io/library-management-system.git
cd library-management-system
pnpm install
```

### Environment Variables

Buat file `.env.local` di root proyek:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="isi-dengan-string-acak"
```

`AUTH_SECRET` dapat dibuat dengan `openssl rand -base64 32`.

### Setup Database

```bash
pnpm db:push        # terapkan skema ke database
pnpm db:seed        # isi data awal (lihat catatan di bawah)
```

Catatan seeding: pada `db/seed/index.ts`, `seedUsers()` saat ini dikomentari dan hanya `seedMembers()` yang aktif. Untuk membuat akun awal, hapus komentar `seedUsers()` lalu jalankan `pnpm db:seed`. Script ini membuat tiga akun:

| Email                  | Peran |
| ---------------------- | ----- |
| `owner@arunika.com`    | OWNER |
| `petugas1@arunika.com` | STAFF |
| `petugas2@arunika.com` | STAFF |

Kata sandi awal untuk semua akun adalah `password123`. **Segera ganti** setelah login pertama, terutama di lingkungan produksi.

### Menjalankan Aplikasi

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) dan login.

## Script

| Perintah           | Fungsi                                 |
| ------------------ | -------------------------------------- |
| `pnpm dev`         | Jalankan server pengembangan           |
| `pnpm build`       | Build produksi                         |
| `pnpm start`       | Jalankan hasil build                   |
| `pnpm lint`        | Cek kode dengan ESLint                 |
| `pnpm db:generate` | Buat file migrasi dari perubahan skema |
| `pnpm db:push`     | Dorong skema langsung ke database      |
| `pnpm db:studio`   | Buka Drizzle Studio                    |
| `pnpm db:seed`     | Jalankan seeding data awal             |

## Deployment

Aplikasi ini cocok dideploy ke [Vercel](https://vercel.com). Atur `DATABASE_URL` dan `AUTH_SECRET` di Environment Variables project, lalu deploy seperti proyek Next.js biasa.

## Catatan Pengembangan

Proyek ini memakai versi Next.js dengan perubahan API dan konvensi. Lihat `AGENTS.md` dan dokumentasi di `node_modules/next/dist/docs/` sebelum menulis kode baru.
