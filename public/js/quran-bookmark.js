/* ============================================
   QURAN BOOKMARKS
   ============================================ */

const QURAN_BOOKMARK = {
  bookmarks: [],
  userId: null,
  
  init() {
    this.loadFromStorage();
    this.renderBookmarks();
  },
  
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('quran_bookmarks');
      if (saved) this.bookmarks = JSON.parse(saved);
    } catch(e) {}
  },
  
  saveToStorage() {
    try {
      localStorage.setItem('quran_bookmarks', JSON.stringify(this.bookmarks));
    } catch(e) {}
  },
  
  async addBookmark(surahNumber, ayatNumber, arabic, translation) {
    const exists = this.bookmarks.find(b => b.surah === surahNumber && b.ayat === ayatNumber);
    if (exists) return false;
    
    this.bookmarks.unshift({
      id: Date.now(),
      surah: surahNumber,
      ayat: ayatNumber,
      arabic: arabic,
      translation: translation,
      timestamp: new Date().toISOString()
    });
    
    this.saveToStorage();
    this.renderBookmarks();
    this.updateBookmarkButtons();
    
    try {
      const userId = localStorage.getItem('clerk_user_id');
      if (userId) {
        await fetch('/api/quran/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surah: surahNumber, ayat: ayatNumber, userId })
        });
      }
    } catch(e) {}
    
    return true;
  },
  
  removeBookmark(surahNumber, ayatNumber) {
    this.bookmarks = this.bookmarks.filter(b => !(b.surah === surahNumber && b.ayat === ayatNumber));
    this.saveToStorage();
    this.renderBookmarks();
    this.updateBookmarkButtons();
  },
  
  isBookmarked(surahNumber, ayatNumber) {
    return this.bookmarks.some(b => b.surah === surahNumber && b.ayat === ayatNumber);
  },
  
  updateBookmarkButtons() {
    document.querySelectorAll('.ayat-action-btn[data-action="bookmark"]').forEach(btn => {
      const surah = parseInt(btn.dataset.surah);
      const ayat = parseInt(btn.dataset.ayat);
      if (this.isBookmarked(surah, ayat)) {
        btn.classList.add('active');
        btn.textContent = '💚 Tersimpan';
      } else {
        btn.classList.remove('active');
        btn.textContent = '🔖';
      }
    });
  },
  
  renderBookmarks() {
    const container = document.getElementById('bookmarksList');
    if (!container) return;
    
    if (this.bookmarks.length === 0) {
      container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted);">Belum ada markah. Tekan 🔖 pada ayat untuk menyimpan.</p>';
      return;
    }
    
    container.innerHTML = this.bookmarks.map(b => `
      <div class="ayat-card" style="position:relative;">
        <button class="btn-remove-bookmark" onclick="QURAN_BOOKMARK.removeBookmark(${b.surah},${b.ayat})" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;font-size:1.2rem;">✕</button>
        <div style="margin-bottom:8px;color:var(--primary);font-weight:600;">${this.getSurahName(b.surah)} ayat ${b.ayat}</div>
        <div class="ayat-arabic" style="text-align:right;direction:rtl;margin:12px 0;font-size:1.5rem;">${b.arabic}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem;">${b.translation}</div>
      </div>
    `).join('');
  },
  
  getSurahName(number) {
    const names = ['','Al-Fatihah','Al-Baqarah','Ali Imran','An-Nisa','Al-Maidah','Al-Anam','Al-Araf','Al-Anfal','At-Taubah','Yunus','Hud','Yusuf','Ar-Raad','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Muminun','An-Nur','Al-Furqan','Ash-Shuara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqiah','Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah','As-Saf','Al-Jumuah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma\'arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Naziat','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A\'la','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duhaa','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qariah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Ma\'un','Al-Kauthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'];
    return names[number] || `Surah ${number}`;
  },
  
  toggle(surahNumber, ayatNumber, arabic, translation) {
    if (this.isBookmarked(surahNumber, ayatNumber)) {
      this.removeBookmark(surahNumber, ayatNumber);
      return false;
    } else {
      this.addBookmark(surahNumber, ayatNumber, arabic, translation);
      return true;
    }
  }
};

function shareAyat(surahNumber, ayatNumber, arabic, translation) {
  const surahName = QURAN_BOOKMARK.getSurahName(surahNumber);
  const text = `${arabic}\n\n"${translation}"\n\n${surahName} ayat ${ayatNumber}\n\n📖 Al-Quran Digital - Masjid Al Karomah`;
  
  if (navigator.share) {
    navigator.share({ title: `${surahName} ayat ${ayatNumber}`, text: text }).catch(() => {});
  } else {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ayatList')) {
    QURAN_BOOKMARK.init();
  }
});
