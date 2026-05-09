// ============================================
// SERVER SETUP - WEBSITE MASJID AL KAROMAH
// ============================================

const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const session = require('express-session');
require('dotenv').config();
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const db = require('./database/init');
const fs = require('fs');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure certificates directory exists
const certificatesDir = path.join(__dirname, 'public', 'certificates');
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

// ============ MIDDLEWARE ============

// CORS
app.use(cors());

// Session middleware (for admin login)
app.use(session({
  secret: process.env.SESSION_SECRET || 'alkaromah-admin-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Clerk Authentication
try {
  app.use(clerkMiddleware());
} catch (e) {
  console.log('Clerk middleware not loaded (using session auth only)');
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin/assets', express.static(path.join(__dirname, 'admin/assets')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ============ SESSION-BASED ADMIN AUTH ============

// Middleware: check if admin is logged in via session
function requireSessionAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  // If AJAX/API request, return 401
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized - Silakan login terlebih dahulu' });
  }
  res.redirect('/admin/login');
}

// Try Clerk admin, fallback to session admin
function requireAdmin(req, res, next) {
  // Check session first (local admin login)
  if (req.session && req.session.adminId) {
    return next();
  }
  // Fallback: check Clerk auth
  if (req.auth && req.auth.userId) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const userEmail = req.auth.email?.toLowerCase() || '';
    if (adminEmails.includes(userEmail)) {
      return next();
    }
  }
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.redirect('/admin/login');
}

// Admin login page (GET)
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'admin/views/login.html'));
});

// Admin login (POST)
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username dan password wajib diisi' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ? AND role = ?',
    [username, password, 'admin'],
    (err, row) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
      }
      if (!row) {
        return res.status(401).json({ status: 'error', message: 'Username atau password salah' });
      }
      req.session.adminId = row.id;
      req.session.adminUsername = row.username;
      req.session.adminEmail = row.email;
      res.json({ status: 'success', message: 'Login berhasil', redirect: '/admin' });
    }
  );
});

// Admin logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ============ ADMIN ROUTES (Session-protected) ============

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/dashboard.html'));
});

app.get('/admin/requests', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/requests.html'));
});

app.get('/admin/articles', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/articles.html'));
});

app.get('/admin/activities', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/activities.html'));
});

app.get('/admin/donations', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/donations.html'));
});

app.get('/admin/services', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/services.html'));
});

app.get('/admin/gallery', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/gallery.html'));
});

app.get('/admin/contacts', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/contacts.html'));
});

app.get('/admin/users', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/users.html'));
});

app.get('/admin/settings', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/views/settings.html'));
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

// User info endpoint
app.get('/api/user/me', requireAuth(), (req, res) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(req.auth.email?.toLowerCase() || '');
  res.json({
    userId: req.auth.userId,
    email: req.auth.email,
    firstName: req.auth.firstName,
    lastName: req.auth.lastName,
    isAdmin
  });
});

// ============ USER ROUTES (Protected) ============

// User Dashboard
app.get('/dashboard', requireAuth(), (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

// Service Request page
app.get('/request/sertifikat-kurban', requireAuth(), (req, res) => {
  res.sendFile(path.join(__dirname, 'public/request/sertifikat-kurban.html'));
});

// Get single user request
app.get('/api/user/requests/:id', requireAuth(), (req, res) => {
  const userId = req.auth.userId;
  const id = req.params.id;
  
  db.get(
    `SELECT * FROM service_requests WHERE id = ? AND clerk_user_id = ?`,
    [id, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Request not found' });
      }
      res.json({ data: row });
    }
  );
});

// Submit new request
app.post('/api/user/request-sertifikat', requireAuth(), upload.single('payment_proof'), (req, res) => {
  const userId = req.auth.userId;
  const {
    name,
    whatsapp,
    address,
    qurban_name,
    animal_type,
    portion_count,
    qurban_year,
    behalf_of,
    notes
  } = req.body;

  // Validate required fields
  if (!name || !qurban_name || !animal_type || !portion_count || !qurban_year) {
    return res.status(400).json({ 
      error: 'Data tidak lengkap. Nama, nama qurban, jenis hewan, jumlah bagian, dan tahun wajib diisi.' 
    });
  }

  const paymentProofPath = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    `INSERT INTO service_requests (
      clerk_user_id, service_type, name, whatsapp, address, qurban_name, 
      animal_type, portion_count, qurban_year, behalf_of, notes, payment_proof, status
    ) VALUES (?, 'sertifikat_kurban', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      userId, name, whatsapp, address, qurban_name, animal_type,
      portion_count, qurban_year, behalf_of, notes, paymentProofPath
    ],
    function(err) {
      if (err) {
        console.error('Error inserting request:', err);
        return res.status(500).json({ error: 'Gagal menyimpan permintaan' });
      }
      res.json({ 
        message: 'Permintaan sertifikat berhasil dikirim', 
        requestId: this.lastID 
      });
    }
  );
});

// Get all user service requests
app.get('/api/user/requests', requireAuth(), (req, res) => {
  const userId = req.auth.userId;
  db.all(
    `SELECT * FROM service_requests WHERE clerk_user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    }
  );
});

// Download certificate
app.get('/api/user/certificate/:id/download', requireAuth(), (req, res) => {
  const userId = req.auth.userId;
  const requestId = req.params.id;

  // Verify ownership and status
  db.get(
    `SELECT sc.*, sr.status FROM qurban_certificates sc 
     JOIN service_requests sr ON sc.request_id = sr.id 
     WHERE sc.id = ? AND sr.clerk_user_id = ?`,
    [requestId, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Sertifikat tidak ditemukan' });
      }
      if (row.status !== 'issued') {
        return res.status(400).json({ error: 'Sertifikat belum diterbitkan' });
      }

      // Send PDF file
      const pdfPath = path.join(__dirname, row.certificate_pdf_url);
      res.download(pdfPath, `Sertifikat_Kurban_${row.certificate_number}.pdf`);
    }
  );
});

// ============ ADMIN ROUTES (Protected) ============

// Get all service requests (admin)
app.get('/api/admin/requests', requireAdmin, (req, res) => {
  db.all(
    `SELECT * FROM service_requests ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    }
  );
});

// Get single request detail (admin)
app.get('/api/admin/requests/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  db.get(
    `SELECT * FROM service_requests WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Request not found' });
      }
      res.json({ data: row });
    }
  );
});

// Approve request
app.post('/api/admin/requests/:id/approve', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { admin_note } = req.body;

  db.run(
    `UPDATE service_requests SET status = 'verified', admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [admin_note, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Permintaan diverifikasi' });
    }
  );
});

// Reject request
app.post('/api/admin/requests/:id/reject', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { admin_note } = req.body;

  db.run(
    `UPDATE service_requests SET status = 'rejected', admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [admin_note, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Permintaan ditolak' });
    }
  );
});

// Issue certificate (generate PDF)
app.post('/api/admin/requests/:id/issue', requireAdmin, (req, res) => {
  const id = req.params.id;
  
  // Get request data
  db.get(
    `SELECT * FROM service_requests WHERE id = ? AND status = 'verified'`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(400).json({ error: 'Request not found or not verified' });
      }

      // Generate certificate number
      const certificateNumber = `QURBAN-${new Date().getFullYear()}-${String(row.id).padStart(5, '0')}`;
      
      // Generate PDF (simple HTML-based PDF - implementation will use puppeteer or similar)
      // For now, we'll create a placeholder and in production integrate with PDF library
      const pdfFilename = `certificate_${certificateNumber}.pdf`;
      const pdfPath = path.join(__dirname, 'public', 'certificates', pdfFilename);
      
      // Create certificates directory if not exists
      const certDir = path.join(__dirname, 'public', 'certificates');
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }

      // Insert certificate record
      db.run(
        `INSERT INTO qurban_certificates 
         (request_id, clerk_user_id, certificate_number, qurban_name, animal_type, 
          portion_count, qurban_year, behalf_of, certificate_pdf_url, issued_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, row.clerk_user_id, certificateNumber, row.qurban_name, row.animal_type,
          row.portion_count, row.qurban_year, row.behalf_of, 
          `/certificates/${pdfFilename}`, new Date().toISOString()
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Update request status to issued
          db.run(
            `UPDATE service_requests SET status = 'issued', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [id],
            (err) => {
              if (err) console.error('Error updating request status:', err);
            }
          );

          // TODO: Generate actual PDF using puppeteer/pdfkit
          // For now, create a simple text file as placeholder
          const pdfContent = `
MASJID AL KAROMAH
Sertifikat Kurban

Nomor Sertifikat: ${certificateNumber}

Diberikan kepada:
${row.qurban_name}

Jenis Hewan: ${row.animal_type}
Jumlah Bagian: ${row.portion_count}
Tahun Kurban: ${row.qurban_year}
Atas Nama: ${row.behalf_of || 'Pribadi'}

Tanggal Penerbitan: ${new Date().toLocaleDateString('id-ID')}

_____________________
Ketua DKM Masjid Al Karomah
          `.trim();

          fs.writeFileSync(pdfPath, pdfContent);

          res.json({ 
            message: 'Sertifikat berhasil diterbitkan',
            certificateNumber,
            downloadUrl: `/api/user/certificate/${id}/download`
          });
        }
      );
    }
  );
});

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

// Get services from DB (public)
app.get('/api/services', (req, res) => {
  db.all(`SELECT * FROM services WHERE status = 'active' ORDER BY id ASC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Submit contact form
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Data tidak lengkap'
    });
  }
  
  db.run(
    `INSERT INTO contacts (name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, 'unread')`,
    [name, email, phone || null, subject || null, message],
    (err) => {
      if (err) {
        console.error('Error saving contact:', err);
        return res.status(500).json({ status: 'error', message: 'Gagal menyimpan pesan' });
      }
      res.json({
        status: 'success',
        message: 'Pesan Anda telah diterima. Kami akan segera menghubungi Anda.'
      });
    }
  );
});
// Submit donation
app.post('/api/donations', (req, res) => {
  const { donor_name, donor_email, donor_phone, amount, program, method, note } = req.body;

  if (!donor_name || !amount || !program) {
    return res.status(400).json({ status: 'error', message: 'Data donasi tidak lengkap' });
  }

  db.run(
    `INSERT INTO donations (donor_name, donor_email, donor_phone, amount, program, method, status, note)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [donor_name, donor_email || null, donor_phone || null, amount, program, method || null, note || null],
    (err) => {
      if (err) {
        console.error('Error saving donation:', err);
        return res.status(500).json({ status: 'error', message: 'Gagal menyimpan donasi' });
      }
      res.json({ status: 'success', message: 'Terima kasih atas donasi Anda. Konfirmasi akan dikirim via WhatsApp.' });
    }
  );
});

// Get activities from DB
app.get('/api/activities', (req, res) => {
  db.all(`SELECT * FROM activities WHERE status = 'active' ORDER BY date ASC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Get articles from DB
app.get('/api/articles', (req, res) => {
  db.all(`SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Get gallery from DB
app.get('/api/gallery', (req, res) => {
  db.all(`SELECT * FROM gallery ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Get contacts (admin)
app.get('/api/admin/contacts', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM contacts ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Get donations (admin)
app.get('/api/admin/donations', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM donations ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// ============ ADMIN CRUD API ============

// Articles CRUD
app.get('/api/admin/articles', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM articles ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

app.post('/api/admin/articles', requireAdmin, (req, res) => {
  const { title, slug, content, category, author, featured_image, status } = req.body;
  if (!title || !slug || !content) {
    return res.status(400).json({ status: 'error', message: 'Data artikel tidak lengkap' });
  }
  db.run(
    `INSERT INTO articles (title, slug, content, category, author, featured_image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, content, category || null, author || null, featured_image || null, status || 'draft'],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Artikel disimpan', id: this.lastID });
    }
  );
});

app.put('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const { title, slug, content, category, author, featured_image, status } = req.body;
  db.run(
    `UPDATE articles SET title = ?, slug = ?, content = ?, category = ?, author = ?, featured_image = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, slug, content, category || null, author || null, featured_image || null, status || 'draft', req.params.id],
    (err) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Artikel diperbarui' });
    }
  );
});

app.delete('/api/admin/articles/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM articles WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Artikel dihapus' });
  });
});

// Activities CRUD
app.get('/api/admin/activities', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM activities ORDER BY date ASC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

app.post('/api/admin/activities', requireAdmin, (req, res) => {
  const { title, description, category, date, time, location, speaker, image, status } = req.body;
  if (!title || !date || !time) {
    return res.status(400).json({ status: 'error', message: 'Data kegiatan tidak lengkap' });
  }
  db.run(
    `INSERT INTO activities (title, description, category, date, time, location, speaker, image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, category || null, date, time, location || null, speaker || null, image || null, status || 'active'],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Kegiatan disimpan', id: this.lastID });
    }
  );
});

app.put('/api/admin/activities/:id', requireAdmin, (req, res) => {
  const { title, description, category, date, time, location, speaker, image, status } = req.body;
  db.run(
    `UPDATE activities SET title = ?, description = ?, category = ?, date = ?, time = ?, location = ?, speaker = ?, image = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, description || null, category || null, date, time, location || null, speaker || null, image || null, status || 'active', req.params.id],
    (err) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Kegiatan diperbarui' });
    }
  );
});

app.delete('/api/admin/activities/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM activities WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Kegiatan dihapus' });
  });
});

// Services CRUD
app.get('/api/admin/services', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM services ORDER BY id ASC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

app.post('/api/admin/services', requireAdmin, (req, res) => {
  const { name, description, icon, status } = req.body;
  if (!name) {
    return res.status(400).json({ status: 'error', message: 'Nama layanan wajib diisi' });
  }
  db.run(
    `INSERT INTO services (name, description, icon, status) VALUES (?, ?, ?, ?)`,
    [name, description || null, icon || null, status || 'active'],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Layanan disimpan', id: this.lastID });
    }
  );
});

app.put('/api/admin/services/:id', requireAdmin, (req, res) => {
  const { name, description, icon, status } = req.body;
  db.run(
    `UPDATE services SET name = ?, description = ?, icon = ?, status = ? WHERE id = ?`,
    [name, description || null, icon || null, status || 'active', req.params.id],
    (err) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Layanan diperbarui' });
    }
  );
});

app.delete('/api/admin/services/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM services WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Layanan dihapus' });
  });
});

// Gallery CRUD
app.get('/api/admin/gallery', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM gallery ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

app.post('/api/admin/gallery', requireAdmin, (req, res) => {
  const { title, description, image_path, category, type } = req.body;
  if (!title || !image_path) {
    return res.status(400).json({ status: 'error', message: 'Data galeri tidak lengkap' });
  }
  db.run(
    `INSERT INTO gallery (title, description, image_path, category, type) VALUES (?, ?, ?, ?, ?)`,
    [title, description || null, image_path, category || null, type || 'photo'],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Galeri disimpan', id: this.lastID });
    }
  );
});

app.delete('/api/admin/gallery/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM gallery WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Galeri dihapus' });
  });
});

// Contacts management
app.put('/api/admin/contacts/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  db.run(
    `UPDATE contacts SET status = ? WHERE id = ?`,
    [status || 'read', req.params.id],
    (err) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Kontak diperbarui' });
    }
  );
});

app.delete('/api/admin/contacts/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM contacts WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Kontak dihapus' });
  });
});

// Donations management
app.put('/api/admin/donations/:id', requireAdmin, (req, res) => {
  const { status, note } = req.body;
  db.run(
    `UPDATE donations SET status = ?, note = ? WHERE id = ?`,
    [status || 'pending', note || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Donasi diperbarui' });
    }
  );
});

app.delete('/api/admin/donations/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM donations WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Donasi dihapus' });
  });
});

// Users management (read-only from Clerk, but we can manage admin status via settings)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM users ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Settings
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM settings`, (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: rows });
  });
});

app.put('/api/admin/settings/:key', requireAdmin, (req, res) => {
  const { value } = req.body;
  db.run(
    `UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?`,
    [value, req.params.key],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Pengaturan disimpan' });
    }
  );
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

// Export the Express app for Vercel serverless
module.exports = app;

// Only start standalone server when not on Vercel and not being imported
if (require.main === module && process.env.VERCEL !== '1') {
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
}