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

  async post(action, payload, showLoader = true, retryCount = 0) {
    const maxRetries = 2; // เพิ่มจำนวนครั้งในการลองใหม่สูงสุดเป็น 2 ครั้ง (รวม 3 ครั้ง)
    
    if (showLoader && retryCount === 0) {
       window.UI?.showLoading(action === 'login' ? 'กำลังตรวจสอบ...' : 'กำลังบันทึกข้อมูล...');
    } else if (showLoader && retryCount > 0) {
       window.UI?.showLoading(`กำลังพยายามเชื่อมต่อใหม่ (ครั้งที่ ${retryCount})...`);
    }
    
    const controller = new AbortController();
    // เพิ่มเวลา timeout เป็น 60 วินาทีให้ครอบคลุมการทำงานที่ช้าสุดๆ ของ Google Apps Script (Cold Starts)
    const id = setTimeout(() => controller.abort(), 60000); 

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
      
      // อ่านผลลัพธ์เป็นข้อความก่อน ป้องกันกรณีที่ Google ส่งหน้า Error HTML กลับมาแทน JSON
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        console.error('[KIDDO POST] GAS returned non-JSON:', text.slice(0, 200));
        throw new Error("Backend_Error"); // โยน Error ไปให้ระบบ Retry จัดการต่อ
      }
      
      // แสดงข้อความสำเร็จหรือผิดพลาด เฉพาะการทำงานครั้งแรก หรือสำเร็จในการ retry (หลีกเลี่ยงการ toast ซ้ำซ้อน)
      if (showLoader && retryCount === 0 && result.status !== 'success') {
         // กรณีโหลดครั้งแรกแล้วเฟลจาก backend (ไม่ถึงขั้น error ของ catch) ให้แสดงข้อความ
         window.UI?.toast(result.message || 'เกิดข้อผิดพลาด', 'error');
      } else if (showLoader && result.status === 'success') {
         window.UI?.toast(result.message || 'ดำเนินการสำเร็จ', 'success');
      }
      
      return result;
    } catch (error) {
      clearTimeout(id);
      
      // ระบบ Retry แบบอัตโนมัติ (ทำสำหรับทุก Action รวมถึง Login ด้วยเพราะมีโอกาสเจอ Cold Start)
      if (retryCount < maxRetries) {
        console.warn(`[KIDDO API] Retrying ${action}... (attempt ${retryCount + 1})`);
        // รอเวลาแบบทวีคูณ (1 วินาที, 2 วินาที) ก่อนลองใหม่ ช่วยให้ลดภาระเซิร์ฟเวอร์
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
        return this.post(action, payload, showLoader, retryCount + 1);
      }
      
      console.error("API POST Error:", error);
      const isTimeout = error.name === 'AbortError';
      const msg = isTimeout 
        ? "เซิร์ฟเวอร์ไม่ตอบสนองชั่วคราว กรุณาลองใหม่อีกครั้ง" 
        : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ หรือเซิร์ฟเวอร์มีปัญหา";
        
      if (showLoader) window.UI?.toast(msg, 'error');
      return { status: "error", message: msg };
    } finally {
      // ซ่อน Loader เมื่อทำงานเสร็จหรือสิ้นสุดการทำงานทั้งหมด (ถ้าเป็นการเรียกซ้อนกัน จะเคลียร์ตอนจบลูปหลัก)
      if (showLoader && retryCount === 0) window.UI?.hideLoading();
    }
  },

  async get(action, params = {}, useCache = true, retryCount = 0) {
    const maxRetries = 2;
    const silent = params.silent === true;
    
    if (!silent && retryCount === 0) {
       window.UI?.showLoading('กำลังโหลดข้อมูล...');
    } else if (!silent && retryCount > 0) {
       window.UI?.showLoading(`กำลังพยายามโหลดข้อมูลใหม่ (ครั้งที่ ${retryCount})...`);
    }
    
    const cacheKey = `GET_${action}_${JSON.stringify(params)}`;

    // ดึงจาก Cache (ดึงเฉพาะตอนเรียกครั้งแรกเท่านั้น ไม่ดึงตอน retry)
    if (useCache && retryCount === 0) {
      const cached = this._getCached(cacheKey);
      if (cached) {
        if (!silent) window.UI?.hideLoading();
        return cached;
      }
    }

    const controller = new AbortController();
    // 30s timeout สำหรับ GET เพื่อป้องกันผู้ใช้ค้างหน้าโหลดไปเรื่อยๆ หากเน็ตหลุด
    const id = setTimeout(() => controller.abort(), 30000); 

    try {
      const url = new URL(API_CONFIG.BASE_URL);
      url.searchParams.append('action', action);

      for (const key in params) {
        if (key !== 'silent') url.searchParams.append(key, params[key]);
      }

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      
      // Bug Fix: parse as text first, then JSON (per Debug Skill Section 3.3)
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        console.error('[KIDDO GET] GAS returned non-JSON:', text.slice(0, 200));
        throw new Error("Backend_Error");
      }
      
      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      clearTimeout(id);
      
      // Retry Logic สำหรับ GET
      if (retryCount < maxRetries) {
        console.warn(`[KIDDO API GET] Retrying ${action}... (attempt ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
        return this.get(action, params, useCache, retryCount + 1);
      }
      
      console.error("API Error:", error);
      const isTimeout = error.name === 'AbortError';
      const msg = isTimeout 
        ? "เซิร์ฟเวอร์ตอบสนองช้าเกินไป กรุณาลองใหม่" 
        : "ข้อมูลเซิร์ฟเวอร์ผิดปกติ กรุณาลองใหม่";
        
      if (!silent && retryCount === maxRetries) window.UI?.toast(msg, 'error');
      return { status: "error", message: msg };
    } finally {
      if (!silent && retryCount === 0) window.UI?.hideLoading();
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
