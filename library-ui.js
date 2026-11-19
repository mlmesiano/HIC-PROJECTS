function enhancePasswordVisibility(root = document) {
  root.querySelectorAll('input[type="password"]').forEach(input => {
    if (input.parentElement.classList.contains('library-password-wrap')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'library-password-wrap';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.append(input);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'library-password-toggle';
    toggle.setAttribute('aria-label', 'Show password');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-controls', input.id);
    toggle.innerHTML = `
      <svg class="password-eye" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <svg class="password-eye-off" viewBox="0 0 24 24" aria-hidden="true" hidden>
        <path d="m3 3 18 18"></path>
        <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.1 3.9"></path>
        <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4-.8"></path>
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
      </svg>`;
    wrapper.append(toggle);
    setPasswordVisibilityIcons(input, toggle, false);
  });
}

function setPasswordVisibilityIcons(input, button, visible) {
  const eye = button.querySelector('.password-eye');
  const eyeOff = button.querySelector('.password-eye-off');
  eye.hidden = visible;
  eyeOff.hidden = !visible;
  eye.style.display = visible ? 'none' : '';
  eyeOff.style.display = visible ? '' : 'none';
  button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  button.setAttribute('aria-pressed', String(visible));
  input.type = visible ? 'text' : 'password';
}

enhancePasswordVisibility();
new MutationObserver(records => {
  records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) enhancePasswordVisibility(node);
  }));
}).observe(document.body, { childList: true, subtree: true });

document.addEventListener('click', event => {
  const button = event.target.closest('.library-password-toggle');
  if (!button) return;
  const input = button.parentElement.querySelector('input');
  const isVisible = input.type === 'password';
  setPasswordVisibilityIcons(input, button, isVisible);
});

let notificationPanelOpen = false;

function updateNotificationCenter() {
  const bell = document.getElementById('notificationBell');
  const panel = document.getElementById('notificationPanel');
  const itemsContainer = document.getElementById('notificationItems');
  if (!bell || !panel || !itemsContainer) return;

  const user = getCurrentUser();
  const notifications = user
    ? getLibraryNotifications(user).slice().sort((left, right) =>
      Date.parse(right.createdAt) - Date.parse(left.createdAt)
    )
    : [];
  const unreadCount = notifications.filter(notification => !notification.read).length;
  const badge = document.getElementById('notificationUnreadCount');
  badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
  badge.hidden = unreadCount === 0;
  bell.classList.toggle('has-unread', unreadCount > 0);
  bell.setAttribute('aria-label', unreadCount
    ? `Notifications, ${unreadCount} unread`
    : 'Notifications');
  bell.setAttribute('aria-expanded', String(notificationPanelOpen));
  panel.hidden = !notificationPanelOpen;
  const count = document.getElementById('notificationPanelUnreadCount');
  count.textContent = `${unreadCount} unread`;

  if (!notifications.length) {
    itemsContainer.innerHTML = '<p class="notification-empty">You have no notifications.</p>';
    return;
  }

  itemsContainer.replaceChildren(...notifications.map(notification => {
    const item = document.createElement('article');
    item.className = `notification-item ${notification.read ? 'is-read' : 'is-unread'}`;
    item.dataset.notificationId = String(notification.notificationId || '');
    item.dataset.reservationId = String(notification.reservationId || '');

    const icon = document.createElement('span');
    icon.className = 'notification-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '⏰';
    const content = document.createElement('div');
    content.className = 'notification-item-content';
    const title = document.createElement('strong');
    title.textContent = String(notification.type || 'Notification');
    const reservation = typeof getReservation === 'function'
      ? getReservation(notification.reservationId)
      : null;
    const status = reservation
      ? reservation.status === RETURNED_STATUS
        ? 'Current status: Returned'
        : reservation.status === OVERDUE_STATUS
          ? 'Current status: Overdue'
          : `Current status: ${reservation.status}`
      : 'Current status: Reservation not found';
    const message = document.createElement('p');
    message.textContent = reservation && reservation.status === RETURNED_STATUS
      ? 'This book has been returned. The reminder is kept in your notification history.'
      : reservation && reservation.status !== OVERDUE_STATUS
        ? `This book is no longer overdue. ${status}.`
        : 'Your borrowed book is overdue. Please coordinate with the Library Admin.';
    const bookLink = document.createElement('a');
    bookLink.className = 'notification-book-link';
    bookLink.href = '#';
    bookLink.dataset.reservationId = String(notification.reservationId || '');
    bookLink.textContent = String(notification.bookTitle || 'View reservation');
    bookLink.setAttribute('aria-label', `View reservation for ${bookLink.textContent}`);
    const details = document.createElement('p');
    details.className = 'notification-item-details';
    details.textContent = `Due date: ${formatManilaDateTime(notification.dueAt)} · Reservation #${notification.reservationId}`;
    const timestamp = document.createElement('time');
    timestamp.className = 'notification-item-time';
    timestamp.dateTime = String(notification.createdAt || '');
    timestamp.textContent = formatManilaDateTime(notification.createdAt);
    const currentStatus = document.createElement('span');
    currentStatus.className = `notification-current-status${reservation && reservation.status === OVERDUE_STATUS ? ' is-overdue' : ''}`;
    currentStatus.textContent = status;
    const readState = document.createElement('span');
    readState.className = 'notification-read-state';
    readState.textContent = notification.read ? 'Read' : 'Unread';
    content.append(title, message, bookLink, details, currentStatus, timestamp);
    item.append(icon, content, readState);
    return item;
  }));
}

function toggleNotificationPanel() {
  refreshLibraryData();
  notificationPanelOpen = !notificationPanelOpen;
  updateNotificationCenter();
}

function closeNotificationPanel() {
  notificationPanelOpen = false;
  updateNotificationCenter();
}

document.addEventListener('click', event => {
  const center = event.target.closest('.notification-center');
  const bell = event.target.closest('#notificationBell');
  const bookLink = event.target.closest('.notification-book-link');
  const item = event.target.closest('.notification-item');

  if (bookLink) {
    event.preventDefault();
    const notification = item;
    markLibraryNotificationRead(notification.dataset.notificationId, getCurrentUser());
    closeNotificationPanel();
    if (typeof window.openNotifiedReservation === 'function') {
      window.openNotifiedReservation(bookLink.dataset.reservationId);
    }
    return;
  }
  if (item) {
    markLibraryNotificationRead(item.dataset.notificationId, getCurrentUser());
    updateNotificationCenter();
    return;
  }
  if (bell) {
    toggleNotificationPanel();
    return;
  }
  if (!center && notificationPanelOpen) closeNotificationPanel();
});

function showLibraryToast(message, type = 'success') {
  if (window.isAdminDashboard && typeof window.showAdminInlineNotification === 'function') {
    window.showAdminInlineNotification(message, type);
    return;
  }

  let toast = document.getElementById('libraryToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'libraryToast';
    toast.className = 'library-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }

  toast.classList.toggle('library-toast-error', type === 'error');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toast.hideTimeout);
  toast.hideTimeout = window.setTimeout(() => { toast.hidden = true; }, 4000);
}

function openLibraryDialog(options) {
  const dialog = document.createElement('dialog');
  dialog.className = 'library-dialog';
  dialog.setAttribute('aria-labelledby', 'libraryDialogTitle');

  const form = document.createElement('form');
  form.className = 'library-dialog-form';
  form.noValidate = true;

  const header = document.createElement('div');
  header.className = 'library-dialog-header';
  const heading = document.createElement('h2');
  heading.id = 'libraryDialogTitle';
  heading.textContent = options.title;
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'library-dialog-close';
  closeButton.setAttribute('aria-label', 'Close dialog');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => dialog.close());
  header.append(heading, closeButton);
  form.append(header);

  const body = document.createElement('div');
  body.className = 'library-dialog-body';
  const adminInlineMessage = window.isAdminDashboard
    ? document.createElement('div')
    : null;
  if (adminInlineMessage) {
    adminInlineMessage.className = 'admin-inline-message';
    adminInlineMessage.setAttribute('role', 'alert');
    adminInlineMessage.setAttribute('aria-live', 'polite');
    adminInlineMessage.hidden = true;
    body.append(adminInlineMessage);
  }
  if (options.description) {
    const description = document.createElement('p');
    description.className = 'library-dialog-description';
    description.textContent = options.description;
    body.append(description);
  }

  if (options.details && options.details.length) {
    const details = document.createElement('dl');
    details.className = 'library-dialog-details';
    options.details.forEach(item => {
      const row = document.createElement('div');
      const label = document.createElement('dt');
      label.textContent = item.label;
      const value = document.createElement('dd');
      value.textContent = item.value == null || item.value === '' ? '—' : String(item.value);
      row.append(label, value);
      details.append(row);
    });
    body.append(details);
  }

  const fields = options.fields || [];
  fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.className = 'library-dialog-field';
    const label = document.createElement('label');
    label.className = 'library-dialog-label';
    label.htmlFor = `library-field-${field.name}`;
    label.textContent = field.label;

    const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
    input.id = `library-field-${field.name}`;
    input.name = field.name;
    if (field.type !== 'textarea') input.type = field.type || 'text';
    if (field.min != null) input.min = field.min;
    if (field.max != null) input.max = field.max;
    if (field.step != null) input.step = field.step;
    if (field.value != null) input.value = field.value;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.rows) input.rows = field.rows;
    input.required = Boolean(field.required);
    input.className = 'library-dialog-input';

    wrapper.append(label, input);
    if (window.isAdminDashboard) {
      const fieldError = document.createElement('small');
      fieldError.className = 'admin-field-error';
      fieldError.hidden = true;
      wrapper.append(fieldError);
    }
    body.append(wrapper);
  });

  const validation = document.createElement('p');
  validation.className = 'library-dialog-validation';
  validation.setAttribute('aria-live', 'polite');
  body.append(validation);

  const actions = document.createElement('div');
  actions.className = 'library-dialog-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn cancel';
  cancel.textContent = options.cancelText || 'Cancel';
  cancel.addEventListener('click', () => dialog.close());
  const confirm = document.createElement('button');
  confirm.type = 'submit';
  confirm.className = 'btn';
  confirm.textContent = options.confirmText || 'Confirm';
  actions.append(cancel, confirm);
  body.append(actions);
  form.append(body);
  dialog.append(form);
  document.body.append(dialog);

  form.addEventListener('input', () => {
    validation.textContent = '';
    if (adminInlineMessage) {
      adminInlineMessage.textContent = '';
      adminInlineMessage.hidden = true;
    }
    form.querySelectorAll('[aria-invalid="true"]').forEach(input => {
      input.removeAttribute('aria-invalid');
      const field = input.closest('.library-dialog-field') || input.parentElement;
      const fieldError = field.querySelector('.admin-field-error');
      if (fieldError) {
        fieldError.textContent = '';
        fieldError.hidden = true;
      }
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(fields.map(field => [
      field.name,
      form.elements.namedItem(field.name).value.trim()
    ]));
    const invalidField = fields.find(field => field.required && !values[field.name]);
    if (invalidField) {
      const message = `${invalidField.label} is required.`;
      validation.textContent = window.isAdminDashboard ? '' : message;
      const input = form.elements.namedItem(invalidField.name);
      input.setAttribute('aria-invalid', 'true');
      if (adminInlineMessage) {
        adminInlineMessage.textContent = message;
        adminInlineMessage.classList.add('is-error');
        adminInlineMessage.classList.remove('is-success');
        adminInlineMessage.hidden = false;
        const field = input.closest('.library-dialog-field') || input.parentElement;
        const fieldError = field.querySelector('.admin-field-error');
        if (fieldError) {
          fieldError.textContent = message;
          fieldError.hidden = false;
        }
      }
      input.focus();
      return;
    }

    try {
      const error = options.onConfirm(values);
      if (typeof error === 'string' && error) {
        validation.textContent = window.isAdminDashboard ? '' : error;
        if (adminInlineMessage) {
          adminInlineMessage.textContent = error;
          adminInlineMessage.classList.add('is-error');
          adminInlineMessage.classList.remove('is-success');
          adminInlineMessage.hidden = false;
        }
        return;
      }
      dialog.close();
      if (options.successMessage) showLibraryToast(options.successMessage);
    } catch (error) {
      const message = error.message || 'Unable to complete this action.';
      validation.textContent = window.isAdminDashboard ? '' : message;
      if (adminInlineMessage) {
        adminInlineMessage.textContent = message;
        adminInlineMessage.classList.add('is-error');
        adminInlineMessage.classList.remove('is-success');
        adminInlineMessage.hidden = false;
      }
      const input = form.querySelector('input, textarea, select');
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        const field = input.closest('.library-dialog-field') || input.parentElement;
        const fieldError = field.querySelector('.admin-field-error');
        if (fieldError) {
          fieldError.textContent = message;
          fieldError.hidden = false;
        }
        input.focus();
      }
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
  const firstInput = form.querySelector('input, textarea, select');
  enhancePasswordVisibility(form);
  (firstInput || confirm).focus();
  return dialog;
}
