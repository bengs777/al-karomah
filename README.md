# Website Masjid Al Karomah

Website resmi Masjid Al Karomah, Desa Buntu, Kecamatan Ligung, Kabupaten Majalengka.

## Fitur Utama

- 📱 Responsive design (desktop, tablet, mobile)
- 🕌 Informasi masjid lengkap
- 📅 Jadwal sholat real-time
- 📢 Daftar kegiatan dan kajian
- 💰 Sistem donasi online
- 📰 Blog artikel islami
- 🎥 Media center (galeri & video)
- 📧 Form kontak & layanan
- 🔐 Admin dashboard lengkap
- 🎨 Design Islamic modern profesional

## Struktur Project

```
project/
├── public/              # Frontend assets (CSS, JS, images)
├── src/
│   ├── views/          # Halaman HTML
│   ├── controllers/    # Logic backend
│   ├── routes/         # Route API
│   ├── models/         # Database models
│   └── config/         # Konfigurasi
├── admin/              # Admin panel
├── database/           # Database & seeds
├── server.js           # Entry point
└── package.json
```

## Setup & Instalasi

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

### 3. Buat Database
```bash
node database/init.js
```

### 4. Run Development Server
```bash
npm run dev
```

Akses di http://localhost:3000

## Default Credentials Admin

- Email: admin@alkaromah.com
- Password: admin123

**PENTING: Ubah password di production!**

## Halaman Utama

1. **Beranda** - Hero section, jadwal sholat, kegiatan, layanan
2. **Profil Masjid** - Sejarah, visi misi, pengurus
3. **Jadwal Sholat** - Jadwal sholat harian
4. **Kegiatan Masjid** - Daftar kajian dan acara
5. **Layanan Masjid** - Layanan yang tersedia
6. **Donasi/Infaq** - Platform donasi online
7. **Artikel** - Blog artikel islami
8. **Media Center** - Galeri foto & video
9. **Kontak** - Kontak dan form
10. **Admin Panel** - Dashboard admin

## Design

- **Warna Utama**: Hijau Emerald, Putih, Gold Lembut, Abu-abu Terang
- **Font**: Inter, Poppins, Lora (serif untuk ayat)
- **Layout**: Modern, clean, spacious
- **Responsive**: Mobile-first design

## Teknologi

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js + Express
- Database: SQLite3
- No external frontend framework untuk performa optimal

## License

MIT
# al-karomah
# al-karomah
