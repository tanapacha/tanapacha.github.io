---
name: kiddo-learning
description: >
  ทักษะสำหรับพัฒนาและอัปเกรดโปรเจค KIDDO LEARNING — แพลตฟอร์ม E-learning ระดับพรีเมียม
  สำหรับวิชาวิทยาการคำนวณ ชั้นประถมศึกษาปีที่ 4 ที่มีระบบ Role-based (Student/Teacher)
  ครอบคลุม Logic การทำงาน, UX/UI Design, และ Serverless Architecture ด้วย Google Apps Script.
  ใช้ทักษะนี้ทุกครั้งที่มีการพัฒนา feature ใหม่, แก้ไข component, ออกแบบ flow, วาง layout,
  เขียน backend logic, หรืออัปเกรดส่วนใดส่วนหนึ่งของ KIDDO LEARNING — แม้จะไม่ได้ระบุชื่อโปรเจคตรงๆ
  ก็ตาม หากบริบทเกี่ยวข้องกับ LMS สำหรับเด็ก, ระบบตรวจงาน, Gamification, หรือ Google Sheets backend
  ให้ใช้ทักษะนี้เสมอ
---

# KIDDO LEARNING — Master Skill Guide

## ภาพรวมโปรเจค

KIDDO LEARNING เป็น **Learning Management System (LMS)** แบบ Serverless สำหรับนักเรียน ป.4
วิชาวิทยาการคำนวณ มีผู้ใช้ 2 บทบาทหลัก และใช้ Google Apps Script + Google Sheets เป็น Backend

```
Stack:
  Frontend  → HTML / CSS / Vanilla JS (Single Page Application)
  Backend   → Google Apps Script (GAS) — doGet / doPost
  Database  → Google Sheets (แต่ละ Sheet = แต่ละ Table)
  Hosting   → Google Apps Script Web App (Deploy as Web App)
  Assets    → Google Drive (วิดีโอ / ไฟล์งาน)
```

---

## 1. Architecture & Logic

### 1.1 Role-Based Access Control (RBAC)

```
User Roles:
  STUDENT  → เรียน / ส่งงาน / ทำ Quiz / ดูผล
  TEACHER  → จัดการเนื้อหา / ตรวจงาน / ดู Analytics
  ADMIN    → ควบคุมทุกส่วน (รวม Teacher)

Auth Flow:
  1. User กรอก username + password / เลขที่ + ชั้น
  2. GAS ตรวจสอบกับ Sheet "Users"
  3. ได้รับ sessionToken → เก็บใน sessionStorage
  4. ทุก API call ต้องแนบ token → GAS validate ก่อน response
```

### 1.2 Data Model (Google Sheets Structure)

| Sheet Name        | Columns หลัก                                          | หมายเหตุ              |
|-------------------|-------------------------------------------------------|-----------------------|
| `Users`           | id, name, role, class, studentNo, email, password     | hash password         |
| `Lessons`         | id, topicId, title, videoUrl, description, order      | เรียงลำดับบทเรียน     |
| `Topics`          | id, title, description, icon, order                   | หัวข้อหลัก            |
| `Assignments`     | id, lessonId, title, description, dueDate             | โจทย์แบบฝึกหัด        |
| `Submissions`     | id, assignmentId, studentId, fileUrl, status, score   | งานที่นักเรียนส่ง     |
| `Quizzes`         | id, lessonId, questions (JSON), passingScore          | ข้อสอบ                |
| `QuizResults`     | id, quizId, studentId, score, answers (JSON), date    | ผลสอบ                 |
| `Missions`        | id, title, condition, rewardPoints, icon              | เงื่อนไข Gamification |
| `MissionProgress` | id, missionId, studentId, completedAt                 | ภารกิจที่สำเร็จ       |
| `Stickers`        | id, name, imageUrl, category                          | สติ๊กเกอร์ชมเชย      |

### 1.3 API Endpoint Pattern (GAS doPost)

```javascript
// ทุก request ส่งมาเป็น JSON body:
{
  "action": "ACTION_NAME",
  "token": "SESSION_TOKEN",
  "payload": { ...data }
}

// Response format มาตรฐาน:
{
  "success": true | false,
  "data": { ...result },
  "message": "คำอธิบาย"
}
```

**Actions หลักที่ต้องมี:**

```
AUTH:
  login               → validate credentials, return token
  logout              → invalidate token

STUDENT ACTIONS:
  getLessons          → ดึงบทเรียนทั้งหมด
  getLessonDetail     → ดึงรายละเอียดบทเรียน + video
  submitAssignment    → ส่งไฟล์งาน (base64 หรือ Drive link)
  submitQuiz          → ส่งคำตอบ → คำนวณคะแนนทันที
  getMyProgress       → ดู progress / คะแนน / missions
  getMySubmissions    → ดูงานที่ส่งพร้อมผลตรวจ

TEACHER ACTIONS:
  createLesson        → สร้างบทเรียน
  updateLesson        → แก้ไขบทเรียน
  deleteLesson        → ลบบทเรียน
  createQuiz          → สร้างข้อสอบ
  gradeSubmission     → ให้คะแนน + sticker + คำแนะนำ
  getClassAnalytics   → ภาพรวมคะแนนทั้งชั้น
  getStudentDetail    → รายละเอียดนักเรียนรายบุคคล
```

### 1.4 Caching Strategy

```javascript
// Client-side cache เพื่อลด API calls
const cache = {
  lessons: { data: null, expiry: 0 },
  topics:  { data: null, expiry: 0 },
};

const CACHE_TTL = 5 * 60 * 1000; // 5 นาที

async function getCachedLessons() {
  if (cache.lessons.data && Date.now() < cache.lessons.expiry) {
    return cache.lessons.data;
  }
  const fresh = await apiCall('getLessons');
  cache.lessons = { data: fresh, expiry: Date.now() + CACHE_TTL };
  return fresh;
}
```

### 1.5 Mission & Gamification Logic

```
ระบบตรวจ Mission อัตโนมัติ ทุกครั้งที่:
  - นักเรียนส่งงาน (submitAssignment)
  - นักเรียนทำ Quiz สำเร็จ (submitQuiz)
  - นักเรียนเข้าเรียนบทใหม่

Conditions ตัวอย่าง:
  "first_submission"     → ส่งงานครั้งแรก
  "quiz_score_100"       → ได้ 100% ใน Quiz
  "complete_5_lessons"   → เรียนจบ 5 บทเรียน
  "weekly_login_streak"  → เข้าระบบ 5 วันติดกัน

เมื่อ mission สำเร็จ → เพิ่มแถวใน MissionProgress + อัปเดต Points ใน Users
```

---

## 2. UX / UI Design System

### 2.1 Design Language — "Warm Modern"

```
Theme: สีส้ม-ม่วง อบอุ่น ทันสมัย เหมาะกับเด็กแต่ดูมืออาชีพ

Primary Colors:
  --primary:        #FF6B35   /* ส้มสด — CTA, Progress */
  --primary-light:  #FF8C5A   /* ส้มอ่อน — Hover */
  --secondary:      #6C63FF   /* ม่วง — Accent, Badge */
  --success:        #4CAF50   /* เขียว — สำเร็จ, Correct */
  --warning:        #FFC107   /* เหลือง — คำเตือน */
  --danger:         #F44336   /* แดง — ผิด, Error */

Neutral:
  --bg:             #F8F6FF   /* พื้นหลังม่วงอ่อนมาก */
  --surface:        #FFFFFF   /* Card / Panel */
  --text-primary:   #1A1A2E   /* ข้อความหลัก */
  --text-secondary: #6B7280   /* ข้อความรอง */
  --border:         #E5E7EB   /* เส้นขอบ */

Typography:
  Font Family: 'Noto Sans Thai', 'Prompt', sans-serif
  Heading:     700 weight, tight line-height
  Body:        400 weight, 1.6 line-height
  Caption:     400 weight, 0.85rem

Spacing System (8px base):
  xs: 4px  | sm: 8px  | md: 16px
  lg: 24px | xl: 32px | 2xl: 48px

Border Radius:
  sm: 8px | md: 12px | lg: 16px | xl: 24px | pill: 9999px

Shadow:
  card:    0 2px 8px rgba(0,0,0,0.08)
  elevated: 0 8px 32px rgba(108,99,255,0.12)
  float:   0 16px 48px rgba(0,0,0,0.16)
```

### 2.2 Glassmorphism Component

```css
.glass-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(108, 99, 255, 0.10);
}

/* Hero / Banner sections */
.glass-hero {
  background: linear-gradient(135deg,
    rgba(255,107,53,0.15) 0%,
    rgba(108,99,255,0.15) 100%);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255,255,255,0.3);
}
```

### 2.3 Micro-animations

```css
/* Fade-in เมื่อ component mount */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Stagger สำหรับ list items */
.card-list .card:nth-child(1) { animation-delay: 0ms; }
.card-list .card:nth-child(2) { animation-delay: 80ms; }
.card-list .card:nth-child(3) { animation-delay: 160ms; }

/* Button press */
.btn-primary:active {
  transform: scale(0.96);
  transition: transform 0.1s ease;
}

/* Progress bar fill */
.progress-fill {
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Sticker pop (ฉลอง Mission) */
@keyframes stickerPop {
  0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
  70%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); }
}
```

### 2.4 Page Layout Patterns

#### Student Layout
```
┌─────────────────────────────────┐
│  TopBar: Logo | ชื่อนักเรียน | 🔔 │
├──────────┬──────────────────────┤
│ SideNav  │  Main Content Area   │
│  🏠 หน้าแรก │  (scrollable)        │
│  📚 บทเรียน │                      │
│  🎯 ภารกิจ │                      │
│  📊 ผลลัพธ์ │                      │
│  👤 โปรไฟล์ │                      │
└──────────┴──────────────────────┘
```

#### Teacher Layout
```
┌─────────────────────────────────┐
│  TopBar: Logo | ชื่อครู | Mode  │
├──────────┬──────────────────────┤
│ SideNav  │  Main Content Area   │
│  📊 ภาพรวม │                      │
│  📚 เนื้อหา │                      │
│  📝 ตรวจงาน │                      │
│  👥 นักเรียน │                      │
│  ⚙️ ตั้งค่า │                      │
└──────────┴──────────────────────┘
```

### 2.5 Component Library

#### LessonCard
```
┌─────────────────────────┐
│  [Thumbnail / Icon]     │  ← 16:9 ratio หรือ emoji icon
│                         │
│  Topic Tag              │  ← pill badge สีตาม topic
│  ชื่อบทเรียน            │  ← font-weight: 700
│  คำอธิบายสั้น (2 lines) │  ← line-clamp: 2
│                         │
│  ████████░░  80%        │  ← Progress bar
│  [เริ่มเรียน / ต่อเรียน] │  ← CTA button
└─────────────────────────┘
```

#### MissionCard
```
┌─────────────────────────┐
│  🎯  ชื่อภารกิจ     ✅/🔒 │
│  รายละเอียดเงื่อนไข      │
│  +100 XP               │  ← reward points
└─────────────────────────┘
State: locked | active | completed
```

#### GradePanel (Teacher)
```
┌─────────────────────────────────────┐
│  นักเรียน: ด.ช.สมชาย  ●  รอตรวจ   │
│  บทเรียน: อัลกอริทึม                 │
│  ─────────────────────              │
│  [ดูไฟล์งาน]  📎                    │
│                                     │
│  คะแนน: [____] / 100               │
│  สติ๊กเกอร์: 🌟 👍 🎉 🏆 💡         │
│  คำแนะนำ: [textarea]               │
│                                     │
│          [ส่งผลการตรวจ]             │
└─────────────────────────────────────┘
```

---

## 3. Student Experience Flow

```
[Login Page]
     ↓
[Dashboard / Home]
  ├─ Hero Banner: คะแนน + ระดับ + XP bar
  ├─ Active Missions (3 ล่าสุด)
  └─ Continue Learning (บทเรียนค้างไว้)
     ↓
[Mission Path / Learning Path]
  ├─ แสดงบทเรียนแบบ Timeline / Map
  ├─ Locked บทที่ยังไม่ถึง
  └─ Completed ✅ / In-progress 🔄
     ↓
[Lesson Detail Page]
  ├─ วิดีโอ (embed)
  ├─ เนื้อหาสรุป
  ├─ [ทำแบบฝึกหัด] → Assignment Submission
  └─ [ทำแบบทดสอบ] → Quiz Page
     ↓
[Quiz Page]
  ├─ คำถามทีละข้อ (step-by-step)
  ├─ Timer (optional)
  └─ ผลลัพธ์ทันที + animation ฉลอง
     ↓
[Progress Report]
  ├─ คะแนนรวม / กราฟ
  ├─ Missions สำเร็จ
  └─ Feedback จากครู + Sticker
```

---

## 4. Teacher Experience Flow

```
[Teacher Dashboard]
  ├─ Summary: นักเรียน X คน | งานรอตรวจ Y ชิ้น
  ├─ Quick Actions: [+ บทเรียน] [ตรวจงาน]
  └─ Class Score Overview (bar chart)
     ↓
[Content Management]
  ├─ Lesson List (CRUD)
  │   ├─ สร้าง: title, topic, videoUrl, description
  │   └─ จัด order ด้วย drag-and-drop
  └─ Quiz Builder
      ├─ เพิ่มคำถาม (Multiple Choice)
      └─ กำหนด passing score
     ↓
[Assignment Inbox]
  ├─ Filter: ทั้งหมด | รอตรวจ | ตรวจแล้ว
  ├─ Sort: วันที่ส่ง | ชื่อนักเรียน | บทเรียน
  └─ [เปิดตรวจ] → GradePanel
     ↓
[Student Analytics]
  ├─ ตารางคะแนนทั้งชั้น
  ├─ Highlight: นักเรียนที่ต้องช่วยเหลือ (คะแนน < 50%)
  └─ Click นักเรียน → ดูประวัติรายบุคคล
```

---

## 5. Implementation Rules & Best Practices

### 5.1 GAS Backend Rules

```javascript
// ✅ DO: ตรวจ token ก่อนทุก action
function handleRequest(action, token, payload) {
  const user = validateToken(token);
  if (!user) return error('UNAUTHORIZED');

  // ✅ DO: ตรวจ role ก่อน destructive actions
  if (action === 'deleteLesson' && user.role !== 'TEACHER') {
    return error('FORBIDDEN');
  }
}

// ✅ DO: ใช้ SpreadsheetApp.getActive() ไม่ใช่ openById ใน Web App context
const ss = SpreadsheetApp.getActiveSpreadsheet();

// ✅ DO: Lock sheet ก่อน write เพื่อป้องกัน race condition
const lock = LockService.getScriptLock();
lock.tryLock(10000);
// ... write operations ...
lock.releaseLock();

// ❌ DON'T: อย่า return error โดยตรง — ให้ return JSON เสมอ
// ❌ DON'T: อย่า log ข้อมูลส่วนตัว (password, token) ใน Logger
```

### 5.2 Frontend Rules

```javascript
// ✅ DO: Instant UI update ก่อน API confirm (Optimistic UI)
function submitMission(missionId) {
  updateMissionUI(missionId, 'completed'); // อัปเดต UI ทันที
  apiCall('completeMission', { missionId })
    .catch(() => updateMissionUI(missionId, 'failed')); // rollback ถ้า error
}

// ✅ DO: แสดง Loading state ทุก async operation
async function loadLessons() {
  showSkeleton();
  const lessons = await getCachedLessons();
  hideSkeleton();
  renderLessons(lessons);
}

// ✅ DO: Error boundary — แสดง friendly message
function handleApiError(err) {
  showToast('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง 🙏', 'error');
  console.error('[KIDDO]', err);
}

// ❌ DON'T: อย่า store password ใน localStorage
// ❌ DON'T: อย่า call API ซ้ำโดยไม่ check cache ก่อน
```

### 5.3 Responsive Breakpoints

```css
/* Mobile first */
.lesson-grid { grid-template-columns: 1fr; }

/* Tablet */
@media (min-width: 768px) {
  .lesson-grid { grid-template-columns: repeat(2, 1fr); }
  .sidebar { display: block; }
}

/* Desktop */
@media (min-width: 1024px) {
  .lesson-grid { grid-template-columns: repeat(3, 1fr); }
}
```

### 5.4 Accessibility (สำคัญสำหรับเด็ก)

```
- Font size ต่ำสุด 16px สำหรับ body text
- Color contrast ratio ≥ 4.5:1
- ปุ่มทุกปุ่มมี aria-label
- แสดง loading indicator ที่ชัดเจน — เด็กรอไม่เป็น
- ข้อความ error เป็นภาษาไทยที่เข้าใจง่าย ไม่ใช้ technical jargon
- Sticker / reward animation ต้อง prefers-reduced-motion aware
```

---

## 6. Feature Development Checklist

เมื่อพัฒนา feature ใหม่ ให้ตรวจสอบ:

```
Logic:
  [ ] มี API action ที่ตรงกันใน GAS backend
  [ ] ตรวจ role และ token ก่อน execute
  [ ] มี error handling และ return JSON มาตรฐาน
  [ ] ใช้ LockService ถ้ามี concurrent write
  [ ] อัปเดต MissionProgress ถ้า action เกี่ยวกับการเรียนรู้

UX/UI:
  [ ] มี loading / skeleton state
  [ ] มี empty state (ยังไม่มีข้อมูล)
  [ ] มี error state พร้อม friendly message
  [ ] animation ใช้ cubic-bezier ที่นุ่มนวล
  [ ] ทดสอบ responsive บน mobile (375px), tablet (768px), desktop (1280px)

Performance:
  [ ] ข้อมูลที่ไม่เปลี่ยนบ่อยให้ cache client-side
  [ ] รูปภาพ / asset ใช้ lazy loading
  [ ] Sticker images preload ล่วงหน้า

Quality:
  [ ] ภาษาไทยถูกต้องและเข้าใจง่ายสำหรับ ป.4
  [ ] ไม่มี console.error ที่ไม่ได้รับการจัดการ
  [ ] สีและ icon สอดคล้องกับ Design System ด้านบน
```

---

## 7. ตัวอย่าง Component พร้อมใช้

### 7.1 Toast Notification

```javascript
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-in`;
  toast.innerHTML = `${icons[type]} ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
```

### 7.2 Skeleton Loader

```html
<div class="skeleton-card">
  <div class="skeleton-thumb shimmer"></div>
  <div class="skeleton-line shimmer" style="width:60%"></div>
  <div class="skeleton-line shimmer" style="width:90%"></div>
  <div class="skeleton-line shimmer" style="width:40%"></div>
</div>

<style>
  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
```

### 7.3 Quiz Auto-grade Function (GAS)

```javascript
function gradeQuiz(quizId, studentAnswers) {
  const quiz = getQuizById(quizId);
  const questions = JSON.parse(quiz.questions);
  let correct = 0;

  questions.forEach((q, i) => {
    if (studentAnswers[i] === q.correctAnswer) correct++;
  });

  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= (quiz.passingScore || 60);

  return { score, passed, correct, total: questions.length };
}
```

---

## 8. ข้อจำกัดของ GAS ที่ต้องระวัง

```
⚠️ Execution Timeout:  6 นาที (free) / 30 นาที (Workspace)
   → แก้: แบ่ง batch การ query ขนาดใหญ่

⚠️ No real-time push:  GAS ไม่มี WebSocket
   → แก้: Client poll ทุก 30 วิ สำหรับ "งานรอตรวจ"

⚠️ CORS:              Web App ต้องตั้ง "Anyone" access
   → แก้: Validate token ใน backend แทน CORS

⚠️ Sheet row limit:   10 ล้าน cells ต่อ Spreadsheet
   → แก้: Archive rows เก่าปีละครั้ง

⚠️ Concurrent writes: อาจ conflict ถ้าหลายคน submit พร้อมกัน
   → แก้: ใช้ LockService.getScriptLock() เสมอ
```
