# 🚀 Quick Start - Database Setup

## Untuk Teman Anda yang Mengalami Error "Table doesn't exist"

### ✅ Yang Sudah Dibuat:

1. **File `server/setup_db.js`** - Script lengkap untuk setup database
2. **File `server/package.json`** - Sudah ditambahkan command `npm run seed`
3. **File `DATABASE_SETUP.md`** - Dokumentasi lengkap

---

## 🎯 Cara Cepat Menjalankan (Docker):

```bash
# 1. Pastikan Docker berjalan
docker-compose up -d db

# 2. Tunggu 10 detik (MySQL startup)

# 3. Jalankan database setup
docker-compose run --rm server npm run seed

# 4. Jalankan seluruh aplikasi
docker-compose up
```

**SELESAI!** Aplikasi siap digunakan di http://localhost:5173

---

## 🔐 Login Credentials (Default):

| Email                  | Password | Role      |
|------------------------|----------|-----------|
| admin@buildpro.com     | 123456   | Admin     |
| worker@buildpro.com    | 123456   | Worker    |
| logistic@buildpro.com  | 123456   | Logistic  |
| vendor@buildpro.com    | 123456   | Vendor    |

---

## 📋 Yang Akan Dibuat Script ini:

### ✅ Tables (13 tabel):
- users
- projects
- materials
- daily_logs
- finance (payment_terms)
- vendors
- vendor_materials
- purchase_orders
- progress_history
- event_queue
- material_usage
- user_sessions

### ✅ Sample Data:
- **4 Users** (Admin, Worker, Logistic, Vendor)
- **2 Projects** (Villa Bali Rp 1.5M, Renovasi Rumah Rp 500jt)
- **4 Materials** (Semen, Pasir, Besi, Batu Bata)
- **8 Payment Terms** (4 termin per project)
- **2 Vendors** dengan katalog material

---

## ⚠️ Troubleshooting Cepat:

### Error: "Access denied"
```bash
# Cek .env di root project, pastikan:
DB_HOST=db
DB_USER=root
DB_PASSWORD=root
DB_NAME=buildpro_db
```

### Error: "Cannot find module bcrypt"
```bash
cd server
npm install
```

### Reset Database (mulai dari 0)
```bash
# Jalankan ulang seed command
docker-compose run --rm server npm run seed
```

---

## 📖 Dokumentasi Lengkap:

Lihat file **`DATABASE_SETUP.md`** untuk:
- Penjelasan detail setiap langkah
- Troubleshooting lengkap
- Cara setup manual (non-Docker)
- Daftar data yang di-seed

---

## 🎉 Setelah Setup Berhasil:

1. Akses aplikasi: http://localhost:5173
2. Login dengan salah satu akun di atas
3. Coba semua fitur:
   - Dashboard Project ✅
   - Material Management ✅
   - Finance/Payment Terms ✅
   - Vendor Portal ✅
   - Daily Logs ✅

---

**Semoga berhasil!** 🎯

Jika masih ada error, cek log Docker:
```bash
docker-compose logs server
docker-compose logs db
```
