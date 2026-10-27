/**
 * FoodResQ AI — Surplus Forecasting & Capacity Lookahead
 * Chart.js predictive visualization with confidence bands and facility-level breakdowns.
 * Connected to Node.js/Express MongoDB predictive models.
 */

document.addEventListener('DOMContentLoaded', () => {
  initForecastsModule();
});

let forecastChartInstance = null;

function initForecastsModule() {
  renderForecastChart();
  renderForecastTable();
  setupHorizonButtons();
}

const defaultFacilityProjections = [
  {
    name: 'Aryabhatta Hostel Mess',
    category: 'College Hostel',
    dailyAvg: '110 portions',
    projected7d: '770 portions',
    peakTime: 'Friday Dinner (20:30 - 22:00)',
    riskBadge: '<span class="badge badge-warning">Medium (3.5h Safe)</span>',
    action: 'Auto-dispatch EV-409 with insulated hot boxes'
  },
  {
    name: 'Grand Imperial Banquet Hall',
    category: 'Event Venue',
    dailyAvg: '260 portions',
    projected7d: '1,200 portions',
    peakTime: 'Saturday Night (22:30 - 01:00)',
    riskBadge: '<span class="badge badge-danger">High (2.0h Safe)</span>',
    action: 'Pre-assign refrigerated van to Sanjivani Food Bank'
  },
  {
    name: 'CyberHub Corporate Cafeteria',
    category: 'Corporate Food Court',
    dailyAvg: '65 portions',
    projected7d: '320 portions',
    peakTime: 'Thursday Lunch (13:30 - 15:00)',
    riskBadge: '<span class="badge badge-success">Low (5.0h Safe)</span>',
    action: 'Direct batch transfer to Navjyoti Child Care'
  },
  {
    name: 'Crust & Crumb Artisanal Bakery',
    category: 'Bakery & Confectionery',
    dailyAvg: '35 portions',
    projected7d: '160 portions',
    peakTime: 'Sunday Evening (20:00 - 21:30)',
    riskBadge: '<span class="badge badge-success">Low (12h Safe)</span>',
    action: 'Scheduled ambient courier pickup for Asha Shelter'
  }
];

function renderForecastTable() {
  const tbody = document.getElementById('forecastTableBody');
  if (!tbody) return;

  tbody.innerHTML = defaultFacilityProjections.map(item => `
    <tr>
      <td>
        <strong style="color: var(--color-text-main);">${item.name}</strong>
      </td>
      <td><span class="badge badge-subtle">${item.category}</span></td>
      <td><strong>${item.dailyAvg}</strong></td>
      <td><strong style="color: var(--color-primary);">${item.projected7d}</strong></td>
      <td class="text-xs text-secondary">${item.peakTime}</td>
      <td>${item.riskBadge}</td>
      <td class="text-xs font-medium" style="color: var(--color-primary);">${item.action}</td>
    </tr>
  `).join('');
}

async function renderForecastChart(horizon = 7) {
  const ctx = document.getElementById('forecastChart');
  if (!ctx) return;

  if (forecastChartInstance) {
    forecastChartInstance.destroy();
  }

  let labels = [];
  let actualData = [];
  let projectedData = [];
  let upperConfidence = [];
  let lowerConfidence = [];

  let backendData = null;
  if (window.ApiClient && window.ApiClient.forecasts) {
    try {
      const res = await ApiClient.forecasts.getAll(horizon);
      backendData = res.data || res;
    } catch (e) {
      console.warn('[Forecasts] Live API note:', e.message);
    }
  }

  if (backendData && backendData.labels && backendData.projected) {
    labels = backendData.labels;
    actualData = backendData.actual || [];
    projectedData = backendData.projected || [];
    upperConfidence = backendData.upperConfidence || [];
    lowerConfidence = backendData.lowerConfidence || [];
  } else if (horizon === 7) {
    labels = ['Mon (Act)', 'Tue (Act)', 'Wed (Act)', 'Today (Act)', 'Fri (Proj)', 'Sat (Proj)', 'Sun (Proj)', 'Mon (Proj)', 'Tue (Proj)', 'Wed (Proj)', 'Thu (Proj)'];
    actualData = [240, 290, 210, 280, null, null, null, null, null, null, null];
    projectedData = [null, null, null, 280, 420, 580, 310, 260, 290, 310, 280];
    upperConfidence = [null, null, null, 280, 460, 640, 350, 295, 330, 350, 320];
    lowerConfidence = [null, null, null, 280, 380, 520, 270, 225, 250, 270, 240];
  } else if (horizon === 14) {
    labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10', 'Day 11', 'Day 12', 'Day 13', 'Day 14'];
    actualData = [240, 290, 210, 280, null, null, null, null, null, null, null, null, null, null];
    projectedData = [null, null, null, 280, 420, 580, 310, 260, 290, 310, 280, 410, 550, 290];
    upperConfidence = [null, null, null, 280, 470, 660, 360, 310, 340, 370, 340, 480, 640, 350];
    lowerConfidence = [null, null, null, 280, 370, 500, 260, 210, 240, 250, 220, 340, 460, 230];
  } else {
    // 30 days
    labels = ['Wk 1 Actual', 'Wk 2 Forecast', 'Wk 3 Forecast', 'Wk 4 Forecast'];
    actualData = [1850, null, null, null];
    projectedData = [1850, 2450, 2100, 2380];
    upperConfidence = [1850, 2750, 2400, 2700];
    lowerConfidence = [1850, 2150, 1800, 2060];
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#a4cdb8' : '#758078';

  forecastChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Upper 90% Bound',
          data: upperConfidence,
          borderColor: 'transparent',
          backgroundColor: isDark ? 'rgba(23, 107, 77, 0.15)' : 'rgba(23, 107, 77, 0.08)',
          fill: '+1',
          pointRadius: 0,
          tension: 0.3
        },
        {
          label: 'Lower 90% Bound',
          data: lowerConfidence,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          tension: 0.3
        },
        {
          label: 'Historical Actual Surplus (Meals)',
          data: actualData,
          borderColor: '#176B4D',
          backgroundColor: '#176B4D',
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3
        },
        {
          label: 'Predicted Surplus Trajectory',
          data: projectedData,
          borderColor: '#E6A23C',
          backgroundColor: '#E6A23C',
          borderWidth: 3,
          borderDash: [6, 6],
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: textColor,
            font: { family: 'Inter', size: 12 },
            filter: (item) => item.text !== 'Lower 90% Bound' && item.text !== 'Upper 90% Bound'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: isDark ? '#14201a' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#18251f',
          bodyColor: isDark ? '#a4cdb8' : '#555555',
          borderColor: isDark ? '#23382e' : '#e0e5de',
          borderWidth: 1,
          padding: 10
        }
      },
      scales: {
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'Inter', size: 11 },
            callback: (val) => val + ' meals'
          }
        },
        x: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'Inter', size: 11 }
          }
        }
      }
    }
  });
}

function setupHorizonButtons() {
  const btn7 = document.getElementById('btnHorizon7');
  const btn14 = document.getElementById('btnHorizon14');
  const btn30 = document.getElementById('btnHorizon30');

  const buttons = [btn7, btn14, btn30];

  function setActive(btn) {
    buttons.forEach(b => b && b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  if (btn7) {
    btn7.addEventListener('click', () => {
      setActive(btn7);
      renderForecastChart(7);
    });
  }

  if (btn14) {
    btn14.addEventListener('click', () => {
      setActive(btn14);
      renderForecastChart(14);
    });
  }

  if (btn30) {
    btn30.addEventListener('click', () => {
      setActive(btn30);
      renderForecastChart(30);
    });
  }
}
