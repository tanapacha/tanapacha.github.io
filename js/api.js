/**
 * KIDDO LEARNING - API Service
 * ────────────────────────────
 * ใช้สำหรับเชื่อมต่อกับ Google Apps Script Backend
 */

const API_CONFIG = {
  // TODO: นำ Web App URL ที่ได้จาก Google Apps Script มาใส่ที่นี่
  BASE_URL: "https://script.google.com/macros/s/AKfycbyxcKRcXx9AoDn-jr-9apwDrlncnQAJmJBDNXTrm-8izvXt1g3RoFjzu2lGi-MppV4ZAA/exec",
  CACHE_TIME: 300000 // 5 minutes
};

const ApiService = {
  _cache: {},

  _getCached(key) {
    // 1. เช็คใน Memory ก่อน
    const cached = this._cache[key];
    if (cached && (Date.now() - cached.time < API_CONFIG.CACHE_TIME)) {
      return cached.data;
    }

    // 2. ถ้าไม่มีใน Memory ให้เช็คใน LocalStorage (ใช้สำหรับ Instant Load)
    const stored = localStorage.getItem('API_CACHE_' + key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // ถ้าข้อมูลยังไม่เก่าเกินไป (เช่น 1 ชม.) ให้ส่งกลับไปก่อนเลยเพื่อความไว
      if (Date.now() - parsed.time < 3600000) {
        return parsed.data;
      }
    }
    return null;
  },

  _setCache(key, data) {
    const entry = { data, time: Date.now() };
    this._cache[key] = entry;
    localStorage.setItem('API_CACHE_' + key, JSON.stringify(entry));
  },

  /**
   * ส่งคำขอแบบ POST ไปยัง Google Apps Script
   */
  async post(action, payload, showLoader = true) {
    if (showLoader) window.UI?.showLoading(action === 'login' ? 'กำลังตรวจสอบ...' : 'กำลังบันทึกข้อมูล...');
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000);

    try {
      const user = window.Auth ? window.Auth.get() : null;
      const token = user ? (user.token || user.id) : null; // ใช้ session token จาก login response
      const data = { action: action, token: token, ...payload };
      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      clearTimeout(id);
      
      const result = await response.json();
      
      if (showLoader) {
        if (result.status === 'success') {
          window.UI?.toast(result.message || 'ดำเนินการสำเร็จ', 'success');
        } else {
          window.UI?.toast(result.message || 'เกิดข้อผิดพลาด', 'error');
        }
      }
      
      return result;
    } catch (error) {
      clearTimeout(id);
      // Retry logic (max 2 retries for non-login actions)
      if (action !== 'login' && !this._retryCount) {
        this._retryCount = (this._retryCount || 0) + 1;
        console.warn(`[KIDDO API] Retrying ${action}... (attempt ${this._retryCount})`);
        await new Promise(r => setTimeout(r, 1000 * this._retryCount));
        const retryResult = await this.post(action, payload, false);
        this._retryCount = 0;
        return retryResult;
      }
      this._retryCount = 0;
      console.error("API POST Error:", error);
      const msg = error.name === 'AbortError' ? "การเชื่อมต่อหมดเวลา" : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
      if (showLoader) window.UI?.toast(msg, 'error');
      return { status: "error", message: msg };
    } finally {
      if (showLoader) window.UI?.hideLoading();
    }
  },

  /**
   * ส่งคำขอแบบ GET ไปยัง Google Apps Script
   */
  async get(action, params = {}, useCache = true) {
    const silent = params.silent === true;
    if (!silent) window.UI?.showLoading('กำลังโหลดข้อมูล...');
    
    const cacheKey = `GET_${action}_${JSON.stringify(params)}`;

    if (useCache) {
      const cached = this._getCached(cacheKey);
      if (cached) {
        if (!silent) window.UI?.hideLoading();
        return cached;
      }
    }

    try {
      const url = new URL(API_CONFIG.BASE_URL);
      url.searchParams.append('action', action);

      for (const key in params) {
        if (key !== 'silent') url.searchParams.append(key, params[key]);
      }

      const response = await fetch(url);
      // Bug Fix: parse as text first, then JSON (per Debug Skill Section 3.3)
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        console.error('[KIDDO] GAS returned non-JSON:', text.slice(0, 200));
        return { status: "error", message: "Backend ส่งข้อมูลผิดปกติ กรุณาลองใหม่" };
      }
      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("API Error:", error);
      return { status: "error", message: error.message };
    } finally {
      if (!silent) window.UI?.hideLoading();
    }
  },

  // --- ฟังก์ชันสำหรับการใช้งานเฉพาะเจาะจง ---

  async login(email, password) {
    return this.post("login", { email, password }, false);
  },

  async register(userData) {
    return this.post("register", userData, false);
  },

  async getDashboardData(user) {
    const cacheKey = `GET_getDashboardData_${JSON.stringify({id: user.id, role: user.role})}`;
    
    // Attempt to get from cache for Instant UI
    const cached = this._getCached(cacheKey);
    
    try {
      const result = await this.get("getDashboardData", { id: user.id, role: user.role }, true);
      // If we have lessons, cache them too
      if (result.status === 'success' && result.lessons) {
        this._setCache("GET_getLessons_{}", { status: "success", data: result.lessons });
      }
      return result;
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      return cached || { status: "error", message: "ไม่สามารถโหลดข้อมูลได้" };
    }
  },


  async getAssignments() {
    return this.get("getAssignments");
  },

  async getLessons(gradeFilter) {
    const params = {};
    if (gradeFilter) params.grade = gradeFilter;
    return this.get("getLessons", params, false);
  },

  async getUsers() {
    return this.get("getUsers");
  },

  async getQuizzes(lessonId, grade) {
    const params = {};
    if (lessonId) params.lessonId = lessonId;
    if (grade) params.grade = grade;
    return this.get("getQuizzes", params, false);
  },

  async submitAssignment(studentId, studentName, lessonId, fileData) {
    this.clearCache(); // ล้าง Cache เมื่อมีการส่งงานใหม่
    return this.post("submitAssignment", {
      studentId,
      studentName,
      lessonId,
      ...fileData
    });
  },

  async gradeAssignment(submissionId, score, sticker, comment) {
    this.clearCache();
    return this.post("gradeAssignment", {
      submissionId,
      score,
      sticker,
      comment
    });
  },

  async createLesson(lessonData) {
    this.clearCache();
    return this.post("createLesson", lessonData, false);
  },

  async updateLesson(lessonData) {
    this.clearCache();
    return this.post("updateLesson", lessonData, false);
  },

  async deleteLesson(lessonId) {
    this.clearCache();
    return this.post("deleteLesson", { lessonId }, false);
  },

  async getTasks(grade) {
    const params = {};
    if (grade) params.grade = grade;
    return this.get("getTasks", params, false);
  },

  async saveTask(taskData) {
    this.clearCache();
    return this.post("saveTask", taskData, false);
  },

  async deleteTask(taskId) {
    this.clearCache();
    return this.post("deleteTask", { taskId }, false);
  },

  async createQuiz(quizData) {
    this.clearCache();
    return this.post("createQuiz", quizData, false);
  },

  async deleteQuiz(quizId) {
    this.clearCache();
    return this.post("deleteQuiz", { quizId }, false);
  },

  async saveQuizGrade(gradeData) {
    // gradeData: { studentId, lessonId, score, maxScore }
    this.clearCache();
    return this.post("saveQuizGrade", gradeData, false);
  },

  async saveBulkGrades(grades) {
    this.clearCache();
    return this.post("saveBulkGrades", { grades }, false);
  },

  async getGrades(studentId) {
    return this.get("getGrades", { studentId }, false);
  },

  /**
   * บันทึกข้อมูลบทเรียน/แบบฝึกหัด (ทั้งสร้างใหม่และแก้ไข)
   */
  async saveLesson(lessonData) {
    this.clearCache();
    const id = lessonData.ID || lessonData.id;
    if (id && !id.startsWith('EX') && !id.startsWith('new_')) {
      return this.post("updateLesson", lessonData, false);
    } else {
      return this.post("createLesson", lessonData, false);
    }
  },

  clearCache() {
    this._cache = {};
    // ล้างเฉพาะ cache ของ API
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('API_CACHE_')) {
        localStorage.removeItem(key);
      }
    });
    console.log("API Cache cleared");
  }
};

window.ApiService = ApiService;
