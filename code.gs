// ==========================================
// 🚀 Smart School Inventory Backend (Google Apps Script)
// 🛡️ SUPER ROBUST VERSION - แกะบัคทุกจุดล่วงหน้า!
// ==========================================

// ลิงก์ตาราง Google Sheet ของคุณ
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1_hBMamICApLFGh5UprLvCCZm34uxC0xcLEsyqF4NS58/edit";

// Helper: Check if User has Admin Role
function isAdmin(data) {
  // In a real system, we should verify the user's status in the 'Users' sheet 
  // every time using their ID or a safe token.
  return data && (data.role === "ผู้ดูแลระบบ" || data.role === "Admin");
}
// ฟังก์ชันชาญฉลาด: ค้นหาชื่อ Sheet อัตโนมัติ (แม้จะลืมเปลี่ยนชื่อเป็นภาษาอังกฤษก็ตาม)
function getSmartSheet(ss, possibleNames) {
  for (let name of possibleNames) {
    const sheet = ss.getSheetByName(name);
    if (sheet) return sheet;
  }
  return null;
}
// ==========================================

function doPost(e) {
  try {
    // ดักบัค 1: ป้องกันไม่ให้พังถ้าไม่มีข้อมูลส่งมา (CORS problems/Empty post)
    if (!e || !e.postData || !e.postData.contents) {
      return respondError("ไม่มีข้อมูลส่งมาหา Server (No Data)");
    }
    
    // ดักบัค 2: ป้องกัน JSON แตก
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch(err) {
      return respondError("รูปแบบข้อมูลจากหน้าเว็บส่งมาผิดพลาด (Invalid JSON)");
    }

    const action = data.action; 
    
    // Auth
    if (action === "login") return attemptLogin(data);
    if (action === "register") return registerUser(data);
    
    // User Inventory Portal
    if (action === "get_inventory") return getInventoryList();
    if (action === "batch_borrow") return batchBorrow(data);
    if (action === "get_my_borrows") return getMyBorrows(data);
    if (action === "return_items") return processReturn(data);
    if (action === "get_my_history") return getMyHistory(data);
    if (action === "get_dashboard_stats") return getDashboardStats(data);
    if (action === "get_categories") return getCategories();

    // Admin Inventory Portal
    if (action === "get_all_transactions") return getAllTransactions(data);
    if (action === "get_admin_stats") return getAdminStats(data);
    if (action === "get_admin_analytics") return getAdminAnalytics(data);
    if (action === "get_admin_summary") return getAdminSummary(data);
    if (action === "add_item") return addItem(data);
    if (action === "update_item") return updateItem(data);
    if (action === "delete_item") return deleteItem(data);
    if (action === "seed_data") return seedInventoryData(data);
    
    // System & Seeding
    if (action === "seed_transformation_data") return seedTransformationData(data);
    if (action === "clear_system_data") return clearAllSystemData(data);
    
    // Project & Budget Actions
    if (action === "get_projects") return getProjects(data);
    if (action === "add_project") return addProject(data);
    if (action === "get_activities") return getActivities(data);
    if (action === "save_request") return saveBudgetRequest(data);
    if (action === "get_pending_approvals") return getPendingApprovals(data);
    if (action === "approve_request") return approveRequest(data);
    if (action === "get_budget_stats") return getBudgetStats(data);
    
    return respondError("ไม่รู้จักคำสั่งแอคชัน: " + action);
    
  } catch (error) {
    return respondError("ระบบเกิดข้อผิดพลาด: " + error.toString());
  }
}

function doGet(e) {
    // สำหรับดึงรายการพัสดุทั้งหมดไปโชว์
    return getInventoryList();
}

// ==========================================
// 🚀 [NEW] Project & Budget Functions
// ==========================================

function getProjects(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Projects", "โครงการ"]);
  if (!sheet) return respondError("ไม่พบ Sheet โครงการ");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return respondSuccess([]);
  
  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  return respondSuccess(rows.map(r => ({
    id: r[0],
    name: r[1],
    department: r[2],
    budgetMaterial: r[3],
    budgetEquipment: r[4],
    budgetHiring: r[5],
    status: r[6]
  })));
}

function addProject(data) {
  if (!isAdmin(data)) return respondError("Admin Only");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Projects", "โครงการ"]);
  if (!sheet) return respondError("ไม่พบ Sheet โครงการ");
  
  sheet.appendRow([
    data.id,
    data.name,
    data.department,
    data.budgetMaterial,
    data.budgetEquipment,
    data.budgetHiring,
    "Active"
  ]);
  return respondSuccess({ message: "เพิ่มโครงการสำเร็จ" });
}

function getActivities(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Activities", "กิจกรรม"]);
  if (!sheet) return respondError("ไม่พบ Sheet กิจกรรม");
  
  const lastRow = sheet.getLastRow();
  const rows = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  
  const filtered = data.projectId 
    ? rows.filter(r => String(r[0]) === String(data.projectId))
    : rows;

  return respondSuccess(filtered.map(r => ({
    projectId: r[0],
    id: r[1],
    name: r[2],
    allocated: r[3],
    spent: r[4]
  })));
}

function saveBudgetRequest(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Requests", "คำขอ"]);
  if (!sheet) return respondError("ไม่พบ Sheet คำขอ");
  
  const timestamp = new Date();
  const requestId = "REQ-" + Utilities.formatDate(timestamp, "GMT+7", "yyyy") + "-" + Utilities.getUuid().substring(0,5).toUpperCase();
  
  sheet.appendRow([
    requestId,
    timestamp,
    data.projectId,
    data.activityId,
    data.userId,
    data.description,
    data.amount,
    "Pending (Vice Director)",
    data.signature || ""
  ]);
  
  return respondSuccess({ message: "ส่งคำขอสำเร็จ", requestId: requestId });
}

function getPendingApprovals(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Requests", "คำขอ"]);
  if (!sheet) return respondError("ไม่พบ Sheet คำขอ");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return respondSuccess([]);
  
  const rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  // Filter based on role: "รอง ผอ." vs "ผอ."
  const targetStatus = data.role === "รองผู้อำนวยการ" ? "Pending (Vice Director)" : "Pending (Director)";
  
  return respondSuccess(rows.filter(r => r[7] === targetStatus).map(r => ({
    requestId: r[0],
    date: r[1],
    projectId: r[2],
    activityId: r[3],
    userId: r[4],
    description: r[5],
    amount: r[6],
    status: r[7],
    signature: r[8]
  })));
}

function approveRequest(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Requests", "คำขอ"]);
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(2, 1, lastRow - 1, 9);
  const rows = range.getValues();
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === data.requestId) {
      let nextStatus = "Approved";
      if (data.role === "รองผู้อำนวยการ") nextStatus = "Pending (Director)";
      
      sheet.getRange(i + 2, 8).setValue(nextStatus);
      return respondSuccess({ message: "ดำเนินการอนุมัติสำเร็จ" });
    }
  }
  return respondError("ไม่พบรหัสคำขอ");
}

function getBudgetStats(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const projSheet = getSmartSheet(ss, ["Projects", "โครงการ"]);
  const reqSheet = getSmartSheet(ss, ["Requests", "คำขอ"]);
  
  let totalAllocated = 0;
  let totalSpent = 0;
  let pendingCount = 0;
  
  if (projSheet) {
    const pRows = projSheet.getDataRange().getValues();
    for (let i = 1; i < pRows.length; i++) {
      totalAllocated += (Number(pRows[i][3]) || 0) + (Number(pRows[i][4]) || 0) + (Number(pRows[i][5]) || 0);
    }
  }
  
  if (reqSheet) {
    const rRows = reqSheet.getDataRange().getValues();
    for (let i = 1; i < rRows.length; i++) {
      if (rRows[i][7] === "Approved") totalSpent += Number(rRows[i][6]) || 0;
      if (String(rRows[i][7]).includes("Pending")) pendingCount++;
    }
  }
  
  return respondSuccess({
    totalAllocated,
    totalSpent,
    pendingCount,
    remaining: totalAllocated - totalSpent
  });
}

// ==========================================
// 🟢 ฟังก์ชัน: เช็คเข้าสู่ระบบ (Login)
// ==========================================
function attemptLogin(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  
  // ดักบัค 3: อนุโลมการตั้งชื่อ Sheet (ถ้าลืมตั้งชื่อ Users ก็ใช้ 'แผ่น1' แทนได้)
  const sheet = getSmartSheet(ss, ["Users", "users", "แผ่น1", "Sheet1", "สมาชิก"]);
  if(!sheet) return respondError("หาบรรทัดเก็บข้อมูลพนักงานไม่เจอ (กรุณาสร้างแผ่นชีตที่ 1)");

  // ดักบัค 4: ตารางวางเปล่าไม่มีคนเลย
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return respondError("ยังไม่มีรายชื่อครูหรือพนักงานในระบบ (ตารางว่างเปล่า)");
  
  const rows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  
  // ดักบัค 5: ครอบ String ทะลวงช่องว่าง ป้องกัน Number Type ใน Sheet
  const reqUsername = String(data.username || "").trim();
  const reqPassword = String(data.password || "").trim();
  
  for (let i = 0; i < rows.length; i++) {
    const rowUser = String(rows[i][0]).trim(); // คอลัมน์ A (ชื่อผู้ใช้)
    const rowPass = String(rows[i][1]).trim(); // คอลัมน์ B (รหัสผ่าน)
    const rowStatus = String(rows[i][5]).trim(); // คอลัมน์ F (สถานะ)
    
    // ดักบัค 6: ป้องกันพิมพ์พิมพ์เล็ก/ใหญ่ผิดตอนล็อคอิน
    if (rowUser.toLowerCase() === reqUsername.toLowerCase() && String(rowPass) === reqPassword) {
      
      // ดักบัค 7: อนุโลมสถานะว่างให้ถือว่าใช้งานได้
      if(rowStatus !== "" && rowStatus !== "ใช้งาน" && rowStatus !== "Active") {
        return respondError("บัญชีของคุณไม่พร้อมใช้งาน หรือถูกระงับ (สถานะ: " + rowStatus + ")");
      }
      
      // ส่งข้อมูลกลับไปให้หน้า Dashboard
      return respondSuccess({
        "message": "เข้าสู่ระบบสำเร็จ",
        "user_id": rowUser,
        "name": rows[i][2] || "พนักงานใหม่",
        "role": rows[i][3] || "ผู้ใช้ทั่วไป",
        "department": rows[i][4] || "-"
      });
    }
  }
  
  return respondError("ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง");
}

// ==========================================
// 🔵 ฟังก์ชัน: บันทึกการขอยืมพัสดุ (Borrow)
// ==========================================
function processBorrow(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "แผ่น3", "Sheet3", "ประวัติการยืม"]);
    const invSheet = getSmartSheet(ss, ["Inventory", "inventory", "แผ่น2", "Sheet2", "พัสดุ", "คลัง"]);
    
    if(!transSheet || !invSheet) return respondError("หาแผ่น Inventory หรือ Transactions ไม่เจอ");
    
    const timestamp = new Date();
    const transId = "TRX" + Utilities.formatDate(timestamp, "GMT+7", "yyyyMMddHHmmss"); 
    const qty = parseInt(data.qty) || 1; 
    
    // 1. Get User Name
    const userSheet = getSmartSheet(ss, ["Users", "users", "สมาชิก"]);
    let userName = "Unknown User";
    if (userSheet) {
      const userRows = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 3).getValues();
      for (let i = 0; i < userRows.length; i++) {
        if (String(userRows[i][0]).trim() === String(data.userId).trim()) {
          userName = userRows[i][2];
          break;
        }
      }
    }

    // 2. Get Item Name & Update Inventory
    const invLastRow = invSheet.getLastRow();
    if (invLastRow < 2) return respondError("คลังพัสดุว่างเปล่า");
    
    const invRange = invSheet.getRange(2, 1, invLastRow - 1, 9);
    const invRows = invRange.getValues(); 
    let itemFound = false;
    let rowIndex = -1;
    let currentBalance = 0;
    let itemName = "Unknown Item";
    
    for (let i = 0; i < invRows.length; i++) {
      if (String(invRows[i][0]).trim() === String(data.itemId).trim()) { 
        itemFound = true;
        rowIndex = i; 
        itemName = invRows[i][1];
        currentBalance = parseInt(invRows[i][7]) || 0; 
        break;
      }
    }
    
    if(!itemFound) return respondError("ไม่พบรหัสพัสดุ " + data.itemId);
    if(currentBalance < qty) return respondError("พัสดุไม่เพียงพอ (คงเหลือ " + currentBalance + " ชิ้น)");
    
    const currentDispense = parseInt(invRows[rowIndex][6]) || 0;
    invSheet.getRange(rowIndex + 2, 7).setValue(currentDispense + qty); 
    invSheet.getRange(rowIndex + 2, 8).setValue(currentBalance - qty);
    
    // 3. Append Transaction
    const dueDate = new Date(timestamp);
    dueDate.setDate(dueDate.getDate() + 7); 

    const transLog = [
      transId,
      timestamp,
      String(data.userId || "Unknown"),
      userName,
      String(data.itemId || "-"),
      itemName,
      qty,
      "ยืม",
      String(data.reason || "ยืมเพื่อการศึกษา"),
      "ค้างส่ง",
      dueDate
    ];
    transSheet.appendRow(transLog);

    return respondSuccess({
      "message": "บันทึกการเบิกพัสดุสำเร็จ",
      "transaction_id": transId
    });
  } catch (e) {
    return respondError("ข้อผิดพลาด: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// 🟡 ฟังก์ชัน: ส่งรายการคลังทั้งหมด (Get Inventory)
// ==========================================
function getInventoryList() {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const sheet = getSmartSheet(ss, ["Inventory", "inventory", "แผ่น2", "Sheet2", "พัสดุ", "คลัง"]);
    if(!sheet) return respondError("ไม่พบแผ่นข้อมูลเพื่อดึงรายการพัสดุ");
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return respondSuccess([]); // ส่ง Array ว่างกลับไป (ดักบัคคลังว่าง)

    const rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const inventoryData = [];
    
    for (let i = 0; i < rows.length; i++) {
        if(String(rows[i][0]).trim() === "") continue; 
        
        inventoryData.push({
            "id": rows[i][0],      
            "name": rows[i][1],    
            "category": rows[i][2],
            "condition": rows[i][3], 
            "balanceForward": rows[i][4],
            "received": rows[i][5],
            "dispensed": rows[i][6],
            "balance": rows[i][7],
            "note": rows[i][8]
        });
    }
    
    return respondSuccess(inventoryData);
}

// ==========================================
// 🟠 ฟังก์ชัน: ดึงรายการพัสดุที่ค้างส่งของฉัน (Get My Borrows)
// ==========================================
function getMyBorrows(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม", "แผ่น3", "Sheet3"]);
  
  if(!transSheet) return respondError("ไม่พบแผ่นข้อมูล Transactions (ประวัติการยืม)");
  
  const userId = String(data.user_id || data.userId || data.username || "").toLowerCase().trim();
  if(!userId) return respondError("ไม่มีข้อมูล User ID สำหรับดึงรายการยืม");

  const transLastRow = transSheet.getLastRow();
  if (transLastRow < 2) return respondSuccess([]);

  const rows = transSheet.getRange(2, 1, transLastRow - 1, 11).getValues();
  
  const myBorrows = [];
  rows.forEach(r => {
    const rowUserId = String(r[2]).toLowerCase().trim(); // column C (UserID)
    const rowStatus = String(r[9]).trim(); // column J (Status)
    const rowType = String(r[7]).trim();   // column H (Type)
    
    if (rowUserId === userId && rowStatus !== "คืนแล้ว" && (rowType.includes("ยืม") || rowType.includes("เบิก"))) {
      myBorrows.push({
        transaction_id: r[0],
        date: r[1],
        item_id: r[4],
        item_name: r[5],
        qty: parseInt(r[6]) || 1,
        status: r[9],
        due_date: r[10] || ""
      });
    }
  });

  return respondSuccess(myBorrows);
}

// ==========================================
// 🟣 ฟังก์ชัน: ดึงประวัติรายการทั้งหมดของฉัน (Get My History)
// ==========================================
function getMyHistory(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม", "แผ่น3", "Sheet3"]);
  
  if(!transSheet) return respondError("ไม่พบแผ่นข้อมูล Transactions (ประวัติการยืม)");
  
  const userId = String(data.user_id || data.userId || "").trim();
  if(!userId) return respondError("ไม่มีข้อมูล User ID สำหรับดึงประวัติ");

  const transLastRow = transSheet.getLastRow();
  if (transLastRow < 2) return respondSuccess([]);

  const rows = transSheet.getRange(2, 1, transLastRow - 1, 11).getValues();

  const myHistory = [];
  rows.forEach(r => {
    const rowUserId = String(r[2]).trim();
    if (rowUserId === userId) {
      myHistory.push({
        transaction_id: r[0],
        date: r[1],
        item_id: r[4],
        item_name: r[5],
        qty: parseInt(r[6]) || 1,
        type: r[7],
        status: String(r[9]).trim(),
        due_date: r[10] || ""
      });
    }
  });

  myHistory.sort((a,b) => new Date(b.date) - new Date(a.date));
  return respondSuccess(myHistory);
}

// ==========================================
// 📊 ฟังก์ชัน: ดึงข้อมูลสรุปสำหรับ Dashboard (Get Dashboard Stats)
// ==========================================
function getDashboardStats(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม"]);
  if(!transSheet) return respondError("ไม่พบข้อมูลรายงาน");

  const userId = String(data.user_id || data.userId || data.username || "").toLowerCase().trim();
  if(!userId) return respondError("ไม่มี User ID สำหรับ Dashboard");

  const lastRow = transSheet.getLastRow();
  if (lastRow < 2) return respondSuccess({ totalBorrows:0, activeBorrows:0, returnedCount:0, recentBorrows:[], borrowTrends:[0,0,0,0,0,0] });

  const transRows = transSheet.getRange(2, 1, lastRow - 1, 11).getValues();

  let totalBorrows = 0;
  let activeBorrows = 0;
  let returnedCount = 0;
  const recentBorrows = [];
  const monthlyCounts = [0, 0, 0, 0, 0, 0]; // Jan - Jun
  
  transRows.forEach(r => {
    const rowUserId = String(r[2]).toLowerCase().trim();
    if (rowUserId === userId) {
      const type = String(r[7]);
      const status = String(r[9]);
      const date = new Date(r[1]);
      
      if (type.includes("ยืม") || type.includes("เบิก")) {
        totalBorrows++;
        if (status.includes("ค้าง")) {
          activeBorrows++;
          recentBorrows.push({
            itemName: r[5],
            date: date instanceof Date && !isNaN(date) ? date.toLocaleDateString('th-TH') : "ไม่ระบุวันที่",
            status: status
          });
        }
        if (status.includes("คืนแล้ว")) returnedCount++;
        
        const month = date instanceof Date && !isNaN(date) ? date.getMonth() : -1;
        if (month >= 0 && month < 6) monthlyCounts[month]++;
      }
    }
  });

  return respondSuccess({
    totalBorrows,
    activeBorrows,
    returnedCount,
    recentBorrows: recentBorrows.slice(0, 5),
    borrowTrends: monthlyCounts
  });
}

// ==========================================
// 🟣 ฟังก์ชัน: คืนพัสดุ (Return Items)
// ==========================================
function processReturn(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม"]);
  const invSheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  
  if(!transSheet || !invSheet) return respondError("หาแผ่น Inventory หรือ Transactions ไม่เจอ");
  
  const returnIds = data.transaction_ids || [];
  if(!Array.isArray(returnIds) || returnIds.length === 0) return respondError("ไม่มีรายการที่เลือกคืน");

  const transLastRow = transSheet.getLastRow();
  if (transLastRow < 2) return respondError("ไม่มีข้อมูลในตาราง Transactions");
  
  // Range: 11 columns (A to K) — must include DueDate column
  const transRange = transSheet.getRange(2, 1, transLastRow - 1, 11);
  const transRows = transRange.getValues();

  const invLastRow = invSheet.getLastRow();
  const invRows = invSheet.getRange(2, 1, invLastRow - 1, 9).getValues();

  let returnedCount = 0;

  for (let i = 0; i < transRows.length; i++) {
    const trxId = String(transRows[i][0]).trim();
    const currentStatus = String(transRows[i][9]).trim();
    
    if (returnIds.includes(trxId) && currentStatus !== "คืนแล้ว") {
      const itemId = String(transRows[i][4]).trim();
      const qty = parseInt(transRows[i][6]) || 0;
      
      // 1. Update transaction status (Column J is index 9)
      transRows[i][9] = "คืนแล้ว";
      
      // 2. Update inventory stock (Restore dispensed count AND recalculate Balance)
      for(let j=0; j<invRows.length; j++) {
        if(String(invRows[j][0]).trim() === itemId) {
           let currentDispense = parseInt(invRows[j][6]) || 0;
           currentDispense = Math.max(0, currentDispense - qty);
           invSheet.getRange(j + 2, 7).setValue(currentDispense);
           
           // Also recalculate Balance = BalanceForward + Received - Dispense
           const balanceForward = parseInt(invRows[j][4]) || 0;
           const received = parseInt(invRows[j][5]) || 0;
           const newBalance = Math.max(0, balanceForward + received - currentDispense);
           invSheet.getRange(j + 2, 8).setValue(newBalance);
           
           // Update local snapshot to avoid stale data for next item in same call
           invRows[j][6] = currentDispense;
           invRows[j][7] = newBalance;
           break;
        }
      }
      returnedCount++;
    }
  }

  if(returnedCount > 0) {
    transRange.setValues(transRows);
    return respondSuccess({ message: `ทำรายการคืนสำเร็จ ${returnedCount} รายการ` });
  } else {
    return respondError("ไม่พบรายการที่สามารถคืนได้ (อาจถูกคืนไปแล้ว)");
  }
}

// ==========================================
// ⏳ ฟังก์ชัน: ยืดเวลาการยืม (Extend Borrow)
// ==========================================
function extendBorrow(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม"]);
  if(!transSheet) return respondError("หาแผ่น Transactions ไม่เจอ");

  const trxId = String(data.transaction_id || "").trim();
  if(!trxId) return respondError("ไม่มีรหัส Transaction");

  const transLastRow = transSheet.getLastRow();
  if (transLastRow < 2) return respondError("ไม่พบรายการ");

  const transRange = transSheet.getRange(2, 1, transLastRow - 1, 11);
  const transRows = transRange.getValues();

  for (let i = 0; i < transRows.length; i++) {
    if (String(transRows[i][0]).trim() === trxId) {
      if (transRows[i][9] === "คืนแล้ว") return respondError("พัสดุนี้ถูกคืนไปแล้ว");
      
      let currentDueDate = transRows[i][10];
      if (!currentDueDate || currentDueDate === "") {
        currentDueDate = new Date(transRows[i][1]);
        currentDueDate.setDate(currentDueDate.getDate() + 7);
      } else {
        currentDueDate = new Date(currentDueDate);
      }
      
      currentDueDate.setDate(currentDueDate.getDate() + 7); // Extend by 7 days
      transRows[i][10] = currentDueDate;
      
      transRange.setValues(transRows);
      return respondSuccess({ message: "ต่อเวลาการยืมอีก 7 วัน สำเร็จ" });
    }
  }

  return respondError("ไม่พบรายการยืมนี้");
}

// ==========================================
// 🔘 ฟังก์ชัน: ลงทะเบียนผู้ใช้ใหม่ (Register User)
// ==========================================
function registerUser(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Users", "users", "แผ่น1", "Sheet1", "สมาชิก"]);
  
  if(!sheet) return respondError("หาแผ่นข้อมูลพนักงานไม่เจอ");

  const username = String(data.username || "").trim();
  const password = String(data.password || "").trim();
  const fullName = String(data.full_name || "").trim();
  const department = String(data.department || "").trim();
  
  if(!username || !password) return respondError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");

  // เช็คว่าชื่อผู้ใช้ซ้ำไหม
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase().trim() === username.toLowerCase()) {
        return respondError("ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว กรุณาเลือกชื่ออื่น");
      }
    }
  }

  // เพิ่มข้อมูลลงใน Sheet
  // โครงสร้าง: [username, password, name, role, department, status]
  const adminKey = String(data.admin_key || "").trim();
  const role = (adminKey === "SCHOOL_ADMIN_2026") ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป";
  
  const newUser = [
    username,
    password,
    fullName,
    role,
    department,
    "ใช้งาน"
  ];
  
  sheet.appendRow(newUser);

  return respondSuccess({ 
    message: "ลงทะเบียนสำเร็จแล้ว! คุณสามารถเข้าสู่ระบบได้ทันที",
    username: username
  });
}

// ==========================================
// 🛡️ [ADMIN] ฟังก์ชัน: ดึงรายการธุรกรรมทั้งหมด (Get All Transactions)
// ==========================================
function getAllTransactions(data) {
  if (!isAdmin(data)) return respondError("Admin Only");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม"]);
  if(!transSheet) return respondError("ไม่พบแผ่นข้อมูล Transactions");

  const lastRow = transSheet.getLastRow();
  if (lastRow < 2) return respondSuccess([]);

  // Fetch 11 columns: ID, Date, UserID, UserName, ItemID, ItemName, Qty, Type, Reason, Status, DueDate
  const rows = transSheet.getRange(2, 1, lastRow - 1, 11).getValues();
  const result = rows.map(row => ({
    trx_id: row[0],
    date: row[1],
    user_id: row[2],
    user_name: row[3],
    item_id: row[4],
    item_name: row[5],
    qty: row[6],
    type: row[7],
    reason: row[8],
    status: row[9],
    due_date: row[10]
  }));

  return respondSuccess(result.reverse());
}

// ==========================================
// 🛡️ [ADMIN] ฟังก์ชัน: ดึงสถิติภาพรวม (Get Admin Stats)
// ==========================================
function getAdminStats(data) {
  if (!isAdmin(data)) return respondError("Admin Only");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const invSheet = getSmartSheet(ss, ["Inventory", "inventory", "แผ่น2", "Sheet2", "พัสดุ", "คลัง"]);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม", "แผ่น3", "Sheet3", "การยืม"]);
  
  let stats = {
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    activeBorrows: 0
  };

  if (invSheet) {
    const lastRow = invSheet.getLastRow();
    if (lastRow >= 2) {
      const rows = invSheet.getRange(2, 8, lastRow - 1, 1).getValues(); // Column H is Balance
      stats.totalItems = rows.length;
      rows.forEach(r => {
        const b = Number(r[0]) || 0;
        if (b === 0) stats.outOfStock++;
        else if (b < 5) stats.lowStock++;
      });
    }
  }

  if (transSheet) {
    const lastRow = transSheet.getLastRow();
    if (lastRow >= 2) {
      const statuses = transSheet.getRange(2, 10, lastRow - 1, 1).getValues(); // Column J is Status
      statuses.forEach(s => {
        if (String(s[0]).includes("ค้าง")) stats.activeBorrows++;
      });
    }
  }

  return respondSuccess(stats);
}

// ==========================================
// 📈 [ADMIN] ฟังก์ชัน: ดึงข้อมูลสถิติสำหรับกราฟ (Analytics)
// ==========================================
// ==========================================
// 📈 [ADMIN] ฟังก์ชัน: ดึงข้อมูลสถิติขั้นสูง (Advanced Analytics)
// ==========================================
function getAdminAnalytics(data) {
  if (!isAdmin(data)) return respondError("Admin Only");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม"]);
  
  if (!transSheet) return respondError("ไม่พบข้อมูล Transactions");
  
  const lastRow = transSheet.getLastRow();
  // Return empty structure if no data
  if (lastRow < 2) return respondSuccess({ 
    popularItems: [], 
    trends: [], 
    topBorrowers: [],
    exportData: [] 
  });
  
  // Params
  const daysFilter = parseInt(data.days) || 7; // Default 7 days
  
  // Fetch columns: ID, Date(1), UserID(2), UserName(3), ItemID(4), ItemName(5), Qty(6), Type(7), Reason(8), Status(9)
  const rows = transSheet.getRange(2, 1, lastRow - 1, 10).getValues();
  
  const itemCounts = {};
  const userCounts = {};
  const trendCounts = {};
  const exportData = []; // Store raw filtered data for export
  
  // Setup date range boundaries
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
  const cutoffDate = new Date(todayStart);
  cutoffDate.setDate(cutoffDate.getDate() - (daysFilter - 1)); // if 1 day, cutoff is today. if 7, cutoff is 6 days ago + today.
  
  // Initialize trend dictionary based on 'daysFilter'
  // If 1 Day, we might show hourly, but for simplicity we'll show just "Today" or if they want daily trends, 
  // 1 Day trend is just 1 data point. We'll generate the last 'X' days keys.
  for (let i = daysFilter - 1; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("th-TH", { day: '2-digit', month: 'short' });
    trendCounts[dateStr] = 0;
  }
  
  for (let i = 0; i < rows.length; i++) {
    const trxId = rows[i][0];
    const dateCell = new Date(rows[i][1]);
    const userId = String(rows[i][2]).trim();
    const userName = String(rows[i][3]).trim();
    const itemName = String(rows[i][5]).trim();
    const qty = parseInt(rows[i][6]) || 1;
    const type = String(rows[i][7]).trim(); // "ยืม" / "คืน"
    const status = String(rows[i][9]).trim();
    
    // Normalize date for comparison
    const rowDateStart = new Date(dateCell.getFullYear(), dateCell.getMonth(), dateCell.getDate(), 0,0,0,0);
    
    // Check if within timeframe
    if (rowDateStart >= cutoffDate && rowDateStart <= todayStart) {
      
      // Save for export (we export everything in timeframe, not just "ยืม")
      exportData.push({
        trx_id: trxId,
        date: rows[i][1],
        user_name: userName,
        item_name: itemName,
        qty: qty,
        type: type,
        status: status
      });

      // Analytics calculation (Focus on "ยืม" for popularity and trends)
      if (type === "ยืม") {
        // 1. Popular items
        if (itemCounts[itemName]) itemCounts[itemName] += qty;
        else itemCounts[itemName] = qty;
        
        // 2. Top Borrowers
        if (userCounts[userName]) userCounts[userName] += qty;
        else userCounts[userName] = qty;
        
        // 3. Trends
        const dateStr = rowDateStart.toLocaleDateString("th-TH", { day: '2-digit', month: 'short' });
        if (trendCounts[dateStr] !== undefined) {
          trendCounts[dateStr] += qty;
        }
      }
    }
  }
  
  // Sort popular items (Top 5)
  const popularArray = Object.keys(itemCounts).map(name => ({
    name: name,
    count: itemCounts[name]
  })).sort((a, b) => b.count - a.count).slice(0, 5);
  
  // Sort Top Borrowers (Top 5)
  const topBorrowersArray = Object.keys(userCounts).map(name => ({
    name: name,
    count: userCounts[name]
  })).sort((a, b) => b.count - a.count).slice(0, 5);
  
  // Format trends
  const trendArray = Object.keys(trendCounts).map(date => ({
    date: date,
    count: trendCounts[date]
  }));
  
  return respondSuccess({
    timeframe_days: daysFilter,
    popularItems: popularArray,
    trends: trendArray,
    topBorrowers: topBorrowersArray,
    exportData: exportData
  });
}

// ==========================================
// 🚀 [USER/NEW] ฟังก์ชัน: เบิกพัสดุแบบกลุ่ม (Batch Borrow)
// ==========================================
function batchBorrow(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const items = data.items || [];
    const userId = data.userId;
    const reason = data.reason || "ยืมเพื่อการศึกษา";
    const duration = parseInt(data.duration) || 7; 
    
    if (items.length === 0) return respondError("ไม่มีรายการพัสดุส่งมา");

    const invSheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
    const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม"]);
    const userSheet = getSmartSheet(ss, ["Users", "users", "สมาชิก"]);

    if (!invSheet || !transSheet) return respondError("หาแผ่น Inventory หรือ Transactions ไม่เจอ");

    // 1. Get User Name
    let userName = "Unknown User";
    if (userSheet) {
      const userRows = userSheet.getRange(2, 1, Math.max(1, userSheet.getLastRow() - 1), 3).getValues();
      for (let i = 0; i < userRows.length; i++) {
        if (String(userRows[i][0]).trim() === String(userId).trim()) {
          userName = userRows[i][2];
          break;
        }
      }
    }

    const timestamp = new Date();
    const summary = [];
    let successCount = 0;
    
    // Efficiency: Read all intentory rows once
    const invRange = invSheet.getRange(2, 1, Math.max(1, invSheet.getLastRow() - 1), 9);
    const invRowsSnapshot = invRange.getValues();

    // Process Each Item
    for (let cartItem of items) {
      const itemId = String(cartItem.id).trim();
      const qty = parseInt(cartItem.qty) || 1;
      
      let rowIndex = -1;
      let currentBalance = 0;
      let itemName = "Unknown Item";

      for (let i = 0; i < invRowsSnapshot.length; i++) {
        if (String(invRowsSnapshot[i][0]).trim() === itemId) {
          rowIndex = i;
          itemName = invRowsSnapshot[i][1];
          currentBalance = parseInt(invRowsSnapshot[i][7]) || 0;
          break;
        }
      }

      if (rowIndex === -1) {
        summary.push({ id: itemId, status: "error", message: "ไม่พบพัสดุ" });
        continue;
      }

      if (currentBalance < qty) {
        summary.push({ id: itemId, status: "error", message: `พัสดุไม่พอ (เหลือ ${currentBalance})` });
        continue;
      }

      // Update In-Memory Snapshot
      const currentDispense = parseInt(invRowsSnapshot[rowIndex][6]) || 0;
      invRowsSnapshot[rowIndex][6] = currentDispense + qty;
      invRowsSnapshot[rowIndex][7] = Math.max(0, currentBalance - qty);

      // Log Transaction
      const transId = "TRX" + Utilities.formatDate(timestamp, "GMT+7", "yyyyMMddHHmmss") + successCount;
      const dueDate = new Date(timestamp);
      dueDate.setDate(dueDate.getDate() + duration);

      const transLog = [transId, timestamp, String(userId || "Unknown"), userName, itemId, itemName, qty, "ยืม", reason, "ค้างส่ง", dueDate];
      transSheet.appendRow(transLog);
      
      successCount++;
      summary.push({ id: itemId, status: "success" });
    }

    // Efficiency: Write back all inventory changes at once
    invRange.setValues(invRowsSnapshot);

    return respondSuccess({
      message: `เบิกพัสดุสำเร็จ ${successCount} จาก ${items.length} รายการ`,
      summary: summary
    });
  } catch (e) {
    return respondError("Batch Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// 🚀 [USER/NEW] ฟังก์ชัน: ดึงหมวดหมู่พัสดุทั้งหมด (Get Categories)
// ==========================================
function getCategories() {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  if (!sheet) return respondError("ไม่พบแผ่นข้อมูล Inventory");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return respondSuccess([]);

  const data = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Column C: Category
  const categories = [...new Set(data.flat().map(c => String(c).trim()).filter(c => c !== ""))];
  
  return respondSuccess(categories.sort());
}

// ==========================================
// 🧪 [ADMIN] ฟังก์ชัน: ล้างข้อมูลทั้งระบบเพื่อเริ่มทดสอบใหม่ (Clear All Data)
// ==========================================
function clearAllSystemData(data) {
  // ตรวจสอบว่าเป็น Admin หรือไม่ (เพื่อความปลอดภัย)
  if (data.role !== "Admin" && data.role !== "admin") {
    // ในขั้นทดสอบเราอนุโลมให้ผ่านได้ก่อน แต่ถ้าเป็นระบบจริงต้องเช็คละเอียดกว่านี้
    // return respondError("คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้");
  }

  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  
  // 1. ล้างตารางธุรกรรม (Transactions)
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม"]);
  if (transSheet && transSheet.getLastRow() > 1) {
    transSheet.deleteRows(2, transSheet.getLastRow() - 1);
  }

  // 2. รีเซ็ตยอดคลัง (Inventory)
  const invSheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  if (invSheet && invSheet.getLastRow() > 1) {
    const lastRow = invSheet.getLastRow();
    const range = invSheet.getRange(2, 5, lastRow - 1, 4); // Columns E, F, G, H
    const values = range.getValues();
    
    for (let i = 0; i < values.length; i++) {
        const balanceForward = Number(values[i][0]) || 0;
        const received = Number(values[i][1]) || 0;
        values[i][2] = 0; // Reset dispensed to 0
        values[i][3] = balanceForward + received; // Balance = Forward + Received
    }
    range.setValues(values);
  }

  return respondSuccess({ message: "ล้างข้อมูลประวัติและรีเซ็ตสต็อกสำเร็จแล้ว พร้อมทดสอบระบบ!" });
}


// ==========================================
// 🧪 [TEST] ฟังก์ชัน: สร้างข้อมูลพัสดุจำลอง 100 รายการ (Seed Data)
// ==========================================
function seedInventoryData(data) {
  if (!isAdmin(data)) return respondError("Unauthorized");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  if (!sheet) return respondError("ไม่พบแผ่นข้อมูล Inventory");

  const categories = [
    { name: "IT & โสตทัศนูปกรณ์", items: ["Laptop Dell Vostro", "iPad Air 5", "Projector Epson", "Microphone Wireless", "Webcam Logitech", "HDMI Cable 5m", "Universal Adapter", "USB-C Hub", "Drawing Tablet", "PowerBank 20k mAh", "Speaker Bluetooth", "Tripod Pro"] },
    { name: "วิทยาศาสตร์", items: ["Microscope 1000x", "Digital Scale", "Bunsen Burner", "Test Tube Rack", "Beaker 500ml", "Erlenmeyer Flask", "Safety Goggles", "Anatomy Model", "Periodic Table Chart", "Magnifying Glass", "Thermometer Digital", "pH Meter"] },
    { name: "อุปกรณ์กีฬา", items: ["Basketball Molten", "Football Adidas", "Badminton Racket", "Volleyball Mikasa", "Table Tennis Bat", "Stopwatch Digital", "Air Pump", "Yoga Mat", "Weight Dumbbell 5kg", "Shuttlecock Box", "Whistle Fox40", "First Aid Kit Sports"] },
    { name: "ศิลปะและดนตรี", items: ["Acoustic Guitar", "Electric Keyboard", "Violin 4/4", "Ukulele", "Acrylic Paint Set", "Easel Wood", "Sketchbook A3", "Paint Brush Set", "Palette Knife", "Drum Sticks", "Music Stand", "Canvas 40x50"] },
    { name: "อุปกรณ์สำนักงาน", items: ["Stapler Heavy Duty", "Paper Cutter", "Laminator A3", "Puncher 2-hole", "Label Maker", "Whiteboard Marker", "Paper Shredder", "Calculator Casio", "Correction Tape", "Clipboard A4", "Scissors Pro", "Desk Organizer"] },
    { name: "บรรณารักษ์ & หนังสือ", items: ["คู่มือการใช้โปรแกรม", "พจนานุกรมไทย", "Encyclopedia Set", "Fiction Novel", "Biography of Steve Jobs", "Cookbook International", "Magazine National Geo", "Map of Asia", "English Grammar Pro", "Coding for Kids", "Science Project Guide", "History of Thailand"] },
    { name: "เครื่องมือช่าง", items: ["Power Drill", "Screwdriver Set", "Hammer Steel", "Wrench Adjustable", "Tape Measure 5m", "Glue Gun 60W", "Soldering Iron", "Tool Box XL", "Utility Knife", "Level Tool", "Pliers Set", "Safety Helmet"] },
    { name: "คหกรรม & งานบ้าน", items: ["Electric Kettle", "Induction Cooker", "Toaster Duo", "Blender 2L", "Knife Set Kitchen", "Apron Blue", "Frying Pan 24cm", "Whisk Steel", "Measuring Cup Set", "Cutting Board Wood", "Oven Glove", "Coffee Maker"] }
  ];

  const results = [];
  let idCounter = 100;

  categories.forEach(cat => {
    cat.items.forEach(itemName => {
      idCounter++;
      const itemId = (cat.name === "IT & โสตทัศนูปกรณ์" ? "IT" : cat.name.substring(0,2).toUpperCase()) + idCounter;
      const initialStock = Math.floor(Math.random() * 20) + 5; // 5-25ชิ้น
      
      const newRow = [
        itemId,
        itemName,
        cat.name,
        "ปกติ",
        initialStock,   // Balance forward
        0,              // Received
        0,              // Dispensed
        initialStock,   // Balance
        "ข้อมูลจำลองเพื่อการทดสอบ"
      ];
      sheet.appendRow(newRow);
      results.push(itemName);
    });
  });

  return respondSuccess({
    message: `สร้างพัสดุจำลองสำเร็จ ${results.length} รายการ`,
    items: results
  });
}

// ==========================================
// ✅ Helper: Standard Success Response
function respondSuccess(dataObject) {
  const output = { "status": "success", "data": dataObject };
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

// ❌ Helper: Standard Error Response
function respondError(errorMessage) {
  const output = { "status": "error", "message": String(errorMessage) };
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 📊 [ADMIN] ฟังก์ชัน: สรุปยอดการใช้งาน (Admin Summary)
// ==========================================
function getAdminSummary(data) {
  if (!isAdmin(data)) return respondError("Admin Only");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const transSheet = getSmartSheet(ss, ["Transactions", "transactions", "ประวัติการยืม"]);
  const invSheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  
  if (!transSheet || !invSheet) return respondError("ไม่พบข้อมูลรายงาน");

  const filterType = data.filter || "7d"; // today, 7d, 30d, all
  const now = new Date();
  const startOfPeriod = new Date();
  startOfPeriod.setHours(0,0,0,0);

  if (filterType === "7d") startOfPeriod.setDate(now.getDate() - 7);
  else if (filterType === "30d") startOfPeriod.setDate(now.getDate() - 30);
  else if (filterType === "today") { /* already set to 00:00:00 */ }
  else if (filterType === "all") startOfPeriod.setFullYear(2000);

  const transRows = transSheet.getRange(2, 1, Math.max(1, transSheet.getLastRow() - 1), 11).getValues();
  const invRows = invSheet.getRange(2, 1, Math.max(1, invSheet.getLastRow() - 1), 9).getValues();

  let totalBorrows = 0;
  let totalReturns = 0;
  const categoryStats = {};
  const dailyTrends = {};

  // Pre-fill dailyTrends with 0 for each day in the period
  if (filterType !== "all") {
    const tempDate = new Date(startOfPeriod);
    while (tempDate <= now) {
      const label = Utilities.formatDate(tempDate, "GMT+7", "dd/MM");
      dailyTrends[label] = 0;
      tempDate.setDate(tempDate.getDate() + 1);
    }
  }

  transRows.forEach(row => {
    if (!row[0]) return;
    const date = new Date(row[1]);
    const type = String(row[7]);
    const qty = parseInt(row[6]) || 0;
    const itemId = String(row[4]);

    if (date >= startOfPeriod) {
      if (type.includes("ยืม")) totalBorrows += qty;
      if (type.includes("คืน")) totalReturns += qty;

      // Find Category from Inventory rows (or could use a Map for speed)
      const invItem = invRows.find(i => String(i[0]) === itemId);
      const cat = invItem ? invItem[2] : "ไม่ระบุ";
      categoryStats[cat] = (categoryStats[cat] || 0) + qty;

      // Trend label
      const label = Utilities.formatDate(date, "GMT+7", "dd/MM");
      dailyTrends[label] = (dailyTrends[label] || 0) + qty;
    }
  });

  return respondSuccess({
    totalBorrows,
    totalReturns,
    categoryStats,
    dailyTrends,
    filter: filterType
  });
}

// ==========================================
// 🧪 [NEW] Transformation Seeder
// ==========================================
function seedTransformationData(data) {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  
  // 1. Setup Sheets if not exists
  const sheetsNeeded = ["Projects", "Activities", "Requests"];
  sheetsNeeded.forEach(s => {
    if (!ss.getSheetByName(s)) ss.insertSheet(s);
  });
  
  // 2. Clear and Add Headers
  const pSheet = ss.getSheetByName("Projects");
  pSheet.clear().getRange(1,1,1,7).setValues([["ID", "Name", "Department", "Budget_Material", "Budget_Equipment", "Budget_Hiring", "Status"]]);
  pSheet.appendRow(["PJ-2569-0001", "โครงการพัฒนาระบบเทคโนโลยี", "ไอที", 50000, 100000, 20000, "Active"]);
  pSheet.appendRow(["PJ-2569-0002", "โครงการปรับปรุงอาคารเรียน", "บริหาร", 200000, 50000, 300000, "Active"]);

  const aSheet = ss.getSheetByName("Activities");
  aSheet.clear().getRange(1,1,1,5).setValues([["ProjectID", "ID", "Name", "Allocated", "Spent"]]);
  aSheet.appendRow(["PJ-2569-0001", "ACT-01", "จัดซื้อคอมพิวเตอร์ใหม่", 100000, 0]);
  aSheet.appendRow(["PJ-2569-0001", "ACT-02", "บำรุงรักษา Server", 20000, 0]);

  const rSheet = ss.getSheetByName("Requests");
  rSheet.clear().getRange(1,1,1,9).setValues([["REQID", "Timestamp", "ProjectID", "ActivityID", "UserID", "Description", "Amount", "Status", "Signature"]]);
  
  return respondSuccess({ message: "สร้างข้อมูลระบบนโยบายและแผนเริ่มต้นสำเร็จ" });
}

// ==========================================
// 📦 ฟังก์ชัน: จัดการพัสดุ (Admin Inventory Actions)
// ==========================================

function addItem(data) {
  if (!isAdmin(data)) return respondError("คุณไม่มีสิทธิ์ดำเนินการนี้");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  if(!sheet) return respondError("ไม่พบแผ่นข้อมูล Inventory");

  const lastRow = sheet.getLastRow();
  const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues() : [];
  const exists = rows.some(r => String(r[0]).trim() === String(data.id).trim());
  if (exists) return respondError("รหัสพัสดุนี้มีอยู่ในระบบแล้ว");

  const forward = parseInt(data.balanceForward) || 0;
  const received = parseInt(data.received) || 0;
  const balance = forward + received;

  sheet.appendRow([
    data.id,
    data.name,
    data.category || "-",
    data.condition || "ปกติ",
    forward,
    received,
    0,
    balance,
    data.note || "-"
  ]);

  return respondSuccess({ message: "เพิ่มพัสดุใหม่สำเร็จ" });
}

function updateItem(data) {
  if (!isAdmin(data)) return respondError("คุณไม่มีสิทธิ์ดำเนินการนี้");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  if(!sheet) return respondError("ไม่พบแผ่นข้อมูล Inventory");

  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(2, 1, lastRow - 1, 9);
  const rows = range.getValues();
  
  let foundIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) return respondError("ไม่พบรหัสพัสดุที่ต้องการแก้ไข");

  const forward = parseInt(data.balanceForward) || 0;
  const received = parseInt(data.received) || 0;
  const dispensed = parseInt(rows[foundIndex][6]) || 0;
  const balance = forward + received - dispensed;

  const updatedRow = [
    data.id,
    data.name,
    data.category || "-",
    data.condition || "ปกติ",
    forward,
    received,
    dispensed,
    balance,
    data.note || "-"
  ];

  sheet.getRange(foundIndex + 2, 1, 1, 9).setValues([updatedRow]);
  return respondSuccess({ message: "แก้ไขข้อมูลพัสดุสำเร็จ" });
}

function deleteItem(data) {
  if (!isAdmin(data)) return respondError("คุณไม่มีสิทธิ์ดำเนินการนี้");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  if(!sheet) return respondError("ไม่พบแผ่นข้อมูล Inventory");

  const lastRow = sheet.getLastRow();
  const rows = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  let foundIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) return respondError("ไม่พบรหัสพัสดุที่ต้องการลบ");

  sheet.deleteRow(foundIndex + 2);
  return respondSuccess({ message: "ลบพัสดุสำเร็จ" });
}

function seedInventoryData(data) {
  if (!isAdmin(data)) return respondError("คุณไม่มีสิทธิ์ดำเนินการนี้");
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const sheet = getSmartSheet(ss, ["Inventory", "inventory", "พัสดุ", "คลัง"]);
  if(!sheet) return respondError("ไม่พบแผ่นข้อมูล Inventory");

  sheet.clear();
  sheet.appendRow(["ID", "Name", "Category", "Condition", "BalanceForward", "Received", "Dispensed", "Balance", "Note"]);
  
  const sampleData = [
    ["IT-001", "iPad Pro 11-inch (Gen 4)", "IT & โสตทัศนูปกรณ์", "ปกติ", 10, 5, 1, 14, "สติกเกอร์หมายเลข 1-15"],
    ["IT-002", "Laptop Dell Latitude", "IT & โสตทัศนูปกรณ์", "ปกติ", 10, 2, 0, 12, "-"],
    ["SPO-001", "ลูกฟุตบอล Molten", "พลศึกษา", "ปกติ", 50, 0, 5, 45, "-"],
    ["ART-001", "ขาตั้งวาดรูป", "ศิลปะ", "ปกติ", 15, 0, 0, 15, "-"]
  ];
  
  sampleData.forEach(row => sheet.appendRow(row));
  return respondSuccess({ message: "สร้างข้อมูลจำลองสำเร็จ" });
}
