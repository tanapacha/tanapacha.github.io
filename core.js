/**
 * core.js — Unified Application Logic for DocFlow
 * Consolidates: api.js, workflow.js, ui.js, event.js, main.js
 */

/* ─────────────────────────────────────────
   0. GLOBAL CONSTANTS (Mock Data & Config)
   ───────────────────────────────────────── */
const mockDepartments = [
    {
        value: 'admin', label: ' งานฝ่ายบริหาร',
        options: [
            { value: 'head_office', label: ' หัวหน้าสำนักงานคณะครุศาสตร์' },
            { value: 'budget', label: ' งานแผนงบประมาณ' },
            { value: 'supplies', label: ' งานพัสดุ' },
            { value: 'finance', label: ' งานการเงินและบัญชี' },
            { value: 'saraban', label: ' งานสารบรรณ' },
            { value: 'hr', label: ' งานบุคลากร' },
            { value: 'secretary', label: ' งานเลขานุการคณบดี' }
        ]
    },
    {
        value: 'academic', label: ' งานวิชาการและฝึกประสบการณ์วิชาชีพครู',
        options: [
            { value: 'reg', label: ' ทะเบียนและวัดผล' },
            { value: 'academic', label: ' วิชาการ' },
            { value: 'training', label: ' ศูนย์ฝึกประสบการณ์วิชาชีพครู' },
            { value: 'curriculum', label: ' งานหลักสูตร' },
            { value: 'qa', label: ' ประกันคุณภาพการศึกษา' },
            { value: 'graduate', label: ' งานบัณฑิตศึกษา' },
            { value: 'certificate', label: ' งานประกาศนียบัตรวิชาชีพ หลักสูตรวิชาชีพครู' }
        ]
    },
    {
        value: 'research', label: ' งานวิจัย บริการวิชาการ กิจการพิเศษ',
        options: [
            { value: 'research_work', label: ' งานวิจัย' },
            { value: 'service', label: ' งานบริการวิชาการ' },
            { value: 'vehicle', label: ' งานยานพาหนะ' },
            { value: 'building', label: ' งานอาคารสถานที่' },
            { value: 'av', label: ' งานโสตทัศนูปกรณ์' }
        ]
    },
    {
        value: 'it_pr', label: ' งานเทคโนโลยีสารสนเทศ และประชาสัมพันธ์',
        options: [
            { value: 'it', label: ' งานเทคโนโลยีสารสนเทศ' },
            { value: 'pr', label: ' งานประชาสัมพันธ์' }
        ]
    }
];

// Fallback people data for preview elements
const mockPeopleByDept = {
    'finance': [{ name: 'หัวหน้างานคลัง', title: 'นักวิชาการเงิน' }, { name: 'เจ้าหน้าที่พัสดุ', title: 'นักวิชาการพัสดุ' }],
    'hr': [{ name: 'หัวหน้างานบุคคล', title: 'นักทรัพยากรบุคคล' }],
    'academic': [{ name: 'รองคณบดีฝ่ายวิชาการ', title: 'รองคณบดี' }],
    'office': [{ name: 'เลขานุการคณะ', title: 'หัวหน้าสำนักงาน' }],
    'dean': [{ name: 'คณบดีคณะครุศาสตร์', title: 'คณบดี' }]
};

const mockDocumentTypes = [
    { value: 'admin', label: ' งานบริหารทั่วไป/สารบรรณ' },
    { value: 'finance', label: ' งานงบประมาณ/การเงิน' },
    { value: 'supplies', label: ' งานพัสดุ' },
    { value: 'academic', label: ' งานวิชาการ/ทะเบียน' },
    { value: 'research', label: ' งานวิจัย/บริการวิชาการ' },
    { value: 'hr', label: ' งานบุคลากร' },
    { value: 'it_pr', label: ' งานเทคโนโลยีสารสนเทศ/ปชส.' },
    { value: 'travel', label: ' งานเดินทางไปราชการ' },
    { value: 'other', label: ' อื่นๆ' },
];

/* ─────────────────────────────────────────
   1. API LAYER (Connects to Google Apps Script)
   ───────────────────────────────────────── */
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyO140nBtbPnfouP0F-mUjQ7WjRYkhqd4Ug-pLLcP3rBvCBx4puMp9SFy4bNIgMTd76/exec';

const API = {
    async _fetchGAS(payload) {
        // --- 🆔 Identity Injection Start ---
        // Automatically inject logged-in user's email if not already present
        try {
            const session = localStorage.getItem('user_session');
            if (session) {
                const userData = JSON.parse(session);
                const userEmail = userData.email || userData.Email || '';
                
                if (userEmail && !payload.email && !payload.userEmail && !payload.senderEmail) {
                    payload.email = userEmail;
                }
            } else {
                console.warn('%c[API Proxy] NO SESSION FOUND in LocalStorage!', 'background: #dc2626; color: white;');
            }
            
            console.log('%c[API Call Logic]', 'color: #0ea5e9; font-weight: bold;', { 
                action: payload.action, 
                finalEmail: payload.email || payload.userEmail || '(NONE)',
                payload: payload 
            });
        } catch (e) {
            console.warn('[API Proxy] Failed to inject identity:', e);
        }
        // --- 🆔 Identity Injection End ---

        const timeout = 25000; // Increased to 25s for slow sheets
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            console.log(`[API Request] Action: ${payload.action}`, payload);
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(id);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            console.log(`[API Response] Success:`, result);
            return result;
        } catch (error) {
            clearTimeout(id);
            const msg = error.name === 'AbortError' ? 'การเชื่อมต่อหมดเวลา (25s Timeout)' : error.message;
            console.error("[API Error Details]:", error);
            return { status: 'error', message: `การเชื่อมต่อขัดข้อง: ${msg}` };
        }
    },

    async checkUser(email) {
        return await this._fetchGAS({ action: 'checkUser', email: email });
    },

    async submitDocument(docData) {
        const payload = { action: 'submitDoc', ...docData };
        return await this._fetchGAS(payload);
    },

    async updateStatus(statusData) {
        const payload = { action: 'updateStatus', ...statusData };
        return await this._fetchGAS(payload);
    },

    async registerUser(userData) {
        const payload = { action: 'registerUser', ...userData };
        return await this._fetchGAS(payload);
    },

    async checkLogin(email, password) {
        return await this._fetchGAS({ action: 'checkLogin', email: email, password: password });
    },

    async getDashboardStats(email = '') {
        return await this._fetchGAS({ action: 'getDashboardStats', email: email });
    },

    async getRecentDocuments(email = '') {
        return await this._fetchGAS({ action: 'getDocuments', email: email });
    },

    async getPendingDocuments(email = '') {
        return await this._fetchGAS({ action: 'getDocuments', status: 'pending', email: email });
    },

    async getWorkflowParticipants() {
        return await this._fetchGAS({ action: 'getWorkflowParticipants' });
    },

    async getAllTemplates() {
        return await this._fetchGAS({ action: 'getAllTemplates' });
    },

    async saveWorkflowTemplate(tpl) {
        return await this._fetchGAS({ action: 'saveWorkflowTemplate', template: tpl });
    },

    async getAdminDashboardData() {
        return await this._fetchGAS({ action: 'getAdminDashboardData' });
    },

    async adminSaveUser(userData) {
        return await this._fetchGAS({ action: 'adminSaveUser', userData: userData });
    },

    async getDriveStats() {
        return await this._fetchGAS({ action: 'getDriveStats' });
    },

    async getSystemFiles() {
        return await this._fetchGAS({ action: 'getSystemFiles' });
    },

    async deleteDriveItem(itemId) {
        return await this._fetchGAS({ action: 'deleteDriveItem', itemId: itemId });
    },

    // ฟังก์ชันดึงข้อมูลผู้ใช้ปัจจุบันจาก Session
    getUser() {
        if (typeof WorkflowEngine !== 'undefined') return WorkflowEngine.getCurrentUser();
        const raw = localStorage.getItem('user_session');
        if (raw) {
            return JSON.parse(raw);
        }
        // Return a default guest user object if no session is found
        return { name: 'Guest', initial: 'G', dept: 'Unknown', email: '' };
    }
};

/* ─────────────────────────────────────────
   2. WORKFLOW ENGINE (State & Logic)
   ───────────────────────────────────────── */
const WorkflowEngine = {
    ROLE_KEY: 'wf_role',

    getRole() { 
        const stored = localStorage.getItem(this.ROLE_KEY);
        if (stored) return stored;
        // Fallback: check session
        const session = this.getCurrentUser();
        return session.role || 'user';
    },
    setRole(role) {
        localStorage.setItem(this.ROLE_KEY, role);
        window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role } }));
    },
    isAdmin() { return this.getRole() === 'admin'; },

    getCurrentUser() {
        const raw = localStorage.getItem('user_session');
        if (!raw) return { name: 'ยังไม่ได้ระบุตัวตน', initial: '?', dept: '-', email: '' };
        
        try {
            const user = JSON.parse(raw);
            const name = user.fullName || user.FullName || user.name || 'ผู้ใช้งาน';
            const email = (user.email || user.Email || '').trim().toLowerCase();
            const dept = user.department || user.Department || user.dept || user.group || '';
            const pos = user.position || user.Position || '';
            
            return {
                name: name,
                initial: name.trim().replace(/^นาย|^นางสาว|^นาง|^ดร\./, '').charAt(0).toUpperCase() || 'U',
                dept: dept,
                position: pos,
                email: email,
                role: user.role || user.Role || 'user'
            };
        } catch (e) {
            console.error('[WorkflowEngine] Failed to parse session:', e);
            return { name: 'Error', initial: '!', dept: '-', email: '' };
        }
    },

    // UI Rendering Helpers for Workflows
    renderBadge(status) {
        const map = {
            pending: '<span class="badge badge-orange"><span class="badge-dot" style="background:#ea580c"></span>รอพิจารณา</span>',
            approved: '<span class="badge badge-green"><span class="badge-dot" style="background:#16a34a"></span>อนุมัติแล้ว</span>',
            rejected: '<span class="badge badge-red"><span class="badge-dot" style="background:#dc2626"></span>ถูกตีกลับ</span>',
        };
        return map[status] || `<span class="badge badge-gray">${status}</span>`;
    },

    renderStepperHTML(workflowSteps, currentIndex) {
        if (!workflowSteps || workflowSteps.length === 0) return '<p class="text-muted">ไม่มีข้อมูลสายงาน</p>';
        return `<div class="wf-stepper">` + workflowSteps.map((step, i) => {
            let stateClass = 'pending';
            let dotContent = `<span style="font-size:11px;color:#94a3b8">${i + 1}</span>`;

            // Handle New Object Structure: { id: "email", name: "Full Name" }
            const stepTitle = (typeof step === 'object' ? (step.name || step.id || step.title) : step) || '—';
            const stepSubtext = (step && step.id && step.id.includes('@')) ? step.id : (i === 0 ? 'ต้นเรื่อง' : 'สายงานหลัก');

            if (i < currentIndex) {
                stateClass = 'done';
                dotContent = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>`;
            } else if (i === currentIndex) {
                stateClass = 'active';
                dotContent = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="12" cy="12" r="4" fill="#fff"/></svg>`;
            }

            return `
                <div class="wf-step ${stateClass}">
                    <div class="wf-step__track">
                        <div class="wf-step__dot">${dotContent}</div>
                        <div class="wf-step__line"></div>
                    </div>
                    <div class="wf-step__body">
                        <div class="wf-step__title" style="font-weight: 700; color: #1e293b;">${stepTitle}</div>
                        <div class="wf-step__desc" style="font-size: 11px; opacity: 0.7;">${stepSubtext}</div>
                    </div>
                </div>`;
        }).join('') + `</div>`;
    },

    /** ──────────────────────────────────────────────
     *  TEMPLATES MANAGEMENT (Missing Logic Fixed)
    ────────────────────────────────────────────── */
    TEMPLATE_KEY: 'wf_templates',

    async syncTemplates() {
        try {
            const templates = await API.getAllTemplates();
            if (Array.isArray(templates)) {
                localStorage.setItem(this.TEMPLATE_KEY, JSON.stringify(templates));
                console.log('[Workflow] Templates synced from server.');
                return templates;
            }
        } catch (err) {
            console.error('[Workflow] Sync failed:', err);
        }
        return this.getAllTemplates();
    },

    getAllTemplates() {
        const raw = localStorage.getItem(this.TEMPLATE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    getTemplateById(id) {
        return this.getAllTemplates().find(t => t.id === id) || null;
    },

    getTemplateForType(type) {
        // Find a template where docTypes array includes the target type
        const all = this.getAllTemplates();
        return all.find(t => t.docTypes && t.docTypes.includes(type)) || null;
    },

    async saveTemplate(tpl) {
        // 1. Save locally for immediate UI update
        const all = this.getAllTemplates();
        const idx = all.findIndex(t => t.id === tpl.id);
        if (idx !== -1) all[idx] = tpl;
        else all.push(tpl);
        localStorage.setItem(this.TEMPLATE_KEY, JSON.stringify(all));

        // 2. Sync to Server (Google Sheets)
        try {
            const resp = await API.saveWorkflowTemplate(tpl);
            if (resp.status === 'success') {
                console.log('[Workflow] Saved to server successfully.');
                return true;
            }
            throw new Error(resp.message);
        } catch (err) {
            console.error('[Workflow] Server save failed:', err);
            throw err;
        }
    },

    deleteTemplate(id) {
        const all = this.getAllTemplates().filter(t => t.id !== id);
        localStorage.setItem(this.TEMPLATE_KEY, JSON.stringify(all));
    },

    newTemplateId() {
        return 'tpl-' + Date.now();
    },

    resetToDefaults() {
        localStorage.removeItem(this.TEMPLATE_KEY);
        this.syncTemplates();
    },

    /* ──── APPROVAL LOGIC ──── */
    _lastLoadedDocs: [],
    setLastLoadedDocs(docs) { this._lastLoadedDocs = docs; },
    getById(id) { return this._lastLoadedDocs.find(d => d.id === id); },

    async approveDocument(docId, comment = '') {
        const user = this.getCurrentUser();
        try {
            const resp = await API.updateStatus({
                action: 'updateStatus',
                docID: docId,
                status: 'approved',
                userEmail: user.email,
                comment: comment
            });
            return { success: resp.status === 'success', msg: resp.message };
        } catch (err) {
            return { success: false, msg: err.message };
        }
    },

    async rejectDocument(docId, reason = '') {
        const user = this.getCurrentUser();
        try {
            const resp = await API.updateStatus({
                action: 'updateStatus',
                docID: docId,
                status: 'rejected',
                userEmail: user.email,
                comment: reason
            });
            return { success: resp.status === 'success', msg: resp.message };
        } catch (err) {
            return { success: false, msg: err.message };
        }
    },

    _stats: { total: 0, pending: 0, approved: 0, rejected: 0, myPending: 0 },
    setStats(stats) { this._stats = stats; },
    getStats() { return this._stats; }
};

/* ─────────────────────────────────────────
   3. UI UTILITIES (Layout & Feedback)
   ───────────────────────────────────────── */
const UI = {
    initialized: false,

    renderLayout(activePageId) {
        if (!this.initialized) this.initGlobalTools();
        const sidebarEl = document.getElementById('sidebar-container');
        const navbarEl = document.getElementById('navbar-container');
        const role = WorkflowEngine.getRole();

        if (sidebarEl) sidebarEl.innerHTML = this._getSidebarHTML(activePageId, role);
        if (navbarEl) navbarEl.innerHTML = this._getNavbarHTML(activePageId, role);

        if (!document.getElementById('sidebar-mobile-overlay')) {
            const ov = document.createElement('div');
            ov.id = 'sidebar-mobile-overlay';
            ov.className = 'sidebar-overlay';
            ov.onclick = () => UI.closeMobileSidebar();
            document.body.appendChild(ov);
        }
        document.querySelector('.app-content')?.classList.add('page-enter');
    },

    openMobileSidebar() {
        document.querySelector('.app-sidebar')?.classList.add('open');
        const overlay = document.getElementById('sidebar-mobile-overlay');
        if (overlay) { overlay.style.display = 'block'; requestAnimationFrame(() => overlay.classList.add('visible')); }
        document.body.style.overflow = 'hidden';
    },

    closeMobileSidebar() {
        document.querySelector('.app-sidebar')?.classList.remove('open');
        const overlay = document.getElementById('sidebar-mobile-overlay');
        if (overlay) { overlay.classList.remove('visible'); setTimeout(() => { overlay.style.display = 'none'; }, 260); }
        document.body.style.overflow = '';
    },

    initGlobalTools() {
        if (this.initialized) return;
        const searchRoot = document.createElement('div');
        searchRoot.id = 'global-search-root';
        searchRoot.innerHTML = this._getGlobalSearchHTML();
        document.body.appendChild(searchRoot);

        document.addEventListener('keydown', e => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.toggleSearch(); }
            if (e.key === 'Escape') this.closeSearch();
        });
        this.initialized = true;
    },

    toggleSearch() {
        const overlay = document.getElementById('global-search-overlay');
        const input = document.getElementById('global-search-input');
        if (!overlay || !input) return;
        overlay.classList.add('active');
        input.value = ''; input.focus();
        document.getElementById('global-search-results').innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;font-size:13px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:12px;opacity:0.5;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><br>พิมพ์รหัสเอกสาร หรือชื่อเรื่องเพื่อค้นหา</div>';

        // Bind input event if not already bound
        if (!input.dataset.bound) {
            input.oninput = (e) => this.handleSearch(e.target.value);
            input.dataset.bound = 'true';
        }
    },

    async handleSearch(query) {
        const resultsEl = document.getElementById('global-search-results');
        if (!query || query.length < 2) {
            resultsEl.innerHTML = '';
            return;
        }

        resultsEl.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:#64748b;">กำลังค้นหา...</div>';

        try {
            const user = WorkflowEngine.getCurrentUser();
            const docs = await API.getRecentDocuments(user.email);
            const filtered = docs.filter(d =>
                (d.id && d.id.toLowerCase().includes(query.toLowerCase())) ||
                (d.title && d.title.toLowerCase().includes(query.toLowerCase()))
            );

            if (filtered.length === 0) {
                resultsEl.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:#64748b;">ไม่พบเอกสารที่ค้นหา</div>';
                return;
            }

            resultsEl.innerHTML = filtered.map(d => `
                <div class="search-item" onclick="window.location.href='status.html?id=${d.id}'" style="padding:12px 16px; border-bottom:1px solid #f1f5f9; cursor:pointer; transition:background 0.2s;">
                    <div style="font-size:11px; font-weight:800; color:#ea580c; text-transform:uppercase;">${d.id}</div>
                    <div style="font-size:14px; font-weight:700; color:#0f172a; margin-top:2px;">${d.title}</div>
                    <div style="font-size:12px; color:#64748b; margin-top:2px;">ส่งโดย: ${d.senderName} • สถานะ: ${d.status}</div>
                </div>
            `).join('');
        } catch (err) {
            resultsEl.innerHTML = `<div style="padding:20px;color:#dc2626;font-size:13px;">เกิดข้อผิดพลาด: ${err.message}</div>`;
        }
    },

    closeSearch() { document.getElementById('global-search-overlay')?.classList.remove('active'); },

    showToast(message, type = 'success', duration = 4000) {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: duration,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                }
            });
            Toast.fire({ icon: type, title: message });
            return;
        }

        let container = document.getElementById('toast-wrapper') || (() => {
            const c = document.createElement('div'); c.id = 'toast-wrapper'; c.className = 'toast-container';
            document.body.appendChild(c); return c;
        })();

        const icons = {
            success: `<svg width="16" height="16" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`,
            error: `<svg width="16" height="16" fill="none" stroke="#dc2626" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
            info: `<svg width="16" height="16" fill="none" stroke="#2563eb" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
        };
        const titles = { success: 'สำเร็จ', error: 'เกิดข้อผิดพลาด', info: 'ข้อมูล' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon-wrap">${icons[type] || icons.info}</div>
            <div class="toast-body"><div class="toast-title">${titles[type]}</div><div class="toast-msg">${message}</div></div>
            <button class="toast-close" onclick="this.closest('.toast').remove()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            <div class="toast-progress" style="animation-duration:${duration}ms;"></div>
        `;
        container.appendChild(toast);
        setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 350); }, duration);
    },

    // SweetAlert2 Wrappers for Premium Look
    alert(title, text, icon = 'info') {
        if (typeof Swal !== 'undefined') {
            return Swal.fire({ title, text, icon, confirmButtonColor: '#ea580c' });
        }
        alert(`${title}\n${text}`);
    },

    success(title, text) {
        return this.alert(title, text, 'success');
    },

    error(title, text) {
        return this.alert(title, text, 'error');
    },

    async confirm(title, text, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') {
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title, text, icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ea580c',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                reverseButtons: true
            });
            return result.isConfirmed;
        }
        return confirm(`${title}\n${text}`);
    },

    setLoadingState(buttonElement, isLoading) {
        if (!buttonElement) return;
        if (isLoading) {
            buttonElement.dataset.originalText = buttonElement.innerHTML;
            buttonElement.disabled = true;
            buttonElement.innerHTML = `<svg style="width:15px;height:15px;animation:spin 0.8s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-18 0"/></svg> กำลังดำเนินการ...`;
        } else {
            buttonElement.disabled = false;
            buttonElement.innerHTML = buttonElement.dataset.originalText || '';
        }
    },

    getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    _getSidebarHTML(activePageId, role) {
        const user = WorkflowEngine.getCurrentUser();
        const items = [
            { id: 'dashboard', label: 'แดชบอร์ดหลัก', href: 'status.html', icon: iconDashboard() },
            { id: 'approval', label: 'กล่องพิจารณาอนุมัติ', href: 'approval.html', icon: iconApproval() },
            { id: 'submitDoc', label: 'สร้างเอกสารใหม่', href: 'submitDoc.html', icon: iconNewDoc() },
            { id: 'myTasks', label: 'เอกสารของฉัน', href: 'myTasks.html', icon: iconFile() },
            { id: 'history', label: 'ประวัติการดำเนินการ', href: 'history.html', icon: iconHistory() },
        ];
        if (role === 'admin') {
            items.splice(0, 0, { id: 'admin', label: 'บริหารระบบ', href: 'admin.html', icon: iconAdmin() });
        }
        return `
            <div class="sidebar-header">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                        <img src="logo.png" alt="Faculty Logo" style="width:100%;height:100%;object-fit:contain;">
                    </div>
                    <div><div style="font-size:14px;font-weight:800;color:#fff;">e-Document</div><div style="font-size:11px;color:#94a3b8;">คณะครุศาสตร์ NPU</div></div>
                </div>
            </div>
            <div class="sidebar-menu">
                ${items.map(item => `<a href="${item.href}" class="menu-item ${item.id === activePageId ? 'active' : ''}">${item.icon}<span>${item.label}</span></a>`).join('')}
            </div>
            <div style="margin:auto 12px 12px;">
                <a href="profile.html" style="background:#0f172a;border-radius:12px;padding:10px;display:flex;align-items:center;gap:10px;text-decoration:none;">
                    <div style="width:32px;height:32px;border-radius:50%;background:#ea580c;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${user.initial}</div>
                    <div style="overflow:hidden;"><div style="font-size:13px;font-weight:700;color:#f8fafc;">${user.name}</div><div style="font-size:11px;color:#94a3b8;">${user.dept}</div></div>
                </a>
            </div>
        `;
    },

    _getNavbarHTML(activePageId, role) {
        const user = WorkflowEngine.getCurrentUser();
        return `
            <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <button class="sidebar-toggle" onclick="UI.openMobileSidebar()"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
                    <div><div style="font-size:18px;font-weight:800;">${document.title.split('—')[0]}</div><div style="font-size:12px;color:#64748b;">คณะครุศาสตร์ มหาวิทยาลัยนครพนม</div></div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                    <button class="btn-icon" onclick="UI.toggleSearch()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></button>
                    <div style="display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:99px;padding:4px 12px 4px 4px;cursor:pointer;" onclick="window.location.href='profile.html'">
                        <div style="width:28px;height:28px;border-radius:50%;background:#ea580c;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;">${user.initial}</div>
                        <span style="font-size:13px;font-weight:600;">${user.name.split(' ')[0]}</span>
                    </div>
                </div>
            </div>
        `;
    },

    _getGlobalSearchHTML() {
        return `<div class="search-overlay" id="global-search-overlay" onclick="UI.closeSearch()"><div class="search-modal" onclick="event.stopPropagation()"><div class="search-field-wrap"><input type="text" id="global-search-input" placeholder="ค้นหาโดยชื่อเรื่อง หรือ รหัสเอกสาร..." oninput="/* Search logic */"></div><div id="global-search-results"></div></div></div>`;
    }
};

/* ─────────────────────────────────────────
   4. EVENT MANAGER (Centralized Handling)
   ───────────────────────────────────────── */
const EventManager = {
    init() {
        this.bindForms();
    },

    bindForms() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = loginForm.querySelector('button[type="submit"]');
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value.trim();
                UI.setLoadingState(btn, true);
                try {
                    const response = await API.checkLogin(email, password);
                    if (response.status === 'success') {
                        localStorage.setItem('user_session', JSON.stringify(response.data));
                        WorkflowEngine.setRole(response.data.role);
                        UI.showToast('เข้าสู่ระบบสำเร็จ กำลังโหลด...', 'success');
                        setTimeout(() => window.location.href = 'status.html', 800);
                    } else {
                        UI.showToast(response.message || 'ข้อมูลไม่ถูกต้อง', 'error');
                    }
                } catch (err) {
                    UI.showToast('การเชื่อมต่อล้มเหลว', 'error');
                } finally {
                    UI.setLoadingState(btn, false);
                }
            });
        }
    }
};

/* ─────────────────────────────────────────
   5. INITIALIZATION (Entry Point)
   ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const sessionRaw = localStorage.getItem('user_session');
    console.log('%c[System Info] CURRENT SESSION:', 'background: #0f172a; color: #fbbf24; padding: 2px 4px; border-radius: 4px;', sessionRaw);

    if (document.getElementById('sidebar-container') || document.getElementById('navbar-container')) {
        UI.renderLayout(document.body.dataset.pageId || 'dashboard');
    }
    EventManager.init();
    
    // Auto-diagnostic for empty session
    if (!sessionRaw && !window.location.pathname.includes('index.html') && !window.location.pathname.includes('register.html')) {
        console.warn('[Auth Check] No session found. Redirecting to login...');
        // Only redirect if we are not already on login or register
        // window.location.href = 'index.html'; 
    }
    
    console.log('[App] Core Initialized. Role:', WorkflowEngine.getRole());
});

/* Helpers */
function iconDashboard() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`; }
function iconNewDoc() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/></svg>`; }
function iconFile() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/></svg>`; }
function iconHistory() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`; }
function iconAdmin() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`; }
function iconApproval() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`; }
function iconWorkflow() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v2a4 4 0 004 4h6a4 4 0 004-4V8"/><path d="M12 14v2"/></svg>`; }

window.EventManager = EventManager;

/* ─────────────────────────────────────────
   6. RUNTIME DATA STORE
   ───────────────────────────────────────── */
window.realParticipants = {};

// End of core.js
