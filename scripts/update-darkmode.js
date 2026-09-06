const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html') && f !== 'live.html');

const NAV_ITEM = `                <li>
                    <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
                        <svg class="moon-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        <svg class="sun-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </button>
                </li>`;

const SCRIPTS = `    <script>
      (function() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      })();
    </script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch(() => {});
        });
      }
    </script>
</body>`;

const SKIP_CONTENT = `    <a href="#main-content" class="skip-to-content">Skip to content</a>
`;

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add skip to content after body tag if not exists
  if (!content.includes('skip-to-content')) {
    content = content.replace('<body>', '<body>\n    <a href="#main-content" class="skip-to-content">Skip to content</a>');
  }
  
  // Add theme toggle before the last </ul> in navbar-menu
  const menuPattern = /(<ul class="navbar-menu">[\s\S]*?)(<\/ul>)(\s*<li><a href="\/admin")/;
  if (menuPattern.test(content)) {
    content = content.replace(menuPattern, `$1${NAV_ITEM}\n$2$3`);
  }
  
  // Add main tag wrapper if not exists
  if (!content.includes('id="main-content"')) {
    content = content.replace(/(\s*<\/nav>\s*)/, '$1\n    <main id="main-content">');
  }
  
  // Add </main> before <footer
  if (!content.includes('</main>')) {
    content = content.replace(/(\s*<footer>)/, '\n    </main>\n$1');
  }
  
  // Add theme scripts before </body>
  if (!content.includes('localStorage.getItem(\'theme\')')) {
    content = content.replace('</body>', `${SCRIPTS}`);
  }
  
  // Add manifest link in head if not exists
  if (!content.includes('manifest.json')) {
    content = content.replace('</head>', '    <link rel="manifest" href="/manifest.json">\n</head>');
  }
  
  fs.writeFileSync(filePath, content);
  console.log('Updated:', file);
});

console.log('\nDone! All pages updated with dark mode support.');
