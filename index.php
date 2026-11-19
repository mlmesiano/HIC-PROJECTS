<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CELTECH Library - BSIT Project</title>
<link rel="stylesheet" href="index.css">
</head>
<body>

<!-- LOGIN -->
<div id="login">
  <div class="card">
    <div class="brand">
      <div class="logo"><img src="images.jpg" alt="CELTECH Library Logo error" style="height: 100px;" width="100"></div>
      <h1>CELTECH LIBRARY</h1>
      <p>BSIT 3A - Digital Library Reservation<br>Choose your account type</p>
    </div>

    <div class="tabs" role="tablist" id="tabs">
      <span class="indicator" id="indicator"></span>
      <button class="tab active" id="tab-student" role="tab" onclick="setRole('student')">Student</button>
      <button class="tab" id="tab-teacher" role="tab" onclick="setRole('teacher')">Teacher</button>
      <button class="tab admin-tab" id="tab-admin" role="tab" onclick="setRole('admin')">Admin</button>
    </div>

    <p class="welcome" id="loginTitle">Student login</p>

    <div id="loginError" role="alert"></div>

    <div class="field">
      <input type="text" id="loginAccountId" placeholder="Account ID" autocomplete="username" required aria-label="Account ID">
    </div>
    <div class="field">
      <input type="password" id="loginPassword" placeholder="Password" autocomplete="current-password" required aria-label="Password">
      <button type="button" class="eye" id="eyeBtn" aria-label="Show password" aria-pressed="false" onclick="togglePass()">
        <svg class="password-eye" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <svg class="password-eye-off" viewBox="0 0 24 24" aria-hidden="true" hidden>
          <path d="m3 3 18 18"></path>
          <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.1 3.9"></path>
          <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4-.8"></path>
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
        </svg>
      </button>
    </div>

    <button id="loginButton" onclick="doLogin()">LOGIN</button>

    <button type="button" class="link-btn fp-link" id="forgotLink" onclick="openForgot()">Forgot Password?</button>

    <p class="hint" id="loginHint">Demo Account ID: 202411059 / password</p>
    <button class="link-btn" id="adminLink" onclick="setRole('admin')">Library staff? Admin login</button>
  </div>
</div>

<!-- FORGOT PASSWORD MODAL (demo OTP flow) -->
<div class="fp-overlay" id="fpOverlay" aria-hidden="true">
  <div class="fp-modal" role="dialog" aria-modal="true" aria-labelledby="fpTitle" aria-describedby="fpDesc">
    <button type="button" class="fp-x" aria-label="Close" onclick="closeForgot()">✕</button>

    <h3 id="fpTitle">Forgot Password?</h3>
    <p class="fp-desc" id="fpDesc"></p>
    <div class="fp-steps" aria-hidden="true">
      <span class="fp-dot on"></span><span class="fp-dot"></span><span class="fp-dot"></span>
    </div>

    <div class="fp-msg" id="fpError" role="alert"></div>

    <!-- Step 1: email -->
    <div class="fp-step on" id="fpStep1">
      <div class="field"><input type="email" id="fpEmail" placeholder="Email address" autocomplete="email" aria-label="Email address"></div>
      <button type="button" class="fp-btn" onclick="sendOtp()">Send OTP</button>
    </div>

    <!-- Step 2: verify OTP -->
    <div class="fp-step" id="fpStep2">
      <div class="fp-otpbox">DEMO ONLY - no email is sent. Your OTP is:<b id="fpOtpShow">------</b></div>
      <div class="field"><input type="text" id="fpOtpInput" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP" autocomplete="one-time-code" aria-label="OTP code"></div>
      <button type="button" class="fp-btn" onclick="verifyOtp()">Verify OTP</button>
      <button type="button" class="fp-small" onclick="sendOtp()">Generate a new OTP</button>
    </div>

    <!-- Step 3: new password -->
    <div class="fp-step" id="fpStep3">
      <div class="field"><input class="has-password-toggle" type="password" id="fpNewPass" placeholder="New Password (min. 6 characters)" autocomplete="new-password" aria-label="New password">
        <button type="button" class="eye" aria-label="Show password" aria-pressed="false" onclick="togglePasswordField(this)">
          <svg class="password-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <svg class="password-eye-off" viewBox="0 0 24 24" aria-hidden="true" hidden><path d="m3 3 18 18"></path><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.1 3.9"></path><path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4-.8"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path></svg>
        </button>
      </div>
      <div class="field"><input class="has-password-toggle" type="password" id="fpConfirmPass" placeholder="Confirm Password" autocomplete="new-password" aria-label="Confirm password">
        <button type="button" class="eye" aria-label="Show password" aria-pressed="false" onclick="togglePasswordField(this)">
          <svg class="password-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <svg class="password-eye-off" viewBox="0 0 24 24" aria-hidden="true" hidden><path d="m3 3 18 18"></path><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.1 3.9"></path><path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4-.8"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path></svg>
        </button>
      </div>
      <button type="button" class="fp-btn" onclick="resetPassword()">Reset Password</button>
    </div>

    <!-- Step 4: success -->
    <div class="fp-step" id="fpStep4">
      <div class="fp-ok">
        <div class="tick">✓</div>
        <p id="fpSuccessText"></p>
      </div>
    </div>

    <button type="button" class="fp-back" onclick="closeForgot()">Back to Login</button>
  </div>
</div>

<!-- DEMO PORTAL (replace with your dashboard) -->
<div id="portal">
  <h2 id="portalText"></h2>
  <button onclick="logout()">Log out</button>
</div>

<script src="account-storage.js"></script>
<script>
// ================== SET YOUR PAGE LINKS HERE ==================
// Where each role goes after a successful login.
// Leave "" (empty) until the page exists - a demo screen shows instead.
const pages = {
  student: "dashboard-student.html",
  teacher: "dashboard-teacher.html",   // <-- put teacher page here, e.g. "teacher.html"
  admin:   "dashboard-admin.html"    // <-- put admin page here,   e.g. "admin.html"
};
// ===============================================================

// Static demo accounts come from account-storage.js; registered accounts are browser-local.
const accounts = Object.fromEntries(INITIAL_LIBRARY_ACCOUNTS.map(function (account) {
  const saved = getLibraryAccountById(account.id);
  return [account.role, { ...saved, pass: saved.password }];
}));

let currentRole = "student";
let adminShown = false;
let loginRequestInProgress = false;
let loginLockCheckTimer = null;
let loginLockCountdownTimer = null;
let loginLockSequence = 0;
let lockedLoginIdentity = null;

const loginLockWarning = "Too many failed login attempts. Please try again in 5 minutes.";

function getLoginIdentity(role, identifier) {
  return role + ":" + identifier.trim().toLowerCase();
}

function clearLoginLockUi() {
  clearTimeout(loginLockCountdownTimer);
  loginLockCountdownTimer = null;
  lockedLoginIdentity = null;
  document.getElementById("loginPassword").disabled = false;
  document.getElementById("loginButton").disabled = loginRequestInProgress;
  if (!loginRequestInProgress) document.getElementById("loginButton").textContent = "LOGIN";
}

function applyLoginLockState(result, role, identifier) {
  const accountIdInput = document.getElementById("loginAccountId");
  if (role !== currentRole ||
      getLoginIdentity(role, identifier) !== getLoginIdentity(currentRole, accountIdInput.value)) {
    return false;
  }

  const identity = getLoginIdentity(role, identifier);
  clearTimeout(loginLockCountdownTimer);
  if (result.locked) {
    lockedLoginIdentity = identity;
    document.getElementById("loginPassword").disabled = true;
    document.getElementById("loginButton").disabled = true;
    showError(loginLockWarning);
    loginLockCountdownTimer = setTimeout(function () {
      refreshLoginLock(role, identifier);
    }, Math.max(1, result.retry_after_ms));
    return true;
  }

  if (lockedLoginIdentity === identity) {
    clearLoginLockUi();
    if (document.getElementById("loginError").textContent === loginLockWarning) {
      document.getElementById("loginError").style.display = "none";
    }
  }
  return false;
}

async function requestLoginAttempt(action, role, identifier) {
  const response = await fetch("login-attempts.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: action, role: role, account_id: identifier })
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to verify login attempt.");
  }
  if (!response.ok) throw new Error(result.error || "Unable to verify login attempt.");
  return result;
}

async function refreshLoginLock(role, identifier) {
  const sequence = ++loginLockSequence;
  try {
    const result = await requestLoginAttempt("check", role, identifier);
    if (sequence === loginLockSequence) applyLoginLockState(result, role, identifier);
  } catch {
    if (sequence === loginLockSequence &&
        role === currentRole &&
        getLoginIdentity(role, identifier) === getLoginIdentity(currentRole, document.getElementById("loginAccountId").value)) {
      showError("Unable to verify login attempt. Please try again.");
    }
  }
}

function scheduleLoginLockCheck() {
  clearTimeout(loginLockCheckTimer);
  const identifier = document.getElementById("loginAccountId").value.trim();
  const identity = getLoginIdentity(currentRole, identifier);
  if (lockedLoginIdentity && lockedLoginIdentity !== identity) clearLoginLockUi();
  if (!identifier) return;

  const role = currentRole;
  loginLockCheckTimer = setTimeout(function () {
    refreshLoginLock(role, identifier);
  }, 250);
}

// Slide the white pill under the active tab
function moveIndicator() {
  const tab = document.querySelector(".tab.active");
  const ind = document.getElementById("indicator");
  if (!tab || !tab.offsetWidth) return;
  ind.style.width = tab.offsetWidth + "px";
  ind.style.transform = "translateX(" + tab.offsetLeft + "px)";
}

// Keep the pill glued to its tab while tabs are resizing (no lag)
function trackIndicator(ms) {
  const ind = document.getElementById("indicator");
  ind.style.transition = "none";
  const end = performance.now() + ms;
  (function frame() {
    moveIndicator();
    if (performance.now() < end) requestAnimationFrame(frame);
    else ind.style.transition = "";
  })();
}

function activateTab(role) {
  ["student", "teacher", "admin"].forEach(function (r) {
    document.getElementById("tab-" + r).classList.toggle("active", r === role);
  });
  moveIndicator();
}

function setRole(role) {
  loginLockSequence++;
  clearTimeout(loginLockCheckTimer);
  clearLoginLockUi();
  currentRole = role;

  const label = role.charAt(0).toUpperCase() + role.slice(1);
  document.getElementById("loginTitle").textContent = label + " login";
  document.getElementById("loginHint").textContent =
    "Demo Account ID: " + accounts[role].id + " / " + accounts[role].pass;

  if (role === "admin" && !adminShown) {
    // 1) Admin tab pops in on the right  2) pill slides from Teacher to Admin
    adminShown = true;
    document.getElementById("adminLink").style.display = "none";
    document.getElementById("tab-admin").classList.add("show");
    trackIndicator(480);
    setTimeout(function () { activateTab("admin"); }, 480);
  } else {
    activateTab(role);
  }

  clearValidation();
  document.getElementById("loginAccountId").value = "";
  document.getElementById("loginPassword").value = "";
  const loginPasswordToggle = document.getElementById("eyeBtn");
  if (document.getElementById("loginPassword").type === "text") togglePasswordField(loginPasswordToggle);
  document.getElementById("loginAccountId").focus();
}

window.addEventListener("resize", moveIndicator);
window.addEventListener("load", function () { trackIndicator(100); });

function clearValidation() {
  document.getElementById("loginAccountId").classList.remove("login-input-error", "login-input-valid");
  document.getElementById("loginPassword").classList.remove("login-input-error", "login-input-valid");
  document.getElementById("loginError").style.display = "none";
}

function showError(msg) {
  const error = document.getElementById("loginError");
  error.textContent = msg;
  error.style.display = "block";
}

function togglePass() {
  togglePasswordField(document.getElementById("eyeBtn"));
}

function togglePasswordField(button) {
  const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.querySelector(".password-eye").hidden = show;
  button.querySelector(".password-eye-off").hidden = !show;
  button.setAttribute("aria-label", show ? "Hide password" : "Show password");
  button.setAttribute("aria-pressed", String(show));
}

function doLogin() {
  if (loginRequestInProgress) return;
  const accountIdInput = document.getElementById("loginAccountId");
  const passInput = document.getElementById("loginPassword");
  const button = document.getElementById("loginButton");
  if (button.disabled || passInput.disabled) return;

  const role = currentRole;
  const identifier = accountIdInput.value.trim();
  const pass = passInput.value.trim();

  clearValidation();

  if (!identifier) {
    accountIdInput.classList.add("login-input-error");
    showError("Account ID is required.");
    accountIdInput.focus();
    return;
  }
  if (!pass) {
    passInput.classList.add("login-input-error");
    showError("Password is required.");
    passInput.focus();
    return;
  }

  const sequence = ++loginLockSequence;
  clearTimeout(loginLockCheckTimer);
  loginRequestInProgress = true;
  button.disabled = true;
  button.innerHTML = '<span class="login-spinner"></span>Logging in...';

  (async function () {
    let redirecting = false;
    try {
      const lockStatus = await requestLoginAttempt("check", role, identifier);
      if (sequence !== loginLockSequence) return;
      if (applyLoginLockState(lockStatus, role, identifier)) return;

      const account = findLoginAccount(role, identifier);
      const correctPass = Boolean(account && pass === account.password);
      if (!correctPass) {
        const failure = await requestLoginAttempt("failure", role, identifier);
        if (sequence !== loginLockSequence) return;
        if (applyLoginLockState(failure, role, identifier)) return;

        passInput.classList.add("login-input-error");
        showError((account
          ? "Incorrect password. Please try again. "
          : "No " + role + " account found with this Account ID. ") +
          failure.remaining_attempts + " attempts remaining.");
        if (account) accountIdInput.classList.add("login-input-valid");
        else accountIdInput.classList.add("login-input-error");
        return;
      }

      const success = await requestLoginAttempt("success", role, identifier);
      if (sequence !== loginLockSequence) return;
      if (applyLoginLockState(success, role, identifier)) return;

      accountIdInput.classList.add("login-input-valid");
      passInput.classList.add("login-input-valid");
      loginRequestInProgress = false;
      redirecting = true;

      setTimeout(() => {
        localStorage.setItem("celtech_user", JSON.stringify({
          name: account.name,
          role: account.role,
          id: account.id,
          accountUid: account.accountUid
        }));

        if (pages[role]) {
          window.location.href = pages[role];
          return;
        }

        document.getElementById("login").style.display = "none";
        button.disabled = false;
        button.textContent = "LOGIN";

        if (typeof updateProfile === "function") updateProfile();
        if (typeof render === "function") render();
        showPortal(role, account.name);
      }, 1200);
    } catch (error) {
      if (sequence === loginLockSequence &&
          role === currentRole &&
          getLoginIdentity(role, identifier) === getLoginIdentity(currentRole, accountIdInput.value)) {
        showError(error.message || "Unable to verify login attempt. Please try again.");
      }
    } finally {
      loginRequestInProgress = false;
      if (!redirecting) {
        const isLocked = lockedLoginIdentity === getLoginIdentity(currentRole, accountIdInput.value);
        button.disabled = isLocked;
        passInput.disabled = isLocked;
        button.textContent = "LOGIN";
      }
    }
  })();
}
window.doLogin = doLogin;

// Red -> green as soon as the person types again
function validateLoginField(input) {
  if (input.id === "loginAccountId") scheduleLoginLockCheck();
  input.classList.remove("login-input-error", "login-input-valid");
  if (lockedLoginIdentity !== getLoginIdentity(currentRole, document.getElementById("loginAccountId").value)) {
    document.getElementById("loginError").style.display = "none";
  }

  const value = input.value.trim();
  if (!value) return;

  if (input.id === "loginAccountId") {
    if (findLoginAccount(currentRole, value)) input.classList.add("login-input-valid");
  } else {
    input.classList.add("login-input-valid");
  }
}

document.getElementById("loginAccountId").addEventListener("input", function () { validateLoginField(this); });
document.getElementById("loginPassword").addEventListener("input", function () { validateLoginField(this); });

// Enter key submits
["loginAccountId", "loginPassword"].forEach(function (id) {
  document.getElementById(id).addEventListener("keydown", function (e) {
    if (e.key === "Enter") doLogin();
  });
});

// ================= FORGOT PASSWORD (DEMO) =================
// Demo only: the OTP is shown on screen and passwords sit in localStorage.
let fpOtp = null;        // the generated OTP
let fpVerified = false;  // true only after the correct OTP is entered
let fpRole = "student";  // which account is being reset
let fpFocus = null;      // element to refocus when the modal closes

const fpText = {
  1: "Enter your email and we'll generate a one-time code (demo, nothing is actually sent).",
  2: "Type the 6-digit OTP shown below to verify it's you.",
  3: "Choose a new password for your account. Use at least 6 characters.",
  4: ""
};

function fpEl(id) { return document.getElementById(id); }

function showStep(n) {
  for (let i = 1; i <= 4; i++) fpEl("fpStep" + i).classList.toggle("on", i === n);
  document.querySelectorAll(".fp-dot").forEach(function (d, i) { d.classList.toggle("on", i < Math.min(n, 3)); });
  const label = fpRole.charAt(0).toUpperCase() + fpRole.slice(1);
  fpEl("fpDesc").textContent = n === 4 ? "" : fpText[n] + (n === 1 ? " (" + label + " account)" : "");
  fpEl("fpDesc").style.display = n === 4 ? "none" : "block";
  fpEl("fpTitle").textContent = n === 4 ? "Password Updated" : "Forgot Password?";
  clearFpError();
}

function showFpError(msg, input) {
  const box = fpEl("fpError");
  box.textContent = msg;
  box.style.display = "block";
  if (input) { input.classList.add("login-input-error"); input.focus(); }
}

function clearFpError() {
  fpEl("fpError").style.display = "none";
  ["fpEmail", "fpOtpInput", "fpNewPass", "fpConfirmPass"].forEach(function (id) {
    fpEl(id).classList.remove("login-input-error", "login-input-valid");
  });
}

function openForgot() {
  fpFocus = document.activeElement;
  fpRole = currentRole;               // reuse the selected tab's role
  resetForgot();
  fpEl("fpOverlay").classList.add("show");
  fpEl("fpOverlay").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(function () { fpEl("fpEmail").focus(); }, 50);
}

function resetForgot() {
  ["fpEmail", "fpOtpInput", "fpNewPass", "fpConfirmPass"].forEach(function (id) { fpEl(id).value = ""; });
  ["fpNewPass", "fpConfirmPass"].forEach(function (id) {
    const input = fpEl(id);
    if (input.type === "text") togglePasswordField(input.parentElement.querySelector(".eye"));
  });
  fpOtp = null;
  fpVerified = false;
  showStep(1);
}

function closeForgot() {
  fpEl("fpOverlay").classList.remove("show");
  fpEl("fpOverlay").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  resetForgot();
  if (fpFocus && fpFocus.focus) fpFocus.focus();
}

function sendOtp() {
  const email = fpEl("fpEmail");
  const value = email.value.trim();
  clearFpError();

  if (!value) return showFpError("Please enter your email address.", email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return showFpError("Please enter a valid email address.", email);

  fpOtp = String(Math.floor(100000 + Math.random() * 900000));  // random 6 digits
  fpVerified = false;
  fpEl("fpOtpShow").textContent = fpOtp;
  fpEl("fpOtpInput").value = "";
  showStep(2);
  fpEl("fpOtpInput").focus();
}

function verifyOtp() {
  const input = fpEl("fpOtpInput");
  const value = input.value.trim();
  clearFpError();

  if (!fpOtp) { showStep(1); return showFpError("Please request an OTP first."); }
  if (!value) return showFpError("Please enter the OTP.", input);
  if (value !== fpOtp) return showFpError("Incorrect OTP. Try again.", input);

  fpVerified = true;
  input.classList.add("login-input-valid");
  showStep(3);
  fpEl("fpNewPass").focus();
}

function resetPassword() {
  const p1 = fpEl("fpNewPass"), p2 = fpEl("fpConfirmPass");
  clearFpError();
  const newPassword = p1.value.trim();

  // Never allow a reset without a verified OTP
  if (!fpVerified) { showStep(1); return showFpError("Please verify your OTP first."); }
  if (newPassword.length < 6) return showFpError("Password must be at least 6 characters.", p1);
  if (newPassword !== p2.value.trim()) {
    p1.classList.add("login-input-error");
    return showFpError("Passwords do not match.", p2);
  }

  saveLibraryAccountPassword(accounts[fpRole].id, newPassword);
  accounts[fpRole].pass = newPassword;

  const label = fpRole.charAt(0).toUpperCase() + fpRole.slice(1);
  fpEl("fpSuccessText").textContent = "Your " + label + " password was updated. You can now log in with your new password.";
  fpOtp = null;
  fpVerified = false;
  showStep(4);

  // keep the login page in sync
  fpEl("loginHint").textContent = "Demo Account ID: " + accounts[currentRole].id + " / " + accounts[currentRole].pass;
  document.getElementById("loginPassword").value = "";
}

// Click outside the modal to close
fpEl("fpOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeForgot();
});

// Escape closes, Enter submits the current step, Tab stays inside the modal
document.addEventListener("keydown", function (e) {
  if (!fpEl("fpOverlay").classList.contains("show")) return;

  if (e.key === "Escape") { closeForgot(); return; }

  if (e.key === "Enter" && e.target.tagName === "INPUT") {
    e.preventDefault();
    if (fpEl("fpStep1").classList.contains("on")) sendOtp();
    else if (fpEl("fpStep2").classList.contains("on")) verifyOtp();
    else if (fpEl("fpStep3").classList.contains("on")) resetPassword();
    return;
  }

  if (e.key === "Tab") {
    const items = Array.prototype.filter.call(
      fpEl("fpOverlay").querySelectorAll("button, input"),
      function (el) { return el.offsetParent !== null; }
    );
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
// ================= END FORGOT PASSWORD =================

// ---------- Demo portal screen (delete once your dashboard is connected) ----------
function showPortal(role, name) {
  const text = role === "admin" ? "Admin panel" : role === "teacher" ? "Teacher portal" : "Student portal";
  document.getElementById("portalText").textContent = text + " - welcome, " + name;
  document.getElementById("portal").style.display = "block";
}

function logout() {
  localStorage.removeItem("celtech_user");
  document.getElementById("portal").style.display = "none";
  document.getElementById("login").style.display = "block";
  adminShown = false;
  document.getElementById("tab-admin").classList.remove("show");
  document.getElementById("adminLink").style.display = "block";
  setRole("student");
  requestAnimationFrame(moveIndicator);
}
</script>
</body>
</html>
