/**
 * FoodResQ AI — Food Listings Management
 * Synchronized with Node.js/Express MongoDB REST API with local fallback
 */

let currentViewMode = 'grid';
let cachedListings = [];

document.addEventListener('DOMContentLoaded', () => {
  renderListings();

  // Search input
  const searchInput = document.getElementById('listing-search');
  if (searchInput) searchInput.addEventListener('input', () => filterAndDisplayListings());

  // Filter dropdowns
  const catFilter = document.getElementById('filter-category');
  const statusFilter = document.getElementById('filter-status');
  const sortBy = document.getElementById('sort-by');

  if (catFilter) catFilter.addEventListener('change', () => filterAndDisplayListings());
  if (statusFilter) statusFilter.addEventListener('change', () => filterAndDisplayListings());
  if (sortBy) sortBy.addEventListener('change', () => filterAndDisplayListings());

  // Add Listing Form submit
  const addForm = document.getElementById('add-listing-form');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('new-title').value.trim();
      const category = document.getElementById('new-category').value;
      const quantity = parseInt(document.getElementById('new-quantity').value, 10);
      const unit = document.getElementById('new-unit').value;
      const safeHours = parseFloat(document.getElementById('new-safe-hours').value);
      const storage = document.getElementById('new-storage').value.trim();
      const address = document.getElementById('new-address').value.trim();
      const notes = document.getElementById('new-notes').value.trim();
      const dietary = document.getElementById('new-dietary').value;

      const user = StorageManager.getUser();
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + safeHours * 60);

      const listingPayload = {
        title,
        category,
        quantity,
        availableQuantity: quantity,
        unit,
        safeUseDeadline: deadline.toISOString(),
        pickupLocation: {
          address: address || 'Sector 29, Gurugram, Haryana 122001',
          coordinates: [28.4595, 77.0988]
        },
        storageRequirements: storage,
        dietaryType: dietary,
        allergenInfo: ['Contains Dairy'],
        notes,
        providerName: user.organisationName || user.organization || 'Registered Provider'
      };

      try {
        if (window.ApiClient && window.ApiClient.listings) {
          const res = await ApiClient.listings.create(listingPayload);
          const created = res.listing || res.data || res;
          StorageManager.addListing(created);
          showToast(`Surplus registered successfully: ${quantity} ${unit} of ${title}`, 'success');
        } else {
          const fallbackListing = {
            id: `fl_${Date.now()}`,
            ...listingPayload,
            status: 'available',
            createdAt: new Date().toISOString()
          };
          StorageManager.addListing(fallbackListing);
          showToast(`Surplus registered: ${quantity} ${unit} of ${title}`, 'success');
        }
      } catch (err) {
        console.warn('[FoodListings] API post failed, persisting locally:', err.message);
        const fallbackListing = {
          id: `fl_${Date.now()}`,
          ...listingPayload,
          status: 'available',
          createdAt: new Date().toISOString()
        };
        StorageManager.addListing(fallbackListing);
        showToast(`Surplus registered (offline): ${quantity} ${unit} of ${title}`, 'warning');
      }

      closeModal('add-listing-modal');
      addForm.reset();
      await renderListings();
      if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
    });
  }
});

function switchView(mode) {
  currentViewMode = mode;
  const gridContainer = document.getElementById('listings-grid-container');
  const tableContainer = document.getElementById('listings-table-container');
  const gridBtn = document.getElementById('btn-view-grid');
  const tableBtn = document.getElementById('btn-view-table');

  if (mode === 'grid') {
    gridContainer.style.display = 'grid';
    tableContainer.style.display = 'none';
    gridBtn.classList.add('active');
    tableBtn.classList.remove('active');
  } else {
    gridContainer.style.display = 'none';
    tableContainer.style.display = 'block';
    tableBtn.classList.add('active');
    gridBtn.classList.remove('active');
  }
  filterAndDisplayListings();
}

async function renderListings() {
  if (window.ApiClient && window.ApiClient.listings) {
    try {
      const res = await ApiClient.listings.getAll();
      const list = res.listings || res.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        cachedListings = list.map(item => ({
          ...item,
          id: item.id || item._id
        }));
        StorageManager.saveListings(cachedListings);
      } else if (Array.isArray(list) && list.length === 0) {
        cachedListings = [];
        StorageManager.saveListings([]);
      } else {
        cachedListings = StorageManager.getListings();
      }
    } catch (err) {
      console.warn('[FoodListings] Live API unavailable, loading local store:', err.message);
      cachedListings = StorageManager.getListings();
    }
  } else {
    cachedListings = StorageManager.getListings();
  }

  filterAndDisplayListings();
}

function filterAndDisplayListings() {
  const listings = cachedListings;
  const searchTerm = (document.getElementById('listing-search')?.value || '').toLowerCase();
  const selectedCat = document.getElementById('filter-category')?.value || 'all';
  const selectedStatus = document.getElementById('filter-status')?.value || 'all';
  const sortBy = document.getElementById('sort-by')?.value || 'deadline';

  const filtered = listings.filter(item => {
    const title = (item.title || '').toLowerCase();
    const provName = (item.providerName || (item.providerId?.name) || '').toLowerCase();
    const matchSearch = title.includes(searchTerm) || provName.includes(searchTerm);
    const matchCat = selectedCat === 'all' || item.category === selectedCat;
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchSearch && matchCat && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.safeUseDeadline).getTime() - new Date(b.safeUseDeadline).getTime();
    } else if (sortBy === 'quantity') {
      return (b.availableQuantity || b.quantity || 0) - (a.availableQuantity || a.quantity || 0);
    } else {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  const gridContainer = document.getElementById('listings-grid-container');
  const tableTbody = document.getElementById('listings-table-tbody');

  if (!filtered.length) {
    const emptyMsg = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-muted);">No food listings found matching filter criteria.</div>';
    if (gridContainer) gridContainer.innerHTML = emptyMsg;
    if (tableTbody) tableTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No listings found.</td></tr>`;
    return;
  }

  // Render Grid
  if (gridContainer) {
    gridContainer.innerHTML = filtered.map(item => {
      const remaining = formatTimeRemaining(item.safeUseDeadline);
      const isUrgent = remaining.isUrgent;
      const provName = item.providerName || item.providerId?.name || 'Local Kitchen Provider';
      const address = item.pickupLocation?.address || 'Gurugram Central Hub';
      const itemId = item.id || item._id;

      return `
        <div class="listing-card">
          <div>
            <div class="listing-card-header">
              <span class="listing-provider">${provName}</span>
              <span class="badge ${isUrgent ? 'badge-warning' : 'badge-success'}">
                <span class="badge-dot"></span> ${remaining.text}
              </span>
            </div>

            <h3 class="listing-title" onclick="openListingDetail('${itemId}')" style="cursor: pointer;">
              ${item.title}
            </h3>

            <div class="listing-portions-banner">
              <div>
                <span class="listing-portions-val">${item.availableQuantity !== undefined ? item.availableQuantity : item.quantity}</span>
                <span class="text-xs text-muted">/ ${item.quantity} ${item.unit}</span>
              </div>
              <span class="badge badge-neutral">${formatCategory(item.category)}</span>
            </div>

            <div class="listing-details-list">
              <div class="listing-details-item">
                <i class="fa-solid fa-temperature-three-quarters"></i>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.storageRequirements || 'Ambient Sealed'}</span>
              </div>
              <div class="listing-details-item">
                <i class="fa-solid fa-location-dot"></i>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${address}</span>
              </div>
              <div class="listing-details-item">
                <i class="fa-solid fa-clock"></i>
                <span>Deadline: <strong>${formatDateTime(item.safeUseDeadline)}</strong></span>
              </div>
            </div>
          </div>

          <div class="listing-card-footer">
            <button class="btn btn-ghost btn-sm" onclick="openListingDetail('${itemId}')">
              <span>Inspect Details</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
            <div style="display: flex; gap: 0.35rem;">
              ${item.status === 'available' ? `
                <button class="btn btn-ghost btn-sm text-danger" onclick="confirmCancelListing('${itemId}')" title="Cancel Batch">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              ` : `
                <span class="badge badge-brand">${item.status}</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Table
  if (tableTbody) {
    tableTbody.innerHTML = filtered.map(item => {
      const remaining = formatTimeRemaining(item.safeUseDeadline);
      const provName = (item.providerName || item.providerId?.name || 'Local Kitchen Provider').split('—')[0];
      const itemId = item.id || item._id;

      return `
        <tr>
          <td>
            <div style="font-weight: 700;">${item.title}</div>
            <div class="text-xs text-muted">${formatCategory(item.category)} &bull; ${item.dietaryType || 'Standard'}</div>
          </td>
          <td>${provName}</td>
          <td style="font-family: monospace; font-weight: 800;">${item.availableQuantity !== undefined ? item.availableQuantity : item.quantity} ${item.unit}</td>
          <td><span class="badge ${remaining.isUrgent ? 'badge-warning' : 'badge-success'}">${remaining.text}</span></td>
          <td style="font-size: 0.75rem; color: var(--color-text-secondary);">${item.storageRequirements || 'Sealed'}</td>
          <td><span class="badge ${item.status === 'available' ? 'badge-success' : 'badge-neutral'}">${item.status}</span></td>
          <td style="text-align: right;">
            <button class="btn btn-ghost btn-sm text-primary" onclick="openListingDetail('${itemId}')">Details</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function openListingDetail(id) {
  const listing = cachedListings.find(l => (l.id === id || l._id === id)) || StorageManager.getListings().find(l => (l.id === id || l._id === id));
  if (!listing) return;

  const modalTitle = document.getElementById('detail-modal-title');
  const modalBody = document.getElementById('detail-modal-body');
  if (modalTitle) modalTitle.textContent = listing.title;

  const remaining = formatTimeRemaining(listing.safeUseDeadline);
  const provName = listing.providerName || listing.providerId?.name || 'Registered Kitchen Provider';
  const address = listing.pickupLocation?.address || 'Gurugram, NCR';

  if (modalBody) {
    modalBody.innerHTML = `
      <div style="background: var(--color-warning-bg); border: 1px solid var(--color-warning-border); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
        <div style="font-weight: 700; color: #8c5b16; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.4rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> Food Safety & Safe-Use Window Notice
        </div>
        <div style="font-size: 0.8rem; color: #6d4610;">
          Safe consumption deadline: <strong>${formatDateTime(listing.safeUseDeadline)}</strong> (${remaining.text}).
          Do not distribute or consume if storage thermal seal has been broken or food temperature is out of compliance.
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
        <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md);">
          <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Quantity Available</div>
          <div style="font-size: 1.35rem; font-weight: 900; margin-top: 0.25rem;">
            ${listing.availableQuantity !== undefined ? listing.availableQuantity : listing.quantity} ${listing.unit}
          </div>
          <div class="text-xs text-muted">Initial Batch: ${listing.quantity} ${listing.unit}</div>
        </div>

        <div style="background: var(--color-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md);">
          <div class="text-xs text-muted" style="text-transform: uppercase; font-weight: 700;">Listing Status</div>
          <div style="margin-top: 0.35rem;">
            <span class="badge ${listing.status === 'available' ? 'badge-success' : 'badge-neutral'}">${listing.status}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.825rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Kitchen Provider:</span>
          <strong>${provName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Food Category:</span>
          <strong>${formatCategory(listing.category)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Storage Protocol:</span>
          <strong class="text-warning">${listing.storageRequirements || 'Standard'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Dietary Profile:</span>
          <strong style="text-transform: capitalize;">${listing.dietaryType || 'Vegetarian'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span class="text-muted">Dispatch Address:</span>
          <span>${address}</span>
        </div>
      </div>

      ${listing.notes ? `
        <div style="background: var(--color-surface-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.8rem; font-style: italic; color: var(--color-text-secondary);">
          "${listing.notes}"
        </div>
      ` : ''}
    `;
  }

  openModal('view-listing-modal');
}

async function confirmCancelListing(id) {
  if (confirm('Are you sure you want to cancel this food listing? It will no longer be eligible for matching.')) {
    try {
      if (window.ApiClient && window.ApiClient.listings) {
        await ApiClient.listings.delete(id);
      }
    } catch (err) {
      console.warn('[FoodListings] Backend cancel failed, cancelling locally:', err.message);
    }
    StorageManager.updateListing(id, { status: 'cancelled' });
    showToast('Food surplus listing cancelled', 'warning');
    await renderListings();
    if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
  }
}
