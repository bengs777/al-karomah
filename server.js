const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const session = require('express-session');
require('dotenv').config();
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '6281234567890';
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || 'https://instagram.com/masjidalkaromah';
const FACEBOOK_URL = process.env.FACEBOOK_URL || 'https://facebook.com/groups/1131267470932783/';
const YOUTUBE_URL = process.env.YOUTUBE_URL || 'https://youtube.com/@kabarbuntu?si=Lt9rbACCLZc5M2rJ';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET is required in .env');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('Connected to Supabase:', SUPABASE_URL);

const app = express();
const PORT = process.env.PORT || 3000;

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://clerk.possible-kingfish-6.clerk.accounts.dev", "https://*.clerk.accounts.dev"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://clerk.possible-kingfish-6.clerk.accounts.dev", "https://*.clerk.accounts.dev", "https://api.clerk.com", "https://api.alquran.cloud", "https://cdn.islamic.network", "https://everyayah.com"],
      fontSrc: ["'self'", "data:"],
      frameSrc: ["'self'", "https://*.clerk.accounts.dev", "https://www.youtube.com", "https://youtube.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : 'https://yourdomain.com' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { status: 'error', message: 'Terlalu banyak permintaan' } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));

try { app.use(clerkMiddleware()); } catch (e) { console.log('Clerk middleware not loaded'); }

app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin/assets', express.static(path.join(__dirname, 'admin/assets')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function requireAdmin(req, res, next) {
  if (req.session?.adminId) return next();
  if (req.auth?.userId) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    if (adminEmails.includes(req.auth.email?.toLowerCase() || '')) return next();
  }
  if (req.xhr || req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
  res.redirect('/admin/login');
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { status: 'error', message: 'Terlalu banyak percobaan login' } });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { status: 'error', message: 'Terlalu banyak pesan' } });
const donationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3, message: { status: 'error', message: 'Terlalu banyak donasi' } });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { status: 'error', message: 'Terlalu banyak permintaan API' } });

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
const sanitize = (str) => typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : '';

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminId) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'admin/views/login.html'));
});

app.post('/admin/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ status: 'error', message: 'Username dan password wajib diisi' });

  const { data: row, error } = await supabase.from('users').select('*').eq('username', username).eq('role', 'admin').single();
  if (error || !row) return res.status(401).json({ status: 'error', message: 'Username atau password salah' });

  const match = await bcrypt.compare(password, row.password);
  if (!match) return res.status(401).json({ status: 'error', message: 'Username atau password salah' });

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
    req.session.adminId = row.id;
    req.session.adminUsername = row.username;
    req.session.adminEmail = row.email;
    res.json({ status: 'success', message: 'Login berhasil', redirect: '/admin' });
  });
});

app.get('/admin/logout', (req, res) => { req.session.destroy(); res.redirect('/admin/login'); });

const adminPages = ['dashboard', 'requests', 'articles', 'activities', 'donations', 'services', 'gallery', 'contacts', 'suggestions', 'users', 'settings'];
adminPages.forEach(page => {
  const fileName = page === 'dashboard' ? 'dashboard.html' : `${page}.html`;
  app.get(`/admin${page === 'dashboard' ? '' : '/' + page}`, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, `admin/views/${fileName}`));
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    clerkFrontendApi: process.env.CLERK_FRONTEND_API_URL || '',
    appName: 'Masjid Al Karomah', appVersion: '1.0.0'
  });
});

app.get('/signin', (req, res) => {
  const clerkDomain = (process.env.CLERK_FRONTEND_API_URL || 'https://possible-kingfish-6.clerk.accounts.dev').replace('https://', '');
  res.redirect(`https://${clerkDomain}/signin?redirect_url=${encodeURIComponent(req.protocol + '://' + req.get('host') + '/admin')}`);
});

app.get('/signup', (req, res) => {
  const clerkDomain = (process.env.CLERK_FRONTEND_API_URL || 'https://possible-kingfish-6.clerk.accounts.dev').replace('https://', '');
  res.redirect(`https://${clerkDomain}/signup?redirect_url=${encodeURIComponent(req.protocol + '://' + req.get('host') + '/admin')}`);
});

app.get('/signout', (req, res) => {
  const clerkDomain = (process.env.CLERK_FRONTEND_API_URL || 'https://possible-kingfish-6.clerk.accounts.dev').replace('https://', '');
  res.redirect(`https://${clerkDomain}/signout?redirect_url=${encodeURIComponent(req.protocol + '://' + req.get('host') + '/')}`);
});

app.get('/api/user/me', requireAuth(), (req, res) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  res.json({ userId: req.auth.userId, email: req.auth.email, firstName: req.auth.firstName, lastName: req.auth.lastName, isAdmin: adminEmails.includes(req.auth.email?.toLowerCase() || '') });
});

app.get('/dashboard', requireAuth(), (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));
app.get('/request/sertifikat-kurban', requireAuth(), (req, res) => res.sendFile(path.join(__dirname, 'public/request/sertifikat-kurban.html')));

app.get('/api/user/requests/:id', requireAuth(), async (req, res) => {
  const { data: row, error } = await supabase.from('service_requests').select('*').eq('id', req.params.id).eq('clerk_user_id', req.auth.userId).single();
  if (error || !row) return res.status(404).json({ error: 'Request not found' });
  res.json({ data: row });
});

app.get('/api/user/requests', requireAuth(), async (req, res) => {
  const { data: rows, error } = await supabase.from('service_requests').select('*').eq('clerk_user_id', req.auth.userId).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data: rows || [] });
});

app.post('/api/user/request-sertifikat', requireAuth(), upload.single('payment_proof'), async (req, res) => {
  const { name, whatsapp, address, qurban_name, animal_type, portion_count, qurban_year, behalf_of, notes } = req.body;
  if (!name || !qurban_name || !animal_type || !portion_count || !qurban_year) return res.status(400).json({ error: 'Data tidak lengkap' });

  let fileUrl = null;
  if (req.file) {
    const filePath = `${Date.now()}_${req.file.originalname}`;
    const { data, error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadErr) {
      console.error('Error uploading to Supabase:', uploadErr);
      return res.status(500).json({ error: 'Gagal upload file' });
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);
    fileUrl = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase.from('service_requests').insert([{
    clerk_user_id: req.auth.userId, service_type: 'sertifikat_kurban', name, whatsapp, address, qurban_name, animal_type, portion_count: parseInt(portion_count), qurban_year, behalf_of, notes,
    payment_proof: fileUrl, status: 'pending'
  }]).select().single();

  if (error) return res.status(500).json({ error: 'Gagal menyimpan permintaan' });
  res.json({ message: 'Permintaan sertifikat berhasil dikirim', requestId: data.id });
});

app.get('/api/user/certificate/:id/download', requireAuth(), async (req, res) => {
  const { data: cert, error } = await supabase.from('qurban_certificates').select('*, service_requests(status)').eq('id', req.params.id).eq('clerk_user_id', req.auth.userId).single();
  if (error || !cert) return res.status(404).json({ error: 'Sertifikat tidak ditemukan' });
  if (cert.service_requests?.status !== 'issued') return res.status(400).json({ error: 'Sertifikat belum diterbitkan' });
  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(cert.certificate_pdf_url);
  res.redirect(publicUrlData.publicUrl);
});

app.get('/api/admin/requests', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('service_requests').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data: rows || [] });
});

app.get('/api/admin/requests/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { data: row, error } = await supabase.from('service_requests').select('*').eq('id', req.params.id).single();
  if (error || !row) return res.status(404).json({ error: 'Request not found' });
  res.json({ data: row });
});

app.post('/api/admin/requests/:id/approve', requireAdmin, adminLimiter, async (req, res) => {
  const adminNote = req.body.admin_note?.substring(0, 500).replace(/[<>]/g, '') || null;
  const { error } = await supabase.from('service_requests').update({ status: 'verified', admin_note: adminNote, updated_at: new Date().toISOString() }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Permintaan diverifikasi' });
});

app.post('/api/admin/requests/:id/reject', requireAdmin, adminLimiter, async (req, res) => {
  const adminNote = req.body.admin_note?.substring(0, 500).replace(/[<>]/g, '') || null;
  const { error } = await supabase.from('service_requests').update({ status: 'rejected', admin_note: adminNote, updated_at: new Date().toISOString() }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Permintaan ditolak' });
});

app.post('/api/admin/requests/:id/issue', requireAdmin, adminLimiter, async (req, res) => {
  const { data: row, error } = await supabase.from('service_requests').select('*').eq('id', req.params.id).eq('status', 'verified').single();
  if (error || !row) return res.status(400).json({ error: 'Request not found or not verified' });

  const certificateNumber = `QURBAN-${new Date().getFullYear()}-${String(row.id).padStart(5, '0')}`;
  const pdfFilename = `certificate_${certificateNumber}.pdf`;
  const pdfPathInBucket = `certificates/${pdfFilename}`;

  const pdfContent = `MASJID AL KAROMAH\nSertifikat Kurban\n\nNomor Sertifikat: ${certificateNumber}\n\nDiberikan kepada: ${row.qurban_name}\n\nJenis Hewan: ${row.animal_type}\nJumlah Bagian: ${row.portion_count}\nTahun Kurban: ${row.qurban_year}\nAtas Nama: ${row.behalf_of || 'Pribadi'}\n\nTanggal Penerbitan: ${new Date().toLocaleDateString('id-ID')}\n\n_____\nKetua DKM Masjid Al Karomah`;

  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(pdfPathInBucket, Buffer.from(pdfContent), {
      contentType: 'application/pdf',
      upsert: false
    });

  if (uploadErr) {
    console.error('Error uploading PDF to Supabase:', uploadErr);
    return res.status(500).json({ error: 'Gagal menyimpan sertifikat' });
  }

  const { data: cert, certError } = await supabase.from('qurban_certificates').insert([{
    request_id: row.id, clerk_user_id: row.clerk_user_id, certificate_number: certificateNumber, qurban_name: row.qurban_name,
    animal_type: row.animal_type, portion_count: row.portion_count, qurban_year: row.qurban_year, behalf_of: row.behalf_of,
    certificate_pdf_url: pdfPathInBucket, issued_at: new Date().toISOString()
  }]).select().single();

  if (!certError) {
    await supabase.from('service_requests').update({ status: 'issued', updated_at: new Date().toISOString() }).eq('id', req.params.id);
  }

  res.json({ message: 'Sertifikat berhasil diterbitkan', certificateNumber, downloadUrl: `/api/user/certificate/${req.params.id}/download` });
});

/**
 * Validate slug format - only allows alphanumeric characters, hyphens, and underscores
 * Prevents path traversal attacks in the /artikel-sunnah/:slug endpoint
 * @param {string} slug - The slug to validate
 * @returns {boolean} - True if slug is valid, false otherwise
 */
function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

app.get('/artikel-sunnah/:slug', (req, res) => {
  const slug = req.params.slug;
  if (!validateSlug(slug)) return res.status(400).json({ error: 'Invalid slug format' });
  const filePath = path.join(__dirname, 'public/artikel-sunnah.html');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send(`<h1>Halaman tidak ditemukan</h1>`);
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
const pages = ['jadwal-sholat', 'profil', 'kegiatan', 'layanan', 'donasi', 'artikel', 'artikel-sunnah', 'zakat', 'media', 'kontak', 'saran', 'quran', 'live'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(__dirname, `public/${page}.html`), (err) => {
    if (err) res.status(404).send(`<h1>Halaman ${page} tidak ditemukan</h1>`);
  }));
});

app.get('/quran/read', (req, res) => res.sendFile(path.join(__dirname, 'public/quran/read.html'), (err) => {
  if (err) res.status(404).send('<h1>Halaman tidak ditemukan</h1>');
}));

app.get('/api/test', (req, res) => res.json({ status: 'ok', message: 'Website Masjid Al Karomah API', version: '1.0.0' }));

// ============================================
// SOCIAL LINKS & SUGGESTIONS
// ============================================
app.get('/api/social-links', async (req, res) => {
  const defaults = {
    whatsapp: { name: 'WhatsApp', type: 'whatsapp', url: `https://wa.me/${WHATSAPP_NUMBER}`, icon: '💬' },
    instagram: { name: 'Instagram', type: 'instagram', url: INSTAGRAM_URL, icon: '📷' },
    facebook: { name: 'Facebook', type: 'facebook', url: FACEBOOK_URL, icon: 'f' },
    youtube: { name: 'YouTube', type: 'youtube', url: YOUTUBE_URL, icon: '▶️' }
  };
  try {
    const { data, error } = await supabase.from('social_links').select('*').eq('is_active', true);
    if (error) throw error;
    res.json({ status: 'success', data: data || Object.values(defaults) });
  } catch (e) {
    res.json({ status: 'success', data: Object.values(defaults) });
  }
});

app.post('/api/suggestions', contactLimiter, async (req, res) => {
  const { suggestion, type, name, email } = req.body;
  if (!suggestion || suggestion.trim().length < 5) {
    return res.status(400).json({ status: 'error', message: 'Saran minimal 5 karakter' });
  }
  const cleanSuggestion = sanitize(suggestion);
  const sType = ['praise', 'question', 'complaint', 'other'].includes(type) ? type : 'other';
  const sName = sanitize(name);
  const sEmail = sanitize(email);
  if (sEmail && !emailRegex.test(sEmail)) {
    return res.status(400).json({ status: 'error', message: 'Format email tidak valid' });
  }
  try {
    const { data, error } = await supabase.from('suggestions').insert([{
      user_id: req.auth?.userId || 'guest',
      user_email: sEmail || null,
      user_name: sName || null,
      suggestion: cleanSuggestion,
      type: sType,
      status: 'unread'
    }]).select().single();
    if (error) {
      console.error('Insert suggestion error:', error);
    }
    const waText = encodeURIComponent(
      `Assalamu'alaikum,\n\n` +
      `*Saran/Masukan untuk Masjid Al Karomah*\n` +
      `Jenis: ${sType}\n` +
      `Nama: ${sName || 'Anonim'}\n` +
      `Email: ${sEmail || '-'}\n\n` +
      `Pesan:\n${cleanSuggestion}`
    ).replace(/%5Cn/g, '%0A');
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
    res.json({
      status: 'success',
      message: 'Saran berhasil dikirim',
      whatsappUrl,
      savedId: data?.id || null
    });
  } catch (e) {
    console.error('Suggestion error:', e);
    res.status(500).json({ status: 'error', message: 'Gagal mengirim saran' });
  }
});

app.get('/api/admin/suggestions', requireAdmin, adminLimiter, async (req, res) => {
  const { data, error } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: data || [] });
});

app.put('/api/admin/suggestions/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { status } = req.body;
  const { error } = await supabase.from('suggestions').update({ status: status || 'read' }).eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Status saran diperbarui' });
});

app.delete('/api/admin/suggestions/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { error } = await supabase.from('suggestions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Saran dihapus' });
});

// ============================================
// ACTIVITIES BY MONTH
// ============================================
app.get('/api/activities/monthly/:month', async (req, res) => {
  const month = req.params.month;
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ status: 'error', message: 'Format bulan tidak valid (YYYY-MM)' });
  }
  const year = parseInt(month.substring(0, 4));
  const monthNum = parseInt(month.substring(5));
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('status', 'active')
    .gte('date', `${month}-01`)
    .lte('date', `${month}-${daysInMonth}`)
    .order('date', { ascending: true });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: data || [] });
});

app.get('/api/activities/archive', async (req, res) => {
  const { data, error } = await supabase
    .from('activities')
    .select('id, title, date, category')
    .eq('status', 'active')
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  const months = {};
  (data || []).forEach(item => {
    const monthKey = item.date ? item.date.slice(0, 7) : 'unknown';
    if (!months[monthKey]) months[monthKey] = [];
    months[monthKey].push({ id: item.id, title: item.title, date: item.date, category: item.category });
  });
  res.json({ status: 'success', months });
});

app.get('/api/prayer-times', async (req, res) => {
  const city = req.query.city || 'majalengka';
  const cityCoords = {
    majalengka: { lat: -6.68, lng: 108.27 },
    cirebon: { lat: -6.73, lng: 108.55 },
    bandung: { lat: -6.90, lng: 107.61 },
    jakarta: { lat: -6.21, lng: 106.85 },
    sumedang: { lat: -6.83, lng: 107.93 },
    indramayu: { lat: -6.32, lng: 108.32 }
  };
  const coords = cityCoords[city] || cityCoords.majalengka;
  const date = new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${coords.lat}&longitude=${coords.lng}&method=2&school=1`);
    const json = await response.json();
    if (json.code === 200 && json.data && json.data.timings) {
      const t = json.data.timings;
      const locName = city.charAt(0).toUpperCase() + city.slice(1);
      res.json({
        status: 'success',
        date: json.data.date.readable,
        location: `${locName}, Indonesia`,
        gregorian: json.data.date.gregorian,
        hijri: json.data.date.hijri,
        times: {
          subuh: t.Fajr,
          dzuhur: t.Dhuhr,
          ashar: t.Asr,
          maghrib: t.Maghrib,
          isya: t.Isha,
          jumat: t.Dhuhr,
          imsak: t.Imsak,
          terbit: t.Sunrise,
          zawal: t.Sunset
        },
        source: 'Aladhan.com API'
      });
    } else {
      throw new Error('Invalid API response');
    }
  } catch (err) {
    res.json({
      status: 'fallback',
      date: date,
      location: 'Desa Buntu, Majalengka, Indonesia',
      times: { subuh: '03:45', dzuhur: '12:15', ashar: '15:45', maghrib: '18:30', isya: '19:50', jumat: '12:15', imsak: '03:35', terbit: '05:45', zawal: '12:00' }
    });
  }
});

app.get('/api/services', async (req, res) => {
  const { data: rows, error } = await supabase.from('services').select('*').eq('status', 'active').order('id', { ascending: true });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.get('/api/activities', async (req, res) => {
  const { data: rows, error } = await supabase.from('activities').select('*').eq('status', 'active').order('date', { ascending: true });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.get('/api/articles', async (req, res) => {
  const { data: rows, error } = await supabase.from('articles').select('*').eq('status', 'published').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.get('/api/gallery', async (req, res) => {
  const { data: rows, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.get('/api/live/status', async (req, res) => {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  const schedules = {
    0: { name: 'Kajian Ahad', time: 540, end: 660, streamUrl: YOUTUBE_URL },
    1: { name: 'Kajian Senin', time: 1170, end: 1290, streamUrl: YOUTUBE_URL },
    2: { name: 'Kultum Maghrib', time: 1080, end: 1140, streamUrl: YOUTUBE_URL },
    3: { name: 'Kajian Rabu', time: 1170, end: 1290, streamUrl: YOUTUBE_URL },
    4: { name: 'Kultum Maghrib', time: 1080, end: 1140, streamUrl: YOUTUBE_URL },
    5: { name: 'Kultum Maghrib + Kajian Jumat', time: 1080, end: 1260, streamUrl: YOUTUBE_URL },
    6: { name: 'Kajian Sabtu', time: 330, end: 450, streamUrl: YOUTUBE_URL }
  };
  
  const isLiveTime = schedules[day] && currentTime >= schedules[day].time && currentTime <= schedules[day].end;
  
  const { data: settings } = await supabase.from('settings').select('value').eq('key', 'live_stream_url').single();
  const customStreamUrl = settings?.value;
  
  res.json({
    isLive: isLiveTime,
    title: isLiveTime ? schedules[day].name : null,
    streamUrl: isLiveTime ? (customStreamUrl || schedules[day].streamUrl) : null,
    viewers: isLiveTime ? Math.floor(Math.random() * 50) + 10 : 0,
    schedule: schedules[day] || null
  });
});

const quranCache = { surahs: { data: null, timestamp: 0 }, surah: { 1: { data: null, timestamp: 0 } }, tafsir: { 1: { data: null, timestamp: 0 } }, timestamp: 0 };
const QURAN_CACHE_TTL = 60 * 60 * 1000;

app.get('/api/quran/surahs', async (req, res) => {
  try {
    if (quranCache.surahs.data && Date.now() - quranCache.surahs.timestamp < QURAN_CACHE_TTL) {
      return res.json({ status: 'success', data: quranCache.surahs.data, cached: true });
    }
    
    const response = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await response.json();
    
    if (data.code === 200) {
      const surahs = data.data.map(s => ({
        number: s.number,
        name: s.name,
        englishName: s.englishName,
        englishNameTranslation: s.englishNameTranslation,
        meaning: s.englishNameTranslation,
        numberOfAyahs: s.numberOfAyahs,
        revelationType: s.revelationType
      }));
      quranCache.surahs = { data: surahs, timestamp: Date.now() };
      return res.json({ status: 'success', data: surahs });
    }
    res.status(500).json({ status: 'error', message: 'Failed to load surahs' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/quran/surah/:number', async (req, res) => {
  try {
    const num = parseInt(req.params.number);
    if (isNaN(num) || num < 1 || num > 114) {
      return res.status(400).json({ status: 'error', message: 'Invalid surah number' });
    }
    
    const cacheKey = num.toString();
    const entry = quranCache.surah[cacheKey];
    if (entry && entry.timestamp && Date.now() - entry.timestamp < QURAN_CACHE_TTL) {
      return res.json({ status: 'success', data: entry.data, cached: true });
    }
    
    const [arabicRes, indoRes, metaRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${num}/quran-uthmani`),
      fetch(`https://api.alquran.cloud/v1/surah/${num}/id.indonesian`),
      fetch(`https://api.alquran.cloud/v1/surah/${num}`)
    ]);
    
    const [arabic, indo, meta] = await Promise.all([arabicRes.json(), indoRes.json(), metaRes.json()]);
    
    if (arabic.code !== 200 || indo.code !== 200) {
      return res.status(500).json({ status: 'error', message: 'Failed to load surah' });
    }
    
    const surahData = {
      number: meta.data.number,
      name: meta.data.name,
      englishName: meta.data.englishName,
      meaning: meta.data.englishNameTranslation,
      revelationType: meta.data.revelationType,
      numberOfAyahs: meta.data.numberOfAyahs,
      ayats: arabic.data.ayahs.map((a, i) => ({
        number: a.numberInSurah,
        arabic: a.text,
        translation: indo.data.ayahs[i]?.text || ''
      }))
    };
    
    quranCache.surah[cacheKey] = { data: surahData, timestamp: Date.now() };
    return res.json({ status: 'success', data: surahData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/quran/tafsir/:number', async (req, res) => {
  try {
    const num = parseInt(req.params.number);
    if (isNaN(num) || num < 1 || num > 114) {
      return res.status(400).json({ status: 'error', message: 'Invalid surah number' });
    }
    
    const cacheKey = num.toString();
    const entry = quranCache.tafsir[cacheKey];
    if (entry && entry.timestamp && Date.now() - entry.timestamp < QURAN_CACHE_TTL) {
      return res.json({ status: 'success', data: entry.data, cached: true });
    }
    
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${num}/en.maududi`);
    const data = await response.json();
    
    if (data.code === 200) {
      const tafsirMap = {};
      data.data.ayahs.forEach(a => {
        tafsirMap[a.numberInSurah] = a.text;
      });
      quranCache.tafsir[cacheKey] = { data: tafsirMap, timestamp: Date.now() };
      return res.json({ status: 'success', data: tafsirMap });
    }
    
    return res.json({ status: 'success', data: {}, note: 'Tafsir tidak tersedia untuk surah ini' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/quran/random', async (req, res) => {
  try {
    const fallback = [
      { surah: 'Al-Baqarah', ayat: 255, arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translation: 'Allah tidak ada tuhan selain Dia, Yang Maha Hidup lagi Maha Berdiri Sendiri' },
      { surah: 'Al-Ikhlas', ayat: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Katakanlah (Muhammad), Dialah Allah, Yang Maha Esa' },
      { surah: 'Ar-Rahman', ayat: 1, arabic: 'الرَّحْمَٰنُ', translation: '(Tuhan) Yang Maha Pengasih' },
      { surah: 'Al-Asr', ayat: 1, arabic: 'وَالْعَصْرِ', translation: 'Demi waktu' },
      { surah: 'Al-Nas', ayat: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Katakanlah, Aku berlindung kepada Tuhan manusia' }
    ];
    res.json({ status: 'success', data: fallback[Math.floor(Math.random() * fallback.length)] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/quran/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    if (!q) return res.json({ status: 'success', data: [] });
    
    const response = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await response.json();
    
    if (data.code === 200) {
      const results = data.data.filter(s => 
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.number.toString() === q
      ).slice(0, 20).map(s => ({
        number: s.number,
        englishName: s.englishName,
        meaning: s.englishNameTranslation,
        numberOfAyahs: s.numberOfAyahs
      }));
      return res.json({ status: 'success', data: results });
    }
    res.json({ status: 'success', data: [] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/quran/bookmark', async (req, res) => {
  try {
    const { surah, ayat, userId } = req.body;
    if (!surah || !ayat || !userId) {
      return res.status(400).json({ status: 'error', message: 'Data tidak lengkap' });
    }
    
    const { error } = await supabase.from('quran_bookmarks').insert([{
      user_id: userId,
      surah_number: surah,
      ayat_number: ayat,
      created_at: new Date().toISOString()
    }]);
    
    if (error) {
      console.error('Bookmark error:', error);
      return res.json({ status: 'success', message: 'Bookmark disimpan (offline)' });
    }
    res.json({ status: 'success', message: 'Bookmark tersimpan' });
  } catch (err) {
    res.json({ status: 'success', message: 'Bookmark disimpan (offline)' });
  }
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  const sName = sanitize(name), sEmail = sanitize(email), sSubject = sanitize(subject), sMessage = sanitize(message), sPhone = sanitize(phone);
  if (!sName || !sEmail || !sMessage) return res.status(400).json({ status: 'error', message: 'Nama, email, dan pesan wajib diisi' });
  if (!emailRegex.test(sEmail)) return res.status(400).json({ status: 'error', message: 'Format email tidak valid' });
  if (sPhone && !phoneRegex.test(sPhone)) return res.status(400).json({ status: 'error', message: 'Format nomor telepon tidak valid' });
  if (sMessage.length < 10) return res.status(400).json({ status: 'error', message: 'Pesan minimal 10 karakter' });

  const { error } = await supabase.from('contacts').insert([{ name: sName, email: sEmail, phone: sPhone || null, subject: sSubject || null, message: sMessage, status: 'unread' }]);
  if (error) return res.status(500).json({ status: 'error', message: 'Gagal menyimpan pesan' });
  res.json({ status: 'success', message: 'Pesan Anda telah diterima.' });
});

app.post('/api/donations', donationLimiter, async (req, res) => {
  const { donor_name, donor_email, donor_phone, amount, program, method, note } = req.body;
  const sName = sanitize(donor_name), sEmail = sanitize(donor_email), sPhone = sanitize(donor_phone), sNote = sanitize(note), sMethod = sanitize(method), sProgram = sanitize(program);
  if (!sName || !amount || !sProgram) return res.status(400).json({ status: 'error', message: 'Data donasi tidak lengkap' });
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ status: 'error', message: 'Nominal donasi tidak valid' });
  if (sEmail && !emailRegex.test(sEmail)) return res.status(400).json({ status: 'error', message: 'Format email tidak valid' });
  if (sPhone && !phoneRegex.test(sPhone)) return res.status(400).json({ status: 'error', message: 'Format nomor telepon tidak valid' });

  const { error } = await supabase.from('donations').insert([{ donor_name: sName, donor_email: sEmail || null, donor_phone: sPhone || null, amount: numAmount, program: sProgram, method: sMethod || null, status: 'pending', note: sNote || null }]);
  if (error) return res.status(500).json({ status: 'error', message: 'Gagal menyimpan donasi' });
  res.json({ status: 'success', message: 'Terima kasih atas donasi Anda.' });
});

app.get('/api/admin/contacts', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.get('/api/admin/donations', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.get('/api/admin/articles', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.post('/api/admin/articles', requireAdmin, async (req, res) => {
  const { title, slug, content, category, author, featured_image, status } = req.body;
  if (!title || !slug || !content) return res.status(400).json({ status: 'error', message: 'Data artikel tidak lengkap' });
  const { data, error } = await supabase.from('articles').insert([{ title, slug, content, category: category || null, author: author || null, featured_image: featured_image || null, status: status || 'draft' }]).select().single();
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Artikel disimpan', id: data.id });
});

app.put('/api/admin/articles/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { title, slug, content, category, author, featured_image, status } = req.body;
  const { error } = await supabase.from('articles').update({ title, slug, content, category: category || null, author: author || null, featured_image: featured_image || null, status: status || 'draft', updated_at: new Date().toISOString() }).eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Artikel diperbarui' });
});

app.delete('/api/admin/articles/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { error } = await supabase.from('articles').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Artikel dihapus' });
});

app.get('/api/admin/activities', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('activities').select('*').order('date', { ascending: true });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.post('/api/admin/activities', requireAdmin, adminLimiter, async (req, res) => {
  const { title, description, category, date, time, location, speaker, image, status } = req.body;
  if (!title || !date || !time) return res.status(400).json({ status: 'error', message: 'Data kegiatan tidak lengkap' });
  const { data, error } = await supabase.from('activities').insert([{ title, description: description || null, category: category || null, date, time, location: location || null, speaker: speaker || null, image: image || null, status: status || 'active' }]).select().single();
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Kegiatan disimpan', id: data.id });
});

app.put('/api/admin/activities/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { title, description, category, date, time, location, speaker, image, status } = req.body;
  const { error } = await supabase.from('activities').update({ title, description: description || null, category: category || null, date, time, location: location || null, speaker: speaker || null, image: image || null, status: status || 'active', updated_at: new Date().toISOString() }).eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Kegiatan diperbarui' });
});

app.delete('/api/admin/activities/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { error } = await supabase.from('activities').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Kegiatan dihapus' });
});

app.get('/api/admin/services', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('services').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.post('/api/admin/services', requireAdmin, async (req, res) => {
  const { name, description, icon, status } = req.body;
  if (!name) return res.status(400).json({ status: 'error', message: 'Nama layanan wajib diisi' });
  const { data, error } = await supabase.from('services').insert([{ name, description: description || null, icon: icon || null, status: status || 'active' }]).select().single();
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Layanan disimpan', id: data.id });
});

app.put('/api/admin/services/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { name, description, icon, status } = req.body;
  const { error } = await supabase.from('services').update({ name, description: description || null, icon: icon || null, status: status || 'active' }).eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Layanan diperbarui' });
});

app.delete('/api/admin/services/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { error } = await supabase.from('services').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Layanan dihapus' });
});

app.get('/api/admin/gallery', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.post('/api/admin/gallery', requireAdmin, adminLimiter, async (req, res) => {
  const { title, description, image_path, category, type } = req.body;
  if (!title || !image_path) return res.status(400).json({ status: 'error', message: 'Data galeri tidak lengkap' });
  const { data, error } = await supabase.from('gallery').insert([{ title, description: description || null, image_path, category: category || null, type: type || 'photo' }]).select().single();
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Galeri disimpan', id: data.id });
});

app.delete('/api/admin/gallery/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { error } = await supabase.from('gallery').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Galeri dihapus' });
});

app.put('/api/admin/contacts/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { error } = await supabase.from('contacts').update({ status: req.body.status || 'read' }).eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Kontak diperbarui' });
});

app.delete('/api/admin/contacts/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { error } = await supabase.from('contacts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Kontak dihapus' });
});

app.put('/api/admin/donations/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { status, note } = req.body;
  const { error } = await supabase.from('donations').update({ status: status || 'pending', note: note || null }).eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Donasi diperbarui' });
});

app.delete('/api/admin/donations/:id', requireAdmin, adminLimiter, async (req, res) => {
  const { error } = await supabase.from('donations').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Donasi dihapus' });
});

app.get('/api/admin/users', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.get('/api/admin/settings', requireAdmin, adminLimiter, async (req, res) => {
  const { data: rows, error } = await supabase.from('settings').select('*');
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: rows || [] });
});

app.put('/api/admin/settings/:key', requireAdmin, adminLimiter, async (req, res) => {
  const allowedKeys = ['masjid_name', 'masjid_address', 'masjid_phone', 'masjid_whatsapp', 'masjid_email', 'donation_account'];
  if (!allowedKeys.includes(req.params.key)) return res.status(400).json({ status: 'error', message: 'Invalid settings key' });
  const { value } = req.body;
  const { error } = await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', req.params.key);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Pengaturan disimpan' });
});

// ============================================
// ARTIKEL SUNNAH
// ============================================
app.get('/api/articles/sunnah', async (req, res) => {
  const { category, search } = req.query;
  let query = supabase.from('sunnah_articles').select('*').eq('is_published', true);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: data || [] });
});

app.get('/api/articles/sunnah/:slug', async (req, res) => {
  const { data, error } = await supabase
    .from('sunnah_articles')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('is_published', true)
    .single();

  if (error || !data) {
    return res.status(404).json({ status: 'error', message: 'Artikel tidak ditemukan' });
  }

  await supabase.from('sunnah_articles').inc({ views: 1 }).eq('id', data.id);

  res.json({ status: 'success', data });
});

app.post('/api/admin/articles/sunnah', requireAdmin, async (req, res) => {
  const { title, slug, content, category, subcategory, source_dalil, featured_image, excerpt } = req.body;
  if (!title || !slug || !content || !category) {
    return res.status(400).json({ status: 'error', message: 'Data tidak lengkap' });
  }

  const { data, error } = await supabase.from('sunnah_articles').insert([{
    title, slug, content, category, subcategory: subcategory || null,
    source_dalil: source_dalil || null, featured_image: featured_image || null,
    excerpt: excerpt || null, is_published: true
  }]).select().single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Artikel berhasil ditambahkan', id: data.id });
});

app.delete('/api/admin/articles/sunnah/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('sunnah_articles').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Artikel dihapus' });
});

// ============================================
// QRIS DONASI
// ============================================
app.get('/api/qris/info', async (req, res) => {
  const { data, error } = await supabase
    .from('qris_settings')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return res.json({
      status: 'success',
      data: {
        merchant_name: process.env.QRIS_MERCHANT_NAME || 'Masjid Al Karomah',
        qris_static_url: process.env.QRIS_IMAGE_URL || '/images/qris-masjid.png',
        is_active: true
      }
    });
  }
  res.json({ status: 'success', data });
});

app.post('/api/qris/update', requireAdmin, async (req, res) => {
  const { merchant_name, qris_static_url, is_active } = req.body;
  // Validate qris_static_url is a valid path or URL
  let validatedUrl = qris_static_url || null;
  if (qris_static_url && !/^\/|^https?:\/\//.test(qris_static_url)) {
    return res.status(400).json({ status: 'error', message: 'Invalid qris_static_url format' });
  }
  const payload = {
    merchant_name: merchant_name || 'Masjid Al Karomah',
    qris_static_url: validatedUrl,
    is_active: is_active !== false,
    updated_at: new Date().toISOString()
  };
  const { data: existing } = await supabase.from('qris_settings').select('id').single();
  let result;
  if (existing) {
    result = await supabase.from('qris_settings').update(payload).eq('id', existing.id);
  } else {
    result = await supabase.from('qris_settings').insert([payload]);
  }
  if (result.error) return res.status(500).json({ status: 'error', message: result.error.message });
  res.json({ status: 'success', message: 'Pengaturan QRIS disimpan' });
});

app.post('/api/donations/qris', donationLimiter, async (req, res) => {
  const { donor_name, donor_phone, donor_email, amount, program, notes } = req.body;

  if (!donor_name || !amount || !program) {
    return res.status(400).json({ status: 'error', message: 'Data tidak lengkap' });
  }

  const numAmount = parseInt(amount);
  if (isNaN(numAmount) || numAmount < 10000) {
    return res.status(400).json({ status: 'error', message: 'Nominal minimal Rp 10.000' });
  }

  const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

  const { data, error } = await supabase.from('donation_history').insert([{
    transaction_id: transactionId,
    donor_name: sanitize(donor_name),
    donor_phone: sanitize(donor_phone) || null,
    donor_email: sanitize(donor_email) || null,
    amount: numAmount,
    payment_method: 'qris',
    program: sanitize(program),
    notes: sanitize(notes) || null,
    status: 'pending'
  }]).select().single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });

  res.json({
    status: 'success',
    data: {
      transaction_id: transactionId,
      donation_id: data.id,
      amount: numAmount,
      message: 'Silakan scan QRIS untuk menyelesaikan pembayaran'
    }
  });
});

app.get('/api/admin/donations/qris', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('donation_history')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: data || [] });
});

app.put('/api/admin/donations/qris/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const update = { status: status || 'pending' };
  if (status === 'paid') update.paid_at = new Date().toISOString();
  const { error } = await supabase.from('donation_history').update(update).eq('id', req.params.id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', message: 'Status donasi diperbarui' });
});

// ============================================
// ZAKAT CALCULATOR
// ============================================
const NISAB_EMAS_GRAM = 85;

app.post('/api/zakat/calculate', async (req, res) => {
  const { zakat_type, payload, user_email, user_name } = req.body;

  if (!zakat_type) {
    return res.status(400).json({ status: 'error', message: 'zakat_type wajib diisi' });
  }

  let totalZakat = 0;
  let calculation = {};
  let notes = '';

  if (zakat_type === 'fitrah') {
    const { jumlah_jiwa } = payload || {};
    if (jumlah_jiwa === undefined) return res.status(400).json({ status: 'error', message: 'jumlah_jiwa wajib diisi untuk zakat fitrah' });
    const jiwa = parseInt(jumlah_jiwa) || 0;
    const harga_beras_per_kg = 15000;
    const kg_per_jiwa = 2.5;
    totalZakat = jiwa * kg_per_jiwa * harga_beras_per_kg;
    calculation = { jiwa, harga_beras_per_kg, kg_per_jiwa, totalZakat };
    notes = `Zakat fitrah untuk ${jiwa} jiwa (2.5 kg/jiwa × Rp ${harga_beras_per_kg.toLocaleString('id-ID')}/kg)`;
  } else if (zakat_type === 'mal') {
    const { saldo_tabungan, emas_perak, properti, hutang, harga_emas_per_gram } = payload || {};
    if (saldo_tabungan === undefined || emas_perak === undefined || properti === undefined || hutang === undefined || harga_emas_per_gram === undefined) {
      return res.status(400).json({ status: 'error', message: 'Field wajib tidak lengkap untuk zakat mal' });
    }
    const totalHarta = (parseInt(saldo_tabungan) || 0) +
                       (parseInt(emas_perak) || 0) +
                       (parseInt(properti) || 0);
    const hutangTotal = parseInt(hutang) || 0;
    const hartaBersih = totalHarta - hutangTotal;
    const hargaEmas = parseInt(harga_emas_per_gram) || 1300000;
    const nisab = NISAB_EMAS_GRAM * hargaEmas;
    const wajibZakat = hartaBersih >= nisab;
    if (wajibZakat) {
      totalZakat = Math.floor(hartaBersih * 0.025);
    }
    calculation = {
      totalHarta, hutangTotal, hartaBersih,
      nisab, hargaEmas, nisab_gram: NISAB_EMAS_GRAM,
      wajibZakat, totalZakat, presentase: '2.5%'
    };
    notes = wajibZakat
      ? `Harta bersih Rp ${hartaBersih.toLocaleString('id-ID')} ≥ Nisab Rp ${nisab.toLocaleString('id-ID')}, WAJIB zakat 2.5%`
      : `Harta bersih belum mencapai nisab (${NISAB_EMAS_GRAM} gram emas)`;
  } else if (zakat_type === 'penghasilan') {
    const { gaji_bulanan, penghasilan_lain, kebutuhan_pokok, harga_emas_per_gram } = payload || {};
    if (gaji_bulanan === undefined || penghasilan_lain === undefined || kebutuhan_pokok === undefined || harga_emas_per_gram === undefined) {
      return res.status(400).json({ status: 'error', message: 'Field wajib tidak lengkap untuk zakat penghasilan' });
    }
    const totalGaji = (parseInt(gaji_bulanan) || 0) + (parseInt(penghasilan_lain) || 0);
    const kebutuhan = parseInt(kebutuhan_pokok) || 0;
    const sisa = totalGaji - kebutuhan;
    const hargaEmas = parseInt(harga_emas_per_gram) || 1300000;
    const nisabBulanan = Math.floor((NISAB_EMAS_GRAM * hargaEmas) / 12);
    const wajibZakat = sisa >= nisabBulanan;
    if (wajibZakat) {
      totalZakat = Math.floor(sisa * 0.025);
    }
    calculation = {
      totalGaji, kebutuhan, sisa,
      nisabBulanan, hargaEmas,
      wajibZakat, totalZakat, presentase: '2.5%'
    };
    notes = wajibZakat
      ? `Sisa penghasilan Rp ${sisa.toLocaleString('id-ID')} ≥ Nisab bulanan Rp ${nisabBulanan.toLocaleString('id-ID')}, WAJIB zakat 2.5%`
      : `Sisa penghasilan belum mencapai nisab bulanan`;
  } else {
    return res.status(400).json({ status: 'error', message: 'jenis zakat tidak valid' });
  }

  if (user_email || user_name) {
    await supabase.from('zakat_history').insert([{
      user_email: sanitize(user_email) || null,
      user_name: sanitize(user_name) || null,
      zakat_type,
      calculation_data: calculation,
      total_zakat: totalZakat,
      notes
    }]);
  }

  res.json({
    status: 'success',
    data: { zakat_type, total_zakat: totalZakat, calculation, notes }
  });
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Endpoint tidak ditemukan' });
});
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan pada server' : err.message || 'Terjadi kesalahan tidak dikenal';
  console.error('[ERROR]', new Date().toISOString());
  console.error('URL:', req.method, req.originalUrl);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  res.status(statusCode).json({ status: 'error', message });
});

module.exports = app;

if (require.main === module && process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════╗\n║  Website Masjid Al Karomah             ║\n║  Server berjalan di port: ${PORT}     ║\n║  Database: Supabase                    ║\n╚════════════════════════════════════════╝\n`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nSIGTERM/SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Force shutdown after timeout');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
