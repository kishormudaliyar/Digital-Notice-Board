// ===== APP STATE =====
let appState = {
    user: null,
    isAdmin: false,
    notificationsEnabled: false,
    notificationsTime: 'morning',
    currentView: 'feed', // 'feed' | 'deadlines'
    deadlineColors: {
        urgent: '#c62828',  // < 48 hours (Red)
        upcoming: '#e65100', // < 7 days (Orange)
        later: '#2e7d32'    // > 7 days (Green)
    },
    notices: []
};

// ===== SAMPLE DATA (with dynamic current dates covering all urgency tiers) =====
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
            author: 'Examination Cell'
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
            author: 'Computer Science Dept'
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
        appState.notices = saved ? JSON.parse(saved) : getSampleNotices();
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

        saveNotices();
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
            author: authorName
        };

        appState.notices.unshift(newNotice);
        saveNotices();

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

function addReminder(id) {
    const notice = appState.notices.find(n => n.id === Number(id));
    if (!notice) return;

    if (notice.deadline) {
        showToast(`Reminder scheduled for deadline: ${notice.deadline}`);
    } else {
        showToast('Reminder noted for this announcement');
    }
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
