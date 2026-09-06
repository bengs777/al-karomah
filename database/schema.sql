-- ============================================
-- SUPABASE SCHEMA - WEBSITE MASJID AL KAROMAH
-- ============================================
-- Run this SQL in Supabase SQL Editor to create all tables
-- URL: https://supabase.com/dashboard/project/ipjtywscbxjceuvxodjy/sql

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ACTIVITIES TABLE
-- ============================================
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

-- ============================================
-- 3. ARTICLES TABLE
-- ============================================
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

-- ============================================
-- 4. DONATIONS TABLE
-- ============================================
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

-- ============================================
-- 5. CONTACTS TABLE
-- ============================================
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

-- ============================================
-- 6. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. GALLERY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_path TEXT NOT NULL,
  category TEXT,
  type TEXT DEFAULT 'photo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. SERVICE REQUESTS TABLE
-- ============================================
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

-- ============================================
-- 10. QURBAN CERTIFICATES TABLE
-- ============================================
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

-- ============================================
-- 11. SOCIAL LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS social_links (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'instagram', 'facebook', 'youtube', 'tiktok', 'website')),
  url TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. SUGGESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  suggestion TEXT NOT NULL,
  type TEXT DEFAULT 'other',
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. SUNNAH ARTICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sunnah_articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fiqih_ibadah', 'akhlak', 'aqidah', 'sirah', 'muamalah')),
  subcategory TEXT,
  author TEXT DEFAULT 'Tim Masjid Al Karomah',
  featured_image TEXT,
  source_dalil TEXT,
  reading_time INTEGER DEFAULT 5,
  views INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. DONATION HISTORY (QRIS)
-- ============================================
CREATE TABLE IF NOT EXISTS donation_history (
  id SERIAL PRIMARY KEY,
  transaction_id TEXT UNIQUE,
  donor_name TEXT NOT NULL,
  donor_phone TEXT,
  donor_email TEXT,
  amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'qris',
  qris_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  program TEXT,
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 15. ZAKAT HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS zakat_history (
  id SERIAL PRIMARY KEY,
  user_email TEXT,
  user_name TEXT,
  zakat_type TEXT NOT NULL CHECK (zakat_type IN ('fitrah', 'mal', 'penghasilan')),
  calculation_data JSONB,
  total_zakat INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 16. QRIS SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS qris_settings (
  id SERIAL PRIMARY KEY,
  merchant_name TEXT DEFAULT 'Masjid Al Karomah',
  qris_static_url TEXT,
  qris_dynamic_api TEXT,
  merchant_id TEXT,
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_month ON activities(month);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_clerk_user_id ON service_requests(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_qurban_certificates_request_id ON qurban_certificates(request_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_social_links_type ON social_links(type);
CREATE INDEX IF NOT EXISTS idx_social_links_active ON social_links(is_active);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_sunnah_articles_category ON sunnah_articles(category);
CREATE INDEX IF NOT EXISTS idx_sunnah_articles_published ON sunnah_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_sunnah_articles_slug ON sunnah_articles(slug);
CREATE INDEX IF NOT EXISTS idx_donation_history_status ON donation_history(status);
CREATE INDEX IF NOT EXISTS idx_donation_history_txid ON donation_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_zakat_history_type ON zakat_history(zakat_type);

-- ============================================
-- DISABLE Row Level Security (RLS) for service role access
-- Since we use service_role key, RLS is bypassed
-- Enable RLS later if you want to add anon/authenticated user policies
-- ============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE qurban_certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sunnah_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE qris_settings DISABLE ROW LEVEL SECURITY;

-- ============================================
-- SAMPLE DATA: Sunnah Articles
-- ============================================
INSERT INTO sunnah_articles (title, slug, excerpt, content, category, subcategory, source_dalil, reading_time) VALUES
('Tata Cara Sholat Sesuai Sunnah Nabi ﷺ', 'tata-cara-sholat-sunnah', 'Pelajari langkah demi langkah sholat sesuai tuntunan Rasulullah ﷺ.', '<h2>Tata Cara Sholat</h2><p>Sholat adalah rukun Islam yang kedua. Berikut tata cara sholat sesuai sunnah Nabi Muhammad ﷺ:</p><h3>1. Takbiratul Ihram</h3><p>Berdiri tegak menghadap kiblat, angkat kedua tangan sejajar telinga atau bahu, lalu baca "Allahu Akbar".</p><h3>2. Doa Iftitah</h3><p>Membaca doa iftitah (al-Fatihah belum dibaca, baru di rakaat pertama).</p><h3>3. Al-Fatihah</h3><p>Setiap rakaat wajib membaca Al-Fatihah.</p><h3>4. Rukuk</h3><p>Bungkukkan badan dengan tangan di lutut, punggung rata.</p><h3>5. Sujud</h3><p>Sujud dengan tujuh anggota: dahi, kedua telapak tangan, kedua lutut, dan ujung kedua kaki.</p><p><em>Dalil: HR. Bukhari no. 6251 & Muslim no. 397</em></p>', 'fiqih_ibadah', 'sholat', 'HR. Bukhari no. 6251', 8),
('Keutamaan Puasa Senin Kamis', 'keutamaan-puasa-senin-kamis', 'Puasa sunnah yang sangat dicintai Allah SWT.', '<h2>Puasa Senin-Kamis</h2><p>Rasulullah ﷺ bersabda: "Amal perbuatan manusia disajikan (kepada Allah) pada hari Senin dan Kamis, maka aku ingin amalku disajikan dalam keadaan aku sedang berpuasa."</p><p><strong>Hukum:</strong> Sunnah muakkad (sangat dianjurkan).</p><p><em>Dalil: HR. Tirmidzi no. 747, hasan shahih</em></p>', 'fiqih_ibadah', 'puasa', 'HR. Tirmidzi no. 747', 4),
('Husnudzhan: Berbaik Sangka kepada Allah', 'husnudzhan-kepada-allah', 'Berbaik sangka adalah bagian dari ibadah hati yang agung.', '<h2>Husnudzhan kepada Allah</h2><p>Allah SWT berfirman: "Dan bertawakkallah kepada Allah Yang Maha Hidup lagi tidak akan mati, dan bertasbihlah dengan memuji-Nya. Dan cukuplah Dia Maha Mengetahui dosa-dosa hamba-Nya." (QS. Al-Furqan: 58)</p><p>Rasulullah ﷺ bersabda: "Bertakwalah kepada Allah di mana pun kamu berada. Iringilah keburukan dengan kebaikan, niscaya kebaikan itu akan menghapusnya. Dan pergaulilah manusia dengan akhlak yang mulia."</p>', 'akhlak', 'hati', 'QS. Al-Furqan: 58', 5),
('Rukun Iman 6 Perkara', 'rukun-iman-6-perkara', 'Penjelasan 6 rukun iman dengan dalil Al-Quran dan Hadits.', '<h2>Rukun Iman</h2><p>Iman memiliki 6 rukun:</p><ol><li>Iman kepada Allah</li><li>Iman kepada Malaikat</li><li>Iman kepada Kitab-kitab Allah</li><li>Iman kepada Rasul-rasul Allah</li><li>Iman kepada Hari Akhir</li><li>Iman kepada Qada dan Qadar</li></ol><p><em>Dalil: HR. Muslim no. 35 dari Umar bin Khattab</em></p>', 'aqidah', 'rukun-iman', 'HR. Muslim no. 35', 6),
('Sirah Nabawiyah: Masa Kenabian', 'sirah-masa-kenabian', 'Mengenal kehidupan Rasulullah ﷺ dari masa kecil hingga kenabian.', '<h2>Masa Kenabian</h2><p>Nabi Muhammad ﷺ lahir di Makkah pada tahun Gajah (570 M). Beliau diberi gelar "Al-Amin" (yang dapat dipercaya) oleh masyarakat Quraisy karena kejujurannya.</p><p>Pada usia 40 tahun, beliau menerima wahyu pertama di Gua Hira.</p>', 'sirah', 'nabawiyah', 'Sirah Ibnu Hisyam', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SAMPLE DATA: QRIS Settings
-- ============================================
INSERT INTO qris_settings (merchant_name, qris_static_url, is_active) VALUES
('Masjid Al Karomah', '/images/qris-masjid.png', true)
ON CONFLICT (id) DO NOTHING;
