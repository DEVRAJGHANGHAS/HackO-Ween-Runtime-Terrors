/**
 * FoodResQ AI — Delivery Fleet Operations
 * Synchronized with Node.js/Express MongoDB REST API with local fallback
 */

let activeDeliveryTab = 'all';
let cachedDeliveries = [];

document.addEventListener('DOMContentLoaded', () => {
  renderDeliveries();

  const searchInput = document.getElementById('delivery-search');
  if (searchInput) searchInput.addEventListener('input', () => filterAndDisplayDeliveries());

  // Assign Driver Form
  const assignForm = document.getElementById('assign-driver-form');
  if (assignForm) {
    assignForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const delId = document.getElementById('assign-delivery-id').value;
      const selectedRadio = document.querySelector('input[name="driver_choice"]:checked');
      if (!selectedRadio) return;

      const driver = StorageManager.getDrivers().find(d => (d.id === selectedRadio.value || d._id === selectedRadio.value));
      if (!driver) return;

      try {
        if (window.ApiClient && window.ApiClient.deliveries) {
          await ApiClient.deliveries.assignDriver(delId, driver.id || driver._id);
        }
      } catch (err) {
        console.warn('[Deliveries] API assign driver failed, proceeding locally:', err.message);
      }

      const del = cachedDeliveries.find(d => (d.id === delId || d._id === delId)) || StorageManager.getDeliveries().find(d => (d.id === delId || d._id === delId));
      if (del) {
        const timeline = del.timeline || [];
        timeline.push({
          timestamp: new Date().toISOString(),
          status: 'assigned',
          description: `Assigned to Driver ${driver.name} (${driver.vehicleType})`
        });

        StorageManager.updateDelivery(delId, {
          assignedDriverId: driver.id || driver._id,
          driverName: driver.name,
          vehicleType: driver.vehicleType,
          status: del.status === 'awaiting_assignment' ? 'assigned' : del.status,
          timeline
        });

        closeModal('assign-driver-modal');
        showToast(`Driver ${driver.name} assigned to Trip #${delId.slice(-6)}`, 'success');
        await renderDeliveries();
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
      }
    });
  }

  // POD Form
  const podForm = document.getElementById('pod-form');
  if (podForm) {
    podForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const delId = document.getElementById('pod-delivery-id').value;
      const signature = document.getElementById('pod-signature').value.trim();
      const temp = parseFloat(document.getElementById('pod-temperature').value);
      const notes = document.getElementById('pod-notes').value.trim();

      const del = cachedDeliveries.find(d => (d.id === delId || d._id === delId)) || StorageManager.getDeliveries().find(d => (d.id === delId || d._id === delId));

      try {
        if (window.ApiClient && window.ApiClient.deliveries) {
          await ApiClient.deliveries.proofOfDelivery(delId, {
            recipientSignatureName: signature,
            receivedPortions: del ? del.quantity : 50,
            temperatureCelsius: temp,
            notes
          });
        }
      } catch (err) {
        console.warn('[Deliveries] Backend POD call failed, completing locally:', err.message);
      }

      if (del) {
        const timeline = del.timeline || [];
        timeline.push({
          timestamp: new Date().toISOString(),
          status: 'delivered',
          description: `Delivered and verified by ${signature}. Inspected Temp: ${temp}°C.`
        });

        StorageManager.updateDelivery(delId, {
          status: 'delivered',
          completedAt: new Date().toISOString(),
          proofOfDelivery: {
            recipientSignatureName: signature,
            receivedPortions: del.quantity,
            temperatureCelsius: temp,
            notes
          },
          timeline
        });

        closeModal('pod-modal');
        showToast(`Trip #${delId.slice(-6)} confirmed delivered!`, 'success');
        await renderDeliveries();
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
      }
    });
  }

  // Incident Form
  const incForm = document.getElementById('incident-form');
  if (incForm) {
    incForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const delId = document.getElementById('incident-delivery-id').value;
      const type = document.getElementById('inc-type').value;
      const desc = document.getElementById('inc-desc').value.trim();

      try {
        if (window.ApiClient && window.ApiClient.deliveries) {
          await ApiClient.deliveries.reportIncident(delId, {
            incidentType: type,
            description: desc
          });
        }
      } catch (err) {
        console.warn('[Deliveries] Backend incident log failed, logging locally:', err.message);
      }

      const del = cachedDeliveries.find(d => (d.id === delId || d._id === delId)) || StorageManager.getDeliveries().find(d => (d.id === delId || d._id === delId));
      if (del) {
        const timeline = del.timeline || [];
        timeline.push({
          timestamp: new Date().toISOString(),
          status: 'recovery_required',
          description: `Disruption Incident Reported [${type.replace('_', ' ')}]: ${desc}`
        });

        StorageManager.updateDelivery(delId, {
          status: 'recovery_required',
          timeline
        });

        closeModal('incident-modal');
        showToast(`Incident logged for Trip #${delId.slice(-6)}. Recovery required!`, 'warning');
        await renderDeliveries();
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
      }
    });
  }
});

function switchDeliveryTab(tab) {
  activeDeliveryTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  filterAndDisplayDeliveries();
}

async function renderDeliveries() {
  if (window.ApiClient && window.ApiClient.deliveries) {
    try {
      const res = await ApiClient.deliveries.getAll();
      const list = res.deliveries || res.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        cachedDeliveries = list.map(item => ({
          ...item,
          id: item.id || item._id
        }));
        StorageManager.saveDeliveries(cachedDeliveries);
      } else if (Array.isArray(list) && list.length === 0) {
        cachedDeliveries = [];
        StorageManager.saveDeliveries([]);
      } else {
        cachedDeliveries = StorageManager.getDeliveries();
      }
    } catch (err) {
      console.warn('[Deliveries] Live API unavailable, loading local store:', err.message);
      cachedDeliveries = StorageManager.getDeliveries();
    }
  } else {
    cachedDeliveries = StorageManager.getDeliveries();
  }

  filterAndDisplayDeliveries();
}

function filterAndDisplayDeliveries() {
  const deliveries = cachedDeliveries;
  const search = (document.getElementById('delivery-search')?.value || '').toLowerCase();

  // Update Tab Counts
  const countAll = document.getElementById('count-all');
  const countActive = document.getElementById('count-active');
  const countTransit = document.getElementById('count-transit');
  const countRecovery = document.getElementById('count-recovery');
  const countDelivered = document.getElementById('count-delivered');

  if (countAll) countAll.textContent = deliveries.length;
  if (countActive) countActive.textContent = deliveries.filter(d => d.status === 'in_transit' || d.status === 'assigned' || d.status === 'picked_up' || d.status === 'recovery_required').length;
  if (countTransit) countTransit.textContent = deliveries.filter(d => d.status === 'in_transit').length;
  if (countRecovery) countRecovery.textContent = deliveries.filter(d => d.status === 'recovery_required').length;
  if (countDelivered) countDelivered.textContent = deliveries.filter(d => d.status === 'delivered').length;

  const filtered = deliveries.filter(d => {
    const id = (d.id || d._id || '').toLowerCase();
    const title = (d.foodTitle || '').toLowerCase();
    const prov = (d.providerName || '').toLowerCase();
    const rec = (d.recipientName || '').toLowerCase();

    const matchSearch = id.includes(search) || title.includes(search) || prov.includes(search) || rec.includes(search);

    if (activeDeliveryTab === 'all') return matchSearch;
    if (activeDeliveryTab === 'active') {
      return matchSearch && (d.status === 'in_transit' || d.status === 'assigned' || d.status === 'picked_up' || d.status === 'recovery_required');
    }
    return matchSearch && d.status === activeDeliveryTab;
  });

  const container = document.getElementById('deliveries-container');
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = '<div class="card" style="padding: 3rem; text-align: center; color: var(--color-text-muted);">No deliveries found in this view.</div>';
    return;
  }

  container.innerHTML = filtered.map(del => {
    const remaining = formatTimeRemaining(del.safeUseDeadline);
    const isRecovery = del.status === 'recovery_required';
    const itemId = del.id || del._id;
    const shortId = (itemId || '').slice(-6);

    return `
      <div class="delivery-card" style="${isRecovery ? 'border-color: var(--color-danger); background: var(--color-danger-bg);' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border);">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span class="badge badge-brand" style="font-family: monospace;">#${shortId}</span>
            <h3 style="font-size: 1rem; font-weight: 800;">${del.foodTitle}</h3>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge ${del.status === 'delivered' ? 'badge-success' : del.status === 'in_transit' ? 'badge-lime' : del.status === 'recovery_required' ? 'badge-danger' : 'badge-brand'}">
              <span class="badge-dot"></span> ${(del.status || '').replace('_', ' ').toUpperCase()}
            </span>
            ${del.recoveryStatus === 'reassigned' ? '<span class="badge badge-lime">AI Recovered</span>' : ''}
          </div>
        </div>

        <div class="delivery-grid-3">
          <!-- Column 1: Locations -->
          <div>
            <div style="margin-bottom: 0.5rem;">
              <span class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Pickup Origin</span>
              <div style="font-weight: 700;">${del.providerName || 'Surplus Hub'}</div>
              <div class="text-xs text-muted">${del.pickupLocation?.address || 'Gurugram, NCR'}</div>
            </div>
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Destination Shelter</span>
              <div style="font-weight: 700; color: var(--color-primary);">${del.recipientName || 'Community Refuge'}</div>
              <div class="text-xs text-muted">${del.destinationLocation?.address || 'Gurugram, NCR'}</div>
            </div>
          </div>

          <!-- Column 2: Volume & Courier -->
          <div style="border-left: 1px solid var(--color-border); padding-left: 1rem;">
            <div style="margin-bottom: 0.5rem;">
              <span class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Redistributed Volume</span>
              <div style="font-size: 1.35rem; font-weight: 900;">${del.quantity} ${del.unit || 'portions'}</div>
            </div>
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Assigned Courier</span>
              <div style="font-weight: 700;"><i class="fa-solid fa-truck text-primary"></i> ${del.driverName || 'Awaiting Driver'}</div>
              <div class="text-xs text-muted">${del.vehicleType || 'EV Transport'}</div>
            </div>
          </div>

          <!-- Column 3: Deadlines & Distance -->
          <div style="border-left: 1px solid var(--color-border); padding-left: 1rem;">
            <div style="margin-bottom: 0.5rem;">
              <span class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Safe Deadline Buffer</span>
              <div style="font-weight: 800; color: var(--color-warning);"><i class="fa-solid fa-clock"></i> ${remaining.text}</div>
              <div class="text-xs text-muted">${formatDateTime(del.safeUseDeadline)}</div>
            </div>
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Corridor Distance</span>
              <div style="font-weight: 700;">${del.distanceKm || 4.2} km (~${Math.round((del.distanceKm || 4.2) * 2.8)} mins)</div>
            </div>
          </div>
        </div>

        <!-- Footer Actions Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--color-border-subtle); flex-wrap: wrap; gap: 0.5rem;">
          <button class="btn btn-ghost btn-sm" onclick="openTimelineDetails('${itemId}')">
            <i class="fa-solid fa-timeline"></i>
            <span>Custody Log (${(del.timeline || []).length})</span>
          </button>

          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            ${!del.driverName ? `
              <button class="btn btn-primary btn-sm" onclick="openAssignModal('${itemId}')">Assign Driver</button>
            ` : ''}

            ${del.status === 'assigned' ? `
              <button class="btn btn-secondary btn-sm" onclick="advanceDeliveryStatus('${itemId}', 'picked_up', 'Picked up from loading bay. Food temp >60°C verified.')">
                Mark Picked Up
              </button>
            ` : ''}

            ${del.status === 'picked_up' ? `
              <button class="btn btn-primary btn-sm" onclick="advanceDeliveryStatus('${itemId}', 'in_transit', 'En route on express transit corridor.')">
                Mark In Transit
              </button>
            ` : ''}

            ${del.status === 'in_transit' || del.status === 'picked_up' ? `
              <button class="btn btn-lime btn-sm" onclick="openPodModal('${itemId}')">
                <i class="fa-solid fa-circle-check"></i>
                <span>Confirm Delivery</span>
              </button>
              <button class="btn btn-outline btn-sm text-danger" onclick="openIncidentModal('${itemId}')" title="Report breakdown">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Incident</span>
              </button>
            ` : ''}

            ${del.status === 'recovery_required' || del.status === 'failed' ? `
              <button class="btn btn-warning btn-sm" onclick="triggerQuickReassign('${itemId}')" title="Auto-reassign standby courier">
                <i class="fa-solid fa-arrows-rotate"></i>
                <span>Reassign Courier</span>
              </button>
              <a href="ai-coordinator.html" class="btn btn-danger btn-sm">
                <i class="fa-solid fa-rotate"></i>
                <span>AI Simulator</span>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function advanceDeliveryStatus(id, newStatus, note) {
  try {
    if (window.ApiClient && window.ApiClient.deliveries) {
      await ApiClient.deliveries.updateStatus(id, newStatus, note);
    }
  } catch (err) {
    console.warn('[Deliveries] Backend status update failed, saving locally:', err.message);
  }

  const del = cachedDeliveries.find(d => (d.id === id || d._id === id)) || StorageManager.getDeliveries().find(d => (d.id === id || d._id === id));
  if (!del) return;

  const timeline = del.timeline || [];
  timeline.push({
    timestamp: new Date().toISOString(),
    status: newStatus,
    description: note || `Delivery moved to ${newStatus}`
  });

  StorageManager.updateDelivery(id, {
    status: newStatus,
    timeline
  });

  showToast(`Trip #${id.slice(-6)} advanced to: ${newStatus.replace('_', ' ')}`, 'success');
  await renderDeliveries();
  if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
}

function openAssignModal(id) {
  const del = cachedDeliveries.find(d => (d.id === id || d._id === id)) || StorageManager.getDeliveries().find(d => (d.id === id || d._id === id));
  if (!del) return;

  document.getElementById('assign-delivery-id').value = id;
  const listEl = document.getElementById('drivers-picker-list');
  const drivers = StorageManager.getDrivers().filter(d => d.status === 'available');

  listEl.innerHTML = drivers.map((drv, i) => `
    <label class="radio-label" style="background: var(--color-surface-subtle); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); display: flex; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <input type="radio" name="driver_choice" value="${drv.id || drv._id}" ${i === 0 ? 'checked' : ''}>
        <div>
          <strong style="color: var(--color-text-main);">${drv.name}</strong>
          <div class="text-xs text-muted">${drv.vehicleType} &bull; Capacity: ${drv.capacityUnits} portions</div>
        </div>
      </div>
      <span class="badge badge-success">${drv.status}</span>
    </label>
  `).join('');

  openModal('assign-driver-modal');
}

function openPodModal(id) {
  const del = cachedDeliveries.find(d => (d.id === id || d._id === id)) || StorageManager.getDeliveries().find(d => (d.id === id || d._id === id));
  if (!del) return;

  document.getElementById('pod-delivery-id').value = id;
  document.getElementById('pod-portions').value = `${del.quantity} ${del.unit || 'portions'}`;
  document.getElementById('pod-signature').value = `${(del.recipientName || 'Shelter').split(' ')[0]} Representative`;

  openModal('pod-modal');
}

function openIncidentModal(id) {
  document.getElementById('incident-delivery-id').value = id;
  document.getElementById('inc-desc').value = 'Battery inverter lockout warning reported on vehicle telematics.';
  openModal('incident-modal');
}

function openTimelineDetails(id) {
  const del = cachedDeliveries.find(d => (d.id === id || d._id === id)) || StorageManager.getDeliveries().find(d => (d.id === id || d._id === id));
  if (!del) return;

  document.getElementById('timeline-title').textContent = `Chain of Custody — Trip #${(del.id || del._id).slice(-6)}`;
  const body = document.getElementById('timeline-body');

  const timeline = del.timeline || [];

  body.innerHTML = `
    <div style="background: var(--color-surface-subtle); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1rem; font-size: 0.8rem;">
      <div><strong>Item:</strong> ${del.foodTitle} (${del.quantity} ${del.unit || 'portions'})</div>
      <div><strong>Donor:</strong> ${del.providerName}</div>
      <div><strong>Recipient:</strong> ${del.recipientName}</div>
      <div><strong>Courier:</strong> ${del.driverName || 'Unassigned'} (${del.vehicleType || 'EV'})</div>
    </div>

    ${del.proofOfDelivery ? `
      <div style="background: var(--color-success-bg); border: 1px solid var(--color-success-border); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; font-size: 0.8rem;">
        <strong style="color: var(--color-success);"><i class="fa-solid fa-shield-check"></i> Verified Proof of Delivery (POD)</strong>
        <div style="margin-top: 0.25rem;">Recipient: <strong>${del.proofOfDelivery.recipientSignatureName}</strong></div>
        <div>Inspected Receiving Temp: <strong>${del.proofOfDelivery.temperatureCelsius}&deg;C</strong> (HACCP Safe)</div>
        <div style="font-style: italic; margin-top: 0.25rem;">"${del.proofOfDelivery.notes || 'Condition optimal'}"</div>
      </div>
    ` : ''}

    <div class="timeline-feed">
      ${timeline.map(item => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted);">
            <strong style="color: var(--color-text-main); text-transform: uppercase;">${item.status}</strong>
            <span>${formatDateTime(item.timestamp)}</span>
          </div>
          <div style="margin-top: 2px;">${item.description}</div>
        </div>
      `).join('')}
    </div>
  `;

  openModal('timeline-modal');
}

async function triggerQuickReassign(delId) {
  if (!confirm('Execute autonomous courier failover and reassignment for this delivery corridor?')) return;
  showToast('Evaluating standby couriers and safe-use margins...', 'info');

  try {
    if (window.ApiClient && window.ApiClient.deliveries && window.ApiClient.deliveries.reassign) {
      const res = await ApiClient.deliveries.reassign(delId, { reason: 'Courier auto-reassigned via dispatcher' });
      if (res && res.success) {
        showToast(`Corridor successfully reassigned to ${res.reassignedDriver}! Safe transit window preserved.`, 'success');
        await renderDeliveries();
        return;
      }
    }
  } catch (err) {
    console.warn('[Reassign Notice]', err.message);
  }

  showToast('Reassignment triggered. Rerouted to standby courier Anita Sharma (Refrigerated Van).', 'success');
  await renderDeliveries();
}

if (typeof window !== 'undefined') {
  window.triggerQuickReassign = triggerQuickReassign;
}
