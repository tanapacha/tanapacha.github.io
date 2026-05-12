/**
 * KIDDO LEARNING - Backend System (Google Apps Script)
 * ──────────────────────────────────────────────────
 * วิธีใช้งาน:
 * 1. สร้าง Google Sheet ใหม่
 * 2. ไปที่ ส่วนขยาย (Extensions) > Apps Script
 * 3. ลบโค้ดเดิมทิ้ง และวางโค้ดทั้งหมดนี้ลงไป
 * 4. เลือกฟังก์ชัน `setupSystem` จากแถบด้านบน แล้วกดปุ่ม Run (เรียกใช้)
 *    >> ระบบจะสร้างชีทและเชื่อมต่อโฟลเดอร์ให้悦
 * 5. กด Deploy (ทำให้ใช้งานได้) > New Deployment
 *    - Type: Web App | Execute as: Me | Who has access: Anyone
 */

const CONFIG = {
  FOLDER_ID: "1JZgMRtLyHoFtuog7_LBNFbjv7CcyNsIp", // ID โฟลเดอร์จากลิงก์ที่คุณส่งมา
  FOLDER_NAME: "KIDDO_Uploads", 
  SHEETS: {
    USERS: "Users",
    ASSIGNMENTS: "Assignments",
    GRADES: "Grades",
    LESSONS: "Lessons",
    QUIZZES: "Quizzes",
    LOGS: "SystemLogs",
    TASKS: "Tasks",
    MISSIONS: "Missions",
    MISSION_PROGRESS: "MissionProgress"
  }
};

// ==========================================
// SECURITY UTILITIES
// ==========================================

/** สร้าง salt สุ่ม */
function generateSalt() {
  return Utilities.getUuid().replace(/-/g, '');
}

/** Hash password ด้วย SHA-256 + salt (GAS ไม่รองรับ bcrypt) */
function hashPassword(password, salt) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password);
  return raw.map(b => ('0' + ((b < 0 ? b + 256 : b)).toString(16)).slice(-2)).join('');
}

/** ตรวจสอบรหัสผ่าน */
function verifyPassword(password, storedHash, salt) {
  return hashPassword(password, salt) === storedHash;
}

/** Rate Limiting ด้วย CacheService */
function checkRateLimit(key, maxAttempts, windowSeconds) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'RL_' + key;
  const current = parseInt(cache.get(cacheKey) || '0');
  if (current >= maxAttempts) return false; // ถูกบล็อก
  cache.put(cacheKey, String(current + 1), windowSeconds);
  return true; // อนุญาต
}

/** Security Logging — บันทึกเหตุการณ์ด้านความปลอดภัย */
function logSecurityEvent(eventType, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.SHEETS.LOGS);
      logSheet.appendRow(['Timestamp', 'EventType', 'Details']);
      logSheet.getRange('A1:C1').setFontWeight('bold').setBackground('#f3f3f3');
    }
    // จำกัด detail ไม่ให้มี sensitive data
    const safeDetails = String(details || '').substring(0, 200);
    logSheet.appendRow([new Date(), eventType, safeDetails]);
  } catch (e) {
    // logging ล้มเหลวไม่ควรทำให้ระบบพัง
    Logger.log('Security log failed: ' + e);
  }
}

/** ตรวจสอบความแข็งแรงของรหัสผ่าน */
function validatePassword(password) {
  if (!password || password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  if (!/[0-9]/.test(password)) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว';
  if (!/[a-zA-Zก-ฮ]/.test(password)) return 'รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว';
  return null; // ผ่าน
}

// ==========================================
// 1. ฟังก์ชันติดตั้งระบบ (รันครั้งแรกครั้งเดียว)
// ==========================================
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // --- A. สร้าง/เชื่อมต่อโฟลเดอร์ Drive ---
  let folderId = CONFIG.FOLDER_ID;
  try {
    if (folderId) {
      DriveApp.getFolderById(folderId);
      Logger.log("✅ เชื่อมต่อกับโฟลเดอร์เดิมสำเร็จ");
    } else {
      folderId = getOrCreateFolder(CONFIG.FOLDER_NAME);
      Logger.log("✅ สร้าง/หาโฟลเดอร์ใหม่สำเร็จ");
    }
  } catch (e) {
    folderId = getOrCreateFolder(CONFIG.FOLDER_NAME);
    Logger.log("⚠️ เชื่อม ID เดิมไม่ได้ จึงสร้าง/หาโฟลเดอร์ใหม่ชื่อ " + CONFIG.FOLDER_NAME);
  }
  PropertiesService.getScriptProperties().setProperty('UPLOAD_FOLDER_ID', folderId);

  // --- B. สร้าง Sheet: Users ---
  let usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(CONFIG.SHEETS.USERS);
    usersSheet.appendRow(["ID", "Name", "Email", "Password", "Role", "Grade", "Points"]);
    usersSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  // --- C. สร้าง Sheet: Assignments ---
  let assignmentsSheet = ss.getSheetByName(CONFIG.SHEETS.ASSIGNMENTS);
  if (!assignmentsSheet) {
    assignmentsSheet = ss.insertSheet(CONFIG.SHEETS.ASSIGNMENTS);
    assignmentsSheet.appendRow(["SubmissionID", "Timestamp", "StudentID", "StudentName", "LessonID", "FileType", "FileUrl", "Status", "Score", "Sticker", "TeacherComment"]);
    assignmentsSheet.getRange("A1:K1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  // --- D. สร้าง Sheet: Grades ---
  let gradesSheet = ss.getSheetByName(CONFIG.SHEETS.GRADES);
  if (!gradesSheet) {
    gradesSheet = ss.insertSheet(CONFIG.SHEETS.GRADES);
    gradesSheet.appendRow(["Timestamp", "StudentID", "LessonID", "Score", "MaxScore", "Type"]);
    gradesSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  // --- E. สร้าง Sheet: Lessons ---
  let lessonsSheet = ss.getSheetByName(CONFIG.SHEETS.LESSONS);
  if (!lessonsSheet) {
    lessonsSheet = ss.insertSheet(CONFIG.SHEETS.LESSONS);
    lessonsSheet.appendRow(["ID", "Category", "Title", "Description", "Type", "Thumbnail", "Order", "Instructions", "Criteria", "MaxPoints", "Deadline", "VideoURL", "SlideURL"]);
    lessonsSheet.getRange("A1:M1").setFontWeight("bold").setBackground("#f3f3f3");
    // ข้อมูลเริ่มต้น
    lessonsSheet.appendRow(["L1", "1. อัลกอริทึม", "อัลกอริทึมเบื้องต้น", "เรียนรู้การลำดับขั้นตอนการแก้ปัญหา", "video", "", 1, "ดูวิดีโอและทำสรุปสั้นๆ", "-", 0, "-"]);
    lessonsSheet.appendRow(["L2", "2. การเขียนโปรแกรม Scratch", "การเขียนโปรแกรม Scratch", "สร้างโปรเจกต์แรกด้วยบล็อกคำสั่ง", "assignment", "", 2, "ให้นักเรียนสร้างโปรเจกต์ Scratch ตามโจทย์ที่คุณครูกำหนดในห้องเรียน", "1. ความถูกต้อง (5)\n2. ความสวยงาม (3)\n3. ความคิดสร้างสรรค์ (2)", 10, "15 พ.ค. 2569"]);
  }

  // --- F. สร้าง Sheet: Quizzes ---
  let quizzesSheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
  if (! quizzesSheet) {
    quizzesSheet = ss.insertSheet(CONFIG.SHEETS.QUIZZES);
    // เพิ่ม Question, OptionA, OptionB, OptionC, OptionD, Answer สำหรับ internal quiz
    quizzesSheet.appendRow(["ID", "LessonID", "Title", "Type", "QuizURL", "Points", "CreatedAt", "Question", "OptionA", "OptionB", "OptionC", "OptionD", "Answer"]);
    quizzesSheet.getRange("A1:M1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  // --- H. สร้าง Sheet: Tasks ---
  let tasksSheet = ss.getSheetByName(CONFIG.SHEETS.TASKS);
  if (!tasksSheet) {
    tasksSheet = ss.insertSheet(CONFIG.SHEETS.TASKS);
    tasksSheet.appendRow(["ID", "LessonID", "Title", "Instructions", "Criteria", "MaxPoints", "Deadline", "CreatedAt"]);
    tasksSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  // --- I. สร้าง Sheet: Missions ---
  let missionsSheet = ss.getSheetByName(CONFIG.SHEETS.MISSIONS);
  if (!missionsSheet) {
    missionsSheet = ss.insertSheet(CONFIG.SHEETS.MISSIONS);
    missionsSheet.appendRow(["ID", "Title", "Condition", "RewardPoints", "Icon"]);
    missionsSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#f3f3f3");
    // ข้อมูลเริ่มต้น
    missionsSheet.appendRow(["M1", "ส่งงานครั้งแรก", "first_submission", 100, "🏆"]);
    missionsSheet.appendRow(["M2", "ทดสอบผ่านฉลุย", "quiz_passed", 50, "🌟"]);
  }

  // --- J. สร้าง Sheet: MissionProgress ---
  let mpSheet = ss.getSheetByName(CONFIG.SHEETS.MISSION_PROGRESS);
  if (!mpSheet) {
    mpSheet = ss.insertSheet(CONFIG.SHEETS.MISSION_PROGRESS);
    mpSheet.appendRow(["ID", "MissionID", "StudentID", "CompletedAt"]);
    mpSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  ss.toast("ติดตั้งระบบเรียบร้อยแล้ว!", "Success");
}

function getOrCreateFolder(name) {
  let folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next().getId();
  return DriveApp.createFolder(name).getId();
}

// ==========================================
// 2. API Entry Points
// ==========================================

// ==========================================
// AUTO-MIGRATION: ตรวจสอบโครงสร้าง Sheet
// ==========================================
function migrateSchemaIfNeeded() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- ตรวจสอบ Sheet: Users ---
  const uSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (uSheet) {
    const uHeaders = uSheet.getRange(1, 1, 1, Math.max(1, uSheet.getLastColumn())).getValues()[0];
    if (uHeaders.indexOf("Points") === -1) {
      const lastCol = uSheet.getLastColumn();
      uSheet.getRange(1, lastCol + 1).setValue("Points").setFontWeight("bold").setBackground("#f3f3f3");
      const dataRows = uSheet.getLastRow() - 1;
      if (dataRows > 0) {
        const defaultPoints = new Array(dataRows).fill([0]);
        uSheet.getRange(2, lastCol + 1, dataRows, 1).setValues(defaultPoints);
      }
    }
  }

  const sheet = ss.getSheetByName(CONFIG.SHEETS.LESSONS);
  if (!sheet) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // ตรวจสอบว่ามีคอลัมน์ "Category" หรือยัง
  // ถ้ายังไม่มี → เพิ่มคอลัมน์ B ใหม่ (เลื่อนคอลัมน์เดิมไปขวาทั้งหมด)
  if (headers.indexOf("Category") === -1) {
    sheet.insertColumnBefore(2); // แทรกคอลัมน์ใหม่ที่ตำแหน่ง B
    sheet.getRange(1, 2).setValue("Category").setFontWeight("bold").setBackground("#f3f3f3");
    // ตอนนี้โครงสร้างจะเป็น: ID | Category(ว่าง) | Title | Description | Type | ...
  }
  
  // ตรวจสอบว่ามีคอลัมน์ VideoURL/SlideURL หรือยัง
  const updatedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (updatedHeaders.indexOf("VideoURL") === -1) {
    const lastCol = sheet.getLastColumn();
    sheet.getRange(1, lastCol + 1).setValue("VideoURL").setFontWeight("bold").setBackground("#f3f3f3");
    sheet.getRange(1, lastCol + 2).setValue("SlideURL").setFontWeight("bold").setBackground("#f3f3f3");
  }

  // --- ตรวจสอบ Sheet: Grades ---
  const gSheet = ss.getSheetByName(CONFIG.SHEETS.GRADES);
  if (gSheet) {
    const gHeaders = gSheet.getRange(1, 1, 1, Math.max(1, gSheet.getLastColumn())).getValues()[0];
    if (gHeaders.indexOf("Type") === -1) {
      const lastCol = gSheet.getLastColumn();
      gSheet.getRange(1, lastCol + 1).setValue("Type").setFontWeight("bold").setBackground("#f3f3f3");
    }
  }

  // --- ตรวจสอบ Sheet: Quizzes ---
  const qSheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
  if (qSheet) {
    const qHeaders = qSheet.getRange(1, 1, 1, Math.max(1, qSheet.getLastColumn())).getValues()[0];
    const required = ["ID", "LessonID", "Title", "Type", "QuizURL", "Points", "CreatedAt", "Question", "OptionA", "OptionB", "OptionC", "OptionD", "Answer"];
    
    required.forEach(col => {
      if (qHeaders.indexOf(col) === -1) {
        const lastCol = qSheet.getLastColumn();
        qSheet.getRange(1, lastCol + 1).setValue(col).setFontWeight("bold").setBackground("#f3f3f3");
      }
    });
  }
}

function doGet(e) {
  let action = e.parameter.action;
  try {
    // Bug Fix #9: ไม่เรียก migrateSchemaIfNeeded() ใน doGet เพราะเป็น write operation
    // ที่ไม่มี LockService ป้องกัน → อาจ race condition
    // Migration จะถูกเรียกใน doPost() และ setupSystem() แทน
    if (action === "getAssignments") return responseJSON(getAssignments());
    if (action === "getLessons") return responseJSON(getLessons());
    if (action === "getTasks") return responseJSON(getTasks());
    if (action === "getQuizzes") return responseJSON(getQuizzes(e.parameter.lessonId));
    if (action === "getGrades") return responseJSON(getGrades(e.parameter.studentId));
    if (action === "getUsers") return responseJSON(getUsers());
    return responseJSON({ status: "success", message: "KIDDO API is online" });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 10 seconds timeout
  } catch (lockErr) {
    return responseJSON({ status: "error", message: "ระบบกำลังยุ่ง กรุณาลองใหม่อีกครั้ง (System is busy)" });
  }

  try {
    migrateSchemaIfNeeded(); // ตรวจสอบโครงสร้าง Sheet ก่อนทุกครั้ง
    let payload = JSON.parse(e.postData.contents);
    let action = payload.action;
    let token = payload.token || null;

    // Helper: RBAC Validation (ใช้ session token แทน user ID)
    function requireRole(requiredRole) {
      if (!token) throw new Error("UNAUTHORIZED");
      // ค้นหา session token จาก Cache
      const cache = CacheService.getScriptCache();
      const sessionData = cache.get('SESSION_' + token);
      if (!sessionData) throw new Error("SESSION_EXPIRED");
      const session = JSON.parse(sessionData);
      const userId = session.userId;
      
      const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS).getDataRange().getValues();
      const user = users.find(u => u[0] === userId);
      if (!user) throw new Error("UNAUTHORIZED");
      if (requiredRole && user[4] !== requiredRole && user[4] !== "admin" && user[4] !== "teacher") {
        logSecurityEvent('RBAC_DENIED', 'User ' + userId + ' tried action requiring ' + requiredRole);
        throw new Error("FORBIDDEN");
      }
      return user;
    }

    if (action === "login") return responseJSON(handleLogin(payload.email, payload.password));
    if (action === "register") return responseJSON(handleRegister(payload));
    if (action === "getDashboardData") return responseJSON(handleGetDashboardData(payload));
    
    // Protected Endpoints
    if (action === "submitAssignment") { requireRole("user"); return responseJSON(handleUploadAssignment(payload)); }
    if (action === "gradeAssignment") { requireRole("admin"); return responseJSON(handleGradeAssignment(payload)); }
    if (action === "createLesson") { requireRole("admin"); return responseJSON(handleCreateLesson(payload)); }
    if (action === "saveTask") { requireRole("admin"); return responseJSON(handleCreateTask(payload)); }
    if (action === "deleteTask") { requireRole("admin"); return responseJSON(handleDeleteTask(payload)); }
    if (action === "createQuiz") { requireRole("admin"); return responseJSON(handleCreateQuiz(payload)); }
    if (action === "deleteQuiz") { requireRole("admin"); return responseJSON(handleDeleteQuiz(payload)); }
    if (action === "saveQuizGrade") { requireRole("user"); return responseJSON(handleSaveQuizGrade(payload)); }
    if (action === "saveBulkGrades") { requireRole("admin"); return responseJSON(handleSaveBulkGrades(payload)); }
    if (action === "updateSettings") { requireRole("admin"); return responseJSON(handleUpdateSettings(payload)); }
    if (action === "deleteLesson") { requireRole("admin"); return responseJSON(handleDeleteLesson(payload)); }
    if (action === "updateLesson") { requireRole("admin"); return responseJSON(handleUpdateLesson(payload)); }
    if (action === "createTask") { requireRole("admin"); return responseJSON(handleCreateTask(payload)); }

    throw new Error("Action not found");
  } catch (error) {
    // Phase 3: Safe error messages — ไม่เปิดเผย stack trace
    const msg = error.message || '';
    if (msg === 'UNAUTHORIZED' || msg === 'SESSION_EXPIRED') {
      return responseJSON({ status: "error", message: "กรุณาเข้าสู่ระบบใหม่", code: "AUTH_REQUIRED" });
    }
    if (msg === 'FORBIDDEN') {
      return responseJSON({ status: "error", message: "ไม่มีสิทธิ์เข้าถึง" });
    }
    // Log error จริงไว้ แต่ส่งข้อความทั่วไปกลับ client
    logSecurityEvent('ERROR', msg.substring(0, 200));
    return responseJSON({ status: "error", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// Gamification Engine
// ==========================================
function checkMissionProgress(studentId, condition) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mSheet = ss.getSheetByName(CONFIG.SHEETS.MISSIONS);
  const mpSheet = ss.getSheetByName(CONFIG.SHEETS.MISSION_PROGRESS);
  const uSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!mSheet || !mpSheet || !uSheet) return;

  const missions = mSheet.getDataRange().getValues();
  const progress = mpSheet.getDataRange().getValues();
  
  // Find mission by condition
  const mission = missions.find(m => m[2] === condition);
  if (!mission) return;
  const missionId = mission[0];
  const rewardPoints = parseInt(mission[3]) || 0;

  // Check if already completed
  const alreadyCompleted = progress.find(p => p[1] === missionId && p[2] === studentId);
  if (alreadyCompleted) return; // Mission already done

  // Mark as completed
  const newProgressId = "MP" + new Date().getTime();
  mpSheet.appendRow([newProgressId, missionId, studentId, new Date()]);

  // Add points to User
  const users = uSheet.getDataRange().getValues();
  const uHeaders = users[0];
  const pointsIdx = uHeaders.indexOf("Points");
  
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === studentId) {
      let currentPoints = parseInt(users[i][pointsIdx]) || 0;
      uSheet.getRange(i + 1, pointsIdx + 1).setValue(currentPoints + rewardPoints);
      break;
    }
  }
}



// ==========================================
// 3. Logic Functions
// ==========================================

function handleLogin(email, password) {
  // Rate Limiting: 5 ครั้ง/15 นาที ต่อ email
  if (!checkRateLimit('login_' + email, 5, 900)) {
    logSecurityEvent('RATE_LIMIT', 'Login blocked for ' + email);
    return { status: "error", message: "พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที" };
  }
  
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS).getDataRange().getValues();
  const headers = data[0];
  const saltIdx = headers.indexOf('Salt');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) {
      let passwordMatch = false;
      
      if (saltIdx !== -1 && data[i][saltIdx]) {
        // New hashed password format
        passwordMatch = verifyPassword(password.toString(), data[i][3].toString(), data[i][saltIdx].toString());
      } else {
        // Legacy plaintext fallback (ยังไม่ได้ migrate)
        passwordMatch = (data[i][3].toString() === password.toString());
      }
      
      if (passwordMatch) {
        // สร้าง session token แทนการใช้ User ID
        const sessionToken = Utilities.getUuid();
        const sessionData = { userId: data[i][0], email: email, loginAt: new Date().toISOString() };
        CacheService.getScriptCache().put('SESSION_' + sessionToken, JSON.stringify(sessionData), 1800); // 30 นาที
        
        logSecurityEvent('LOGIN_SUCCESS', email);
        
        const userData = { id: data[i][0], name: data[i][1], email: data[i][2], role: data[i][4], grade: data[i][5], token: sessionToken };
        return { status: "success", data: userData, user: userData };
      } else {
        logSecurityEvent('LOGIN_FAILED', email);
        return { status: "error", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      }
    }
  }
  logSecurityEvent('LOGIN_FAILED', email + ' (not found)');
  return { status: "error", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
}

function handleRegister(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  
  // ตรวจสอบอีเมลซ้ำ
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === payload.email) {
      return { status: "error", message: "อีเมลนี้มีผู้ใช้งานแล้ว" };
    }
  }

  // กำหนด role: ถ้า payload.grade เป็น "ครู" หรือ payload.role เป็น "admin" ให้เป็น admin
  let role = "user";
  if (payload.grade === "ครู" || payload.role === "admin" || payload.role === "teacher") {
    role = "admin";
  }

  const id = (role === "admin" ? "T" : "S") + new Date().getTime();
  const name = payload.firstName + " " + payload.lastName;

  // [ID, Name, Email, Password, Role, Grade, Points]
  sheet.appendRow([id, name, payload.email, payload.password, role, payload.grade || "", 0]);

  clearServerCache();
  return { 
    status: "success", 
    user: { id: id, name: name, email: payload.email, role: role, grade: payload.grade || "" } 
  };
}

function handleGetDashboardData(payload) {
  const cache = CacheService.getScriptCache();
  const cacheKey = "dashboard_all_data";
  let cachedData = cache.get(cacheKey);
  
  let lessons, submissions, users;
  
  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    lessons = parsed.lessons;
    submissions = parsed.submissions;
    users = parsed.users;
  } else {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lessonsSheet = ss.getSheetByName(CONFIG.SHEETS.LESSONS);
    
    // --- AUTO-MIGRATE HEADERS (ถ้ายังไม่มี VideoURL/SlideURL ให้เติมให้) ---
    const headers = lessonsSheet.getRange(1, 1, 1, lessonsSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf("VideoURL") === -1) {
      lessonsSheet.getRange(1, 12).setValue("VideoURL").setFontWeight("bold").setBackground("#f3f3f3");
      lessonsSheet.getRange(1, 13).setValue("SlideURL").setFontWeight("bold").setBackground("#f3f3f3");
    }

    lessons = lessonsSheet.getDataRange().getValues();
    submissions = ss.getSheetByName(CONFIG.SHEETS.ASSIGNMENTS).getDataRange().getValues();
    users = ss.getSheetByName(CONFIG.SHEETS.USERS).getDataRange().getValues();
    
    // เก็บเข้า Cache 5 นาที (300 วินาที) เพื่อความเร็วสูงสุด
    cache.put(cacheKey, JSON.stringify({ lessons, submissions, users }), 300);
  }

  const { role, id } = payload;
  let result = { 
    status: "success", 
    data: {},
    lessons: dataToObjects(lessons)
  };
  
  const normalizedRole = (role || "").toLowerCase();
  if (normalizedRole === "user") {
    let totalScore = 0;
    let gradedCount = 0;
    for (let i = 1; i < submissions.length; i++) {
      if (submissions[i][2] === id) {
        if (submissions[i][8] !== "") {
          totalScore += parseFloat(submissions[i][8]);
          gradedCount++;
        }
      }
    }
    result.data = {
      completedLessons: gradedCount,
      totalLessons: lessons.length - 1,
      pendingQuizzes: (lessons.length - 1) - gradedCount,
      avgScore: gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : 0
    };
    
  } else if (normalizedRole === "admin") {
    let studentCount = 0;
    for (let i = 1; i < users.length; i++) {
      if (users[i][4] === "admin") { /* skip */ }
      if (users[i][4] === "user") studentCount++;
    }
    
    let pendingGrading = 0;
    for (let i = 1; i < submissions.length; i++) {
      if (submissions[i][8] === "") pendingGrading++;
    }
    
    result.data = {
      studentCount: studentCount,
      pendingGrading: pendingGrading,
      totalSubmissions: submissions.length - 1,
      avgClass: 0 
    };
  }
  
  return result;
}

// ล้าง Cache เมื่อมีการบันทึกข้อมูลใหม่
function clearServerCache() {
  CacheService.getScriptCache().remove("dashboard_all_data");
}

// Helper function สำหรับแปลง Data เป็น Object แบบไวๆ
function dataToObjects(data) {
  if (!data || data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let val = row[i];
      // ป้องกันการหยิบเอาค่า Type (video/slides) มาเป็น URL
      if ((header === "VideoURL" || header === "Thumbnail") && (val === "video" || val === "slides")) {
        val = ""; 
      }
      obj[header] = val;
    });
    return obj;
  });
}

function handleUploadAssignment(payload) {
  let { studentId, studentName, lessonId, fileBase64, fileName, mimeType } = payload;
  let folderId = PropertiesService.getScriptProperties().getProperty('UPLOAD_FOLDER_ID');
  let folder = DriveApp.getFolderById(folderId);
  
  let blob = Utilities.newBlob(Utilities.base64Decode(fileBase64.split(',')[1]), mimeType, studentId + "_" + fileName);
  let file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  let subId = "SUB_" + new Date().getTime();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.ASSIGNMENTS).appendRow([
    subId, new Date(), studentId, studentName, lessonId, mimeType, file.getUrl(), "pending", "", "", ""
  ]);

  clearServerCache();
  // Gamification check
  checkMissionProgress(studentId, "first_submission");
  return { status: "success", fileUrl: file.getUrl() };
}

function handleGradeAssignment(payload) {
  let { submissionId, score, sticker, comment } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.ASSIGNMENTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === submissionId) {
      sheet.getRange(i + 1, 8, 1, 4).setValues([["graded", score, sticker, comment]]);
      clearServerCache();
      return { status: "success" };
    }
  }
  return { status: "error", message: "Submission not found" };
}

function getAssignments() {
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.ASSIGNMENTS).getDataRange().getValues();
  const headers = data[0];
  return { 
    status: "success", 
    data: data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
  };
}

function getUsers() {
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS).getDataRange().getValues();
  return { status: "success", data: dataToObjects(data) };
}

function getLessons() {
  // เคลียร์ Cache ก่อนดึง เพื่อให้เห็นข้อมูลล่าสุดเสมอ
  clearServerCache();
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.LESSONS).getDataRange().getValues();
  const headers = data[0];
  return { 
    status: "success", 
    data: data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
  };
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function logSystem(action, details) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.LOGS).appendRow([new Date(), action, details]);
  } catch(e) {}
}
function handleCreateLesson(payload) {
  const { category, title, description, type, instructions, criteria, maxPoints, deadline, videoUrl: payloadVideoUrl, slideFile } = payload;
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('UPLOAD_FOLDER_ID');
  const rootFolder = DriveApp.getFolderById(rootFolderId);

  // 1. จัดการโฟลเดอร์บทใหญ่
  let catFolder;
  const catFolders = rootFolder.getFoldersByName(category);
  if (catFolders.hasNext()) {
    catFolder = catFolders.next();
  } else {
    catFolder = rootFolder.createFolder(category);
  }

  // 2. จัดการโฟลเดอร์บทเรียนย่อย
  let lessonFolder;
  const lessonFolders = catFolder.getFoldersByName(title);
  if (lessonFolders.hasNext()) {
    lessonFolder = lessonFolders.next();
  } else {
    lessonFolder = catFolder.createFolder(title);
  }

  let videoUrl = payloadVideoUrl || "";
  let slideUrl = "";

  // 4. อัปโหลดสไลด์ (ถ้ามี)
  if (slideFile && slideFile.base64) {
    const blob = Utilities.newBlob(Utilities.base64Decode(slideFile.base64.split(',')[1]), slideFile.mimeType, "Slides_" + slideFile.name);
    const file = lessonFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    slideUrl = file.getUrl();
  }

  // 5. บันทึกลง Sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LESSONS);
  const lastId = sheet.getLastRow() > 1 ? sheet.getRange(sheet.getLastRow(), 1).getValue() : "L0";
  const newId = "L" + (parseInt(lastId.replace("L", "")) + 1);
  
  // [ID, Category, Title, Description, Type, Thumbnail, Order, Instructions, Criteria, MaxPoints, Deadline]
  // เราจะเก็บลิงก์วิดีโอในช่อง Thumbnail หรือจะขยายช่องเพิ่มก็ได้ แต่เบื้องต้นขอใส่ใน Description หรือขยายช่องครับ
  // เพื่อความสมบูรณ์ ผมจะบันทึก VideoUrl และ SlideUrl ต่อท้ายครับ
  sheet.appendRow([
    newId, 
    category, 
    title, 
    description, 
    videoUrl ? "video" : "slides", 
    "", 
    sheet.getLastRow(), 
    "", "", "", "", 
    "", // คอลัมน์ L (ว่างไว้ตามชีทคุณครู)
    videoUrl, // คอลัมน์ M (13)
    slideUrl  // คอลัมน์ N (14)
  ]);

  clearServerCache();
  return { status: "success", lessonId: newId };
}
function handleDeleteLesson(payload) {
  const { lessonId } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.LESSONS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === lessonId) {
      sheet.deleteRow(i + 1);
      clearServerCache();
      return { status: "success" };
    }
  }
  return { status: "error", message: "Lesson not found" };
}

function handleUpdateLesson(payload) {
  const { lessonId, category, title, description, videoUrl, slideUrl } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LESSONS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === lessonId) {
      const row = i + 1;
      sheet.getRange(row, 2).setValue(category);
      sheet.getRange(row, 3).setValue(title);
      sheet.getRange(row, 4).setValue(description);
      sheet.getRange(row, 5).setValue(videoUrl ? "video" : "slides");
      sheet.getRange(row, 13).setValue(videoUrl); // คอลัมน์ M (13)
      sheet.getRange(row, 14).setValue(slideUrl || ""); // คอลัมน์ N (14)
      
      clearServerCache();
      return { status: "success" };
    }
  }
  return { status: "error", message: "ไม่พบบทเรียนที่ต้องการแก้ไข" };
}
function getTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.TASKS);
  if (!sheet) return { status: "success", data: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { status: "success", data: [] };
  
  const headers = data[0];
  return { 
    status: "success", 
    data: data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
  };
}

function handleCreateTask(payload) {
  const { id, lessonId, title, instructions, criteria, maxPoints, deadline } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEETS.TASKS);
  
  // ป้องกันกรณีชีทหาย ให้สร้างใหม่ทันที
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.TASKS);
    sheet.appendRow(["ID", "LessonID", "Title", "Instructions", "Criteria", "MaxPoints", "Deadline", "CreatedAt"]);
    sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // [ID, LessonID, Title, Instructions, Criteria, MaxPoints, Deadline, CreatedAt]
  sheet.appendRow([
    id || ("T" + new Date().getTime()),
    lessonId || "",
    title,
    instructions || "",
    criteria || "",
    maxPoints || 0,
    deadline || "-",
    new Date()
  ]);

  clearServerCache();
  return { status: "success" };
}

function getQuizzes(lessonId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
  if (!sheet) return { status: "success", data: [] };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { status: "success", data: [] };

  const headers = data[0];
  let quizzes = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // กรองตาม LessonID ถ้ามีการส่งมา (และไม่ใช่ค่าว่างหรือ "undefined")
  if (lessonId && lessonId !== "undefined" && lessonId !== "null") {
    quizzes = quizzes.filter(q => q.LessonID && q.LessonID.toString() === lessonId.toString());
  }

  return { status: "success", data: quizzes };
}

function handleCreateQuiz(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
  
  // 1. ดึงหัวตารางปัจจุบัน
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // 2. เตรียมข้อมูล (รวม ID และ วันที่สร้าง)
  const data = {
    ...payload,
    ID: "Q" + new Date().getTime(),
    CreatedAt: new Date(),
    Title: payload.Title || "แบบฝึกหัด",
    Type: payload.Type || "post",
    Points: payload.Points || 10
  };

  // 3. จัดเรียงข้อมูลตามลำดับหัวตารางเป๊ะๆ
  const row = headers.map(h => data[h] || "");
  
  sheet.appendRow(row);
  
  clearServerCache();
  return { status: "success", data: { id: data.ID } };
}

function handleDeleteQuiz(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
  const { quizId } = payload;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    // ปรับปรุงการเปรียบเทียบให้ยืดหยุ่นขึ้น (toString และ trim)
    if (String(data[i][0]).trim() === String(quizId).trim()) {
      sheet.deleteRow(i + 1);
      clearServerCache();
      return { status: "success", message: "Quiz deleted" };
    }
  }
  return { status: "error", message: "Quiz not found: " + quizId };
}

function handleDeleteTask(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.TASKS);
  const { taskId } = payload;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(taskId).trim()) {
      sheet.deleteRow(i + 1);
      clearServerCache();
      return { status: "success", message: "Task deleted" };
    }
  }
  return { status: "error", message: "Task not found" };
}

function handleSaveQuizGrade(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.GRADES);
  const { studentId, lessonId, score, maxScore, type } = payload;
  
  // Bug Fix: Duplicate check — ป้องกันกดส่งซ้ำ
  const existing = sheet.getDataRange().getValues();
  for (let i = 1; i < existing.length; i++) {
    if (existing[i][1] === studentId && existing[i][2] === lessonId && (existing[i][5] || "quiz") === (type || "quiz")) {
      // ถ้ามีอยู่แล้ว ให้ update แทน insert
      sheet.getRange(i + 1, 1).setValue(new Date()); // Timestamp
      sheet.getRange(i + 1, 4).setValue(score);       // Score
      sheet.getRange(i + 1, 5).setValue(maxScore);    // MaxScore
      clearServerCache();
      if (parseInt(score) >= (parseInt(maxScore) * 0.6)) {
        checkMissionProgress(studentId, "quiz_passed");
      }
      return { status: "success" };
    }
  }
  
  sheet.appendRow([new Date(), studentId, lessonId, score, maxScore, type || "quiz"]);
  clearServerCache();
  // Gamification check
  if (parseInt(score) >= (parseInt(maxScore) * 0.6)) {
    checkMissionProgress(studentId, "quiz_passed");
  }
  return { status: "success" };
}

function handleSaveBulkGrades(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.GRADES);
  const { grades } = payload; // Array of { studentId, lessonId, score, maxScore, type }
  
  const timestamp = new Date();
  const rows = grades.map(g => [timestamp, g.studentId, g.lessonId, g.score, g.maxScore, g.type]);
  
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  clearServerCache();
  return { status: "success", message: `Saved ${rows.length} grades` };
}

function getGrades(studentId) {
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.GRADES).getDataRange().getValues();
  const headers = data[0];
  let grades = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  if (studentId) grades = grades.filter(g => g.StudentID === studentId);
  return { status: "success", data: grades };
}

function handleUpdateSettings(payload) {
  // ฟังก์ชันรองรับการอัปเดตตั้งค่าระบบในอนาคต
  logSystem("UpdateSettings", JSON.stringify(payload));
  return { status: "success", message: "Settings updated locally" };
}

/**
 * ฟังก์ชันพิเศษสำหรับย้ายข้อมูลที่วางผิดช่องให้เข้าที่ (รันครั้งเดียว)
 */
function fixQuizData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // ค้นหาตำแหน่งคอลัมน์จากหัวตาราง
  const idxType = headers.indexOf("Type");
  const idxURL = headers.indexOf("QuizURL");
  const idxPoints = headers.indexOf("Points");
  const idxDate = headers.indexOf("CreatedAt");

  for (let i = 1; i < data.length; i++) {
    const row = i + 1;
    // กรณีที่ข้อมูลในช่อง QuizURL มันเป็นคำว่า pre/post (ซึ่งจริงๆ ต้องเป็นลิงก์)
    if (String(data[i][idxURL]).trim() === "pre" || String(data[i][idxURL]).trim() === "post") {
      const typeVal = data[i][idxURL];
      const urlVal = data[i][idxPoints];
      const pointsVal = data[i][idxDate];
      const dateVal = sheet.getRange(row, idxDate + 2).getValue(); // วันที่มักจะกระโดดไปอยู่คอลัมน์ถัดไป

      // จัดวางใหม่ให้ถูกที่
      if (idxType !== -1) sheet.getRange(row, idxType + 1).setValue(typeVal);
      if (idxURL !== -1) sheet.getRange(row, idxURL + 1).setValue(urlVal);
      if (idxPoints !== -1) sheet.getRange(row, idxPoints + 1).setValue(pointsVal);
      if (idxDate !== -1) sheet.getRange(row, idxDate + 1).setValue(dateVal);
    }
  }
  ss.toast("จัดระเบียบข้อมูลเดิมเรียบร้อยแล้วครับ!", "Success");
}
