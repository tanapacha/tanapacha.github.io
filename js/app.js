/* =========================================================
   KIDDO LEARNING — App Core (V8.0 - ULTRA SMOOTH)
   ========================================================= */

const Icon = {
  home:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  book:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  bookOpen: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  plus:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  alert:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  task:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  chart:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  logout:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  users:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  play:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
  upload:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  award:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
  puzzle:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.611a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877L2.294 12.29A2.404 2.404 0 0 1 1.588 10.585c0-.617.236-1.234.706-1.704L3.905 7.27c.218-.218.515-.342.837-.276.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.611a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.969a2.501 2.501 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/></svg>`,
  code:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  menu:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
  close:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  wifi:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  wifiOff: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  target:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  pieChart:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
  layout:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
  layers:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>`,
  filePlus:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  clipboardPlus: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  helpCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  gamepad: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"/><path d="M6 12h4"/><path d="M8 10v4"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/></svg>`,
  clipboardCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><polyline points="8 14 11 17 16 12"/></svg>`
};


/* ─── Core UI Module ───────────────────────────────────────── */
window.UI = {
  showLoading(text = 'กำลังโหลด...') {
    let overlay = document.getElementById('globalLoader');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalLoader';
      overlay.className = 'loader-overlay';
      overlay.innerHTML = '<div class="spinner"></div><div class="t-small fw-bold" id="loaderText" style="margin-top:16px;"></div>';
      document.body.appendChild(overlay);
    }
    document.getElementById('loaderText').textContent = text;
    overlay.classList.add('active');
  },

  hideLoading() {
    document.getElementById('globalLoader')?.classList.remove('active');
  },

  initIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => {
      const name = el.dataset.icon;
      if (Icon[name]) el.innerHTML = Icon[name];
    });
  },

  setupUserMenu(user) {
    if (!user) return;
    document.querySelectorAll('[data-user="name"]').forEach(el => { el.textContent = user.name || '—'; });
    const avatar = document.getElementById('userAvatar');
    const skeleton = document.getElementById('userAvatarSkeleton');
    if (avatar) {
      avatar.textContent = (user.name || '?').charAt(0);
      avatar.style.display = 'flex';
      skeleton?.classList.add('hidden');
    }
    if (user.role === 'admin' || user.role === 'teacher') {
      document.querySelectorAll('.admin-only').forEach(el => { el.style.display = 'block'; });
    }
  },

  /* ─── Premium Toast Notification System ──────────────────── */
  toast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const iconMap = { success: 'checkCircle', error: 'alert', warning: 'alert', info: 'bookOpen' };
    toast.innerHTML = `
      <div class="toast-icon" data-icon="${iconMap[type] || 'alert'}"></div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;
    
    container.appendChild(toast);
    UI.initIcons();

    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(24px)';
      toast.style.transition = 'all 280ms var(--ease-premium)';
      setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(() => { if (toast.parentNode) dismiss(); }, 4000);
  },

  /* ─── Smooth skeleton → content replacement ──────────────── */
  revealContent(container, html) {
    container.querySelectorAll('.skeleton').forEach(el => el.classList.add('fade-out'));
    setTimeout(() => {
      container.querySelectorAll('.skeleton').forEach(el => el.remove());
      const wrapper = document.createElement('div');
      wrapper.className = 'content-reveal';
      wrapper.innerHTML = html;
      container.appendChild(wrapper);
      UI.initIcons();
    }, 220);
  },

  /* ─── Smooth skeleton removal (global helper) ────────────── */
  fadeSkeletons() {
    document.querySelectorAll('.skeleton').forEach(el => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 350);
    });
  },

  /* ─── Button loading state ───────────────────────────────── */
  btnLoading(btn, loading = true) {
    if (!btn) return;
    if (loading) {
      btn._origText = btn.innerHTML;
      btn.classList.add('is-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      if (btn._origText) btn.innerHTML = btn._origText;
    }
  },

  /* ─── Top Progress Bar (navigation feedback) ─────────────── */
  _progressBar: null,
  showProgress() {
    if (!this._progressBar) {
      this._progressBar = document.createElement('div');
      this._progressBar.className = 'top-progress-bar';
      document.body.prepend(this._progressBar);
    }
    this._progressBar.classList.remove('done');
    this._progressBar.classList.add('active');
  },
  hideProgress() {
    if (this._progressBar) {
      this._progressBar.classList.add('done');
      setTimeout(() => {
        this._progressBar?.classList.remove('active', 'done');
      }, 500);
    }
  }
};


/* ─── Utility: Debounce ────────────────────────────────────── */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ─── Ripple Effect for Buttons ────────────────────────────── */
function createRipple(event) {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  button.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

/* ─── Scroll-triggered Entrance Animations ─────────────────── */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.scroll-reveal').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

/* ─── Stat Number Count-Up Animation ───────────────────────── */
function animateCountUp(element, target, duration = 800) {
  const startTime = performance.now();
  const isPercent = String(target).includes('%');
  const numTarget = parseFloat(target);
  
  if (isNaN(numTarget) || numTarget === 0) {
    element.textContent = target;
    return;
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
    const current = Math.round(eased * numTarget);
    
    element.textContent = current + (isPercent ? '%' : '');
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.classList.add('pulse');
      setTimeout(() => element.classList.remove('pulse'), 600);
    }
  }
  
  requestAnimationFrame(update);
}

/* ─── Page Transition System ───────────────────────────────── */
function initPageTransitions() {
  if (document.startViewTransition) return; // native support

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript') || 
        href.startsWith('http') || link.target === '_blank') return;

    e.preventDefault();
    document.body.classList.add('page-exit');
    UI.showProgress();
    
    setTimeout(() => { window.location.href = href; }, 180);
  });
}

/* ─── Link Prefetch on Hover ───────────────────────────────── */
function initLinkPrefetch() {
  const prefetched = new Set();
  document.addEventListener('pointerenter', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript') ||
        href.startsWith('http') || prefetched.has(href)) return;
    
    prefetched.add(href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = href;
    document.head.appendChild(hint);
  }, { passive: true, capture: true });
}

/* ─── Mobile Sidebar System ────────────────────────────────── */
function initMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const pageHeader = document.querySelector('.page-header');
  if (!sidebar || !pageHeader) return;
  if (document.querySelector('.sidebar-toggle')) return;

  const toggle = document.createElement('button');
  toggle.className = 'sidebar-toggle';
  toggle.setAttribute('aria-label', 'เปิดเมนู');
  toggle.innerHTML = '<span data-icon="menu"></span>';
  pageHeader.prepend(toggle);

  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    toggle.innerHTML = '<span data-icon="close"></span>';
    document.body.style.overflow = 'hidden'; // prevent scroll behind
    UI.initIcons();
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    toggle.innerHTML = '<span data-icon="menu"></span>';
    document.body.style.overflow = '';
    UI.initIcons();
  }

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
  });

  sidebar.querySelectorAll('.sidebar-nav-item, .sidebar-sub-item').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  UI.initIcons();
}

/* ─── Network Status Indicator ─────────────────────────────── */
function initNetworkStatus() {
  function showOffline() {
    if (document.querySelector('.network-toast')) return;
    const el = document.createElement('div');
    el.className = 'network-toast offline';
    el.innerHTML = '<span data-icon="wifiOff"></span> ขาดการเชื่อมต่ออินเทอร์เน็ต';
    document.body.appendChild(el);
    UI.initIcons();
  }

  function showOnline() {
    const existing = document.querySelector('.network-toast.offline');
    if (existing) {
      existing.className = 'network-toast online';
      existing.innerHTML = '<span data-icon="wifi"></span> เชื่อมต่อแล้ว';
      UI.initIcons();
      setTimeout(() => {
        existing.style.opacity = '0';
        existing.style.transform = 'translateY(-100%)';
        setTimeout(() => existing.remove(), 300);
      }, 2000);
    }
  }

  window.addEventListener('offline', showOffline);
  window.addEventListener('online', showOnline);
}

/* ─── Input Debounce Auto-attach ───────────────────────────── */
function initSearchDebounce() {
  document.querySelectorAll('input[data-debounce]').forEach(input => {
    const handler = input.getAttribute('data-debounce');
    if (window[handler]) {
      input.addEventListener('input', debounce((e) => window[handler](e.target.value), 350));
    }
  });
}

/* ─── DOM Ready ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const user = window.Auth?.get();
  if (user) {
    UI.setupUserMenu(user);
    // Highlight active sidebar link
    const currentFile = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-nav-item, .sidebar-sub-item').forEach(link => {
      link.classList.remove('active');
      if (link.classList.contains('sidebar-sub-item')) link.style.color = 'var(--text-secondary)';
      
      const targetPage = link.getAttribute('data-page') || link.getAttribute('href');
      if (targetPage && currentFile.includes(targetPage)) {
        link.classList.add('active');
        if (link.classList.contains('sidebar-sub-item')) link.style.color = 'var(--color-primary-600)';
      }
    });

    const activeSub = document.querySelector('.sidebar-sub-item.active');
    if (activeSub) {
      const parentManage = document.querySelector('.sidebar-nav-item[data-page="teacher-manage-content.html"]');
      if (parentManage) parentManage.classList.add('active');
    }
  }
  
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });
  });

  UI.initIcons();

  // Ripple on all buttons
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', createRipple);
  });

  // Initialize all systems
  initScrollAnimations();
  initPageTransitions();
  initLinkPrefetch();
  initMobileSidebar();
  initNetworkStatus();
  initSearchDebounce();

  // Auto-stagger grid containers
  document.querySelectorAll('.grid-2, .grid-3, .grid-4, .grid-auto').forEach(grid => {
    if (!grid.classList.contains('stagger-in')) grid.classList.add('stagger-in');
  });

  // Improved focus management for form inputs
  document.querySelectorAll('.form-control, .input, input, select, textarea').forEach(el => {
    el.addEventListener('focus', () => el.closest('.form-group')?.classList.add('is-focused'));
    el.addEventListener('blur',  () => el.closest('.form-group')?.classList.remove('is-focused'));
  });
});

/* ─── Global Native Alert Override ─────────────────────────── */
window.alert = function(message) {
  if (window.UI && window.UI.toast) {
    const msg = String(message).toLowerCase();
    let type = 'info';
    if (msg.includes('สำเร็จ') || msg.includes('เรียบร้อย') || msg.includes('บันทึกแล้ว') || msg.includes('ถูกต้อง')) {
      type = 'success';
    } else if (msg.includes('ผิดพลาด') || msg.includes('ไม่ได้') || msg.includes('กรุณา') || msg.includes('ไม่ถูกต้อง') || msg.includes('ครบ')) {
      type = 'error';
    }
    window.UI.toast(message, type);
  } else {
    console.warn('[KIDDO] Alert fallback:', message);
  }
};
