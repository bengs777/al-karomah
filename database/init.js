// ============================================
// DATABASE INITIALIZATION
// ============================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use /tmp on Vercel (filesystem is read-only except /tmp)
// For local development, use the project database directory
const isVercel = process.env.VERCEL === '1';
const DB_DIR = isVercel ? '/tmp/database' : path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'masjid.db');

// Ensure database directory exists (important for /tmp on Vercel)
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create or open database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Database connected successfully');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating users table:', err);
      else console.log('✓ Users table ready');
    });

    // Activities table
    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT,
        speaker TEXT,
        image TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating activities table:', err);
      else console.log('✓ Activities table ready');
    });

    // Articles table
    db.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        category TEXT,
        author TEXT,
        featured_image TEXT,
        status TEXT DEFAULT 'draft',
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating articles table:', err);
      else console.log('✓ Articles table ready');
    });

    // Donations table
    db.run(`
      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_name TEXT NOT NULL,
        donor_email TEXT,
        donor_phone TEXT,
        amount REAL NOT NULL,
        program TEXT NOT NULL,
        method TEXT,
        status TEXT DEFAULT 'pending',
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating donations table:', err);
      else console.log('✓ Donations table ready');
    });

    // Contact submissions table
    db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'unread',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating contacts table:', err);
      else console.log('✓ Contacts table ready');
    });

    // Services table
    db.run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating services table:', err);
      else console.log('✓ Services table ready');
    });

    // Gallery table
    db.run(`
      CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        image_path TEXT NOT NULL,
        category TEXT,
        type TEXT DEFAULT 'photo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating gallery table:', err);
      else console.log('✓ Gallery table ready');
    });

    // Settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating settings table:', err);
      else console.log('✓ Settings table ready');
    });

    // Service Requests table (for qurban certificates and other services)
    db.run(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clerk_user_id TEXT NOT NULL,
        service_type TEXT NOT NULL DEFAULT 'sertifikat_kurban',
        name TEXT NOT NULL,
        whatsapp TEXT,
        address TEXT,
        qurban_name TEXT,
        animal_type TEXT,
        portion_count INTEGER,
        qurban_year TEXT,
        behalf_of TEXT,
        notes TEXT,
        payment_proof TEXT,
        status TEXT DEFAULT 'pending',
        admin_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating service_requests table:', err);
      else console.log('✓ Service Requests table ready');
    });

    // Qurban Certificates table
    db.run(`
      CREATE TABLE IF NOT EXISTS qurban_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        clerk_user_id TEXT NOT NULL,
        certificate_number TEXT UNIQUE NOT NULL,
        qurban_name TEXT NOT NULL,
        animal_type TEXT NOT NULL,
        portion_count INTEGER NOT NULL,
        qurban_year TEXT NOT NULL,
        behalf_of TEXT,
        certificate_pdf_url TEXT,
        issued_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES service_requests(id)
      )
    `, (err) => {
      if (err) console.error('Error creating qurban_certificates table:', err);
      else console.log('✓ Qurban Certificates table ready');
    });

    setTimeout(() => {
      insertDefaultData();
    }, 500);
  });
}

// Insert default data
function insertDefaultData() {
  // Default admin user
  const adminUser = {
    username: 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@alkaromah.com',
    password: process.env.ADMIN_PASSWORD || 'admin123', // Hash this in production!
    role: 'admin'
  };

  db.run(
    'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [adminUser.username, adminUser.email, adminUser.password, adminUser.role],
    (err) => {
      if (err) console.error('Error inserting admin user:', err);
      else console.log('✓ Default admin user created');
    }
  );

  // Default services
  const services = [
    { name: 'Akad Nikah', description: 'Layanan akad nikah di masjid', icon: '💍' },
    { name: 'Bimbingan Mualaf', description: 'Panduan untuk mualaf', icon: '🤲' },
    { name: 'Layanan Ambulans', description: 'Layanan kesehatan 24 jam', icon: '🚑' },
    { name: 'Konsultasi Keagamaan', description: 'Konsultasi dengan ulama', icon: '💬' },
    { name: 'Sewa Aula', description: 'Sewa ruang untuk acara', icon: '🏛️' }
  ];

  services.forEach(service => {
    db.run(
      'INSERT OR IGNORE INTO services (name, description, icon) VALUES (?, ?, ?)',
      [service.name, service.description, service.icon],
      (err) => {
        if (!err) console.log(`✓ Service "${service.name}" created`);
      }
    );
  });

  // Default settings
  const settings = [
    { key: 'masjid_name', value: 'Masjid Al Karomah' },
    { key: 'masjid_address', value: 'Desa Buntu, Kecamatan Ligung, Kabupaten Majalengka, Jawa Barat' },
    { key: 'masjid_phone', value: '[NOMOR_TELEPON_AKAN_DIUPDATE]' },
    { key: 'masjid_whatsapp', value: '[NOMOR_WHATSAPP_AKAN_DIUPDATE]' },
    { key: 'masjid_email', value: 'admin@alkaromah.com' },
    { key: 'donation_account', value: '[NOMOR_REKENING_AKAN_DIUPDATE]' }
  ];

  settings.forEach(setting => {
    db.run(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      [setting.key, setting.value],
      (err) => {
        if (!err) console.log(`✓ Setting "${setting.key}" created`);
      }
    );
  });

  console.log('\n✅ Database initialization complete!');
  console.log('\nDefault Admin Credentials:');
  console.log('Username:', adminUser.username);
  console.log('Email:', adminUser.email);
  console.log('Password:', adminUser.password);
  console.log('\n⚠️  IMPORTANT: Change these credentials in production!\n');
}

// Export database connection
module.exports = db;
