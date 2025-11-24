# BuildPro Frontend - React Dashboard

Frontend aplikasi BuildPro untuk manajemen konstruksi menggunakan React, Vite, dan Ant Design.

## 🚀 Teknologi yang Digunakan

- **React 18** - Library UI
- **Vite** - Build tool yang cepat
- **Ant Design** - UI Component Framework
- **Ant Design Icons** - Icon library

## 📦 Instalasi

1. Masuk ke folder client:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

## 🏃 Menjalankan Aplikasi

### Development Mode
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000` dan otomatis membuka browser.

### Build untuk Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Struktur Folder

```
client/
├── public/           # Static assets
├── src/
│   ├── App.jsx      # Main dashboard component
│   ├── App.css      # Dashboard styles
│   ├── main.jsx     # Entry point
│   └── index.css    # Global styles
├── index.html       # HTML template
├── package.json     # Dependencies
└── vite.config.js   # Vite configuration
```

## ✨ Fitur Dashboard

- **Sidebar Navigation** - Menu navigasi yang dapat di-collapse
  - Dashboard Proyek
  - Material/Logistik
  - Keuangan

- **Project Dashboard** - Tampilan detail proyek "Renovasi Rumah Budi"
  - Informasi proyek lengkap
  - Progress tracking dengan circular dan linear progress bars
  - Statistik proyek
  - Tombol aksi (Update Progress, Lihat Detail, Download Laporan)

- **Stats Cards** - Kartu statistik untuk:
  - Total Proyek Aktif
  - Budget Terpakai
  - Material Order

## 🎨 Komponen Ant Design yang Digunakan

- Layout (Header, Sider, Content)
- Menu
- Card
- Progress (Circle & Line)
- Button
- Typography
- Space
- Tag
- Divider

## 📝 Catatan

- Aplikasi ini adalah tampilan UI/frontend saja
- Tombol "Update Progress" belum terhubung dengan backend
- Data yang ditampilkan masih berupa dummy data
- Siap untuk diintegrasikan dengan backend API

## 🔗 Integrasi Backend

Untuk menghubungkan dengan backend, Anda bisa menggunakan:
- Axios untuk HTTP requests
- React Query untuk state management
- Environment variables untuk API URL

## 👨‍💻 Development

Untuk menambahkan halaman baru atau fitur:
1. Buat komponen baru di folder `src/components/`
2. Import dan gunakan di `App.jsx`
3. Tambahkan menu baru di `menuItems` array
4. Implementasikan routing jika diperlukan (React Router)

## 📄 License

Private project untuk keperluan enterprise manajemen konstruksi.
