/**
 * FoodResQ AI — Recipient Demand Directory
 * Synchronized with Node.js/Express MongoDB REST API with local fallback
 */

let cachedDemands = [];

document.addEventListener('DOMContentLoaded', () => {
  renderDemands();

  const searchInput = document.getElementById('demand-search');
  const urgencyFilter = document.getElementById('filter-demand-urgency');
  const statusFilter = document.getElementById('filter-demand-status');

  if (searchInput) searchInput.addEventListener('input', () => filterAndDisplayDemands());
  if (urgencyFilter) urgencyFilter.addEventListener('change', () => filterAndDisplayDemands());
  if (statusFilter) statusFilter.addEventListener('change', () => filterAndDisplayDemands());

  const addForm = document.getElementById('add-demand-form');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const category = document.getElementById('dem-category').value;
      const urgency = document.getElementById('dem-urgency').value;
      const quantity = parseInt(document.getElementById('dem-quantity').value, 10);
      const capacity = parseInt(document.getElementById('dem-capacity').value, 10);
      const address = document.getElementById('dem-address').value.trim();
      const special = document.getElementById('dem-special').value.trim();
      const notes = document.getElementById('dem-notes').value.trim();

      const user = StorageManager.getUser();
      const now = new Date();

      const demandPayload = {
        recipientName: user.organisationName || user.organization || 'Community Refuge Shelter',
        category,
        quantityRequested: quantity,
        unit: 'portions',
        urgency,
        preferredDeliveryWindow: {
          start: new Date(now.getTime() + 30 * 60000).toISOString(),
          end: new Date(now.getTime() + 180 * 60000).toISOString()
        },
        receivingCapacity: capacity,
        location: {
          address: address || 'Sector 14, Old DLF, Gurugram, Haryana 122001',
          coordinates: [28.4721, 77.0428]
        },
        specialRequirements: special ? special.split(',').map(s => s.trim()).filter(Boolean) : ['Vegetarian Only'],
        notes
      };

      try {
        if (window.ApiClient && window.ApiClient.demand) {
          const res = await ApiClient.demand.create(demandPayload);
          const created = res.demand || res.data || res;
          StorageManager.addDemand(created);
          showToast(`Demand registered successfully: ${quantity} portions for ${demandPayload.recipientName}`, 'success');
        } else {
          const fallbackDemand = {
            id: `dm_${Date.now()}`,
            ...demandPayload,
            fulfilledQuantity: 0,
            status: 'pending',
            createdAt: now.toISOString()
          };
          StorageManager.addDemand(fallbackDemand);
          showToast(`Demand registered: ${quantity} portions for ${demandPayload.recipientName}`, 'success');
        }
      } catch (err) {
        console.warn('[Demand] API request failed, persisting locally:', err.message);
        const fallbackDemand = {
          id: `dm_${Date.now()}`,
          ...demandPayload,
          fulfilledQuantity: 0,
          status: 'pending',
          createdAt: now.toISOString()
        };
        StorageManager.addDemand(fallbackDemand);
        showToast(`Demand registered (offline): ${quantity} portions`, 'warning');
      }

      closeModal('add-demand-modal');
      addForm.reset();
      await renderDemands();
      if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
    });
  }
});

async function renderDemands() {
  if (window.ApiClient && window.ApiClient.demand) {
    try {
      const res = await ApiClient.demand.getAll();
      const list = res.demands || res.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        cachedDemands = list.map(item => ({
          ...item,
          id: item.id || item._id
        }));
        StorageManager.saveDemands(cachedDemands);
      } else if (Array.isArray(list) && list.length === 0) {
        cachedDemands = [];
        StorageManager.saveDemands([]);
      } else {
        cachedDemands = StorageManager.getDemands();
      }
    } catch (err) {
      console.warn('[Demand] Live API unavailable, loading local store:', err.message);
      cachedDemands = StorageManager.getDemands();
    }
  } else {
    cachedDemands = StorageManager.getDemands();
  }

  filterAndDisplayDemands();
}

function filterAndDisplayDemands() {
  const demands = cachedDemands;
  const search = (document.getElementById('demand-search')?.value || '').toLowerCase();
  const urgency = document.getElementById('filter-demand-urgency')?.value || 'all';
  const status = document.getElementById('filter-demand-status')?.value || 'all';

  const filtered = demands.filter(d => {
    const recName = (d.recipientName || (d.recipientId?.name) || '').toLowerCase();
    const addr = (d.location?.address || '').toLowerCase();
    const cat = (d.category || '').toLowerCase();
    const matchSearch = recName.includes(search) || addr.includes(search) || cat.includes(search);
    const matchUrgency = urgency === 'all' || d.urgency === urgency;
    const matchStatus = status === 'all' || d.status === status;
    return matchSearch && matchUrgency && matchStatus;
  });

  const container = document.getElementById('demands-grid-container');
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-muted);">No recipient requests found matching filters.</div>';
    return;
  }

  container.innerHTML = filtered.map(d => {
    const fulfilled = d.fulfilledQuantity || 0;
    const requested = d.quantityRequested || 0;
    const remaining = Math.max(0, requested - fulfilled);
    const pct = requested > 0 ? Math.min(100, Math.round((fulfilled / requested) * 100)) : 0;
    const itemId = d.id || d._id;
    const recName = d.recipientName || (d.recipientId?.name) || 'Community Shelter';
    const addr = d.location?.address || 'Gurugram, NCR';

    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <span class="text-xs text-primary" style="font-weight: 700; text-transform: uppercase;">${formatCategory(d.category)}</span>
            <span class="badge ${d.urgency === 'critical' ? 'badge-danger' : d.urgency === 'high' ? 'badge-warning' : 'badge-neutral'}">
              <span class="badge-dot"></span> ${d.urgency} urgency
            </span>
          </div>

          <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 0.75rem; cursor: pointer;" onclick="openDemandDetail('${itemId}')">
            ${recName}
          </h3>

          <div style="background: var(--color-surface-subtle); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.85rem;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem;">
              <span class="text-xs text-muted">Still Required:</span>
              <span style="font-size: 1.25rem; font-weight: 900; color: var(--color-text-main);">${remaining} <span class="text-xs text-muted font-normal">${d.unit || 'portions'}</span></span>
            </div>

            <!-- Progress Bar -->
            <div style="width: 100%; height: 6px; background-color: var(--color-border); border-radius: 9999px; overflow: hidden; margin-bottom: 0.35rem;">
              <div style="width: ${pct}%; height: 100%; background-color: var(--color-primary); border-radius: 9999px; transition: width 0.3s ease;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.725rem; color: var(--color-text-muted);">
              <span>Fulfilled: ${fulfilled}</span>
              <span>Target: ${requested}</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.775rem; color: var(--color-text-secondary); margin-bottom: 1rem;">
            <div><i class="fa-solid fa-users" style="width: 16px;"></i> Capacity: <strong>${d.receivingCapacity || 50} seats</strong></div>
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><i class="fa-solid fa-location-dot" style="width: 16px;"></i> ${addr}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--color-border-subtle);">
          <button class="btn btn-ghost btn-sm" onclick="openDemandDetail('${itemId}')">
            <span>View Notes</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
          ${d.status === 'pending' ? `
            <button class="btn btn-ghost btn-sm text-danger" onclick="confirmCancelDemand('${itemId}')" title="Cancel Request">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : `
            <span class="badge badge-brand">${(d.status || '').replace('_', ' ')}</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function openDemandDetail(id) {
  const demand = cachedDemands.find(d => (d.id === id || d._id === id)) || StorageManager.getDemands().find(d => (d.id === id || d._id === id));
  if (!demand) return;

  const titleEl = document.getElementById('demand-detail-title');
  const bodyEl = document.getElementById('demand-detail-body');
  const recName = demand.recipientName || (demand.recipientId?.name) || 'Community Refuge';
  if (titleEl) titleEl.textContent = recName;

  const fulfilled = demand.fulfilledQuantity || 0;
  const requested = demand.quantityRequested || 0;
  const remaining = Math.max(0, requested - fulfilled);
  const addr = demand.location?.address || 'Gurugram, NCR';

  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
        <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md);">
          <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Requested Quantity</div>
          <div style="font-size: 1.35rem; font-weight: 900; margin-top: 0.25rem;">${requested} ${demand.unit || 'portions'}</div>
          <div class="text-xs text-muted">Remaining: ${remaining} ${demand.unit || 'portions'}</div>
        </div>
        <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md);">
          <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Urgency Level</div>
          <div style="margin-top: 0.35rem;">
            <span class="badge ${demand.urgency === 'critical' ? 'badge-danger' : 'badge-warning'}">${(demand.urgency || 'HIGH').toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem;">Dietary &amp; Special Requirements</div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
          ${(demand.specialRequirements || []).map(r => `
            <span class="badge badge-brand">&check; ${r}</span>
          `).join('') || '<span class="text-xs text-muted">Standard food handling acceptable</span>'}
        </div>
      </div>

      <div style="background: var(--color-surface-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.8rem; margin-bottom: 1rem;">
        <div style="font-weight: 700; margin-bottom: 0.25rem;">Dropoff Destination Address</div>
        <div style="color: var(--color-text-secondary);"><i class="fa-solid fa-location-dot text-primary"></i> ${addr}</div>
      </div>

      ${demand.notes ? `
        <div style="font-size: 0.8rem; font-style: italic; color: var(--color-text-secondary);">
          "${demand.notes}"
        </div>
      ` : ''}
    `;
  }

  openModal('view-demand-modal');
}

async function confirmCancelDemand(id) {
  if (confirm('Cancel this meal demand request?')) {
    try {
      if (window.ApiClient && window.ApiClient.demand) {
        await ApiClient.demand.delete(id);
      }
    } catch (err) {
      console.warn('[Demand] Backend delete error, falling back locally:', err.message);
    }
    StorageManager.updateDemand(id, { status: 'cancelled' });
    showToast('Demand request cancelled', 'warning');
    await renderDemands();
    if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
  }
}
