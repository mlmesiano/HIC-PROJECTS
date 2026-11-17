const BORROWED_STATUS = 'Borrowed / Picked Up';
const PENDING_STATUS = 'Pending Admin Confirmation';
const APPROVED_STATUS = 'Approved / Ready for Pickup';
const DECLINED_STATUS = 'Declined';
const CANCELLED_STATUS = 'Cancelled';
const DUE_SOON_STATUS = 'Due Soon';
const OVERDUE_STATUS = 'Overdue';
const RETURNED_STATUS = 'Returned';
const HELD_STATUSES = new Set([
  PENDING_STATUS, APPROVED_STATUS, BORROWED_STATUS, DUE_SOON_STATUS, OVERDUE_STATUS
]);
const DEFAULT_BORROWING_HOURS = 72;
const DEFAULT_PENALTY_AMOUNT = 1000000;
const DEFAULT_DUE_SOON_THRESHOLD_HOURS = 24;
const DEFAULT_OVERDUE_NOTIFICATION_MODE = 'banner';

function createReservationId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `reservation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createUniqueReservationId() {
  let reservationId = createReservationId();
  while (reservations.some(reservation => reservation.reservationId === reservationId)) {
    reservationId = createReservationId();
  }
  return reservationId;
}

function loadBooks() {
  const savedBooks = localStorage.getItem('celtech_books');
  const inventory = savedBooks === null
    ? initialBooks.map(book => ({ ...book }))
    : JSON.parse(savedBooks);

  if (!Array.isArray(inventory) || inventory.some(book =>
    !book || !Number.isInteger(Number(book.id)) || !Number.isSafeInteger(book.copies) ||
    book.copies < 0 || !book.title || !book.author || !book.category || !book.shelf
  )) {
    throw new Error('Saved book inventory is invalid.');
  }
  if (new Set(inventory.map(book => Number(book.id))).size !== inventory.length) {
    throw new Error('Saved book inventory contains duplicate IDs.');
  }
  inventory.forEach(book => { book.id = Number(book.id); });

  if (savedBooks === null) {
    localStorage.setItem('celtech_books', JSON.stringify(inventory));
  }
  return inventory;
}

function getUserKey(user) {
  if (!user || typeof user !== 'object') throw new Error('A logged-in user is required.');
  const role = String(user.role || '').trim().toLowerCase();
  const identity = user.id == null || user.id === ''
    ? String(user.name || '').trim().toLowerCase()
    : String(user.id).trim().toLowerCase();
  return `${role}:${identity}`;
}

function getLibraryActivity() {
  const savedActivity = localStorage.getItem('celtech_activity');
  if (savedActivity === null) return [];
  const activity = JSON.parse(savedActivity);
  if (!Array.isArray(activity)) throw new Error('Saved activity history is invalid.');
  return activity;
}

function saveLibraryActivity(activity) {
  localStorage.setItem('celtech_activity', JSON.stringify(activity));
}

function recordLibraryActivity(reservation, action, adminName = '') {
  const activity = getLibraryActivity();
  activity.push({
    reservationId: reservation.reservationId,
    bookTitle: reservation.title,
    userName: reservation.userName,
    action,
    timestamp: new Date().toISOString(),
    adminName
  });
  saveLibraryActivity(activity);
}

function loadReservations() {
  const savedReservations = localStorage.getItem('celtech_final');
  if (savedReservations === null) return [];

  const stored = JSON.parse(savedReservations);
  if (!Array.isArray(stored)) throw new Error('Saved reservations are invalid.');

  let changed = false;
  const reservationIds = new Set();
  const normalized = stored.map(reservation => {
    if (!reservation || typeof reservation !== 'object') {
      throw new Error('Saved reservation is invalid.');
    }

    let reservationId = reservation.reservationId;
    if (!reservationId || reservationIds.has(String(reservationId))) {
      reservationId = createReservationId();
      while (reservationIds.has(reservationId)) reservationId = createReservationId();
      changed = true;
    }
    if (typeof reservationId !== 'string') {
      reservationId = String(reservationId);
      changed = true;
    }
    reservationIds.add(reservationId);

    const bookId = Number(reservation.bookId ?? reservation.id);
    if (!Number.isInteger(bookId)) throw new Error('Saved reservation has an invalid book ID.');
    const userName = reservation.userName || reservation.name || 'Unknown user';
    const userRole = reservation.userRole || reservation.role || 'Unknown';
    const userId = reservation.userId ?? reservation.studentId ?? '';
    const userKey = reservation.userKey || (
      userName !== 'Unknown user'
        ? getUserKey({ name: userName, role: userRole, id: userId })
        : `legacy:${userId || reservationId}`
    );
    const status = reservation.status === 'Active'
      ? PENDING_STATUS
      : reservation.status || PENDING_STATUS;

    if (!reservation.reservationId || reservation.bookId == null ||
        !reservation.userKey || !reservation.userName || !reservation.userRole ||
        reservation.status !== status) changed = true;

    return {
      ...reservation,
      reservationId,
      bookId,
      userId,
      userKey,
      userName,
      userRole,
      requestCreatedAt: reservation.requestCreatedAt || reservation.createdAt || new Date().toISOString(),
      preferredPickupAt: reservation.preferredPickupAt || '',
      confirmedPickupAt: reservation.confirmedPickupAt || '',
      pickedUpAt: reservation.pickedUpAt || '',
      dueAt: reservation.dueAt || '',
      returnedAt: reservation.returnedAt || '',
      date: reservation.date || new Date().toLocaleDateString(),
      status,
      penaltyStatus: reservation.penaltyStatus || 'No Penalty',
      penaltyAmount: reservation.penaltyAmount ?? null,
      penaltyResolutionAt: reservation.penaltyResolutionAt || '',
      declineReason: reservation.declineReason || ''
    };
  });

  if (changed) localStorage.setItem('celtech_final', JSON.stringify(normalized));
  return normalized;
}

function loadSetting(key, fallback) {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  const parsed = Number(value);
  const minimum = key === 'celtech_borrowing_duration_hours' ? 1 : 0;
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new Error(`Saved setting "${key}" is invalid.`);
  }
  return parsed;
}

function loadOverdueNotificationMode() {
  const mode = localStorage.getItem('celtech_overdue_notification_mode');
  if (mode === null) return DEFAULT_OVERDUE_NOTIFICATION_MODE;
  if (!['banner', 'status-only'].includes(mode)) {
    throw new Error('Saved overdue notification setting is invalid.');
  }
  return mode;
}

let books = loadBooks();
let reservations = loadReservations();
let borrowingDurationHours = loadSetting('celtech_borrowing_duration_hours', DEFAULT_BORROWING_HOURS);
let penaltyAmount = loadSetting('celtech_penalty_amount', DEFAULT_PENALTY_AMOUNT);
let dueSoonThresholdHours = loadSetting('celtech_due_soon_threshold_hours', DEFAULT_DUE_SOON_THRESHOLD_HOURS);
let overdueNotificationMode = loadOverdueNotificationMode();

function saveBooks() {
  localStorage.setItem('celtech_books', JSON.stringify(books));
}

function saveReservations() {
  localStorage.setItem('celtech_final', JSON.stringify(reservations));
}

function refreshLibraryData() {
  books = loadBooks();
  reservations = loadReservations();
  borrowingDurationHours = loadSetting('celtech_borrowing_duration_hours', DEFAULT_BORROWING_HOURS);
  penaltyAmount = loadSetting('celtech_penalty_amount', DEFAULT_PENALTY_AMOUNT);
  dueSoonThresholdHours = loadSetting('celtech_due_soon_threshold_hours', DEFAULT_DUE_SOON_THRESHOLD_HOURS);
  overdueNotificationMode = loadOverdueNotificationMode();
  updateBorrowingStatuses();
}

function subscribeToLibraryUpdates(onUpdate) {
  const keys = new Set([
    'celtech_books',
    'celtech_final',
    'celtech_activity',
    'celtech_borrowing_duration_hours',
    'celtech_penalty_amount',
    'celtech_due_soon_threshold_hours',
    'celtech_overdue_notification_mode'
  ]);
  window.addEventListener('storage', event => {
    if (!keys.has(event.key)) return;
    refreshLibraryData();
    onUpdate();
  });
}

function updateBorrowingStatuses() {
  const now = Date.now();
  let changed = false;

  reservations.forEach(reservation => {
    if (![BORROWED_STATUS, DUE_SOON_STATUS, OVERDUE_STATUS].includes(reservation.status) ||
        !reservation.pickedUpAt) return;

    const dueAt = reservation.dueAt ||
      new Date(Date.parse(reservation.pickedUpAt) + (reservation.borrowingDurationHours || DEFAULT_BORROWING_HOURS) * 3600000).toISOString();
    const remaining = Date.parse(dueAt) - now;
    const status = remaining <= 0
      ? OVERDUE_STATUS
      : remaining <= dueSoonThresholdHours * 3600000
        ? DUE_SOON_STATUS
        : BORROWED_STATUS;

    if (reservation.dueAt !== dueAt) {
      reservation.dueAt = dueAt;
      changed = true;
    }
    if (reservation.status !== status) {
      reservation.status = status;
      changed = true;
      if (status === OVERDUE_STATUS) {
        reservation.penaltyStatus = reservation.penaltyStatus === 'No Penalty'
          ? 'Unresolved'
          : reservation.penaltyStatus;
        reservation.penaltyAmount ??= penaltyAmount;
        recordLibraryActivity(reservation, 'Book marked overdue');
      }
    }
    if (status === OVERDUE_STATUS && reservation.penaltyAmount == null) {
      reservation.penaltyStatus = reservation.penaltyStatus === 'No Penalty'
        ? 'Unresolved'
        : reservation.penaltyStatus;
      reservation.penaltyAmount = penaltyAmount;
      changed = true;
    }
  });

  if (changed) saveReservations();
}

function getBorrowingDurationHours() {
  return borrowingDurationHours;
}

function getPenaltyAmount() {
  return penaltyAmount;
}

function getDueSoonThresholdHours() {
  return dueSoonThresholdHours;
}

function getOverdueNotificationMode() {
  return overdueNotificationMode;
}

function saveLibrarySettings(
  hours,
  amount,
  dueSoonHours = dueSoonThresholdHours,
  notificationMode = overdueNotificationMode
) {
  if (!Number.isSafeInteger(hours) || hours <= 0) {
    throw new Error('Borrowing duration must be a positive whole number of hours.');
  }
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error('Penalty amount must be a non-negative whole number.');
  }
  if (!Number.isSafeInteger(dueSoonHours) || dueSoonHours < 0) {
    throw new Error('Due-soon threshold must be a non-negative whole number of hours.');
  }
  if (!['banner', 'status-only'].includes(notificationMode)) {
    throw new Error('Select a valid overdue notification behavior.');
  }
  borrowingDurationHours = hours;
  penaltyAmount = amount;
  dueSoonThresholdHours = dueSoonHours;
  overdueNotificationMode = notificationMode;
  localStorage.setItem('celtech_borrowing_duration_hours', String(hours));
  localStorage.setItem('celtech_penalty_amount', String(amount));
  localStorage.setItem('celtech_due_soon_threshold_hours', String(dueSoonHours));
  localStorage.setItem('celtech_overdue_notification_mode', notificationMode);
}

function getBookReservationCount(bookId) {
  return reservations.filter(reservation =>
    reservation.bookId === Number(bookId) && HELD_STATUSES.has(reservation.status)
  ).length;
}

function getAvailableCopies(bookId) {
  const book = books.find(item => item.id === Number(bookId));
  return book ? Math.max(0, book.copies - getBookReservationCount(bookId)) : 0;
}

function getUserReservations(user) {
  const userKey = getUserKey(user);
  return reservations.filter(reservation => reservation.userKey === userKey);
}

function getUserActiveReservations(user) {
  return getUserReservations(user).filter(reservation => HELD_STATUSES.has(reservation.status));
}

function addBookStock(bookId, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error('Enter a positive whole-number quantity.');
  }

  refreshLibraryData();
  const book = books.find(item => item.id === Number(bookId));
  if (!book) throw new Error('Book not found.');
  if (!Number.isSafeInteger(book.copies + quantity)) {
    throw new Error('The updated stock is too large.');
  }
  book.copies += quantity;
  saveBooks();
  return book;
}

function parseManilaDateTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Select a valid pickup date and time.');
  }
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const selectedDate = new Date(Date.UTC(year, month - 1, day));
  if (selectedDate.getUTCFullYear() !== year || selectedDate.getUTCMonth() !== month - 1 ||
      selectedDate.getUTCDate() !== day || hour > 23 || minute > 59) {
    throw new Error('Select a valid pickup date and time.');
  }
  const timestamp = Date.parse(`${date}T${time}:00+08:00`);
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
    throw new Error('Pickup date and time must be in the future.');
  }
  return new Date(timestamp).toISOString();
}

function formatManilaDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true
  }).format(date);
}

function getManilaDateTimeParts(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`
  };
}

function formatRemainingTime(dueAt) {
  const milliseconds = Date.parse(dueAt) - Date.now();
  if (milliseconds <= 0) {
    const overdueHours = Math.floor(Math.abs(milliseconds) / 3600000);
    const overdueMinutes = Math.floor((Math.abs(milliseconds) % 3600000) / 60000);
    return `${overdueHours}h ${overdueMinutes}m overdue`;
  }
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  return `${hours}h ${minutes}m remaining`;
}

function reserveBook(bookId, user, preferredPickupAt) {
  refreshLibraryData();
  const book = books.find(item => item.id === Number(bookId));
  if (!book) throw new Error('Book not found.');
  if (!preferredPickupAt || Date.parse(preferredPickupAt) <= Date.now()) {
    throw new Error('Select a valid future pickup schedule.');
  }

  const userReservations = getUserActiveReservations(user);
  if (userReservations.length >= 3) throw new Error('Maximum of 3 active reservations per user.');
  if (userReservations.some(reservation => reservation.bookId === book.id)) {
    throw new Error('You already have an active request for this book.');
  }
  if (getAvailableCopies(book.id) <= 0) throw new Error('This book is unavailable.');

  const reservation = {
    ...book,
    bookId: book.id,
    reservationId: createUniqueReservationId(),
    userId: user.id ?? '',
    userKey: getUserKey(user),
    userName: user.name || 'Unknown user',
    userRole: user.role || 'Unknown',
    requestCreatedAt: new Date().toISOString(),
    preferredPickupAt,
    confirmedPickupAt: '',
    pickedUpAt: '',
    dueAt: '',
    returnedAt: '',
    date: new Date().toLocaleDateString(),
    status: PENDING_STATUS,
    penaltyStatus: 'No Penalty',
    penaltyAmount: null,
    penaltyResolutionAt: '',
    declineReason: '',
    borrowingDurationHours: null
  };
  reservations.push(reservation);
  saveReservations();
  recordLibraryActivity(reservation, 'Reservation submitted');
  return reservation;
}

function getReservation(reservationId) {
  return reservations.find(reservation => reservation.reservationId === String(reservationId));
}

function getAdminName(admin) {
  return admin && admin.name ? String(admin.name) : 'Administrator';
}

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function isAdminRole(role) {
  return ['admin', 'administrator'].includes(normalizeRole(role));
}

function requireAdminUser() {
  const user = getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    throw new Error('Administrator access is required for this action.');
  }
  return user;
}

function approveReservation(reservationId, pickupAt, admin) {
  admin = requireAdminUser();
  refreshLibraryData();
  const reservation = getReservation(reservationId);
  if (!reservation || reservation.status !== PENDING_STATUS) {
    throw new Error('This request is no longer pending.');
  }
  if (!pickupAt || Date.parse(pickupAt) <= Date.now()) {
    throw new Error('Select a valid future pickup schedule.');
  }
  reservation.confirmedPickupAt = pickupAt;
  reservation.status = APPROVED_STATUS;
  saveReservations();
  recordLibraryActivity(reservation, 'Request approved', getAdminName(admin));
  if (pickupAt !== reservation.preferredPickupAt) {
    recordLibraryActivity(reservation, 'Pickup schedule updated', getAdminName(admin));
  }
}

function updatePickupSchedule(reservationId, pickupAt, admin) {
  admin = requireAdminUser();
  refreshLibraryData();
  const reservation = getReservation(reservationId);
  if (!reservation || reservation.status !== APPROVED_STATUS) {
    throw new Error('Only approved requests can be rescheduled.');
  }
  if (!pickupAt || Date.parse(pickupAt) <= Date.now()) {
    throw new Error('Select a valid future pickup schedule.');
  }
  reservation.confirmedPickupAt = pickupAt;
  saveReservations();
  recordLibraryActivity(reservation, 'Pickup schedule updated', getAdminName(admin));
}

function declineReservation(reservationId, reason, admin) {
  admin = requireAdminUser();
  refreshLibraryData();
  const reservation = getReservation(reservationId);
  if (!reservation || reservation.status !== PENDING_STATUS) {
    throw new Error('This request is no longer pending.');
  }
  reservation.status = DECLINED_STATUS;
  reservation.declineReason = String(reason || '').trim();
  saveReservations();
  recordLibraryActivity(reservation, 'Request declined', getAdminName(admin));
}

function markReservationPickedUp(reservationId, admin) {
  admin = requireAdminUser();
  refreshLibraryData();
  const reservation = getReservation(reservationId);
  if (!reservation || reservation.status !== APPROVED_STATUS) {
    throw new Error('Only approved requests can be marked as picked up.');
  }
  const pickedUpAt = new Date().toISOString();
  const duration = borrowingDurationHours || DEFAULT_BORROWING_HOURS;
  reservation.pickedUpAt = pickedUpAt;
  reservation.dueAt = new Date(Date.parse(pickedUpAt) + duration * 3600000).toISOString();
  reservation.borrowingDurationHours = duration;
  reservation.status = BORROWED_STATUS;
  reservation.penaltyStatus = 'No Penalty';
  reservation.penaltyAmount = null;
  saveReservations();
  recordLibraryActivity(reservation, 'Book handed to student', getAdminName(admin));
}

function confirmReservationReturned(reservationId, admin) {
  admin = requireAdminUser();
  refreshLibraryData();
  const reservation = getReservation(reservationId);
  if (!reservation || ![BORROWED_STATUS, DUE_SOON_STATUS, OVERDUE_STATUS].includes(reservation.status)) {
    throw new Error('Only borrowed books can be marked as returned.');
  }
  const returnedAt = new Date().toISOString();
  reservation.returnedAt = returnedAt;
  reservation.status = RETURNED_STATUS;
  if (Date.parse(returnedAt) > Date.parse(reservation.dueAt)) {
    reservation.penaltyStatus = reservation.penaltyStatus === 'No Penalty'
      ? 'Unresolved'
      : reservation.penaltyStatus;
    reservation.penaltyAmount ??= penaltyAmount;
  }
  saveReservations();
  recordLibraryActivity(reservation, 'Book returned', getAdminName(admin));
}

function resolveReservationPenalty(reservationId, resolution, reason, admin) {
  admin = requireAdminUser();
  refreshLibraryData();
  const reservation = getReservation(reservationId);
  if (!reservation || reservation.status !== RETURNED_STATUS ||
      !['Paid', 'Waived'].includes(resolution) || reservation.penaltyStatus !== 'Unresolved') {
    throw new Error('Only unresolved penalties on returned books can be resolved.');
  }
  reservation.penaltyStatus = resolution;
  reservation.penaltyResolutionAt = new Date().toISOString();
  reservation.penaltyResolutionReason = resolution === 'Waived' ? String(reason || '').trim() : '';
  saveReservations();
  recordLibraryActivity(
    reservation,
    resolution === 'Paid' ? 'Penalty marked paid' : 'Penalty waived',
    getAdminName(admin)
  );
}

function cancelReservation(reservationId, user) {
  if (!user) return false;
  refreshLibraryData();
  const reservation = getReservation(reservationId);
  if (!reservation || ![PENDING_STATUS, APPROVED_STATUS].includes(reservation.status) ||
      reservation.pickedUpAt) return false;
  if (reservation.userKey !== getUserKey(user)) return false;

  reservation.status = CANCELLED_STATUS;
  reservation.cancelledAt = new Date().toISOString();
  saveReservations();
  recordLibraryActivity(reservation, 'Reservation cancelled');
  return true;
}

function getCurrentUser() {
  const savedUser = localStorage.getItem('celtech_user');
  if (savedUser === null) return null;
  const user = JSON.parse(savedUser);
  return user && typeof user === 'object' ? user : null;
}

function requireDashboardRole(role) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.php';
    return false;
  }
  const userRole = normalizeRole(user.role);
  const requiredRole = normalizeRole(role);
  const roleMatches = requiredRole === 'admin'
    ? isAdminRole(userRole)
    : userRole === requiredRole;
  if (!roleMatches) {
    const dashboard = {
      student: 'dashboard-student.html',
      teacher: 'dashboard-teacher.html',
      admin: 'dashboard-admin.html'
    }[isAdminRole(userRole) ? 'admin' : userRole];
    window.location.href = dashboard || 'index.php';
    return false;
  }
  return true;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

window.addEventListener('storage', event => {
  if (['celtech_books', 'celtech_final', 'celtech_activity', 'celtech_borrowing_duration_hours', 'celtech_penalty_amount', 'celtech_due_soon_threshold_hours', 'celtech_overdue_notification_mode'].includes(event.key)) {
    refreshLibraryData();
    if (typeof render === 'function') render();
  }
});
