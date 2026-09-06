/* ============================================
   QURAN AUDIO PLAYER
   ============================================ */

const QURAN_PLAYER = {
  audio: new Audio(),
  currentSurah: null,
  currentAyat: 0,
  isPlaying: false,
  qari: 'ar.alafasy',
  allAyats: [],
  autoNext: true,
  listeners: [],
  
  init() {
    this.audio.preload = 'none';
    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('play', () => this.updateState(true));
    this.audio.addEventListener('pause', () => this.updateState(false));
    this.audio.addEventListener('error', (e) => this.onError(e));
  },
  
  getAudioUrl(surahNumber, ayatNumber, qari) {
    const paddedSurah = String(surahNumber).padStart(3, '0');
    const paddedAyat = String(ayatNumber).padStart(3, '0');
    return `https://cdn.islamic.network/quran/audio-surah/128/${qari}/${surahNumber}.mp3`;
  },
  
  getAyahAudioUrl(surahNumber, ayatNumber, qari) {
    const paddedSurah = String(surahNumber).padStart(3, '0');
    const paddedAyat = String(ayatNumber).padStart(3, '0');
    return `https://cdn.islamic.network/quran/audio/128/${qari}/${paddedSurah}${paddedAyat}.mp3`;
  },
  
  async playSurah(surahNumber, fromAyat = 1) {
    try {
      this.currentSurah = surahNumber;
      this.currentAyat = fromAyat;
      const url = this.getAudioUrl(surahNumber, this.qari);
      this.audio.src = url;
      this.audio.currentTime = this.estimateSurahOffset(surahNumber, fromAyat);
      await this.audio.play();
      this.showMiniPlayer(surahNumber, fromAyat);
      this.saveLastRead(surahNumber, fromAyat);
      this.updateState(true);
    } catch (err) {
      console.error('Play failed:', err);
      this.notify('Gagal memutar audio. Coba qari lain.', 'error');
    }
  },
  
  async playAyat(surahNumber, ayatNumber) {
    try {
      this.currentSurah = surahNumber;
      this.currentAyat = ayatNumber;
      const url = this.getAyahAudioUrl(surahNumber, ayatNumber, this.qari);
      this.audio.src = url;
      await this.audio.play();
      this.highlightAyat(surahNumber, ayatNumber);
      this.showMiniPlayer(surahNumber, ayatNumber);
      this.saveLastRead(surahNumber, ayatNumber);
      this.updateState(true);
    } catch (err) {
      console.error('Play ayat failed:', err);
    }
  },
  
  pause() {
    this.audio.pause();
  },
  
  resume() {
    this.audio.play().catch(() => {});
  },
  
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.updateState(false);
  },
  
  next() {
    if (this.currentAyat < 999) {
      this.playAyat(this.currentSurah, this.currentAyat + 1);
    }
  },
  
  prev() {
    if (this.currentAyat > 1) {
      this.playAyat(this.currentSurah, this.currentAyat - 1);
    }
  },
  
  setQari(newQari) {
    this.qari = newQari;
    try { localStorage.setItem('quran_qari', newQari); } catch(e) {}
  },
  
  loadQari() {
    const saved = localStorage.getItem('quran_qari');
    if (saved) this.qari = saved;
    const select = document.getElementById('qariSelect');
    if (select) select.value = this.qari;
  },
  
  estimateSurahOffset(surahNumber, ayatNumber) {
    const avgAyatDuration = 8;
    return (ayatNumber - 1) * avgAyatDuration;
  },
  
  onEnded() {
    if (this.autoNext && this.currentAyat < 999) {
      this.playAyat(this.currentSurah, this.currentAyat + 1);
    } else {
      this.updateState(false);
    }
  },
  
  onError(e) {
    console.error('Audio error:', e);
    this.notify('Gagal memuat audio. Coba qari lain.', 'error');
    this.updateState(false);
  },
  
  updateState(isPlaying) {
    this.isPlaying = isPlaying;
    document.querySelectorAll('.ayat-action-btn.play-ayat').forEach(btn => {
      const surah = parseInt(btn.dataset.surah);
      const ayat = parseInt(btn.dataset.ayat);
      if (surah === this.currentSurah && ayat === this.currentAyat) {
        btn.textContent = isPlaying ? '⏸ Pause' : '▶ Putar';
        btn.classList.toggle('playing', isPlaying);
      } else {
        btn.textContent = '▶';
        btn.classList.remove('playing');
      }
    });
    
    const playPauseBtn = document.getElementById('miniPlayPause');
    if (playPauseBtn) {
      playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
      playPauseBtn.classList.toggle('playing', isPlaying);
    }
  },
  
  highlightAyat(surahNumber, ayatNumber) {
    document.querySelectorAll('.ayat-card').forEach(c => c.classList.remove('playing'));
    const card = document.querySelector(`.ayat-card[data-surah="${surahNumber}"][data-ayat="${ayatNumber}"]`);
    if (card) {
      card.classList.add('playing');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  
  showMiniPlayer(surahNumber, ayatNumber) {
    const player = document.getElementById('miniPlayer');
    const title = document.getElementById('miniPlayerTitle');
    const sub = document.getElementById('miniPlayerSub');
    if (!player) return;
    
    const surah = (QURAN.surahs || []).find(s => s.number === surahNumber);
    if (title) title.textContent = surah ? surah.englishName : `Surah ${surahNumber}`;
    if (sub) sub.textContent = `Ayat ${ayatNumber}`;
    player.style.display = 'flex';
  },
  
  hideMiniPlayer() {
    const player = document.getElementById('miniPlayer');
    if (player) player.style.display = 'none';
  },
  
  saveLastRead(surahNumber, ayatNumber) {
    try {
      localStorage.setItem('quran_last_read', JSON.stringify({
        surah: surahNumber,
        ayat: ayatNumber,
        timestamp: Date.now()
      }));
    } catch(e) {}
  },
  
  notify(msg, type = 'info') {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Al-Quran', { body: msg });
    } else if (typeof Toast !== 'undefined') {
      Toast.show(msg, type);
    } else {
      console.log('[Quran]', msg);
    }
  }
};

QURAN_PLAYER.init();

document.addEventListener('DOMContentLoaded', () => {
  const playAllBtn = document.getElementById('playAllBtn');
  const stopAllBtn = document.getElementById('stopAllBtn');
  const qariSelect = document.getElementById('qariSelect');
  const miniPlayPause = document.getElementById('miniPlayPause');
  const miniPrev = document.getElementById('miniPrev');
  const miniNext = document.getElementById('miniNext');
  const miniClose = document.getElementById('miniClose');
  
  if (playAllBtn) {
    playAllBtn.addEventListener('click', () => {
      const surahNum = parseInt(new URLSearchParams(location.search).get('surah') || '1');
      QURAN_PLAYER.playSurah(surahNum, 1);
    });
  }
  
  if (stopAllBtn) {
    stopAllBtn.addEventListener('click', () => QURAN_PLAYER.stop());
  }
  
  if (qariSelect) {
    QURAN_PLAYER.loadQari();
    qariSelect.addEventListener('change', (e) => {
      QURAN_PLAYER.setQari(e.target.value);
    });
  }
  
  if (miniPlayPause) {
    miniPlayPause.addEventListener('click', () => {
      if (QURAN_PLAYER.isPlaying) QURAN_PLAYER.pause();
      else QURAN_PLAYER.resume();
    });
  }
  
  if (miniPrev) miniPrev.addEventListener('click', () => QURAN_PLAYER.prev());
  if (miniNext) miniNext.addEventListener('click', () => QURAN_PLAYER.next());
  if (miniClose) miniClose.addEventListener('click', () => QURAN_PLAYER.hideMiniPlayer());
});
