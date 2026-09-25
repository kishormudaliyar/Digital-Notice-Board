// ===== APP STATE =====
let appState = {
    user: null,
    isAdmin: false,
    notificationsEnabled: false,
    notificationsTime: 'morning',
    currentView: 'feed', // 'feed' | 'deadlines'
    activeReminderNoticeId: null,
    deadlineColors: {
        urgent: '#c62828',  // < 48 hours (Red)
        upcoming: '#e65100', // < 7 days (Orange)
        later: '#2e7d32'    // > 7 days (Green)
    },
    notices: []
};

// ===== SAMPLE DATA (with dynamic current dates covering all urgency tiers & attachments) =====
function getSampleNotices() {
    const today = new Date();
    const formatDate = (daysAhead) => {
        const d = new Date(today);
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split('T')[0];
    };

    return [
        {
            id: 1,
            title: 'Exam Hall Ticket Collection & Fee Verification',
            content: 'All candidates must collect their stamped hall tickets from room 204. Ensure any remaining semester dues are cleared prior to the deadline.',
            date: formatDate(0),
            deadline: formatDate(1), // < 48 hrs -> URGENT
            priority: 'high',
            author: 'Examination Cell',
            attachment: {
                name: 'FYCS_Semester_Hall_Ticket_Circular.pdf',
                type: 'application/pdf',
                size: 24576,
                data: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PmVuZG9iago1IDAgb2JqPDwvTGVuZ3RoIDc3Pj5zdHJlYW0KQlQgL0YxIDE0IFRmIDUwIDcyMCBUZCAoTC5ELiBTb25hd2FuZSBDb2xsZWdlIC0gRllDUyBFeGFtaW5hdGlvbiBDaXJjdWxhciAyMDI2KSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU2IDAwMDAwIG4gCjAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDIxMiAwMDAwMCBuIAowMDAwMDAwMjc5IDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxMDYKJSVFT0Y='
            }
        },
        {
            id: 2,
            title: 'Scholarship Application Verification Form',
            content: 'Submit hard copies of income certificates and domicile documents for scholarship renewal at the administrative counter.',
            date: formatDate(-1),
            deadline: formatDate(4), // < 7 days -> UPCOMING
            priority: 'high',
            author: 'Financial Aid Office'
        },
        {
            id: 3,
            title: 'Final Year Project Documentation & Viva Registration',
            content: 'Submission of synopsis, project documentation, and code repositories on GitHub for semester assessment and external viva.',
            date: formatDate(-2),
            deadline: formatDate(14), // > 7 days -> LATER
            priority: 'medium',
            author: 'Computer Science Dept',
            attachment: {
                name: 'FYCS_Project_Viva_Schedule_Timetable.png',
                type: 'image/svg+xml',
                size: 18432,
                data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="%23f8f9fa"/><rect x="20" y="20" width="560" height="50" rx="8" fill="%23003D82"/><text x="300" y="52" fill="white" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">FYCS Project Viva Schedule 2026</text><rect x="20" y="85" width="560" height="235" rx="8" fill="white" stroke="%23DCDCDC"/><text x="40" y="125" fill="%23333" font-family="sans-serif" font-size="14" font-weight="bold">Batch 1 (Roll 101 - 130): 09:30 AM - Lab 1</text><text x="40" y="165" fill="%23333" font-family="sans-serif" font-size="14" font-weight="bold">Batch 2 (Roll 131 - 160): 11:30 AM - Lab 1</text><text x="40" y="205" fill="%23333" font-family="sans-serif" font-size="14" font-weight="bold">Batch 3 (Roll 161 - 190): 01:30 PM - Lab 2</text><text x="40" y="250" fill="%23666" font-family="sans-serif" font-size="13">Requirements: Printed synopsis, GitHub link, ID card</text><text x="40" y="290" fill="%23e65100" font-family="sans-serif" font-size="13" font-weight="bold">External Examiner: University of Mumbai</text></svg>'
            }
        },
        {
            id: 4,
            title: 'Library Overdue Book Return Drive',
            content: 'Return overdue books without late fine penalty during the ongoing clearance drive before the semester examination.',
            date: formatDate(-5),
            deadline: formatDate(-1), // Past -> EXPIRED
            priority: 'low',
            author: 'Central Library'
        },
        {
            id: 5,
            title: 'Campus Wi-Fi Maintenance & Upgrades',
            content: 'The campus IT department will be upgrading core switches and access points this Saturday between 11:00 AM and 3:00 PM.',
            date: formatDate(-3),
            deadline: null, // Regular notice without deadline
            priority: 'low',
            author: 'IT Infrastructure'
        }
    ];
}

// ===== UTILITIES =====
function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function dataUrlToBlob(dataUrl) {
    if (!dataUrl) return new Blob();
    if (dataUrl.startsWith('data:image/svg+xml;utf8,')) {
        const svgContent = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
        return new Blob([svgContent], { type: 'image/svg+xml' });
    }
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function openAttachmentViewer(attachment) {
    if (!attachment || !attachment.data) {
        showToast('No attachment data found');
        return;
    }
    try {
        const blob = dataUrlToBlob(attachment.data);
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
        console.error('Error opening attachment blob:', e);
        window.open(attachment.data, '_blank');
    }
}

function downloadAttachment(attachment) {
    if (!attachment || !attachment.data) {
        showToast('No attachment to download');
        return;
    }
    try {
        const blob = dataUrlToBlob(attachment.data);
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = attachment.name || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        showToast(`Downloading ${attachment.name || 'document'}...`);
    } catch (e) {
        console.error('Error downloading attachment:', e);
        const a = document.createElement('a');
        a.href = attachment.data;
        a.download = attachment.name || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Downloading ${attachment.name || 'document'}...`);
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ===== INITIALIZATION =====
function init() {
    loadState();
    loadNotices();
    applyUrgencyColors();
    registerServiceWorker();
    setupPWAInstall();
    setupPullToRefresh();
    setupRouting();

    // Check if user was previously logged in and set initial history state
    if (appState.user) {
        showScreen('homeScreen', false);
        if (window.history && window.history.replaceState) {
            window.history.replaceState({ screen: 'homeScreen' }, '', '#homeScreen');
        }
        updateFAB();
        switchView(appState.currentView || 'feed');
    } else {
        showScreen('loginScreen', false);
        if (window.history && window.history.replaceState) {
            window.history.replaceState({ screen: 'loginScreen' }, '', '#loginScreen');
        }
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('appState');
        if (saved) {
            const parsed = JSON.parse(saved);
            appState = {
                ...appState,
                ...parsed,
                deadlineColors: {
                    ...appState.deadlineColors,
                    ...(parsed.deadlineColors || {})
                }
            };
        } else {
            saveState();
        }
    } catch (e) {
        console.error('Failed to parse appState:', e);
    }
}

// ===== URGENCY COLORS & STYLES =====
function hexToRgba(hex, alpha = 0.12) {
    if (!hex || hex[0] !== '#') return `rgba(0,0,0,${alpha})`;
    let c = hex.substring(1);
    if (c.length === 3) {
        c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyUrgencyColors() {
    const colors = appState.deadlineColors || {
        urgent: '#c62828',
        upcoming: '#e65100',
        later: '#2e7d32'
    };

    const root = document.documentElement;
    root.style.setProperty('--urgency-urgent', colors.urgent);
    root.style.setProperty('--urgency-urgent-bg', hexToRgba(colors.urgent, 0.12));
    root.style.setProperty('--urgency-upcoming', colors.upcoming);
    root.style.setProperty('--urgency-upcoming-bg', hexToRgba(colors.upcoming, 0.12));
    root.style.setProperty('--urgency-later', colors.later);
    root.style.setProperty('--urgency-later-bg', hexToRgba(colors.later, 0.12));

    const inputUrgent = document.getElementById('urgencyColorUrgent');
    const inputUpcoming = document.getElementById('urgencyColorUpcoming');
    const inputLater = document.getElementById('urgencyColorLater');

    if (inputUrgent) inputUrgent.value = colors.urgent;
    if (inputUpcoming) inputUpcoming.value = colors.upcoming;
    if (inputLater) inputLater.value = colors.later;
}

function updateUrgencyColor(tier, hexValue) {
    if (!appState.deadlineColors) {
        appState.deadlineColors = { urgent: '#c62828', upcoming: '#e65100', later: '#2e7d32' };
    }
    appState.deadlineColors[tier] = hexValue;
    saveState();
    applyUrgencyColors();

    if (appState.currentView === 'deadlines') {
        renderDeadlines();
    }
    showToast(`Updated ${tier} urgency color`);
}

function resetUrgencyColors() {
    appState.deadlineColors = {
        urgent: '#c62828',
        upcoming: '#e65100',
        later: '#2e7d32'
    };
    saveState();
    applyUrgencyColors();

    if (appState.currentView === 'deadlines') {
        renderDeadlines();
    }
    showToast('Reset urgency colors to default');
}

function saveState() {
    try {
        localStorage.setItem('appState', JSON.stringify(appState));
    } catch (e) {
        console.error('Failed to save appState:', e);
    }
}

function loadNotices() {
    try {
        const saved = localStorage.getItem('notices');
        let notices = saved ? JSON.parse(saved) : getSampleNotices();
        if (saved && Array.isArray(notices)) {
            const samples = getSampleNotices();
            let updated = false;
            notices = notices.map(n => {
                const sampleMatch = samples.find(s => s.id === n.id);
                if (sampleMatch && sampleMatch.attachment && !n.attachment) {
                    n.attachment = sampleMatch.attachment;
                    updated = true;
                }
                return n;
            });
            if (updated) {
                localStorage.setItem('notices', JSON.stringify(notices));
            }
        }
        appState.notices = notices;
        if (!saved) {
            saveNotices();
        }
        renderNotices();
    } catch (e) {
        console.error('Failed to load notices:', e);
        appState.notices = getSampleNotices();
        renderNotices();
    }
}

function saveNotices() {
    try {
        localStorage.setItem('notices', JSON.stringify(appState.notices));
    } catch (e) {
        console.error('Failed to save notices:', e);
    }
}

// ===== AUTHENTICATION =====
function login() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput ? usernameInput.value.trim() : '';

    if (!username) {
        showToast('Please enter a username');
        return;
    }

    appState.user = {
        username: username,
        loginTime: new Date().toISOString()
    };
    appState.isAdmin = username.toLowerCase() === 'admin';
    saveState();

    showScreen('homeScreen');
    renderNotices();
    updateFAB();
    showToast(`Welcome, ${username}!`);
}

function logout() {
    if (confirm('Are you sure you want to log out?')) {
        appState.user = null;
        appState.isAdmin = false;
        saveState();

        const userInput = document.getElementById('usernameInput');
        const passInput = document.getElementById('passwordInput');
        if (userInput) userInput.value = 'student';
        if (passInput) passInput.value = '';

        showScreen('loginScreen');
        showToast('Logged out');
    }
}

// ===== SCREEN MANAGEMENT & HISTORY ROUTING =====
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value !== '') {
        searchInput.value = '';
    }
}

function showScreen(screenId, pushHistory = true) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        target.scrollTop = 0;
    }

    // Always clear search input when returning or navigating to homeScreen
    if (screenId === 'homeScreen') {
        clearSearch();
    }

    if (pushHistory && window.history && window.history.pushState) {
        const currentState = window.history.state;
        if (!currentState || currentState.screen !== screenId) {
            window.history.pushState({ screen: screenId }, '', `#${screenId}`);
        }
    }
}

function setupRouting() {
    window.addEventListener('popstate', (event) => {
        const targetScreen = event.state && event.state.screen 
            ? event.state.screen 
            : (appState.user ? 'homeScreen' : 'loginScreen');

        // Transition without pushing redundant history
        showScreen(targetScreen, false);

        if (targetScreen === 'homeScreen') {
            clearSearch();
            if (appState.currentView === 'deadlines') {
                renderDeadlines();
            } else {
                renderNotices();
            }
        }
    });
}

function goHome() {
    clearSearch();
    // Use history.back() if previous history entry is homeScreen to avoid inflating history stack
    if (window.history.state && window.history.state.screen && window.history.state.screen !== 'homeScreen') {
        window.history.back();
    } else {
        showScreen('homeScreen', true);
        if (appState.currentView === 'deadlines') {
            renderDeadlines();
        } else {
            renderNotices();
        }
    }
}

// ===== VIEW MODE SWITCHER =====
function switchView(viewName) {
    appState.currentView = viewName;
    saveState();

    const feedBtn = document.getElementById('viewFeedBtn');
    const deadlinesBtn = document.getElementById('viewDeadlinesBtn');
    const noticeList = document.getElementById('noticeList');
    const deadlineTimeline = document.getElementById('deadlineTimeline');
    const searchInput = document.getElementById('searchInput');

    if (viewName === 'deadlines') {
        if (feedBtn) feedBtn.classList.remove('active');
        if (deadlinesBtn) deadlinesBtn.classList.add('active');
        if (noticeList) noticeList.style.display = 'none';
        if (deadlineTimeline) deadlineTimeline.style.display = 'block';
        if (searchInput) {
            searchInput.placeholder = 'Search upcoming deadlines...';
            searchInput.value = '';
        }
        renderDeadlines();
    } else {
        if (feedBtn) feedBtn.classList.add('active');
        if (deadlinesBtn) deadlinesBtn.classList.remove('active');
        if (noticeList) noticeList.style.display = 'block';
        if (deadlineTimeline) deadlineTimeline.style.display = 'none';
        if (searchInput) {
            searchInput.placeholder = 'Search notices by title, content, or priority...';
            searchInput.value = '';
        }
        renderNotices();
    }
}

let currentAdminAttachment = null;

function handleAttachmentSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Check size limit: 2MB max for localStorage
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        showToast('File exceeds 2MB limit for local browser storage');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        currentAdminAttachment = {
            name: file.name,
            type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
            size: file.size,
            data: e.target.result
        };
        showAdminAttachmentPreview(currentAdminAttachment);
    };
    reader.onerror = function() {
        showToast('Failed to read selected file');
    };
    reader.readAsDataURL(file);
}

function showAdminAttachmentPreview(attachment) {
    const container = document.getElementById('attachmentPreviewAdmin');
    const icon = document.getElementById('adminAttachmentIcon');
    const name = document.getElementById('adminAttachmentName');
    const size = document.getElementById('adminAttachmentSize');

    if (!container) return;

    const isPdf = attachment.type === 'application/pdf' || (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'));
    if (icon) icon.textContent = isPdf ? '📄' : '🖼️';
    if (name) name.textContent = attachment.name || 'Attachment';
    if (size) size.textContent = `(${formatBytes(attachment.size)})`;

    container.style.display = 'flex';
}

function removeAdminAttachment() {
    currentAdminAttachment = null;
    const fileInput = document.getElementById('noticeAttachment');
    if (fileInput) fileInput.value = '';
    const container = document.getElementById('attachmentPreviewAdmin');
    if (container) container.style.display = 'none';
    showToast('Attachment removed');
}

function openAdmin() {
    if (!appState.isAdmin) {
        showToast('Only administrators can post notices');
        return;
    }

    const titleHeader = document.getElementById('adminScreenTitle');
    const submitBtn = document.getElementById('adminSubmitBtn');
    const noticeIdInput = document.getElementById('noticeId');

    if (titleHeader) titleHeader.textContent = 'Post Notice';
    if (submitBtn) submitBtn.textContent = 'Post Notice';
    if (noticeIdInput) noticeIdInput.value = '';

    document.getElementById('noticeTitle').value = '';
    document.getElementById('noticeContent').value = '';
    document.getElementById('noticeDeadline').value = '';
    document.getElementById('noticePriority').value = 'medium';

    currentAdminAttachment = null;
    const fileInput = document.getElementById('noticeAttachment');
    if (fileInput) fileInput.value = '';
    const container = document.getElementById('attachmentPreviewAdmin');
    if (container) container.style.display = 'none';

    showScreen('adminScreen');
}

function openEditNotice(id) {
    if (!appState.isAdmin) {
        showToast('Only administrators can edit notices');
        return;
    }

    const notice = appState.notices.find(n => n.id === Number(id));
    if (!notice) {
        showToast('Notice not found');
        return;
    }

    const titleHeader = document.getElementById('adminScreenTitle');
    const submitBtn = document.getElementById('adminSubmitBtn');
    const noticeIdInput = document.getElementById('noticeId');
    const titleInput = document.getElementById('noticeTitle');
    const contentInput = document.getElementById('noticeContent');
    const deadlineInput = document.getElementById('noticeDeadline');
    const priorityInput = document.getElementById('noticePriority');

    if (titleHeader) titleHeader.textContent = 'Edit Notice';
    if (submitBtn) submitBtn.textContent = 'Update Notice';
    if (noticeIdInput) noticeIdInput.value = notice.id;

    if (titleInput) titleInput.value = notice.title || '';
    if (contentInput) contentInput.value = notice.content || '';
    if (deadlineInput) deadlineInput.value = notice.deadline || '';
    if (priorityInput) priorityInput.value = notice.priority || 'medium';

    const fileInput = document.getElementById('noticeAttachment');
    if (fileInput) fileInput.value = '';

    if (notice.attachment) {
        currentAdminAttachment = { ...notice.attachment };
        showAdminAttachmentPreview(currentAdminAttachment);
    } else {
        currentAdminAttachment = null;
        const container = document.getElementById('attachmentPreviewAdmin');
        if (container) container.style.display = 'none';
    }

    showScreen('adminScreen');
}

function openSettings() {
    updateNotifToggle();
    const notifSelect = document.getElementById('notifTime');
    if (notifSelect) {
        notifSelect.value = appState.notificationsTime || 'morning';
    }
    applyUrgencyColors();
    showScreen('settingsScreen');
}

function updateFAB() {
    const fab = document.getElementById('fab');
    if (!fab) return;
    if (appState.isAdmin) {
        fab.classList.remove('hidden');
    } else {
        fab.classList.add('hidden');
    }
}

// ===== NOTICE MANAGEMENT (FULL CRUD) =====
function renderNotices(noticesToRender = appState.notices) {
    const list = document.getElementById('noticeList');
    if (!list) return;

    // Securely clear previous children without innerHTML
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    if (!noticesToRender || noticesToRender.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';

        const icon = document.createElement('div');
        icon.className = 'empty-state-icon';
        icon.textContent = '📭';

        const msg = document.createElement('p');
        msg.textContent = 'No notices found';

        emptyState.appendChild(icon);
        emptyState.appendChild(msg);
        list.appendChild(emptyState);
        return;
    }

    const fragment = document.createDocumentFragment();

    noticesToRender.forEach(notice => {
        const card = document.createElement('div');
        card.className = 'notice-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Notice: ${notice.title}`);

        // Safe event listener referencing notice ID
        card.addEventListener('click', () => {
            viewNotice(notice.id);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                viewNotice(notice.id);
            }
        });

        const content = document.createElement('div');
        content.className = 'notice-content';

        const title = document.createElement('div');
        title.className = 'notice-title';
        title.textContent = notice.title;

        const date = document.createElement('div');
        date.className = 'notice-date';
        let dateInfo = `📅 ${notice.date}`;
        if (notice.deadline) {
            dateInfo += ` • Deadline: ${notice.deadline}`;
        }
        date.textContent = dateInfo;

        content.appendChild(title);
        content.appendChild(date);

        if (notice.attachment) {
            const isPdf = notice.attachment.type === 'application/pdf' || (notice.attachment.name && notice.attachment.name.toLowerCase().endsWith('.pdf'));
            const attachPill = document.createElement('span');
            attachPill.className = 'attachment-pill';
            attachPill.textContent = isPdf ? '📎 PDF Circular' : '📎 Timetable Image';
            content.appendChild(attachPill);
        }

        const cardRight = document.createElement('div');
        cardRight.className = 'card-right';

        const priority = document.createElement('span');
        const prio = (notice.priority || 'medium').toLowerCase();
        priority.className = `notice-priority priority-${prio}`;
        priority.textContent = (notice.priority || 'medium').toUpperCase();
        cardRight.appendChild(priority);

        // Admin Edit and Delete action buttons on card
        if (appState.isAdmin) {
            const adminActions = document.createElement('div');
            adminActions.className = 'card-admin-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn-card-action btn-card-edit';
            editBtn.textContent = '✏️ Edit';
            editBtn.title = 'Edit Notice';
            editBtn.setAttribute('aria-label', `Edit Notice: ${notice.title}`);
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditNotice(notice.id);
            });
            adminActions.appendChild(editBtn);

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-card-action btn-card-delete';
            delBtn.textContent = '🗑️ Delete';
            delBtn.title = 'Delete Notice';
            delBtn.setAttribute('aria-label', `Delete Notice: ${notice.title}`);
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNotice(notice.id);
            });
            adminActions.appendChild(delBtn);

            cardRight.appendChild(adminActions);
        }

        card.appendChild(content);
        card.appendChild(cardRight);

        fragment.appendChild(card);
    });

    list.appendChild(fragment);
}

function viewNotice(id) {
    const notice = appState.notices.find(n => n.id === Number(id));
    if (!notice) return;

    const detail = document.getElementById('noticeDetail');
    if (!detail) return;

    // Securely clear previous children without innerHTML
    while (detail.firstChild) {
        detail.removeChild(detail.firstChild);
    }

    const container = document.createElement('div');
    container.className = 'notice-detail';

    const h2 = document.createElement('h2');
    h2.textContent = notice.title;
    container.appendChild(h2);

    const meta = document.createElement('div');
    meta.className = 'notice-meta';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = `📅 ${notice.date}`;
    meta.appendChild(dateSpan);

    const authorSpan = document.createElement('span');
    authorSpan.textContent = `✍️ ${notice.author || 'Admin'}`;
    meta.appendChild(authorSpan);

    container.appendChild(meta);

    const body = document.createElement('div');
    body.className = 'notice-body';
    body.textContent = notice.content;
    container.appendChild(body);

    if (notice.deadline) {
        const deadlineBox = document.createElement('div');
        deadlineBox.className = 'notice-deadline-box';

        const deadlineLabel = document.createElement('strong');
        deadlineLabel.textContent = '⏰ Deadline: ';
        deadlineBox.appendChild(deadlineLabel);

        const deadlineVal = document.createTextNode(notice.deadline);
        deadlineBox.appendChild(deadlineVal);

        container.appendChild(deadlineBox);
    }

    if (notice.attachment) {
        const isPdf = notice.attachment.type === 'application/pdf' || (notice.attachment.name && notice.attachment.name.toLowerCase().endsWith('.pdf'));
        const isImage = (notice.attachment.type && notice.attachment.type.startsWith('image/')) || (notice.attachment.name && /\.(png|jpe?g|svg|webp|gif)$/i.test(notice.attachment.name));

        const attachBox = document.createElement('div');
        attachBox.className = 'notice-attachment-box';

        const attachHeader = document.createElement('div');
        attachHeader.className = 'attachment-box-header';
        attachHeader.textContent = isPdf ? '📄 Official Circular / Circular PDF' : '🖼️ Official Timetable / Attachment';
        attachBox.appendChild(attachHeader);

        if (isImage) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'attachment-img-preview-container';

            const img = document.createElement('img');
            img.className = 'attachment-preview-img';
            img.src = notice.attachment.data;
            img.alt = notice.attachment.name || 'Notice Attachment';
            img.title = 'Click to open full view';
            img.addEventListener('click', () => {
                openAttachmentViewer(notice.attachment);
            });

            imgContainer.appendChild(img);
            attachBox.appendChild(imgContainer);
        }

        const attachMeta = document.createElement('div');
        attachMeta.className = 'attachment-card-meta';

        const metaInfo = document.createElement('div');
        metaInfo.className = 'attachment-meta-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'attachment-filename';
        nameSpan.textContent = notice.attachment.name || (isPdf ? 'Official_Circular.pdf' : 'Timetable.png');
        metaInfo.appendChild(nameSpan);

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'attachment-filesize';
        sizeSpan.textContent = formatBytes(notice.attachment.size);
        metaInfo.appendChild(sizeSpan);

        attachMeta.appendChild(metaInfo);

        const attachActions = document.createElement('div');
        attachActions.className = 'attachment-actions';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-attachment-view';
        viewBtn.textContent = isPdf ? '📄 View PDF / Timetable' : '🖼️ View Full Image';
        viewBtn.addEventListener('click', () => {
            openAttachmentViewer(notice.attachment);
        });
        attachActions.appendChild(viewBtn);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-attachment-download';
        downloadBtn.textContent = '📥 Download';
        downloadBtn.addEventListener('click', () => {
            downloadAttachment(notice.attachment);
        });
        attachActions.appendChild(downloadBtn);

        attachMeta.appendChild(attachActions);
        attachBox.appendChild(attachMeta);
        container.appendChild(attachBox);
    }

    const actions = document.createElement('div');
    actions.className = 'notice-actions';

    // Share button using addEventListener and notice ID
    const shareBtn = document.createElement('button');
    shareBtn.textContent = '🔗 Share';
    shareBtn.setAttribute('aria-label', 'Share Notice');
    shareBtn.addEventListener('click', () => {
        shareNotice(notice.id);
    });
    actions.appendChild(shareBtn);

    // Remind Me button using addEventListener
    const remindBtn = document.createElement('button');
    remindBtn.textContent = '⏰ Remind Me';
    remindBtn.setAttribute('aria-label', 'Remind Me');
    remindBtn.addEventListener('click', () => {
        addReminder(notice.id);
    });
    actions.appendChild(remindBtn);

    // Admin Edit and Delete action buttons using addEventListener
    if (appState.isAdmin) {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.textContent = '✏️ Edit Notice';
        editBtn.setAttribute('aria-label', 'Edit Notice');
        editBtn.addEventListener('click', () => {
            openEditNotice(notice.id);
        });
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = '🗑️ Delete Notice';
        deleteBtn.setAttribute('aria-label', 'Delete Notice');
        deleteBtn.addEventListener('click', () => {
            deleteNotice(notice.id);
        });
        actions.appendChild(deleteBtn);
    }

    container.appendChild(actions);
    detail.appendChild(container);

    showScreen('detailScreen');
}

function filterNotices() {
    const input = document.getElementById('searchInput');
    const query = input ? input.value.trim().toLowerCase() : '';

    if (appState.currentView === 'deadlines') {
        if (!query) {
            renderDeadlines();
            return;
        }
        const filtered = appState.notices.filter(notice =>
            notice.deadline && (
                (notice.title && notice.title.toLowerCase().includes(query)) ||
                (notice.content && notice.content.toLowerCase().includes(query)) ||
                (notice.priority && notice.priority.toLowerCase().includes(query)) ||
                (notice.deadline && notice.deadline.toLowerCase().includes(query))
            )
        );
        renderDeadlines(filtered);
    } else {
        if (!query) {
            renderNotices(appState.notices);
            return;
        }
        const filtered = appState.notices.filter(notice =>
            (notice.title && notice.title.toLowerCase().includes(query)) ||
            (notice.content && notice.content.toLowerCase().includes(query)) ||
            (notice.priority && notice.priority.toLowerCase().includes(query))
        );
        renderNotices(filtered);
    }
}

// ===== DEADLINE TIMELINE VIEW =====
function renderDeadlines(deadlinesToRender = null) {
    const timeline = document.getElementById('deadlineTimeline');
    if (!timeline) return;

    // Securely clear previous children without innerHTML
    while (timeline.firstChild) {
        timeline.removeChild(timeline.firstChild);
    }

    const noticesWithDeadlines = (deadlinesToRender !== null ? deadlinesToRender : appState.notices)
        .filter(n => n.deadline);

    if (noticesWithDeadlines.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';

        const icon = document.createElement('div');
        icon.className = 'empty-state-icon';
        icon.textContent = '📅';

        const msg = document.createElement('p');
        msg.textContent = 'No upcoming deadlines found';

        emptyState.appendChild(icon);
        emptyState.appendChild(msg);
        timeline.appendChild(emptyState);
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = noticesWithDeadlines.map(notice => {
        const deadlineDate = new Date(notice.deadline);
        deadlineDate.setHours(23, 59, 59, 999);
        const diffMs = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let tier = 'later';
        let urgencyLabel = '';
        let badgeIcon = '⏳';

        if (diffDays < 0) {
            tier = 'expired';
            urgencyLabel = 'Deadline Passed';
            badgeIcon = '⚠️';
        } else if (diffDays === 0) {
            tier = 'urgent';
            urgencyLabel = 'Due Today';
            badgeIcon = '🚨';
        } else if (diffDays === 1) {
            tier = 'urgent';
            urgencyLabel = 'Due Tomorrow (< 24h)';
            badgeIcon = '🚨';
        } else if (diffDays <= 2) {
            tier = 'urgent';
            urgencyLabel = `Due in ${diffDays} days (< 48h)`;
            badgeIcon = '🚨';
        } else if (diffDays <= 7) {
            tier = 'upcoming';
            urgencyLabel = `Due in ${diffDays} days (< 7d)`;
            badgeIcon = '⏰';
        } else {
            tier = 'later';
            const weeks = Math.round(diffDays / 7);
            urgencyLabel = `Due in ${diffDays} days (${weeks} ${weeks === 1 ? 'wk' : 'wks'})`;
            badgeIcon = '⏳';
        }

        return {
            notice,
            diffDays,
            tier,
            urgencyLabel,
            badgeIcon,
            formattedDate: deadlineDate.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
        };
    });

    // Chronological sorting: upcoming nearest first (0, 1, 2, ...), expired last
    enriched.sort((a, b) => {
        if (a.diffDays >= 0 && b.diffDays >= 0) return a.diffDays - b.diffDays;
        if (a.diffDays >= 0 && b.diffDays < 0) return -1;
        if (a.diffDays < 0 && b.diffDays >= 0) return 1;
        return b.diffDays - a.diffDays;
    });

    // Summary count bar
    const urgentCount = enriched.filter(e => e.tier === 'urgent').length;
    const upcomingCount = enriched.filter(e => e.tier === 'upcoming').length;
    const laterCount = enriched.filter(e => e.tier === 'later').length;

    const summaryBar = document.createElement('div');
    summaryBar.className = 'timeline-summary';

    if (urgentCount > 0) {
        const chip = document.createElement('div');
        chip.className = 'timeline-summary-chip urgent';
        chip.textContent = `🚨 ${urgentCount} Urgent (<48h)`;
        summaryBar.appendChild(chip);
    }
    if (upcomingCount > 0) {
        const chip = document.createElement('div');
        chip.className = 'timeline-summary-chip upcoming';
        chip.textContent = `⏰ ${upcomingCount} Upcoming (<7d)`;
        summaryBar.appendChild(chip);
    }
    if (laterCount > 0) {
        const chip = document.createElement('div');
        chip.className = 'timeline-summary-chip later';
        chip.textContent = `⏳ ${laterCount} Later (>7d)`;
        summaryBar.appendChild(chip);
    }

    timeline.appendChild(summaryBar);

    // Timeline cards fragment
    const fragment = document.createDocumentFragment();

    enriched.forEach(item => {
        const card = document.createElement('div');
        card.className = `timeline-card tier-${item.tier}`;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Deadline: ${item.notice.title}, ${item.urgencyLabel}`);

        card.addEventListener('click', () => {
            viewNotice(item.notice.id);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                viewNotice(item.notice.id);
            }
        });

        // Header: Urgency badge & Date chip
        const header = document.createElement('div');
        header.className = 'timeline-header';

        const badge = document.createElement('span');
        badge.className = `urgency-badge ${item.tier}`;
        badge.textContent = `${item.badgeIcon} ${item.urgencyLabel}`;

        const dateChip = document.createElement('span');
        dateChip.className = 'timeline-date-chip';
        dateChip.textContent = `📅 ${item.formattedDate}`;

        header.appendChild(badge);
        header.appendChild(dateChip);

        if (item.notice.attachment) {
            const isPdf = item.notice.attachment.type === 'application/pdf' || (item.notice.attachment.name && item.notice.attachment.name.toLowerCase().endsWith('.pdf'));
            const attachPill = document.createElement('span');
            attachPill.className = 'attachment-pill';
            attachPill.textContent = isPdf ? '📎 PDF Circular' : '📎 Timetable';
            header.appendChild(attachPill);
        }

        card.appendChild(header);

        // Title
        const title = document.createElement('div');
        title.className = 'timeline-title';
        title.textContent = item.notice.title;
        card.appendChild(title);

        // Excerpt
        const desc = document.createElement('div');
        desc.className = 'timeline-desc';
        desc.textContent = item.notice.content;
        card.appendChild(desc);

        // Footer with priority tag and action buttons
        const footer = document.createElement('div');
        footer.className = 'timeline-footer';

        const prioSpan = document.createElement('span');
        const prio = (item.notice.priority || 'medium').toLowerCase();
        prioSpan.className = `notice-priority priority-${prio}`;
        prioSpan.textContent = (item.notice.priority || 'medium').toUpperCase();
        footer.appendChild(prioSpan);

        const actions = document.createElement('div');
        actions.className = 'timeline-actions';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-timeline-action';
        viewBtn.textContent = '👁️ Details';
        viewBtn.setAttribute('aria-label', 'View details');
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewNotice(item.notice.id);
        });
        actions.appendChild(viewBtn);

        const remindBtn = document.createElement('button');
        remindBtn.className = 'btn-timeline-action';
        remindBtn.textContent = '⏰ Remind';
        remindBtn.setAttribute('aria-label', 'Remind me');
        remindBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addReminder(item.notice.id);
        });
        actions.appendChild(remindBtn);

        if (appState.isAdmin) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-timeline-action';
            editBtn.textContent = '✏️ Edit';
            editBtn.setAttribute('aria-label', 'Edit notice');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditNotice(item.notice.id);
            });
            actions.appendChild(editBtn);
        }

        footer.appendChild(actions);
        card.appendChild(footer);

        fragment.appendChild(card);
    });

    timeline.appendChild(fragment);
}

function submitNotice() {
    if (!appState.isAdmin) {
        showToast('Unauthorized: Only admins can manage notices');
        return;
    }

    const noticeIdInput = document.getElementById('noticeId');
    const titleInput = document.getElementById('noticeTitle');
    const contentInput = document.getElementById('noticeContent');
    const deadlineInput = document.getElementById('noticeDeadline');
    const priorityInput = document.getElementById('noticePriority');

    const editId = noticeIdInput && noticeIdInput.value ? Number(noticeIdInput.value) : null;
    const title = titleInput ? titleInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';
    const deadline = deadlineInput ? deadlineInput.value : '';
    const priority = priorityInput ? priorityInput.value : 'medium';

    if (!title || !content) {
        showToast('Please fill in both title and content');
        return;
    }

    if (editId) {
        // UPDATE existing notice
        const index = appState.notices.findIndex(n => n.id === editId);
        if (index === -1) {
            showToast('Notice to update was not found');
            return;
        }

        appState.notices[index].title = title;
        appState.notices[index].content = content;
        appState.notices[index].deadline = deadline || null;
        appState.notices[index].priority = priority;
        appState.notices[index].attachment = currentAdminAttachment || null;

        saveNotices();
        currentAdminAttachment = null;
        showToast('Notice updated successfully!');
        goHome();
    } else {
        // CREATE new notice
        const maxId = appState.notices.reduce((max, n) => Math.max(max, Number(n.id) || 0), 0);
        const authorName = appState.user && appState.user.username ? appState.user.username : 'Admin';

        const newNotice = {
            id: maxId + 1,
            title,
            content,
            date: new Date().toISOString().split('T')[0],
            deadline: deadline || null,
            priority,
            author: authorName,
            attachment: currentAdminAttachment || null
        };

        appState.notices.unshift(newNotice);
        saveNotices();
        currentAdminAttachment = null;

        showToast('Notice posted successfully!');
        sendNotification(title);
        goHome();
    }
}

function deleteNotice(id) {
    if (!appState.isAdmin) {
        showToast('Only admins can delete notices');
        return;
    }

    const notice = appState.notices.find(n => n.id === Number(id));
    const noticeTitle = notice ? `"${notice.title}"` : 'this notice';

    if (confirm(`Are you sure you want to delete ${noticeTitle}?`)) {
        appState.notices = appState.notices.filter(n => n.id !== Number(id));
        saveNotices();
        showToast('Notice deleted successfully');
        goHome();
    }
}

function shareNotice(id) {
    const notice = appState.notices.find(n => n.id === Number(id));
    if (!notice) return;

    if (navigator.share) {
        navigator.share({
            title: notice.title,
            text: `${notice.title}\n${notice.content}`,
            url: window.location.href
        }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`${notice.title}\n\n${notice.content}`)
            .then(() => showToast('Notice copied to clipboard!'))
            .catch(() => showToast('Failed to copy notice'));
    } else {
        showToast('Notice shared!');
    }
}

// ===== CALENDAR & REMINDER SYNC (.ics & GOOGLE CALENDAR) =====
function openReminderModal(id) {
    const notice = appState.notices.find(n => n.id === Number(id));
    if (!notice) return;

    appState.activeReminderNoticeId = notice.id;

    const modal = document.getElementById('reminderModal');
    const modalTitle = document.getElementById('reminderModalTitle');
    const modalDate = document.getElementById('reminderModalDate');

    if (modalTitle) {
        modalTitle.textContent = notice.title;
    }

    if (modalDate) {
        if (notice.deadline) {
            modalDate.textContent = `⏰ Deadline: ${notice.deadline}`;
            modalDate.style.color = 'var(--urgency-urgent)';
        } else {
            modalDate.textContent = `📅 Notice Date: ${notice.date}`;
            modalDate.style.color = 'var(--text-light)';
        }
    }

    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeReminderModal(event) {
    if (event && event.target && event.target.id !== 'reminderModal' && !event.target.classList.contains('modal-close-btn') && !event.target.classList.contains('btn-modal-cancel')) {
        return;
    }
    const modal = document.getElementById('reminderModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function getGoogleCalendarUrl(notice) {
    const title = `[Notice Deadline] ${notice.title}`;
    const desc = `${notice.content}\n\nIssued by: ${notice.author || 'Laxman Devram Sonawane College'}\nDigital Notice Board - University of Mumbai (FYCS)`;
    const location = 'Laxman Devram Sonawane College, Kalyan (W)';

    const dateStr = notice.deadline || notice.date || new Date().toISOString().split('T')[0];
    const parts = dateStr.split('-');
    const startYear = parseInt(parts[0], 10);
    const startMonth = parseInt(parts[1], 10);
    const startDay = parseInt(parts[2], 10);

    const pad = n => String(n).padStart(2, '0');
    const dtStart = `${startYear}${pad(startMonth)}${pad(startDay)}`;

    const nextDate = new Date(startYear, startMonth - 1, startDay + 1);
    const dtEnd = `${nextDate.getFullYear()}${pad(nextDate.getMonth() + 1)}${pad(nextDate.getDate())}`;

    const dates = `${dtStart}/${dtEnd}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}&dates=${dates}`;
}

function addToGoogleCalendar() {
    if (!appState.activeReminderNoticeId) return;
    const notice = appState.notices.find(n => n.id === appState.activeReminderNoticeId);
    if (!notice) return;

    const url = getGoogleCalendarUrl(notice);
    window.open(url, '_blank');
    closeReminderModal();
    showToast('Opening Google Calendar...');
}

function generateIcsContent(notice) {
    const title = (notice.title || 'Notice Deadline').replace(/[,;]/g, ' ');
    const desc = (notice.content || '').replace(/\r?\n/g, '\\n').replace(/[,;]/g, ' ');
    const author = notice.author || 'Laxman Devram Sonawane College';

    const dateStr = notice.deadline || notice.date || new Date().toISOString().split('T')[0];
    const parts = dateStr.split('-');
    const startYear = parseInt(parts[0], 10);
    const startMonth = parseInt(parts[1], 10);
    const startDay = parseInt(parts[2], 10);

    const pad = n => String(n).padStart(2, '0');
    const dtStart = `${startYear}${pad(startMonth)}${pad(startDay)}`;

    const nextDate = new Date(startYear, startMonth - 1, startDay + 1);
    const dtEnd = `${nextDate.getFullYear()}${pad(nextDate.getMonth() + 1)}${pad(nextDate.getDate())}`;

    const now = new Date();
    const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
    const uid = `dnb-${notice.id}-${Date.now()}@digital-notice-board.college`;

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Digital Notice Board//University of Mumbai FYCS//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:[Notice Deadline] ${title}`,
        `DESCRIPTION:${desc}\\n\\nIssued by: ${author}\\nDigital Notice Board - LD Sonawane College`,
        'LOCATION:Laxman Devram Sonawane College, Kalyan (W)',
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:Deadline Reminder: ${title}`,
        'TRIGGER:-P1D',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}

function downloadIcsFile() {
    if (!appState.activeReminderNoticeId) return;
    const notice = appState.notices.find(n => n.id === appState.activeReminderNoticeId);
    if (!notice) return;

    try {
        const icsData = generateIcsContent(notice);
        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `deadline-notice-${notice.id}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        closeReminderModal();
        showToast('Downloaded .ics! Open to add to calendar.');
    } catch (e) {
        console.error('Error generating .ics:', e);
        showToast('Failed to generate calendar file');
    }
}

function addReminder(id) {
    openReminderModal(id);
}

// ===== NOTIFICATIONS =====
function toggleNotifications() {
    appState.notificationsEnabled = !appState.notificationsEnabled;
    saveState();
    updateNotifToggle();

    if (appState.notificationsEnabled && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notifications enabled');
            } else {
                showToast('Notification permission denied by browser');
            }
        });
    } else {
        showToast(appState.notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled');
    }
}

function updateNotifToggle() {
    const toggle = document.getElementById('notifToggle');
    if (!toggle) return;
    if (appState.notificationsEnabled) {
        toggle.classList.add('on');
    } else {
        toggle.classList.remove('on');
    }
}

function updateNotifTime() {
    const timeSelect = document.getElementById('notifTime');
    if (!timeSelect) return;
    appState.notificationsTime = timeSelect.value;
    saveState();
    showToast('Notification time updated');
}

function sendNotification(title) {
    if (!appState.notificationsEnabled || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        try {
            new Notification('Digital Notice Board', {
                body: title,
                icon: './icon-192.svg'
            });
        } catch (e) {
            console.log('Notification trigger:', e);
        }
    }
}

// ===== PWA INSTALLATION & SERVICE WORKER =====
let deferredInstallPrompt = null;

function registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        const performRegistration = () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully with scope:', registration.scope);
                    registration.update().catch(() => {});
                })
                .catch(err => {
                    console.warn('Service Worker registration skipped or failed:', err);
                });
        };

        if (document.readyState === 'complete') {
            performRegistration();
        } else {
            window.addEventListener('load', performRegistration);
        }
    }
}

function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;

        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'flex';
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        showToast('App installed successfully!');
    });
}

function promptInstallApp() {
    if (!deferredInstallPrompt) {
        showToast('App is already installed or browser installation not triggered yet.');
        return;
    }

    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredInstallPrompt = null;
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    });
}

// ===== PULL TO REFRESH =====
function setupPullToRefresh() {
    let startY = 0;
    let canPull = false;

    document.addEventListener('touchstart', (e) => {
        const homeScreen = document.getElementById('homeScreen');
        const list = document.getElementById('noticeList');
        const isHomeActive = homeScreen && homeScreen.classList.contains('active');

        // Strictly verify window.scrollY === 0 and container is at top
        const isWindowAtTop = (window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0) === 0;
        const isListAtTop = (!list || list.scrollTop <= 0) && (!homeScreen || homeScreen.scrollTop <= 0);

        if (isHomeActive && isWindowAtTop && isListAtTop && e.touches.length === 1) {
            startY = e.touches[0].clientY;
            canPull = true;
        } else {
            canPull = false;
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!canPull) return;
        canPull = false;

        const homeScreen = document.getElementById('homeScreen');
        if (!homeScreen || !homeScreen.classList.contains('active')) return;

        // Strictly verify window.scrollY is still 0 at end of gesture
        const currentWindowScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        if (currentWindowScrollY !== 0) return;

        const touchEndY = e.changedTouches[0].clientY;
        const pullDistance = touchEndY - startY;

        if (pullDistance > 80) {
            loadNotices();
            clearSearch();
            showToast('Refreshed notice feed');
        }
    }, { passive: true });
}

// Start application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
