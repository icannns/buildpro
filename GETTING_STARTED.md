# 📖 Panduan Run BuildPro - Untuk Pemula

Panduan lengkap cara jalankan aplikasi BuildPro dari awal sampe bisa dibuka di browser.

---

## 🎯 Yang Bakal Diinstall

1. Git (untuk clone project)
2. Docker Desktop (untuk run aplikasi)
3. BuildPro (aplikasinya)

**TIDAK PERLU install Node.js, npm, Python, Java, atau Go** - semua sudah ada di dalam Docker!

---

## ⚙️ Step 1: Install Git

### **Windows:**

1. Download Git dari: https://git-scm.com/download/win
2. Jalankan installer
3. Ikuti setup wizard (next-next aja, pakai default settings)
4. Selesai!

**Cek berhasil atau tidak:**
```bash
# Buka PowerShell atau Command Prompt
git --version
# Harusnya muncul: git version 2.x.x
```

---

## 🐳 Step 2: Install Docker Desktop

### **Windows:**

1. **Download** Docker Desktop: https://www.docker.com/products/docker-desktop
2. **Install** - double click file yang didownload
3. **Restart** komputer (penting!)
4. **Buka** Docker Desktop
5. Tunggu sampai ada tulisan "Docker Desktop is running"

**Cek berhasil atau tidak:**
```bash
# Buka PowerShell
docker --version
# Harusnya muncul: Docker version 20.x.x atau lebih

docker-compose --version
# Harusnya muncul: Docker Compose version v2.x.x atau lebih
```

### **Mac:**

1. Download Docker Desktop untuk Mac
2. Drag & drop ke Applications
3. Buka Docker Desktop
4. Tunggu sampai running

### **Troubleshooting Windows:**

Kalau ada error "WSL 2 installation is incomplete":
1. Buka PowerShell **sebagai Administrator**
2. Jalankan:
   ```bash
   wsl --install
   ```
3. Restart komputer
4. Buka Docker Desktop lagi

---

## 📥 Step 3: Clone Project

1. **Buat folder** untuk project (bebas dimana aja):
   ```bash
   # Contoh buat di Desktop
   cd Desktop
   mkdir Projects
   cd Projects
   ```

2. **Clone** project dari GitHub:
   ```bash
   git clone https://github.com/icannns/buildpro.git
   ```

3. **Masuk** ke folder project:
   ```bash
   cd buildpro
   ```

**Folder structure seharusnya seperti ini:**
```
buildpro/
├── client/
├── server/
├── services/
├── database/
├── docker-compose.yml
└── ...
```

---

## 🚀 Step 4: Jalankan Aplikasi

Ini step paling mudah! Cukup 1 command:

```bash
# Pastikan sudah di dalam folder buildpro
docker-compose up -d
```

**Apa yang terjadi:**
- Docker akan download semua dependencies (pertama kali agak lama, 5-10 menit)
- Build semua container (9 services)
- Start aplikasi

**Tunggu sampai selesai** (cek di Docker Desktop, semua container harus STATUS: Running)

---

## ✅ Step 5: Buka Aplikasi di Browser

1. **Buka browser** (Chrome/Firefox/Edge)
2. **Ketik** di address bar: `http://localhost:5173`
3. **Login** dengan:
   - Email: `admin@buildpro.com`
   - Password: `123456`

**SELESAI!** Aplikasi sudah jalan! 🎉

---

## 🎮 Command yang Sering Dipakai

### **Start aplikasi:**
```bash
docker-compose up -d
```

### **Stop aplikasi:**
```bash
docker-compose down
```

### **Lihat status (running atau tidak):**
```bash
docker-compose ps
```

### **Restart kalau ada yang error:**
```bash
docker-compose restart
```

### **Lihat logs (untuk debug):**
```bash
docker-compose logs -f
```

---

## 🐛 Troubleshooting - Masalah yang Sering Muncul

### **1. Port sudah dipakai**

**Error:** "port is already allocated"

**Solusi:**
```bash
# Cari apa yang pakai port
netstat -ano | findstr :5173

# Matikan process (ganti 12345 dengan PID yang muncul)
taskkill /PID 12345 /F

# Atau restart Docker Desktop aja
```

### **2. Docker Desktop gak bisa start**

**Solusi:**
- Restart komputer
- Atau reinstall Docker Desktop

### **3. Container terus restart (crash loop)**

**Solusi:**
```bash
# Lihat error di logs
docker-compose logs [nama-service]

# Rebuild container
docker-compose build
docker-compose up -d
```

### **4. Aplikasi blank/error di browser**

**Solusi:**
```bash
# Tunggu 1-2 menit (database belum ready)
# Lalu restart
docker-compose restart

# Kalau masih error, rebuild
docker-compose down
docker-compose up -d
```

### **5. Database error / data kosong**

**Solusi:**
```bash
# Reset database (HATI-HATI: data hilang!)
docker-compose down -v
docker-compose up -d

# Tunggu 2 menit untuk database setup
```

---

## 📱 Akses dari HP/Tablet (Opsional)

Kalau mau buka aplikasi dari HP (harus 1 WiFi sama laptop):

1. **Cek IP laptop:**
   ```bash
   ipconfig
   # Cari "IPv4 Address", contoh: 192.168.1.100
   ```

2. **Di HP, buka browser:**
   ```
   http://192.168.1.100:5173
   ```

3. Login pakai email & password yang sama

---

## 🔄 Update Aplikasi (Pull Changes)

Kalau ada update baru dari developer:

```bash
# 1. Masuk folder project
cd buildpro

# 2. Pull update
git pull

# 3. Rebuild (kalau perlu)
docker-compose build

# 4. Restart
docker-compose up -d
```

---

## 💾 Backup & Restore Data

### **Backup:**
```bash
# Export database
docker exec buildpro-db mysqldump -uroot -proot buildpro_db > backup.sql
```

### **Restore:**
```bash
# Import database
docker exec -i buildpro-db mysql -uroot -proot buildpro_db < backup.sql
```

---

## 📊 Service Details (Untuk yang Penasaran)

| Service | Port | Teknologi | Fungsi |
|---------|------|-----------|--------|
| Frontend | 5173 | React + Vite | UI/Dashboard |
| API Gateway | 5000 | Node.js | Router API |
| Auth | 5004 | Node.js | Login/Register |
| Project | 5003 | Node.js | Manage Proyek |
| Material | 5002 | Python (Flask) | Manage Material |
| Budget | 5001 | Java | Manage Keuangan |
| Vendor | 5005 | Golang | Manage Vendor |
| GraphQL | 5006 | Node.js | GraphQL API |
| Database | 3307 | MySQL 8.0 | Penyimpanan Data |

---

## ❓ FAQ

**Q: Harus install Node.js/Python/Java/Go?**  
A: **TIDAK!** Semua sudah ada di Docker. Cukup install Docker aja.

**Q: Berapa lama pertama kali start?**  
A: 5-10 menit (download dependencies). Setelah itu cuma 30 detik.

**Q: Bisa offline?**  
A: Setelah pertama kali download, bisa offline. Tapi login pertama butuh internet.

**Q: Ukuran download berapa?**  
A: Sekitar 2-3 GB (termasuk Docker images).

**Q: RAM minimum?**  
A: 4 GB (recommended 8 GB).

**Q: Bisa di Linux?**  
A: Bisa! Install Docker, lalu command yang sama.

**Q: Data tersimpan dimana?**  
A: Di Docker volume. Gak akan hilang walau restart container.

**Q: Gimana kalau stuck/freeze?**  
A: Restart Docker Desktop atau `docker-compose restart`.

---

## 🆘 Butuh Bantuan?

1. Cek logs: `docker-compose logs -f`
2. Screenshot error + chat ke developer
3. Atau search di Google

---

## ✅ Checklist Setup

- [ ] Git installed
- [ ] Docker Desktop installed & running
- [ ] Project cloned (`git clone`)
- [ ] `docker-compose up -d` berhasil
- [ ] Buka `http://localhost:5173` di browser
- [ ] Login berhasil
- [ ] Lihat dashboard

**Kalau semua checklist ✅, aplikasi sudah siap dipakai!**

---

**Happy Coding! 🚀**

*Panduan ini dibuat untuk BuildPro v1.0 (Docker)*  
*Last updated: December 2024*
