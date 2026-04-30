// popup.js — Task Tracker UI logic

/* ── DOM refs ── */
const form            = document.getElementById('task-form');
const input           = document.getElementById('task-input');
const list            = document.getElementById('task-list');
const prioritySelect  = document.getElementById('priority');
const dueDateInput    = document.getElementById('due-date');
const filterCheckbox  = document.getElementById('filter-incomplete');
const clearCompletedBtn = document.getElementById('clear-completed');
const clearAllBtn     = document.getElementById('clear-all');
const confirmClear    = document.getElementById('confirm-clear');
const confirmYes      = document.getElementById('confirm-yes');
const confirmNo       = document.getElementById('confirm-no');
const undoToast       = document.getElementById('undo-toast');
const undoBtn         = document.getElementById('undo-btn');
const taskCountEl     = document.getElementById('task-count');

/* ── Theme ── */
const THEME_KEY = 'themeMode';
const THEMES = [
  'auto', 'light', 'dark',
  'ocean', 'ocean-dark',
  'forest', 'forest-dark',
  'grape', 'grape-dark',
  'slate', 'slate-dark',
  'latte', 'latte-dark',
];
const mqlDark = window.matchMedia('(prefers-color-scheme: dark)');

function schemeFromTheme(name) {
  if (name === 'auto') return mqlDark.matches ? 'dark' : 'light';
  return name.endsWith('-dark') || name === 'dark' ? 'dark' : 'light';
}

function labelFromTheme(name) {
  if (name === 'auto')  return 'Auto (OS)';
  if (name === 'light') return 'Light';
  if (name === 'dark')  return 'Dark';
  return name.replace('-dark', ' (Dark)').replace(/\b\w/g, c => c.toUpperCase());
}

function getTheme() {
  return new Promise(res =>
    chrome.storage.sync.get([THEME_KEY], r =>
      res(r[THEME_KEY] || document.documentElement.getAttribute('data-theme') || 'auto')
    )
  );
}

function saveTheme(name) {
  return new Promise(res => chrome.storage.sync.set({ [THEME_KEY]: name }, res));
}

async function applyTheme(name, { persist = true } = {}) {
  const root   = document.documentElement;
  const scheme = schemeFromTheme(name);
  root.setAttribute('data-theme',  name);
  root.setAttribute('data-scheme', scheme);
  const sel = document.getElementById('theme-select');
  if (sel && sel.value !== name) sel.value = name;
  if (persist) await saveTheme(name);
}

async function initThemeUI() {
  const sel = document.getElementById('theme-select');
  THEMES.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = labelFromTheme(t);
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => applyTheme(e.target.value));
  const current = await getTheme();
  await applyTheme(current, { persist: false });

  // Keep Auto in sync with OS preference changes
  const onOSChange = () => getTheme().then(t => {
    if (t === 'auto') applyTheme('auto', { persist: false });
  });
  mqlDark.addEventListener
    ? mqlDark.addEventListener('change', onOSChange)
    : mqlDark.addListener(onOSChange);
}

const THEME_CYCLE = ['auto', 'light', 'dark'];
function nextCycleTheme(current) {
  const i = THEME_CYCLE.indexOf(current);
  return THEME_CYCLE[(i + 1) % THEME_CYCLE.length];
}

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const current = await getTheme();
    await applyTheme(nextCycleTheme(current));
  });
}

/* ── Undo ── */
let lastDeleted    = null;
let undoTimeout    = null;

function showUndoToast() {
  undoToast.hidden = false;
  clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => {
    undoToast.hidden = true;
    lastDeleted = null;
  }, 4000);
}

undoBtn.addEventListener('click', async () => {
  if (!lastDeleted) return;
  const tasks = await getTasks();
  tasks.splice(lastDeleted.idx, 0, lastDeleted.item);
  lastDeleted = null;
  undoToast.hidden = true;
  clearTimeout(undoTimeout);
  await saveTasks(tasks);
  loadTasks();
});

/* ── Render ── */
function renderTasks(tasks) {
  list.innerHTML = '';

  const items      = tasks.map((t, idx) => ({ ...t, _idx: idx }));
  const incomplete = items.filter(t => !t.done);
  const completed  = items.filter(t =>  t.done);

  // Task count badge in header
  taskCountEl.textContent = incomplete.length > 0 ? `(${incomplete.length})` : '';

  // Empty state
  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No tasks yet — add one above!';
    list.appendChild(empty);
    clearCompletedBtn.disabled = true;
    return;
  }

  const showOnlyIncomplete = filterCheckbox.checked;
  renderSection('Incomplete Tasks', incomplete);
  if (!showOnlyIncomplete) renderSection('Completed Tasks', completed);
  clearCompletedBtn.disabled = completed.length === 0;
}

function renderSection(title, taskGroup) {
  if (!taskGroup.length) return;

  const header = document.createElement('li');
  header.textContent = title;
  header.className = 'section-header';
  list.appendChild(header);

  taskGroup.forEach(task => {
    const li  = document.createElement('li');
    li.className = 'task-item';

    const row = document.createElement('div');
    row.className = 'task-row';

    // Checkbox
    const checkbox   = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" complete`);
    checkbox.addEventListener('change', () => toggleTask(task._idx).then(loadTasks));

    // Task text
    const textEl     = document.createElement('span');
    textEl.textContent = task.text;
    textEl.className = `task-text${task.done ? ' done' : ''}`;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type  = 'button';
    editBtn.className = 'icon-btn';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.textContent = '✏️';

    // Delete button
    const delBtn  = document.createElement('button');
    delBtn.type   = 'button';
    delBtn.className = 'icon-btn danger';
    delBtn.title  = 'Delete task';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.textContent = '❌';

    editBtn.addEventListener('click', () => enterEditMode(row, textEl, task, editBtn, delBtn));
    delBtn.addEventListener('click',  () => removeTask(task._idx));

    row.appendChild(checkbox);
    row.appendChild(textEl);
    row.appendChild(editBtn);
    row.appendChild(delBtn);

    // Meta row: priority + due date
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const safePriority = (task.priority || 'Medium').toLowerCase();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isOverdue = !task.done && task.dueDate && new Date(task.dueDate) < today;
    if (isOverdue) li.classList.add('overdue');

    meta.innerHTML =
      `Priority: <span class="priority-${safePriority}">${task.priority || 'Medium'}</span> | ` +
      `Due: <span class="${isOverdue ? 'overdue' : ''}">${task.dueDate || '—'}</span>`;

    li.appendChild(row);
    li.appendChild(meta);
    list.appendChild(li);
  });
}

/* ── Edit mode ── */
function enterEditMode(row, textEl, task, editBtn, delBtn) {
  const inputEdit   = document.createElement('input');
  inputEdit.type    = 'text';
  inputEdit.className = 'edit-input';
  inputEdit.value   = task.text;

  editBtn.style.display = 'none';
  delBtn.style.display  = 'none';

  const controls  = document.createElement('div');
  controls.className = 'edit-controls';

  const saveBtn   = document.createElement('button');
  saveBtn.type    = 'button';
  saveBtn.className = 'pill-btn';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.type  = 'button';
  cancelBtn.className = 'pill-btn subtle';
  cancelBtn.textContent = 'Cancel';

  const exitEdit = () => {
    controls.remove();
    row.replaceChild(textEl, inputEdit);
    editBtn.style.display = '';
    delBtn.style.display  = '';
  };

  saveBtn.addEventListener('click', () => {
    const v = inputEdit.value.trim();
    if (v) editTask(task._idx, v).then(loadTasks);
    else exitEdit();
  });
  cancelBtn.addEventListener('click', exitEdit);

  row.replaceChild(inputEdit, textEl);
  row.insertBefore(controls, editBtn);
  controls.appendChild(saveBtn);
  controls.appendChild(cancelBtn);

  inputEdit.focus();
  inputEdit.select();
  inputEdit.addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveBtn.click();
    if (e.key === 'Escape') cancelBtn.click();
  });
}

/* ── Delete with undo ── */
async function removeTask(idx) {
  const tasks = await getTasks();
  lastDeleted = { item: tasks[idx], idx };
  tasks.splice(idx, 1);
  await saveTasks(tasks);
  loadTasks();
  showUndoToast();
}

/* ── Clear All (inline confirm) ── */
clearAllBtn.addEventListener('click', () => {
  confirmClear.hidden = false;
  clearAllBtn.disabled = true;
});
confirmNo.addEventListener('click', () => {
  confirmClear.hidden = true;
  clearAllBtn.disabled = false;
});
confirmYes.addEventListener('click', async () => {
  confirmClear.hidden = true;
  clearAllBtn.disabled = false;
  await clearAllTasks();
  loadTasks();
});

/* ── Filter + load ── */
filterCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ filterIncomplete: filterCheckbox.checked });
  loadTasks();
});

function loadTasks() {
  getTasks().then(renderTasks);
}

/* ── Form submit ── */
form.addEventListener('submit', e => {
  e.preventDefault();
  const value    = input.value.trim();
  const priority = prioritySelect.value;
  const dueDate  = dueDateInput.value;
  if (!value) return;
  addTask(value, priority, dueDate).then(() => {
    input.value = '';
    input.focus();
    loadTasks();
  });
});

/* ── Clear completed ── */
clearCompletedBtn.addEventListener('click', () => {
  clearCompletedTasks().then(loadTasks);
});

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  initThemeUI();
  initThemeToggle();

  chrome.storage.local.get(['filterIncomplete'], data => {
    filterCheckbox.checked = data.filterIncomplete || false;

    // Default due date = tomorrow
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    const pad  = n => String(n).padStart(2, '0');
    dueDateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // Min date = today
    const today = new Date();
    dueDateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    loadTasks();
  });
});
