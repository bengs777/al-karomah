/* ============================================
   QURAN DIGITAL - MAIN LOGIC
   ============================================ */

const QURAN = {
  surahs: [],
  filteredSurahs: [],
  currentSurah: null,
  currentAyats: [],
  tafsirCache: {},
  
  async init() {
    await this.loadSurahs();
    this.setupEventListeners();
    this.loadDailyAyat();
    this.loadLastRead();
  },

  async loadSurahs() {
    try {
      const res = await fetch('/api/quran/surahs');
      const data = await res.json();
      if (data.status === 'success') {
        this.surahs = data.data;
        this.filteredSurahs = [...this.surahs];
        this.renderSurahList();
        this.populateFilters();
      } else {
        this.loadSurahsFallback();
      }
    } catch (err) {
      console.error('Failed to load surahs:', err);
      this.loadSurahsFallback();
    }
  },

  loadSurahsFallback() {
    const fallback = [
      { number: 1, name: 'Al-Fatihah', englishName: 'Al-Fatihah', meaning: 'Pembukaan', numberOfAyahs: 7, revelationType: 'Meccan' },
      { number: 2, name: 'Al-Baqarah', englishName: 'Al-Baqarah', meaning: 'Sapi Betina', numberOfAyahs: 286, revelationType: 'Medinan' },
      { number: 3, name: 'Ali Imran', englishName: 'Ali Imran', meaning: 'Keluarga Imran', numberOfAyahs: 200, revelationType: 'Medinan' },
      { number: 4, name: 'An-Nisa', englishName: 'An-Nisa', meaning: 'Wanita', numberOfAyahs: 176, revelationType: 'Medinan' },
      { number: 5, name: 'Al-Maidah', englishName: 'Al-Maidah', meaning: 'Hidayah', numberOfAyahs: 120, revelationType: 'Medinan' },
      { number: 6, name: 'Al-Anam', englishName: 'Al-Anam', meaning: 'Hewan Ternak', numberOfAyahs: 165, revelationType: 'Meccan' },
      { number: 7, name: 'Al-Araf', englishName: 'Al-Araf', meaning: 'Tempat Tertinggi', numberOfAyahs: 206, revelationType: 'Meccan' },
      { number: 8, name: 'Al-Anfal', englishName: 'Al-Anfal', meaning: 'Harta Rampasan', numberOfAyahs: 75, revelationType: 'Medinan' },
      { number: 9, name: 'At-Taubah', englishName: 'At-Taubah', meaning: 'Pengampunan', numberOfAyahs: 129, revelationType: 'Medinan' },
      { number: 10, name: 'Yunus', englishName: 'Yunus', meaning: 'Yunus', numberOfAyahs: 109, revelationType: 'Meccan' },
      { number: 11, name: 'Hud', englishName: 'Hud', meaning: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan' },
      { number: 12, name: 'Yusuf', englishName: 'Yusuf', meaning: 'Yusuf', numberOfAyahs: 111, revelationType: 'Meccan' },
      { number: 13, name: 'Ar-Raad', englishName: 'Ar-Raad', meaning: 'Petir', numberOfAyahs: 43, revelationType: 'Medinan' },
      { number: 14, name: 'Ibrahim', englishName: 'Ibrahim', meaning: 'Ibrahim', numberOfAyahs: 52, revelationType: 'Meccan' },
      { number: 15, name: 'Al-Hijr', englishName: 'Al-Hijr', meaning: 'Gunung Hijr', numberOfAyahs: 99, revelationType: 'Meccan' },
      { number: 16, name: 'An-Nahl', englishName: 'An-Nahl', meaning: 'Lebah', numberOfAyahs: 128, revelationType: 'Meccan' },
      { number: 17, name: 'Al-Isra', englishName: 'Al-Isra', meaning: 'Perjalanan Malam', numberOfAyahs: 111, revelationType: 'Meccan' },
      { number: 18, name: 'Al-Kahf', englishName: 'Al-Kahf', meaning: 'Goa', numberOfAyahs: 110, revelationType: 'Meccan' },
      { number: 19, name: 'Maryam', englishName: 'Maryam', meaning: 'Maryam', numberOfAyahs: 98, revelationType: 'Meccan' },
      { number: 20, name: 'Ta-Ha', englishName: 'Ta-Ha', meaning: 'Ta-Ha', numberOfAyahs: 135, revelationType: 'Meccan' },
      { number: 21, name: 'Al-Anbiya', englishName: 'Al-Anbiya', meaning: 'Para Nabi', numberOfAyahs: 112, revelationType: 'Meccan' },
      { number: 22, name: 'Al-Hajj', englishName: 'Al-Hajj', meaning: 'Haji', numberOfAyahs: 78, revelationType: 'Medinan' },
      { number: 23, name: 'Al-Muminun', englishName: 'Al-Muminun', meaning: 'Orang-Orang Beriman', numberOfAyahs: 118, revelationType: 'Meccan' },
      { number: 24, name: 'An-Nur', englishName: 'An-Nur', meaning: 'Cahaya', numberOfAyahs: 64, revelationType: 'Medinan' },
      { number: 25, name: 'Al-Furqan', englishName: 'Al-Furqan', meaning: 'Pembeda', numberOfAyahs: 77, revelationType: 'Meccan' },
      { number: 26, name: 'Ash-Shuara', englishName: 'Ash-Shuara', meaning: 'Para Penyair', numberOfAyahs: 227, revelationType: 'Meccan' },
      { number: 27, name: 'An-Naml', englishName: 'An-Naml', meaning: 'Semut', numberOfAyahs: 93, revelationType: 'Meccan' },
      { number: 28, name: 'Al-Qasas', englishName: 'Al-Qasas', meaning: 'Kisah-Kisah', numberOfAyahs: 88, revelationType: 'Meccan' },
      { number: 29, name: 'Al-Ankabut', englishName: 'Al-Ankabut', meaning: 'Laba-Laba', numberOfAyahs: 69, revelationType: 'Meccan' },
      { number: 30, name: 'Ar-Rum', englishName: 'Ar-Rum', meaning: 'Romawi', numberOfAyahs: 60, revelationType: 'Meccan' },
      { number: 31, name: 'Luqman', englishName: 'Luqman', meaning: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan' },
      { number: 32, name: 'As-Sajdah', englishName: 'As-Sajdah', meaning: 'Sujud', numberOfAyahs: 30, revelationType: 'Meccan' },
      { number: 33, name: 'Al-Ahzab', englishName: 'Al-Ahzab', meaning: 'Golongan Yang Bersekutu', numberOfAyahs: 73, revelationType: 'Medinan' },
      { number: 34, name: 'Saba', englishName: 'Saba', meaning: 'Saba', numberOfAyahs: 54, revelationType: 'Meccan' },
      { number: 35, name: 'Fatir', englishName: 'Fatir', meaning: 'Pencipta', numberOfAyahs: 45, revelationType: 'Meccan' },
      { number: 36, name: 'Ya-Sin', englishName: 'Ya-Sin', meaning: 'Ya Sin', numberOfAyahs: 83, revelationType: 'Meccan' },
      { number: 37, name: 'As-Saffat', englishName: 'As-Saffat', meaning: 'Barisan-Barisan', numberOfAyahs: 182, revelationType: 'Meccan' },
      { number: 38, name: 'Sad', englishName: 'Sad', meaning: 'Sad', numberOfAyahs: 88, revelationType: 'Meccan' },
      { number: 39, name: 'Az-Zumar', englishName: 'Az-Zumar', meaning: 'Para Pekabarya', numberOfAyahs: 75, revelationType: 'Meccan' },
      { number: 40, name: 'Ghafir', englishName: 'Ghafir', meaning: 'Yang Maha Pengampun', numberOfAyahs: 85, revelationType: 'Meccan' },
      { number: 41, name: 'Fussilat', englishName: 'Fussilat', meaning: 'Dijelaskan', numberOfAyahs: 54, revelationType: 'Meccan' },
      { number: 42, name: 'Ash-Shura', englishName: 'Ash-Shura', meaning: 'Musyawarah', numberOfAyahs: 53, revelationType: 'Meccan' },
      { number: 43, name: 'Az-Zukhruf', englishName: 'Az-Zukhruf', meaning: 'Perhiasan', numberOfAyahs: 89, revelationType: 'Meccan' },
      { number: 44, name: 'Ad-Dukhan', englishName: 'Ad-Dukhan', meaning: 'Kabut', numberOfAyahs: 59, revelationType: 'Meccan' },
      { number: 45, name: 'Al-Jathiyah', englishName: 'Al-Jathiyah', meaning: 'Berlutut', numberOfAyahs: 37, revelationType: 'Meccan' },
      { number: 46, name: 'Al-Ahqaf', englishName: 'Al-Ahqaf', meaning: 'Bukit Pasir', numberOfAyahs: 35, revelationType: 'Meccan' },
      { number: 47, name: 'Muhammad', englishName: 'Muhammad', meaning: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan' },
      { number: 48, name: 'Al-Fath', englishName: 'Al-Fath', meaning: 'Kemenangan', numberOfAyahs: 29, revelationType: 'Medinan' },
      { number: 49, name: 'Al-Hujurat', englishName: 'Al-Hujurat', meaning: 'Kamar-Kamar', numberOfAyahs: 18, revelationType: 'Medinan' },
      { number: 50, name: 'Qaf', englishName: 'Qaf', meaning: 'Qaf', numberOfAyahs: 45, revelationType: 'Meccan' },
      { number: 51, name: 'Adh-Dhariyat', englishName: 'Adh-Dhariyat', meaning: 'Angin Yang Menerbangkan', numberOfAyahs: 60, revelationType: 'Meccan' },
      { number: 52, name: 'At-Tur', englishName: 'At-Tur', meaning: 'Bukit Tursina', numberOfAyahs: 49, revelationType: 'Meccan' },
      { number: 53, name: 'An-Najm', englishName: 'An-Najm', meaning: 'Bintang', numberOfAyahs: 62, revelationType: 'Meccan' },
      { number: 54, name: 'Al-Qamar', englishName: 'Al-Qamar', meaning: 'Bulan', numberOfAyahs: 55, revelationType: 'Meccan' },
      { number: 55, name: 'Ar-Rahman', englishName: 'Ar-Rahman', meaning: 'Yang Maha Pemurah', numberOfAyahs: 78, revelationType: 'Medinan' },
      { number: 56, name: 'Al-Waqiah', englishName: 'Al-Waqiah', meaning: 'Hari Kiamat', numberOfAyahs: 96, revelationType: 'Meccan' },
      { number: 57, name: 'Al-Hadid', englishName: 'Al-Hadid', meaning: 'Besi', numberOfAyahs: 29, revelationType: 'Medinan' },
      { number: 58, name: 'Al-Mujadila', englishName: 'Al-Mujadila', meaning: 'Wanita Yang Menggugat', numberOfAyahs: 22, revelationType: 'Medinan' },
      { number: 59, name: 'Al-Hashr', englishName: 'Al-Hashr', meaning: 'Pengusiran', numberOfAyahs: 24, revelationType: 'Medinan' },
      { number: 60, name: 'Al-Mumtahanah', englishName: 'Al-Mumtahanah', meaning: 'Wanita Yang Diuji', numberOfAyahs: 13, revelationType: 'Medinan' },
      { number: 61, name: 'As-Saf', englishName: 'As-Saf', meaning: 'Barisan', numberOfAyahs: 14, revelationType: 'Medinan' },
      { number: 62, name: "Al-Jumu'ah", englishName: "Al-Jumu'ah", meaning: "Jumat", numberOfAyahs: 11, revelationType: "Medinan" },
      { number: 63, name: 'Al-Munafiqun', englishName: 'Al-Munafiqun', meaning: 'Orang-Orang Munafik', numberOfAyahs: 11, revelationType: 'Medinan' },
      { number: 64, name: 'At-Taghabun', englishName: 'At-Taghabun', meaning: 'Hari Dinampakkan Kesalahan', numberOfAyahs: 18, revelationType: 'Medinan' },
      { number: 65, name: 'At-Talaq', englishName: 'At-Talaq', meaning: 'Talak', numberOfAyahs: 12, revelationType: 'Medinan' },
      { number: 66, name: 'At-Tahrim', englishName: 'At-Tahrim', meaning: 'Mengharamkan', numberOfAyahs: 12, revelationType: 'Medinan' },
      { number: 67, name: 'Al-Mulk', englishName: 'Al-Mulk', meaning: 'Kerajaan', numberOfAyahs: 30, revelationType: 'Meccan' },
      { number: 68, name: 'Al-Qalam', englishName: 'Al-Qalam', meaning: 'Pena', numberOfAyahs: 52, revelationType: 'Meccan' },
      { number: 69, name: 'Al-Haqqah', englishName: 'Al-Haqqah', meaning: 'Hari Kiamat', numberOfAyahs: 52, revelationType: 'Meccan' },
      { number: 70, name: "Al-Ma'arij", englishName: "Al-Ma'arij", meaning: "Tempat-Tempat Naik", numberOfAyahs: 44, revelationType: "Meccan" },
      { number: 71, name: 'Nuh', englishName: 'Nuh', meaning: 'Nuh', numberOfAyahs: 28, revelationType: 'Meccan' },
      { number: 72, name: 'Al-Jinn', englishName: 'Al-Jinn', meaning: 'Jin', numberOfAyahs: 28, revelationType: 'Meccan' },
      { number: 73, name: 'Al-Muzzammil', englishName: 'Al-Muzzammil', meaning: 'Orang Yang Berselimut', numberOfAyahs: 20, revelationType: 'Meccan' },
      { number: 74, name: 'Al-Muddaththir', englishName: 'Al-Muddaththir', meaning: 'Orang Yang Berkemul', numberOfAyahs: 56, revelationType: 'Meccan' },
      { number: 75, name: 'Al-Qiyamah', englishName: 'Al-Qiyamah', meaning: 'Hari Kiamat', numberOfAyahs: 40, revelationType: 'Meccan' },
      { number: 76, name: 'Al-Insan', englishName: 'Al-Insan', meaning: 'Manusia', numberOfAyahs: 31, revelationType: 'Medinan' },
      { number: 77, name: 'Al-Mursalat', englishName: 'Al-Mursalat', meaning: 'Malaikat-Malaikat Yang Diutus', numberOfAyahs: 50, revelationType: 'Meccan' },
      { number: 78, name: 'An-Naba', englishName: 'An-Naba', meaning: 'Berita Besar', numberOfAyahs: 40, revelationType: 'Meccan' },
      { number: 79, name: 'An-Naziat', englishName: 'An-Naziat', meaning: 'Malaikat-Malaikat Yang Mencabut', numberOfAyahs: 46, revelationType: 'Meccan' },
      { number: 80, name: 'Abasa', englishName: 'Abasa', meaning: 'Ia Bermuka Masam', numberOfAyahs: 42, revelationType: 'Meccan' },
      { number: 81, name: 'At-Takwir', englishName: 'At-Takwir', meaning: 'Penggulungan', numberOfAyahs: 29, revelationType: 'Meccan' },
      { number: 82, name: 'Al-Infitar', englishName: 'Al-Infitar', meaning: 'Terbelah', numberOfAyahs: 19, revelationType: 'Meccan' },
      { number: 83, name: 'Al-Mutaffifin', englishName: 'Al-Mutaffifin', meaning: 'Orang-Orang Yang Curang', numberOfAyahs: 36, revelationType: 'Meccan' },
      { number: 84, name: 'Al-Inshiqaq', englishName: 'Al-Inshiqaq', meaning: 'Terbelah', numberOfAyahs: 25, revelationType: 'Meccan' },
      { number: 85, name: 'Al-Buruj', englishName: 'Al-Buruj', meaning: 'Gugusan Bintang', numberOfAyahs: 22, revelationType: 'Meccan' },
      { number: 86, name: 'At-Tariq', englishName: 'At-Tariq', meaning: 'Yang Datang Di Malam Hari', numberOfAyahs: 17, revelationType: 'Meccan' },
      { number: 87, name: "Al-A'la", englishName: "Al-A'la", meaning: "Yang Paling Tinggi", numberOfAyahs: 19, revelationType: "Meccan" },
      { number: 88, name: 'Al-Ghashiyah', englishName: 'Al-Ghashiyah', meaning: 'Hari Kiamat', numberOfAyahs: 26, revelationType: 'Meccan' },
      { number: 89, name: 'Al-Fajr', englishName: 'Al-Fajr', meaning: 'Fajar', numberOfAyahs: 30, revelationType: 'Meccan' },
      { number: 90, name: 'Al-Balad', englishName: 'Al-Balad', meaning: 'Negeri', numberOfAyahs: 20, revelationType: 'Meccan' },
      { number: 91, name: 'Ash-Shams', englishName: 'Ash-Shams', meaning: 'Matahari', numberOfAyahs: 15, revelationType: 'Meccan' },
      { number: 92, name: 'Al-Layl', englishName: 'Al-Layl', meaning: 'Malam', numberOfAyahs: 21, revelationType: 'Meccan' },
      { number: 93, name: 'Ad-Duhaa', englishName: 'Ad-Duhaa', meaning: 'Waktu Matahari Sepenggalah', numberOfAyahs: 11, revelationType: 'Meccan' },
      { number: 94, name: 'Ash-Sharh', englishName: 'Ash-Sharh', meaning: 'Pelapasan Dada', numberOfAyahs: 8, revelationType: 'Meccan' },
      { number: 95, name: 'At-Tin', englishName: 'At-Tin', meaning: 'Buah Tin', numberOfAyahs: 8, revelationType: 'Meccan' },
      { number: 96, name: 'Al-Alaq', englishName: 'Al-Alaq', meaning: 'Segumpal Darah', numberOfAyahs: 19, revelationType: 'Meccan' },
      { number: 97, name: 'Al-Qadr', englishName: 'Al-Qadr', meaning: 'Kemuliaan', numberOfAyahs: 5, revelationType: 'Meccan' },
      { number: 98, name: 'Al-Bayyinah', englishName: 'Al-Bayyinah', meaning: 'Keterangan Yang jelas', numberOfAyahs: 8, revelationType: 'Medinan' },
      { number: 99, name: 'Az-Zalzalah', englishName: 'Az-Zalzalah', meaning: 'Gempa', numberOfAyahs: 8, revelationType: 'Medinan' },
      { number: 100, name: 'Al-Adiyat', englishName: 'Al-Adiyat', meaning: 'Kuda Yang Berlari Kencang', numberOfAyahs: 11, revelationType: 'Meccan' },
      { number: 101, name: 'Al-Qariah', englishName: 'Al-Qariah', meaning: 'Hari Kiamat', numberOfAyahs: 11, revelationType: 'Meccan' },
      { number: 102, name: 'At-Takathur', englishName: 'At-Takathur', meaning: 'Berlimpah-Limpah', numberOfAyahs: 8, revelationType: 'Meccan' },
      { number: 103, name: 'Al-Asr', englishName: 'Al-Asr', meaning: 'Waktu Sore', numberOfAyahs: 3, revelationType: 'Meccan' },
      { number: 104, name: 'Al-Humazah', englishName: 'Al-Humazah', meaning: 'Pengumpat', numberOfAyahs: 9, revelationType: 'Meccan' },
      { number: 105, name: 'Al-Fil', englishName: 'Al-Fil', meaning: 'Gajah', numberOfAyahs: 5, revelationType: 'Meccan' },
      { number: 106, name: 'Quraysh', englishName: 'Quraysh', meaning: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan' },
      { number: 107, name: "Al-Ma'un", englishName: "Al-Ma'un", meaning: "Barang-barang Yang Berguna", numberOfAyahs: 7, revelationType: "Meccan" },
      { number: 108, name: 'Al-Kauthar', englishName: 'Al-Kauthar', meaning: 'Nikmat Yang Banyak', numberOfAyahs: 3, revelationType: 'Meccan' },
      { number: 109, name: 'Al-Kafirun', englishName: 'Al-Kafirun', meaning: 'Orang-Orang Kafir', numberOfAyahs: 6, revelationType: 'Meccan' },
      { number: 110, name: 'An-Nasr', englishName: 'An-Nasr', meaning: 'Pertolongan', numberOfAyahs: 3, revelationType: 'Medinan' },
      { number: 111, name: 'Al-Masad', englishName: 'Al-Masad', meaning: 'Tali Yang Terbelit', numberOfAyahs: 5, revelationType: 'Meccan' },
      { number: 112, name: 'Al-Ikhlas', englishName: 'Al-Ikhlas', meaning: 'Kemurnian', numberOfAyahs: 4, revelationType: 'Meccan' },
      { number: 113, name: 'Al-Falaq', englishName: 'Al-Falaq', meaning: 'Waktu Shubuh', numberOfAyahs: 5, revelationType: 'Meccan' },
      { number: 114, name: 'An-Nas', englishName: 'An-Nas', meaning: 'Manusia', numberOfAyahs: 6, revelationType: 'Meccan' }
    ];
    this.surahs = fallback;
    this.filteredSurahs = [...fallback];
    this.renderSurahList();
    this.populateFilters();
  },

  renderSurahList() {
    const grid = document.getElementById('surahGrid');
    const stats = document.getElementById('quranStats');
    if (!grid) return;
    
    const typeFilter = document.getElementById('filterType')?.value || '';
    const ayatFilter = document.getElementById('filterAyat')?.value || '';
    const search = document.getElementById('searchSurah')?.value.toLowerCase() || '';
    
    let filtered = this.surahs.filter(s => {
      if (search && !s.name.toLowerCase().includes(search) && 
          !s.englishName.toLowerCase().includes(search) &&
          !s.meaning.toLowerCase().includes(search) &&
          !s.number.toString().includes(search)) return false;
      if (typeFilter === 'makkiyah' && s.revelationType !== 'Meccan') return false;
      if (typeFilter === 'madaniyyah' && s.revelationType !== 'Medinan') return false;
      if (ayatFilter === 'short' && s.numberOfAyahs > 50) return false;
      if (ayatFilter === 'medium' && (s.numberOfAyahs <= 50 || s.numberOfAyahs > 150)) return false;
      if (ayatFilter === 'long' && s.numberOfAyahs <= 150) return false;
      return true;
    });
    
    this.filteredSurahs = filtered;
    
    if (stats) stats.textContent = `Menampilkan ${filtered.length} dari ${this.surahs.length} surah`;
    
    grid.innerHTML = filtered.map(s => `
      <a href="/quran/read?surah=${s.number}" class="surah-card">
        <div class="surah-card-number">${s.number}</div>
        <div class="surah-card-info">
          <div class="surah-card-name">${s.englishName}</div>
          <div class="surah-card-meaning">${s.meaning}</div>
          <div class="surah-card-meta">
            <span>📖 ${s.numberOfAyahs} ayat</span>
            <span>•</span>
            <span>${s.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyyah'}</span>
          </div>
        </div>
        <div class="surah-card-arabic">${s.name.split(' ').pop() || s.name}</div>
      </a>
    `).join('') || '<p style="text-align:center;padding:40px;color:var(--text-muted);">Tidak ada surah yang cocok</p>';
  },

  populateFilters() {
    const juzSelect = document.getElementById('filterJuz');
    if (!juzSelect) return;
    
    const juzs = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
    juzSelect.innerHTML = '<option value="">Semua Juz</option>' + 
      juzs.map(j => `<option value="${j}">Juz ${j}</option>`).join('');
  },

  async loadDailyAyat() {
    const card = document.getElementById('dailyAyatCard');
    if (!card) return;
    
    try {
      const res = await fetch('/api/quran/random');
      const data = await res.json();
      if (data.status === 'success') {
        document.getElementById('dailyAyatArabic').textContent = data.data.arabic;
        document.getElementById('dailyAyatTranslation').textContent = data.data.translation;
        document.getElementById('dailyAyatRef').textContent = `${data.data.surah} ayat ${data.data.ayah}`;
      } else {
        this.loadRandomAyatFallback();
      }
    } catch (err) {
      this.loadRandomAyatFallback();
    }
  },

  loadRandomAyatFallback() {
    const randoms = [
      { surah: 'Al-Baqarah', ayah: 255, arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', translation: 'Allah tidak ada tuhan selain Dia. Yang Maha Hidup lagi Maha Menjaga kelangsungan hidup-Nya. Tidak diambil-Nya tidur dan tidak pula tidur. Segala yang ada di langit dan di bumi adalah milik-Nya. Siapa yang dapat memberi pertolongan di sisi Allah?' },
      { surah: 'Al-Ikhlas', ayah: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Katakanlah (Muhammad), Dialah Allah, Yang Maha Esa' },
      { surah: 'Al-Baqarah', ayah: 286, arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya' },
      { surah: 'Ar-Rahman', ayah: 1-2, arabic: 'الرَّحْمَٰنُ ۚ عَلَّمَ الْقُرْآنَ', translation: 'Yang Maha Pemurah. Yang telah mengajarkan Al-Quran' },
      { surah: 'Al-Hujurat', ayah: 13, arabic: 'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُمْ مِنْ ذَكَرٍ وَأُنْثَى وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا', translation: 'Wahai manusia! Sesungguhnya Kami telah menciptakan kamu dari seorang laki-laki dan seorang perempuan, dan menjadikan kamu berbangsa-bangsa dan bersuku-suku agar saling mengenal' }
    ];
    const random = randoms[Math.floor(Math.random() * randoms.length)];
    document.getElementById('dailyAyatArabic').textContent = random.arabic;
    document.getElementById('dailyAyatTranslation').textContent = random.translation;
    document.getElementById('dailyAyatRef').textContent = `${random.surah} ayat ${random.ayah}`;
  },

  setupEventListeners() {
    const search = document.getElementById('searchSurah');
    const typeFilter = document.getElementById('filterType');
    const ayatFilter = document.getElementById('filterAyat');
    const refreshBtn = document.getElementById('refreshDailyAyat');
    
    if (search) search.addEventListener('input', () => this.renderSurahList());
    if (typeFilter) typeFilter.addEventListener('change', () => this.renderSurahList());
    if (ayatFilter) ayatFilter.addEventListener('change', () => this.renderSurahList());
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadDailyAyat());
  },

  loadLastRead() {
    const last = localStorage.getItem('quran_last_read');
    if (last) {
      try {
        const data = JSON.parse(last);
        console.log('Last read:', data);
      } catch(e) {}
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('surahGrid')) {
    QURAN.init();
  }
});
