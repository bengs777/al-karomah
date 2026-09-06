/* ============================================
   JAVASCRIPT UTILITIES & HELPERS
   ============================================ */

// Konfigurasi Global
const CONFIG = {
  baseUrl: window.location.origin,
  apiUrl: '/api',
  masjidName: 'Masjid Al Karomah',
  whatsappPhone: '6281234567890',
  email: 'admin@alkaromah.com',
  clerkPublishableKey: '',
  clerkFrontendApi: ''
};

// Fetch config from server
(async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.clerkPublishableKey) {
      CONFIG.clerkPublishableKey = data.clerkPublishableKey;
    }
    if (data.clerkFrontendApi) {
      CONFIG.clerkFrontendApi = data.clerkFrontendApi;
    }
    if (data.appName) {
      CONFIG.masjidName = data.appName;
    }
  } catch (err) {
    console.warn('Failed to load config, using defaults');
  }
})();

// ---- CLERK AUTH ----

const Auth = {
  async init() {
    if (typeof Clerk !== 'undefined') {
      await Clerk.load({
        publishableKey: CONFIG.clerkPublishableKey
      });
      this.updateNavbar();
      this.setupAuthListeners();
    }
  },

  isSignedIn() {
    return typeof Clerk !== 'undefined' && Clerk.session !== null;
  },

  async getUser() {
    if (this.isSignedIn() && typeof Clerk !== 'undefined') {
      return await Clerk.user;
    }
    return null;
  },

  async getUserInfo() {
    try {
      const response = await fetch('/api/user/me');
      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  },

  async signIn() {
    if (typeof Clerk !== 'undefined') {
      window.location.href = '/signin';
    }
  },

  async signOut() {
    if (typeof Clerk !== 'undefined') {
      await Clerk.signOut();
      window.location.href = '/';
    }
  },

  updateNavbar() {
    const navbar = DOM.$('.navbar');
    const adminLink = DOM.$('.navbar-menu a[href="/admin"]');
    if (!navbar || !adminLink) return;

    // First check user role via API
    this.getUserInfo().then(userInfo => {
      if (!userInfo) {
        // Fallback to default (not logged in)
        this.renderLoggedOutNavbar(adminLink);
        return;
      }

      if (userInfo.isAdmin) {
        // Admin menu
        const adminButton = DOM.create('button', {
          className: 'btn btn-primary btn-sm',
          id: 'admin-menu-btn'
        }, '🎛️ Admin');
        adminLink.parentElement.replaceChild(adminButton, adminLink);
        this.createAdminDropdown(navbar, userInfo);
      } else {
        // Regular user menu
        const userButton = DOM.create('button', {
          className: 'btn btn-primary btn-sm',
          id: 'user-menu-btn'
        }, '👤 Menu');
        adminLink.parentElement.replaceChild(userButton, adminLink);
        this.createUserDropdown(navbar, userInfo);
      }
    });
  },

  renderLoggedOutNavbar(adminLink) {
    const loginBtn = DOM.create('button', {
      className: 'btn btn-primary btn-sm',
      id: 'login-btn'
    }, '🔐 Masuk');
    const signupBtn = DOM.create('button', {
      className: 'btn btn-secondary btn-sm',
      id: 'signup-btn',
      style: 'margin-left: var(--spacing-3);'
    }, '📝 Daftar');
    const googleBtn = DOM.create('button', {
      className: 'btn btn-primary-outline btn-sm',
      id: 'google-login-btn',
      style: 'margin-left: var(--spacing-3);'
    }, '🔍 Google');

    const li = adminLink.parentElement;
    li.innerHTML = '';
    li.appendChild(loginBtn);
    li.appendChild(signupBtn);
    li.appendChild(googleBtn);

    loginBtn.addEventListener('click', () => window.location.href = '/signin');
    signupBtn.addEventListener('click', () => window.location.href = '/signup');
    googleBtn.addEventListener('click', () => {
      if (typeof Clerk !== 'undefined') {
        Clerk.redirectToSignIn({ strategy: 'google', redirectUrl: '/' });
      } else {
        window.location.href = '/signin';
      }
    });
  },

  createUserDropdown(navbar, userInfo) {
    const existingMenu = DOM.$('#user-dropdown');
    if (existingMenu) existingMenu.remove();

    const userBtn = DOM.$('#user-menu-btn');
    if (!userBtn) return;

    const dropdown = DOM.create('div', {
      id: 'user-dropdown',
      style: 'position: absolute; top: 70px; right: 1rem; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); min-width: 200px; z-index: 1000; display: none;'
    });

    const name = userInfo?.firstName && userInfo?.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : (userInfo?.email || 'User');

    dropdown.innerHTML = `
      <div style="padding: var(--spacing-4); border-bottom: 1px solid var(--gray-light);">
        <div style="font-weight: bold; color: var(--dark);">${name}</div>
        <div style="font-size: var(--text-sm); color: var(--gray);">${userInfo.email || ''}</div>
      </div>
      <a href="/dashboard" style="display: block; padding: var(--spacing-3) var(--spacing-4); color: var(--dark); text-decoration: none;">
        🏠 Dashboard Saya
      </a>
      <a href="/request/sertifikat-kurban" style="display: block; padding: var(--spacing-3) var(--spacing-4); color: var(--dark); text-decoration: none;">
        📝 Ajukan Sertifikat Kurban
      </a>
      <button id="logout-btn" class="btn btn-primary-outline btn-sm" style="width: calc(100% - 1rem); margin: var(--spacing-2);">
        🔐 Keluar
      </button>
    `;

    navbar.appendChild(dropdown);

    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    DOM.$('#logout-btn')?.addEventListener('click', () => this.signOut());

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });
  },

  createAdminDropdown(navbar, userInfo) {
    const existingMenu = DOM.$('#admin-dropdown');
    if (existingMenu) existingMenu.remove();

    const adminBtn = DOM.$('#admin-menu-btn');
    if (!adminBtn) return;

    const dropdown = DOM.create('div', {
      id: 'admin-dropdown',
      style: 'position: absolute; top: 70px; right: 1rem; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); min-width: 200px; z-index: 1000; display: none;'
    });

    const name = userInfo?.firstName && userInfo?.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : 'Admin';

    dropdown.innerHTML = `
      <div style="padding: var(--spacing-4); border-bottom: 1px solid var(--gray-light);">
        <div style="font-weight: bold; color: var(--dark);">${name}</div>
        <div style="font-size: var(--text-sm); color: var(--gray);">${userInfo.email || ''}</div>
      </div>
      <a href="/admin" style="display: block; padding: var(--spacing-3) var(--spacing-4); color: var(--dark); text-decoration: none;">
        📊 Dashboard Admin
      </a>
      <a href="/admin/requests" style="display: block; padding: var(--spacing-3) var(--spacing-4); color: var(--dark); text-decoration: none;">
        📋 Pengajuan Sertifikat
      </a>
      <button id="logout-btn-admin" class="btn btn-primary-outline btn-sm" style="width: calc(100% - 1rem); margin: var(--spacing-2);">
        🔐 Keluar
      </button>
    `;

    navbar.appendChild(dropdown);

    adminBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    DOM.$('#logout-btn-admin')?.addEventListener('click', () => this.signOut());

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });
  },

  setupAuthListeners() {
    Clerk.addListener(({ signIn }) => {
      this.updateNavbar();
    });
  }
};

// ---- DOM UTILITIES ----

const DOM = {
  // Select element
  $(selector) {
    return document.querySelector(selector);
  },
  
  // Select all elements
  $$(selector) {
    return document.querySelectorAll(selector);
  },
  
  // Create element
  create(tag, attrs = {}, html = '') {
    const element = document.createElement(tag);
    Object.assign(element, attrs);
    if (html) element.innerHTML = html;
    return element;
  },
  
  // Add class
  addClass(element, className) {
    element.classList.add(className);
  },
  
  // Remove class
  removeClass(element, className) {
    element.classList.remove(className);
  },
  
  // Toggle class
  toggleClass(element, className) {
    element.classList.toggle(className);
  },
  
  // Check if has class
  hasClass(element, className) {
    return element.classList.contains(className);
  },
  
  // Set attribute
  attr(element, name, value) {
    if (value === undefined) {
      return element.getAttribute(name);
    }
    element.setAttribute(name, value);
  },
  
  // Hide element
  hide(element) {
    element.style.display = 'none';
  },
  
  // Show element
  show(element) {
    element.style.display = '';
  }
};

// ---- API UTILITIES ----

const API = {
  async fetch(endpoint, options = {}) {
    const url = `${CONFIG.apiUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  // GET request
  async get(endpoint) {
    return this.fetch(endpoint, { method: 'GET' });
  },
  
  // POST request
  async post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // PUT request
  async put(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  // DELETE request
  async delete(endpoint) {
    return this.fetch(endpoint, { method: 'DELETE' });
  }
};

// ---- STORAGE UTILITIES ----

const Storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  get(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  
  remove(key) {
    localStorage.removeItem(key);
  },
  
  clear() {
    localStorage.clear();
  }
};

// ---- NOTIFICATION UTILITIES ----

const Notification = {
  show(message, type = 'info', duration = 3000) {
    const container = DOM.$('#notification-container');
    if (!container) {
      const div = DOM.create('div', { id: 'notification-container' });
      document.body.appendChild(div);
    }
    
    const notif = DOM.create('div', {
      className: `notification notification-${type} animate-slide-up`
    }, message);
    
    DOM.$('#notification-container').appendChild(notif);
    
    setTimeout(() => {
      notif.remove();
    }, duration);
  },
  
  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  },
  
  error(message, duration = 3000) {
    this.show(message, 'error', duration);
  },
  
  warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  },
  
  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }
};

// ---- TIME UTILITIES ----

const TimeUtils = {
  formatDate(date, format = 'DD/MM/YYYY') {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('HH', hours)
      .replace('mm', minutes);
  },
  
  formatTime(date) {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  daysUntil(date) {
    const today = new Date();
    const target = new Date(date);
    const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  }
};

// ---- FORM UTILITIES ----

const Form = {
  serialize(form) {
    const data = new FormData(form);
    const obj = {};
    for (let [key, value] of data.entries()) {
      obj[key] = value;
    }
    return obj;
  },
  
  validate(form) {
    const inputs = form.querySelectorAll('[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.style.borderColor = 'var(--accent)';
        isValid = false;
      } else {
        input.style.borderColor = '';
      }
    });
    
    return isValid;
  },
  
  clear(form) {
    form.reset();
    form.querySelectorAll('input, textarea').forEach(el => {
      el.style.borderColor = '';
    });
  }
};

// ---- SCROLL UTILITIES ----

const Scroll = {
  getScrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop;
  },
  
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0
    );
  },
  
  scrollToElement(element, offset = 80) {
    const top = element.offsetTop - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  },
  
  onScroll(callback) {
    window.addEventListener('scroll', callback, { passive: true });
  }
};

// ---- INIT FUNCTIONS ----

function initNavbar() {
  const navbar = DOM.$('.navbar');
  const navbarToggle = DOM.$('.navbar-toggle');
  const navbarMenu = DOM.$('.navbar-menu');
  let lastScrollTop = 0;
  
  if (!navbar) return;
  
  // Toggle mobile menu
  if (navbarToggle) {
    navbarToggle.addEventListener('click', () => {
      DOM.toggleClass(navbarMenu, 'active');
    });
  }
  
  // Close menu when link clicked
  DOM.$$('.navbar-menu a').forEach(link => {
    link.addEventListener('click', () => {
      DOM.removeClass(navbarMenu, 'active');
    });
  });
  
  // Hide navbar on scroll
  Scroll.onScroll(() => {
    const scrollTop = Scroll.getScrollTop();
    if (scrollTop > lastScrollTop + 100) {
      DOM.addClass(navbar, 'hide');
    } else if (scrollTop < lastScrollTop - 100) {
      DOM.removeClass(navbar, 'hide');
    }
    lastScrollTop = scrollTop;
  });
}

function initActiveLink() {
  const currentPath = window.location.pathname;
  DOM.$$('.navbar-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/')) {
      DOM.addClass(link, 'active');
    } else {
      DOM.removeClass(link, 'active');
    }
  });
}

function initSmoothScroll() {
  DOM.$$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = DOM.$(`#${targetId}`);
      if (target) {
        Scroll.scrollToElement(target);
      }
    });
  });
}

function initFloatingButtons() {
  const whatsappBtn = DOM.$('.whatsapp-btn');
  if (whatsappBtn) {
    whatsappBtn.href = `https://wa.me/${CONFIG.whatsappPhone}?text=Assalamu%20alaikum,%20saya%20ingin%20menghubungi%20${CONFIG.masjidName}`;
  }
}

function initScrollProgress() {
  const bar = DOM.$('.scroll-progress');
  if (!bar) return;
  Scroll.onScroll(() => {
    const scrollTop = Scroll.getScrollTop();
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  });
}

function initAnimations() {
  const elements = DOM.$$('[data-animate]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const animation = entry.target.dataset.animate;
        DOM.addClass(entry.target, `animate-${animation}`);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  elements.forEach(el => observer.observe(el));
}

// ---- INIT ALL ----

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initActiveLink();
  initSmoothScroll();
  initFloatingButtons();
  initScrollProgress();
  initAnimations();
  await Auth.init();
});
