// ===== APP STATE =====
let appState = {
    user: null,
    isAdmin: false,
    notificationsEnabled: false,
    notificationsTime: 'morning',
    notices: []
};

// ===== SAMPLE DATA (with dynamic current dates) =====
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
            title: 'Semester Exam Schedule Released',
            content: 'The official exam schedule for this semester has been released. Please check the student portal for detailed information regarding exam dates, timings, and venues.',
            date: formatDate(0),
            deadline: formatDate(14),
            priority: 'high',
            author: 'Academic Office'
        },
        {
            id: 2,
            title: 'Library Extended Hours During Exams',
            content: 'The library will remain open until 8:00 PM starting next week to support students preparing for upcoming examinations.',
            date: formatDate(-1),
            deadline: null,
            priority: 'medium',
            author: 'Central Library'
        },
        {
            id: 3,
            title: 'Scholarship Application Deadline',
            content: 'Final date to submit annual government and merit scholarship applications. Submit required documents through the college portal.',
            date: formatDate(-2),
            deadline: formatDate(10),
            priority: 'high',
            author: 'Financial Aid Office'
        },
        {
            id: 4,
            title: 'Campus Maintenance Work Notice',
            content: 'Electrical and network maintenance will be conducted in Building C from 10:00 AM to 2:00 PM next Tuesday. Please plan accordingly.',
            date: formatDate(-3),
            deadline: null,
            priority: 'low',
            author: 'Facilities Management'
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
    registerServiceWorker();
    setupPWAInstall();
    setupPullToRefresh();
    setupRouting();

    // Check if user was previously logged in
    if (appState.user) {
        showScreen('homeScreen', false);
        updateFAB();
    } else {
        showScreen('loginScreen', false);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('appState');
        if (saved) {
            appState = { ...appState, ...JSON.parse(saved) };
        } else {
            saveState();
        }
    } catch (e) {
        console.error('Failed to parse appState:', e);
    }
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
function showScreen(screenId, pushHistory = true) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        target.scrollTop = 0;
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
                renderNotices();
            }
        } else if (appState.user) {
            showScreen('homeScreen', false);
            renderNotices();
        } else {
            showScreen('loginScreen', false);
        }
    });
}

function goHome() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    showScreen('homeScreen');
    renderNotices();
}

function openAdmin() {
    if (!appState.isAdmin) {
        showToast('Only administrators can post notices');
        return;
    }
    document.getElementById('noticeTitle').value = '';
    document.getElementById('noticeContent').value = '';
    document.getElementById('noticeDeadline').value = '';
    document.getElementById('noticePriority').value = 'medium';
    showScreen('adminScreen');
}

function openSettings() {
    updateNotifToggle();
    const notifSelect = document.getElementById('notifTime');
    if (notifSelect) {
        notifSelect.value = appState.notificationsTime || 'morning';
    }
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

        const priority = document.createElement('span');
        const prio = (notice.priority || 'medium').toLowerCase();
        priority.className = `notice-priority priority-${prio}`;
        priority.textContent = (notice.priority || 'medium').toUpperCase();

        card.appendChild(content);
        card.appendChild(priority);

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

    // Admin delete button using addEventListener
    if (appState.isAdmin) {
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

function submitNotice() {
    if (!appState.isAdmin) {
        showToast('Unauthorized: Only admins can post notices');
        return;
    }

    const titleInput = document.getElementById('noticeTitle');
    const contentInput = document.getElementById('noticeContent');
    const deadlineInput = document.getElementById('noticeDeadline');
    const priorityInput = document.getElementById('noticePriority');

    const title = titleInput ? titleInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';
    const deadline = deadlineInput ? deadlineInput.value : '';
    const priority = priorityInput ? priorityInput.value : 'medium';

    if (!title || !content) {
        showToast('Please fill in both title and content');
        return;
    }

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

function deleteNotice(id) {
    if (!appState.isAdmin) {
        showToast('Only admins can delete notices');
        return;
    }

    if (confirm('Are you sure you want to delete this notice?')) {
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
    const list = document.getElementById('noticeList');

    document.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            startY = e.touches[0].clientY;
        }
    }, { passive: true });

    document.addEventListener('touchend', e => {
        const homeScreen = document.getElementById('homeScreen');
        if (!homeScreen || !homeScreen.classList.contains('active')) return;

        // Ensure user is at the top of the page/list before triggering pull-to-refresh
        const isAtTop = window.scrollY <= 5 && (!list || list.scrollTop <= 5);
        const touchEndY = e.changedTouches[0].clientY;

        if (isAtTop && (touchEndY - startY) > 90) {
            loadNotices();
            showToast('Refreshed notice feed');
        }
    }, { passive: true });
}

// Start application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
