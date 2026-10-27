/**
 * FoodResQ AI — Partner & Stakeholder Directory
 * Comprehensive node registry of food providers, recipient shelters, and logistics partners.
 * Connected to Node.js/Express MongoDB Organisation API.
 */

document.addEventListener('DOMContentLoaded', () => {
  initOrganisationsModule();
});

const DEFAULT_ORGS = [
  {
    id: 'ORG-101',
    name: 'Aryabhatta Hostel Mess',
    type: 'donor',
    status: 'verified',
    contact: 'Dr. Alok Mathur',
    phone: '+91 98101 23456',
    email: 'mess@aryabhatta.edu.in',
    address: 'South City II, Sector 49, Gurugram',
    license: 'FSSAI-10021064001290',
    capacity: '120 portions/day'
  },
  {
    id: 'ORG-102',
    name: 'Grand Imperial Banquet Hall',
    type: 'donor',
    status: 'verified',
    contact: 'Rajat Kapoor',
    phone: '+91 98202 34567',
    email: 'events@grandimperial.in',
    address: 'Golf Course Extension Road, Sector 58, Gurugram',
    license: 'FSSAI-10019064000431',
    capacity: '300 portions/event'
  },
  {
    id: 'ORG-103',
    name: 'CyberHub Corporate Cafeteria',
    type: 'donor',
    status: 'verified',
    contact: 'Priya Sengupta',
    phone: '+91 98303 45678',
    email: 'cafeteria@dlfcyberhub.com',
    address: 'Building 10B, DLF CyberHub, Gurugram',
    license: 'FSSAI-10018064000912',
    capacity: '80 portions/day'
  },
  {
    id: 'ORG-104',
    name: 'Crust & Crumb Artisanal Bakery',
    type: 'donor',
    status: 'verified',
    contact: 'Chef Amit Roy',
    phone: '+91 98404 56789',
    email: 'orders@crustcrumb.in',
    address: 'Sector 14 Main Market, Gurugram',
    license: 'FSSAI-10022064003310',
    capacity: '40 loaves/day'
  },
  {
    id: 'ORG-201',
    name: 'Asha Community Shelter',
    type: 'recipient',
    status: 'verified',
    contact: 'Sister Maria',
    phone: '+91 98505 67890',
    email: 'shelter@ashatrust.org',
    address: 'Sector 15 Part 2, Gurugram',
    license: '80G-DELHI-AAATA1234F',
    capacity: '70 residents'
  },
  {
    id: 'ORG-202',
    name: 'Navjyoti Child Care Home',
    type: 'recipient',
    status: 'verified',
    contact: 'Ramesh Sharma',
    phone: '+91 98606 78901',
    email: 'navjyoti@caretrust.org',
    address: 'Near Old Railway Station, Sector 4, Gurugram',
    license: '80G-DELHI-BBBTB5678G',
    capacity: '50 children'
  },
  {
    id: 'ORG-203',
    name: 'Sanjivani Food Bank Central',
    type: 'recipient',
    status: 'verified',
    contact: 'Sunita Rao',
    phone: '+91 98707 89012',
    email: 'logistics@sanjivanifood.org',
    address: 'Sector 23A, Palam Vihar Corridor, Gurugram',
    license: '80G-DELHI-CCCTC9012H',
    capacity: '150 meal packs'
  },
  {
    id: 'ORG-301',
    name: 'Gurugram Green EV Logistics',
    type: 'logistics',
    status: 'verified',
    contact: 'Vikram Singh',
    phone: '+91 98808 90123',
    email: 'dispatch@greenevcouriers.in',
    address: 'Sector 32 Institutional Area, Gurugram',
    license: 'LOG-HR-26-2023-EV09',
    capacity: '8 Electric Vans'
  },
  {
    id: 'ORG-204',
    name: 'Sunshine Elder Care Haven',
    type: 'recipient',
    status: 'pending',
    contact: 'Meena Gupta',
    phone: '+91 98909 01234',
    email: 'info@sunshinecare.org',
    address: 'Sector 56, Huda Colony, Gurugram',
    license: '80G-AUDIT-PENDING',
    capacity: '35 elders'
  },
  {
    id: 'ORG-105',
    name: 'Delhi Sweets & Catering',
    type: 'donor',
    status: 'suspended',
    contact: 'Rakesh Lal',
    phone: '+91 98111 22334',
    email: 'contact@delhisweets.in',
    address: 'Old Judicial Complex, Sector 15, Gurugram',
    license: 'FSSAI-EXPIRED-2023',
    capacity: '50 portions'
  }
];

let cachedOrgs = [];

function getStoredOrgs() {
  const data = localStorage.getItem('foodresq_organisations');
  if (!data) {
    localStorage.setItem('foodresq_organisations', JSON.stringify(DEFAULT_ORGS));
    return DEFAULT_ORGS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_ORGS;
  }
}

function saveStoredOrgs(orgs) {
  localStorage.setItem('foodresq_organisations', JSON.stringify(orgs));
}

function initOrganisationsModule() {
  renderOrganisations();
  setupFilterHandlers();
  setupOnboardingForm();
}

async function renderOrganisations() {
  const container = document.getElementById('organisationsGrid');
  if (!container) return;

  if (window.ApiClient && window.ApiClient.organisations) {
    try {
      const res = await ApiClient.organisations.getAll();
      const list = res.organisations || res.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        cachedOrgs = list.map(o => ({
          id: o.id || o._id,
          name: o.name,
          type: o.type,
          status: o.verificationStatus || o.status || 'verified',
          contact: o.contactPerson || o.contact,
          phone: o.phone,
          email: o.email,
          address: o.address?.street ? `${o.address.street}, ${o.address.city}` : (o.address || 'Gurugram'),
          license: o.fssaiLicense || o.ngoRegistration || o.license || o.licenseId || 'VERIFIED-01',
          capacity: o.capacity || o.capacityNotes || (o.category === 'provider' ? '120 portions/day' : '70 residents')
        }));
        saveStoredOrgs(cachedOrgs);
      } else {
        cachedOrgs = getStoredOrgs();
      }
    } catch (e) {
      console.warn('[Organisations] Backend list fetch note:', e.message);
      cachedOrgs = getStoredOrgs();
    }
  } else {
    cachedOrgs = getStoredOrgs();
  }

  const orgs = cachedOrgs;
  const search = (document.getElementById('orgSearchInput')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('orgTypeFilter')?.value || 'all';
  const statusFilter = document.getElementById('orgStatusFilter')?.value || 'all';

  const filtered = orgs.filter(org => {
    const name = (org.name || '').toLowerCase();
    const addr = (org.address || '').toLowerCase();
    const lic = (org.license || '').toLowerCase();
    const cont = (org.contact || '').toLowerCase();

    const matchesSearch = !search ||
      name.includes(search) ||
      addr.includes(search) ||
      lic.includes(search) ||
      cont.includes(search);

    const matchesType = typeFilter === 'all' || org.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Update KPI counters
  const totalEl = document.getElementById('statTotalOrgs');
  const donorEl = document.getElementById('statDonorOrgs');
  const shelterEl = document.getElementById('statShelterOrgs');
  const logEl = document.getElementById('statLogisticsOrgs');

  if (totalEl) totalEl.textContent = `${orgs.length} Nodes`;
  if (donorEl) donorEl.textContent = `${orgs.filter(o => o.type === 'donor').length} Kitchens`;
  if (shelterEl) shelterEl.textContent = `${orgs.filter(o => o.type === 'recipient').length} Shelters`;
  if (logEl) logEl.textContent = `${orgs.filter(o => o.type === 'logistics').length} Fleets`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state col-span-3 p-xl">
        <i class="fa-solid fa-building-circle-exclamation empty-icon" style="font-size: 2.5rem;"></i>
        <h3 class="font-bold text-base mt-sm">No partner nodes match criteria</h3>
        <p class="text-xs text-secondary mt-xs">Adjust your search keyword or clear filters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(org => {
    let typeBadgeClass = 'badge-primary';
    let typeLabel = 'Food Provider';
    if (org.type === 'recipient') {
      typeBadgeClass = 'badge-secondary';
      typeLabel = 'Recipient Shelter';
    } else if (org.type === 'logistics') {
      typeBadgeClass = 'badge-subtle';
      typeLabel = 'Logistics Fleet';
    }

    let statusBadgeClass = 'badge-success';
    let statusLabel = 'Verified Active';
    if (org.status === 'pending') {
      statusBadgeClass = 'badge-warning';
      statusLabel = 'Pending Audit';
    } else if (org.status === 'suspended') {
      statusBadgeClass = 'badge-danger';
      statusLabel = 'Suspended';
    }

    const orgId = org.id || org._id;

    return `
      <div class="card p-md flex flex-column justify-between">
        <div>
          <div class="flex items-center justify-between gap-xs mb-sm">
            <span class="badge ${typeBadgeClass}">${typeLabel}</span>
            <span class="badge ${statusBadgeClass}">${statusLabel}</span>
          </div>
          <h4 class="font-bold text-base mb-xs" style="color: var(--color-text-main);">${org.name}</h4>
          <p class="text-xs text-secondary mb-sm flex items-center gap-xs">
            <i class="fa-solid fa-location-dot text-primary"></i> ${org.address}
          </p>

          <div class="p-xs bg-surface border rounded text-xs text-secondary mb-sm">
            <div class="flex justify-between mb-xs">
              <span>Contact:</span> <strong>${org.contact}</strong>
            </div>
            <div class="flex justify-between mb-xs">
              <span>License / ID:</span> <span class="font-mono">${org.license}</span>
            </div>
            <div class="flex justify-between">
              <span>Capacity:</span> <strong class="text-primary">${org.capacity}</strong>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between border-top pt-sm mt-xs">
          <button class="btn btn-secondary btn-sm" onclick="inspectPartner('${orgId}')">
            <i class="fa-solid fa-circle-info mr-xs"></i> Details
          </button>
          ${org.status === 'pending' ? `
            <button class="btn btn-primary btn-sm" onclick="changePartnerStatus('${orgId}', 'verified')">
              <i class="fa-solid fa-check mr-xs"></i> Verify
            </button>
          ` : org.status === 'verified' ? `
            <button class="btn btn-text btn-sm text-danger" onclick="changePartnerStatus('${orgId}', 'suspended')">
              <i class="fa-solid fa-ban mr-xs"></i> Suspend
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" onclick="changePartnerStatus('${orgId}', 'verified')">
              <i class="fa-solid fa-rotate-right mr-xs"></i> Reactivate
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function setupFilterHandlers() {
  const searchInput = document.getElementById('orgSearchInput');
  const typeFilter = document.getElementById('orgTypeFilter');
  const statusFilter = document.getElementById('orgStatusFilter');

  if (searchInput) searchInput.addEventListener('input', renderOrganisations);
  if (typeFilter) typeFilter.addEventListener('change', renderOrganisations);
  if (statusFilter) statusFilter.addEventListener('change', renderOrganisations);
}

function setupOnboardingForm() {
  const btnOpen = document.getElementById('btnRegisterPartner');
  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      if (typeof openModal === 'function') openModal('onboardPartnerModal');
      else if (typeof App !== 'undefined' && App.openModal) App.openModal('onboardPartnerModal');
    });
  }

  const form = document.getElementById('onboardPartnerForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('partnerName').value.trim();
      const type = document.getElementById('partnerType').value;
      const contact = document.getElementById('partnerContact').value.trim();
      const phone = document.getElementById('partnerPhone').value.trim();
      const email = document.getElementById('partnerEmail').value.trim();
      const address = document.getElementById('partnerAddress').value.trim();
      const license = document.getElementById('partnerLicense').value.trim();
      const status = document.getElementById('partnerStatus').value;

      const payload = {
        name,
        type,
        contactPerson: contact,
        phone,
        email,
        address: {
          street: address,
          city: 'Gurugram',
          coordinates: [28.4595, 77.0680]
        },
        fssaiLicense: type === 'donor' ? license : undefined,
        ngoRegistration: type === 'recipient' ? license : undefined,
        status: status || 'verified',
        capacity: type === 'donor' ? '100 portions/day' : '60 residents'
      };

      if (window.ApiClient && window.ApiClient.organisations) {
        try {
          await ApiClient.organisations.create(payload);
        } catch (err) {
          console.warn('[Organisations] Backend create note:', err.message);
        }
      }

      const newPartner = {
        id: `ORG-${Date.now().toString().slice(-4)}`,
        name,
        type,
        status: status || 'verified',
        contact,
        phone,
        email,
        address,
        license,
        capacity: type === 'donor' ? '100 portions/day' : '60 residents'
      };

      const orgs = getStoredOrgs();
      orgs.unshift(newPartner);
      saveStoredOrgs(orgs);

      form.reset();
      if (typeof closeModal === 'function') closeModal('onboardPartnerModal');
      else if (typeof App !== 'undefined' && App.closeModal) App.closeModal('onboardPartnerModal');

      await renderOrganisations();
      if (typeof showToast === 'function') {
        showToast(`Partner node "${name}" onboarded successfully!`, 'success');
      } else if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`Partner node "${name}" onboarded successfully!`, 'success');
      }
    });
  }
}

window.inspectPartner = function(id) {
  const orgs = cachedOrgs.length ? cachedOrgs : getStoredOrgs();
  const org = orgs.find(o => (o.id === id || o._id === id));
  if (!org) return;

  const titleEl = document.getElementById('partnerDetailTitle');
  const contentEl = document.getElementById('partnerDetailContent');
  const actionsEl = document.getElementById('partnerDetailActions');

  if (titleEl) titleEl.textContent = org.name;
  if (contentEl) {
    contentEl.innerHTML = `
      <div class="grid grid-2 gap-md mb-md">
        <div class="p-xs bg-surface border rounded">
          <span class="text-xs text-secondary block">Organization ID</span>
          <strong>${org.id}</strong>
        </div>
        <div class="p-xs bg-surface border rounded">
          <span class="text-xs text-secondary block">Classification</span>
          <span class="badge badge-primary uppercase">${org.type}</span>
        </div>
      </div>
      <div class="form-group">
        <label class="text-xs text-secondary">Physical Node Location</label>
        <p class="font-medium">${org.address}</p>
      </div>
      <div class="grid grid-2 gap-md mb-md">
        <div>
          <label class="text-xs text-secondary">Primary Contact</label>
          <p class="font-medium">${org.contact}</p>
          <p class="text-xs text-secondary">${org.phone}</p>
          <p class="text-xs text-secondary">${org.email}</p>
        </div>
        <div>
          <label class="text-xs text-secondary">Statutory Compliance</label>
          <p class="font-mono text-sm">${org.license}</p>
          <span class="badge ${org.status === 'verified' ? 'badge-success' : 'badge-warning'} mt-xs">${org.status.toUpperCase()}</span>
        </div>
      </div>
    `;
  }

  if (actionsEl) {
    actionsEl.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal('partnerDetailModal')">Close</button>
      ${org.status !== 'verified' ? `
        <button class="btn btn-primary" onclick="changePartnerStatus('${org.id}', 'verified'); closeModal('partnerDetailModal');">Verify Node</button>
      ` : `
        <button class="btn btn-danger" onclick="changePartnerStatus('${org.id}', 'suspended'); closeModal('partnerDetailModal');">Suspend Node</button>
      `}
    `;
  }

  if (typeof openModal === 'function') openModal('partnerDetailModal');
  else if (typeof App !== 'undefined' && App.openModal) App.openModal('partnerDetailModal');
};

window.changePartnerStatus = async function(id, newStatus) {
  if (window.ApiClient && window.ApiClient.organisations) {
    try {
      if (newStatus === 'verified') await ApiClient.organisations.verify(id);
      else if (newStatus === 'suspended') await ApiClient.organisations.suspend(id);
    } catch (e) {
      console.warn('[Organisations] Status API call note:', e.message);
    }
  }

  const orgs = getStoredOrgs();
  const org = orgs.find(o => (o.id === id || o._id === id));
  if (org) {
    org.status = newStatus;
    saveStoredOrgs(orgs);
  }

  await renderOrganisations();

  const msg = newStatus === 'verified' ? 'Partner verified and active.' : 'Partner node suspended.';
  if (typeof showToast === 'function') {
    showToast(msg, newStatus === 'verified' ? 'success' : 'warning');
  } else if (typeof App !== 'undefined' && App.showToast) {
    App.showToast(msg, newStatus === 'verified' ? 'success' : 'warning');
  }
};
