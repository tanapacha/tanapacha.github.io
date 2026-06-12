const fs = require('fs');
const path = require('path');

const dir = 'd:\\เว็บวิจัย';

const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let changedCount = 0;

for (const file of htmlFiles) {
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  let newContent = content;

  // Student
  newContent = newContent.replace(/(href="assignments\.html".*?)data-icon="[^"]+"/g, '$1data-icon="target"');
  newContent = newContent.replace(/(href="quiz-list\.html".*?)data-icon="[^"]+"/g, '$1data-icon="puzzle"');
  newContent = newContent.replace(/(href="report\.html".*?)data-icon="[^"]+"/g, '$1data-icon="pieChart"');

  // Teacher
  newContent = newContent.replace(/(href="teacher-dashboard\.html".*?)data-icon="[^"]+"/g, '$1data-icon="layout"');
  newContent = newContent.replace(/(href="teacher-manage-content\.html".*?)data-icon="[^"]+"/g, '$1data-icon="layers"');
  newContent = newContent.replace(/(href="teacher-create-lesson\.html".*?)data-icon="[^"]+"/g, '$1data-icon="filePlus"');
  newContent = newContent.replace(/(href="teacher-create-exercise\.html".*?)data-icon="[^"]+"/g, '$1data-icon="clipboardPlus"');
  newContent = newContent.replace(/(href="teacher-create-problem\.html".*?)data-icon="[^"]+"/g, '$1data-icon="helpCircle"');
  newContent = newContent.replace(/(href="teacher-create-game\.html".*?)data-icon="[^"]+"/g, '$1data-icon="gamepad"');
  newContent = newContent.replace(/(href="teacher-check-assignments\.html".*?)data-icon="[^"]+"/g, '$1data-icon="clipboardCheck"');
  newContent = newContent.replace(/(href="teacher-student-grades\.html".*?)data-icon="[^"]+"/g, '$1data-icon="chart"'); // usually already chart, but make sure

  if (content !== newContent) {
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`Updated ${file}`);
    changedCount++;
  }
}

console.log(`Finished updating. ${changedCount} files modified.`);
