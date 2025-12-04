# 🚀 Cara Run BuildPro - Panduan Lengkap

## 📋 Yang Diperlukan

1. **Docker Desktop** - [Download di sini](https://www.docker.com/products/docker-desktop)
2. **Git** (opsional, kalau mau clone dari GitHub)

---

## 🆕 Pertama Kali Setup (Fresh Start)

### **Option 1: Clone dari GitHub**

```bash
# 1. Clone repository
git clone https://github.com/icannns/buildpro.git
cd buildpro

# 2. Langsung jalankan!
docker-compose up -d
```

### **Option 2: Jalankan Project yang Sudah Ada**

```bash
# 1. Masuk ke folder project
cd "c:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro"

# 2. Pastikan Docker Desktop running

# 3. Jalankan semua service
docker-compose up -d
```

**Tunggu 30-60 detik** untuk semua service start.

---

## ✅ Akses Aplikasi

Setelah semua service running:

1. **Buka browser** ke: http://localhost:5173
2. **Login** dengan:
   - Email: `admin@buildpro.com`
   - Password: `123456`

**DONE!** ✅ Aplikasi sudah jalan!

---

## 🔧 Command Penting

### **Start Aplikasi**
```bash
docker-compose up -d
```

### **Stop Aplikasi**
```bash
docker-compose down
```

### **Restart Aplikasi**
```bash
docker-compose restart
```

### **Lihat Status**
```bash
docker-compose ps
```

### **Lihat Logs (Kalau Ada Error)**
```bash
# Semua service
docker-compose logs -f

# Service tertentu
docker-compose logs -f project-service
docker-compose logs -f api-gateway
```

---

## 🐛 Troubleshooting

### **Port sudah dipakai / Error "address already in use"**

**Cara 1: Stop service yang bentrok**
```bash
# Cek apa yang pakai port
netstat -ano | findstr :5173
netstat -ano | findstr :5000

# Stop process (ganti PID dengan nomor dari hasil di atas)
taskkill /PID [nomor_pid] /F
```

**Cara 2: Ganti port di docker-compose.yml**
```yaml
# Contoh ganti port 5173 jadi 3000
ports:
  - "3000:5173"  # Host:Container
```

### **Database belum ready**

Tunggu lebih lama (1-2 menit) lalu restart:
```bash
docker-compose restart project-service
docker-compose restart api-gateway
```

### **Container gagal start**

Rebuild container:
```bash
docker-compose build [nama-service]
docker-compose up -d
```

### **Data hilang / Database kosong**

Database data tersimpan di Docker volume (`buildpro_db_data`). Kalau mau reset:
```bash
# HATI-HATI: Ini hapus semua data!
docker-compose down -v
docker-compose up -d
```

---

## 📱 Akses dari HP/Tablet (Sama Network)

1. Cek IP komputer:
```bash
ipconfig
# Cari "IPv4 Address" (contoh: 192.168.1.100)
```

2. Di HP, buka browser ke:
```
http://[IP-komputer]:5173
# Contoh: http://192.168.1.100:5173
```

---

## 🔄 Update Code & Rebuild

Kalau ada perubahan code:

```bash
# 1. Pull update (kalau dari GitHub)
git pull

# 2. Rebuild service yang berubah
docker-compose build [nama-service]

# 3. Restart
docker-compose up -d
```

**Contoh rebuild semua:**
```bash
docker-compose build
docker-compose up -d
```

---

## 🛑 Matikan Aplikasi Total

```bash
# Stop semua container
docker-compose down

# Stop + hapus volume (HAPUS DATA!)
docker-compose down -v
```

---

## 📊 List Semua Service & Port

| Service | URL | Fungsi |
|---------|-----|--------|
| **Frontend** | http://localhost:5173 | Aplikasi utama |
| API Gateway | http://localhost:5000 | REST API |
| Auth Service | http://localhost:5004 | Login/Register |
| Project Service | http://localhost:5003 | Data proyek |
| Material Service | http://localhost:5002 | Data material |
| Budget Service | http://localhost:5001 | Keuangan |
| Vendor Service | http://localhost:5005 | Data vendor |
| GraphQL | http://localhost:5006/graphql | GraphQL API |
| Database | localhost:3307 | MySQL |

---

## 💡 Tips

✅ **Pakai Docker Desktop GUI** - Lebih mudah lihat status, logs, restart service  
✅ **Save bookmark** http://localhost:5173 di browser  
✅ **Matikan service lain** yang pakai port sama kalau ada error  
✅ **Restart Docker Desktop** kalau ada masalah aneh  

---

## 📞 Butuh Bantuan?

1. Cek logs: `docker-compose logs -f`
2. Restart: `docker-compose restart`
3. Rebuild: `docker-compose build && docker-compose up -d`

**Kalau masih error**, screenshot error message + kirim ke developer.

---

**Happy Coding! 🚀**
