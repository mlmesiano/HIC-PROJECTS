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
  const role = String(user.role || '').trim().toLowerCase();
  const identity = user.id == null || user.id === ''
    ? String(user.name || '').trim().toLowerCase()
    : String(user.id).trim().toLowerCase();
  return `${role}:${identity}`;
}

function loadReservations() {
  const savedReservations = localStorage.getItem('celtech_final');
  if (savedReservations === null) return [];

  const stored = JSON.parse(savedReservations);
  if (!Array.isArray(stored)) {
    throw new Error('Saved reservations are invalid.');
  }

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
    reservationIds.add(String(reservationId));
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

    if (!reservation.reservationId || reservation.bookId == null ||
        !reservation.userKey || !reservation.userName || !reservation.userRole) {
      changed = true;
    }

    return {
      ...reservation,
      reservationId,
      bookId,
      userId,
      userKey,
      userName,
      userRole,
      date: reservation.date || new Date().toLocaleDateString(),
      status: reservation.status || 'Active'
    };
  });

  if (changed) {
    localStorage.setItem('celtech_final', JSON.stringify(normalized));
  }
  return normalized;
}

let books = loadBooks();
let reservations = loadReservations();

function refreshLibraryData() {
  books = loadBooks();
  reservations = loadReservations();
}

function saveBooks() {
  localStorage.setItem('celtech_books', JSON.stringify(books));
}

function saveReservations() {
  localStorage.setItem('celtech_final', JSON.stringify(reservations));
}

function getBookReservationCount(bookId) {
  return reservations.filter(reservation => reservation.bookId === Number(bookId)).length;
}

function getAvailableCopies(bookId) {
  const book = books.find(item => item.id === Number(bookId));
  return book ? Math.max(0, book.copies - getBookReservationCount(bookId)) : 0;
}

function getUserReservations(user) {
  const userKey = getUserKey(user);
  return reservations.filter(reservation => reservation.userKey === userKey);
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

function reserveBook(bookId, user) {
  refreshLibraryData();
  const book = books.find(item => item.id === Number(bookId));
  if (!book) throw new Error('Book not found.');

  const userReservations = getUserReservations(user);
  if (userReservations.length >= 3) {
    throw new Error('Maximum of 3 active reservations per user.');
  }
  if (userReservations.some(reservation => reservation.bookId === book.id)) {
    throw new Error('You already reserved this book.');
  }
  if (getAvailableCopies(book.id) <= 0) {
    throw new Error('This book is unavailable.');
  }

  const reservation = {
    ...book,
    bookId: book.id,
    reservationId: createUniqueReservationId(),
    userId: user.id ?? user.name ?? '',
    userKey: getUserKey(user),
    userName: user.name || 'Unknown user',
    userRole: user.role || 'Unknown',
    date: new Date().toLocaleDateString(),
    status: 'Active'
  };
  reservations.push(reservation);
  saveReservations();
  return reservation;
}

function cancelReservation(reservationId, user) {
  refreshLibraryData();
  const index = reservations.findIndex(reservation =>
    reservation.reservationId === String(reservationId)
  );
  if (index === -1) return false;
  if (user && reservations[index].userKey !== getUserKey(user)) return false;

  reservations.splice(index, 1);
  saveReservations();
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
  if (String(user.role || '').toLowerCase() !== role) {
    const dashboard = {
      student: 'dashboard-student.html',
      teacher: 'dashboard-teacher.html',
      admin: 'dashboard-admin.html'
    }[String(user.role || '').toLowerCase()];
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
  if (event.key === 'celtech_books' || event.key === 'celtech_final') {
    refreshLibraryData();
    if (typeof render === 'function') render();
  }
});
