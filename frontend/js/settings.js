/**
 * FoodResQ AI — Settings & System Preferences
 * User profile management, demo persona switcher, and localStorage database operations.
 * Connected to Node.js/Express MongoDB Authentication & Persona Switcher.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSettingsModule();
});

function initSettingsModule() {
  loadProfileData();
  setupPersonaSelector();
  setupProfileForm();
  setupStorageManagement();
}

function loadProfileData() {
  const user = StorageManager.getCurrentUser();
  if (!user) return;

  const profName = document.getElementById('profName');
  const profEmail = document.getElementById('profEmail');
  const profOrg = document.getElementById('profOrg');
  const profPhone = document.getElementById('profPhone');

  if (profName) profName.value = user.name || '';
  if (profEmail) profEmail.value = user.email || '';
  if (profOrg) profOrg.value = user.organization || user.organisationName || '';
  if (profPhone) profPhone.value = user.phone || '+91 98123 45678';

  updatePersonaBadges(user.role || 'admin');
}

function updatePersonaBadges(activeRole) {
  const roles = ['admin', 'provider', 'recipient', 'driver'];
  roles.forEach(role => {
    const capitalized = role.charAt(0).toUpperCase() + role.slice(1);
    const badge = document.getElementById(`personaBadge${capitalized}`);
    if (badge) {
      if (role === activeRole) {
        badge.className = 'badge badge-primary';
        badge.textContent = 'Active';
      } else {
        badge.className = 'badge badge-subtle';
        badge.textContent = 'Switch';
      }
    }
  });
}

function setupPersonaSelector() {
  const personaCards = document.querySelectorAll('[data-persona-select]');
  personaCards.forEach(card => {
    card.addEventListener('click', async () => {
      const role = card.getAttribute('data-persona-select');

      let userObj = null;

      if (window.ApiClient && window.ApiClient.auth) {
        try {
          const res = await ApiClient.auth.simulatePersona(role);
          if (res.token) {
            ApiClient.setToken(res.token);
          }
          userObj = res.user;
        } catch (err) {
          console.warn('[Settings] Backend simulate persona note:', err.message);
        }
      }

      if (!userObj && typeof DEMO_DATA !== 'undefined' && DEMO_DATA.personas) {
        userObj = DEMO_DATA.personas[role];
      }

      if (!userObj) return;

      StorageManager.setCurrentUser(userObj);
      updatePersonaBadges(role);
      loadProfileData();

      // Update Navigation
      if (typeof Navigation !== 'undefined' && Navigation.updateUserDisplay) {
        Navigation.updateUserDisplay();
      }

      const msg = `Switched active persona to ${userObj.name} (${userObj.organization || userObj.organisationName || role}).`;
      if (typeof showToast === 'function') {
        showToast(msg, 'success');
      } else if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(msg, 'success');
      }
    });
  });
}

function setupProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentUser = StorageManager.getCurrentUser() || {};
    currentUser.name = document.getElementById('profName').value.trim();
    currentUser.email = document.getElementById('profEmail').value.trim();
    currentUser.organization = document.getElementById('profOrg').value.trim();
    currentUser.phone = document.getElementById('profPhone').value.trim();

    StorageManager.setCurrentUser(currentUser);

    if (typeof Navigation !== 'undefined' && Navigation.updateUserDisplay) {
      Navigation.updateUserDisplay();
    }

    if (typeof showToast === 'function') {
      showToast('Profile preferences updated successfully.', 'success');
    } else if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Profile preferences updated successfully.', 'success');
    }
  });
}

function setupStorageManagement() {
  // 1. Reset Demo Data
  const btnReset = document.getElementById('btnResetAllData');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data? This will restore the pristine Gurugram demonstration state.')) {
        StorageManager.resetAll();
        if (typeof showToast === 'function') {
          showToast('Demo database restored to default factory state!', 'success');
        } else if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('Demo database restored to default factory state!', 'success');
        }
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  }

  // 2. Export JSON Snapshot
  const btnExport = document.getElementById('btnExportJSON');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dump = {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        listings: StorageManager.getListings(),
        demand: StorageManager.getDemand(),
        deliveries: StorageManager.getDeliveries(),
        drivers: StorageManager.getDrivers(),
        currentUser: StorageManager.getCurrentUser()
      };

      const jsonStr = JSON.stringify(dump, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foodresq_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      if (typeof showToast === 'function') {
        showToast('Full JSON database backup downloaded.', 'success');
      } else if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Full JSON database backup downloaded.', 'success');
      }
    });
  }

  // 3. Import JSON Snapshot
  const fileInput = document.getElementById('jsonFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.listings && parsed.demand && parsed.deliveries) {
            StorageManager.saveListings(parsed.listings);
            StorageManager.saveDemand(parsed.demand);
            StorageManager.saveDeliveries(parsed.deliveries);
            if (parsed.drivers) StorageManager.saveDrivers(parsed.drivers);
            if (parsed.currentUser) StorageManager.setCurrentUser(parsed.currentUser);

            if (typeof showToast === 'function') {
              showToast('State successfully restored from JSON snapshot!', 'success');
            } else if (typeof App !== 'undefined' && App.showToast) {
              App.showToast('State successfully restored from JSON snapshot!', 'success');
            }
            setTimeout(() => {
              window.location.reload();
            }, 800);
          } else {
            if (typeof showToast === 'function') showToast('Invalid backup file structure.', 'error');
            else if (typeof App !== 'undefined' && App.showToast) App.showToast('Invalid backup file structure.', 'error');
          }
        } catch (err) {
          if (typeof showToast === 'function') showToast('Failed to parse JSON file.', 'error');
          else if (typeof App !== 'undefined' && App.showToast) App.showToast('Failed to parse JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    });
  }
}
