const fs = require('fs');
const path = require('path');

const unifiedSidebar = `
    <div class="sidebar-section">
      <div class="sidebar-section-label">เมนูการเรียน</div>
      <a href="dashboard.html" class="sidebar-nav-item" data-page="dashboard.html"><span class="nav-icon" data-icon="home"></span>หน้าแรก</a>
      <a href="lessons-list.html" class="sidebar-nav-item" data-page="lessons-list.html"><span class="nav-icon" data-icon="bookOpen"></span>บทเรียนของฉัน</a>
      <a href="assignments.html" class="sidebar-nav-item" data-page="assignments.html"><span class="nav-icon" data-icon="upload"></span>ภารกิจและส่งงาน</a>
      <a href="quiz-list.html" class="sidebar-nav-item" data-page="quiz-list.html"><span class="nav-icon" data-icon="task"></span>โจทย์ปัญหา</a>
      <a href="report.html" class="sidebar-nav-item" data-page="report.html"><span class="nav-icon" data-icon="chart"></span>ผลการเรียน</a>
    </div>

    <!-- Admin Only Section -->
    <div class="sidebar-section admin-only" style="margin-top: var(--sp-4); display: none;">
      <div class="sidebar-section-label">เมนูการจัดการ (ครู)</div>
      <a href="teacher-dashboard.html" class="sidebar-nav-item" data-page="teacher-dashboard.html"><span class="nav-icon" data-icon="home"></span>แผงควบคุม</a>
      <a href="teacher-manage-content.html" class="sidebar-nav-item" data-page="teacher-manage-content.html"><span class="nav-icon" data-icon="bookOpen"></span>จัดการเนื้อหา</a>
      <div class="flex flex-col gap-1 mb-2" style="padding-left: 2.75rem; border-left: 1.5px solid var(--border-subtle); margin-left: 1.25rem;">
        <a href="teacher-create-lesson.html" class="t-xs fw-bold transition-colors py-1 flex items-center gap-2 sidebar-sub-item" data-page="teacher-create-lesson.html" style="color:var(--text-secondary); text-decoration:none;"><span data-icon="plus" style="width:12px; height:12px;"></span>สร้างบทเรียน</a>
        <a href="teacher-create-exercise.html" class="t-xs fw-bold transition-colors py-1 flex items-center gap-2 sidebar-sub-item" data-page="teacher-create-exercise.html" style="color:var(--text-secondary); text-decoration:none;"><span data-icon="plus" style="width:12px; height:12px;"></span>สร้างภารกิจ</a>
        <a href="teacher-create-problem.html" class="t-xs fw-bold transition-colors py-1 flex items-center gap-2 sidebar-sub-item" data-page="teacher-create-problem.html" style="color:var(--text-secondary); text-decoration:none;"><span data-icon="plus" style="width:12px; height:12px;"></span>สร้างโจทย์</a>
        <a href="teacher-create-game.html" class="t-xs fw-bold transition-colors py-1 flex items-center gap-2 sidebar-sub-item" data-page="teacher-create-game.html" style="color:var(--text-secondary); text-decoration:none;"><span data-icon="plus" style="width:12px; height:12px;"></span>สร้างเกม</a>
      </div>
      <a href="teacher-check-assignments.html" class="sidebar-nav-item" data-page="teacher-check-assignments.html"><span class="nav-icon" data-icon="checkCircle"></span>ตรวจงานนักเรียน</a>
      <a href="teacher-student-grades.html" class="sidebar-nav-item" data-page="teacher-student-grades.html"><span class="nav-icon" data-icon="chart"></span>จัดการคะแนนรวม</a>
    </div>
    `;

const dir = 'd:/เว็บวิจัย';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updated = 0;
for (const file of files) {
  if(file === 'index.html' || file === 'login.html' || file === 'register.html') continue;
  
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  const startMarker = '<div class="sidebar-logo-text">KIDDO</div>\\s*</div>\\s*';
  const endMarker = '\\s*<div class="sidebar-footer">';
  const regex = new RegExp('(' + startMarker + ')[\\s\\S]*?(' + endMarker + ')', 'i');
  
  if (regex.test(content)) {
    content = content.replace(regex, '$1' + unifiedSidebar + '$2');
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
    updated++;
    console.log('Updated ' + file);
  } else {
    console.log('Could not match regex in ' + file);
  }
}
console.log('Total Updated: ' + updated);
