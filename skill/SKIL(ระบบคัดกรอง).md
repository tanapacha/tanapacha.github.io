---
name: multi-grade-content-filter
description: |
  ระบบคัดกรองและจัดการเนื้อหาตามระดับชั้น (Multi-Grade Content Filtering System) สำหรับแพลตฟอร์มการศึกษา
  ออกแบบมาเพื่อให้ครูสร้าง/จัดการบทเรียนแบบแบ่งระดับชั้น และนักเรียนแต่ละคนเห็นเฉพาะเนื้อหา
  ที่ตรงกับระดับชั้นของตนเอง โดยใช้ Google Sheets เป็น Backend

  ใช้ skill นี้เมื่อ:
  - สร้างหรือปรับปรุงแพลตฟอร์มการศึกษาที่ต้องการ Content Segregation ตามระดับชั้น
  - ออกแบบ Teacher Dashboard สำหรับสร้าง/แก้ไข/กรองบทเรียน
  - สร้างระบบ Student View ที่ filter เนื้อหาอัตโนมัติตาม Profile ของผู้เรียน
  - ทำงานกับ Google Sheets API เพื่อจัดการข้อมูลบทเรียนแบบ Multi-Grade
  - ใดก็ตามที่เกี่ยวข้องกับ Personalized Learning Experience ตามระดับชั้น ป.1-ป.6 หรือ ม.1-ม.6
compatibility:
  - Google Sheets API (Apps Script หรือ REST API)
  - JavaScript / Google Apps Script
  - HTML/CSS สำหรับ Teacher & Student UI
---

# Multi-Grade Content Filtering System

## ภาพรวมระบบ (System Overview)

ระบบนี้ทำหน้าที่แยกเนื้อหาบทเรียนตามระดับชั้น (Content Segregation) บนแพลตฟอร์มเดียว
โดยมีสองมุมมองหลัก:

```
┌─────────────────────────────────────────────┐
│          Google Sheets (Backend)            │
│  [ID] [ชื่อบท] [เนื้อหา] [Grade] [สถานะ]   │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐   ┌──────────────────┐
│ Teacher UI  │   │   Student UI     │
│ (จัดการทั้งหมด) │   │ (เห็นเฉพาะชั้นตัวเอง)│
└─────────────┘   └──────────────────┘
```

---

## โครงสร้าง Google Sheets (Data Schema)

### Sheet: `Lessons`

| คอลัมน์ | ชื่อ Header | ประเภทข้อมูล | ตัวอย่าง |
|--------|------------|--------------|---------|
| A | `LessonID` | Auto-increment | `L001` |
| B | `Title` | String | `การบวกเลข` |
| C | `Content` | String (ยาว) | `เนื้อหาบทเรียน...` |
| D | `Grade` | String | `ป.3` หรือ `ทั้งหมด` |
| E | `Subject` | String | `คณิตศาสตร์` |
| F | `CreatedBy` | String (email) | `teacher@school.com` |
| G | `CreatedAt` | Timestamp | `2025-01-15 09:00` |
| H | `Status` | Enum | `published` / `draft` |
| I | `Tags` | String (comma-sep) | `เลข,ป.3,พื้นฐาน` |

### Sheet: `Students`

| คอลัมน์ | ชื่อ Header | ตัวอย่าง |
|--------|------------|---------|
| A | `StudentID` | `S001` |
| B | `Name` | `ด.ช. สมชาย ใจดี` |
| C | `Email` | `somchai@school.com` |
| D | `Grade` | `ป.3` |
| E | `ClassRoom` | `3/1` |

### ค่าที่ใช้ได้ใน Grade column

```javascript
const VALID_GRADES = [
  "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6",
  "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6",
  "ทั้งหมด"  // แสดงให้ทุกระดับชั้นเห็น
];
```

---

## ฝั่งครู — Teacher Interface

### 1. หน้าสร้างบทเรียน (Create Lesson)

#### UI Components ที่ต้องมี

```html
<!-- Grade Selector — สำคัญมาก ต้องเด่นชัด -->
<div class="grade-selector">
  <label>🎯 ระดับชั้นเป้าหมาย</label>
  <div class="grade-pills">
    <button class="pill" data-grade="ป.1">ป.1</button>
    <button class="pill" data-grade="ป.2">ป.2</button>
    <button class="pill" data-grade="ป.3">ป.3</button>
    <button class="pill" data-grade="ป.4">ป.4</button>
    <button class="pill" data-grade="ป.5">ป.5</button>
    <button class="pill" data-grade="ป.6">ป.6</button>
    <button class="pill pill--all" data-grade="ทั้งหมด">🌐 ทั้งหมด</button>
  </div>
  <!-- แสดง validation ถ้ายังไม่เลือก -->
  <span class="error-msg" id="grade-error" style="display:none">
    ⚠️ กรุณาเลือกระดับชั้นก่อนบันทึก
  </span>
</div>
```

#### Logic การบันทึก (Save Logic)

```javascript
async function saveLesson(formData) {
  // Validation: ต้องเลือก Grade ก่อนเสมอ
  if (!formData.grade) {
    showError("grade-error");
    return;
  }

  const lessonData = {
    LessonID: generateID(),          // "L" + timestamp
    Title: formData.title,
    Content: formData.content,
    Grade: formData.grade,           // ← คีย์สำคัญ
    Subject: formData.subject,
    CreatedBy: getCurrentUserEmail(),
    CreatedAt: new Date().toISOString(),
    Status: formData.isDraft ? "draft" : "published",
    Tags: formData.tags.join(",")
  };

  await appendToSheet("Lessons", lessonData);
  showSuccess(`✅ บันทึกบทเรียนสำหรับ ${formData.grade} เรียบร้อยแล้ว`);
}
```

---

### 2. หน้าจัดการเนื้อหา (Content Manager Dashboard)

#### Color Coding ตามระดับชั้น

```javascript
// สีประจำระดับชั้น — ใช้สม่ำเสมอทั่วทั้งระบบ
const GRADE_COLORS = {
  "ป.1": { bg: "#FFF3E0", border: "#FF9800", badge: "#E65100" },
  "ป.2": { bg: "#F3E5F5", border: "#9C27B0", badge: "#6A1B9A" },
  "ป.3": { bg: "#E3F2FD", border: "#2196F3", badge: "#0D47A1" },
  "ป.4": { bg: "#E8F5E9", border: "#4CAF50", badge: "#1B5E20" },
  "ป.5": { bg: "#FFF8E1", border: "#FFC107", badge: "#E65100" },
  "ป.6": { bg: "#FCE4EC", border: "#E91E63", badge: "#880E4F" },
  "ทั้งหมด": { bg: "#F5F5F5", border: "#9E9E9E", badge: "#424242" }
};

function renderLessonCard(lesson) {
  const colors = GRADE_COLORS[lesson.Grade] || GRADE_COLORS["ทั้งหมด"];
  return `
    <div class="lesson-card" style="
      background: ${colors.bg};
      border-left: 4px solid ${colors.border};
    ">
      <span class="grade-badge" style="background: ${colors.badge}">
        ${lesson.Grade}
      </span>
      <h3>${lesson.Title}</h3>
      <p>${lesson.Content.substring(0, 100)}...</p>
      <div class="card-actions">
        <button onclick="editLesson('${lesson.LessonID}')">✏️ แก้ไข</button>
        <button onclick="moveGrade('${lesson.LessonID}')">📦 ย้ายชั้น</button>
        <button onclick="deleteLesson('${lesson.LessonID}')">🗑️ ลบ</button>
      </div>
    </div>
  `;
}
```

#### ระบบ Filter (Grade Filter Bar)

```javascript
// Filter state
let activeGradeFilter = "ทั้งหมด"; // default = แสดงทุกชั้น

function filterLessons(grade) {
  activeGradeFilter = grade;
  const allLessons = getAllLessonsFromSheet();

  const filtered = grade === "ทั้งหมด"
    ? allLessons
    : allLessons.filter(l => l.Grade === grade || l.Grade === "ทั้งหมด");

  renderLessonGrid(filtered);
  updateFilterUI(grade);
}

// Filter Bar UI
function renderFilterBar() {
  return `
    <div class="filter-bar">
      <span>แสดง:</span>
      <button class="filter-btn active" onclick="filterLessons('ทั้งหมด')">
        📚 ทั้งหมด
      </button>
      ${VALID_GRADES.filter(g => g !== 'ทั้งหมด').map(grade => `
        <button class="filter-btn" onclick="filterLessons('${grade}')">
          ${grade}
        </button>
      `).join('')}
    </div>
  `;
}
```

#### ฟีเจอร์ย้ายชั้น (Move Grade) — ไม่ต้องลบแล้วสร้างใหม่

```javascript
async function moveGrade(lessonID) {
  const lesson = await getLessonByID(lessonID);
  const currentGrade = lesson.Grade;

  // แสดง Modal เลือกชั้นใหม่
  const newGrade = await showGradePickerModal({
    title: `ย้าย "${lesson.Title}"`,
    currentGrade: currentGrade,
    message: `ปัจจุบันอยู่ที่ ${currentGrade} → เลือกชั้นใหม่`
  });

  if (newGrade && newGrade !== currentGrade) {
    await updateSheetCell(lessonID, "Grade", newGrade);
    showSuccess(`✅ ย้ายบทเรียนจาก ${currentGrade} → ${newGrade} สำเร็จ`);
    refreshDashboard();
  }
}
```

#### สรุปยอดต่อชั้น (Grade Summary Stats)

```javascript
function renderGradeSummary(lessons) {
  const summary = VALID_GRADES.reduce((acc, grade) => {
    acc[grade] = lessons.filter(l => l.Grade === grade).length;
    return acc;
  }, {});

  return `
    <div class="grade-summary">
      ${Object.entries(summary).map(([grade, count]) => `
        <div class="summary-chip" style="border-color: ${GRADE_COLORS[grade]?.border}">
          <strong>${grade}</strong>
          <span>${count} บทเรียน</span>
        </div>
      `).join('')}
    </div>
  `;
}
```

---

## ฝั่งนักเรียน — Student Interface

### 1. Automatic Content Filtering

```javascript
// ขั้นตอนหลักเมื่อนักเรียน Login
async function initStudentDashboard(studentEmail) {
  // Step 1: ดึง Profile ของนักเรียน
  const studentProfile = await getStudentProfile(studentEmail);
  const studentGrade = studentProfile.Grade; // เช่น "ป.3"

  // Step 2: ดึงเฉพาะบทเรียนที่ตรงกับชั้น + บทเรียนสำหรับ "ทั้งหมด"
  const lessons = await getFilteredLessons(studentGrade);

  // Step 3: Render
  renderStudentView(lessons, studentProfile);
}

async function getFilteredLessons(studentGrade) {
  const allLessons = await fetchAllPublishedLessons();

  // กรองเฉพาะ: ตรงชั้น OR เป็น "ทั้งหมด"
  return allLessons.filter(lesson =>
    lesson.Grade === studentGrade || lesson.Grade === "ทั้งหมด"
  );
}
```

### 2. Student View UI

```javascript
function renderStudentView(lessons, profile) {
  const gradeColor = GRADE_COLORS[profile.Grade];

  document.getElementById("app").innerHTML = `
    <!-- Header แสดงข้อมูลนักเรียน -->
    <header class="student-header" style="background: ${gradeColor.bg}">
      <div class="student-info">
        <span class="grade-tag" style="background: ${gradeColor.badge}">
          ${profile.Grade}
        </span>
        <h2>สวัสดี, ${profile.Name}!</h2>
        <p>ห้อง ${profile.ClassRoom}</p>
      </div>
      <div class="lesson-count">
        📚 ${lessons.length} บทเรียนสำหรับคุณ
      </div>
    </header>

    <!-- รายการบทเรียน -->
    <main class="lesson-grid">
      ${lessons.map(lesson => renderStudentLessonCard(lesson)).join('')}
    </main>
  `;
}

function renderStudentLessonCard(lesson) {
  // นักเรียนไม่เห็น Grade badge (ไม่จำเป็นต้องรู้)
  return `
    <div class="student-lesson-card">
      <div class="lesson-subject-tag">${lesson.Subject}</div>
      <h3>${lesson.Title}</h3>
      <p class="lesson-preview">${lesson.Content.substring(0, 150)}...</p>
      <button onclick="openLesson('${lesson.LessonID}')">
        📖 เริ่มเรียน
      </button>
    </div>
  `;
}
```

---

## Google Apps Script — Backend Functions

```javascript
// ฟังก์ชันหลักที่ต้องมี (deploy เป็น Web App)

const SHEET_NAME_LESSONS = "Lessons";
const SHEET_NAME_STUDENTS = "Students";
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

/**
 * GET /exec?action=getStudentLessons&email=xxx@school.com
 * ดึงบทเรียนตาม Grade ของนักเรียน
 */
function doGet(e) {
  const action = e.parameter.action;

  if (action === "getStudentLessons") {
    return getStudentLessons(e.parameter.email);
  }
  if (action === "getAllLessons") {
    return getAllLessons();
  }
  if (action === "getStudent") {
    return getStudentProfile(e.parameter.email);
  }
}

function getStudentLessons(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // หา grade ของนักเรียน
  const studentSheet = ss.getSheetByName(SHEET_NAME_STUDENTS);
  const students = studentSheet.getDataRange().getValues();
  const headers = students[0];
  const emailCol = headers.indexOf("Email");
  const gradeCol = headers.indexOf("Grade");

  const studentRow = students.find(row => row[emailCol] === email);
  if (!studentRow) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Student not found" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const studentGrade = studentRow[gradeCol]; // เช่น "ป.3"

  // ดึงบทเรียนที่ตรงกับ grade หรือ "ทั้งหมด"
  const lessonSheet = ss.getSheetByName(SHEET_NAME_LESSONS);
  const lessons = lessonSheet.getDataRange().getValues();
  const lessonHeaders = lessons[0];
  const lessonGradeCol = lessonHeaders.indexOf("Grade");
  const statusCol = lessonHeaders.indexOf("Status");

  const filtered = lessons
    .slice(1) // skip header
    .filter(row =>
      row[statusCol] === "published" &&
      (row[lessonGradeCol] === studentGrade || row[lessonGradeCol] === "ทั้งหมด")
    )
    .map(row => {
      const obj = {};
      lessonHeaders.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });

  return ContentService.createTextOutput(
    JSON.stringify({ grade: studentGrade, lessons: filtered })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST /exec
 * บันทึกบทเรียนใหม่ (Teacher only)
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === "createLesson") {
    return createLesson(data.lesson);
  }
  if (action === "updateLesson") {
    return updateLesson(data.lessonID, data.updates);
  }
  if (action === "deleteLesson") {
    return deleteLesson(data.lessonID);
  }
}

function createLesson(lesson) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_LESSONS);

  // สร้าง ID อัตโนมัติ
  const lastRow = sheet.getLastRow();
  const lessonID = "L" + String(lastRow).padStart(4, "0");

  sheet.appendRow([
    lessonID,
    lesson.Title,
    lesson.Content,
    lesson.Grade,       // ← Grade เก็บตรงนี้
    lesson.Subject,
    lesson.CreatedBy,
    new Date().toISOString(),
    lesson.Status || "draft",
    (lesson.Tags || []).join(",")
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, lessonID })
  ).setMimeType(ContentService.MimeType.JSON);
}

function updateLesson(lessonID, updates) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_LESSONS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("LessonID");

  const rowIndex = data.findIndex(row => row[idCol] === lessonID);
  if (rowIndex === -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Lesson not found" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // อัปเดตเฉพาะ field ที่ส่งมา
  Object.entries(updates).forEach(([field, value]) => {
    const colIndex = headers.indexOf(field);
    if (colIndex !== -1) {
      sheet.getRange(rowIndex + 1, colIndex + 1).setValue(value);
    }
  });

  return ContentService.createTextOutput(
    JSON.stringify({ success: true })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

---

## Security & Access Control

### แนวทางป้องกันนักเรียนเข้าถึงเนื้อหาผิดชั้น

```javascript
// ❌ อย่าทำแบบนี้: filter ที่ฝั่ง client อย่างเดียว
// (นักเรียนสามารถแก้ไข JavaScript เพื่อดูเนื้อหาชั้นอื่นได้)

// ✅ ทำแบบนี้: filter ที่ฝั่ง server (Apps Script) เสมอ
// ส่งเฉพาะข้อมูลที่นักเรียนควรเห็นกลับไป

// นอกจากนี้ควรตรวจสอบ session ทุกครั้ง:
function validateStudentSession(sessionToken, requestedGrade) {
  const session = getSessionFromStore(sessionToken);
  if (!session || session.grade !== requestedGrade) {
    throw new Error("Unauthorized access");
  }
}
```

### Teacher Authorization

```javascript
const TEACHER_EMAILS = [
  "teacher1@school.com",
  "teacher2@school.com",
  "admin@school.com"
];

function isTeacher(email) {
  return TEACHER_EMAILS.includes(email);
  // หรือเช็คจาก Sheet "Teachers" แทนก็ได้
}

function requireTeacher(email) {
  if (!isTeacher(email)) {
    throw new Error("403: Teacher access required");
  }
}
```

---

## Checklist สำหรับ Implementation

### ✅ Phase 1: Data Layer
- [ ] สร้าง Google Sheet ตาม Schema ด้านบน
- [ ] เพิ่มคอลัมน์ `Grade` ในชีต Lessons
- [ ] Deploy Apps Script เป็น Web App
- [ ] ทดสอบ `getStudentLessons()` กับข้อมูลจำลอง

### ✅ Phase 2: Teacher UI
- [ ] หน้าสร้างบทเรียน + Grade Selector
- [ ] Content Manager พร้อม Color Coding
- [ ] Filter Bar แยกตามชั้น
- [ ] ปุ่มย้ายชั้น (Move Grade) โดยไม่ต้องสร้างใหม่
- [ ] Grade Summary Stats

### ✅ Phase 3: Student UI
- [ ] Login → ดึง Profile → filter อัตโนมัติ
- [ ] Student Dashboard แสดงเฉพาะบทเรียนของชั้นตัวเอง
- [ ] UI สะอาด ไม่โชว์ Grade Badge ให้นักเรียนเห็น

### ✅ Phase 4: Security
- [ ] Validate session ทุก API call
- [ ] Filter ที่ server-side เท่านั้น
- [ ] Teacher auth check ก่อนทุก write operation

---

## ข้อควรระวัง (Common Pitfalls)

| ปัญหา | สาเหตุ | วิธีแก้ |
|------|--------|---------|
| นักเรียนเห็นเนื้อหาชั้นอื่น | Filter อยู่ที่ client เท่านั้น | ย้าย filter logic ไปไว้ใน Apps Script |
| ครูลืมเลือก Grade | ไม่มี validation | บังคับเลือกก่อน submit เสมอ |
| Grade สะกดไม่ตรงกัน | ใช้ free-text input | ใช้ dropdown หรือ pill buttons เท่านั้น |
| บทเรียน "ทั้งหมด" ไม่แสดง | Filter แบบ strict equality | เพิ่ม `|| Grade === "ทั้งหมด"` ใน filter |
| Performance ช้าเมื่อข้อมูลมาก | ดึงทุก row มา filter | เพิ่ม index หรือ cache ใน Apps Script |

---

## ตัวอย่างการเรียกใช้งาน (Usage Examples)

```javascript
// ตัวอย่าง: ครูสร้างบทเรียนสำหรับ ป.3
const newLesson = {
  title: "การบวกเลขสองหลัก",
  content: "วันนี้เราจะเรียนรู้การบวกเลขสองหลัก...",
  grade: "ป.3",
  subject: "คณิตศาสตร์",
  tags: ["เลข", "บวก", "ป.3"]
};
await saveLesson(newLesson);

// ตัวอย่าง: นักเรียน ป.3 login → ได้เห็น
// - บทเรียน Grade = "ป.3" ทั้งหมด
// - บทเรียน Grade = "ทั้งหมด" ทั้งหมด
// - ไม่เห็นบทเรียน Grade = "ป.4", "ป.5", "ป.6" เลย

const studentEmail = "nong.lek@school.com";
const lessons = await getFilteredLessons(studentEmail);
// → [{Title: "การบวกเลขสองหลัก", Grade: "ป.3"}, ...]
```
