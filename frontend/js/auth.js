/**
 * FoodResQ AI — Real Backend Authentication & Persona Handler
 * Connects login and registration to Node/Express JWT endpoints with resilient demo fallback
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const togglePwdBtn = document.getElementById('toggle-pwd-btn');

  // Password Visibility Toggle
  if (togglePwdBtn) {
    togglePwdBtn.addEventListener('click', () => {
      const pwdInput = document.getElementById('login-password') || document.getElementById('reg-password');
      if (pwdInput) {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        togglePwdBtn.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
      }
    });
  }

  // Real Backend Login Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pwd = document.getElementById('login-password').value.trim();

      if (!email || !pwd) {
        showToast('Please enter both email and password', 'danger');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-xs"></i> Signing In...';
      }

      try {
        if (typeof ApiClient !== 'undefined') {
          const res = await ApiClient.auth.login({ email, password: pwd });
          if (res.token) {
            ApiClient.setToken(res.token);
            StorageManager.setUser(res.user);
            showToast(`Authenticated as ${res.user.name} (${res.user.role}). Redirecting...`, 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 400);
            return;
          }
        }
        throw new Error('Fallback to local session');
      } catch (err) {
        console.warn('[Auth Notice] Backend authentication:', err.message);
        if (err.status === 401 || err.status === 403 || err.status === 400) {
          showToast(err.message, 'danger');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In to Dashboard</span> <i class="fa-solid fa-arrow-right"></i>';
          }
          return;
        }

        // Offline / Demo fallback
        showToast('Offline mode: Authenticating demo persona session...', 'info');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 400);
      }
    });
  }

  // Real Backend Registration Handler
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const org = document.getElementById('reg-org') ? document.getElementById('reg-org').value.trim() : '';
      const role = document.getElementById('reg-role') ? document.getElementById('reg-role').value : 'provider';
      const city = document.getElementById('reg-city') ? document.getElementById('reg-city').value.trim() : 'Gurugram';
      const phone = document.getElementById('reg-phone') ? document.getElementById('reg-phone').value.trim() : '';
      const pwd = document.getElementById('reg-password') ? document.getElementById('reg-password').value : 'DemoPassword123!';

      if (!name || !email) {
        showToast('Please complete all required fields', 'danger');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-xs"></i> Registering Partner...';
      }

      try {
        if (typeof ApiClient !== 'undefined') {
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
            showToast(`Welcome ${name}! Registered as ${role}. Redirecting...`, 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
            return;
          }
        }
        throw new Error('Fallback to local registration');
      } catch (err) {
        if (err.status === 409 || err.status === 400) {
          showToast(err.message, 'danger');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Complete Registration';
          }
          return;
        }

        // Local fallback
        const newUser = { id: `usr_${Date.now()}`, name, email, role, organisationName: org, city };
        StorageManager.setUser(newUser);
        showToast(`Welcome ${name}! Registered locally as ${role}.`, 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
      }
    });
  }
});

/**
 * 1-Click Persona Simulator
 * Real backend session token + user hydration
 */
async function pickDemoPersona(role) {
  const buttons = document.querySelectorAll('.persona-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }

  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  if (pwdInput) pwdInput.value = 'DemoPassword123!';

  try {
    if (typeof ApiClient !== 'undefined') {
      const res = await ApiClient.auth.simulatePersona(role);
      if (res.token) {
        ApiClient.setToken(res.token);
        StorageManager.setUser(res.user);
        if (emailInput) emailInput.value = res.user.email;
        showToast(`Simulated active role: ${res.user.name} (${res.user.role}) via Backend API.`, 'success');
        return;
      }
    }
  } catch (e) {
    console.warn('[Persona API]', e.message);
  }

  // Fallback to static persona
  const personas = {
    admin: { email: 'ananya@foodresq.ai', name: 'Ananya Deshmukh', role: 'admin', organisationName: 'FoodResQ AI Central Operations' },
    provider: { email: 'mess2@aryabhatta.edu.in', name: 'Dr. Rameshwar Meena', role: 'provider', organisationName: 'Aryabhatta University Hostel' },
    recipient: { email: 'shelter@ashacommunity.org', name: 'Sister Teresa David', role: 'recipient', organisationName: 'Asha Community Shelter' },
    driver: { email: 'rajesh.kumar@greenev.in', name: 'Rajesh Kumar', role: 'driver', organisationName: 'Gurugram Green EV Logistics' }
  };

  const selected = personas[role] || personas.admin;
  if (emailInput) emailInput.value = selected.email;
  StorageManager.setUser(selected);
  showToast(`Selected persona: ${selected.name} (${selected.role})`, 'info');
}
