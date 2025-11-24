# BuildPro Backend API

Backend server untuk aplikasi BuildPro menggunakan Node.js, Express, dan MySQL.

## 🚀 Teknologi

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **CORS** - Cross-origin resource sharing

## 📦 Instalasi

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Setup Database
Pastikan MySQL (XAMPP) sudah running, kemudian jalankan:
```bash
npm run setup-db
```

Script ini akan:
- Membuat 4 tabel: `projects`, `materials`, `payments`, `event_queue`
- Insert dummy data untuk testing

### 3. Start Server
```bash
# Development mode (dengan auto-reload)
npm run dev

# Production mode
npm start
```

Server akan berjalan di: **http://localhost:5000**

## 📡 API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project

### Materials
- `GET /api/materials` - Get all materials with statistics
- `GET /api/materials/:id` - Get single material

### Payments
- `GET /api/payments` - Get all payments with summary
- `GET /api/payments?project_id=1` - Get payments by project
- `GET /api/payments/:id` - Get single payment

## 📊 Database Schema

### Table: projects
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR)
- progress (INT)
- status (VARCHAR)
- location (VARCHAR)
- contractor (VARCHAR)
- budget (DECIMAL)
- start_date (DATE)
- deadline (DATE)
- created_at (TIMESTAMP)
```

### Table: materials
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR)
- category (VARCHAR)
- stock (INT)
- unit (VARCHAR)
- price (DECIMAL)
- status (ENUM: 'In Stock', 'Low Stock')
- created_at (TIMESTAMP)
```

### Table: payments
```sql
- id (INT, PRIMARY KEY)
- project_id (INT, FOREIGN KEY)
- termin_number (INT)
- termin_name (VARCHAR)
- amount (DECIMAL)
- status (ENUM: 'Paid', 'Pending', 'Unpaid')
- date (DATE)
- created_at (TIMESTAMP)
```

### Table: event_queue
```sql
- id (INT, PRIMARY KEY)
- event_type (VARCHAR)
- payload (JSON)
- status (ENUM: 'PENDING', 'PROCESSED', 'FAILED')
- created_at (TIMESTAMP)
- processed_at (TIMESTAMP)
```

## 🔧 Konfigurasi Database

File: `db.js`

```javascript
{
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'buildpro_db'
}
```

## 🧪 Testing API

### Menggunakan cURL:
```bash
# Get all projects
curl http://localhost:5000/api/projects

# Get all materials
curl http://localhost:5000/api/materials

# Get all payments
curl http://localhost:5000/api/payments
```

### Menggunakan Browser:
- http://localhost:5000/api/projects
- http://localhost:5000/api/materials
- http://localhost:5000/api/payments

## 📝 Response Format

Semua endpoint mengembalikan JSON dengan format:
```json
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

Error response:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

## 🔄 Scripts NPM

- `npm start` - Start server
- `npm run dev` - Start dengan nodemon (auto-reload)
- `npm run setup-db` - Setup database & seeding

## 📌 Catatan

- Pastikan MySQL sudah running sebelum menjalankan server
- Database `buildpro_db` harus sudah dibuat
- Port 5000 harus tersedia
- CORS sudah dikonfigurasi untuk menerima request dari frontend React

## 🔗 Frontend Integration

Frontend React dapat mengakses API ini di:
```javascript
const API_URL = 'http://localhost:5000/api';
```
