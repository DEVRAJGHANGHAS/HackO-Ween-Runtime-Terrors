/**
 * FoodResQ AI — Navigation & Header Shell Behavior
 * Unified role management, live notification polling, and real-time Socket.IO integration
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  updateSidebarBadges();
  initHeaderControls();
  fetchUnreadNotificationCount();

  // Periodic polling every 20 seconds
  setInterval(() => {
    fetchUnreadNotificationCount();
    updateSidebarBadges();
  }, 20000);

  // Initialize Socket.IO connection if script is present
  initSocketIO();
});

function initSocketIO() {
  if (typeof io !== 'undefined') {
    try {
      const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
      const user = StorageManager.getUser();
      if (user && user.role) {
        socket.emit('join_role', user.role);
      }

      socket.on('notification:new', (notif) => {
        showToast(notif.title, 'info');
        fetchUnreadNotificationCount();
      });

      socket.on('delivery:updated', () => {
        updateSidebarBadges();
      });
    } catch (e) {
      console.warn('[Socket.IO Notice]', e.message);
    }
  }
}

function initNavigation() {
  const sidebar = document.querySelector('.app-sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');

  // Desktop sidebar collapse toggle
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = sidebar.classList.contains('collapsed') 
          ? 'fa-solid fa-chevron-right' 
          : 'fa-solid fa-chevron-left';
      }
    });
  }

  // Mobile menu toggle
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-open') && 
          !sidebar.contains(e.target) && 
          !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }

  // Highlight active link based on current filename
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'dashboard.html')) {
      link.classList.add('active');
    }
  });

  // Render current user profile in sidebar footer & header
  const user = StorageManager.getUser();
  const userNameEl = document.getElementById('sidebar-user-name');
  const userRoleEl = document.getElementById('sidebar-user-role');
  const userAvatarEl = document.getElementById('sidebar-user-avatar');
  const headerRoleEl = document.getElementById('header-active-role');

  if (userNameEl) userNameEl.textContent = user.name;
  if (userRoleEl) userRoleEl.textContent = `Role: ${user.role ? user.role.toUpperCase() : 'USER'}`;
  if (userAvatarEl) userAvatarEl.textContent = (user.name || 'U').charAt(0);
  if (headerRoleEl) headerRoleEl.textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Admin';
}

async function updateSidebarBadges() {
  let listingsCount = 0;
  let demandsCount = 0;
  let deliveriesCount = 0;

  if (window.ApiClient) {
    try {
      const [listRes, demRes, delRes] = await Promise.all([
        ApiClient.listings.getAll('status=available').catch(() => null),
        ApiClient.demand.getAll('status=pending').catch(() => null),
        ApiClient.deliveries.getAll('status=in_transit').catch(() => null)
      ]);

      if (listRes && (listRes.listings || listRes.data)) {
        listingsCount = (listRes.listings || listRes.data).length;
      }
      if (demRes && (demRes.demands || demRes.data)) {
        demandsCount = (demRes.demands || demRes.data).length;
      }
      if (delRes && (delRes.deliveries || delRes.data)) {
        deliveriesCount = (delRes.deliveries || delRes.data).length;
      }
    } catch (e) {
      // Local fallback
    }
  }

  if (listingsCount === 0) listingsCount = StorageManager.getListings().filter(l => l.status === 'available').length;
  if (demandsCount === 0) demandsCount = StorageManager.getDemands().filter(d => d.status === 'pending').length;
  if (deliveriesCount === 0) deliveriesCount = StorageManager.getDeliveries().filter(d => d.status === 'in_transit' || d.status === 'assigned').length;

  const listingsBadge = document.getElementById('badge-listings-count');
  const demandsBadge = document.getElementById('badge-demands-count');
  const deliveriesBadge = document.getElementById('badge-deliveries-count');

  if (listingsBadge) listingsBadge.textContent = listingsCount;
  if (demandsBadge) demandsBadge.textContent = demandsCount;
  if (deliveriesBadge) deliveriesBadge.textContent = deliveriesCount;
}

function initHeaderControls() {
  // Date indicator
  const dateEl = document.getElementById('header-date-display');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = StorageManager.getTheme();
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      StorageManager.setTheme(nextTheme);
      updateThemeIcon(nextTheme);
      showToast(`Switched to ${nextTheme} theme`, 'info');
    });
    updateThemeIcon(StorageManager.getTheme());
  }

  // Notification dropdown
  const notifBtn = document.getElementById('notif-dropdown-btn');
  const notifMenu = document.getElementById('notif-dropdown-menu');
  if (notifBtn && notifMenu) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifMenu.classList.toggle('show');
      renderNotifications();
    });

    document.addEventListener('click', () => {
      notifMenu.classList.remove('show');
    });
  }

  // Role Switcher menu
  const roleBtn = document.getElementById('role-switcher-btn');
  const roleMenu = document.getElementById('role-switcher-menu');
  if (roleBtn && roleMenu) {
    roleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      roleMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      roleMenu.classList.remove('show');
    });
  }
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun text-warning' : 'fa-solid fa-moon';
  }
}

async function fetchUnreadNotificationCount() {
  const notifBtn = document.getElementById('notif-dropdown-btn');
  if (!notifBtn) return;

  let count = 0;
  if (window.ApiClient && window.ApiClient.notifications) {
    try {
      const res = await ApiClient.notifications.getUnreadCount();
      count = res.unreadCount || 0;
    } catch (e) {
      count = StorageManager.getNotifications().filter(n => !n.read).length;
    }
  } else {
    count = StorageManager.getNotifications().filter(n => !n.read).length;
  }

  let notifDot = notifBtn.querySelector('.notif-dot');
  if (count > 0) {
    if (!notifDot) {
      notifDot = document.createElement('span');
      notifDot.className = 'notif-dot';
      notifBtn.appendChild(notifDot);
    }
    notifDot.style.display = 'block';
  } else if (notifDot) {
    notifDot.style.display = 'none';
  }
}

async function renderNotifications() {
  const container = document.getElementById('notif-items-list');
  if (!container) return;

  container.innerHTML = '<div style="padding: 1rem; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Loading alerts...</div>';

  let notifs = [];
  if (window.ApiClient && window.ApiClient.notifications) {
    try {
      const res = await ApiClient.notifications.getAll();
      notifs = res.notifications || [];
    } catch (e) {
      console.warn('[Notifications] Falling back to local storage:', e.message);
      notifs = StorageManager.getNotifications();
    }
  } else {
    notifs = StorageManager.getNotifications();
  }

  if (!notifs.length) {
    container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--color-text-muted); font-size: 0.85rem;"><i class="fa-solid fa-bell-slash mb-xs" style="font-size: 1.2rem; display: block; opacity: 0.6;"></i>No active notifications</div>';
    return;
  }

  container.innerHTML = notifs.map(n => {
    const isUnread = !n.isRead && !n.read;
    const isUrgent = n.type === 'imminent_expiry' || n.type === 'delivery_failure' || n.type === 'admin_alert';
    const actionUrl = n.actionUrl || 'dashboard.html';

    return `
      <div class="dropdown-item ${isUnread ? 'unread' : ''}" style="cursor: pointer; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border); ${isUnread ? 'background: rgba(16, 185, 129, 0.04);' : ''}" onclick="handleNotifClick('${n._id || n.id}', '${actionUrl}')">
        <i class="fa-solid ${isUrgent ? 'fa-triangle-exclamation text-danger' : 'fa-circle-info text-primary'} mt-1"></i>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text-main);">${n.title}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 2px; line-height: 1.3;">${n.message}</div>
          <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 4px;">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function handleNotifClick(id, url) {
  if (window.ApiClient && window.ApiClient.notifications && id) {
    try {
      await ApiClient.notifications.markRead(id);
    } catch (e) {
      StorageManager.markNotificationRead(id);
    }
  } else {
    StorageManager.markNotificationRead(id);
  }

  fetchUnreadNotificationCount();
  if (url && url !== '#') {
    window.location.href = url;
  }
}

async function markAllNotificationsRead() {
  if (window.ApiClient && window.ApiClient.notifications) {
    try {
      await ApiClient.notifications.markAllRead();
    } catch (e) {
      StorageManager.markAllNotificationsRead();
    }
  } else {
    StorageManager.markAllNotificationsRead();
  }

  fetchUnreadNotificationCount();
  renderNotifications();
  showToast('All notifications marked as read', 'info');
}

/**
 * 1-Click Persona Switcher
 * Real JWT token authentication across all navigation pages
 */
async function switchDemoRole(role) {
  showToast(`Authenticating session as ${role.toUpperCase()}...`, 'info');

  try {
    if (window.ApiClient && window.ApiClient.auth) {
      const res = await ApiClient.auth.simulatePersona(role);
      if (res && res.token) {
        ApiClient.setToken(res.token);
        StorageManager.setUser(res.user);
        showToast(`Active Persona: ${res.user.name} (${res.user.role})`, 'success');
        setTimeout(() => window.location.reload(), 300);
        return;
      }
    }
  } catch (err) {
    console.warn('[Persona Switch] Backend simulation fallback:', err.message);
  }

  // Fallback
  const personas = {
    admin: { name: 'Ananya Deshmukh', role: 'admin', organisationName: 'FoodResQ AI Central Operations' },
    provider: { name: 'Dr. Rameshwar Meena', role: 'provider', organisationName: 'Aryabhatta University Hostel' },
    recipient: { name: 'Sister Teresa David', role: 'recipient', organisationName: 'Asha Community Shelter' },
    driver: { name: 'Rajesh Kumar', role: 'driver', organisationName: 'Gurugram Green EV Logistics' }
  };

  const persona = personas[role] || personas.admin;
  StorageManager.setUser(persona);
  showToast(`Switched persona to: ${persona.name} (${persona.role})`, 'success');
  setTimeout(() => window.location.reload(), 300);
}

// Global window assignments for onclick bindings
if (typeof window !== 'undefined') {
  window.markAllNotificationsRead = markAllNotificationsRead;
  window.switchDemoRole = switchDemoRole;
  window.handleNotifClick = handleNotifClick;
}
