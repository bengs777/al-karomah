const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/masjid.db');

// Sample activities
const activities = [
  { title: 'Kajian Fiqih Ibadah', description: 'Mempelajari hukum-hukum ibadah', category: 'Kajian', date: '2026-05-10', time: '10:00', location: 'Ruang Utama', speaker: 'Ustadz Ahmad', image: '/images/Masjid.png', status: 'active' },
  { title: 'Pengajian Ibu-Ibu', description: 'Diskusi akhlak dan keluarga', category: 'Pengajian', date: '2026-05-15', time: '14:00', location: 'Aula Perempuan', speaker: 'Ustadzah Siti', image: '/images/Masjid.png', status: 'active' },
  { title: 'Kajian Remaja', description: 'Pembahasan topik remaja', category: 'Kajian', date: '2026-05-12', time: '16:00', location: 'Ruang Remaja', speaker: 'Ustadz Rahman', image: '/images/Masjid.png', status: 'active' }
];

activities.forEach(a => {
  db.run(`INSERT OR IGNORE INTO activities (title, description, category, date, time, location, speaker, image, status) VALUES (?,?,?,?,?,?,?,?,?)`,
    [a.title, a.description, a.category, a.date, a.time, a.location, a.speaker, a.image, a.status],
    (err) => { if (err) console.error('Activity error:', err.message); else console.log('Added:', a.title); }
  );
});

// Sample articles
const articles = [
  { title: 'Hukum Puasa Bagi Musafir', slug: 'hukum-puasa-musafir', content: 'Pembahasan lengkap tentang hukum puasa bagi musafir...', category: 'Fiqih', author: 'Ustadz Ahmad', status: 'published' },
  { title: 'Pentingnya Silaturrahmi', slug: 'pentingnya-silaturrahmi', content: 'Makna dan manfaat silaturrahmi...', category: 'Akhlak', author: 'Ustadzah Siti', status: 'published' },
  { title: 'Tanggung Jawab Orang Tua', slug: 'tanggung-jawab-orang-tua', content: 'Panduan mendidik anak...', category: 'Keluarga', author: 'Ustadz Rahman', status: 'published' }
];

articles.forEach(a => {
  db.run(`INSERT OR IGNORE INTO articles (title, slug, content, category, author, status) VALUES (?,?,?,?,?,?)`,
    [a.title, a.slug, a.content, a.category, a.author, a.status],
    (err) => { if (err) console.error('Article error:', err.message); else console.log('Added:', a.title); }
  );
});

// Sample gallery
const gallery = [
  { title: 'Kajian Fiqih Jumat', description: 'Dokumentasi kajian', image_path: '/images/Masjid.png', category: 'kegiatan', type: 'photo' },
  { title: 'Tampak Depan Masjid', description: 'Foto masjid', image_path: '/images/Masjid.png', category: 'masjid', type: 'photo' }
];

gallery.forEach(g => {
  db.run(`INSERT OR IGNORE INTO gallery (title, description, image_path, category, type) VALUES (?,?,?,?,?)`,
    [g.title, g.description, g.image_path, g.category, g.type],
    (err) => { if (err) console.error('Gallery error:', err.message); else console.log('Added:', g.title); }
  );
});

// Sample services
const services = [
  { name: 'Akad Nikah', description: 'Layanan akad nikah', icon: '💍', status: 'active' },
  { name: 'Bimbingan Mualaf', description: 'Pembinaan mualaf', icon: '🤲', status: 'active' },
  { name: 'Layanan Ambulans', description: 'Ambulans 24 jam', icon: '🚑', status: 'active' }
];

services.forEach(s => {
  db.run(`INSERT OR IGNORE INTO services (name, description, icon, status) VALUES (?,?,?,?)`,
    [s.name, s.description, s.icon, s.status],
    (err) => { if (err) console.error('Service error:', err.message); else console.log('Added:', s.name); }
  );
});

setTimeout(() => {
  console.log('Sample data added!');
  db.close();
}, 1000);
