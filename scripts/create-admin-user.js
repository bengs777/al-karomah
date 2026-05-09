const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/masjid.db');

db.run(
  `INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
  ['admin', 'admin@alkaromah.com', 'admin123', 'admin'],
  (err) => {
    if (err) {
      console.error('Error creating admin user:', err);
    } else {
      console.log('Admin user created (if not exists)');
      console.log('Username: admin');
      console.log('Email: admin@alkaromah.com');
      console.log('Password: admin123');
    }
    db.close();
  }
);
