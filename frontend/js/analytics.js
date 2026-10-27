/**
 * FoodResQ AI — Impact & ESG Analytics
 * Chart.js visualizations, lifecycle carbon calculation audits, and CSV export.
 * Connected to Node.js/Express MongoDB ESG calculation services.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAnalyticsModule();
});

let velocityChartInstance = null;
let categoryChartInstance = null;

async function initAnalyticsModule() {
  await fetchLiveSummary();
  renderImpactCharts();
  renderBatchAuditTable();
  setupFilterButtons();
  setupExportButton();
}

async function fetchLiveSummary() {
  if (window.ApiClient && window.ApiClient.analytics) {
    try {
      const res = await ApiClient.analytics.getSummary();
      const s = res.data || res;
      if (s) {
        const statMeals = document.getElementById('statMealsNum');
        const statCO2 = document.getElementById('statCO2Val');
        const statFood = document.getElementById('statFoodKg');

        if (statMeals && s.totalMealsDelivered !== undefined) {
          statMeals.textContent = `${s.totalMealsDelivered.toLocaleString()} meals`;
        }
        if (statCO2 && s.co2EmissionsPreventedKg !== undefined) {
          statCO2.textContent = `${Math.round(s.co2EmissionsPreventedKg).toLocaleString()} kg CO₂e`;
        }
        if (statFood && s.totalFoodRescuedKg !== undefined) {
          statFood.textContent = `${Math.round(s.totalFoodRescuedKg).toLocaleString()} kg`;
        }
      }
    } catch (err) {
      console.warn('[Analytics] Live summary note:', err.message);
    }
  }
}

async function renderImpactCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#a4cdb8' : '#758078';

  // 1. Weekly Velocity Bar Chart
  const ctxBar = document.getElementById('velocityBarChart');
  if (ctxBar) {
    if (velocityChartInstance) velocityChartInstance.destroy();

    velocityChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Surplus Listed (Portions)',
            data: [320, 410, 290, 480, 620, 780, 510],
            backgroundColor: '#176B4D',
            borderRadius: 6
          },
          {
            label: 'Successfully Delivered (Portions)',
            data: [315, 400, 285, 470, 610, 765, 505],
            backgroundColor: '#B9E769',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { family: 'Inter', size: 12 } }
          },
          tooltip: {
            backgroundColor: isDark ? '#14201a' : '#ffffff',
            titleColor: isDark ? '#ffffff' : '#18251f',
            bodyColor: isDark ? '#a4cdb8' : '#555555',
            borderColor: isDark ? '#23382e' : '#e0e5de',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter' } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Inter' },
              callback: (val) => val + ' meals'
            }
          }
        }
      }
    });
  }

  // 2. Category Doughnut Chart
  const ctxDoughnut = document.getElementById('categoryDoughnutChart');
  if (ctxDoughnut) {
    if (categoryChartInstance) categoryChartInstance.destroy();

    let catLabels = ['Cooked Meals', 'Bakery & Bread', 'Fresh Farm Produce', 'Packaged Dry Grains'];
    let catValues = [48, 22, 18, 12];

    if (window.ApiClient && window.ApiClient.analytics) {
      try {
        const catRes = await ApiClient.analytics.getCategories();
        const cats = catRes.data || catRes;
        if (Array.isArray(cats) && cats.length > 0) {
          catLabels = cats.map(c => c.name || c.category);
          catValues = cats.map(c => c.percentage || c.count);
        }
      } catch (e) {
        console.warn('[Analytics] Category fetch note:', e.message);
      }
    }

    categoryChartInstance = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catValues,
          backgroundColor: ['#176B4D', '#B9E769', '#E6A23C', '#2563EB', '#8B5CF6'],
          borderWidth: 2,
          borderColor: isDark ? '#1a2c24' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: textColor, font: { family: 'Inter', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw}%`
            }
          }
        },
        cutout: '68%'
      }
    });
  }
}

function renderBatchAuditTable() {
  const tbody = document.getElementById('batchAuditTableBody');
  if (!tbody) return;

  const deliveries = StorageManager.getDeliveries();

  tbody.innerHTML = deliveries.map(del => {
    const qty = del.quantity || del.portions || 50;
    const weightKg = (qty * 0.42).toFixed(1);
    const co2eKg = (weightKg * 2.5).toFixed(1);
    const prov = del.providerName || del.provider || 'Kitchen Provider';
    const rec = del.recipientName || del.recipient || 'Community Shelter';
    const shortId = (del.id || '').slice(-6);
    const status = (del.status || 'in_transit');

    let badgeClass = 'badge-subtle';
    if (status === 'completed' || status === 'delivered') badgeClass = 'badge-success';
    else if (status === 'in_transit') badgeClass = 'badge-primary';
    else if (status === 'recovery_required') badgeClass = 'badge-danger';
    else if (status === 'assigned') badgeClass = 'badge-warning';

    return `
      <tr>
        <td><strong>#${shortId}</strong></td>
        <td class="text-xs text-secondary">${del.createdAt ? formatDateTime(del.createdAt) : (del.created_at || 'Today')}</td>
        <td><strong>${prov}</strong></td>
        <td>${rec}</td>
        <td><span class="badge badge-subtle">${del.category || 'Cooked Hot'}</span></td>
        <td><strong>${qty}</strong></td>
        <td>${weightKg} kg</td>
        <td><strong class="text-success">${co2eKg} kg</strong></td>
        <td><span class="badge ${badgeClass}">${status.replace('_', ' ')}</span></td>
      </tr>
    `;
  }).join('');
}

function setupFilterButtons() {
  const btn7d = document.getElementById('filter7d');
  const btn30d = document.getElementById('filter30d');
  const btnYTD = document.getElementById('filterYTD');

  const statCO2 = document.getElementById('statCO2Val');
  const statFood = document.getElementById('statFoodKg');
  const statMeals = document.getElementById('statMealsNum');

  const buttons = [btn7d, btn30d, btnYTD];

  function setActive(btn) {
    buttons.forEach(b => b && b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  if (btn7d) {
    btn7d.addEventListener('click', () => {
      setActive(btn7d);
      if (statCO2) statCO2.textContent = '1,840 kg CO₂e';
      if (statFood) statFood.textContent = '736 kg';
      if (statMeals) statMeals.textContent = '1,750 meals';
    });
  }

  if (btn30d) {
    btn30d.addEventListener('click', () => {
      setActive(btn30d);
      if (statCO2) statCO2.textContent = '12,480 kg CO₂e';
      if (statFood) statFood.textContent = '4,992 kg';
      if (statMeals) statMeals.textContent = '11,885 meals';
    });
  }

  if (btnYTD) {
    btnYTD.addEventListener('click', () => {
      setActive(btnYTD);
      if (statCO2) statCO2.textContent = '48,200 kg CO₂e';
      if (statFood) statFood.textContent = '19,280 kg';
      if (statMeals) statMeals.textContent = '45,900 meals';
    });
  }
}

function setupExportButton() {
  const btnExport = document.getElementById('btnExportCSV');
  if (!btnExport) return;

  btnExport.addEventListener('click', () => {
    // If backend is live, we can open CSV export directly
    if (window.ApiClient && window.ApiClient.analytics) {
      window.open(ApiClient.analytics.exportCsvUrl(), '_blank');
      if (typeof showToast === 'function') {
        showToast('ESG audit report downloaded from MongoDB.', 'success');
      }
      return;
    }

    const deliveries = StorageManager.getDeliveries();
    
    const rows = [
      ['Batch ID', 'Date & Time', 'Provider', 'Recipient', 'Portions', 'Weight (kg)', 'CO2e Saved (kg)', 'Status']
    ];

    deliveries.forEach(del => {
      const qty = del.quantity || del.portions || 50;
      const weightKg = (qty * 0.42).toFixed(1);
      const co2eKg = (weightKg * 2.5).toFixed(1);
      rows.push([
        del.id,
        del.createdAt || del.created_at || new Date().toISOString().slice(0, 16),
        del.providerName || del.provider,
        del.recipientName || del.recipient,
        qty,
        weightKg,
        co2eKg,
        del.status
      ]);
    });

    const csvContent = rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `foodresq_esg_impact_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') {
      showToast('ESG audit report downloaded successfully.', 'success');
    }
  });
}
