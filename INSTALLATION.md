# INSTALLATION & SETUP GUIDE - Website Masjid Al Karomah

## 📋 Prasyarat Sistem

- **Node.js** v14 atau lebih tinggi
- **NPM** v6 atau lebih tinggi
- **SQLite3** (included dengan Node.js)
- Browser modern (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Clone atau Download Project
```bash
# Jika menggunakan git
git clone <repository-url>
cd masjid-al-karomah

# Atau jika sudah di-download
cd path/to/masjid-al-karomah
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment File
```bash
cp .env.example .env
```

Edit file `.env` sesuai kebutuhan Anda:
```env
PORT=3000
NODE_ENV=development
DB_PATH=./database/masjid.db
ADMIN_EMAIL=admin@alkaromah.com
ADMIN_PASSWORD=admin123
```

### 4. Inisialisasi Database
```bash
node database/init.js
```

Atau jika sudah ada npm script:
```bash
npm run db:init
```

### 5. Jalankan Server
```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📁 Struktur Project

```
masjid-al-karomah/
├── public/                    # Frontend assets
│   ├── css/                  # Stylesheets
│   │   ├── style.css        # Global styles
│   │   └── components.css   # Component styles
│   ├── js/                   # JavaScript
│   │   └── utils.js         # Utility functions
│   ├── images/              # Image assets
│   └── *.html               # Halaman frontend
│
├── admin/                     # Admin panel
│   ├── assets/
│   │   ├── css/
│   │   │   └── admin.css
│   │   └── js/
│   └── views/
│       └── dashboard.html
│
├── src/                       # Backend source
│   ├── controllers/          # Business logic
│   ├── routes/              # API routes
│   ├── models/              # Database models
│   └── config/              # Configuration
│
├── database/                  # Database files
│   ├── init.js              # Database initialization
│   └── masjid.db            # SQLite database
│
├── server.js                 # Entry point
├── package.json             # Dependencies
├── .env.example             # Environment template
└── README.md                # Documentation
```

## 🎨 Design System

### Warna Utama
- **Primary (Hijau Emerald)**: `#10b981`
- **Secondary (Gold)**: `#f59e0b`
- **Dark**: `#1f2937`
- **Gray**: `#6b7280`
- **White**: `#ffffff`

### Font
- **Sans Serif**: Inter, Segoe UI, System font stack
- **Serif**: Lora, Georgia
- **Display**: Poppins, Inter

### Spacing Unit
- Base: 4px
- Digunakan dalam kelipatan: 4px, 8px, 12px, 16px, 24px, dll

## 📖 Halaman Utama

| Halaman | URL | Deskripsi |
|---------|-----|-----------|
| Beranda | `/` | Halaman utama dengan hero section |
| Profil | `/profil` | Info tentang masjid |
| Jadwal Sholat | `/jadwal-sholat` | Jadwal sholat harian |
| Kegiatan | `/kegiatan` | Daftar kegiatan & kajian |
| Layanan | `/layanan` | Layanan yang tersedia |
| Donasi | `/donasi` | Platform donasi online |
| Artikel | `/artikel` | Blog artikel islami |
| Media | `/media` | Galeri foto & video |
| Kontak | `/kontak` | Form kontak & info |
| Admin | `/admin` | Dashboard admin |

## 🔐 Admin Panel

### Akses Admin
```
URL: http://localhost:3000/admin
Email: admin@alkaromah.com
Password: admin123
```

### Menu Admin
- 📊 Dashboard - Ringkasan dan statistik
- 📰 Artikel - Kelola artikel blog
- 📅 Kegiatan - Kelola kegiatan & kajian
- 💰 Donasi - Monitor donasi
- 🔧 Layanan - Kelola layanan masjid
- 🖼️ Galeri - Kelola foto & video
- 📧 Kontak - Lihat pesan masuk
- 👥 Pengguna - Kelola pengguna
- ⚙️ Pengaturan - Konfigurasi masjid

## 🛠️ API Endpoints

### Public API

#### Prayer Times
```http
GET /api/prayer-times?location=jakarta
```

Response:
```json
{
  "date": "2024-05-08",
  "location": "Majalengka",
  "times": {
    "subuh": "03:45",
    "dzuhur": "12:15",
    "ashar": "15:45",
    "maghrib": "18:30",
    "isya": "19:50",
    "jumat": "13:00"
  }
}
```

#### Activities
```http
GET /api/activities?category=kajian&limit=10
```

#### Submit Contact
```http
POST /api/contact
Content-Type: application/json

{
  "name": "Nama Anda",
  "email": "email@example.com",
  "phone": "08xx xxxx xxxx",
  "subject": "Pertanyaan",
  "message": "Pesan Anda"
}
```

#### Submit Donation
```http
POST /api/donations
Content-Type: application/json

{
  "name": "Nama Donatur",
  "email": "email@example.com",
  "amount": 500000,
  "program": "operasional",
  "method": "transfer"
}
```

## 📝 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT,
  created_at DATETIME
);
```

### Activities Table
```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY,
  title TEXT,
  description TEXT,
  category TEXT,
  date TEXT,
  time TEXT,
  location TEXT,
  speaker TEXT,
  image TEXT,
  status TEXT,
  created_at DATETIME
);
```

### Articles Table
```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  title TEXT,
  slug TEXT UNIQUE,
  content TEXT,
  category TEXT,
  author TEXT,
  featured_image TEXT,
  status TEXT,
  views INTEGER,
  created_at DATETIME
);
```

### Donations Table
```sql
CREATE TABLE donations (
  id INTEGER PRIMARY KEY,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  amount REAL,
  program TEXT,
  method TEXT,
  status TEXT,
  note TEXT,
  created_at DATETIME
);
```

## 🔄 Development Workflow

### 1. Membuat Halaman Baru

```html
<!-- public/nama-halaman.html -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nama Halaman - Masjid Al Karomah</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/components.css">
</head>
<body>
    <!-- Navbar -->
    <!-- Content -->
    <!-- Footer -->
    
    <script src="/js/utils.js"></script>
</body>
</html>
```

### 2. Menambah Route di Server

```javascript
// server.js
app.get('/nama-halaman', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/nama-halaman.html'));
});
```

### 3. Styling Component

Gunakan CSS variables yang sudah didefinisikan di `style.css`:

```css
.my-component {
  background-color: var(--primary-dark);
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

## 🚢 Deployment

### Deploy ke Vercel

```bash
npm install -g vercel
vercel
```

### Deploy ke Heroku

```bash
heroku login
heroku create your-app-name
git push heroku main
```

### Deploy ke Server Sendiri

```bash
# 1. SSH ke server
ssh user@server.com

# 2. Clone repository
git clone <repo-url>
cd masjid-al-karomah

# 3. Install dependencies
npm install

# 4. Setup environment
cp .env.example .env
# Edit .env sesuai production

# 5. Setup database
node database/init.js

# 6. Jalankan dengan PM2 (untuk persistence)
npm install -g pm2
pm2 start server.js --name "masjid-al-karomah"
pm2 save
```

## 🐛 Troubleshooting

### Port 3000 sudah digunakan

```bash
# Ubah port di .env
PORT=3001

# Atau kill process yang menggunakan port
# Linux/Mac:
lsof -i :3000
kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database error

```bash
# Reset database
rm database/masjid.db
node database/init.js
```

### Dependency error

```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support & Contact

- **Email**: admin@alkaromah.com
- **WhatsApp**: [Nomor WhatsApp akan diupdate]
- **Website**: https://masjid-al-karomah.example.com

## 📄 License

MIT License - Bebas digunakan untuk keperluan non-komersial

---

**Dibuat dengan ❤️ untuk umat Islam**
