# 🗄️ Database Setup Guide

## Panduan Setup Database BuildPro

File ini menjelaskan cara menggunakan script `setup_db.js` untuk menginisialisasi database BuildPro dengan lengkap.

---

## 📋 Apa yang Dilakukan Script Ini?

Script `setup_db.js` akan:

1. **🗑️ DROP TABLES** - Menghapus semua tabel lama (bila ada) untuk memastikan database bersih
2. **📋 CREATE TABLES** - Membuat semua tabel yang diperlukan:
   - `users` - Tabel pengguna dengan role (Admin, Worker, Logistic, Vendor)
   - `projects` - Tabel proyek konstruksi
   - `materials` - Tabel material/inventory
   - `daily_logs` - Tabel log harian pekerjaan
   - `finance` (payment_terms) - Tabel pembayaran termin
   - `vendors` - Tabel vendor/supplier
   - `vendor_materials` - Katalog material dari vendor
   - `purchase_orders` - Tabel pemesanan material
   - `progress_history` - Riwayat progress untuk S-Curve
   - `event_queue` - Antrian event untuk EAI

3. **🌱 SEED DATA** - Mengisi data awal:
   - **4 User** dengan password default `123456` (di-hash dengan bcrypt)
   - **2 Project** (Villa Bali & Renovasi Rumah)
   - **4 Material** (Semen, Pasir, Besi, Batu Bata)
   - **Payment Terms** untuk setiap project
   - **2 Vendor** dengan katalog material

---

## 🚀 Cara Menggunakan

### **Option 1: Menjalankan via Docker (Recommended)**

Jika Anda menggunakan Docker, jalankan perintah berikut untuk setup database:

```bash
# 1. Pastikan Docker container sudah berjalan
docker-compose up -d db

# 2. Tunggu beberapa detik sampai MySQL siap (cek health check)
docker-compose ps

# 3. Jalankan setup script di dalam container GraphQL server
docker-compose run --rm server npm run seed
```

**Alternatif:** Jika ingin menjalankan langsung di container yang sudah berjalan:

```bash
# Masuk ke container GraphQL server
docker exec -it buildpro-graphql-server sh

# Jalankan script seeding
npm run seed

# Keluar dari container
exit
```

### **Option 2: Menjalankan Secara Lokal**

Jika database MySQL Anda berjalan lokal (bukan di Docker):

```bash
# 1. Pastikan MySQL sudah berjalan di localhost

# 2. Masuk ke folder server
cd server

# 3. Install dependencies (jika belum)
npm install

# 4. Pastikan file .env sudah dikonfigurasi dengan benar
#    Contoh .env untuk local:
#    DB_HOST=localhost
#    DB_USER=root
#    DB_PASSWORD=
#    DB_NAME=buildpro_db

# 5. Jalankan script seeding
npm run seed
```

---

## 🔐 Default Login Credentials

Setelah setup berhasil, gunakan kredensial berikut untuk login:

| Role              | Email                    | Password | Keterangan           |
|-------------------|--------------------------|----------|----------------------|
| **Admin**         | admin@buildpro.com       | 123456   | Administrator        |
| **Worker**        | worker@buildpro.com      | 123456   | Pekerja Lapangan     |
| **Staff Logistic**| logistic@buildpro.com    | 123456   | Staff Logistik       |
| **Vendor**        | vendor@buildpro.com      | 123456   | Vendor/Supplier      |

> ⚠️ **PENTING:** Segera ubah password default ini setelah login pertama kali, terutama jika aplikasi akan di-deploy ke production!

---

## 📦 Data yang Di-seed

### 👥 Users (4 users)
- Admin Utama (admin@buildpro.com)
- Budi Tukang (worker@buildpro.com)
- Siti Logistik (logistic@buildpro.com)
- Vendor Toko Bangunan (vendor@buildpro.com)

### 🏗️ Projects (2 projects)
1. **Pembangunan Villa Bali**
   - Lokasi: Ubud, Bali
   - Budget: Rp 1.500.000.000
   - Periode: Jan 2025 - Des 2025

2. **Renovasi Rumah Budi**
   - Lokasi: Jakarta Selatan
   - Budget: Rp 500.000.000
   - Periode: Feb 2025 - Okt 2025

### 📦 Materials (4 items)
- Semen Portland (100 sak @ Rp 85.000)
- Pasir Beton (50 m³ @ Rp 300.000)
- Besi Beton 10mm (200 batang @ Rp 65.000)
- Batu Bata Merah (5000 pcs @ Rp 900)

### 💰 Payment Terms
Setiap project memiliki 4 termin pembayaran:
- Down Payment (DP) - 20% - **Paid**
- Termin 1 - 30% - Unpaid
- Termin 2 - 30% - Unpaid
- Pelunasan/Retensi - 20% - Unpaid

### 🏪 Vendors (2 vendors)
1. Toko Bangunan Maju
2. PT Material Prima

---

## ⚠️ Troubleshooting

### Error: "Access denied for user"
**Solusi:** Periksa kredensial database di file `.env`:
```env
DB_HOST=db          # atau 'localhost' jika lokal
DB_USER=root
DB_PASSWORD=root    # sesuaikan dengan password MySQL Anda
DB_NAME=buildpro_db
```

### Error: "Unknown database 'buildpro_db'"
**Solusi:** Buat database terlebih dahulu:
```sql
CREATE DATABASE buildpro_db;
```

Atau jika menggunakan Docker, pastikan container MySQL sudah berjalan:
```bash
docker-compose up -d db
docker-compose ps
```

### Error: "Table 'xxx' already exists"
**Solusi:** Script ini sudah menggunakan `DROP TABLE IF EXISTS`, jadi harusnya tidak terjadi error ini. Jika tetap terjadi, coba hapus manual semua tabel atau hapus database:
```sql
DROP DATABASE buildpro_db;
CREATE DATABASE buildpro_db;
```

Kemudian jalankan ulang script seeding.

### Error: "Cannot find module 'bcrypt'"
**Solusi:** Install dependencies terlebih dahulu:
```bash
cd server
npm install
```

---

## 🔄 Reset Database

Jika Anda ingin **reset database** dan mulai dari awal:

```bash
# Docker
docker-compose run --rm server npm run seed

# Local
cd server
npm run seed
```

Script ini akan **otomatis menghapus semua data lama** dan membuat ulang tabel dengan data seed baru.

---

## 📝 Catatan Penting

1. **Password di-hash dengan bcrypt** - Password default `123456` di-hash menggunakan bcrypt dengan salt rounds 10
2. **Foreign Keys** - Semua tabel menggunakan foreign key constraints untuk menjaga integritas data
3. **Timestamps** - Semua tabel memiliki `created_at` dan `updated_at` yang otomatis ter-update
4. **Index** - Tabel-tabel sudah dioptimasi dengan index pada kolom yang sering di-query

---

## 🎯 Next Steps

Setelah database berhasil di-setup:

1. **Test Login** - Coba login dengan salah satu akun yang telah dibuat
2. **Explore Features** - Cek semua fitur aplikasi:
   - Dashboard Project
   - Material Management
   - Finance/Payment Terms
   - Vendor Portal
   - Daily Logs
3. **Run Application** - Jalankan aplikasi lengkap:
   ```bash
   docker-compose up
   ```
   Akses aplikasi di: http://localhost:5173

---

## 📞 Support

Jika mengalami masalah, periksa:
- Log output dari script seeding (akan menampilkan error detail)
- Docker container logs: `docker-compose logs db`
- MySQL connection via: `docker exec -it buildpro-db mysql -u root -proot buildpro_db`

---

**Happy Building! 🏗️✨**
