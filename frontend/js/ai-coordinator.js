/**
 * FoodResQ AI — Autonomous Logistics Coordinator
 * Interactive 7-Stage closed-loop scheduler and exception recovery simulator.
 * Synchronized with Node.js/Express MongoDB backend recovery service.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCoordinatorModule();
});

let isAutonomous = true;
let isSimulating = false;

function initCoordinatorModule() {
  loadInitialTerminalLogs();
  setupEventListeners();
  fetchInitialBackendStatus();
}

async function fetchInitialBackendStatus() {
  if (window.ApiClient && window.ApiClient.aiCoordinator) {
    try {
      const res = await ApiClient.aiCoordinator.getStatus();
      const data = res.data || res;
      if (data && data.metrics) {
        appendTerminalLog('AI-CORE', 'info', `Connected to backend AI Pipeline v${data.version || '2.4'}. Active models: Perishability Regressor, Dynamic Reroute Solver.`);
      }
    } catch (err) {
      console.warn('[AICoordinator] Status poll note:', err.message);
    }
  }
}

const defaultLogs = [
  { time: '11:45:02', tag: 'INFO', type: 'info', text: 'Telemetry ingestion: Received new surplus batch LST-101 (120 portions cooked veg, Aryabhatta Hostel Mess).' },
  { time: '11:45:04', tag: 'PLAN', type: 'info', text: 'Multi-objective solver executed. Partitioned batch into DEM-201 (70 portions) and DEM-202 (50 portions). Matching score: 94.2/100.' },
  { time: '11:45:06', tag: 'VALIDATE', type: 'info', text: 'Perishability verification passed. Safe deadline (3.5 hrs) > total transit duration (38 mins + 15 min buffer).' },
  { time: '11:45:12', tag: 'DISPATCH', type: 'dispatch', text: 'Assigned driver Rajesh Kumar (EV-409). Turn-by-turn navigation corridor generated.' },
  { time: '11:58:30', tag: 'MONITOR', type: 'info', text: 'Corridor telemetry nominal. Compartment temperature steady at 64°C (FSSAI hot-holding standard).' },
  { time: '12:08:15', tag: 'INFO', type: 'info', text: 'Subscribed to Gurgaon traffic mesh. NH-48 congestion index: moderate (14 min delay potential).' }
];

function loadInitialTerminalLogs() {
  const terminal = document.getElementById('terminalLogs');
  if (!terminal) return;

  terminal.innerHTML = defaultLogs.map(log => createTerminalLine(log.time, log.tag, log.type, log.text)).join('');
}

function createTerminalLine(time, tag, type, text) {
  let tagClass = 'tag-info';
  if (type === 'warning') tagClass = 'tag-warning';
  else if (type === 'reroute') tagClass = 'tag-reroute';
  else if (type === 'dispatch') tagClass = 'tag-dispatch';

  return `
    <div class="terminal-line">
      <span class="terminal-time">[${time}]</span>
      <span class="terminal-tag ${tagClass}">${tag}</span>
      <span class="terminal-msg">${text}</span>
    </div>
  `;
}

function appendTerminalLog(tag, type, text) {
  const terminal = document.getElementById('terminalLogs');
  if (!terminal) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const lineHtml = createTerminalLine(timeStr, tag, type, text);
  terminal.insertAdjacentHTML('beforeend', lineHtml);
  terminal.scrollTop = terminal.scrollHeight;
}

function setupEventListeners() {
  // 1. Run Optimization Cycle
  const btnRunCycle = document.getElementById('btnRunCycle');
  if (btnRunCycle) {
    btnRunCycle.addEventListener('click', async () => {
      btnRunCycle.disabled = true;
      btnRunCycle.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-xs"></i> Running Pipeline...';

      appendTerminalLog('OBSERVE', 'info', 'Scanning all active food listings and pending recipient demands from database...');

      let analysis = null;
      if (window.ApiClient && window.ApiClient.aiCoordinator) {
        try {
          const [analysisRes, expiryRes] = await Promise.all([
            ApiClient.aiCoordinator.getAnalysis().catch(() => null),
            ApiClient.aiCoordinator.runExpiryCheck().catch(() => null)
          ]);
          if (analysisRes && analysisRes.metrics) analysis = analysisRes;
        } catch (e) {
          console.warn('[AI Coordinator]', e.message);
        }
      }

      setTimeout(() => {
        appendTerminalLog('ANALYSE', 'info', `Evaluating perishability horizons: ${analysis ? `${analysis.metrics.urgentListingCount} urgent batches detected (<3.5h)` : 'No critical expiry violations'}.`);
      }, 350);

      setTimeout(() => {
        const available = analysis ? analysis.metrics.totalAvailablePortions : 350;
        const needed = analysis ? analysis.metrics.totalNeededPortions : 280;
        appendTerminalLog('PLAN', 'info', `Linear optimization: ${available} surplus portions mapped against ${needed} demand requirements.`);
        if (analysis && analysis.recommendations && analysis.recommendations.length > 0) {
          appendTerminalLog('RECOMMEND', 'reroute', analysis.recommendations[0].title + ': ' + analysis.recommendations[0].details);
        }
        appendTerminalLog('INFO', 'info', 'Redistribution mesh synchronized with 0 critical unassigned items.');
        btnRunCycle.disabled = false;
        btnRunCycle.innerHTML = '<i class="fa-solid fa-rotate mr-xs"></i> Run Optimization Cycle';
        showToast('AI Optimization cycle finished. All corridors optimized.', 'success');
      }, 800);
    });
  }

  // 2. Toggle Human Approval
  const btnToggleAuto = document.getElementById('btnToggleAuto');
  const approvalStatus = document.getElementById('approvalStatus');
  if (btnToggleAuto && approvalStatus) {
    btnToggleAuto.addEventListener('click', () => {
      isAutonomous = !isAutonomous;
      if (isAutonomous) {
        approvalStatus.textContent = 'Disabled';
        approvalStatus.className = '';
        if (typeof showToast === 'function') showToast('Autonomous Dispatch Mode Activated (Auto-execute plans).', 'info');
      } else {
        approvalStatus.textContent = 'Enabled (Human in the Loop)';
        approvalStatus.className = 'text-warning';
        if (typeof showToast === 'function') showToast('Human-in-the-loop validation required before dispatch.', 'warning');
      }
    });
  }

  // 3. Simulate EV-409 Breakdown
  const btnSimulateBreakdown = document.getElementById('btnSimulateBreakdown');
  const btnResetSimulation = document.getElementById('btnResetSimulation');
  const originalPlanBox = document.getElementById('originalPlanBox');
  const revisedPlanBox = document.getElementById('revisedPlanBox');
  const statusDel101 = document.getElementById('statusDel101');
  const replanStatusBadge = document.getElementById('replanStatusBadge');
  const replanMessage = document.getElementById('replanMessage');
  const replanMetrics = document.getElementById('replanMetrics');

  if (btnSimulateBreakdown) {
    btnSimulateBreakdown.addEventListener('click', async () => {
      if (isSimulating) return;
      isSimulating = true;
      btnSimulateBreakdown.disabled = true;

      // Update UI to critical breakdown
      if (originalPlanBox) originalPlanBox.classList.add('failed');
      if (statusDel101) {
        statusDel101.className = 'badge badge-danger';
        statusDel101.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-xs"></i> Critical: Vehicle Stalled';
      }

      if (typeof showToast === 'function') {
        showToast('ALERT: Driver EV-409 reported powertrain failure at IFFCO Chowk!', 'error');
      }

      // Sequence AI Event Logs
      appendTerminalLog('WARNING', 'warning', 'CRITICAL TELEMETRY: Vehicle HR-26-EV-409 reported zero velocity for 6 minutes near IFFCO Chowk flyover.');
      
      setTimeout(() => {
        appendTerminalLog('WARNING', 'warning', 'Courier Rajesh Kumar flagged immobilizing battery fault. 120 perishable cooked portions at risk.');
      }, 600);

      setTimeout(() => {
        appendTerminalLog('REPLAN', 'info', 'Autonomous replan engine triggered. Seeking cold-chain standby couriers in Sector 29/DLF radius...');
      }, 1200);

      // Trigger backend MongoDB incident and recovery simulation
      let backendRecoveryData = null;
      if (window.ApiClient && window.ApiClient.aiCoordinator) {
        try {
          const res = await ApiClient.aiCoordinator.simulateRecovery();
          backendRecoveryData = res.data || res;
        } catch (err) {
          console.warn('[AICoordinator] Backend simulation call note:', err.message);
        }
      }

      setTimeout(() => {
        appendTerminalLog('REPLAN', 'reroute', 'Candidate found: Anita Sharma (Refrigerated Van EV-812) located 2.1 km away. Acceptability score: 98.7%.');
      }, 1900);

      setTimeout(() => {
        appendTerminalLog('REROUTE', 'reroute', 'Reroute command transmitted. Dispatched Anita Sharma for physical cross-docking at IFFCO Chowk.');
        appendTerminalLog('INFO', 'info', 'Revised ETA to Asha Shelter: 24 mins. 120/120 portions saved from landfill waste (100% Salvage Rate).');

        // Update revised box
        if (revisedPlanBox) {
          revisedPlanBox.classList.add('recovered');
          revisedPlanBox.style.opacity = '1';
        }
        if (replanStatusBadge) {
          replanStatusBadge.className = 'badge badge-success';
          replanStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check mr-xs"></i> Dynamic Salvage Executed';
        }
        if (replanMessage) replanMessage.style.display = 'none';
        if (replanMetrics) replanMetrics.style.display = 'block';

        // Update in localStorage
        const deliveries = StorageManager.getDeliveries();
        const del101 = deliveries.find(d => d.id === 'DEL-101' || d.id === 'del_001');
        if (del101) {
          del101.status = 'recovery_required';
          del101.incident_notes = 'Powertrain breakdown at IFFCO Chowk. Reassigned to standby courier Anita Sharma (EV-812).';
          StorageManager.saveDeliveries(deliveries);
        }

        if (btnSimulateBreakdown) btnSimulateBreakdown.style.display = 'none';
        if (btnResetSimulation) btnResetSimulation.style.display = 'inline-flex';
        isSimulating = false;

        if (typeof showToast === 'function') {
          showToast('Recovery Complete! 100% of portions salvaged by autonomous rerouting in <800ms.', 'success');
        }
      }, 2700);
    });
  }

  // 4. Reset Simulation
  if (btnResetSimulation) {
    btnResetSimulation.addEventListener('click', async () => {
      // Reset backend state
      if (window.ApiClient && window.ApiClient.aiCoordinator) {
        try {
          await ApiClient.aiCoordinator.resetSimulation();
        } catch (err) {
          console.warn('[AICoordinator] Reset API call note:', err.message);
        }
      }

      if (originalPlanBox) originalPlanBox.classList.remove('failed');
      if (statusDel101) {
        statusDel101.className = 'badge badge-primary';
        statusDel101.textContent = 'In Transit';
      }

      if (revisedPlanBox) {
        revisedPlanBox.classList.remove('recovered');
        revisedPlanBox.style.opacity = '0.7';
      }
      if (replanStatusBadge) {
        replanStatusBadge.className = 'badge badge-subtle';
        replanStatusBadge.textContent = 'Standing By';
      }
      if (replanMessage) replanMessage.style.display = 'block';
      if (replanMetrics) replanMetrics.style.display = 'none';

      if (btnSimulateBreakdown) {
        btnSimulateBreakdown.style.display = 'inline-flex';
        btnSimulateBreakdown.disabled = false;
      }
      if (btnResetSimulation) btnResetSimulation.style.display = 'none';

      // Restore storage
      const deliveries = StorageManager.getDeliveries();
      const del101 = deliveries.find(d => d.id === 'DEL-101' || d.id === 'del_001');
      if (del101) {
        del101.status = 'in_transit';
        delete del101.incident_notes;
        StorageManager.saveDeliveries(deliveries);
      }

      appendTerminalLog('INFO', 'info', 'Simulation reset. Network restored to baseline operating state.');
      if (typeof showToast === 'function') {
        showToast('Simulator reset to baseline operational parameters.', 'info');
      }
    });
  }

  // 5. Clear Logs
  const btnClearLogs = document.getElementById('btnClearLogs');
  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      const terminal = document.getElementById('terminalLogs');
      if (terminal) {
        terminal.innerHTML = '<div class="terminal-line"><span class="terminal-time">[SYS]</span> <span class="terminal-tag tag-info">INFO</span> <span>Terminal buffer cleared. Listening for new events...</span></div>';
      }
    });
  }

  // 6. Export Logs
  const btnExportLogs = document.getElementById('btnExportLogs');
  if (btnExportLogs) {
    btnExportLogs.addEventListener('click', () => {
      const lines = Array.from(document.querySelectorAll('.terminal-line')).map(el => el.innerText);
      const text = lines.join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foodresq_ai_decision_log_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      if (typeof showToast === 'function') showToast('Decision log exported successfully.', 'success');
    });
  }
}
