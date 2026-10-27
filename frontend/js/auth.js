/**
 * FoodResQ AI — Real Backend Authentication & Fluid Persona Controller
 * Seamless JWT integration, real-time input validation, inline alerts & micro-interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  initLoginForm();
  initRegisterForm();
  checkExistingSession();
});

function initAuthUI() {
  const togglePwdBtn = document.getElementById('toggle-pwd-btn');
  const emailInput = document.getElementById('login-email');
  const emailHint = document.getElementById('email-valid-hint');

  // Password Visibility Toggle with Smooth Icon Transition
  if (togglePwdBtn) {
    togglePwdBtn.addEventListener('click', () => {
      const pwdInput = document.getElementById('login-password') || document.getElementById('reg-password');
      if (pwdInput) {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        togglePwdBtn.innerHTML = isPwd 
          ? '<i class="fa-solid fa-eye-slash" style="color: var(--color-primary);"></i>' 
          : '<i class="fa-solid fa-eye"></i>';
        togglePwdBtn.setAttribute('title', isPwd ? 'Hide password' : 'Show password');
      }
    });
  }

  // Real-time Email Format Validation
  if (emailInput && emailHint) {
    emailInput.addEventListener('input', () => {
      const val = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(val)) {
        emailHint.style.display = 'inline-flex';
        emailInput.style.borderColor = 'var(--color-success)';
      } else {
        emailHint.style.display = 'none';
        emailInput.style.borderColor = '';
      }
    });
  }

  // Check remembered email
  const remembered = localStorage.getItem('foodresq_remembered_email');
  if (remembered && emailInput && !emailInput.value) {
    emailInput.value = remembered;
    const rememberMeBox = document.getElementById('remember-me');
    if (rememberMeBox) rememberMeBox.checked = true;
  }
}

function checkExistingSession() {
  const sessionBanner = document.getElementById('active-session-banner');
  const sessionName = document.getElementById('active-session-name');
  const sessionRole = document.getElementById('active-session-role');

  if (sessionBanner && typeof StorageManager !== 'undefined') {
    const user = StorageManager.getUser();
    const token = typeof ApiClient !== 'undefined' ? ApiClient.getToken() : '';

    if (user && user.name && token) {
      if (sessionName) sessionName.textContent = user.name;
      if (sessionRole) sessionRole.textContent = (user.role || 'user').toUpperCase();
      sessionBanner.style.display = 'block';
    }
  }
}

function showAuthAlert(message) {
  const alertEl = document.getElementById('auth-alert');
  const msgEl = document.getElementById('auth-alert-message');
  if (alertEl && msgEl) {
    msgEl.textContent = message;
    alertEl.style.display = 'flex';
    alertEl.classList.remove('shake');
    // Force re-flow to trigger shake animation
    void alertEl.offsetWidth;
    alertEl.classList.add('shake');
  }
}

function hideAuthAlert() {
  const alertEl = document.getElementById('auth-alert');
  if (alertEl) alertEl.style.display = 'none';
}

function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();

    const emailInput = document.getElementById('login-email');
    const pwdInput = document.getElementById('login-password');
    const email = emailInput ? emailInput.value.trim() : '';
    const pwd = pwdInput ? pwdInput.value : '';
    const rememberMe = document.getElementById('remember-me')?.checked;

    if (!email || !pwd) {
      showAuthAlert('Please enter both your email address and password.');
      if (!email && emailInput) emailInput.focus();
      else if (pwdInput) pwdInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAuthAlert('Please enter a valid email address (e.g. name@organisation.org).');
      if (emailInput) emailInput.focus();
      return;
    }

    const submitBtn = document.getElementById('btn-submit') || loginForm.querySelector('button[type="submit"]');
    const btnText = document.getElementById('btn-submit-text');
    const btnIcon = document.getElementById('btn-submit-icon');

    // Enter Loading State
    if (submitBtn) {
      submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'Verifying Credentials...';
      if (btnIcon) btnIcon.className = 'fa-solid fa-circle-notch fa-spin';
    }

    try {
      if (typeof ApiClient !== 'undefined' && ApiClient.auth) {
        const res = await ApiClient.auth.login({ email, password: pwd });
        if (res && res.token) {
          ApiClient.setToken(res.token);
          StorageManager.setUser(res.user);

          if (rememberMe) {
            localStorage.setItem('foodresq_remembered_email', email);
          } else {
            localStorage.removeItem('foodresq_remembered_email');
          }

          // Transition to Success State
          if (submitBtn) {
            submitBtn.classList.add('success-state');
            if (btnText) btnText.textContent = `Access Granted • Welcome ${res.user.name.split(' ')[0]}!`;
            if (btnIcon) btnIcon.className = 'fa-solid fa-circle-check';
          }

          showToast(`Authenticated as ${res.user.name} (${res.user.role.toUpperCase()}). Launching console...`, 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 550);
          return;
        }
      }
      throw new Error('Backend authentication returned empty payload');
    } catch (err) {
      console.warn('[Auth Error]', err.message);

      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('success-state');
        if (btnText) btnText.textContent = 'Sign In to Dashboard';
        if (btnIcon) btnIcon.className = 'fa-solid fa-arrow-right';
      }

      const errorMsg = err.status === 401 
        ? 'Invalid email address or password. For demo testing, password is DemoPassword123!'
        : (err.message || 'Unable to authenticate. Please check your credentials.');

      showAuthAlert(errorMsg);
      showToast(errorMsg, 'danger');
    }
  });
}

function initRegisterForm() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const org = document.getElementById('reg-org')?.value.trim() || '';
    const role = document.getElementById('reg-role')?.value || 'provider';
    const city = document.getElementById('reg-city')?.value.trim() || 'Gurugram';
    const phone = document.getElementById('reg-phone')?.value.trim() || '';
    const pwd = document.getElementById('reg-password')?.value || 'DemoPassword123!';

    if (!name || !email) {
      showToast('Please complete all required fields', 'danger');
      return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-xs"></i> Registering Partner Node...';
    }

    try {
      if (typeof ApiClient !== 'undefined' && ApiClient.auth) {
        const res = await ApiClient.auth.register({
          name,
          email,
          password: pwd,
          role,
          organisationName: org,
          phone,
          city
        });

        if (res.token) {
          ApiClient.setToken(res.token);
          StorageManager.setUser(res.user);
          showToast(`Welcome ${name}! Registered as ${role.toUpperCase()}. Launching dashboard...`, 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
          return;
        }
      }
      throw new Error('Local fallback');
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Complete Registration <i class="fa-solid fa-arrow-right"></i>';
      }
      showToast(err.message || 'Registration failed. Please check inputs.', 'danger');
    }
  });
}

/**
 * 1-Click Interactive Persona Selector
 * Seamlessly populates credentials and acquires an active JWT session token
 */
async function pickDemoPersona(role) {
  hideAuthAlert();

  // 1. Update Card Highlight States
  const allCards = document.querySelectorAll('.persona-card');
  allCards.forEach(c => c.classList.remove('active'));

  const selectedCard = document.getElementById(`persona-${role}`);
  if (selectedCard) selectedCard.classList.add('active');

  // 2. Persona Metadata Definitions (Matching DB Seeds)
  const personas = {
    admin: {
      email: 'ananya@foodresq.ai',
      name: 'Ananya Deshmukh',
      role: 'admin',
      org: 'FoodResQ AI Central Operations',
      title: 'Administrator & Central Dispatcher'
    },
    provider: {
      email: 'mess2@aryabhatta.edu.in',
      name: 'Dr. Rameshwar Meena',
      role: 'provider',
      org: 'Aryabhatta Hostel — Mess 2',
      title: 'Food Provider / Hostel Warden'
    },
    recipient: {
      email: 'shelter@ashacommunity.org',
      name: 'Sister Teresa David',
      role: 'recipient',
      org: 'Asha Community Shelter & Food Bank',
      title: 'Recipient Shelter Coordinator'
    },
    driver: {
      email: 'rajesh.kumar@greenev.in',
      name: 'Rajesh Kumar',
      role: 'driver',
      org: 'Gurugram Green EV Logistics',
      title: 'EV Delivery Courier'
    }
  };

  const selected = personas[role] || personas.admin;

  // 3. Pre-fill Inputs with Correct Seed Credentials
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const emailHint = document.getElementById('email-valid-hint');

  if (emailInput) {
    emailInput.value = selected.email;
    if (emailHint) emailHint.style.display = 'inline-flex';
    emailInput.style.borderColor = 'var(--color-success)';
  }

  if (pwdInput) {
    pwdInput.value = 'DemoPassword123!';
  }

  // 4. Update Selected Persona Ribbon Display
  const ribbonText = document.getElementById('persona-ribbon-text');
  const ribbonRole = document.getElementById('persona-ribbon-role');
  if (ribbonText) {
    ribbonText.innerHTML = `Active Persona: <strong>${selected.name}</strong> &bull; ${selected.org}`;
  }
  if (ribbonRole) {
    ribbonRole.textContent = selected.role.toUpperCase();
  }

  // 5. Pre-authenticate with Real JWT Backend Simulation
  try {
    if (typeof ApiClient !== 'undefined' && ApiClient.auth) {
      const res = await ApiClient.auth.simulatePersona(role);
      if (res && res.token) {
        ApiClient.setToken(res.token);
        StorageManager.setUser(res.user);
        showToast(`Loaded ${selected.name} (${selected.role.toUpperCase()}) credentials.`, 'info');
        return;
      }
    }
  } catch (e) {
    console.warn('[Persona Simulation]', e.message);
  }

  StorageManager.setUser(selected);
  showToast(`Selected persona: ${selected.name}`, 'info');
}

function handleForgotPassword() {
  const pwdInput = document.getElementById('login-password');
  if (pwdInput) {
    pwdInput.value = 'DemoPassword123!';
    showToast('Default password "DemoPassword123!" restored in field.', 'info');
  }
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.pickDemoPersona = pickDemoPersona;
  window.hideAuthAlert = hideAuthAlert;
  window.handleForgotPassword = handleForgotPassword;
}
