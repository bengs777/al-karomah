const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/masjid.db');

// Delete duplicate services (keep the first occurrence of each name)
db.run(`DELETE FROM services WHERE id NOT IN (SELECT MIN(id) FROM services GROUP BY name)`, function(err) {
  if (err) console.error('Error:', err.message);
  else console.log('Cleaned duplicates. Remaining:', this.changes);
});

// Verify
db.all(`SELECT * FROM services ORDER BY id`, (err, rows) => {
  if (err) console.error(err);
  else console.log('Services:', rows.map(r => r.name).join(', '));
  db.close();
});
