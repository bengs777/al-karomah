// ============================================
// SERVER SETUP - WEBSITE MASJID AL KAROMAH
// ============================================

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const { clerkMiddleware, requireAuth } = require('@clerk/express');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============

// CORS
app.use(cors());

// Clerk Authentication
app.use(clerkMiddleware());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin/assets', express.static(path.join(__dirname, 'admin/assets')));

// Admin panel (protected)
app.get('/admin', requireAuth(), (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/dashboard.html'));
});

// Admin API routes (protected)
app.get('/api/admin/activities', requireAuth(), (req, res) => {
  res.json({ message: 'Admin activities data' });
});

app.get('/api/admin/donations', requireAuth(), (req, res) => {
  res.json({ message: 'Admin donations data' });
});

// ============ AUTH ROUTES ============

// Sign in page (redirects to Clerk hosted)
app.get('/signin', (req, res) => {
  const clerkDomain = process.env.CLERK_FRONTEND_API_URL?.replace('https://', '') || 'possible-kingfish-6.clerk.accounts.dev';
  const redirectUrl = `${req.protocol}://${req.get('host')}/admin`;
  res.redirect(`https://${clerkDomain}/signin?redirect_url=${encodeURIComponent(redirectUrl)}`);
});

// Sign up page (redirects to Clerk hosted)
app.get('/signup', (req, res) => {
  const clerkDomain = process.env.CLERK_FRONTEND_API_URL?.replace('https://', '') || 'possible-kingfish-6.clerk.accounts.dev';
  const redirectUrl = `${req.protocol}://${req.get('host')}/admin`;
  res.redirect(`https://${clerkDomain}/signup?redirect_url=${encodeURIComponent(redirectUrl)}`);
});

// Sign out (redirects to Clerk hosted sign out)
app.get('/signout', (req, res) => {
  const clerkDomain = process.env.CLERK_FRONTEND_API_URL?.replace('https://', '') || 'possible-kingfish-6.clerk.accounts.dev';
  const redirectUrl = `${req.protocol}://${req.get('host')}/`;
  res.redirect(`https://${clerkDomain}/signout?redirect_url=${encodeURIComponent(redirectUrl)}`);
});

// ============ PUBLIC ROUTES ============

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Halaman-halaman utama
const pages = [
  'jadwal-sholat',
  'profil',
  'kegiatan',
  'layanan',
  'donasi',
  'artikel',
  'media',
  'kontak'
];

pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    const filePath = path.join(__dirname, `public/${page}.html`);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).send(`<h1>Halaman ${page} tidak ditemukan</h1>`);
      }
    });
  });
});

// ============ API ROUTES ============

// Sample API endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Website Masjid Al Karomah API',
    version: '1.0.0'
  });
});

// Get prayer times
app.get('/api/prayer-times', (req, res) => {
  // Data sementara - nanti ambil dari database
  res.json({
    date: new Date().toISOString().split('T')[0],
    location: 'Desa Buntu, Kecamatan Ligung, Kabupaten Majalengka',
    times: {
      subuh: '03:45',
      dzuhur: '12:15',
      ashar: '15:45',
      maghrib: '18:30',
      isya: '19:50',
      jumat: '13:00'
    }
  });
});

// Get activities
app.get('/api/activities', (req, res) => {
  res.json({
    status: 'success',
    data: [
      {
        id: 1,
        title: 'Kajian Fiqih Ibadah',
        category: 'Kajian',
        date: '2024-05-10',
        time: '10:00',
        location: 'Ruang Utama',
        speaker: 'Ustadz Ahmad',
        image: '/images/kajian-1.jpg'
      }
    ]
  });
});

// Submit contact form
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  // Validasi
  if (!name || !email || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Data tidak lengkap'
    });
  }
  
  // Log ke console (nanti simpan ke database)
  console.log('Contact form submission:', {
    name,
    email,
    phone,
    subject,
    message,
    timestamp: new Date()
  });
  
  // Response
  res.json({
    status: 'success',
    message: 'Pesan Anda telah diterima. Kami akan segera menghubungi Anda.'
  });
});

// Submit donation
app.post('/api/donations', (req, res) => {
  const { name, email, amount, program, method } = req.body;
  
  if (!name || !amount || !program) {
    return res.status(400).json({
      status: 'error',
      message: 'Data donasi tidak lengkap'
    });
  }
  
  console.log('Donation submission:', {
    name,
    email,
    amount,
    program,
    method,
    timestamp: new Date()
  });
  
  res.json({
    status: 'success',
    message: 'Terima kasih atas donasi Anda. Konfirmasi akan dikirim via WhatsApp.'
  });
});

// ============ ERROR HANDLING ============

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Halaman tidak ditemukan'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server'
  });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Website Masjid Al Karomah             ║
║  Server berjalan di port: ${PORT}     ║
║  Environment: ${process.env.NODE_ENV || 'development'}          ║
║  URL: http://localhost:${PORT}              ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
