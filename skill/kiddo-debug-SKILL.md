---
name: kiddo-debug
description: >
  ทักษะดีบั๊กและตรวจหาข้อผิดพลาดแบบครบวงจรสำหรับโปรเจค KIDDO LEARNING
  ครอบคลุมทุก Layer — Frontend (HTML/CSS/JS), Backend (Google Apps Script),
  Database (Google Sheets), Auth/Session, Gamification, และ Network/CORS.
  ใช้ทักษะนี้ทุกครั้งที่มีการรายงานบั๊ค, พฤติกรรมผิดปกติ, หน้าเว็บค้าง,
  ส่งงานไม่ได้, คะแนนไม่อัปเดต, ครูตรวจงานไม่ได้, API ไม่ response,
  หรือต้องการ audit ความถูกต้องของระบบทั้งหมด — แม้จะบอกแค่
  "มันไม่ทำงาน" หรือ "มีปัญหา" ก็ให้ใช้ทักษะนี้เสมอ
---

# KIDDO LEARNING — Debug & Bug Detection Skill

## วิธีใช้ Skill นี้

1. **ระบุ Layer** ที่มีปัญหาก่อน (ดู Section 1)
2. **วิ่ง Checklist** ของ Layer นั้น (Section 2–6)
3. **ใช้ Bug Pattern** ที่พบบ่อย (Section 7) เพื่อ diagnose เร็วขึ้น
4. ถ้าต้องการรายละเอียดเพิ่ม → ดูไฟล์ใน `references/`

---

## 1. แผนที่ระบบ (System Map for Debugging)

```
[Browser]
    │  fetch / XHR
    ▼
[GAS Web App URL]  ← ← ← จุดที่บั๊คเยอะที่สุด
    │  doPost / doGet
    ▼
[Google Apps Script]
    │  SpreadsheetApp API
    ▼
[Google Sheets]   ← ← ← data corruption / race condition
    │
    ▼
[Google Drive]    ← ← ← ไฟล์งานนักเรียน
```

**5 Layer หลักที่ต้องตรวจ:**

| Layer | สัญญาณบั๊ค | Reference |
|-------|-----------|-----------|
| **L1: Frontend** | UI แสดงผลผิด, event ไม่ทำงาน, style พัง | `references/frontend-bugs.md` |
| **L2: API / Network** | fetch ล้มเหลว, CORS error, timeout | Section 3 |
| **L3: GAS Backend** | ฟังก์ชันไม่ทำงาน, permission error, quota | `references/gas-bugs.md` |
| **L4: Google Sheets** | ข้อมูลหาย, column ผิด, duplicate row | Section 5 |
| **L5: Auth / Session** | Login ไม่ได้, token หมดอายุ, role ผิด | Section 6 |

---

## 2. Debug Protocol — ขั้นตอนมาตรฐาน

```
Step 1: REPRODUCE
  → ทำซ้ำบั๊คได้ไหม? ถ้าไม่ได้ → intermittent bug → ดู Section 7.1
  → บั๊คเกิดกับ user คนเดียวหรือทุกคน? → ถ้าคนเดียว → ดู Auth/Session

Step 2: ISOLATE
  → เปิด DevTools (F12) → Console tab → มี error message ไหม?
  → Network tab → มี request ที่ status ≠ 200 ไหม?
  → เปิด GAS Execution Log → มี Exception ไหม?

Step 3: CLASSIFY
  → Frontend error → ดู references/frontend-bugs.md
  → Network/API error → ดู Section 3
  → GAS error → ดู references/gas-bugs.md
  → Data error → ดู Section 5

Step 4: FIX & VERIFY
  → แก้ไข → ทำซ้ำขั้นตอนที่ reproduce ได้ → ยืนยันว่าหาย
  → ตรวจ regression: feature อื่นยังทำงานปกติไหม?
```

---

## 3. API / Network Debug Checklist

### 3.1 ตรวจ Request จาก Browser

```javascript
// เปิด DevTools → Network tab → filter "fetch"
// ดูแต่ละ request:

// ✅ สิ่งที่ควรเห็น:
// - Status: 200
// - Response: {"success": true, "data": {...}}
// - Content-Type: application/json

// ❌ สัญญาณบั๊ค:
// - Status: 302 → GAS redirect (auth required)
// - Status: 0   → CORS blocked หรือ network fail
// - Response: HTML แทน JSON → GAS threw unhandled exception
// - Response: {"success": false} → logic error ใน backend
```

### 3.2 CORS Troubleshooting

```javascript
// GAS Web App ต้องตั้งค่าให้ถูกต้อง:

// ✅ ใน GAS: Deploy → Manage Deployments
//   Execute as: Me (your-email)
//   Who has access: Anyone  ← สำคัญมาก

// ✅ doGet / doPost ต้อง return ContentService:
function doPost(e) {
  const result = handleRequest(e);
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
    // ห้าม return object ตรงๆ — CORS จะพัง
}

// ❌ บั๊คที่พบบ่อย: return result; แทน ContentService
// ❌ บั๊คที่พบบ่อย: deploy ใหม่แต่ URL เก่า (ต้อง update deployment)
```

### 3.3 Fetch Pattern ที่ถูกต้อง

```javascript
async function apiCall(action, payload = {}) {
  const token = sessionStorage.getItem('kiddoToken');

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      // ❌ อย่าใส่ Content-Type: application/json → CORS preflight
      body: JSON.stringify({ action, token, payload })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text(); // ดึงเป็น text ก่อน
    let data;
    try {
      data = JSON.parse(text); // แล้วค่อย parse
    } catch {
      // GAS ส่ง HTML error มา → บั๊คฝั่ง backend
      console.error('[KIDDO] GAS returned non-JSON:', text.slice(0, 200));
      throw new Error('Backend error');
    }

    if (!data.success) throw new Error(data.message || 'API Error');
    return data;

  } catch (err) {
    console.error(`[KIDDO API] ${action} failed:`, err);
    throw err;
  }
}
```

---

## 4. Frontend Debug Checklist

> สำหรับรายละเอียดเพิ่มเติม → อ่าน `references/frontend-bugs.md`

### 4.1 Quick Console Scan

```javascript
// วิ่งใน DevTools Console เพื่อ health check เร็ว:

// 1. ตรวจ session
console.log('Token:', sessionStorage.getItem('kiddoToken'));
console.log('User:', sessionStorage.getItem('kiddoUser'));

// 2. ตรวจ cache
console.log('Cache:', window.__kiddoCache);

// 3. ตรวจ current page state
console.log('Current page:', document.querySelector('[data-page].active')?.dataset.page);

// 4. ตรวจ pending requests
// Network tab → filter "Pending"
```

### 4.2 สัญญาณบั๊ค UI ที่พบบ่อย

```
❌ หน้าขาว / ไม่แสดงอะไร
   → ดู Console: มี JS error ไหม?
   → ดู Network: โหลด GAS_URL สำเร็จไหม?
   → ตรวจ: GAS_URL ถูกต้องและ deploy แล้วหรือเปล่า

❌ ข้อมูลเก่า / ไม่อัปเดต
   → Cache ยังไม่หมดอายุ → force clear: window.__kiddoCache = {}
   → sessionStorage มีข้อมูลเก่า → sessionStorage.clear()

❌ Animation / UI ไม่ smooth
   → ตรวจ: layout thrashing (อ่าน DOM แล้ว write ใน loop)
   → ใช้ requestAnimationFrame สำหรับ animation

❌ Sticker / รูปภาพไม่โหลด
   → ตรวจ Drive sharing: ต้องเป็น "Anyone with link can view"
   → URL format ต้องเป็น: https://drive.google.com/uc?id=FILE_ID

❌ Modal / Popup ไม่ปิด
   → ตรวจ event listener ซ้ำ (addEventListener เรียกซ้ำ)
   → ใช้ { once: true } หรือ removeEventListener ก่อน add ใหม่
```

---

## 5. Google Sheets (Database) Debug

### 5.1 ตรวจ Sheet Structure

```javascript
// วิ่งใน GAS Script Editor เพื่อ audit sheet:
function auditSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const required = [
    'Users', 'Lessons', 'Topics', 'Assignments',
    'Submissions', 'Quizzes', 'QuizResults',
    'Missions', 'MissionProgress', 'Stickers'
  ];

  required.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) {
      Logger.log(`❌ MISSING SHEET: ${name}`);
    } else {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      Logger.log(`✅ ${name}: ${lastRow} rows, ${lastCol} cols`);
    }
  });
}
```

### 5.2 บั๊คข้อมูลที่พบบ่อย

```
❌ getValues() ได้ array ว่าง
   → sheet ไม่มีข้อมูล หรือ getLastRow() = 1 (แค่ header)
   → แก้: if (lastRow < 2) return []; // ไม่มีข้อมูล

❌ column index ผิด (off-by-one)
   → GAS ใช้ 1-based index: getRange(row, 1) = column A
   → JS array ใช้ 0-based: row[0] = column A
   → แก้: สร้าง constant map:
     const COL = { ID: 0, NAME: 1, ROLE: 2, ... };

❌ duplicate rows
   → LockService ไม่ได้ใช้ → race condition
   → แก้: เช็ค id ซ้ำก่อน append เสมอ

❌ ข้อมูลหายหลัง edit
   → อย่าใช้ setValues() กับ range ที่ใหญ่กว่าข้อมูล
   → ใช้ appendRow() สำหรับ insert ใหม่

❌ คะแนนรวมผิด / ไม่อัปเดต
   → ตรวจ: QuizResults มี row ซ้ำสำหรับ student+quiz เดิมไหม?
   → Logic: ต้อง getByStudentAndQuiz() ก่อน → ถ้ามีแล้วให้ update แทน insert
```

### 5.3 Script สำหรับหา Duplicate

```javascript
// วิ่งใน GAS เพื่อหา duplicate Submissions:
function findDuplicateSubmissions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Submissions');
  const rows = sheet.getDataRange().getValues().slice(1); // skip header

  const seen = {};
  rows.forEach((row, i) => {
    const key = `${row[1]}_${row[2]}`; // assignmentId_studentId
    if (seen[key]) {
      Logger.log(`⚠️ Duplicate at row ${i + 2}: ${key}`);
    }
    seen[key] = true;
  });
  Logger.log('Duplicate scan complete');
}
```

---

## 6. Auth & Session Debug

### 6.1 Token Flow ตรวจสอบ

```javascript
// ฝั่ง Client — ตรวจ token lifecycle:
function debugSession() {
  const token = sessionStorage.getItem('kiddoToken');
  const user  = JSON.parse(sessionStorage.getItem('kiddoUser') || '{}');

  console.group('🔐 Session Debug');
  console.log('Token:', token ? `${token.slice(0,8)}...` : '❌ MISSING');
  console.log('User ID:', user.id || '❌ MISSING');
  console.log('Role:', user.role || '❌ MISSING');
  console.log('Class:', user.class || 'N/A');
  console.groupEnd();

  if (!token) console.error('→ User ไม่ได้ login หรือ session หมด');
  if (token && !user.id) console.error('→ Token มีแต่ user data หาย');
}
```

### 6.2 บั๊ค Auth ที่พบบ่อย

```
❌ Login สำเร็จแต่ redirect ไม่ได้
   → ตรวจ: sessionStorage.setItem ก่อน redirect หรือเปล่า
   → ตรวจ: ใช้ window.location.href หรือ pushState?

❌ Role ผิด — ครูเข้าหน้า Student หรือกลับกัน
   → GAS: ตรวจ role ตอน login ว่าดึงจาก column ถูกไหม
   → Client: ตรวจ role check ก่อน render page

❌ API บอก UNAUTHORIZED ทั้งที่ login แล้ว
   → Token format ผิด → ตรวจ: ส่ง token ใน body ไหม (ไม่ใช่ header)
   → GAS validateToken() อาจมี logic ผิด → ดู references/gas-bugs.md

❌ Session หมดกลางคัน
   → sessionStorage หาย เมื่อปิด tab
   → แก้ถาวร: ย้ายไป localStorage แต่ต้องเพิ่ม token expiry check

❌ นักเรียนเห็นข้อมูลคนอื่น
   → ❗ Critical Bug — GAS ต้องตรวจ studentId จาก token เสมอ
   → อย่า trust studentId จาก payload → ดึงจาก token เท่านั้น
```

---

## 7. Bug Patterns ที่พบบ่อยใน KIDDO LEARNING

### 7.1 Intermittent Bugs (เกิดบางครั้ง)

```
สาเหตุ 90%:
  A. GAS Execution timeout → ส่งงานช้า / ไม่ตอบ
     → แก้: เพิ่ม try/catch + timeout retry ฝั่ง client

  B. Race condition ใน Sheets → LockService ไม่ได้ใช้
     → แก้: ใส่ LockService.getScriptLock() ทุก write operation

  C. Cache stale → ข้อมูลเก่าแสดงผล
     → แก้: invalidate cache หลัง mutation เสมอ

  D. Network flaky → fetch ล้มเหลว 1 ใน 10 ครั้ง
     → แก้: เพิ่ม retry logic (สูงสุด 3 ครั้ง)
```

```javascript
// Retry wrapper:
async function apiCallWithRetry(action, payload, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall(action, payload);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // exponential backoff
    }
  }
}
```

### 7.2 Mission / Gamification ไม่อัปเดต

```
Checklist:
  [ ] triggerMissionCheck() ถูกเรียกหลัง submitAssignment / submitQuiz ไหม?
  [ ] condition ใน Missions sheet ตรงกับ string ที่โค้ดส่งไหม?
      เช่น "first_submission" vs "firstSubmission" (case sensitive!)
  [ ] MissionProgress ตรวจ duplicate ก่อน insert ไหม?
  [ ] Points ใน Users sheet อัปเดตหลัง mission complete ไหม?
  [ ] Client invalidate cache missions หลังจาก complete ไหม?
```

### 7.3 ครูตรวจงานแล้วนักเรียนไม่เห็นผล

```
Flow ที่ต้องตรวจ:
  Teacher: gradeSubmission(submissionId, score, sticker, feedback)
    → GAS: update Submissions row (status='graded', score=X, feedback=Y)
    → GAS: (optional) เพิ่มแต้มใน Users sheet

  Student: getMySubmissions()
    → GAS: ดึง Submissions ที่ studentId ตรงกัน
    → Client: แสดง score + sticker + feedback

บั๊คที่พบ:
  ❌ update ผิด row → ตรวจ: หา submissionId ให้ถูกก่อน update
  ❌ Student cache ยังเก่า → invalidate 'mySubmissions' cache หลัง poll
  ❌ Sticker imageUrl เสีย → ตรวจ Drive permission ของรูปสติ๊กเกอร์
```

### 7.4 Quiz คะแนนผิด

```javascript
// ตรวจ gradeQuiz() logic:
function gradeQuiz(quizId, studentAnswers) {
  const quiz = getQuizById(quizId);
  // ❌ บั๊คที่พบ: JSON.parse ล้มเหลวเพราะ questions ไม่ใช่ JSON
  let questions;
  try {
    questions = JSON.parse(quiz.questions);
  } catch {
    Logger.log('❌ Quiz questions is not valid JSON: ' + quiz.questions);
    return { score: 0, error: 'INVALID_QUIZ_DATA' };
  }

  // ❌ บั๊คที่พบ: เปรียบเทียบ "A" กับ 0 (index vs letter)
  // ต้องกำหนดให้ชัดว่า correctAnswer เก็บเป็น "A"/"B"/"C" หรือ 0/1/2
  let correct = 0;
  questions.forEach((q, i) => {
    if (String(studentAnswers[i]) === String(q.correctAnswer)) correct++;
  });

  return {
    score: Math.round((correct / questions.length) * 100),
    passed: (correct / questions.length * 100) >= (quiz.passingScore || 60)
  };
}
```

---

## 8. GAS Execution Log — วิธีอ่าน

```
เปิด: Apps Script Editor → Executions (ไอคอนนาฬิกาด้านซ้าย)

สัญลักษณ์:
  ✅ Completed    → ทำงานสำเร็จ
  ❌ Failed       → มี exception → กด expand ดู stack trace
  ⏳ Running      → ค้างอยู่ → อาจ timeout
  ⚠️ Timed out   → เกิน 6 นาที → ต้อง optimize

บั๊คที่อ่านจาก Log:
  "Cannot read property 'X' of undefined"
    → ดึงข้อมูลจาก sheet ได้ undefined → sheet ชื่อผิด หรือ column ผิด

  "Service invoked too many times"
    → Quota หมด → รอ 24 ชั่วโมง หรือ optimize ลด API calls

  "Lock timeout"
    → มี concurrent request → เพิ่ม timeout ของ LockService

  "Invalid argument: id"
    → DriveApp / SpreadsheetApp ได้รับ undefined แทน string ID
```

---

## 9. Bug Report Template

เมื่อพบบั๊ค ให้บันทึกด้วย format นี้:

```markdown
## Bug Report

**วันที่:** ____________________
**ผู้รายงาน:** ครู / นักเรียน (ชื่อ / เลขที่)
**Layer ที่สงสัย:** Frontend / API / GAS / Sheets / Auth

**อาการ:**
> อธิบายว่าเกิดอะไรขึ้น เมื่อทำอะไร

**ขั้นตอนซ้ำบั๊ค:**
1.
2.
3.

**Console Error (ถ้ามี):**
```
วาง error message ที่นี่
```

**Network Response (ถ้ามี):**
```
วาง JSON response ที่นี่
```

**GAS Log (ถ้ามี):**
```
วาง execution log ที่นี่
```

**ความรุนแรง:** 🔴 Critical / 🟡 Major / 🟢 Minor
```

---

## 10. ไฟล์ Reference เพิ่มเติม

| ไฟล์ | เมื่อไหรควรอ่าน |
|------|----------------|
| `references/frontend-bugs.md` | บั๊ค HTML/CSS/JS, animation, responsive |
| `references/gas-bugs.md` | บั๊ค GAS โดยตรง, quota, LockService, permission |

> อ่านเฉพาะเมื่อ debug layer นั้น — ไม่ต้องโหลดทั้งหมด
