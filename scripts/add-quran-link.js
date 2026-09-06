const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(publicDir).filter(f => 
  f.endsWith('.html') && 
  !f.startsWith('quran') && 
  !f.startsWith('admin') &&
  f !== 'live.html'
);

const QURAN_LINK = '                <li><a href="/quran">Al-Quran</a></li>\n';

let count = 0;
files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('<a href="/quran"')) return;
  
  if (content.includes('<a href="/zakat"')) {
    content = content.replace(
      /<li><a href="\/zakat">Zakat<\/a><\/li>/,
      QURAN_LINK + '                <li><a href="/zakat">Zakat</a></li>'
    );
    fs.writeFileSync(filePath, content);
    count++;
    console.log('Updated:', file);
  }
});

console.log(`\n${count} files updated with Quran link.`);
