const SPREADSHEET_ID = '10PT1FGOsGR4WV0OgR0xbnA5r0nZE3d1nmTaP2dQmMu8';
const ROOT_FOLDER_ID = '1MIU5Lk9RSgE5wC9EHFxf4Haoquw1isFL';

/**
 * Helper to get the verified user email from session or payload
 */
function getVerifiedUser(data) {
  // 1. Prioritize email sent from the frontend (Mock Login)
  const sentEmail = (data && (data.email || data.userEmail || data.senderEmail || '')).toString().toLowerCase().trim();
  if (sentEmail) return sentEmail;

  // 2. Safely fallback to Google Session if possible
  try {
    const user = Session.getActiveUser();
    if (user) {
      const sessionEmail = user.getEmail();
      if (sessionEmail) {
        const email = sessionEmail.toLowerCase().trim();
        console.warn(`[getVerifiedUser] No email in payload. Falling back to Google Session: ${email}`);
        return email;
      }
    }
  } catch (e) {
    console.warn('[getVerifiedUser] Failed to get session email:', e.message);
  }

  return '';
}

/**
 * Robust Column Header Lookup
 */
function getCol(headers, name) {
  if (!headers || !name) return -1;
  const target = name.toString().toLowerCase().trim();
  const idx = headers.findIndex(h => (h || '').toString().toLowerCase().trim() === target);
  if (idx === -1) console.warn('[Header-Ref] Missing essential column:', name);
  return idx;
}

/**
 * Helper to get a user's full name by email
 */
function getUserName(email) {
  if (!email) return 'ไม่ระบุ';
  const data = checkUser({ email: email });
  if (data.status === 'success') return data.data.FullName;
  
  // Try to clean up if it's a role or something else
  return email.split('@')[0].replace(/\./g, ' ');
}

/**
 * resolveEmailsForStep: Returns an array of email strings for a given step value (name, email, or department)
 */
function resolveEmailsForStep(stepValue) {
  if (!stepValue) return [];
  const searchVal = stepValue.toString().trim().toLowerCase();
  console.log('[resolveEmailsForStep] Input:', stepValue, 'Normalized:', searchVal);
  
  // 1. Check if it's already an email
  if (searchVal.includes('@')) return [searchVal];
  
  // 2. Normalize department search (handle dept: prefix or raw name)
  let deptSearch = searchVal;
  if (searchVal.startsWith('dept:')) {
    deptSearch = searchVal.replace('dept:', '').trim();
  }
  
  const sheet = getSheetByName('Users_Mapping');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIdx = headers.indexOf('Email');
  const nameIdx = headers.indexOf('FullName');
  const deptIdx = headers.indexOf('Department');
  
  const foundEmails = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowName = (row[nameIdx] || '').toString().trim().toLowerCase();
    const rowDept = (row[deptIdx] || '').toString().trim().toLowerCase();
    
    // Match by Full Name
    if (rowName === deptSearch || rowName === searchVal) {
      foundEmails.push(row[emailIdx]);
      continue;
    }
    // Match by Department
    if (rowDept === deptSearch) {
      foundEmails.push(row[emailIdx]);
    }
  }
  
  console.log('[resolveEmailsForStep] Found emails:', foundEmails);
  return foundEmails;
}

/**
 * sendEmailNotification: Send premium HTML email to one or more recipients
 */
function sendEmailNotification(recipients, subject, docTitle, docDescription, docID, senderName) {
  console.log('[sendEmailNotification] Attempting to send (HTML) to:', recipients);
  if (!recipients || recipients.length === 0) return;
  
  const uniqueRecipients = [...new Set(recipients.map(r => r.trim().toLowerCase()))].filter(Boolean);
  if (uniqueRecipients.length === 0) return;

  const SITE_URL = 'https://kharusatworkflow.me';
  const approvalUrl = `${SITE_URL}/approval.html?id=${docID}`;
  const primaryColor = '#ea580c';
  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background-color: ${primaryColor}; padding: 32px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Digital Workflow</h1>
          <p style="color: #ffedd5; margin: 8px 0 0; font-size: 14px; font-weight: 500;">แจ้งเตือนสถานะเอกสารในระบบ</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
          <h2 style="margin: 0 0 24px; font-size: 18px; font-weight: 700;">${subject}</h2>
          
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding-bottom: 12px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">หัวเรื่องเอกสาร</td>
              </tr>
              <tr>
                <td style="padding-bottom: 20px; font-size: 16px; font-weight: 700; color: #0f172a;">${docTitle}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px;">
                  <table style="width: 100%;">
                    <tr>
                      <td style="width: 50%;">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">ผู้ยื่นเรื่อง</div>
                        <div style="font-size: 13px; font-weight: 600;">${senderName}</div>
                      </td>
                      <td style="width: 50%;">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">รหัสอ้างอิง</div>
                        <div style="font-size: 13px; font-family: monospace; color: #ea580c; font-weight: 600;">${docID}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${docDescription ? `
              <tr>
                <td style="padding-top: 12px; border-top: 1px solid #cbd5e1;">
                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">รายละเอียด</div>
                  <div style="font-size: 13px; line-height: 1.6; color: #475569;">${docDescription}</div>
                </td>
              </tr>` : ''}
            </table>
          </div>
          
          <div style="text-align: center;">
            <a href="${approvalUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(234, 88, 12, 0.3);">
              ตรวจสอบเอกสารและดำเนินต่อ
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">หรือคัดลอกลิงก์นี้: <a href="${approvalUrl}" style="color: #64748b;">${approvalUrl}</a></p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
            ระบบเอกสารอิเล็กทรอนิกส์ คณะครุศาสตร์ มหาวิทยาลัยนครพนม<br>
            นี่เป็นอีเมลอัตโนมัติ กรุณาอย่าตอบกลับ
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: uniqueRecipients.join(','),
      subject: `[e-Doc] แจ้งเตือน: ${docTitle}`,
      htmlBody: htmlBody
    });
    console.log('[sendEmailNotification] HTML SUCCESS');
  } catch (err) {
    console.error('[sendEmailNotification] ERROR:', err.toString());
  }
}

// 🚀 --- Optimized Spreadsheet Access ---
var _ss_cached = null;
function getSS() {
  if (!_ss_cached) {
    try {
      _ss_cached = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      console.error('[CRITICAL] Failed to open Spreadsheet:', e.toString());
      throw e;
    }
  }
  return _ss_cached;
}

function getSheetByName(name) {
  const ss = getSS();
  return ss ? ss.getSheetByName(name) : null;
}

function doPost(e) {
  try {
    const postData = (e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};
    const action = postData.action;
    console.log('[DEBUG-1] doPost Started. Action:', action);

    const writeActions = ['submitDoc', 'updateStatus', 'registerUser', 'saveWorkflowTemplate'];
    const isWrite = writeActions.includes(action);
    const lock = LockService.getScriptLock();

    if (isWrite) {
      console.log('[DEBUG-2] Attempting to acquire Lock...');
      // ⏱️ Reduced wait to 5s to avoid hitting 25s timeout
      lock.waitLock(5000); 
      console.log('[DEBUG-3] Lock acquired.');
    }

    let result;
    try {
      console.log('[DEBUG-4] Processing Action:', action);
      switch (action) {
        case 'checkUser': result = checkUser(postData); break;
        case 'submitDoc': result = submitDoc(postData); break;
        case 'updateStatus': result = updateStatus(postData); break;
        case 'registerUser': result = registerUser(postData); break;
        case 'checkLogin': result = checkLogin(postData); break;
        case 'getDashboardStats': result = getDashboardStats(postData); break;
        case 'getDocuments': result = getDocuments(postData); break;
        case 'getAllTemplates': result = getAllWorkflowTemplates(); break;
        case 'saveWorkflowTemplate': result = saveWorkflowTemplate(postData.template); break;
        case 'getWorkflowParticipants': result = getWorkflowParticipants(); break;
        case 'getAdminDashboardData': result = getAdminDashboardData(); break;
        case 'adminSaveUser': result = adminSaveUser(postData.userData); break;
        case 'getDriveStats': result = getDriveStats(); break;
        case 'getSystemFiles': result = getSystemFiles(); break;
        case 'deleteDriveItem': result = deleteDriveItem(postData.itemId); break;
        default: result = { status: 'error', message: 'Unknown action' };
      }
      console.log('[DEBUG-5] Action completed logic. Status:', (result ? result.status : 'N/A'));
    } finally {
      try {
        if (isWrite) {
          lock.releaseLock();
          console.log('[DEBUG-6] Lock released.');
        }
      } catch (e) {
        console.warn('[DEBUG-6-ERR] Lock release skipped or failed:', e.toString());
      }
    }

    console.log('[DEBUG-7] Sending Response...');
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('[CRITICAL] doPost Failed:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getWorkflowTemplate(docType) {
  const sheet = getSheetByName('Workflow_Settings');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === docType) {
      const steps = [];
      for (let j = 1; j < data[i].length; j++) {
        const stepVal = (data[i][j] || '').toString().trim();
        if (stepVal) steps.push(stepVal);
      }
      return steps;
    }
  }
  return null;
}

function getAllWorkflowTemplates() {
  const sheet = getSheetByName('Workflow_Settings');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const templates = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const steps = [];
    for (let j = 1; j < row.length; j++) {
      const stepVal = (row[j] || '').toString().trim();
      if (stepVal) steps.push(stepVal);
    }
    templates.push({
      id: 'tpl-' + i,
      name: 'สายงาน ' + row[0],
      docTypes: [row[0]],
      steps: steps
    });
  }
  return templates;
}

function saveWorkflowTemplate(tpl) {
  const sheet = getSheetByName('Workflow_Settings');
  if (!sheet) return { status: 'error', message: 'Sheet not found' };
  
  const headers = sheet.getDataRange().getValues()[0];
  const col = (name) => headers.indexOf(name);
  const docTypes = tpl.docTypes || [];
  const data = sheet.getDataRange().getValues();

  docTypes.forEach(type => {
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === type) { rowIndex = i + 1; break; }
    }
    
    // Create new row matching headers
    const rowData = new Array(headers.length).fill('');
    if (col('DocType') !== -1) rowData[col('DocType')] = type;
    
    // Map steps to Step1, Step2, etc.
    if (tpl.steps) {
      tpl.steps.forEach((step, idx) => {
        const stepHeader = 'Step' + (idx + 1);
        const stepIdx = col(stepHeader);
        if (stepIdx !== -1) rowData[stepIdx] = step;
      });
    }

    if (rowIndex !== -1) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
        sheet.appendRow(rowData);
    }
  });
  return { status: 'success' };
}

function checkUser(data) {
  const email = (data.email || '').toString().trim().toLowerCase();
  const sheet = getSheetByName('Users_Mapping');
  if (!sheet) return { status: 'error', message: 'Sheet Users_Mapping not found' };

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const emailIdx = getCol(headers, 'Email');
  
  if (emailIdx === -1) return { status: 'error', message: 'อีเมลไม่พบใน Users_Mapping' };

  for (let i = 1; i < allData.length; i++) {
    const rowEmail = (allData[i][emailIdx] || '').toString().trim().toLowerCase();
    if (rowEmail === email) {
      const row = allData[i];
      const col = (name) => getCol(headers, name);
      return { 
        status: 'success', 
        data: {
          Email: row[col('Email')],
          FullName: row[col('FullName')],
          Department: row[col('Department')],
          Position: row[col('Position')],
          Group: row[col('Group')],
          Role: row[col('Role')]
        }
      };
    }
  }

  console.warn('[checkUser] User Not Found:', email);
  return { status: 'not_found', message: 'User not registered' };
}

function getOrCreateSubFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(folderName);
}

function processFileUpload(fileData, fileName, docID, senderEmail) {
  if (!fileData || !fileName) return '';
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const user = checkUser({ email: senderEmail });
    const groupName = (user.status === 'success') ? (user.data.Group || 'ทั่วไป') : 'ทั่วไป';
    const deptName = (user.status === 'success') ? (user.data.Department || 'อื่นๆ') : 'อื่นๆ';
    const groupFolder = getOrCreateSubFolder(rootFolder, groupName);
    const deptFolder = getOrCreateSubFolder(groupFolder, deptName);
    const contentType = fileData.substring(fileData.indexOf(':') + 1, fileData.indexOf(';'));
    const base64Content = fileData.substring(fileData.indexOf(',') + 1);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), contentType);
    const newFileName = docID + '_' + fileName;
    blob.setName(newFileName);
    const file = deptFolder.createFile(blob);
    
    // Optional: Try to set sharing. If domain policy blocks it, just ignore and continue.
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn('[processFileUpload] Could not set public sharing: ' + e.toString());
    }
    
    return file.getUrl();
  } catch (err) {
    console.error('Drive Upload Error:', err);
    throw new Error('Drive Error: ' + err.toString());
  }
}

function submitDoc(data) {
  console.log('[submitDoc] Starting Document submission...');
  const sheet = getSheetByName('Documents_Main');
  if (!sheet) return { status: 'error', message: 'Sheet Documents_Main not found' };

  // 1. Get headers to map columns dynamically
  const headerRow = sheet.getDataRange().getValues()[0];
  const col = (name) => headerRow.indexOf(name);

  const docID = 'DOC-' + new Date().getTime();
  const timestamp = new Date();
  const docType = data.docType || 'Manual';
  const senderEmail = getVerifiedUser(data); // SECURE AUTH
  const senderName = getUserName(senderEmail);

  let steps = data.customSteps;
  if (!steps || steps.length === 0) {
    steps = getWorkflowTemplate(docType);
  }
  // Default fallback if no template found
  if (!steps || steps.length === 0) {
    steps = ['ผู้ร่าง', 'คณบดี'];
  }

  const firstApproverValue = steps.length > 1 ? steps[1] : '';

  // 2. Prepare the row array based on header positions
  const newRow = new Array(headerRow.length).fill('');
  
  if (col('DocID') !== -1) newRow[col('DocID')] = docID;
  if (col('Timestamp') !== -1) newRow[col('Timestamp')] = timestamp;
  if (col('Title') !== -1) newRow[col('Title')] = data.title || '';
  if (col('SenderEmail') !== -1) newRow[col('SenderEmail')] = senderEmail;
  if (col('DocType') !== -1) newRow[col('DocType')] = docType;
  if (col('CurrentStepIndex') !== -1) newRow[col('CurrentStepIndex')] = 1;
  if (col('AssignedToEmail') !== -1) newRow[col('AssignedToEmail')] = firstApproverValue;
  if (col('Status') !== -1) newRow[col('Status')] = 'pending';
  
  // Resolve participant names for better display
  const participantNames = steps.map(email => ({ email: email, name: getUserName(email) }));
  if (col('ParticipantNames') !== -1) newRow[col('ParticipantNames')] = JSON.stringify(participantNames);

  if (col('FileLink') !== -1) newRow[col('FileLink')] = '(กำลังอัปโหลดไฟล์/Processing...)';
  if (col('Description') !== -1) newRow[col('Description')] = data.description || '';
  if (col('WorkflowSteps') !== -1) newRow[col('WorkflowSteps')] = JSON.stringify(steps);

  // 3. SAVE TO SHEET
  sheet.appendRow(newRow);
  const targetRow = sheet.getLastRow();
  console.log('[submitDoc] Dynamic row appended at row #', targetRow);

  // 4. PROCESS FILE UPLOAD
  let fileLink = '';
  if (data.fileData && data.fileName) {
    try {
      fileLink = processFileUpload(data.fileData, data.fileName, docID, data.senderEmail);
      const linkIdx = col('FileLink');
      if (linkIdx !== -1) {
        sheet.getRange(targetRow, linkIdx + 1).setValue(fileLink);
      }
    } catch (err) {
      console.error('[submitDoc] File Upload failed:', err);
      const linkIdx = col('FileLink');
      if (linkIdx !== -1) sheet.getRange(targetRow, linkIdx + 1).setValue('Error: ' + err.message);
    }
  } else {
    const linkIdx = col('FileLink');
    if (linkIdx !== -1) sheet.getRange(targetRow, linkIdx + 1).setValue('');
  }

  // 5. NOTIFICATION
  try {
    const senderName = getUserName(data.senderEmail);
    const recipientEmails = resolveEmailsForStep(firstApproverValue);
    sendEmailNotification(recipientEmails, 'แจ้งเตือนอนุมัติเอกสาร', data.title, data.description, docID, senderName);
  } catch(e) {
    console.error('[submitDoc] Notification failed:', e.toString());
  }

  logAction(docID, data.senderEmail, 'Submitted', 'Assigned to: ' + firstApproverValue);
  return { status: 'success', data: { docID: docID, steps: steps } };
}

function updateStatus(data) {
  const sheet = getSheetByName('Documents_Main');
  if (!sheet) return { status: 'error', message: 'Sheet not found' };

  const docID = data.docID;
  const newStatus = data.status;
  const userEmail = getVerifiedUser(data); // SECURE AUTH
  const comment = data.comment || '';
  
  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange[0];
  const docIdIndex = headers.indexOf('DocID');
  const titleIndex = headers.indexOf('Title');
  const senderIndex = headers.indexOf('SenderEmail');
  const statusIndex = headers.indexOf('Status');
  const assignedToIndex = headers.indexOf('AssignedToEmail');
  const stepIndex = headers.indexOf('CurrentStepIndex');
  const stepsIndex = headers.indexOf('WorkflowSteps');
  const fileLinkIndex = headers.indexOf('FileLink');
  const descIndex = headers.indexOf('Description');
  
  let rowIndex = -1;
  let currentStepIdx = 1;
  let docTitle = '', senderEmail = '', docDescription = '', assignedTo = '';
  let steps = [];
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][docIdIndex] === docID) {
      rowIndex = i + 1;
      currentStepIdx = parseInt(dataRange[i][stepIndex]);
      docTitle = dataRange[i][titleIndex];
      senderEmail = dataRange[i][senderIndex];
      assignedTo = (dataRange[i][assignedToIndex] || '').toString().trim().toLowerCase();
      docDescription = dataRange[i][descIndex] || '';
      
      // ดึงสายงานจากคอลัมน์ที่ 11 (ถ้าบวก 1 เป็น 11 หรือใช้ indexOf)
      if (stepsIndex !== -1 && dataRange[i][stepsIndex]) {
        try { steps = JSON.parse(dataRange[i][stepsIndex]); } catch(e) { console.error('Parse steps error', e); }
      }
      break;
    }
  }
  
  if (rowIndex === -1) return { status: 'error', message: 'Document not found' };
  
  // 🔒 STRICT SECURITY CHECK: Only AssignedTo can approve
  const userData = checkUser({ email: userEmail });
  const lowAssigned = assignedTo.toLowerCase().trim();
  const lowEmail = userEmail.toLowerCase().trim();
  const lowDept = (userData.status === 'success' ? (userData.data.Department || '').toLowerCase().trim() : '');

  const canApprove = (lowAssigned === lowEmail) || 
                     (lowAssigned === lowDept) || 
                     (lowAssigned === 'dept:' + lowDept);

  if (!canApprove) {
    console.warn(`[updateStatus] Auth Blocked: User ${userEmail} (Dept: ${lowDept}) tried to approve doc ${docID} assigned to ${lowAssigned}`);
    return { status: 'error', message: 'คุณไม่มีสิทธิ์อนุมัติขั้นตอนปัจจุบันของเอกสารฉบับนี้' };
  }
  
  // Fallback if steps are missing for some reason
  if (!steps || steps.length === 0) {
    steps = ['ผู้ร่าง', 'คณบดี'];
  }

  if (newStatus === 'rejected') {
    sheet.getRange(rowIndex, statusIndex + 1).setValue('rejected');
    sheet.getRange(rowIndex, assignedToIndex + 1).setValue('');
    logAction(docID, userEmail, 'Rejected', comment);
    sendEmailNotification([senderEmail], 'เอกสารของคุณถูกตีกลับ', docTitle, 'เหตุผลที่ตีกลับ: ' + comment, docID, getUserName(userEmail));
  } else if (newStatus === 'approved') {
    const nextStepIdx = currentStepIdx + 1;
    if (nextStepIdx < steps.length) {
      const nextStepValue = steps[nextStepIdx];
      sheet.getRange(rowIndex, stepIndex + 1).setValue(nextStepIdx);
      sheet.getRange(rowIndex, assignedToIndex + 1).setValue(nextStepValue);
      logAction(docID, userEmail, 'Approved', 'Passed to: ' + nextStepValue);
      const nextEmails = resolveEmailsForStep(nextStepValue);
      sendEmailNotification(nextEmails, 'แจ้งเตือนอนุมัติเอกสาร', docTitle, docDescription, docID, getUserName(senderEmail));
    } else {
      sheet.getRange(rowIndex, statusIndex + 1).setValue('approved');
      sheet.getRange(rowIndex, assignedToIndex + 1).setValue('');
      logAction(docID, userEmail, 'Final Approved', comment);
      sendEmailNotification([senderEmail], 'เอกสารของคุณได้รับการอนุมัติสิ้นสุดแล้ว', docTitle, 'เอกสารผ่านการอนุมัติครบถ้วน', docID, 'ระบบอัตโนมัติ');
    }
  }
  return { status: 'success', message: 'ดำเนินการเรียบร้อยแล้ว' };
}

function logAction(docID, userEmail, action, comment) {
  const sheet = getSheetByName('Action_Logs');
  if (sheet) sheet.appendRow(['LOG-' + Date.now(), docID, userEmail, action, comment, new Date()]);
}

function registerUser(data) {
  const sheet = getSheetByName('Users_Mapping');
  if (!sheet) return { status: 'error', message: 'Sheet not found' };
  
  const headers = sheet.getDataRange().getValues()[0];
  const emailIdx = headers.indexOf('Email');
  const passIdx = headers.indexOf('Password');
  const nameIdx = headers.indexOf('FullName');
  const deptIdx = headers.indexOf('Department');
  const positionIdx = headers.indexOf('Position');
  const groupIdx = headers.indexOf('Group');
  const roleIdx = headers.indexOf('Role');

  const email = (data.email || '').trim().toLowerCase();
  if (checkUser({ email: email }).status === 'success') return { status: 'error', message: 'อีเมลนี้มีอยู่ในระบบแล้ว' };
  
  // Create row matching headers exactly
  const newRow = new Array(headers.length).fill('');
  if (emailIdx !== -1) newRow[emailIdx] = email;
  if (passIdx !== -1) newRow[passIdx] = (data.password || '').toString().trim();
  if (nameIdx !== -1) newRow[nameIdx] = data.fullName || '';
  if (deptIdx !== -1) newRow[deptIdx] = data.department || '';
  if (positionIdx !== -1) newRow[positionIdx] = data.position || '';
  if (groupIdx !== -1) newRow[groupIdx] = data.group || 'ทั่วไป';
  if (roleIdx !== -1) newRow[roleIdx] = 'user';

  sheet.appendRow(newRow);
  
  const userData = {
     email: email,
     fullName: data.fullName || '',
     department: data.department || '',
     position: data.position || '',
     group: data.group || 'ทั่วไป',
     role: 'user'
  };

  return { status: 'success', message: 'ลงทะเบียนสำเร็จ', data: userData };
}

function checkLogin(data) {
  try {
    const inputEmail = (data.email || '').trim().toLowerCase();
    const inputPassword = (data.password || '').toString().trim();
    const sheet = getSheetByName('Users_Mapping');
    if (!sheet) return { status: 'error', message: 'Sheet not found' };

    console.log('[DEBUG-LOGIN] Checking:', inputEmail);

    // 🚀 Fast Lookup using TextFinder
    const cell = sheet.createTextFinder(inputEmail).matchCase(false).matchEntireCell(true).findNext();
    if (!cell) {
      console.warn('[DEBUG-LOGIN] User not found:', inputEmail);
      return { status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }

    const row = cell.getRow();
    const dataRange = sheet.getDataRange().getValues();
    const headers = dataRange[0];
    const rowData = dataRange[row - 1]; // 0-indexed adjustment
    const col = (name) => headers.map(h => h.toString().trim()).indexOf(name);
    
    const passIdx = col('Password');
    const rowPass = (rowData[passIdx] || '').toString().trim();
    
    if (rowPass === inputPassword) {
      const col = (name) => getCol(headers, name);
      const result = { 
        email: (rowData[col('Email')] || '').toString().trim(), 
        fullName: (rowData[col('FullName')] || '').toString().trim(), 
        department: (rowData[col('Department')] || '').toString().trim(), 
        position: (rowData[col('Position')] || '').toString().trim(),
        group: (rowData[col('Group')] || '').toString().trim(), 
        role: (rowData[col('Role')] || 'user').toString().trim().toLowerCase()
      };
      console.log('[DEBUG-LOGIN] SUCCESS:', inputEmail);
      return { status: 'success', data: result };
    }
    
    console.warn('[DEBUG-LOGIN] Password mismatch for:', inputEmail);
    return { status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  } catch (err) {
    console.error('[DEBUG-LOGIN] CRITICAL ERROR:', err.toString());
    return { status: 'error', message: 'เกิดข้อผิดพลาดภายใน: ' + err.toString() };
  }
}

function getDashboardStats(data) {
  if (!data) data = {};
  const sheet = getSheetByName('Documents_Main');
  const userEmail = getVerifiedUser(data); // SECURE AUTH
  if (!sheet) return { total: 0, pending: 0, approved: 0, rejected: 0, myPending: 0 };
  
  const userRes = checkUser({ email: userEmail });
  const userDept = (userRes.status === 'success') ? (userRes.data.Department || '') : '';
  const userFullName = (userRes.status === 'success') ? (userRes.data.FullName || '') : '';
  const userPosition = (userRes.status === 'success') ? (userRes.data.Position || '') : '';
  
  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange[0];
  const senderIdx = headers.indexOf('SenderEmail'), assignedIdx = headers.indexOf('AssignedToEmail'), statusIdx = headers.indexOf('Status');
  
  let stats = { total: 0, pending: 0, approved: 0, rejected: 0, myPending: 0 };
  
  const lowEmail = userEmail.toLowerCase().trim();
  const lowDept = userDept.toLowerCase().trim();
  const lowName = userFullName.toLowerCase().trim();
  const lowPos = userPosition.toLowerCase().trim();

  for (let i = 1; i < dataRange.length; i++) {
    const sender = (dataRange[i][senderIdx] || '').toString().toLowerCase().trim();
    const assigned = (dataRange[i][assignedIdx] || '').toString().toLowerCase().trim();
    const status = (dataRange[i][statusIdx] || '').toString().toLowerCase();

    // Stats for documents sent by the user
    if (sender === lowEmail) {
      stats.total++;
      if (status === 'pending') stats.pending++; 
      else if (status === 'approved') stats.approved++; 
      else if (status === 'rejected') stats.rejected++;
    }

    // Stats for documents waiting for the user's approval
    const isMyDept = lowDept && (assigned === lowDept || assigned === ('dept:' + lowDept));
    const isMeByName = lowName && (assigned === lowName);
    const isMeByPos = lowPos && (assigned === lowPos);
    const isMeByEmail = lowEmail && (assigned === lowEmail);

    if (status === 'pending' && (isMeByEmail || isMyDept || isMeByName || isMeByPos)) {
      stats.myPending++;
    }
  }
  return stats;
}

function getDocuments(data) {
  if (!data) data = {};
  const sheet = getSheetByName('Documents_Main');
  if (!sheet) return [];
  
  const filterEmail = getVerifiedUser(data); // SECURE AUTH
  const userRes = checkUser({ email: filterEmail });
  
  const userDept = (userRes.status === 'success') ? (userRes.data.Department || '') : '';
  const userFullName = (userRes.status === 'success') ? (userRes.data.FullName || '') : '';
  const userPosition = (userRes.status === 'success') ? (userRes.data.Position || '') : '';
  const userRoleRaw = (userRes.status === 'success') ? userRes.data.Role : 'user';
  const userRole = (userRoleRaw || '').toString().trim().toLowerCase();
  
  const targetStatus = (data.status || '').toString().toLowerCase().trim();
  
  console.log(`[getDocuments] Query ID: ${filterEmail}, Name: ${userFullName}, Pos: ${userPosition}, Role: ${userRole}, Status: ${targetStatus || 'Any'}`);

  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange[0];
  const col = (name) => getCol(headers, name);

  const idx = {
    docID: col('DocID'),
    title: col('Title'),
    sender: col('SenderEmail'),
    assigned: col('AssignedToEmail'),
    status: col('Status'),
    steps: col('WorkflowSteps'),
    stepIdx: col('CurrentStepIndex'),
    time: col('Timestamp'),
    docType: col('DocType'),
    fileLink: col('FileLink')
  };

  const logsSheet = getSheetByName('Action_Logs');
  const userInteractions = new Set();
  if (logsSheet && filterEmail) {
    const logData = logsSheet.getDataRange().getValues();
    const logUserIdx = getCol(logData[0], 'UserEmail');
    const logDocIdx = getCol(logData[0], 'DocID');
    if (logUserIdx !== -1 && logDocIdx !== -1) {
      for (let i = 1; i < logData.length; i++) {
        if ((logData[i][logUserIdx] || '').toString().toLowerCase().trim() === filterEmail.toLowerCase().trim()) {
          userInteractions.add(logData[i][logDocIdx]);
        }
      }
    }
  }

  let results = [];
  const lowEmail = filterEmail.toLowerCase().trim();
  const lowDept = userDept.toLowerCase().trim();
  const lowName = userFullName.toLowerCase().trim();
  const lowPos = userPosition.toLowerCase().trim();

  for (let i = 1; i < dataRange.length; i++) {
    const row = dataRange[i];
    const docID = (row[idx.docID] || '').toString();
    const senderEmail = (row[idx.sender] || '').toString().toLowerCase().trim();
    const assignedValue = (row[idx.assigned] || '').toString().toLowerCase().trim();
    const rowStatus = (row[idx.status] || '').toString().toLowerCase().trim();
    
    // 1. Filter by Status first
    if (targetStatus && rowStatus !== targetStatus) continue;

    // 2. Identify if the user has permission to see this document
    let match = false;
    if (userRole === 'admin') {
      match = true;
    } else {
      const isMeByEmail = (assignedValue === lowEmail);
      const isMyDept = lowDept && (assignedValue === lowDept || assignedValue === ('dept:' + lowDept));
      const isMeByName = lowName && (assignedValue === lowName);
      const isMeByPos = lowPos && (assignedValue === lowPos);
      const isSender = (senderEmail === lowEmail);
      const hasHandled = userInteractions.has(docID);

      if (isSender || isMeByEmail || isMyDept || isMeByName || isMeByPos || hasHandled) {
        match = true;
      }
    }

    if (match) {
      let docSteps = ['ผู้ร่าง', 'คณบดี'];
      try {
        if (row[idx.steps]) docSteps = JSON.parse(row[idx.steps]);
      } catch(e) { console.error('Parse steps error row', i, e); }

      results.push({
        id: docID,
        title: row[idx.title] || 'Untitled',
        submittedBy: senderEmail,
        senderName: getUserName(senderEmail),
        submittedDate: row[idx.time] ? new Date(row[idx.time]).toLocaleDateString('th-TH') : 'N/A',
        status: rowStatus,
        docType: row[idx.docType] || 'Other',
        currentStepIndex: parseInt(row[idx.stepIdx] || 0),
        assignedTo: assignedValue,
        assignedToName: assignedValue.includes('@') ? getUserName(assignedValue) : assignedValue,
        department: userDept,
        workflowSteps: docSteps.map(step => ({
           id: step,
           name: step === 'ผู้ร่าง' ? getUserName(senderEmail) : (step.includes('@') ? getUserName(step) : step)
        })),
        fileLink: row[idx.fileLink] || ''
      });
    }
  }

  console.log(`[getDocuments] Final results count: ${results.length}`);
  return results.slice(-50).reverse();
}

function getWorkflowParticipants() {
  const sheet = getSheetByName('Users_Mapping');
  if (!sheet) {
    console.error('[getWorkflowParticipants] Sheet Users_Mapping not found');
    return {};
  }
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    console.warn('[getWorkflowParticipants] Sheet is empty or only has headers');
    return {};
  }
  
  const headers = data[0].map(h => (h || '').toString().trim().toLowerCase());
  const emailIdx = headers.indexOf('email');
  const nameIdx = headers.indexOf('fullname');
  const deptIdx = headers.indexOf('department');
  
  console.log('[getWorkflowParticipants] Found Columns -> Email:', emailIdx, 'Name:', nameIdx, 'Dept:', deptIdx);
  
  if (emailIdx === -1 || deptIdx === -1) {
    console.error('[getWorkflowParticipants] Required columns (Email/Department) missing in sheet');
    return {};
  }

  let participants = {};
  for (let i = 1; i < data.length; i++) {
    const email = (data[i][emailIdx] || '').toString().trim();
    const name = (data[i][nameIdx] || email).toString().trim(); // Use email if name is empty
    const dept = (data[i][deptIdx] || 'ทั่วไป').toString().trim();
    
    if (!email) continue; // Skip empty rows
    
    if (!participants[dept]) participants[dept] = [];
    participants[dept].push({ 
      name: name, 
      email: email, 
      title: dept 
    });
  }
  
  console.log('[getWorkflowParticipants] Success! Found depts:', Object.keys(participants));
  return participants;
}

/**
 * 👑 ฟังก์ชันสำหรับกดปุ่ม Run เพื่อเปิดสิทธิ์การใช้งาน (Authorization)
 */
function testPermissions() {
  const root = DriveApp.getRootFolder();
  console.log('สิทธิ์ DriveApp: สำเร็จ (โฟลเดอร์:', root.getName(), ')');
  const quota = MailApp.getRemainingDailyQuota();
  console.log('สิทธิ์ MailApp: สำเร็จ (โควต้าส่งเมลคงเหลือ:', quota, ')');
}

/**
 * 👑 ดึงข้อมูลสรุปสำหรับหน้า Admin Dashboard (Real-time Stats)
 */
function getAdminDashboardData() {
  try {
    const userSheet = getSheetByName('Users_Mapping');
    const docSheet = getSheetByName('Documents_Main');
    
    const users = userSheet ? userSheet.getDataRange().getValues() : [];
    const docs = docSheet ? docSheet.getDataRange().getValues() : [];
    
    // คำนวณสถิติพื้นฐาน (หักหัวตารางออก)
    const totalUsers = users.length > 1 ? users.length - 1 : 0;
    const totalDocs = docs.length > 1 ? docs.length - 1 : 0;
    
    // เตรียมรายชื่อผู้ใช้งาน
    let userList = [];
    if (users.length > 1) {
      const headers = users[0].map(h => (h||'').toString().toLowerCase().trim());
      const idx_email = headers.indexOf('email');
      const idx_name = headers.indexOf('fullname');
      const idx_dept = headers.indexOf('department');
      const idx_pos = headers.indexOf('group'); // Map Position to Group column
      const idx_role = headers.indexOf('role');
      const idx_status = headers.indexOf('status');
      
      for(let i=1; i < users.length; i++) {
        const row = users[i];
        userList.push({
          name: row[idx_name] || 'ไม่ระบุ',
          email: row[idx_email] || '',
          dept: row[idx_dept] || 'ทั่วไป',
          position: row[idx_pos] || '',
          role: row[idx_role] || 'User',
          status: row[idx_status] || 'Active'
        });
      }
    }

    return {
      status: 'success',
      totalUsers: totalUsers,
      totalDocs: totalDocs,
      systemHealth: 'ปกติ (99.9%)',
      users: userList
    };
  } catch (e) {
    console.error('[getAdminDashboardData] Error:', e.toString());
    return { status: 'error', message: 'ไม่สามารถดึงข้อมูลแอดมินได้: ' + e.toString() };
  }
}

/**
 * 👑 บันทึกข้อมูลผู้ใช้งาน (ทั้งเพิ่มใหม่และแก้ไข)
 */
function adminSaveUser(userData) {
  try {
    const sheet = getSheetByName('Users_Mapping');
    if (!sheet) return { status: 'error', message: 'ไม่พบฐานข้อมูลผู้ใช้' };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => (h||'').toString().toLowerCase().trim());
    const emailIdx = headers.indexOf('email');
    
    const targetEmail = (userData.email || '').toString().trim().toLowerCase();
    let rowIndex = -1;
    
    // ค้นหาว่ามีอยู่แล้วหรือไม่
    for(let i=1; i < data.length; i++) {
      if ((data[i][emailIdx]||'').toString().toLowerCase().trim() === targetEmail) {
        rowIndex = i + 1;
        break;
      }
    }
    
    const col = (name) => headers.indexOf(name);
    const newRow = new Array(headers.length).fill('');
    
    // เตรียมข้อมูลแถว
    if (col('email') !== -1) newRow[col('email')] = targetEmail;
    if (col('fullname') !== -1) newRow[col('fullname')] = userData.name || '';
    if (col('department') !== -1) newRow[col('department')] = userData.dept || '';
    if (col('group') !== -1) newRow[col('group')] = (userData.position || '').trim(); // Map Position to Group column
    if (col('role') !== -1) newRow[col('role')] = userData.role || 'user';
    if (col('status') !== -1) newRow[col('status')] = userData.status || 'Active';
    if (userData.password && col('password') !== -1) newRow[col('password')] = userData.password;
    
    if (rowIndex !== -1) {
      // แก้ไข (Update) — เฉพาะฟิลด์ที่ส่งมา (ถ้ารหัสผ่านว่าง ไม่ต้องทับ)
      const existingRow = data[rowIndex-1];
      newRow.forEach((val, idx) => {
        if (val === '' && idx !== col('fullname') && idx !== col('department')) {
             newRow[idx] = existingRow[idx];
        }
      });
      // ถ้ารหัสผ่านใหม่ไม่มี ให้ใช้ของเดิม
      if (!userData.password && col('password') !== -1) newRow[col('password')] = existingRow[col('password')];
      
      sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
      return { status: 'success', message: 'อัปเดตข้อมูลสำเร็จ' };
    } else {
      // เพิ่มใหม่ (Append)
      if (!userData.password) return { status: 'error', message: 'กรุณาระบุรหัสผ่านสำหรับผู้ใช้ใหม่' };
      sheet.appendRow(newRow);
      return { status: 'success', message: 'เพิ่มผู้ใช้งานใหม่สำเร็จ' };
    }
  } catch (e) {
    return { status: 'error', message: 'บันทึกไม่สำเร็จ: ' + e.toString() };
  }
}

/**
 * 🛠 Helper: หา Index ของคอลัมน์จากชื่อ Header (Case-insensitive)
 */
function getCol(headers, name) {
  if (!headers || !name) return -1;
  const lowHeaders = headers.map(h => (h || '').toString().toLowerCase().trim());
  return lowHeaders.indexOf(name.toLowerCase().trim());
}

/**
 * 📊 ดึงสถิติตัววัดพื้นที่ Google Drive
 */
function getDriveStats() {
  try {
    const used = DriveApp.getStorageUsed();
    const limit = DriveApp.getStorageLimit();
    const remaining = limit - used;
    const percent = (used / limit * 100).toFixed(1);
    
    return {
      status: 'success',
      used: formatBytes(used),
      limit: formatBytes(limit),
      remaining: formatBytes(remaining),
      percent: percent,
      health: percent > 90 ? 'critical' : (percent > 70 ? 'warning' : 'healthy')
    };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

/**
 * 📂 รายการไฟล์ในระบบ (Scan Root Folder)
 */
function getSystemFiles() {
  try {
    const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const folders = root.getFolders();
    const items = [];
    
    while (folders.hasNext()) {
      const f = folders.next();
      items.push({
        id: f.getId(),
        name: f.getName(),
        type: 'folder',
        size: '-',
        updated: f.getLastUpdated().toLocaleDateString('th-TH')
      });
    }
    
    const files = root.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      items.push({
        id: f.getId(),
        name: f.getName(),
        type: 'file',
        size: formatBytes(f.getSize()),
        updated: f.getLastUpdated().toLocaleDateString('th-TH'),
        url: f.getUrl()
      });
    }
    
    return { status: 'success', data: items };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

/**
 * 🗑 ลบไฟล์หรือโฟลเดอร์ออกจาก Drive
 */
function deleteDriveItem(itemId) {
  try {
    if (!itemId) throw new Error('Missing ID');
    
    try {
      const file = DriveApp.getFileById(itemId);
      file.setTrashed(true);
      return { status: 'success', message: 'ลบไฟล์เรียบร้อยแล้ว' };
    } catch (e) {
      const folder = DriveApp.getFolderById(itemId);
      folder.setTrashed(true);
      return { status: 'success', message: 'ลบโฟลเดอร์เรียบร้อยแล้ว' };
    }
  } catch (e) {
    return { status: 'error', message: 'ลบไม่สำเร็จ: ' + e.toString() };
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
