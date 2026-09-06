/* ============================================
   QURAN READ PAGE - SURAH DETAIL
   ============================================ */

const QURAN_READ = {
  surahNumber: 1,
  ayats: [],
  tafsirCache: {},
  
  async init() {
    const params = new URLSearchParams(window.location.search);
    this.surahNumber = parseInt(params.get('surah')) || 1;
    
    if (this.surahNumber < 1 || this.surahNumber > 114) {
      this.surahNumber = 1;
    }
    
    await this.loadSurah();
    this.setupControls();
    this.loadLastRead();
  },
  
  async loadSurah() {
    try {
      const res = await fetch(`/api/quran/surah/${this.surahNumber}`);
      const data = await res.json();
      
      if (data.status === 'success') {
        this.ayats = data.data.ayats;
        this.renderHeader(data.data);
        this.renderAyats();
      } else {
        this.loadSurahFallback();
      }
    } catch (err) {
      console.error('Failed to load surah:', err);
      this.loadSurahFallback();
    }
  },
  
  loadSurahFallback() {
    const fallbackData = this.getStaticSurah(this.surahNumber);
    if (fallbackData) {
      this.ayats = fallbackData.ayats;
      this.renderHeader(fallbackData);
      this.renderAyats();
    } else {
      document.getElementById('ayatList').innerHTML = '<p style="text-align:center;padding:40px;">Gagal memuat surah. <a href="/quran">Kembali ke daftar surah</a></p>';
    }
  },
  
  getStaticSurah(num) {
    const staticData = {
      1: {
        number: 1, name: 'Al-Fatihah', englishName: 'Al-Fatihah', meaning: 'Pembukaan',
        revelationType: 'Meccan', numberOfAyahs: 7,
        ayats: [
          { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang' },
          { number: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: 'Segala puji bagi Allah, Tuhan seluruh alam' },
          { number: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'Yang Maha Pengasih lagi Maha Penyayang' },
          { number: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Yang memiliki hari kiamat' },
          { number: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami memohon pertolongan' },
          { number: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Tunjukilah kami jalan yang lurus' },
          { number: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'Jalan orang-orang yang telah Engkau anugerahi nikmat kepada mereka, bukan jalan yang dimurkai dan bukan pula jalan yang sesat' }
        ]
      },
      112: {
        number: 112, name: 'Al-Ikhlas', englishName: 'Al-Ikhlas', meaning: 'Kemurnian',
        revelationType: 'Meccan', numberOfAyahs: 4,
        ayats: [
          { number: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Katakanlah (Muhammad), Dialah Allah, Yang Maha Esa' },
          { number: 2, arabic: 'اللَّهُ الصَّمَدُ', translation: 'Allah tempat meminta segala sesuatu' },
          { number: 3, arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'Dia tidak beranak dan tidak pula diperanakkan' },
          { number: 4, arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', translation: 'Dan tidak ada sesuatu yang setara dengan Dia' }
        ]
      },
      113: {
        number: 113, name: 'Al-Falaq', englishName: 'Al-Falaq', meaning: 'Waktu Shubuh',
        revelationType: 'Meccan', numberOfAyahs: 5,
        ayats: [
          { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Katakanlah, Aku berlindung kepada Tuhan yang menguasai subuh' },
          { number: 2, arabic: 'مِن شَرِّ مَا خَلَقَ', translation: 'dari kejahatan makhluk-Nya' },
          { number: 3, arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', translation: 'dan dari kejahatan malam apabila telah gelap gulita' },
          { number: 4, arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translation: 'dan dari kejahatan wanita-wanita tukang sihir yang menghembus pada buhul-buhul' },
          { number: 5, arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', translation: 'dan dari kejahatan orang yang dengki apabila ia dengki' }
        ]
      },
      114: {
        number: 114, name: 'An-Nas', englishName: 'An-Nas', meaning: 'Manusia',
        revelationType: 'Meccan', numberOfAyahs: 6,
        ayats: [
          { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Katakanlah, Aku berlindung kepada Tuhan manusia' },
          { number: 2, arabic: 'مَلِكِ النَّاسِ', translation: 'Raja manusia' },
          { number: 3, arabic: 'إِلَٰهِ النَّاسِ', translation: 'Sembahan manusia' },
          { number: 4, arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translation: 'dari kejahatan bisikan setan yang bersembunyi' },
          { number: 5, arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translation: 'yang membisikkan ke dalam dada manusia' },
          { number: 6, arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translation: 'dari jin dan manusia' }
        ]
      }
    };
    return staticData[num] || null;
  },
  
  renderHeader(data) {
    document.title = `${data.englishName} - Al-Quran Masjid Al Karomah`;
    
    document.getElementById('surahArabicName').textContent = data.name;
    document.getElementById('surahLatinName').textContent = `${data.number}. ${data.englishName}`;
    document.getElementById('surahMeaning').textContent = data.meaning;
    document.getElementById('surahType').textContent = data.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyyah';
    document.getElementById('surahAyatCount').textContent = data.numberOfAyahs;
    document.getElementById('surahJuz').textContent = Math.ceil(data.number / 4);
    
    const bismillah = document.getElementById('bismillahSection');
    if (bismillah) {
      bismillah.style.display = data.number === 1 || data.number === 9 ? 'none' : 'block';
    }
    
    const prevBtn = document.getElementById('prevSurahBtn');
    const nextBtn = document.getElementById('nextSurahBtn');
    if (prevBtn) prevBtn.disabled = data.number <= 1;
    if (prevBtn) prevBtn.onclick = () => window.location.href = `/quran/read?surah=${data.number - 1}`;
    if (nextBtn) nextBtn.onclick = () => window.location.href = `/quran/read?surah=${data.number + 1}`;
    if (nextBtn && data.number >= 114) nextBtn.style.display = 'none';
  },
  
  renderAyats() {
    const container = document.getElementById('ayatList');
    if (!container) return;
    
    container.innerHTML = this.ayats.map(ayat => `
      <div class="ayat-card" data-surah="${this.surahNumber}" data-ayat="${ayat.number}" id="ayat-${ayat.number}">
        <div class="ayat-header">
          <div class="ayat-number">
            <span class="ayat-number-badge">${ayat.number}</span>
          </div>
          <div class="ayat-actions">
            <button class="ayat-action-btn play-ayat" data-surah="${this.surahNumber}" data-ayat="${ayat.number}" onclick="QURAN_PLAYER.playAyat(${this.surahNumber}, ${ayat.number})" title="Putar">▶</button>
            <button class="ayat-action-btn" data-action="bookmark" data-surah="${this.surahNumber}" data-ayat="${ayat.number}" onclick="toggleBookmark(${this.surahNumber}, ${ayat.number}, '${ayat.arabic.replace(/'/g, "\\'")}', '${ayat.translation.replace(/'/g, "\\'")}')" title="Markah">🔖</button>
            <button class="ayat-action-btn" onclick="shareAyat(${this.surahNumber}, ${ayat.number}, '${ayat.arabic.replace(/'/g, "\\'")}', '${ayat.translation.replace(/'/g, "\\'")}')" title="Bagikan">📤</button>
            <button class="ayat-action-btn" onclick="toggleTafsir(${ayat.number})" title="Tafsir">📖 Tafsir</button>
          </div>
        </div>
        <div class="ayat-arabic" id="arabic-${ayat.number}">${ayat.arabic}</div>
        <div class="ayat-translation" id="translation-${ayat.number}">${ayat.number}. ${ayat.translation}</div>
        <div class="ayat-tafsir" id="tafsir-${ayat.number}" style="display:none;">
          <div class="ayat-tafsir-header" onclick="toggleTafsir(${ayat.number})">
            <span>📚 Tafsir Ibn Katsir</span>
            <span class="ayat-tafsir-toggle">▼</span>
          </div>
          <div class="ayat-tafsir-content" id="tafsir-content-${ayat.number}">
            <p style="color:var(--text-muted);">Memuat tafsir...</p>
          </div>
        </div>
      </div>
    `).join('');
    
    QURAN_BOOKMARK.updateBookmarkButtons();
  },
  
  async loadTafsir(ayatNumber) {
    const container = document.getElementById(`tafsir-content-${ayatNumber}`);
    if (!container || container.dataset.loaded) return;
    
    try {
      const res = await fetch(`/api/quran/tafsir/${this.surahNumber}`);
      const data = await res.json();
      
      if (data.status === 'success' && data.data[ayatNumber]) {
        container.innerHTML = `<p>${data.data[ayatNumber]}</p>`;
        container.dataset.loaded = 'true';
      } else {
        container.innerHTML = '<p style="color:var(--text-muted);">Tafsir untuk ayat ini belum tersedia.</p>';
      }
    } catch (err) {
      container.innerHTML = '<p style="color:var(--text-muted);">Gagal memuat tafsir. Silakan coba lagi.</p>';
    }
  },
  
  setupControls() {
    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const size = btn.dataset.size;
        document.querySelectorAll('.ayat-arabic').forEach(el => {
          el.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge');
          el.classList.add(`font-${size}`);
        });
      });
    });
  },
  
  loadLastRead() {
    try {
      const saved = localStorage.getItem('quran_last_read');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.surah === this.surahNumber) {
          const ayatEl = document.getElementById(`ayat-${data.ayat}`);
          if (ayatEl) {
            ayatEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    } catch(e) {}
  }
};

function toggleTafsir(ayatNumber) {
  const tafsirEl = document.getElementById(`tafsir-${ayatNumber}`);
  const contentEl = document.getElementById(`tafsir-content-${ayatNumber}`);
  
  if (tafsirEl.style.display === 'none' || !tafsirEl.style.display) {
    tafsirEl.style.display = 'block';
    tafsirEl.classList.add('expanded');
    QURAN_READ.loadTafsir(ayatNumber);
  } else {
    tafsirEl.style.display = 'none';
    tafsirEl.classList.remove('expanded');
  }
}

function toggleBookmark(surahNumber, ayatNumber, arabic, translation) {
  const added = QURAN_BOOKMARK.toggle(surahNumber, ayatNumber, arabic, translation);
  if (added) {
    if (typeof Toast !== 'undefined') Toast.show('Ayat disimpan ke markah', 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ayatList')) {
    QURAN_READ.init();
  }
});
