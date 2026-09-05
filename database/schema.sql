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
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_clerk_user_id ON service_requests(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_qurban_certificates_request_id ON qurban_certificates(request_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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
