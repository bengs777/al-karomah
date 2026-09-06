require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedTable(file, table) {
  const dataPath = path.join(__dirname, file);
  if (!fs.existsSync(dataPath)) {
    console.log('SKIP: ' + file + ' not found');
    return;
  }
  const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log('Seeding ' + items.length + ' rows into ' + table + '...');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { error } = await supabase.from(table).upsert(item, { onConflict: 'slug' });
    if (error) {
      console.error('  [' + (i+1) + '/' + items.length + '] FAIL ' + (item.title || item.name) + ': ' + error.message);
    } else {
      console.log('  [' + (i+1) + '/' + items.length + '] OK   ' + (item.title || item.name));
    }
  }
  console.log('Done seeding ' + table);
}

async function main() {
  const target = process.argv[2] || 'all';
  if (target === 'all' || target === 'sunnah') await seedTable('sunnah-data.json', 'sunnah_articles');
  if (target === 'all' || target === 'articles') await seedTable('articles-data.json', 'articles');
  if (target === 'all' || target === 'activities') await seedTable('activities-data.json', 'activities');
  if (target === 'all' || target === 'social') await seedTable('social-data.json', 'social_links');
  if (target === 'all' || target === 'qris') {
    const { error } = await supabase.from('qris_settings').upsert([{ merchant_name: 'Masjid Al Karomah', qris_static_url: '/images/qris-placeholder.svg', is_active: true }], { onConflict: 'id' });
    if (!error) console.log('QRIS settings inserted');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
