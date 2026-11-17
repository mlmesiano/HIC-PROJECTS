function showLibraryToast(message, type = 'success') {
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
    if (field.step != null) input.step = field.step;
    if (field.value != null) input.value = field.value;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.rows) input.rows = field.rows;
    input.required = Boolean(field.required);
    input.className = 'library-dialog-input';

    wrapper.append(label, input);
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
    form.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute('aria-invalid'));
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(fields.map(field => [
      field.name,
      form.elements.namedItem(field.name).value.trim()
    ]));
    const invalidField = fields.find(field => field.required && !values[field.name]);
    if (invalidField) {
      validation.textContent = `${invalidField.label} is required.`;
      const input = form.elements.namedItem(invalidField.name);
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }

    try {
      const error = options.onConfirm(values);
      if (typeof error === 'string' && error) {
        validation.textContent = error;
        return;
      }
      dialog.close();
      if (options.successMessage) showLibraryToast(options.successMessage);
    } catch (error) {
      validation.textContent = error.message || 'Unable to complete this action.';
      const input = form.querySelector('input, textarea, select');
      if (input) {
        input.setAttribute('aria-invalid', 'true');
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
  (firstInput || confirm).focus();
  return dialog;
}
