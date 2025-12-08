# 🚀 Deployment Guide - BuildPro ke Railway

## Persiapan (5 menit)

### 1. Daftar Railway
- Buka: https://railway.app
- Login dengan GitHub
- Gratis $5 credit/bulan

### 2. Install Railway CLI

**Windows (PowerShell):**
```bash
npm install -g @railway/cli
```

**Mac/Linux:**
```bash
npm install -g @railway/cli
```

---

## Deploy ke Railway (10 menit)

### Step 1: Login Railway

```bash
railway login
```

Browser akan terbuka → klik "Authorize"

### Step 2: Masuk Folder Project

```bash
cd "c:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro"
```

### Step 3: Initialize Project

```bash
# Create new Railway project
railway init

# Pilih nama project: buildpro
```

### Step 4: Deploy!

```bash
railway up
```

Railway akan:
- Detect docker-compose.yml
- Build semua services
- Deploy ke cloud

**Tunggu 5-10 menit** (pertama kali agak lama)

### Step 5: Get URL

```bash
railway domain
```

Atau buka Railway dashboard → Klik service → Get URL

---

## Konfigurasi Environment Variables

Di Railway dashboard:

1. **Pilih service** (misal: api-gateway)
2. **Variables tab**
3. **Add variables:**
   ```
   DB_HOST=db
   DB_USER=root
   DB_PASSWORD=your_secure_password
   DB_NAME=buildpro_db
   JWT_SECRET=your_jwt_secret_production
   ```

4. **Redeploy** (auto trigger)

---

## Setup Database

Railway auto-create volume untuk MySQL, tapi perlu import data:

### Option 1: Via Railway Shell

```bash
# Connect ke Railway
railway shell

# Import database
mysql -h db -u root -p buildpro_db < database/schema.sql
```

### Option 2: Manual di Railway Dashboard

1. Buka MySQL service
2. Connect tab → Get connection string
3. Use MySQL client untuk import

---

## Custom Domain (Optional)

**Di Railway Dashboard:**

1. **Settings** → **Domains**
2. **Generate Domain** → Get: `buildpro-production.up.railway.app`
3. Atau **Add Custom Domain** (kalau punya domain sendiri)

**Update Frontend:**

Di `docker-compose.yml`, update:
```yaml
environment:
  VITE_API_URL: https://buildpro-api.up.railway.app
```

Redeploy.

---

## Troubleshooting

### Service Crash / Not Starting

**Cek logs:**
```bash
railway logs
```

**Common issues:**
- Database belum ready → Tunggu 1-2 menit
- Port salah → Cek PORT environment variable
- Memory limit → Upgrade Railway plan

### Database Connection Error

**Fix:**
1. Pastikan DB_HOST = nama service database di railway
2. Cek environment variables
3. Restart services

### Out of Credit

Railway free tier = $5/month

**Monitor usage:**
- Dashboard → Usage tab
- Matikan services yang tidak dipakai
- Atau upgrade ke paid plan ($5/month unlimited)

---

## Monitoring & Maintenance

### Check Status
```bash
railway status
```

### View Logs
```bash
# All services
railway logs

# Specific service
railway logs --service api-gateway
```

### Restart Service
```bash
railway restart
```

### Update Code
```bash
# Push ke GitHub
git push

# Railway auto-deploy (kalau setup GitHub integration)
# Atau manual:
railway up
```

---

## Production Checklist

Sebelum production (untuk real users):

- [ ] Enable authentication di API Gateway
- [ ] Change JWT_SECRET ke strong random key
- [ ] Update database password
- [ ] Disable debug mode
- [ ] Setup custom domain
- [ ] Enable HTTPS (auto di Railway)
- [ ] Setup monitoring/alerts
- [ ] Backup database regularly

---

## Biaya Estimasi

**Railway Free Tier:**
- $5 credit/month
- ~500 jam execution time
- Cukup untuk 1-2 services kecil

**Railway Pro ($5/month):**
- Unlimited execution
- $0.000231/GB-hour memory
- $0.000463/vCPU-hour compute

**Estimasi BuildPro (9 services):**
- ~$10-15/month kalau running 24/7
- $2-5/month kalau hanya demo (stop when not used)

**Tips Hemat:**
- Stop services kalau tidak dipakai
- Combine services jika bisa
- Pakai free tier untuk demo/development

---

## Alternative: DigitalOcean ($6/month)

Kalau mau lebih permanent dan hemat:

1. **Create Droplet** (VM) - $6/month
2. **Install Docker**
3. **Clone repo**
4. **Run:** `docker-compose up -d`
5. **Setup Nginx** untuk reverse proxy

Full control, unlimited usage, predictable cost!

---

## Quick Commands Reference

```bash
# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Logs
railway logs

# Status
railway status

# Shell access
railway shell

# Link to project
railway link

# Open dashboard
railway open
```

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- BuildPro Issues: GitHub Issues

---

**Happy Deploying! 🚀**

Railway makes deployment easy - from local to production in minutes!
