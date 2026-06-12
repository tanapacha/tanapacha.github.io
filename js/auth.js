/**
 * KIDDO LEARNING — Auth Service (V5.0 - Activity Refresh)
 */
const Auth = (() => {
  const SESSION_KEY = 'kiddo_session';
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 นาที
  let _activityListenerAttached = false;

  function _set(user) {
    if (!user) return;
    const session = {
      ...user,
      loginAt: Date.now(),
    };
    // ป้องกันการเก็บรหัสผ่านใน Session
    delete session.password;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /** Refresh session timestamp on user activity */
  function _refreshActivity() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      session.loginAt = Date.now();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {}
  }

  /** Attach activity listeners (once) to extend session on interaction */
  function _initActivityRefresh() {
    if (_activityListenerAttached) return;
    _activityListenerAttached = true;
    
    // Throttle: refresh at most once every 60 seconds
    let lastRefresh = 0;
    const throttledRefresh = () => {
      const now = Date.now();
      if (now - lastRefresh > 60000) {
        lastRefresh = now;
        _refreshActivity();
      }
    };

    ['click', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, throttledRefresh, { passive: true });
    });
  }

  function get() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      // Security: Session Expiry (30 นาที)
      if (session.loginAt && (Date.now() - session.loginAt > SESSION_TIMEOUT)) {
        console.warn('[KIDDO Security] Session expired');
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      // Start activity refresh if session is valid
      _initActivityRefresh();
      return session;
    } catch { return null; }
  }

  /**
   * ฟังก์ชัน Login หลัก
   */
  async function login(email, password) {
    if (!window.ApiService) return { ok: false, error: 'API Service not found' };
    
    try {
      const res = await ApiService.login(email, password);
      if (res.status === 'success') {
        // บันทึกข้อมูลผู้ใช้ (ซึ่งปกติจะอยู่ใน res.data หรือ res.user)
        const userData = res.data || res.user;
        _set(userData);
        return { ok: true, user: userData };
      }
      return { ok: false, error: res.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    } catch (err) {
      return { ok: false, error: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' };
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  }

  function requireAuth() {
    const user = get();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }

  function redirectIfAuth() {
    const user = get();
    if (user) {
      // ตรวจสอบ Role เพื่อส่งไปหน้า Dashboard ที่ถูกต้อง
      const role = (user.role || "").toLowerCase();
      if (role === 'admin' || role === 'teacher') {
        window.location.href = 'teacher-dashboard.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  }

  return { get, login, logout, requireAuth, redirectIfAuth };
})();

window.Auth = Auth;
