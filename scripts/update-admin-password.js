const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/masjid.db');

db.run(
  `UPDATE users SET password = ? WHERE username = ? AND role = ?`,
  ['qmzwa8awaa', 'admin', 'admin'],
  function(err) {
    if (err) {
      console.error('Error updating password:', err);
    } else {
      console.log('Password updated successfully for admin user');
      console.log('Rows affected:', this.changes);
    }
    db.close();
  }
);
