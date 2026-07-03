'use strict';

// Список задач хранится в массиве и в localStorage.
// Каждая задача: { id, text, done, createdAt }

let tasks = loadTasks();
let currentFilter = 'all';
let currentSort = 'created-desc';

const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const countLabel = document.getElementById('task-count');
const clearDoneBtn = document.getElementById('clear-done');
const filterButtons = document.querySelectorAll('.filters__btn');
const sortSelect = document.getElementById('sort-select');

function loadTasks() {
  const raw = localStorage.getItem('tasks');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Санитизация текста задачи перед вставкой в DOM, защита от XSS.
// Используем DOMPurify, чтобы вырезать теги из ввода пользователя.
function sanitize(text) {
  if (window.DOMPurify) {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  }
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function addTask(text) {
  const clean = sanitize(text.trim());
  if (clean === '') return;

  tasks.push({
    id: Date.now().toString(),
    text: clean,
    done: false,
    createdAt: Date.now()
  });

  saveTasks();
  render();
}

function toggleTask(id) {
  for (const task of tasks) {
    if (task.id === id) {
      task.done = !task.done;
    }
  }
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function clearDone() {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  render();
}

function getVisibleTasks() {
  let result = tasks;

  if (currentFilter === 'active') {
    result = result.filter((t) => !t.done);
  } else if (currentFilter === 'done') {
    result = result.filter((t) => t.done);
  }

  result = result.slice();

  if (currentSort === 'created-asc') {
    result.sort((a, b) => a.createdAt - b.createdAt);
  } else if (currentSort === 'alpha-asc') {
    result.sort((a, b) => a.text.localeCompare(b.text, 'ru'));
  } else if (currentSort === 'status') {
    result.sort((a, b) => a.done - b.done);
  } else {
    result.sort((a, b) => b.createdAt - a.createdAt);
  }

  return result;
}

function render() {
  const visible = getVisibleTasks();
  list.innerHTML = '';

  visible.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task' + (task.done ? ' is-done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task__check';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'task__text';
    span.textContent = task.text; // textContent, а не innerHTML — безопасно для XSS

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task__delete';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  emptyState.hidden = visible.length !== 0;

  const activeCount = tasks.filter((t) => !t.done).length;
  countLabel.textContent = activeCount + ' задач';
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  addTask(input.value);
  input.value = '';
});

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  render();
});

clearDoneBtn.addEventListener('click', clearDone);

render();
