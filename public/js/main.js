/* ============================================
   MAIN JS - PAGE-SPECIFIC LOGIC
   ============================================ */

// ---- JADWAL SHOLAT PAGE ----
if (document.querySelector('#city-select')) {
  const citySelect = document.getElementById('city-select');
  const prayerCards = document.querySelectorAll('.prayer-card');

  // Load prayer times from API
  async function loadPrayerTimes(city) {
    try {
      const res = await fetch('/api/prayer-times?city=' + encodeURIComponent(city));
      const data = await res.json();
      if (data.times) {
        // Update prayer cards with real data
        const times = data.times;
        prayerCards.forEach(card => {
          const name = card.querySelector('h4')?.textContent.toLowerCase();
          if (name && times[name]) {
            card.querySelector('div > div:last-child > div:first-child').textContent = times[name];
          }
        });
      }
    } catch (err) {
      console.error('Failed to load prayer times:', err);
    }
  }

  if (citySelect) {
    citySelect.addEventListener('change', () => loadPrayerTimes(citySelect.value));
    loadPrayerTimes(citySelect.value);
  }
}

// ---- DONASI PAGE ----
if (document.getElementById('donation-form')) {
  document.getElementById('donation-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const data = Form.serialize(form);

    // Save to DB via API
    const payload = {
      donor_name: data['donor-name'],
      donor_email: data['donor-email'],
      amount: Number(data['donation-amount']),
      program: data['donation-program'],
      method: data['donation-method'],
      note: data['donation-note'] || ''
    };

    fetch('/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(result => {
      if (result.status === 'success') {
        Form.clear(form);
        Notification.success('Terima kasih! Pesan Anda akan dikirim via WhatsApp.');
        // Open WhatsApp
        const message = `Halo, saya ingin mengirim pesan melalui website:\nNama: ${data.name}\nEmail: ${data.email}\nNo. WhatsApp: ${data.phone}\nSubjek: ${data.subject}\nPesan: ${data.message}`;
        setTimeout(() => {
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }, 1000);
      } else {
        Notification.error(result.message || 'Gagal mengirim pesan');
      }
    }).catch(err => {
      console.error('Contact error:', err);
      Notification.error('Terjadi kesalahan. Silakan coba lagi.');
    });
  });
}

// ---- KEGIATAN PAGE ----
if (document.querySelectorAll('[data-filter]').length > 0 && document.querySelector('.activity-card')) {
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-primary-outline');
      });
      btn.classList.remove('btn-primary-outline');
      btn.classList.add('btn-primary');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.activity-card').forEach(card => {
        card.style.display = (filter === '*' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });

  // Load activities from API
  async function loadActivities() {
    try {
      const res = await fetch('/api/activities');
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const container = document.querySelector('.grid-3');
        if (container) {
          container.innerHTML = data.data.map(act => `
            <div class="activity-card" data-category="${act.category?.toLowerCase() || 'umum'}">
              <div class="activity-image">
                <img src="${act.image || '/images/Masjid.png'}" alt="${act.title}" style="width:100%;height:100%;object-fit:cover;">
              </div>
              <div class="activity-content">
                <span class="badge ${act.category === 'Kajian' ? 'badge-primary' : 'badge-secondary'}">${act.category || 'Umum'}</span>
                <h4 class="activity-title">${act.title}</h4>
                <div class="activity-meta">
                  <div class="activity-meta-item">📅 ${act.date} ${act.time || ''}</div>
                  <div class="activity-meta-item">👤 ${act.speaker || '-'}</div>
                  <div class="activity-meta-item">📍 ${act.location || '-'}</div>
                </div>
                <p class="activity-description">${act.description || ''}</p>
                <div class="activity-footer">
                  <a href="/kegiatan/${act.slug || act.id}" class="btn btn-primary btn-sm">Detail</a>
                  <a href="https://wa.me/" class="btn btn-primary-outline btn-sm">Daftar</a>
                </div>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  }
  loadActivities();
}

// ---- ARTIKEL PAGE ----
if (document.querySelectorAll('[data-filter]').length > 0 && document.querySelector('article.card')) {
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-primary-outline');
      });
      btn.classList.remove('btn-primary-outline');
      btn.classList.add('btn-primary');
      const filter = btn.dataset.filter;
      document.querySelectorAll('article.card').forEach(card => {
        card.style.display = (filter === '*' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });

  // Load articles from API
  async function loadArticles() {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const container = document.querySelector('.grid-3');
        if (container) {
          container.innerHTML = data.data.map(article => `
            <article class="card" data-category="${article.category?.toLowerCase() || 'umum'}">
              <div style="background: linear-gradient(135deg, #10b981, #34d399); height: 200px; border-radius: var(--radius-lg); margin-bottom: var(--spacing-6); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">📖</div>
              <span class="badge ${article.category === 'Fiqih' ? 'badge-primary' : 'badge-secondary'}" style="margin-bottom: var(--spacing-4);">${article.category || 'Umum'}</span>
              <h3>${article.title}</h3>
              <p style="color: var(--gray);">${article.content?.substring(0, 100) || ''}...</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--spacing-6); padding-top: var(--spacing-6); border-top: 1px solid var(--gray-light);">
                <small style="color: var(--gray);">${new Date(article.created_at).toLocaleDateString('id-ID')}</small>
                <a href="/artikel/${article.slug || article.id}" class="btn btn-primary btn-sm">Baca</a>
              </div>
            </article>
          `).join('');
        }
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    }
  }
  loadArticles();
}

// ---- MEDIA PAGE ----
if (document.querySelectorAll('[data-filter]').length > 0 && document.querySelector('.gallery-item')) {
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-primary-outline');
      });
      btn.classList.remove('btn-primary-outline');
      btn.classList.add('btn-primary');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.gallery-item').forEach(card => {
        card.style.display = (filter === '*' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });

  // Load gallery from API
  async function loadGallery() {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const container = document.querySelector('.gallery-grid');
        if (container) {
          container.innerHTML = data.data.map(item => `
            <div class="gallery-item" data-category="${item.category?.toLowerCase() || 'umum'}">
              <div class="gallery-placeholder" style="background: linear-gradient(135deg, #10b981, #059669);">${item.type === 'video' ? '▶' : '📸'}</div>
              <div class="gallery-overlay">
                <h4>${item.title}</h4>
                <p>📸 ${item.image_count || 1} foto • ${new Date(item.created_at).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    }
  }
  loadGallery();
}

// ---- CLERK PUBLISHABLE KEY ----
// Config is loaded from /api/config in utils.js - no hardcoded keys here
if (typeof CONFIG !== 'undefined' && CONFIG.clerkPublishableKey) {
  // CONFIG.clerkPublishableKey is set by utils.js
}
