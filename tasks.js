// tasks.js — storage helpers for Task Tracker

function getTasks() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tasks'], (result) => {
      resolve(result.tasks || []);
    });
  });
}

function saveTasks(tasks) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ tasks }, resolve);
  });
}

function addTask(text, priority, dueDate) {
  return getTasks().then(tasks => {
    tasks.push({
      id: Date.now().toString(),
      text,
      done: false,
      priority,
      dueDate
    });
    return saveTasks(tasks);
  });
}

function deleteTask(index) {
  return getTasks().then(tasks => {
    tasks.splice(index, 1);
    return saveTasks(tasks);
  });
}

function toggleTask(index) {
  return getTasks().then(tasks => {
    tasks[index].done = !tasks[index].done;
    return saveTasks(tasks);
  });
}

function editTask(index, newText) {
  return getTasks().then(tasks => {
    tasks[index].text = newText;
    return saveTasks(tasks);
  });
}

function clearCompletedTasks() {
  return getTasks().then(tasks => {
    return saveTasks(tasks.filter(t => !t.done));
  });
}

function clearAllTasks() {
  return saveTasks([]);
}
