/**
 * FoodResQ AI — Live Geospatial Fleet & Node Map
 * Interactive Leaflet + OpenStreetMap engine rendering donors, shelters, drivers, and dynamic rescue corridors.
 * Connected to Node.js/Express MongoDB fleet APIs with local fallback.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMapModule();
});

let mapInstance = null;
let donorsGroup = null;
let recipientsGroup = null;
let driversGroup = null;
let corridorsGroup = null;
const deliveryPolylines = {};

function parseCoords(loc) {
  if (!loc) return null;
  if (Array.isArray(loc) && loc.length >= 2) {
    return { lat: Number(loc[0]), lng: Number(loc[1]) };
  }
  if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
    return { lat: Number(loc.coordinates[0]), lng: Number(loc.coordinates[1]) };
  }
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  if (loc.coords) {
    return parseCoords(loc.coords);
  }
  return null;
}

async function initMapModule() {
  const mapElement = document.getElementById('map-view');
  if (!mapElement) return;

  // Initialize Leaflet Map
  mapInstance = L.map('map-view', {
    center: [28.4635, 77.0680], // Gurugram Central Node
    zoom: 13,
    zoomControl: true,
    scrollWheelZoom: true
  });

  // Base Tile Layer (Carto / OSM)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(mapInstance);

  // Initialize Layer Groups
  donorsGroup = L.layerGroup().addTo(mapInstance);
  recipientsGroup = L.layerGroup().addTo(mapInstance);
  driversGroup = L.layerGroup().addTo(mapInstance);
  corridorsGroup = L.layerGroup().addTo(mapInstance);

  // Sync with live backend if available
  if (window.ApiClient) {
    try {
      const [listRes, demRes, drvRes, delRes] = await Promise.all([
        ApiClient.listings.getAll().catch(() => null),
        ApiClient.demand.getAll().catch(() => null),
        ApiClient.drivers.getAll().catch(() => null),
        ApiClient.deliveries.getAll().catch(() => null)
      ]);

      if (listRes && (listRes.listings || listRes.data)) {
        const l = listRes.listings || listRes.data;
        if (Array.isArray(l) && l.length) StorageManager.saveListings(l);
      }
      if (demRes && (demRes.demands || demRes.data)) {
        const d = demRes.demands || demRes.data;
        if (Array.isArray(d) && d.length) StorageManager.saveDemands(d);
      }
      if (drvRes && (drvRes.drivers || drvRes.data)) {
        const dr = drvRes.drivers || drvRes.data;
        if (Array.isArray(dr) && dr.length) StorageManager.saveDrivers(dr);
      }
      if (delRes && (delRes.deliveries || delRes.data)) {
        const dl = delRes.deliveries || delRes.data;
        if (Array.isArray(dl) && dl.length) StorageManager.saveDeliveries(dl);
      }
    } catch (e) {
      console.warn('[Map] Sync error:', e.message);
    }
  }

  // Load and Render Data
  renderMapMarkers();
  renderMapCorridors();
  renderSidebarTrips();
  setupLayerControls();
}

/**
 * Creates custom styled HTML DivIcons
 */
function createPinIcon(iconClass, bgColor, size = 34) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${bgColor};
        color: #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        font-size: 14px;
        transform: translate(-50%, -50%);
        transition: transform 0.2s ease;
      ">
        <i class="${iconClass}"></i>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

/**
 * Render Donors, Shelters, and Drivers
 */
function renderMapMarkers() {
  donorsGroup.clearLayers();
  recipientsGroup.clearLayers();
  driversGroup.clearLayers();

  const listings = StorageManager.getListings();
  const demands = StorageManager.getDemands();
  const drivers = StorageManager.getDrivers();

  // 1. Food Donors (Green)
  listings.forEach(listing => {
    const coords = parseCoords(listing.pickupLocation || listing.coords || listing.location);
    if (!coords) return;

    const pin = createPinIcon('fa-solid fa-bowl-food', '#176B4D', 36);
    const marker = L.marker([coords.lat, coords.lng], { icon: pin });
    const provName = listing.providerName || listing.provider || 'Food Donor';
    const portions = listing.availableQuantity !== undefined ? listing.availableQuantity : listing.quantity;
    const address = listing.pickupLocation?.address || listing.location || 'Gurugram, NCR';

    const popupHtml = `
      <div style="font-family: inherit; font-size: 0.85rem; min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="background: #176B4D; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">FOOD DONOR</span>
          <strong style="color: #176B4D;">${provName}</strong>
        </div>
        <h4 style="margin: 0 0 6px 0; font-size: 0.95rem;">${listing.title}</h4>
        <p style="margin: 0 0 4px 0; color: #555;"><strong>Portions:</strong> ${portions} available</p>
        <p style="margin: 0 0 4px 0; color: #555;"><strong>Safe Deadline:</strong> ${formatDateTime ? formatDateTime(listing.safeUseDeadline) : (listing.safeUseDeadline || listing.safe_deadline)}</p>
        <p style="margin: 0; color: #777; font-size: 0.75rem;"><i class="fa-solid fa-location-dot"></i> ${address}</p>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marker.bindTooltip(`🍲 ${provName} (${portions} portions)`, { direction: 'top', offset: [0, -18] });
    donorsGroup.addLayer(marker);
  });

  // 2. Recipient Shelters (Purple / Violet)
  demands.forEach(req => {
    const coords = parseCoords(req.location || req.coords);
    if (!coords) return;

    const pin = createPinIcon('fa-solid fa-house-chimney-window', '#6366F1', 36);
    const marker = L.marker([coords.lat, coords.lng], { icon: pin });
    const orgName = req.recipientName || req.organization || 'Shelter';
    const portions = req.quantityRequested || req.portions_required || 50;
    const address = req.location?.address || req.location || 'Gurugram, NCR';

    const popupHtml = `
      <div style="font-family: inherit; font-size: 0.85rem; min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="background: #6366F1; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">RECIPIENT SHELTER</span>
          <strong style="color: #6366F1;">${orgName}</strong>
        </div>
        <p style="margin: 0 0 4px 0; color: #555;"><strong>Portions Required:</strong> ${portions}</p>
        <p style="margin: 0 0 4px 0; color: #555;"><strong>Urgency:</strong> <span style="text-transform: capitalize; color: #e6a23c; font-weight: 600;">${req.urgency}</span></p>
        <p style="margin: 0; color: #777; font-size: 0.75rem;"><i class="fa-solid fa-location-dot"></i> ${address}</p>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marker.bindTooltip(`❤️ ${orgName} (${portions} needed)`, { direction: 'top', offset: [0, -18] });
    recipientsGroup.addLayer(marker);
  });

  // 3. Active Drivers (Blue)
  drivers.forEach(driver => {
    const coords = parseCoords(driver.currentLocation || driver.coords);
    if (!coords) return;

    const isBusy = driver.status === 'in_transit' || driver.status === 'busy';
    const pin = createPinIcon('fa-solid fa-truck', isBusy ? '#2563EB' : '#059669', 32);
    const marker = L.marker([coords.lat, coords.lng], { icon: pin });
    const vehicle = driver.vehicleType || driver.vehicle || 'EV Carrier';
    const battery = driver.batteryPercentage !== undefined ? driver.batteryPercentage : (driver.battery || 85);

    const popupHtml = `
      <div style="font-family: inherit; font-size: 0.85rem; min-width: 190px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="background: ${isBusy ? '#2563EB' : '#059669'}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">EV FLEET</span>
          <strong>${driver.name}</strong>
        </div>
        <p style="margin: 0 0 4px 0; color: #555;"><strong>Vehicle:</strong> ${vehicle}</p>
        <p style="margin: 0 0 4px 0; color: #555;"><strong>Battery:</strong> 🔋 ${battery}%</p>
        <p style="margin: 0; color: #555;"><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: 600;">${(driver.status || '').replace('_', ' ')}</span></p>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marker.bindTooltip(`🚚 ${driver.name} (${vehicle})`, { direction: 'top', offset: [0, -16] });
    driversGroup.addLayer(marker);
  });
}

/**
 * Render active corridors (polylines connecting pickup & dropoff)
 */
function renderMapCorridors() {
  corridorsGroup.clearLayers();
  const deliveries = StorageManager.getDeliveries();

  deliveries.forEach(del => {
    const pickup = parseCoords(del.pickupLocation || del.pickup_coords);
    const dropoff = parseCoords(del.destinationLocation || del.dropoff_coords);

    if (!pickup || !dropoff) return;
    if (del.status === 'completed' || del.status === 'delivered' || del.status === 'cancelled') return;

    let strokeColor = '#176B4D'; // default primary
    let dashPattern = null;
    let weight = 4;

    if (del.status === 'recovery_required') {
      strokeColor = '#D95757'; // alert red
      dashPattern = '8, 8';
      weight = 5;
    } else if (del.status === 'assigned') {
      strokeColor = '#E6A23C'; // warning yellow
      dashPattern = '6, 6';
    } else if (del.status === 'in_transit') {
      strokeColor = '#104B38'; // deep green
      weight = 5;
    }

    const latlngs = [
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng]
    ];

    const polyline = L.polyline(latlngs, {
      color: strokeColor,
      weight: weight,
      dashArray: dashPattern,
      opacity: 0.85
    });

    const prov = del.providerName || del.provider || 'Donor Hub';
    const rec = del.recipientName || del.recipient || 'Shelter';
    const qty = del.quantity || del.portions || 50;
    const unit = del.unit || 'meals';
    const driver = del.driverName || del.driver_name || 'Fleet Courier';
    const dist = del.distanceKm || del.distance_km || 4.2;
    const shortId = (del.id || '').slice(-6);

    const corridorPopup = `
      <div style="font-family: inherit; font-size: 0.85rem; min-width: 220px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <strong style="color: #176B4D;">Trip #${shortId}</strong>
          <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: ${strokeColor};">${(del.status || '').replace('_', ' ')}</span>
        </div>
        <p style="margin: 0 0 4px 0;"><strong>Route:</strong> ${prov} &rarr; ${rec}</p>
        <p style="margin: 0 0 4px 0;"><strong>Volume:</strong> ${qty} ${unit}</p>
        <p style="margin: 0 0 4px 0;"><strong>Driver:</strong> ${driver}</p>
        <p style="margin: 0 0 4px 0;"><strong>Distance:</strong> ${dist} km</p>
        ${del.incident_notes ? `<p style="margin: 6px 0 0 0; background: #fee2e2; color: #991b1b; padding: 4px; border-radius: 4px; font-size: 0.75rem;"><strong>Incident:</strong> ${del.incident_notes}</p>` : ''}
      </div>
    `;

    polyline.bindPopup(corridorPopup);
    corridorsGroup.addLayer(polyline);
    deliveryPolylines[del.id] = polyline;
  });
}

/**
 * Render Sidebar Trip list
 */
function renderSidebarTrips() {
  const container = document.getElementById('map-deliveries-list');
  const countLabel = document.getElementById('activeTripsCount');
  if (!container) return;

  const deliveries = StorageManager.getDeliveries().filter(d => d.status !== 'completed' && d.status !== 'delivered' && d.status !== 'cancelled');

  if (countLabel) {
    countLabel.textContent = `${deliveries.length} active delivery corridors monitored`;
  }

  if (deliveries.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <i class="fa-solid fa-route empty-icon" style="font-size: 2rem;"></i>
        <p class="font-medium text-sm">No active corridors</p>
        <p class="text-xs text-secondary">All pending deliveries completed</p>
      </div>
    `;
    return;
  }

  container.innerHTML = deliveries.map(del => {
    let statusClass = 'badge-subtle';
    let statusText = 'Pending';
    if (del.status === 'in_transit') {
      statusClass = 'badge-primary';
      statusText = 'In Transit';
    } else if (del.status === 'recovery_required') {
      statusClass = 'badge-danger';
      statusText = 'Rerouting';
    } else if (del.status === 'assigned') {
      statusClass = 'badge-warning';
      statusText = 'Assigned';
    }

    const shortId = (del.id || '').slice(-6);
    const prov = del.providerName || del.provider || 'Donor Hub';
    const rec = del.recipientName || del.recipient || 'Shelter';
    const qty = del.quantity || del.portions || 50;
    const unit = del.unit || 'meals';
    const driver = del.driverName || del.driver_name || 'Driver pending';
    const dist = del.distanceKm || del.distance_km || 4.2;

    return `
      <div class="map-delivery-item" data-id="${del.id}" onclick="focusCorridor('${del.id}')">
        <div class="flex items-center justify-between mb-xs">
          <span class="font-bold text-xs">#${shortId}</span>
          <span class="badge ${statusClass}">${statusText}</span>
        </div>
        <div class="font-semibold text-xs mb-xs" style="color: var(--color-text-main);">
          ${prov} <i class="fa-solid fa-arrow-right text-xs text-secondary mx-xs"></i> ${rec}
        </div>
        <div class="flex items-center justify-between text-xs text-secondary">
          <span><i class="fa-solid fa-bowl-food mr-xs"></i>${qty} ${unit}</span>
          <span><i class="fa-solid fa-clock mr-xs"></i>${Math.round(dist * 2.8)} mins (${dist} km)</span>
        </div>
        <div class="mt-xs pt-xs border-top flex items-center justify-between text-xs">
          <span class="text-secondary"><i class="fa-solid fa-id-badge mr-xs"></i>${driver}</span>
          <span class="text-primary font-semibold"><i class="fa-solid fa-crosshairs mr-xs"></i>Track</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Focus and zoom map on specific delivery corridor
 */
window.focusCorridor = function(deliveryId) {
  const polyline = deliveryPolylines[deliveryId];
  if (!polyline || !mapInstance) return;

  // Highlight item in sidebar
  document.querySelectorAll('.map-delivery-item').forEach(el => el.classList.remove('selected'));
  const targetItem = document.querySelector(`.map-delivery-item[data-id="${deliveryId}"]`);
  if (targetItem) targetItem.classList.add('selected');

  // Fit bounds and open popup
  mapInstance.fitBounds(polyline.getBounds(), { padding: [60, 60], maxZoom: 15 });
  setTimeout(() => {
    polyline.openPopup();
  }, 250);
};

/**
 * Layer toggle checkboxes and zoom utilities
 */
function setupLayerControls() {
  const layerDonors = document.getElementById('layerDonors');
  const layerRecipients = document.getElementById('layerRecipients');
  const layerDrivers = document.getElementById('layerDrivers');
  const layerCorridors = document.getElementById('layerCorridors');

  if (layerDonors) {
    layerDonors.addEventListener('change', (e) => {
      if (e.target.checked) mapInstance.addLayer(donorsGroup);
      else mapInstance.removeLayer(donorsGroup);
    });
  }

  if (layerRecipients) {
    layerRecipients.addEventListener('change', (e) => {
      if (e.target.checked) mapInstance.addLayer(recipientsGroup);
      else mapInstance.removeLayer(recipientsGroup);
    });
  }

  if (layerDrivers) {
    layerDrivers.addEventListener('change', (e) => {
      if (e.target.checked) mapInstance.addLayer(driversGroup);
      else mapInstance.removeLayer(driversGroup);
    });
  }

  if (layerCorridors) {
    layerCorridors.addEventListener('change', (e) => {
      if (e.target.checked) mapInstance.addLayer(corridorsGroup);
      else mapInstance.removeLayer(corridorsGroup);
    });
  }

  // Centering and Fit utilities
  const btnFit = document.getElementById('btnFitBounds');
  if (btnFit) {
    btnFit.addEventListener('click', () => {
      const allLayers = [donorsGroup, recipientsGroup, driversGroup];
      const bounds = L.latLngBounds([]);
      allLayers.forEach(group => {
        group.eachLayer(layer => {
          if (layer.getLatLng) bounds.extend(layer.getLatLng());
        });
      });
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [40, 40] });
      }
    });
  }

  const btnCenter = document.getElementById('btnCenterGurugram');
  if (btnCenter) {
    btnCenter.addEventListener('click', () => {
      mapInstance.setView([28.4635, 77.0680], 13);
    });
  }
}
