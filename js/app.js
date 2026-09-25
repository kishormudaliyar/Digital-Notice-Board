/**
 * Digital Notice Board - Enterprise Application Script
 * Theme: Minimal, Clean, Professional (Dark Navy #1a3a52, Accent Teal #00acc1)
 * Standard: 100% Vanilla ES6+, Strict DOM manipulation, Zero emojis
 */

// ===== APP STATE =====
let appState = {
    user: null,
    isAdmin: false,
    facultyPasscode: 'LDS-FACULTY-2026',
    registeredUsers: [],
    notificationsEnabled: true,
    notificationsTime: 'morning',
    currentView: 'feed', // 'feed' | 'deadlines'
    activeCategory: 'All', // 'All' | 'Academic' | 'Events' | 'Deadlines' | 'Admin'
    activeSettingsTab: 'notifications', // 'notifications' | 'preferences' | 'about'
    activeReminderNoticeId: null,
    savedNotices: [], // Array of bookmarked notice IDs
    archivedNotices: [], // Array of archived notice IDs
    deadlineColors: {
        urgent: '#E53935',   // < 48 hours (Urgent)
        upcoming: '#F57C00', // 2-7 days (Soon)
        later: '#546E7A'     // > 7 days (Later)
    },
    // DUAL NOTIFICATION SYSTEM
    notificationSettings: {
        instantAlertsEnabled: true,
        instantAlertsScope: 'high_only', // 'high_only' | 'all'
        dailyDigestEnabled: true,
        dailyDigestTime: 'morning', // 'morning' | 'afternoon' | 'evening'
        categories: ['Academic', 'Events', 'Deadlines', 'Admin']
    },
    notificationLogs: [], // Audit log: [{ id, timestamp, type, noticeId, title, user, details }]
    alertedNoticeIds: [], // Tracked IDs to prevent duplicate instant alerts
    digestedNoticeIds: [], // Tracked IDs to prevent duplicate digest inclusions
    lastDigestCheckDate: null,
    notices: []
};

// Current attachment in admin form
let currentAdminAttachment = null;

// PWA deferred install prompt
let deferredPrompt = null;

// Pull to refresh tracking
let touchStartY = 0;
let touchEndY = 0;

// Real-time banner timer & active notice tracking
let currentBannerNoticeId = null;
let bannerTimer = null;

// ===== SAMPLE DATA =====
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
            category: 'Academic',
            content: 'All candidates appearing for the semester examinations must collect their stamped hall tickets from Room 204. Ensure that any remaining semester dues are verified prior to the clearance deadline.\n\nRequired Verification Items:\n- College Identity Card\n- Fee Payment Acknowledgment Slip\n- Two passport size photographs',
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
            title: 'Government Scholarship Application Verification',
            category: 'Admin',
            content: 'Eligible reserved category and merit-cum-means scholarship applicants must submit their hard copies of domicile certificates, income declarations, and caste validity documents at Administrative Counter 3.\n\nIncomplete applications will be disqualified by the Social Welfare Department.',
            date: formatDate(-1),
            deadline: formatDate(4), // < 7 days -> UPCOMING
            priority: 'high',
            author: 'Financial Aid Office'
        },
        {
            id: 3,
            title: 'Final Year Project Documentation & External Viva',
            category: 'Academic',
            content: 'Submission of the project synopsis, GitHub repository links, and IEEE formatted project reports for the semester external examination.\n\nViva Voce will be conducted in Computer Science Laboratories 1 and 2 by University appointed examiners.',
            date: formatDate(-2),
            deadline: formatDate(14), // > 7 days -> LATER
            priority: 'medium',
            author: 'Computer Science Dept',
            attachment: {
                name: 'FYCS_Project_Viva_Schedule_Timetable.png',
                type: 'image/svg+xml',
                size: 18432,
                data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="50" rx="6" fill="%231a3a52"/><text x="300" y="52" fill="white" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">FYCS Project Viva Schedule 2026</text><rect x="20" y="85" width="560" height="235" rx="6" fill="white" stroke="%23e2e8f0"/><text x="40" y="125" fill="%230f172a" font-family="sans-serif" font-size="13" font-weight="bold">Batch 1 (Roll 101 - 130): 09:30 AM - Lab 1</text><text x="40" y="165" fill="%230f172a" font-family="sans-serif" font-size="13" font-weight="bold">Batch 2 (Roll 131 - 160): 11:30 AM - Lab 1</text><text x="40" y="205" fill="%230f172a" font-family="sans-serif" font-size="13" font-weight="bold">Batch 3 (Roll 161 - 190): 01:30 PM - Lab 2</text><text x="40" y="250" fill="%2364748b" font-family="sans-serif" font-size="12">Requirements: Spiral-bound report, GitHub repository link, College ID</text><text x="40" y="290" fill="%2300acc1" font-family="sans-serif" font-size="12" font-weight="bold">University of Mumbai Appointed External Examiners</text></svg>'
            }
        },
        {
            id: 4,
            title: 'Annual Tech Symposium: Hack-Sonawane 2026',
            category: 'Events',
            content: 'Registrations are now open for the 24-hour inter-collegiate coding hackathon. Themes include AI for Social Good, Urban Transportation, and Cyber Resilience.\n\nCash prizes, mentorship sessions, and industry internships for winning teams.',
            date: formatDate(-3),
            deadline: formatDate(6),
            priority: 'medium',
            author: 'Student Council'
        },
        {
            id: 5,
            title: 'Central Library Overdue Clearance Drive',
            category: 'Admin',
            content: 'Return overdue books without fine penalty during the ongoing clearance week before semester examination hall ticket distribution.',
            date: formatDate(-5),
            deadline: formatDate(-1), // Past -> EXPIRED
            priority: 'low',
            author: 'Central Library'
        },
        {
            id: 6,
            title: 'Campus IT Network Maintenance & Wi-Fi Upgrades',
            category: 'Admin',
            content: 'The campus IT department will be upgrading core switches and campus Wi-Fi access points this Saturday between 11:00 AM and 03:00 PM. Periodic downtime may occur.',
            date: formatDate(-4),
            deadline: null,
            priority: 'low',
            author: 'IT Operations'
        }
    ];
}

// ===== SVG ICONS HELPERS (Zero Emojis) =====
const SVG_ICONS = {
    calendar: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    clock: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    user: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    paperclip: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`,
    share: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
    archive: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>`,
    edit: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    download: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    check: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    eye: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    arrowRight: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`
};

// ===== UTILITIES =====
function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
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
        showToast(`Downloading ${attachment.name || 'document'}`);
    } catch (e) {
        const a = document.createElement('a');
        a.href = attachment.data;
        a.download = attachment.name || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Downloading ${attachment.name || 'document'}`);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    if (!toast) return;

    if (toastMsg) {
        toastMsg.textContent = message;
    } else {
        toast.textContent = message;
    }

    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
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
    setupOutsideClicks();
    initFirebase();

    // Check login state
    if (appState.user) {
        showScreen('homeScreen', false);
        if (window.history && window.history.replaceState) {
            window.history.replaceState({ screen: 'homeScreen' }, '', '#homeScreen');
        }
        updateAdminControls();
        switchView(appState.currentView || 'feed');
        checkScheduledDailyDigest();
        if (appState.isAdmin) {
            seedFirestoreIfEmpty();
        }
    } else {
        closeDigestModal();
        dismissAlertBanner();
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
                },
                notificationSettings: {
                    ...appState.notificationSettings,
                    ...(parsed.notificationSettings || {})
                }
            };
        }
        appState.savedNotices = JSON.parse(localStorage.getItem('savedNotices') || '[]');
        appState.archivedNotices = JSON.parse(localStorage.getItem('archivedNotices') || '[]');
        appState.notificationLogs = JSON.parse(localStorage.getItem('notificationLogs') || '[]');
        appState.alertedNoticeIds = JSON.parse(localStorage.getItem('alertedNoticeIds') || '[]');
        appState.digestedNoticeIds = JSON.parse(localStorage.getItem('digestedNoticeIds') || '[]');
        appState.facultyPasscode = localStorage.getItem('facultyPasscode') || 'LDS-FACULTY-2026';
        appState.registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    } catch (e) {
        console.error('Failed to parse state:', e);
    }
}

function saveState() {
    try {
        localStorage.setItem('appState', JSON.stringify({
            user: appState.user,
            isAdmin: appState.isAdmin,
            notificationsEnabled: appState.notificationsEnabled,
            notificationsTime: appState.notificationSettings ? appState.notificationSettings.dailyDigestTime : 'morning',
            currentView: appState.currentView,
            deadlineColors: appState.deadlineColors,
            notificationSettings: appState.notificationSettings,
            lastDigestCheckDate: appState.lastDigestCheckDate
        }));
        localStorage.setItem('savedNotices', JSON.stringify(appState.savedNotices));
        localStorage.setItem('archivedNotices', JSON.stringify(appState.archivedNotices));
        localStorage.setItem('notificationLogs', JSON.stringify(appState.notificationLogs || []));
        localStorage.setItem('alertedNoticeIds', JSON.stringify(appState.alertedNoticeIds || []));
        localStorage.setItem('digestedNoticeIds', JSON.stringify(appState.digestedNoticeIds || []));
        localStorage.setItem('facultyPasscode', appState.facultyPasscode || 'LDS-FACULTY-2026');
        localStorage.setItem('registeredUsers', JSON.stringify(appState.registeredUsers || []));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

function loadNotices() {
    try {
        const saved = localStorage.getItem('notices');
        let notices = saved ? JSON.parse(saved) : getSampleNotices();

        // Ensure category and sample attachments exist
        if (Array.isArray(notices)) {
            const samples = getSampleNotices();
            notices = notices.map(n => {
                if (!n.category) {
                    if (n.deadline) n.category = 'Deadlines';
                    else if (n.priority === 'high') n.category = 'Academic';
                    else n.category = 'Admin';
                }
                const sampleMatch = samples.find(s => s.id === n.id);
                if (sampleMatch && sampleMatch.attachment && !n.attachment) {
                    n.attachment = sampleMatch.attachment;
                }
                return n;
            });
            localStorage.setItem('notices', JSON.stringify(notices));
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

// ===== URGENCY COLORS =====
function hexToRgba(hex, alpha = 0.08) {
    if (!hex || hex[0] !== '#') return `rgba(0,0,0,${alpha})`;
    let c = hex.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyUrgencyColors() {
    const colors = appState.deadlineColors || {
        urgent: '#E53935',
        upcoming: '#F57C00',
        later: '#546E7A'
    };

    const root = document.documentElement;
    root.style.setProperty('--urgency-urgent', colors.urgent);
    root.style.setProperty('--urgency-urgent-bg', hexToRgba(colors.urgent, 0.08));
    root.style.setProperty('--urgency-upcoming', colors.upcoming);
    root.style.setProperty('--urgency-upcoming-bg', hexToRgba(colors.upcoming, 0.08));
    root.style.setProperty('--urgency-later', colors.later);
    root.style.setProperty('--urgency-later-bg', hexToRgba(colors.later, 0.08));

    // Hybrid priority variables
    root.style.setProperty('--priority-urgent', colors.urgent);
    root.style.setProperty('--priority-soon', colors.upcoming);
    root.style.setProperty('--priority-later', colors.later);

    const inputUrgent = document.getElementById('urgencyColorUrgent');
    const inputUpcoming = document.getElementById('urgencyColorUpcoming');
    const inputLater = document.getElementById('urgencyColorLater');

    if (inputUrgent) inputUrgent.value = colors.urgent;
    if (inputUpcoming) inputUpcoming.value = colors.upcoming;
    if (inputLater) inputLater.value = colors.later;
}

function updateUrgencyColor(tier, hexValue) {
    if (!appState.deadlineColors) {
        appState.deadlineColors = { urgent: '#E53935', upcoming: '#F57C00', later: '#546E7A' };
    }
    appState.deadlineColors[tier] = hexValue;
    saveState();
    applyUrgencyColors();

    renderNotices();
    if (appState.currentView === 'deadlines') {
        renderDeadlines();
    }
    showToast(`Updated ${tier} color`);
}

function resetUrgencyColors() {
    appState.deadlineColors = {
        urgent: '#E53935',
        upcoming: '#F57C00',
        later: '#546E7A'
    };
    saveState();
    applyUrgencyColors();

    renderNotices();
    if (appState.currentView === 'deadlines') {
        renderDeadlines();
    }
    showToast('Reset urgency colors to default');
}

// ===== HYBRID PRIORITY & URGENCY MAPPING =====
function getNoticeUrgencyInfo(notice) {
    if (!notice || !notice.deadline) {
        return {
            tier: 'general',
            color: '#2e7d32', // Matches existing green card style
            pillText: 'No deadline',
            diffDays: null
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = String(notice.deadline).split('T')[0].split('-').map(Number);
    const deadlineDate = new Date(parts[0], parts[1] - 1, parts[2]);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const colors = appState.deadlineColors || {
        urgent: '#E53935',
        upcoming: '#F57C00',
        later: '#546E7A'
    };

    if (diffDays < 0) {
        return {
            tier: 'expired',
            color: colors.later || '#546E7A',
            pillText: 'Deadline passed',
            diffDays
        };
    } else if (diffDays === 0) {
        return {
            tier: 'urgent',
            color: colors.urgent || '#E53935',
            pillText: 'Due today',
            diffDays
        };
    } else if (diffDays === 1) {
        return {
            tier: 'urgent',
            color: colors.urgent || '#E53935',
            pillText: 'Due in 1 day',
            diffDays
        };
    } else if (diffDays <= 2) {
        return {
            tier: 'urgent',
            color: colors.urgent || '#E53935',
            pillText: `Due in ${diffDays} days`,
            diffDays
        };
    } else if (diffDays <= 7) {
        return {
            tier: 'soon',
            color: colors.upcoming || '#F57C00',
            pillText: `Due in ${diffDays} days`,
            diffDays
        };
    } else {
        return {
            tier: 'later',
            color: colors.later || '#546E7A',
            pillText: `Due in ${diffDays} days`,
            diffDays
        };
    }
}

// ===== AUTHENTICATION & INSTITUTIONAL ACCESS CONTROL =====

function switchAuthTab(tab) {
    const loginBtn = document.getElementById('authTabLoginBtn');
    const signupBtn = document.getElementById('authTabSignupBtn');
    const loginForm = document.getElementById('authLoginForm');
    const signupForm = document.getElementById('authSignupForm');

    if (tab === 'login') {
        if (loginBtn) loginBtn.classList.add('active');
        if (signupBtn) signupBtn.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (signupForm) signupForm.style.display = 'none';
    } else {
        if (signupBtn) signupBtn.classList.add('active');
        if (loginBtn) loginBtn.classList.remove('active');
        if (signupForm) signupForm.style.display = 'block';
        if (loginForm) loginForm.style.display = 'none';
    }
}

function selectRegisterRole(role) {
    const roleInput = document.getElementById('registerRoleInput');
    const roleBtnStudent = document.getElementById('roleBtnStudent');
    const roleBtnFaculty = document.getElementById('roleBtnFaculty');
    const facultyCodeGroup = document.getElementById('facultyCodeGroup');
    const facultyCodeInput = document.getElementById('registerFacultyCodeInput');

    if (roleInput) roleInput.value = role;

    if (role === 'faculty') {
        if (roleBtnFaculty) roleBtnFaculty.classList.add('active');
        if (roleBtnStudent) roleBtnStudent.classList.remove('active');
        if (facultyCodeGroup) facultyCodeGroup.style.display = 'block';
        if (facultyCodeInput) facultyCodeInput.required = true;
    } else {
        if (roleBtnStudent) roleBtnStudent.classList.add('active');
        if (roleBtnFaculty) roleBtnFaculty.classList.remove('active');
        if (facultyCodeGroup) facultyCodeGroup.style.display = 'none';
        if (facultyCodeInput) {
            facultyCodeInput.required = false;
            facultyCodeInput.value = '';
        }
    }
}

async function handleRegister() {
    const roleInput = document.getElementById('registerRoleInput');
    const nameInput = document.getElementById('registerNameInput');
    const deptInput = document.getElementById('registerDeptInput');
    const emailInput = document.getElementById('registerEmailInput');
    const passwordInput = document.getElementById('registerPasswordInput');
    const facultyCodeInput = document.getElementById('registerFacultyCodeInput');

    const role = roleInput ? roleInput.value : 'student';
    const name = nameInput ? nameInput.value.trim() : '';
    const dept = deptInput ? deptInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';
    const facultyCode = facultyCodeInput ? facultyCodeInput.value.trim() : '';

    if (!name || !email || !password) {
        showToast('Please fill in all required fields');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters');
        return;
    }

    // Role Verification: Faculty security passcode check
    const activePasscode = appState.facultyPasscode || 'LDS-FACULTY-2026';
    if (role === 'faculty') {
        if (!facultyCode) {
            showToast('Faculty Security Passcode is required for Staff registration');
            return;
        }
        if (facultyCode !== activePasscode) {
            showToast('Invalid Faculty Security Passcode! Contact HOD or Admin.');
            return;
        }
    }

    const isAdmin = (role === 'faculty');

    // 1. Firebase Authentication & Firestore Registration
    if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured() && typeof fbAuth !== 'undefined' && fbAuth) {
        try {
            showToast('Registering with Firebase...');
            const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await user.updateProfile({ displayName: name });

            if (typeof fbDb !== 'undefined' && fbDb) {
                await fbDb.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: name,
                    department: dept,
                    email: email,
                    role: isAdmin ? 'admin' : 'student',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            appState.user = {
                uid: user.uid,
                username: name,
                email: email,
                role: isAdmin ? 'admin' : 'student',
                department: dept
            };
            appState.isAdmin = isAdmin;
            saveState();

            updateAdminControls();
            updateSecurityPasscodeDisplay();
            showScreen('homeScreen', true);
            switchView(appState.currentView || 'feed');
            checkScheduledDailyDigest();
            if (isAdmin) {
                seedFirestoreIfEmpty();
            }
            showToast(`Welcome ${name}! Registered as ${isAdmin ? 'Faculty / Staff' : 'Student'}`);
            return;
        } catch (error) {
            console.error('[Firebase Registration Error]', error);
            showToast(error.message || 'Registration failed with Firebase');
            return;
        }
    }

    // 2. Offline / Local Storage Registration Fallback
    const existing = (appState.registeredUsers || []).find(u => u.email === email);
    if (existing) {
        showToast('An account with this email already exists');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        department: dept,
        email,
        password,
        role: isAdmin ? 'admin' : 'student'
    };

    appState.registeredUsers = appState.registeredUsers || [];
    appState.registeredUsers.push(newUser);

    appState.user = {
        username: name,
        email: email,
        role: newUser.role,
        department: dept
    };
    appState.isAdmin = isAdmin;
    saveState();

    updateAdminControls();
    updateSecurityPasscodeDisplay();
    showScreen('homeScreen', true);
    switchView(appState.currentView || 'feed');
    checkScheduledDailyDigest();
    if (isAdmin) {
        seedFirestoreIfEmpty();
    }
    showToast(`Account created! Signed in as ${isAdmin ? 'Faculty (Admin)' : 'Student'}`);
}

async function handleLogin() {
    const emailInput = document.getElementById('loginEmailInput') || document.getElementById('usernameInput');
    const passwordInput = document.getElementById('loginPasswordInput') || document.getElementById('passwordInput');

    const identifier = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!identifier) {
        showToast('Please enter an email or username');
        return;
    }

    const cleanId = identifier.toLowerCase();

    // Quick Demo Mode shortcuts
    if (cleanId === 'student') {
        appState.user = { username: 'Student', email: 'student@college.edu', role: 'student' };
        appState.isAdmin = false;
        saveState();
        updateAdminControls();
        updateSecurityPasscodeDisplay();
        showScreen('homeScreen', true);
        switchView(appState.currentView || 'feed');
        checkScheduledDailyDigest();
        showToast('Signed in as Student (Demo)');
        return;
    }

    if (cleanId === 'admin') {
        appState.user = { username: 'Admin', email: 'admin@college.edu', role: 'admin' };
        appState.isAdmin = true;
        saveState();
        updateAdminControls();
        updateSecurityPasscodeDisplay();
        showScreen('homeScreen', true);
        switchView(appState.currentView || 'feed');
        checkScheduledDailyDigest();
        seedFirestoreIfEmpty();
        showToast('Signed in as Faculty Admin (Demo)');
        return;
    }

    if (!password) {
        showToast('Please enter your password');
        return;
    }

    // 1. Firebase Authentication Login
    if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured() && typeof fbAuth !== 'undefined' && fbAuth) {
        try {
            showToast('Authenticating with Firebase...');
            const userCredential = await fbAuth.signInWithEmailAndPassword(identifier, password);
            const user = userCredential.user;

            let userData = { role: 'student' };
            if (typeof fbDb !== 'undefined' && fbDb) {
                const userDoc = await fbDb.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    userData = userDoc.data();
                }
            }

            const isAdmin = (userData.role === 'admin' || userData.role === 'faculty');
            appState.user = {
                uid: user.uid,
                username: userData.name || user.displayName || user.email.split('@')[0],
                email: user.email,
                role: isAdmin ? 'admin' : 'student',
                department: userData.department || ''
            };
            appState.isAdmin = isAdmin;
            saveState();

            updateAdminControls();
            updateSecurityPasscodeDisplay();
            showScreen('homeScreen', true);
            switchView(appState.currentView || 'feed');
            checkScheduledDailyDigest();
            if (isAdmin) {
                seedFirestoreIfEmpty();
            }
            showToast(`Welcome back, ${appState.user.username}!`);
            return;
        } catch (error) {
            console.error('[Firebase Signin Error]', error);
            showToast(error.message || 'Firebase sign in failed');
            return;
        }
    }

    // 2. Offline / Local Storage User Lookup
    const matchedUser = (appState.registeredUsers || []).find(u =>
        (u.email === cleanId || (u.name && u.name.toLowerCase() === cleanId)) && u.password === password
    );

    if (matchedUser) {
        const isAdmin = matchedUser.role === 'admin' || matchedUser.role === 'faculty';
        appState.user = {
            username: matchedUser.name || matchedUser.email.split('@')[0],
            email: matchedUser.email,
            role: isAdmin ? 'admin' : 'student',
            department: matchedUser.department || ''
        };
        appState.isAdmin = isAdmin;
        saveState();

        updateAdminControls();
        updateSecurityPasscodeDisplay();
        showScreen('homeScreen', true);
        switchView(appState.currentView || 'feed');
        checkScheduledDailyDigest();
        if (isAdmin) {
            seedFirestoreIfEmpty();
        }
        showToast(`Signed in as ${appState.user.username}`);
        return;
    }

    showToast('Invalid credentials. Use demo "student" / "admin" or register an account.');
}

function login() {
    handleLogin();
}

function logout() {
    closeDigestModal();
    dismissAlertBanner();

    if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured() && typeof fbAuth !== 'undefined' && fbAuth) {
        fbAuth.signOut().catch(err => console.warn('[Firebase Signout]', err));
    }

    appState.user = null;
    appState.isAdmin = false;
    saveState();

    updateAdminControls();
    updateSecurityPasscodeDisplay();

    const loginEmailInput = document.getElementById('loginEmailInput');
    const loginPasswordInput = document.getElementById('loginPasswordInput');
    if (loginEmailInput) loginEmailInput.value = 'student';
    if (loginPasswordInput) loginPasswordInput.value = '';

    switchAuthTab('login');
    showScreen('loginScreen', true);
    showToast('Signed out successfully');
}

function updateAdminControls() {
    const topAddBtn = document.getElementById('topAddNoticeBtn');
    const fab = document.getElementById('fab');

    if (appState.isAdmin) {
        if (topAddBtn) topAddBtn.classList.remove('hidden');
        if (fab) fab.classList.remove('hidden');
    } else {
        if (topAddBtn) topAddBtn.classList.add('hidden');
        if (fab) fab.classList.add('hidden');
    }
}

// ===== INSTITUTIONAL SECURITY & PASSCODE MANAGEMENT =====
function updateSecurityPasscodeDisplay() {
    const adminSecurityCard = document.getElementById('adminSecurityCard');
    const displaySpan = document.getElementById('currentFacultyCodeDisplay');

    if (adminSecurityCard) {
        adminSecurityCard.style.display = appState.isAdmin ? 'block' : 'none';
    }

    if (displaySpan) {
        displaySpan.textContent = `Active: ${appState.facultyPasscode || 'LDS-FACULTY-2026'}`;
    }
}

async function updateFacultyPasscode() {
    if (!appState.isAdmin) {
        showToast('Only administrators can update the faculty passcode');
        return;
    }

    const input = document.getElementById('newFacultyPasscodeInput');
    const newCode = input ? input.value.trim() : '';

    if (!newCode || newCode.length < 6) {
        showToast('Passcode must be at least 6 characters long');
        return;
    }

    appState.facultyPasscode = newCode;
    saveState();

    // Sync to Firestore if configured
    if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured() && typeof fbDb !== 'undefined' && fbDb) {
        try {
            await fbDb.collection('system').doc('config').set({
                facultyPasscode: newCode,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: appState.user ? appState.user.username : 'admin'
            }, { merge: true });
        } catch (err) {
            console.warn('[Firestore Passcode Sync Error]', err);
        }
    }

    updateSecurityPasscodeDisplay();
    if (input) input.value = '';
    showToast(`Faculty passcode successfully updated to "${newCode}"`);
}

// ===== FIREBASE FIRESTORE SEEDING & SYNC =====
async function seedFirestoreIfEmpty() {
    if (!appState.isAdmin || typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured() || typeof fbDb === 'undefined' || !fbDb) return;
    try {
        const snap = await fbDb.collection('notices').limit(1).get();
        if (snap.empty) {
            console.log('[Firebase] Cloud Firestore is empty. Seeding official sample notices...');
            const sample = getSampleNotices();
            for (const n of sample) {
                await fbDb.collection('notices').doc(String(n.id)).set(n);
            }
            console.log('[Firebase] Successfully seeded sample notices to Cloud Firestore.');
        }
    } catch (err) {
        console.warn('[Firebase Seed Notice Warning]', err.message);
    }
}

function resetDemoNoticeData() {
    localStorage.removeItem('notices');
    localStorage.removeItem('digestedNoticeIds');
    localStorage.removeItem('alertedNoticeIds');
    appState.digestedNoticeIds = [];
    appState.alertedNoticeIds = [];
    loadNotices();
    showToast('Reset local notices to official sample data');
}

// ===== FIREBASE REAL-TIME SUBSCRIPTION & SYNC =====
function initFirebase() {
    if (typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured()) {
        console.log('[NoticeBoard] Running in local offline mode (Firebase keys not yet configured).');
        return;
    }

    // 1. Sync remote institutional config (Faculty Passcode)
    if (typeof fbDb !== 'undefined' && fbDb) {
        fbDb.collection('system').doc('config').onSnapshot((doc) => {
            if (doc.exists && doc.data().facultyPasscode) {
                appState.facultyPasscode = doc.data().facultyPasscode;
                saveState();
                updateSecurityPasscodeDisplay();
            }
        }, (err) => {
            console.warn('[Firebase Config Sync]', err.message);
        });

        // 2. Real-time notices collection sync
        fbDb.collection('notices').orderBy('id', 'desc').onSnapshot((snapshot) => {
            if (!snapshot.empty) {
                const cloudNotices = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    cloudNotices.push({ ...data, firestoreId: doc.id });
                });
                if (cloudNotices.length > 0) {
                    appState.notices = cloudNotices;
                    saveNotices();
                    renderNotices();
                    if (appState.currentView === 'deadlines') {
                        renderDeadlines();
                    }
                }
            }
        }, (err) => {
            console.warn('[Firebase Notices Sync]', err.message);
        });
    }

    // 3. Auth State Observer
    if (typeof fbAuth !== 'undefined' && fbAuth) {
        fbAuth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    let role = 'student';
                    let dept = '';
                    if (fbDb) {
                        const userDoc = await fbDb.collection('users').doc(firebaseUser.uid).get();
                        if (userDoc.exists) {
                            const data = userDoc.data();
                            role = data.role || 'student';
                            dept = data.department || '';
                        }
                    }
                    const isAdmin = (role === 'admin' || role === 'faculty');
                    appState.user = {
                        uid: firebaseUser.uid,
                        username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                        email: firebaseUser.email,
                        role: isAdmin ? 'admin' : 'student',
                        department: dept
                    };
                    appState.isAdmin = isAdmin;
                    saveState();
                    updateAdminControls();
                    updateSecurityPasscodeDisplay();
                } catch (e) {
                    console.warn('[Firebase Auth State]', e);
                }
            }
        });
    }
}

// ===== NAVIGATION & SCREEN ROUTING =====
function showScreen(screenId, pushHistory = true) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        screen.scrollTop = 0;
    }

    if (pushHistory && window.history && window.history.pushState) {
        window.history.pushState({ screen: screenId }, '', `#${screenId}`);
    }
}

function setupRouting() {
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.screen) {
            showScreen(event.state.screen, false);
            if (event.state.screen === 'homeScreen') {
                if (appState.currentView === 'deadlines') {
                    renderDeadlines();
                } else {
                    renderNotices();
                }
            }
        }
    });
}

function goHome() {
    clearSearch();
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

// ===== VIEW SWITCHER (Feed vs Deadlines) =====
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
        if (deadlineTimeline) deadlineTimeline.style.display = 'flex';
        if (searchInput) {
            searchInput.placeholder = 'Search upcoming deadlines...';
        }
        renderDeadlines();
    } else {
        if (feedBtn) feedBtn.classList.add('active');
        if (deadlinesBtn) deadlinesBtn.classList.remove('active');
        if (noticeList) noticeList.style.display = 'flex';
        if (deadlineTimeline) deadlineTimeline.style.display = 'none';
        if (searchInput) {
            searchInput.placeholder = 'Search notices by title, content, or author...';
        }
        renderNotices();
    }
}

// ===== CATEGORY FILTER CHIPS =====
function setCategoryFilter(category) {
    appState.activeCategory = category;

    document.querySelectorAll('.filter-chip').forEach(chip => {
        if (chip.getAttribute('data-category') === category) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });

    filterNotices();
}

// ===== SEARCH & AUTOCOMPLETE =====
function handleSearchInput() {
    const input = document.getElementById('searchInput');
    const query = input ? input.value.trim() : '';
    const clearBtn = document.getElementById('searchClearBtn');

    if (clearBtn) {
        if (query.length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }

    renderAutocompleteSuggestions(query);
    filterNotices();
}

function handleSearchKeydown(event) {
    if (event.key === 'Escape') {
        hideAutocompleteSuggestions();
    }
}

function renderAutocompleteSuggestions(query) {
    const suggestionsBox = document.getElementById('searchSuggestions');
    if (!suggestionsBox) return;

    if (!query || query.length < 1) {
        hideAutocompleteSuggestions();
        return;
    }

    const q = query.toLowerCase();
    const activeNotices = appState.notices.filter(n => !appState.archivedNotices.includes(n.id));
    const matches = activeNotices.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.category && n.category.toLowerCase().includes(q)) ||
        (n.author && n.author.toLowerCase().includes(q))
    ).slice(0, 5);

    if (matches.length === 0) {
        hideAutocompleteSuggestions();
        return;
    }

    while (suggestionsBox.firstChild) {
        suggestionsBox.removeChild(suggestionsBox.firstChild);
    }

    matches.forEach(item => {
        const row = document.createElement('div');
        row.className = 'suggestion-item';
        row.setAttribute('role', 'option');

        const titleSpan = document.createElement('span');
        titleSpan.className = 'suggestion-title';
        titleSpan.textContent = item.title;

        const badge = document.createElement('span');
        badge.className = 'suggestion-badge';
        badge.textContent = item.category || 'Academic';

        row.appendChild(titleSpan);
        row.appendChild(badge);

        row.addEventListener('click', () => {
            hideAutocompleteSuggestions();
            viewNotice(item.id);
        });

        suggestionsBox.appendChild(row);
    });

    suggestionsBox.classList.remove('hidden');
}

function hideAutocompleteSuggestions() {
    const box = document.getElementById('searchSuggestions');
    if (box) box.classList.add('hidden');
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    if (input) input.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    hideAutocompleteSuggestions();
    filterNotices();
}

function setupOutsideClicks() {
    document.addEventListener('click', (e) => {
        const searchSection = document.querySelector('.search-section');
        if (searchSection && !searchSection.contains(e.target)) {
            hideAutocompleteSuggestions();
        }
    });
}

function filterNotices() {
    const input = document.getElementById('searchInput');
    const query = input ? input.value.trim().toLowerCase() : '';
    const activeCategory = appState.activeCategory;

    // Filter out archived
    let base = appState.notices.filter(n => !appState.archivedNotices.includes(n.id));

    // Category filter
    if (activeCategory !== 'All') {
        if (activeCategory === 'Deadlines') {
            base = base.filter(n => Boolean(n.deadline));
        } else {
            base = base.filter(n => n.category === activeCategory);
        }
    }

    // Text query filter
    if (query) {
        base = base.filter(n =>
            (n.title && n.title.toLowerCase().includes(query)) ||
            (n.content && n.content.toLowerCase().includes(query)) ||
            (n.author && n.author.toLowerCase().includes(query)) ||
            (n.priority && n.priority.toLowerCase().includes(query))
        );
    }

    if (appState.currentView === 'deadlines') {
        renderDeadlines(base.filter(n => Boolean(n.deadline)));
    } else {
        renderNotices(base);
    }
}

// ===== NOTICE MANAGEMENT (FEED VIEW) =====
function renderNotices(noticesToRender = null) {
    const list = document.getElementById('noticeList');
    if (!list) return;

    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    let notices = noticesToRender;
    if (!notices) {
        notices = appState.notices.filter(n => !appState.archivedNotices.includes(n.id));
        if (appState.activeCategory !== 'All') {
            if (appState.activeCategory === 'Deadlines') {
                notices = notices.filter(n => Boolean(n.deadline));
            } else {
                notices = notices.filter(n => n.category === appState.activeCategory);
            }
        }
    }

    if (!notices || notices.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
            <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="13" x2="15" y2="13"></line>
                    <line x1="9" y1="17" x2="11" y2="17"></line>
                </svg>
            </div>
            <p>No notices found in this view</p>
        `;
        list.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();

    notices.forEach(notice => {
        const card = document.createElement('article');
        const urgency = getNoticeUrgencyInfo(notice);
        card.className = `notice-card ${urgency.tier}`;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${notice.title}, ${urgency.pillText || 'Notice'}`);

        card.addEventListener('click', () => viewNotice(notice.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                viewNotice(notice.id);
            }
        });

        // Top Row: Title on left, Time-Based Urgency Pill on top-right
        const cardHeader = document.createElement('div');
        cardHeader.className = 'notice-card-header';

        const titleEl = document.createElement('h3');
        titleEl.className = 'notice-card-title';
        titleEl.textContent = notice.title;
        cardHeader.appendChild(titleEl);

        if (urgency.pillText) {
            const pill = document.createElement('span');
            pill.className = `urgency-pill ${urgency.tier}`;
            pill.textContent = urgency.pillText;
            cardHeader.appendChild(pill);
        }

        card.appendChild(cardHeader);

        // Middle: Description / Content Excerpt
        const excerptEl = document.createElement('p');
        excerptEl.className = 'notice-card-excerpt';
        excerptEl.textContent = notice.content;
        card.appendChild(excerptEl);

        // Bottom Row: Category • Date • 👤 Author on left, Details on right
        const footer = document.createElement('div');
        footer.className = 'notice-card-footer';

        const metaGroup = document.createElement('div');
        metaGroup.className = 'notice-meta-group';

        const catTag = document.createElement('span');
        const catClass = (notice.category || 'Academic').toLowerCase();
        catTag.className = `category-tag ${catClass}`;
        catTag.textContent = notice.category || 'Academic';
        metaGroup.appendChild(catTag);

        const dateItem = document.createElement('div');
        dateItem.className = 'notice-meta-item';
        dateItem.innerHTML = `${SVG_ICONS.calendar} <span>${notice.date}</span>`;
        metaGroup.appendChild(dateItem);

        if (notice.author) {
            const authorItem = document.createElement('div');
            authorItem.className = 'notice-meta-item';
            authorItem.innerHTML = `${SVG_ICONS.user} <span>${notice.author}</span>`;
            metaGroup.appendChild(authorItem);
        }

        if (notice.attachment) {
            const attachItem = document.createElement('div');
            attachItem.className = 'notice-meta-item attachment-meta-item';
            attachItem.innerHTML = `${SVG_ICONS.paperclip} <span>Attachment</span>`;
            metaGroup.appendChild(attachItem);
        }

        footer.appendChild(metaGroup);

        // Actions: Details Link & Admin Controls
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'notice-card-actions';

        const detailsBtn = document.createElement('span');
        detailsBtn.className = 'btn-card-details';
        detailsBtn.innerHTML = `<span>Details</span> <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        actionsGroup.appendChild(detailsBtn);

        if (appState.isAdmin) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-card-action';
            editBtn.innerHTML = `${SVG_ICONS.edit} <span>Edit</span>`;
            editBtn.setAttribute('aria-label', `Edit notice ${notice.title}`);
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditNotice(notice.id);
            });
            actionsGroup.appendChild(editBtn);

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-card-action btn-card-delete';
            delBtn.innerHTML = `${SVG_ICONS.trash} <span>Delete</span>`;
            delBtn.setAttribute('aria-label', `Delete notice ${notice.title}`);
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNotice(notice.id);
            });
            actionsGroup.appendChild(delBtn);
        }

        footer.appendChild(actionsGroup);
        card.appendChild(footer);
        fragment.appendChild(card);
    });

    list.appendChild(fragment);
}

// ===== DEADLINE TIMELINE VIEW =====
function renderDeadlines(noticesToRender = null) {
    const timeline = document.getElementById('deadlineTimeline');
    if (!timeline) return;

    while (timeline.firstChild) {
        timeline.removeChild(timeline.firstChild);
    }

    let items = noticesToRender || appState.notices.filter(n => !appState.archivedNotices.includes(n.id));
    const noticesWithDeadlines = items.filter(n => n.deadline);

    if (noticesWithDeadlines.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
            <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>
            <p>No active deadlines found</p>
        `;
        timeline.appendChild(empty);
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

        if (diffDays < 0) {
            tier = 'expired';
            urgencyLabel = 'Deadline Passed';
        } else if (diffDays === 0) {
            tier = 'urgent';
            urgencyLabel = 'Due Today';
        } else if (diffDays === 1) {
            tier = 'urgent';
            urgencyLabel = 'Due Tomorrow (< 24h)';
        } else if (diffDays <= 2) {
            tier = 'urgent';
            urgencyLabel = `Due in ${diffDays} days (< 48h)`;
        } else if (diffDays <= 7) {
            tier = 'upcoming';
            urgencyLabel = `Due in ${diffDays} days (< 7d)`;
        } else {
            tier = 'later';
            const weeks = Math.round(diffDays / 7);
            urgencyLabel = `Due in ${diffDays} days (${weeks} ${weeks === 1 ? 'wk' : 'wks'})`;
        }

        return {
            notice,
            diffDays,
            tier,
            urgencyLabel,
            formattedDate: deadlineDate.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
        };
    });

    // Chronological sorting: nearest first, expired last
    enriched.sort((a, b) => {
        if (a.diffDays >= 0 && b.diffDays >= 0) return a.diffDays - b.diffDays;
        if (a.diffDays >= 0 && b.diffDays < 0) return -1;
        if (a.diffDays < 0 && b.diffDays >= 0) return 1;
        return b.diffDays - a.diffDays;
    });

    // Summary counts bar
    const urgentCount = enriched.filter(e => e.tier === 'urgent').length;
    const upcomingCount = enriched.filter(e => e.tier === 'upcoming').length;
    const laterCount = enriched.filter(e => e.tier === 'later').length;

    const summaryBar = document.createElement('div');
    summaryBar.className = 'timeline-summary';

    if (urgentCount > 0) {
        const chip = document.createElement('div');
        chip.className = 'timeline-summary-chip urgent';
        chip.textContent = `${urgentCount} Urgent (<48h)`;
        summaryBar.appendChild(chip);
    }
    if (upcomingCount > 0) {
        const chip = document.createElement('div');
        chip.className = 'timeline-summary-chip upcoming';
        chip.textContent = `${upcomingCount} Upcoming (<7d)`;
        summaryBar.appendChild(chip);
    }
    if (laterCount > 0) {
        const chip = document.createElement('div');
        chip.className = 'timeline-summary-chip later';
        chip.textContent = `${laterCount} Later (>7d)`;
        summaryBar.appendChild(chip);
    }

    timeline.appendChild(summaryBar);

    const fragment = document.createDocumentFragment();

    enriched.forEach(item => {
        const card = document.createElement('div');
        card.className = `timeline-card tier-${item.tier}`;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Deadline: ${item.notice.title}, ${item.urgencyLabel}`);

        card.addEventListener('click', () => viewNotice(item.notice.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                viewNotice(item.notice.id);
            }
        });

        // Header: Urgency badge & Date
        const header = document.createElement('div');
        header.className = 'timeline-header';

        const badge = document.createElement('span');
        badge.className = `urgency-badge ${item.tier}`;
        badge.textContent = item.urgencyLabel;

        const dateChip = document.createElement('span');
        dateChip.className = 'timeline-date-chip';
        dateChip.innerHTML = `${SVG_ICONS.calendar} <span>${item.formattedDate}</span>`;

        header.appendChild(badge);
        header.appendChild(dateChip);

        if (item.notice.attachment) {
            const attachPill = document.createElement('span');
            attachPill.className = 'attachment-pill';
            attachPill.innerHTML = `${SVG_ICONS.paperclip} <span>Attachment</span>`;
            header.appendChild(attachPill);
        }

        card.appendChild(header);

        // Title
        const title = document.createElement('h3');
        title.className = 'timeline-title';
        title.textContent = item.notice.title;
        card.appendChild(title);

        // Excerpt
        const desc = document.createElement('p');
        desc.className = 'timeline-desc';
        desc.textContent = item.notice.content;
        card.appendChild(desc);

        // Footer Actions
        const footer = document.createElement('div');
        footer.className = 'timeline-footer';

        const catTag = document.createElement('span');
        const catClass = (item.notice.category || 'Academic').toLowerCase();
        catTag.className = `category-tag ${catClass}`;
        catTag.textContent = item.notice.category || 'Academic';
        footer.appendChild(catTag);

        const actions = document.createElement('div');
        actions.className = 'timeline-actions';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-timeline-action';
        viewBtn.innerHTML = `${SVG_ICONS.eye} <span>Details</span>`;
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewNotice(item.notice.id);
        });
        actions.appendChild(viewBtn);

        const remindBtn = document.createElement('button');
        remindBtn.className = 'btn-timeline-action';
        remindBtn.innerHTML = `${SVG_ICONS.calendar} <span>Remind</span>`;
        remindBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openReminderModal(item.notice.id);
        });
        actions.appendChild(remindBtn);

        footer.appendChild(actions);
        card.appendChild(footer);
        fragment.appendChild(card);
    });

    timeline.appendChild(fragment);
}

// ===== TWO-COLUMN NOTICE DETAIL SCREEN =====
function viewNotice(id) {
    const notice = appState.notices.find(n => n.id === Number(id));
    if (!notice) return;

    const detailContainer = document.getElementById('noticeDetail');
    if (!detailContainer) return;

    while (detailContainer.firstChild) {
        detailContainer.removeChild(detailContainer.firstChild);
    }

    const prio = (notice.priority || 'medium').toLowerCase();
    const isSaved = appState.savedNotices.includes(notice.id);

    // LEFT COLUMN: MAIN ARTICLE
    const mainCol = document.createElement('div');
    mainCol.className = 'detail-main';

    const articleCard = document.createElement('article');
    articleCard.className = 'detail-article-card';

    // Category & Priority Breadcrumb
    const catRow = document.createElement('div');
    catRow.className = 'detail-category-row';

    const catTag = document.createElement('span');
    const catClass = (notice.category || 'Academic').toLowerCase();
    catTag.className = `category-tag ${catClass}`;
    catTag.textContent = notice.category || 'Academic';
    catRow.appendChild(catTag);

    const urgency = getNoticeUrgencyInfo(notice);
    if (urgency.pillText) {
        const urgencyPill = document.createElement('span');
        urgencyPill.className = `urgency-pill ${urgency.tier}`;
        urgencyPill.textContent = urgency.pillText;
        catRow.appendChild(urgencyPill);
    }

    articleCard.appendChild(catRow);

    // Title
    const h1 = document.createElement('h1');
    h1.className = 'detail-title';
    h1.textContent = notice.title;
    articleCard.appendChild(h1);

    // Meta bar
    const metaBar = document.createElement('div');
    metaBar.className = 'detail-meta-bar';

    const dateMeta = document.createElement('div');
    dateMeta.className = 'detail-meta-item';
    dateMeta.innerHTML = `${SVG_ICONS.calendar} <span>Posted ${notice.date}</span>`;
    metaBar.appendChild(dateMeta);

    const authorMeta = document.createElement('div');
    authorMeta.className = 'detail-meta-item';
    authorMeta.innerHTML = `${SVG_ICONS.user} <span>${notice.author || 'Administrative Desk'}</span>`;
    metaBar.appendChild(authorMeta);

    articleCard.appendChild(metaBar);

    // Body content
    const bodyEl = document.createElement('div');
    bodyEl.className = 'detail-content';
    bodyEl.textContent = notice.content;
    articleCard.appendChild(bodyEl);

    // Attachment Box if present
    if (notice.attachment) {
        const isPdf = notice.attachment.type === 'application/pdf' || (notice.attachment.name && notice.attachment.name.toLowerCase().endsWith('.pdf'));
        const isImage = (notice.attachment.type && notice.attachment.type.startsWith('image/')) || (notice.attachment.name && /\.(png|jpe?g|svg|webp|gif)$/i.test(notice.attachment.name));

        const attachBox = document.createElement('div');
        attachBox.className = 'notice-attachment-box';

        const attachHeader = document.createElement('div');
        attachHeader.className = 'attachment-box-header';
        attachHeader.innerHTML = `${SVG_ICONS.paperclip} <span>${isPdf ? 'Official Circular Document' : 'Official Timetable Attachment'}</span>`;
        attachBox.appendChild(attachHeader);

        if (isImage) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'attachment-img-preview-container';

            const img = document.createElement('img');
            img.className = 'attachment-preview-img';
            img.src = notice.attachment.data;
            img.alt = notice.attachment.name || 'Attachment';
            img.title = 'Click to open in new tab';
            img.addEventListener('click', () => openAttachmentViewer(notice.attachment));

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
        viewBtn.innerHTML = `${SVG_ICONS.eye} <span>View Document</span>`;
        viewBtn.addEventListener('click', () => openAttachmentViewer(notice.attachment));
        attachActions.appendChild(viewBtn);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-attachment-download';
        downloadBtn.innerHTML = `${SVG_ICONS.download} <span>Download</span>`;
        downloadBtn.addEventListener('click', () => downloadAttachment(notice.attachment));
        attachActions.appendChild(downloadBtn);

        attachMeta.appendChild(attachActions);
        attachBox.appendChild(attachMeta);
        articleCard.appendChild(attachBox);
    }

    mainCol.appendChild(articleCard);

    // RELATED NOTICES SECTION
    const relatedSection = document.createElement('section');
    relatedSection.className = 'related-notices-section';

    const relatedTitle = document.createElement('h3');
    relatedTitle.className = 'related-section-title';
    relatedTitle.textContent = `Related ${notice.category || 'Academic'} Notices`;
    relatedSection.appendChild(relatedTitle);

    const relatedGrid = document.createElement('div');
    relatedGrid.className = 'related-cards-grid';

    const relatedNotices = appState.notices
        .filter(n => n.id !== notice.id && !appState.archivedNotices.includes(n.id))
        .filter(n => n.category === notice.category || n.priority === notice.priority)
        .slice(0, 3);

    if (relatedNotices.length === 0) {
        const noRelated = document.createElement('p');
        noRelated.style.fontSize = '12px';
        noRelated.style.color = 'var(--text-muted)';
        noRelated.textContent = 'No other notices in this category';
        relatedGrid.appendChild(noRelated);
    } else {
        relatedNotices.forEach(rel => {
            const relCard = document.createElement('div');
            relCard.className = 'related-card';
            relCard.addEventListener('click', () => viewNotice(rel.id));

            const relTitle = document.createElement('div');
            relTitle.className = 'related-card-title';
            relTitle.textContent = rel.title;

            const relMeta = document.createElement('div');
            relMeta.className = 'related-card-meta';
            relMeta.textContent = `${rel.date} &bull; ${rel.author || 'Admin'}`;

            relCard.appendChild(relTitle);
            relCard.appendChild(relMeta);
            relatedGrid.appendChild(relCard);
        });
    }

    relatedSection.appendChild(relatedGrid);
    mainCol.appendChild(relatedSection);
    detailContainer.appendChild(mainCol);

    // RIGHT COLUMN: SIDEBAR (DEADLINE & ACTIONS)
    const sidebarCol = document.createElement('aside');
    sidebarCol.className = 'detail-sidebar';

    // 1. Deadline Card in Sidebar
    const deadlineCard = document.createElement('div');
    deadlineCard.className = 'sidebar-card';

    const deadlineTitle = document.createElement('div');
    deadlineTitle.className = 'sidebar-card-title';
    deadlineTitle.innerHTML = `${SVG_ICONS.clock} <span>Action Deadline</span>`;
    deadlineCard.appendChild(deadlineTitle);

    if (notice.deadline) {
        const deadlineDate = new Date(notice.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(23, 59, 59, 999);
        const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const countdownBox = document.createElement('div');
        countdownBox.className = 'sidebar-deadline-countdown';

        let countdownText = '';
        let progressWidth = '100%';
        if (diffDays < 0) {
            countdownText = 'Expired / Past Due';
            progressWidth = '0%';
        } else if (diffDays === 0) {
            countdownText = 'Action Due Today';
            progressWidth = '15%';
        } else if (diffDays === 1) {
            countdownText = 'Due Tomorrow (< 24h)';
            progressWidth = '25%';
        } else {
            countdownText = `${diffDays} days remaining`;
            progressWidth = `${Math.min(100, Math.max(20, diffDays * 10))}%`;
        }
        countdownBox.textContent = countdownText;
        deadlineCard.appendChild(countdownBox);

        const dateRow = document.createElement('div');
        dateRow.className = 'sidebar-deadline-date';
        dateRow.innerHTML = `${SVG_ICONS.calendar} <span>${notice.deadline}</span>`;
        deadlineCard.appendChild(dateRow);

        const progressTrack = document.createElement('div');
        progressTrack.className = 'urgency-progress-track';
        const progressBar = document.createElement('div');
        progressBar.className = 'urgency-progress-bar';
        progressBar.style.width = progressWidth;
        progressTrack.appendChild(progressBar);
        deadlineCard.appendChild(progressTrack);

        const calBtn = document.createElement('button');
        calBtn.className = 'btn-sidebar-action btn-sidebar-primary';
        calBtn.innerHTML = `${SVG_ICONS.calendar} <span>Add to Calendar</span>`;
        calBtn.addEventListener('click', () => openReminderModal(notice.id));
        deadlineCard.appendChild(calBtn);
    } else {
        const noDeadline = document.createElement('p');
        noDeadline.style.fontSize = '12.5px';
        noDeadline.style.color = 'var(--text-secondary)';
        noDeadline.style.lineHeight = '1.5';
        noDeadline.textContent = 'This announcement does not have a hard deadline attached.';
        deadlineCard.appendChild(noDeadline);
    }

    sidebarCol.appendChild(deadlineCard);

    // 2. Modern Action Buttons Card
    const actionsCard = document.createElement('div');
    actionsCard.className = 'sidebar-card';

    const actionsTitle = document.createElement('div');
    actionsTitle.className = 'sidebar-card-title';
    actionsTitle.textContent = 'Notice Actions';
    actionsCard.appendChild(actionsTitle);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'sidebar-action-btn-group';

    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn-sidebar-action';
    shareBtn.innerHTML = `${SVG_ICONS.share} <span>Share Notice</span>`;
    shareBtn.addEventListener('click', () => shareNotice(notice.id));
    btnGroup.appendChild(shareBtn);

    // Save / Bookmark button
    const bookmarkBtn = document.createElement('button');
    bookmarkBtn.className = `btn-sidebar-action ${isSaved ? 'saved' : ''}`;
    bookmarkBtn.innerHTML = `${SVG_ICONS.bookmark} <span>${isSaved ? 'Saved to Bookmarks' : 'Save Notice'}</span>`;
    bookmarkBtn.addEventListener('click', () => {
        toggleBookmarkNotice(notice.id);
        const nowSaved = appState.savedNotices.includes(notice.id);
        bookmarkBtn.className = `btn-sidebar-action ${nowSaved ? 'saved' : ''}`;
        bookmarkBtn.innerHTML = `${SVG_ICONS.bookmark} <span>${nowSaved ? 'Saved to Bookmarks' : 'Save Notice'}</span>`;
    });
    btnGroup.appendChild(bookmarkBtn);

    // Archive button
    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'btn-sidebar-action';
    archiveBtn.innerHTML = `${SVG_ICONS.archive} <span>Archive Notice</span>`;
    archiveBtn.addEventListener('click', () => toggleArchiveNotice(notice.id));
    btnGroup.appendChild(archiveBtn);

    // Admin Edit & Delete buttons
    if (appState.isAdmin) {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-sidebar-action';
        editBtn.innerHTML = `${SVG_ICONS.edit} <span>Edit Notice</span>`;
        editBtn.addEventListener('click', () => openEditNotice(notice.id));
        btnGroup.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-sidebar-action btn-sidebar-delete';
        deleteBtn.innerHTML = `${SVG_ICONS.trash} <span>Delete Notice</span>`;
        deleteBtn.addEventListener('click', () => deleteNotice(notice.id));
        btnGroup.appendChild(deleteBtn);
    }

    actionsCard.appendChild(btnGroup);
    sidebarCol.appendChild(actionsCard);

    detailContainer.appendChild(sidebarCol);

    showScreen('detailScreen');
}

// ===== BOOKMARK & ARCHIVE =====
function toggleBookmarkNotice(id) {
    const numId = Number(id);
    const index = appState.savedNotices.indexOf(numId);
    if (index === -1) {
        appState.savedNotices.push(numId);
        showToast('Saved to your bookmarks');
    } else {
        appState.savedNotices.splice(index, 1);
        showToast('Removed from bookmarks');
    }
    saveState();
}

function toggleArchiveNotice(id) {
    const numId = Number(id);
    if (!appState.archivedNotices.includes(numId)) {
        appState.archivedNotices.push(numId);
        saveState();
        showToast('Notice moved to archive');
        goHome();
    }
}

// ===== SHARE NOTICE =====
function shareNotice(id) {
    const notice = appState.notices.find(n => n.id === Number(id));
    if (!notice) return;

    if (navigator.share) {
        navigator.share({
            title: notice.title,
            text: `${notice.title}\n\n${notice.content}`,
            url: window.location.href
        }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`${notice.title}\n\n${notice.content}`)
            .then(() => showToast('Notice copied to clipboard'))
            .catch(() => showToast('Failed to copy notice'));
    } else {
        showToast('Notice link ready');
    }
}

// ===== CALENDAR & REMINDER SYNC =====
function openReminderModal(id) {
    const notice = appState.notices.find(n => n.id === Number(id));
    if (!notice) return;

    appState.activeReminderNoticeId = notice.id;

    const modal = document.getElementById('reminderModal');
    const modalTitle = document.getElementById('reminderModalTitle');
    const modalDate = document.getElementById('reminderModalDate');

    if (modalTitle) modalTitle.textContent = notice.title;
    if (modalDate) {
        if (notice.deadline) {
            modalDate.textContent = `Action Deadline: ${notice.deadline}`;
            modalDate.style.color = 'var(--urgency-urgent)';
        } else {
            modalDate.textContent = `Announcement Date: ${notice.date}`;
            modalDate.style.color = 'var(--text-secondary)';
        }
    }

    if (modal) modal.style.display = 'flex';
}

function closeReminderModal(event) {
    if (event && event.target && event.target.id !== 'reminderModal' && !event.target.classList.contains('modal-close-btn') && !event.target.classList.contains('btn-secondary')) {
        return;
    }
    const modal = document.getElementById('reminderModal');
    if (modal) modal.style.display = 'none';
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
    showToast('Opening Google Calendar');
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
        showToast('Downloaded .ics calendar file');
    } catch (e) {
        showToast('Failed to generate calendar file');
    }
}

// ===== ADMIN PANEL & FORM MANAGEMENT =====
function selectFormCategory(cat) {
    const input = document.getElementById('noticeCategory');
    if (input) input.value = cat;

    const group = document.getElementById('categorySelectorGroup');
    if (group) {
        group.querySelectorAll('.selector-badge').forEach(b => {
            if (b.getAttribute('data-value') === cat) b.classList.add('active');
            else b.classList.remove('active');
        });
    }
}

function selectFormPriority(prio) {
    const input = document.getElementById('noticePriority');
    if (input) input.value = prio;

    const group = document.getElementById('prioritySelectorGroup');
    if (group) {
        group.querySelectorAll('.selector-badge').forEach(b => {
            if (b.getAttribute('data-value') === prio) b.classList.add('active');
            else b.classList.remove('active');
        });
    }
}

function formatEditorText(action) {
    const textarea = document.getElementById('noticeContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let replacement = '';

    switch (action) {
        case 'bold':
            replacement = `**${selected || 'bold text'}**`;
            break;
        case 'italic':
            replacement = `*${selected || 'italic text'}*`;
            break;
        case 'heading':
            replacement = `\n## ${selected || 'Section Heading'}\n`;
            break;
        case 'list':
            replacement = `\n- ${selected || 'First item'}\n- Second item\n`;
            break;
        case 'quote':
            replacement = `\n> ${selected || 'Important quoted note'}\n`;
            break;
        case 'divider':
            replacement = `\n---\n`;
            break;
        default:
            return;
    }

    textarea.setRangeText(replacement, start, end, 'end');
    textarea.focus();
}

function handleAttachmentSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
        showToast('File size exceeds 2MB limit');
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
        showToast('Failed to read file');
    };
    reader.readAsDataURL(file);
}

function showAdminAttachmentPreview(attachment) {
    const container = document.getElementById('attachmentPreviewAdmin');
    const name = document.getElementById('adminAttachmentName');
    const size = document.getElementById('adminAttachmentSize');

    if (!container) return;
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
        showToast('Only administrators can publish notices');
        return;
    }

    const titleHeader = document.getElementById('adminScreenTitle');
    const submitBtn = document.getElementById('adminSubmitBtn');
    const noticeIdInput = document.getElementById('noticeId');

    if (titleHeader) titleHeader.textContent = 'Publish Announcement';
    if (submitBtn) submitBtn.textContent = 'Publish Notice';
    if (noticeIdInput) noticeIdInput.value = '';

    document.getElementById('noticeTitle').value = '';
    document.getElementById('noticeContent').value = '';
    document.getElementById('noticeDeadline').value = '';
    selectFormCategory('Academic');
    selectFormPriority('medium');

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

    if (titleHeader) titleHeader.textContent = 'Edit Announcement';
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    if (noticeIdInput) noticeIdInput.value = notice.id;

    if (titleInput) titleInput.value = notice.title || '';
    if (contentInput) contentInput.value = notice.content || '';
    if (deadlineInput) deadlineInput.value = notice.deadline || '';
    selectFormCategory(notice.category || 'Academic');
    selectFormPriority(notice.priority || 'medium');

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

function submitNotice() {
    if (!appState.isAdmin) {
        showToast('Unauthorized: Admin access required');
        return;
    }

    const noticeIdInput = document.getElementById('noticeId');
    const titleInput = document.getElementById('noticeTitle');
    const contentInput = document.getElementById('noticeContent');
    const deadlineInput = document.getElementById('noticeDeadline');
    const categoryInput = document.getElementById('noticeCategory');
    const priorityInput = document.getElementById('noticePriority');

    const editId = noticeIdInput && noticeIdInput.value ? Number(noticeIdInput.value) : null;
    const title = titleInput ? titleInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';
    const deadline = deadlineInput ? deadlineInput.value : '';
    const category = categoryInput ? categoryInput.value : 'Academic';
    const priority = priorityInput ? priorityInput.value : 'medium';

    if (!title || !content) {
        showToast('Please enter both title and content');
        return;
    }

    if (editId) {
        // UPDATE existing
        const index = appState.notices.findIndex(n => n.id === editId);
        if (index === -1) {
            showToast('Notice not found for update');
            return;
        }

        appState.notices[index].title = title;
        appState.notices[index].content = content;
        appState.notices[index].deadline = deadline || null;
        appState.notices[index].category = category;
        appState.notices[index].priority = priority;
        appState.notices[index].attachment = currentAdminAttachment || null;

        saveNotices();
        currentAdminAttachment = null;

        // Sync update with Firestore
        if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured() && typeof fbDb !== 'undefined' && fbDb) {
            fbDb.collection('notices').doc(String(editId)).set(appState.notices[index], { merge: true }).catch(err => {
                console.warn('[Firestore Update Notice]', err);
            });
        }

        showToast('Notice updated successfully');
        goHome();
    } else {
        // CREATE new
        const maxId = appState.notices.reduce((max, n) => Math.max(max, Number(n.id) || 0), 0);
        const authorName = appState.user && appState.user.username ? appState.user.username.toUpperCase() : 'ADMIN';

        const newNotice = {
            id: maxId + 1,
            title,
            category,
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

        // Sync create with Firestore
        if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured() && typeof fbDb !== 'undefined' && fbDb) {
            fbDb.collection('notices').doc(String(newNotice.id)).set(newNotice).catch(err => {
                console.warn('[Firestore Create Notice]', err);
            });
        }

        showToast('Notice published successfully');
        evaluateNoticeForInstantAlert(newNotice);
        goHome();
    }
}

function deleteNotice(id) {
    if (!appState.isAdmin) {
        showToast('Only admins can delete notices');
        return;
    }

    const notice = appState.notices.find(n => n.id === Number(id));
    const title = notice ? `"${notice.title}"` : 'this notice';

    if (confirm(`Are you sure you want to delete ${title}?`)) {
        appState.notices = appState.notices.filter(n => n.id !== Number(id));
        appState.alertedNoticeIds = (appState.alertedNoticeIds || []).filter(item => item !== Number(id));
        appState.digestedNoticeIds = (appState.digestedNoticeIds || []).filter(item => item !== Number(id));
        saveNotices();
        saveState();

        // Sync delete with Firestore
        if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured() && typeof fbDb !== 'undefined' && fbDb) {
            fbDb.collection('notices').doc(String(id)).delete().catch(err => {
                console.warn('[Firestore Delete Notice]', err);
            });
        }

        showToast('Notice deleted successfully');
        goHome();
    }
}

// ===== SETTINGS & TABS =====
function openSettings() {
    switchSettingsTab(appState.activeSettingsTab || 'notifications');
    loadNotificationSettings();
    applyUrgencyColors();
    updateSecurityPasscodeDisplay();
    showScreen('settingsScreen');
}

function switchSettingsTab(tabName) {
    appState.activeSettingsTab = tabName;

    // Update buttons
    const tabBtns = {
        notifications: document.getElementById('tabBtnNotifications'),
        preferences: document.getElementById('tabBtnPreferences'),
        about: document.getElementById('tabBtnAbout')
    };

    Object.keys(tabBtns).forEach(k => {
        if (tabBtns[k]) {
            if (k === tabName) {
                tabBtns[k].classList.add('active');
                tabBtns[k].setAttribute('aria-selected', 'true');
            } else {
                tabBtns[k].classList.remove('active');
                tabBtns[k].setAttribute('aria-selected', 'false');
            }
        }
    });

    // Update panels
    const panels = {
        notifications: document.getElementById('settingsTabNotifications'),
        preferences: document.getElementById('settingsTabPreferences'),
        about: document.getElementById('settingsTabAbout')
    };

    Object.keys(panels).forEach(k => {
        if (panels[k]) {
            if (k === tabName) panels[k].style.display = 'block';
            else panels[k].style.display = 'none';
        }
    });

    if (tabName === 'notifications') {
        renderNotificationHistory();
    } else if (tabName === 'preferences') {
        updateSecurityPasscodeDisplay();
    }
}

// ===== DUAL NOTIFICATION SYSTEM =====

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isNoticeUnder48Hours(notice) {
    if (!notice || !notice.deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = String(notice.deadline).split('T')[0].split('-').map(Number);
    const deadlineDate = new Date(parts[0], parts[1] - 1, parts[2]);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
}

// 1. Real-time In-App Banner Alerts
function showAlertBanner(notice, reason, isUrgent = false) {
    if (!appState.user) return;
    const banner = document.getElementById('alertBanner');
    const titleEl = document.getElementById('alertBannerTitle');
    const descEl = document.getElementById('alertBannerDesc');
    const typeEl = document.getElementById('alertBannerType');
    if (!banner || !titleEl) return;

    if (bannerTimer) {
        clearTimeout(bannerTimer);
        bannerTimer = null;
    }

    currentBannerNoticeId = notice ? notice.id : null;
    titleEl.textContent = notice ? notice.title : 'New Notice Announcement';
    if (descEl) descEl.textContent = reason || (isUrgent ? 'Action required within 48 hours' : 'New notice posted');

    if (isUrgent) {
        banner.classList.add('urgent');
        if (typeEl) typeEl.textContent = 'URGENT ALERT';
    } else {
        banner.classList.remove('urgent');
        if (typeEl) typeEl.textContent = 'INSTANT ALERT';
    }

    banner.classList.remove('hidden');

    bannerTimer = setTimeout(() => {
        dismissAlertBanner();
    }, 10000);
}

function dismissAlertBanner() {
    const banner = document.getElementById('alertBanner');
    if (banner) banner.classList.add('hidden');
    if (bannerTimer) {
        clearTimeout(bannerTimer);
        bannerTimer = null;
    }
    currentBannerNoticeId = null;
}

function viewAlertBannerNotice() {
    const targetId = currentBannerNoticeId;
    dismissAlertBanner();
    if (targetId) {
        viewNotice(targetId);
    }
}

// 2. Real-time Evaluation on Notice Post
function evaluateNoticeForInstantAlert(notice) {
    if (!appState.user || !notice) return false;

    const settings = appState.notificationSettings || {
        instantAlertsEnabled: true,
        instantAlertsScope: 'high_only',
        dailyDigestEnabled: true,
        dailyDigestTime: 'morning',
        categories: ['Academic', 'Events', 'Deadlines', 'Admin']
    };

    if (!settings.instantAlertsEnabled) {
        return false;
    }

    // Category filter check
    const subscribedCats = settings.categories || ['Academic', 'Events', 'Deadlines', 'Admin'];
    if (notice.category && !subscribedCats.includes(notice.category)) {
        return false;
    }

    // Strict duplicate prevention: notice only triggers once
    if (!appState.alertedNoticeIds) appState.alertedNoticeIds = [];
    if (appState.alertedNoticeIds.includes(notice.id)) {
        return false;
    }

    const under48h = isNoticeUnder48Hours(notice);
    const isHighPriority = notice.priority === 'high';

    let qualifies = false;
    let reason = '';
    let isUrgent = false;

    if (settings.instantAlertsScope === 'all') {
        qualifies = true;
        if (under48h) {
            reason = 'Urgent: Deadline < 48 hours';
            isUrgent = true;
        } else if (isHighPriority) {
            reason = 'HIGH Priority Announcement';
            isUrgent = true;
        } else {
            reason = `${notice.category || 'General'} Announcement`;
        }
    } else {
        // 'high_only': HIGH priority notice OR deadline < 48 hours
        if (under48h) {
            qualifies = true;
            isUrgent = true;
            reason = 'Urgent: Deadline due within 48 hours';
        } else if (isHighPriority) {
            qualifies = true;
            isUrgent = true;
            reason = 'HIGH Priority Notice';
        }
    }

    if (qualifies) {
        appState.alertedNoticeIds.push(notice.id);
        logNotification('instant', notice.id, notice.title, reason);

        showAlertBanner(notice, reason, isUrgent);

        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(isUrgent ? 'Urgent College Alert' : 'New College Notice', {
                    body: notice.title + (reason ? ` (${reason})` : ''),
                    icon: 'icon-192.png'
                });
            } catch (err) {
                console.warn('Browser notification error:', err);
            }
        }
        return true;
    }

    return false;
}

// 3. Daily Digest (Scheduled 24h Summary)
function triggerDailyDigestNow(isManual = false) {
    if (!appState.user && !isManual) {
        return;
    }

    const settings = appState.notificationSettings || {
        dailyDigestEnabled: true,
        dailyDigestTime: 'morning',
        categories: ['Academic', 'Events', 'Deadlines', 'Admin']
    };

    if (!isManual && !settings.dailyDigestEnabled) {
        return;
    }

    const subscribedCats = settings.categories || ['Academic', 'Events', 'Deadlines', 'Admin'];
    const nowTime = new Date().getTime();

    // Query MEDIUM + LOW priority notices from past 24-36h that haven't been digested
    let eligibleNotices = appState.notices.filter(notice => {
        if (notice.priority !== 'medium' && notice.priority !== 'low') return false;
        if (notice.category && !subscribedCats.includes(notice.category)) return false;
        if (appState.archivedNotices && appState.archivedNotices.includes(notice.id)) return false;
        if (appState.digestedNoticeIds && appState.digestedNoticeIds.includes(notice.id)) return false;

        if (!notice.date) return false;
        const postTime = new Date(notice.date).getTime();
        const diffHours = (nowTime - postTime) / (1000 * 60 * 60);
        return diffHours >= -12 && diffHours <= 36;
    });

    // In manual test mode, if no notices within 24h, allow undigested medium/low notices to show batching
    if (isManual && eligibleNotices.length === 0) {
        eligibleNotices = appState.notices.filter(notice => {
            if (notice.priority !== 'medium' && notice.priority !== 'low') return false;
            if (notice.category && !subscribedCats.includes(notice.category)) return false;
            if (appState.archivedNotices && appState.archivedNotices.includes(notice.id)) return false;
            if (appState.digestedNoticeIds && appState.digestedNoticeIds.includes(notice.id)) return false;
            return true;
        });
    }

    if (eligibleNotices.length === 0) {
        if (isManual) {
            showToast('All medium & low priority notices have already been digested');
        }
        return;
    }

    // Mark as digested to prevent duplicate digest alerts
    if (!appState.digestedNoticeIds) appState.digestedNoticeIds = [];
    eligibleNotices.forEach(n => {
        if (!appState.digestedNoticeIds.includes(n.id)) {
            appState.digestedNoticeIds.push(n.id);
        }
    });

    const count = eligibleNotices.length;
    const summaryText = `You have ${count} new ${count === 1 ? 'notice' : 'notices'} from today`;

    logNotification('digest', null, `Daily Digest (${count} notices)`, summaryText);

    // Render digest modal
    const modal = document.getElementById('digestModal');
    const summaryEl = document.getElementById('digestModalSummaryText');
    const listEl = document.getElementById('digestModalList');

    if (summaryEl) summaryEl.textContent = summaryText;

    if (listEl) {
        listEl.innerHTML = '';
        eligibleNotices.forEach(notice => {
            const item = document.createElement('div');
            item.className = 'digest-item-card';

            const prio = (notice.priority || 'medium').toLowerCase();
            const dateStr = notice.date ? new Date(notice.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

            item.innerHTML = `
                <div class="digest-item-info">
                    <span class="digest-item-title">${escapeHtml(notice.title)}</span>
                    <span class="digest-item-meta">${escapeHtml(notice.category || 'General')} • ${dateStr}</span>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="openNoticeFromDigest(${notice.id})">
                    View
                </button>
            `;
            listEl.appendChild(item);
        });
    }

    if (modal) {
        modal.style.display = 'flex';
    }

    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification('Daily Notice Digest', {
                body: summaryText,
                icon: 'icon-192.png'
            });
        } catch (err) {
            console.warn('Browser notification error:', err);
        }
    }

    if (isManual) {
        showToast(`Delivered daily digest: ${count} notices`);
    }
}

function closeDigestModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('digestModal');
    if (modal) modal.style.display = 'none';
}

function openNoticeFromDigest(id) {
    closeDigestModal();
    viewNotice(id);
}

// 4. Test Instant Alert Simulation
function triggerTestInstantAlert() {
    const highNotice = appState.notices.find(n => n.priority === 'high') || appState.notices[0] || {
        id: 9999,
        title: 'Urgent: Semester Examination Schedule Update',
        priority: 'high',
        category: 'Academic',
        deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    };

    const isUrgent = isNoticeUnder48Hours(highNotice) || highNotice.priority === 'high';
    const reason = 'Test Alert: High priority communication';

    if (!appState.alertedNoticeIds) appState.alertedNoticeIds = [];
    if (!appState.alertedNoticeIds.includes(highNotice.id)) {
        appState.alertedNoticeIds.push(highNotice.id);
    }

    logNotification('instant', highNotice.id, highNotice.title, reason);
    showAlertBanner(highNotice, reason, isUrgent);
    showToast('Simulated real-time instant alert triggered');

    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification('Instant Notice Alert (Test)', {
                body: highNotice.title,
                icon: 'icon-192.png'
            });
        } catch (err) {
            console.warn('Browser notification error:', err);
        }
    }
}

// 5. Automatic Scheduled Digest Liveness Check
function checkScheduledDailyDigest() {
    if (!appState.user) return;
    const settings = appState.notificationSettings;
    if (!settings || !settings.dailyDigestEnabled) return;

    const now = new Date();
    const currentHour = now.getHours();
    const todayDateStr = now.toISOString().split('T')[0];

    const slot = settings.dailyDigestTime || 'morning';
    let targetHour = 8;
    if (slot === 'afternoon') targetHour = 13;
    else if (slot === 'evening') targetHour = 18;

    const slotKey = `${todayDateStr}_${slot}`;

    if (appState.lastDigestCheckDate === slotKey) {
        return;
    }

    if (currentHour >= targetHour) {
        appState.lastDigestCheckDate = slotKey;
        saveState();
        triggerDailyDigestNow(false);
    }
}

// 6. Settings Sync & Persistence
function updateAlertPreferences() {
    const instantToggle = document.getElementById('instantAlertsToggle');
    const instantScope = document.getElementById('instantAlertsScope');
    const digestToggle = document.getElementById('dailyDigestToggle');
    const digestTime = document.getElementById('digestTimeSelect');
    const catAcademic = document.getElementById('catFilterAcademic');
    const catEvents = document.getElementById('catFilterEvents');
    const catDeadlines = document.getElementById('catFilterDeadlines');
    const catAdmin = document.getElementById('catFilterAdmin');

    const selectedCategories = [];
    if (catAcademic && catAcademic.checked) selectedCategories.push('Academic');
    if (catEvents && catEvents.checked) selectedCategories.push('Events');
    if (catDeadlines && catDeadlines.checked) selectedCategories.push('Deadlines');
    if (catAdmin && catAdmin.checked) selectedCategories.push('Admin');

    const instantEnabled = instantToggle ? instantToggle.checked : true;
    const digestEnabled = digestToggle ? digestToggle.checked : true;

    appState.notificationSettings = {
        instantAlertsEnabled: instantEnabled,
        instantAlertsScope: instantScope ? instantScope.value : 'high_only',
        dailyDigestEnabled: digestEnabled,
        dailyDigestTime: digestTime ? digestTime.value : 'morning',
        categories: selectedCategories
    };

    appState.notificationsEnabled = instantEnabled || digestEnabled;
    appState.notificationsTime = appState.notificationSettings.dailyDigestTime;

    const instantSubgroup = document.getElementById('instantAlertsSubgroup');
    if (instantSubgroup) {
        instantSubgroup.style.opacity = instantEnabled ? '1' : '0.4';
        instantSubgroup.style.pointerEvents = instantEnabled ? 'auto' : 'none';
    }
    const digestSubgroup = document.getElementById('dailyDigestSubgroup');
    if (digestSubgroup) {
        digestSubgroup.style.opacity = digestEnabled ? '1' : '0.4';
        digestSubgroup.style.pointerEvents = digestEnabled ? 'auto' : 'none';
    }

    saveState();

    if (instantEnabled && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function loadNotificationSettings() {
    const s = appState.notificationSettings || {
        instantAlertsEnabled: true,
        instantAlertsScope: 'high_only',
        dailyDigestEnabled: true,
        dailyDigestTime: 'morning',
        categories: ['Academic', 'Events', 'Deadlines', 'Admin']
    };

    const instantToggle = document.getElementById('instantAlertsToggle');
    if (instantToggle) instantToggle.checked = !!s.instantAlertsEnabled;

    const instantScope = document.getElementById('instantAlertsScope');
    if (instantScope) instantScope.value = s.instantAlertsScope || 'high_only';

    const digestToggle = document.getElementById('dailyDigestToggle');
    if (digestToggle) digestToggle.checked = !!s.dailyDigestEnabled;

    const digestTime = document.getElementById('digestTimeSelect');
    if (digestTime) digestTime.value = s.dailyDigestTime || 'morning';

    const cats = s.categories || ['Academic', 'Events', 'Deadlines', 'Admin'];
    const catAcademic = document.getElementById('catFilterAcademic');
    if (catAcademic) catAcademic.checked = cats.includes('Academic');
    const catEvents = document.getElementById('catFilterEvents');
    if (catEvents) catEvents.checked = cats.includes('Events');
    const catDeadlines = document.getElementById('catFilterDeadlines');
    if (catDeadlines) catDeadlines.checked = cats.includes('Deadlines');
    const catAdmin = document.getElementById('catFilterAdmin');
    if (catAdmin) catAdmin.checked = cats.includes('Admin');

    const instantSubgroup = document.getElementById('instantAlertsSubgroup');
    if (instantSubgroup) {
        instantSubgroup.style.opacity = s.instantAlertsEnabled ? '1' : '0.4';
        instantSubgroup.style.pointerEvents = s.instantAlertsEnabled ? 'auto' : 'none';
    }
    const digestSubgroup = document.getElementById('dailyDigestSubgroup');
    if (digestSubgroup) {
        digestSubgroup.style.opacity = s.dailyDigestEnabled ? '1' : '0.4';
        digestSubgroup.style.pointerEvents = s.dailyDigestEnabled ? 'auto' : 'none';
    }

    renderNotificationHistory();
}

// 7. Notification Storage & Audit Logging
function logNotification(type, noticeId, noticeTitle, details = '') {
    if (!appState.notificationLogs) appState.notificationLogs = [];

    const currentUser = appState.user ? appState.user.username : 'All Users';
    const newLog = {
        id: Date.now() + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        type: type, // 'instant' | 'digest'
        noticeId: noticeId || null,
        title: noticeTitle,
        user: currentUser,
        details: details
    };

    appState.notificationLogs.unshift(newLog);
    if (appState.notificationLogs.length > 100) {
        appState.notificationLogs = appState.notificationLogs.slice(0, 100);
    }
    saveState();
    renderNotificationHistory();
}

function renderNotificationHistory() {
    const listEl = document.getElementById('notificationHistoryList');
    const statTotal = document.getElementById('logStatTotal');
    const statAlerted = document.getElementById('logStatAlerted');
    const statDigested = document.getElementById('logStatDigested');

    const logs = appState.notificationLogs || [];
    const alerted = appState.alertedNoticeIds || [];
    const digested = appState.digestedNoticeIds || [];

    if (statTotal) statTotal.textContent = `Total Sent: ${logs.length}`;
    if (statAlerted) statAlerted.textContent = `Alerted IDs: ${alerted.length}`;
    if (statDigested) statDigested.textContent = `Digested IDs: ${digested.length}`;

    if (!listEl) return;
    listEl.innerHTML = '';

    if (logs.length === 0) {
        listEl.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 12px 0; text-align: center;">No notifications logged yet</div>';
        return;
    }

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-entry-row';

        const date = new Date(log.timestamp);
        const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });

        const typeClass = log.type === 'instant' ? 'instant' : 'digest';
        const typeLabel = log.type === 'instant' ? 'INSTANT' : 'DIGEST';

        item.innerHTML = `
            <div class="log-entry-left">
                <span class="log-type-tag ${typeClass}">${typeLabel}</span>
                <span class="log-entry-title" title="${escapeHtml(log.title)}">${escapeHtml(log.title)}</span>
            </div>
            <span class="log-entry-time">${timeFormatted}</span>
        `;
        listEl.appendChild(item);
    });
}

function clearNotificationLogs() {
    if (confirm('Clear notification audit logs and alert history? (This resets duplicate tracking)')) {
        appState.notificationLogs = [];
        appState.alertedNoticeIds = [];
        appState.digestedNoticeIds = [];
        saveState();
        renderNotificationHistory();
        showToast('Notification logs cleared');
    }
}

// Backward-compatible wrappers
function handleNotifToggleChange(isChecked) {
    if (appState.notificationSettings) {
        appState.notificationSettings.instantAlertsEnabled = isChecked;
    }
    updateAlertPreferences();
}

function updateNotifTime() {
    updateAlertPreferences();
}

function sendNotification(title) {
    if (!appState.notificationsEnabled) return;
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New College Notice', {
            body: title,
            icon: 'icon-192.png'
        });
    }
}

// ===== PWA INSTALLATION =====
function setupPWAInstall() {
    const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'flex';
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        if (installBtn) installBtn.style.display = 'none';
        showToast('App installed successfully');
    });
}

function promptInstallApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            const installBtn = document.getElementById('installBtn');
            if (installBtn) installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    });
}

// ===== PULL TO REFRESH =====
function setupPullToRefresh() {
    const homeScreen = document.getElementById('homeScreen');
    if (!homeScreen) return;

    homeScreen.addEventListener('touchstart', (e) => {
        const docScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const screenScroll = homeScreen.scrollTop || 0;
        if (docScroll === 0 && screenScroll === 0) {
            touchStartY = e.touches[0].clientY;
        } else {
            touchStartY = -1;
        }
    }, { passive: true });

    homeScreen.addEventListener('touchend', (e) => {
        if (touchStartY === -1) return;
        const docScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const screenScroll = homeScreen.scrollTop || 0;
        touchEndY = e.changedTouches[0].clientY;

        if (docScroll === 0 && screenScroll === 0 && (touchEndY - touchStartY > 90)) {
            loadNotices();
            showToast('Refreshed notice feed');
        }
    }, { passive: true });
}

// ===== SERVICE WORKER REGISTRATION =====
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('[PWA] Service Worker registered with scope:', reg.scope);
                })
                .catch(err => {
                    console.error('[PWA] Service Worker registration failed:', err);
                });
        });
    }
}

// Kick off when DOM is ready
document.addEventListener('DOMContentLoaded', init);
