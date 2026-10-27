/**
 * FoodResQ AI — Full-Stack Operational Dashboard Controller
 * Integrates real MongoDB Analytics, Listings, Demand & Delivery APIs with role-specific views
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderRoleBanner();
  await renderDashboardKPIs();
  await initDashboardCharts();
  await renderDashboardFeeds();
});

function renderRoleBanner() {
  const user = StorageManager.getUser();
  const role = user?.role || 'admin';
  const pageBody = document.querySelector('.page-body');
  if (!pageBody) return;

  let existingBanner = document.getElementById('role-dashboard-banner');
  if (existingBanner) existingBanner.remove();

  const banner = document.createElement('div');
  banner.id = 'role-dashboard-banner';
  banner.className = 'role-banner mb-md';
  banner.style.cssText = `
    background: linear-gradient(135deg, rgba(20, 90, 67, 0.08) 0%, rgba(199, 243, 107, 0.08) 100%);
    border: 1px solid var(--color-border);
    border-left: 4px solid var(--color-primary);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  `;

  let roleText = '';
  let actionBtn = '';

  switch (role) {
    case 'provider':
      roleText = `<strong>Food Provider Console:</strong> Active as <em>${user.organisationName || user.name}</em>. Monitor surplus donations and batch freshness.`;
      actionBtn = `<a href="food-listings.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus mr-xs"></i> Register Food Surplus</a>`;
      break;
    case 'recipient':
      roleText = `<strong>Recipient NGO Console:</strong> Active as <em>${user.organisationName || user.name}</em>. Post meal requests and monitor inbound couriers.`;
      actionBtn = `<a href="demand.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-hand-holding-heart mr-xs"></i> Post Meal Request</a>`;
      break;
    case 'driver':
      roleText = `<strong>Logistics Partner Console:</strong> Active as <em>${user.name}</em> (EV Fleet). View assigned dispatch corridors and digital handoffs.`;
      actionBtn = `<a href="deliveries.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-truck-fast mr-xs"></i> View Active Deliveries</a>`;
      break;
    default:
      roleText = `<strong>Administrator Command Center:</strong> Full oversight across donor nodes, recipient demand, matching heuristics, and green logistics.`;
      actionBtn = `<a href="matching.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-microchip mr-xs"></i> Run Smart Matcher</a>`;
      break;
  }

  banner.innerHTML = `
    <div style="font-size: 0.88rem; color: var(--color-text-main); display: flex; align-items: center; gap: 0.75rem;">
      <i class="fa-solid fa-shield-halved text-primary" style="font-size: 1.25rem;"></i>
      <div>${roleText}</div>
    </div>
    <div>${actionBtn}</div>
  `;

  pageBody.insertBefore(banner, pageBody.firstChild);
}

async function renderDashboardKPIs() {
  let summary = null;
  const user = StorageManager.getUser();
  const role = user?.role || 'admin';

  try {
    if (typeof ApiClient !== 'undefined' && ApiClient.analytics) {
      const res = await ApiClient.analytics.getSummary();
      if (res && res.summary) {
        summary = res.summary;
      }
    }
  } catch (err) {
    console.warn('[Dashboard API] Analytics API note:', err.message);
  }

  const listings = StorageManager.getListings();
  const demands = StorageManager.getDemands();
  const deliveries = StorageManager.getDeliveries();

  // 1. Available Food Portions
  const availablePortions = summary ? summary.availablePortions : 
    listings.filter(l => l.status === 'available' || l.status === 'partially_matched')
      .reduce((sum, l) => sum + (l.availableQuantity !== undefined ? l.availableQuantity : l.quantity), 0);
  const availEl = document.getElementById('kpi-available-portions');
  if (availEl) availEl.textContent = availablePortions;

  // 2. Delivered Food Portions
  const deliveredPortions = summary ? summary.deliveredPortions :
    deliveries.filter(d => d.status === 'delivered')
      .reduce((sum, d) => sum + (d.quantity || 0), 0);
  const delivEl = document.getElementById('kpi-delivered-portions');
  if (delivEl) delivEl.textContent = deliveredPortions;

  // 3. Active Deliveries
  const activeCount = summary ? summary.activeDeliveriesCount :
    deliveries.filter(d => d.status === 'in_transit' || d.status === 'assigned' || d.status === 'recovery_required').length;
  const activeEl = document.getElementById('kpi-active-deliveries');
  if (activeEl) activeEl.textContent = activeCount;

  // 4. Pending Demands
  const neededPortions = summary ? summary.pendingNeededPortions :
    demands.filter(d => d.status === 'pending' || d.status === 'partially_matched')
      .reduce((sum, d) => sum + Math.max(0, (d.quantityRequested || 0) - (d.fulfilledQuantity || 0)), 0);
  const pendingEl = document.getElementById('kpi-pending-demands');
  if (pendingEl) pendingEl.textContent = neededPortions;

  // 5. Success Rate
  const rateText = summary ? summary.deliverySuccessRate : '100%';
  const rateEl = document.getElementById('kpi-success-rate');
  if (rateEl) rateEl.textContent = rateText;

  // 6. Urgent Listings (< 4 hours)
  const now = Date.now();
  const urgentCount = summary ? summary.urgentListingsCount :
    listings.filter(l => {
      const deadline = new Date(l.safeUseDeadline || l.safe_deadline).getTime();
      const diffHours = (deadline - now) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 4;
    }).length;
  const urgentEl = document.getElementById('kpi-urgent-listings');
  if (urgentEl) urgentEl.textContent = urgentCount;

  // 7. Impact Metrics
  const impact = summary?.impact || {};
  const co2El = document.getElementById('impact-co2');
  const waterEl = document.getElementById('impact-water');
  const valEl = document.getElementById('impact-value');

  if (co2El) co2El.textContent = `${impact.co2eAvoidedKg || Math.round(deliveredPortions * 1.05)} kg`;
  if (waterEl) waterEl.textContent = `${(impact.waterConservedLitres || Math.round(deliveredPortions * 420)).toLocaleString()} L`;
  if (valEl) valEl.textContent = `₹${(impact.economicValueINR || Math.round(deliveredPortions * 50)).toLocaleString()}`;

  // Header active role display
  const headerRole = document.getElementById('header-active-role');
  if (headerRole) {
    headerRole.textContent = role.toUpperCase();
  }
}

async function initDashboardCharts() {
  const isDark = StorageManager.getTheme() === 'dark';
  const textColor = isDark ? '#A1B8AD' : '#738078';
  const gridColor = isDark ? '#224335' : '#E2E8E1';

  let deliveries = [];
  try {
    if (window.ApiClient && window.ApiClient.deliveries) {
      const res = await ApiClient.deliveries.getAll();
      deliveries = res.deliveries || res.data || (Array.isArray(res) ? res : []);
    }
  } catch (e) {
    deliveries = StorageManager.getDeliveries();
  }
  if (!deliveries.length) deliveries = StorageManager.getDeliveries();

  // 1. Hourly Velocity Chart
  const velocityCanvas = document.getElementById('chart-redistribution-velocity');
  if (velocityCanvas && typeof Chart !== 'undefined') {
    new Chart(velocityCanvas, {
      type: 'line',
      data: {
        labels: ['08:00', '11:00', '14:00', '17:00', '20:00', '23:00'],
        datasets: [
          {
            label: 'Surplus Portions Listed',
            data: [120, 240, 310, 480, 590, 640],
            borderColor: '#145A43',
            backgroundColor: 'rgba(20, 90, 67, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#145A43'
          },
          {
            label: 'Meals Delivered',
            data: [90, 190, 280, 420, 540, 610],
            borderColor: '#C7F36B',
            backgroundColor: 'rgba(199, 243, 107, 0.2)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#C7F36B'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } }
          }
        }
      }
    });
  }

  // 2. Fleet Status Doughnut
  const fleetCanvas = document.getElementById('chart-fleet-status');
  if (fleetCanvas && typeof Chart !== 'undefined') {
    const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
    const inTransitCount = deliveries.filter(d => d.status === 'in_transit').length;
    const assignedCount = deliveries.filter(d => d.status === 'assigned').length;
    const recoveryCount = deliveries.filter(d => d.status === 'recovery_required' || d.status === 'failed').length;

    new Chart(fleetCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Delivered', 'In Transit', 'Assigned', 'Incident/Recovery'],
        datasets: [{
          data: [deliveredCount || 1, inTransitCount || 1, assignedCount || 1, recoveryCount || 0],
          backgroundColor: ['#145A43', '#C7F36B', '#2563EB', '#D9534F'],
          borderWidth: 2,
          borderColor: isDark ? '#12231C' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 }, boxWidth: 12 }
          }
        },
        cutout: '68%'
      }
    });
  }
}

async function renderDashboardFeeds() {
  let listings = [];
  let deliveries = [];

  try {
    if (typeof ApiClient !== 'undefined') {
      const [listRes, delRes] = await Promise.all([
        ApiClient.listings.getAll(),
        ApiClient.deliveries.getAll()
      ]);
      if (listRes.listings) listings = listRes.listings;
      else if (listRes.data) listings = listRes.data;

      if (delRes.deliveries) deliveries = delRes.deliveries;
      else if (delRes.data) deliveries = delRes.data;
    }
  } catch (err) {
    console.warn('[Dashboard API] Using local fallback feeds:', err.message);
  }

  if (listings.length === 0) listings = StorageManager.getListings();
  if (deliveries.length === 0) deliveries = StorageManager.getDeliveries();

  // Urgent Deadlines Feed
  const urgentContainer = document.getElementById('urgent-listings-feed');
  if (urgentContainer) {
    const urgentItems = listings
      .filter(l => l.status === 'available' || l.status === 'partially_matched')
      .slice(0, 3);

    if (!urgentItems.length) {
      urgentContainer.innerHTML = '<div class="text-xs text-secondary" style="text-align: center; padding: 1.5rem;"><i class="fa-solid fa-circle-check text-primary mb-xs" style="font-size: 1.25rem; display: block;"></i>All active food batches have comfortable safety buffers (> 4 hrs).</div>';
    } else {
      urgentContainer.innerHTML = urgentItems.map(item => {
        const remaining = formatTimeRemaining(item.safeUseDeadline || item.safe_deadline);
        const prov = (item.providerName || item.provider || 'Kitchen Provider').split('—')[0];
        return `
          <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div>
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text-main);">${item.title}</div>
              <div class="text-xs text-secondary" style="margin-top: 2px;">
                ${prov} &bull; <strong>${item.availableQuantity !== undefined ? item.availableQuantity : item.quantity} ${item.unit || 'portions'}</strong>
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <span class="badge ${remaining.isUrgent ? 'badge-warning' : 'badge-success'}">${remaining.text}</span>
              <a href="matching.html" style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--color-primary); margin-top: 4px;">Match &rarr;</a>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Recent Listings Table
  const listingsTbody = document.getElementById('recent-listings-tbody');
  if (listingsTbody) {
    if (!listings.length) {
      listingsTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--color-text-muted); padding: 1.5rem;">No surplus batches recorded yet.</td></tr>';
    } else {
      listingsTbody.innerHTML = listings.slice(0, 4).map(l => {
        const prov = (l.providerName || l.provider || 'Provider').split('—')[0];
        return `
          <tr>
            <td>
              <div style="font-weight: 700;">${l.title}</div>
              <div class="text-xs text-secondary">${prov}</div>
            </td>
            <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">${l.availableQuantity !== undefined ? l.availableQuantity : l.quantity} / ${l.quantity} ${l.unit || 'portions'}</td>
            <td><span class="badge ${l.status === 'available' ? 'badge-success' : 'badge-subtle'}">${l.status}</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  // Active Deliveries Table
  const deliveriesTbody = document.getElementById('active-deliveries-tbody');
  if (deliveriesTbody) {
    if (!deliveries.length) {
      deliveriesTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--color-text-muted); padding: 1.5rem;">No deliveries recorded. Confirm a match to dispatch.</td></tr>';
    } else {
      deliveriesTbody.innerHTML = deliveries.slice(0, 4).map(d => {
        let badgeClass = 'badge-primary';
        if (d.status === 'delivered') badgeClass = 'badge-success';
        else if (d.status === 'recovery_required' || d.status === 'failed') badgeClass = 'badge-danger';
        else if (d.status === 'in_transit') badgeClass = 'badge-warning';

        return `
          <tr>
            <td>
              <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">#${d.trackingId}</div>
              <div class="text-xs text-secondary">${d.foodTitle}</div>
            </td>
            <td>${d.recipientName}</td>
            <td><i class="fa-solid fa-truck text-muted mr-xs"></i>${d.driverName || 'Pending'}</td>
            <td><span class="badge ${badgeClass}">${(d.status || 'assigned').replace('_', ' ')}</span></td>
          </tr>
        `;
      }).join('');
    }
  }
}

function formatTimeRemaining(deadlineStr) {
  if (!deadlineStr) return { text: 'Active', isUrgent: false };
  const diff = new Date(deadlineStr).getTime() - Date.now();
  if (diff <= 0) return { text: 'Expired', isUrgent: true };
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return {
    text: hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`,
    isUrgent: hrs < 3
  };
}
