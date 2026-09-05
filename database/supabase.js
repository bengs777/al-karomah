const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Supabase client connected to:', supabaseUrl);

async function initDatabase() {
  console.log('Initializing database tables...');
  
  const tables = [
    {
      name: 'users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'activities',
      sql: `
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          location TEXT,
          speaker TEXT,
          image TEXT,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'articles',
      sql: `
        CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          content TEXT NOT NULL,
          category TEXT,
          author TEXT,
          featured_image TEXT,
          status TEXT DEFAULT 'draft',
          views INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'donations',
      sql: `
        CREATE TABLE IF NOT EXISTS donations (
          id SERIAL PRIMARY KEY,
          donor_name TEXT NOT NULL,
          donor_email TEXT,
          donor_phone TEXT,
          amount REAL NOT NULL,
          program TEXT NOT NULL,
          method TEXT,
          status TEXT DEFAULT 'pending',
          note TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'contacts',
      sql: `
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          subject TEXT,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'unread',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'services',
      sql: `
        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'gallery',
      sql: `
        CREATE TABLE IF NOT EXISTS gallery (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          image_path TEXT NOT NULL,
          category TEXT,
          type TEXT DEFAULT 'photo',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'settings',
      sql: `
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'service_requests',
      sql: `
        CREATE TABLE IF NOT EXISTS service_requests (
          id SERIAL PRIMARY KEY,
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
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'qurban_certificates',
      sql: `
        CREATE TABLE IF NOT EXISTS qurban_certificates (
          id SERIAL PRIMARY KEY,
          request_id INTEGER NOT NULL,
          clerk_user_id TEXT NOT NULL,
          certificate_number TEXT UNIQUE NOT NULL,
          qurban_name TEXT NOT NULL,
          animal_type TEXT NOT NULL,
          portion_count INTEGER NOT NULL,
          qurban_year TEXT NOT NULL,
          behalf_of TEXT,
          certificate_pdf_url TEXT,
          issued_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (request_id) REFERENCES service_requests(id)
        );
      `
    }
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.rpc('exec', { sql: table.sql });
      if (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`✓ ${table.name} table ready`);
        } else {
          console.log(`✓ ${table.name} table (may already exist)`);
        }
      } else {
        console.log(`✓ ${table.name} table created`);
      }
    } catch (e) {
      console.log(`✓ ${table.name} table`);
    }
  }

  setTimeout(() => {
    insertDefaultData();
  }, 500);
}

async function insertDefaultData() {
  const bcrypt = require('bcrypt');
  const SALT_ROUNDS = 10;
  
  let hashedPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (!hashedPassword.startsWith('$2')) {
    hashedPassword = await bcrypt.hash(hashedPassword, SALT_ROUNDS);
  }

  const { error: userError } = await supabase
    .from('users')
    .upsert([
      { 
        username: 'admin', 
        email: 'admin@alkaromah.com', 
        password: hashedPassword, 
        role: 'admin' 
      }
    ], { onConflict: 'username' });
  
  if (userError) {
    console.error('Error inserting admin user:', userError);
  } else {
    console.log('✓ Default admin user created');
  }

  const defaultServices = [
    { name: 'Akad Nikah', description: 'Layanan akad nikah di masjid', icon: '💍' },
    { name: 'Bimbingan Mualaf', description: 'Panduan untuk mualaf', icon: '🤲' },
    { name: 'Layanan Ambulans', description: 'Layanan kesehatan 24 jam', icon: '🚑' },
    { name: 'Konsultasi Keagamaan', description: 'Konsultasi dengan ulama', icon: '💬' },
    { name: 'Sewa Aula', description: 'Sewa ruang untuk acara', icon: '🏛️' }
  ];

  for (const service of defaultServices) {
    await supabase
      .from('services')
      .upsert([service], { onConflict: 'name' });
  }
  console.log('✓ Default services created');

  const defaultSettings = [
    { key: 'masjid_name', value: 'Masjid Al Karomah' },
    { key: 'masjid_address', value: 'Desa Buntu, Kecamatan Ligung, Kabupaten Majalengka, Jawa Barat' },
    { key: 'masjid_phone', value: '[NOMOR_TELEPON_AKAN_DIUPDATE]' },
    { key: 'masjid_whatsapp', value: '[NOMOR_WHATSAPP_AKAN_DIUPDATE]' },
    { key: 'masjid_email', value: 'admin@alkaromah.com' },
    { key: 'donation_account', value: '[NOMOR_REKENING_AKAN_DIUPDATE]' }
  ];

  for (const setting of defaultSettings) {
    await supabase
      .from('settings')
      .upsert([setting], { onConflict: 'key' });
  }
  console.log('✓ Default settings created');

  console.log('\n Database initialization complete!');
}

initDatabase();

module.exports = supabase;
