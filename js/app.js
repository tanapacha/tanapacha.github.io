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
  monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`
};


window.UI = {
  showLoading: function(text = 'กำลังโหลด...') {
    let overlay = document.getElementById('globalLoader');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalLoader';
      overlay.className = 'loader-overlay';
      overlay.innerHTML = '<div class="spinner"></div><div class="t-small fw-bold" id="loaderText" style="margin-top:16px;"></div>';
      document.body.appendChild(overlay);
    }
    const textEl = document.getElementById('loaderText');
    if (textEl) textEl.textContent = text;
    overlay.classList.add('active');
  },
  hideLoading: function() {
    document.getElementById('globalLoader')?.classList.remove('active');
  },
  initIcons: function() {
    document.querySelectorAll('[data-icon]').forEach(el => {
      const name = el.dataset.icon;
      if (Icon[name]) el.innerHTML = Icon[name];
    });
  },
  setupUserMenu: function(user) {
    if (!user) return;
    document.querySelectorAll('[data-user="name"]').forEach(el => { el.textContent = user.name || '—'; });
    const avatar = document.getElementById('userAvatar');
    const skeleton = document.getElementById('userAvatarSkeleton');
    if (avatar) {
      avatar.textContent = (user.name || '?').charAt(0);
      avatar.style.display = 'flex';
      skeleton?.classList.add('hidden');
    }
    
    // Unhide teacher menus if user is admin
    if (user.role === 'admin' || user.role === 'teacher') {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'block';
      });
    }
  },
  toast: function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const user = window.Auth?.get();
  if (user) {
    UI.setupUserMenu(user);
    // Active sidebar
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
});

