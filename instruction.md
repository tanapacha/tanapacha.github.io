📑 Project Manual: DocFlow System (Faculty of Education)
1. Vision & Concept (เป้าหมายของระบบ)
ระบบติดตามเอกสาร (Workflow) ภายในคณะครุศาสตร์ ที่เปลี่ยนจากการเดินเอกสารกระดาษมาเป็นระบบดิจิทัล 100% โดยใช้ Google Ecosystem เป็นหลัก เน้นความยืดหยุ่น (Hybrid) ที่ผู้ใช้สามารถเลือกเส้นทางเดินเอกสารได้ทั้งแบบอัตโนมัติ (Auto) และกำหนดเอง (Manual)

2. Technical Stack (โครงสร้างทางเทคนิค)
Frontend (ในเครื่อง): HTML5, Tailwind CSS, React & Ant Design 5.0 (เรียกผ่าน CDN ทั้งหมด ไม่ต้องติดตั้ง Node.js)

Bridge (ตัวเชื่อม): api.js ใช้ฟังก์ชัน fetch() เพื่อส่ง Request แบบ POST ไปยัง Web App URL ของ Google Apps Script

Backend (บนคลาวด์): Google Apps Script (GAS) เขียนด้วยไฟล์ Code.gs (หรือ combined.gs) รับข้อมูลผ่านฟังก์ชัน doPost(e)

Database: Google Sheets แบ่งเป็น 4 แท็บหลัก

3. Database Schema (โครงสร้างฐานข้อมูลใน Google Sheets)
AI ต้องยึดถือชื่อแท็บและหัวตาราง (Headers) ตามนี้เท่านั้น:

Users_Mapping: เก็บข้อมูลสมาชิกและสังกัด

Headers: Email, FullName, Department, Position, Role

Workflow_Settings: เก็บเทมเพลตเส้นทางเดินเอกสาร (สำหรับ Auto Mode)

Headers: DocType, Step1, Step2, Step3, Step4, Step5

Documents_Main: ฐานข้อมูลเอกสารทั้งหมดในระบบ

Headers: DocID, Title, SenderEmail, DocType, CurrentStepIndex, AssignedToEmail, Status (pending/approved/rejected), FileLink

Action_Logs: บันทึกประวัติการขยับของเอกสาร (Audit Trail)

Headers: LogID, DocID, UserEmail, Action, Comment, Timestamp

4. Core Workflow Logic (หลักการทำงานของหัวใจระบบ)
A. การระบุตัวตน (Identity Chain)
เมื่อเปิดหน้า index.html ระบบจะใช้ api.js ถามไปที่ Code.gs ว่าอีเมลของผู้ใช้รายนี้มีอยู่ใน Users_Mapping หรือยัง?

ถ้ามี: เข้าสู่หน้า Dashboard (status.html)

ถ้าไม่มี: บังคับไปหน้าลงทะเบียน (register.html) เพื่อเลือกฝ่ายงาน

B. ระบบส่งเอกสารแบบ Hybrid (Submission)
ในหน้า submitDoc.html ผู้ใช้เลือกได้ 2 แบบ:

Auto Mode: เลือกประเภทเอกสาร (เช่น "ขอซื้อพัสดุ") -> ระบบไปดึงลำดับจาก Workflow_Settings มาตั้งค่าให้อัตโนมัติ

Manual Mode: ผู้ใช้กดปุ่ม (+) เพื่อเลือกฝ่ายงาน (เช่น งานการเงิน -> หัวหน้าสำนักงาน) มาเรียงลำดับเองเป็นทอดๆ

C. การวิ่งผลัดเอกสาร (The Relay Race)
เมื่อเอกสารถูกส่ง -> ระบบส่งอีเมลแจ้งคนลำดับที่ 1

คนลำดับที่ 1 กด Approve ในหน้า approval.html -> ระบบขยับ CurrentStepIndex ในชีท และส่งอีเมลหาคนลำดับที่ 2 ทันที

หากมีการ Reject -> เอกสารจะหยุดสภาวะ pending และส่งอีเมลแจ้งเตือนผู้ส่งพร้อมเหตุผล

5. Directory Mapping (สรุปหน้าที่ 10 หน้าเว็บ)
เทรน AI ให้รู้ว่าแต่ละไฟล์มีหน้าที่อะไร:

index.html: ประตูหน้าบ้าน / Login

register.html: ลงทะเบียนฝ่ายงาน (บริหาร, วิชาการ, วิจัย, IT)

submitDoc.html: ฟอร์มสร้างเอกสารและตั้งค่า Workflow

status.html: Dashboard ดูภาพรวมและ Visual Timeline ของงานตัวเอง

approval.html: หน้าหลักสำหรับ "ผู้รับ" เพื่อกด อนุมัติ/ตีกลับ

myTasks.html: รายการ To-do list (งานที่ค้างอยู่ที่เรา)

history.html: คลังเก็บเอกสารที่ดำเนินการเสร็จสิ้นแล้ว

activityLog.html: บันทึกการกระทำทุกอย่างในระบบ (สำหรับตรวจสอบ)

profile.html: จัดการข้อมูลส่วนตัวและอีเมล

admin.html: ตั้งค่าระบบและจัดการ Template Workflow

6. Communication Protocol (กฎการส่งข้อมูล)
ทุกหน้าห้ามคุยกับ Google Sheets โดยตรง

หน้าบ้าน -> เรียกฟังก์ชันใน api.js -> fetch(POST) -> GAS (doPost) -> Google Sheets

Response จากหลังบ้านต้องเป็น JSON เสมอ เช่น { "status": "success", "data": [...] }