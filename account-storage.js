const INITIAL_LIBRARY_ACCOUNTS = Object.freeze([
  Object.freeze({ accountUid: 'static-admin-202411061', id: '202411061', name: 'admin', role: 'admin', password: 'password' }),
  Object.freeze({ accountUid: 'static-student-202411059', id: '202411059', name: 'student', role: 'student', password: 'password' }),
  Object.freeze({ accountUid: 'static-teacher-202411060', id: '202411060', name: 'teacher', role: 'teacher', password: 'password' })
]);

const LIBRARY_ACCOUNT_KEYS = Object.freeze({
  accounts: 'celtech_accounts',
  profiles: 'celtech_account_profiles',
  passwords: 'celtech_account_passwords',
  legacyPasswords: 'celtech_passwords'
});

function normalizeAccountRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'administrator' ? 'admin' : normalized;
}

function readAccountStorage(key, fallback, expectedType) {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`Saved account data "${key}" is invalid.`);
  }
  if (expectedType === 'array' && !Array.isArray(parsed)) {
    throw new Error(`Saved account data "${key}" is invalid.`);
  }
  if (expectedType === 'object' && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) {
    throw new Error(`Saved account data "${key}" is invalid.`);
  }
  return parsed;
}

function getLibraryAccounts() {
  const registered = readAccountStorage(LIBRARY_ACCOUNT_KEYS.accounts, [], 'array');
  const profiles = readAccountStorage(LIBRARY_ACCOUNT_KEYS.profiles, {}, 'object');
  const passwords = readAccountStorage(LIBRARY_ACCOUNT_KEYS.passwords, {}, 'object');
  const legacyPasswords = readAccountStorage(LIBRARY_ACCOUNT_KEYS.legacyPasswords, {}, 'object');
  const accounts = INITIAL_LIBRARY_ACCOUNTS.map(account => ({
    ...account,
    name: profiles[account.id]?.name || account.name,
    password: passwords[account.id] || legacyPasswords[account.role] || account.password,
    isStatic: true
  }));
  const ids = new Set(accounts.map(account => account.id.toLowerCase()));
  const accountUids = new Set(accounts.map(account => account.accountUid));

  registered.forEach(record => {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' ||
        typeof record.name !== 'string' || typeof record.password !== 'string' ||
        !['student', 'teacher'].includes(normalizeAccountRole(record.role))) {
      throw new Error('A saved registered account is invalid.');
    }
    const id = record.id.trim();
    const accountUid = String(record.accountUid || '').trim();
    if (!id || !record.name.trim() || !accountUid ||
        ids.has(id.toLowerCase()) || accountUids.has(accountUid)) {
      throw new Error('Saved registered accounts contain duplicate or invalid identifiers.');
    }
    ids.add(id.toLowerCase());
    accountUids.add(accountUid);
    accounts.push({
      ...record,
      id,
      name: profiles[id]?.name || record.name.trim(),
      role: normalizeAccountRole(record.role),
      password: passwords[id] || record.password,
      accountUid,
      isStatic: false
    });
  });
  return accounts;
}

function getLibraryAccountById(id) {
  const key = String(id ?? '').trim().toLowerCase();
  if (!key) return null;
  return getLibraryAccounts().find(account => account.id.toLowerCase() === key) || null;
}

function getLibraryAccountByIdentity(id, name, role) {
  const normalizedRole = normalizeAccountRole(role);
  const accounts = getLibraryAccounts().filter(account =>
    account.role === normalizedRole
  );
  const normalizedId = String(id ?? '').trim().toLowerCase();
  if (normalizedId) {
    const byId = accounts.find(account => account.id.toLowerCase() === normalizedId);
    if (byId) return byId;
  }
  const normalizedName = String(name ?? '').trim().toLowerCase();
  const matches = accounts.filter(account => account.name.trim().toLowerCase() === normalizedName);
  if (matches.length === 1) return matches[0];
  if (!normalizedName) return null;

  const legacyStaticMatch = INITIAL_LIBRARY_ACCOUNTS.find(account =>
    account.role === normalizedRole && account.name.toLowerCase() === normalizedName
  );
  if (legacyStaticMatch) return getLibraryAccountById(legacyStaticMatch.id);
  const registered = readAccountStorage(LIBRARY_ACCOUNT_KEYS.accounts, [], 'array');
  const legacyRegisteredMatches = registered.filter(record =>
    normalizeAccountRole(record.role) === normalizedRole &&
    String(record.name || '').trim().toLowerCase() === normalizedName
  );
  return legacyRegisteredMatches.length === 1
    ? getLibraryAccountById(legacyRegisteredMatches[0].id)
    : null;
}

function findLoginAccount(role, identifier) {
  const normalizedRole = normalizeAccountRole(role);
  const value = String(identifier ?? '').trim().toLowerCase();
  const accounts = getLibraryAccounts().filter(account => account.role === normalizedRole);
  return accounts.find(account => account.id.toLowerCase() === value) || null;
}

function createAccountUid() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `account-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function requireLibraryAdmin() {
  const rawUser = localStorage.getItem('celtech_user');
  if (rawUser === null) throw new Error('Administrator login is required.');
  let user;
  try {
    user = JSON.parse(rawUser);
  } catch {
    throw new Error('The current session is invalid. Please log in again.');
  }
  if (!user || normalizeAccountRole(user.role) !== 'admin') {
    throw new Error('Only an administrator can manage accounts.');
  }
}

function registerLibraryAccount(name, id, password, role) {
  requireLibraryAdmin();
  const accountType = role === 'teacher' ? 'Teacher' : 'Student';
  const normalizedName = String(name ?? '').trim();
  const normalizedId = String(id ?? '').trim();
  const normalizedPassword = String(password ?? '').trim();
  if (!normalizedName || !normalizedId || !normalizedPassword) {
    throw new Error(`${accountType} name, ID, and password are required.`);
  }
  if (!/^\d{9}$/.test(normalizedId)) {
    throw new Error(`${accountType} ID must contain exactly 9 digits.`);
  }
  if (normalizedPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  if (getLibraryAccounts().some(account => account.id.toLowerCase() === normalizedId.toLowerCase())) {
    throw new Error('An account with this ID already exists.');
  }
  const registered = readAccountStorage(LIBRARY_ACCOUNT_KEYS.accounts, [], 'array');
  let accountUid = createAccountUid();
  while (registered.some(account => account.accountUid === accountUid)) {
    accountUid = createAccountUid();
  }
  const account = {
    accountUid,
    id: normalizedId,
    name: normalizedName,
    role,
    password: normalizedPassword
  };
  registered.push(account);
  localStorage.setItem(LIBRARY_ACCOUNT_KEYS.accounts, JSON.stringify(registered));
  return { ...account, isStatic: false };
}

function registerLibraryStudent(name, id, password) {
  return registerLibraryAccount(name, id, password, 'student');
}

function registerLibraryTeacher(name, id, password) {
  return registerLibraryAccount(name, id, password, 'teacher');
}

function updateLibraryAccountName(id, name) {
  requireLibraryAdmin();
  const account = getLibraryAccountById(id);
  const normalizedName = String(name ?? '').trim();
  if (!account || !['student', 'teacher'].includes(account.role)) {
    throw new Error('Only student and teacher accounts can be edited.');
  }
  if (!normalizedName) throw new Error('Account name is required.');
  const profiles = readAccountStorage(LIBRARY_ACCOUNT_KEYS.profiles, {}, 'object');
  profiles[account.id] = { ...(profiles[account.id] || {}), name: normalizedName };
  localStorage.setItem(LIBRARY_ACCOUNT_KEYS.profiles, JSON.stringify(profiles));
  return { ...account, name: normalizedName };
}

function saveLibraryAccountPassword(id, password) {
  const account = getLibraryAccountById(id);
  const normalizedPassword = String(password ?? '').trim();
  if (!account) throw new Error('Account not found.');
  if (!normalizedPassword || normalizedPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  const passwords = readAccountStorage(LIBRARY_ACCOUNT_KEYS.passwords, {}, 'object');
  passwords[account.id] = normalizedPassword;
  localStorage.setItem(LIBRARY_ACCOUNT_KEYS.passwords, JSON.stringify(passwords));
}

function changeLibraryAccountPassword(user, currentPassword, newPassword, confirmation) {
  if (!user || !user.id) throw new Error('A valid signed-in account is required.');
  const rawSession = localStorage.getItem('celtech_user');
  if (rawSession === null) throw new Error('Please log in again before changing your password.');
  let session;
  try {
    session = JSON.parse(rawSession);
  } catch {
    throw new Error('The current session is invalid. Please log in again.');
  }
  const signedInAccount = getLibraryAccountByIdentity(session?.id, session?.name, session?.role);
  const account = getLibraryAccountById(user.id);
  if (!signedInAccount || !account ||
      signedInAccount.id !== account.id ||
      account.role !== normalizeAccountRole(user.role)) {
    throw new Error('The signed-in account could not be found.');
  }
  const current = String(currentPassword ?? '');
  const next = String(newPassword ?? '').trim();
  const confirm = String(confirmation ?? '').trim();
  if (!current || !next || !confirm) throw new Error('All password fields are required.');
  if (current !== account.password) throw new Error('Current password is incorrect.');
  if (next.length < 6) throw new Error('New password must be at least 6 characters.');
  if (next !== confirm) throw new Error('New password and confirmation do not match.');
  saveLibraryAccountPassword(account.id, next);
}
