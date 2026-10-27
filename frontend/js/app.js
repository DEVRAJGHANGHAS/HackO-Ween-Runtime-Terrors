/**
 * FoodResQ AI — Core Utilities, Scroll Animations & Interactive Experience Engine
 */

// Initialize Theme on immediate execution
(function() {
  if (typeof StorageManager !== 'undefined' && StorageManager.getTheme) {
    const currentTheme = StorageManager.getTheme();
    document.documentElement.setAttribute('data-theme', currentTheme);
  }
})();

// Toast Notifications System
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fa-circle-check',
    danger: 'fa-circle-exclamation',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || 'fa-bell'} text-${type}"></i>
    <div style="flex: 1; font-weight: 500;">${message}</div>
    <button class="toast-close-btn" style="color: var(--color-text-muted); padding: 2px;" aria-label="Close Toast">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  toast.querySelector('.toast-close-btn').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 15);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }
  }, 4000);
}

// Modal Helpers with Smooth Scale & Backdrop
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global click-to-close on modal backdrops
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (e.target.closest('[data-close-modal]')) {
    const targetModalId = e.target.closest('[data-close-modal]').getAttribute('data-close-modal');
    closeModal(targetModalId);
  }
});

// Date & Time Formatting Utilities
function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

function formatTimeRemaining(deadlineIso) {
  const now = new Date().getTime();
  const deadline = new Date(deadlineIso).getTime();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return { text: 'Expired', isUrgent: true, isExpired: true };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours === 0) {
    return { text: `${diffMins}m left`, isUrgent: true, isExpired: false };
  } else if (diffHours < 4) {
    return { text: `${diffHours}h ${diffMins}m left`, isUrgent: true, isExpired: false };
  } else if (diffHours < 24) {
    return { text: `${diffHours}h left`, isUrgent: false, isExpired: false };
  } else {
    const days = Math.floor(diffHours / 24);
    return { text: `${days}d left`, isUrgent: false, isExpired: false };
  }
}

function formatCategory(cat) {
  if (!cat) return '';
  return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Distance Calculation (Haversine formula in km)
function calculateDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2) return 4.5;
  const lat1 = Array.isArray(coord1) ? coord1[0] : coord1.lat;
  const lon1 = Array.isArray(coord1) ? coord1[1] : coord1.lng;
  const lat2 = Array.isArray(coord2) ? coord2[0] : coord2.lat;
  const lon2 = Array.isArray(coord2) ? coord2[1] : coord2.lng;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// CSV Export Utility
function exportToCsv(filename, rows) {
  if (!rows || !rows.length) {
    showToast('No records available to export', 'warning');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Audit CSV report downloaded successfully!', 'success');
}

/**
 * Scroll Reveal Animations via IntersectionObserver
 */
function initScrollReveals() {
  const elements = document.querySelectorAll('.reveal-on-scroll, .reveal-stagger');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/**
 * Animated Number Counters
 * Triggers on scroll into view and counts up smoothly
 */
function initAnimatedCounters() {
  const counters = document.querySelectorAll('[data-counter-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetVal = parseFloat(el.getAttribute('data-counter-target'));
        const prefix = el.getAttribute('data-counter-prefix') || '';
        const suffix = el.getAttribute('data-counter-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-counter-decimals') || '0', 10);
        const duration = 1600; // ms
        const startTime = performance.now();

        function updateCounter(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic: 1 - pow(1 - progress, 3)
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentVal = (targetVal * easeProgress);

          let formatted = decimals > 0 ? currentVal.toFixed(decimals) : Math.floor(currentVal).toLocaleString();
          el.textContent = `${prefix}${formatted}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            let finalFormatted = decimals > 0 ? targetVal.toFixed(decimals) : targetVal.toLocaleString();
            el.textContent = `${prefix}${finalFormatted}${suffix}`;
          }
        }

        requestAnimationFrame(updateCounter);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.25 });

  counters.forEach(c => observer.observe(c));
}

/**
 * Floating Back-To-Top Button
 */
function initBackToTop() {
  let btn = document.getElementById('btnBackToTop');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'btnBackToTop';
    btn.className = 'btn-back-to-top';
    btn.setAttribute('aria-label', 'Scroll back to top');
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    document.body.appendChild(btn);
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Sticky Navbar Scroll State
 */
function initNavbarScrollState() {
  const navbar = document.querySelector('.landing-navbar, .app-header');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 25) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * Interactive Impact / SDG Carbon Calculator
 */
function initImpactCalculator() {
  const slider = document.getElementById('calcMealSlider');
  const input = document.getElementById('calcMealInput');
  const outFoodKg = document.getElementById('calcFoodKg');
  const outCO2e = document.getElementById('calcCO2eKg');
  const outWater = document.getElementById('calcWaterLitres');

  if (!slider && !input) return;

  function updateCalculations(meals) {
    const val = Math.max(1, parseInt(meals, 10) || 0);
    const kgFood = val * 0.42;
    const co2e = kgFood * 2.5;
    const waterL = kgFood * 1000;

    if (slider && slider.value != val) slider.value = val;
    if (input && input.value != val) input.value = val;

    if (outFoodKg) outFoodKg.textContent = `${Math.round(kgFood).toLocaleString()} kg`;
    if (outCO2e) outCO2e.textContent = `${Math.round(co2e).toLocaleString()} kg CO₂e`;
    if (outWater) outWater.textContent = `${Math.round(waterL).toLocaleString()} L`;
  }

  if (slider) {
    slider.addEventListener('input', (e) => updateCalculations(e.target.value));
  }
  if (input) {
    input.addEventListener('input', (e) => updateCalculations(e.target.value));
  }

  updateCalculations(slider ? slider.value : (input ? input.value : 500));
}

/**
 * Interactive Homepage Product Preview Tabs
 */
function initProductPreviewTabs() {
  const tabs = document.querySelectorAll('.preview-tab-btn');
  const panels = document.querySelectorAll('.preview-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-preview-tab');

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// Unified App namespace export for all modules
window.App = {
  showToast,
  openModal,
  closeModal,
  formatDateTime,
  formatTimeRemaining,
  formatCategory,
  calculateDistanceKm,
  exportToCSV: exportToCsv,
  initScrollReveals,
  initAnimatedCounters
};

// Document ready bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveals();
  initAnimatedCounters();
  initBackToTop();
  initNavbarScrollState();
  initImpactCalculator();
  initProductPreviewTabs();
});
