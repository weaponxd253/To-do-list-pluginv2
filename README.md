# Task Tracker Chrome Extension

A lightweight Chrome extension for tracking tasks directly from the browser toolbar. It supports priorities, due dates, completion status, filtering, task editing, delete undo, clear actions, and multiple visual themes.

## Features

- Add tasks from the popup
- Assign a priority: `Low`, `Medium`, or `High`
- Set a due date for each task
- Mark tasks as complete or incomplete
- Edit existing task text
- Delete individual tasks
- Undo the most recent task deletion
- Clear completed tasks
- Clear all tasks with inline confirmation
- Filter the list to show only incomplete tasks
- Display an incomplete-task count in the header
- Highlight overdue incomplete tasks
- Switch between multiple themes:
  - Auto
  - Light
  - Dark
  - Ocean / Ocean Dark
  - Forest / Forest Dark
  - Grape / Grape Dark
  - Slate / Slate Dark
  - Latte / Latte Dark

## Tech Stack

- HTML
- CSS
- JavaScript
- Chrome Extension Manifest V3
- Chrome Storage API

## Project Structure

```text
task-tracker/
├── background.js
├── manifest.json
├── popup.html
├── popup.js
├── styles.css
├── tasks.js
└── icons/
    └── list.png
```

## File Overview

| File | Purpose |
|---|---|
| `manifest.json` | Defines the Chrome extension metadata, popup entry point, permissions, background service worker, and icons. |
| `popup.html` | Contains the popup layout, task form, theme controls, task list, action buttons, confirmation bar, and undo toast. |
| `popup.js` | Handles UI behavior, rendering tasks, filtering, editing, delete undo, clearing tasks, due-date defaults, and theme switching. |
| `tasks.js` | Contains task storage helper functions using `chrome.storage.local`. |
| `styles.css` | Defines layout, task styling, priority colors, overdue states, buttons, toast UI, and theme variables. |
| `background.js` | Runs when the extension is installed and logs the install event. |

## Installation

1. Download or clone this project.
2. Open Chrome.
3. Go to:

   ```text
   chrome://extensions/
   ```

4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select the project folder containing `manifest.json`.
7. Pin **Task Tracker** to the Chrome toolbar.

## Required Files

Make sure the project includes the icon file referenced by the manifest:

```text
icons/list.png
```

The manifest points to this file for the extension icon at sizes `16`, `48`, and `128`.

## Usage

### Add a task

1. Open the extension popup.
2. Enter a task in the **New task** field.
3. Choose a priority.
4. Select a due date.
5. Click **Add**.

### Complete a task

Check the box next to the task. Completed tasks are moved into the completed section and shown with a strikethrough.

### Edit a task

Click the pencil icon next to a task, update the text, then click **Save**. Press **Escape** or click **Cancel** to exit edit mode without saving.

### Delete a task

Click the delete icon next to a task. A toast appears with an **Undo** button, allowing the most recent deletion to be restored.

### Filter tasks

Use **Show only incomplete** to hide completed tasks.

### Clear tasks

- **Clear Completed** removes all completed tasks.
- **Clear All** asks for confirmation before deleting every task.

## Data Storage

Tasks are stored locally using Chrome's local storage:

```js
chrome.storage.local
```

Theme preference is stored using Chrome's synced storage:

```js
chrome.storage.sync
```

A task object uses this structure:

```js
{
  id: "1714500000000",
  text: "Example task",
  done: false,
  priority: "Medium",
  dueDate: "2026-05-01"
}
```

## Permissions

The extension currently uses one Chrome permission:

```json
"permissions": ["storage"]
```

This is required so the extension can save tasks and theme preferences.

## Manual Test Checklist

Use this checklist after making changes:

- [ ] Extension loads successfully from `chrome://extensions/`
- [ ] Popup opens from the toolbar
- [ ] New tasks can be added
- [ ] Empty task submissions are ignored
- [ ] Task priority displays correctly
- [ ] Due date displays correctly
- [ ] Overdue tasks are visually highlighted
- [ ] Tasks can be marked complete
- [ ] Completed tasks move to the completed section
- [ ] The incomplete-task count updates correctly
- [ ] Show-only-incomplete filter works
- [ ] Task editing works
- [ ] Delete removes a task
- [ ] Undo restores the most recently deleted task
- [ ] Clear Completed removes only completed tasks
- [ ] Clear All shows confirmation before deleting tasks
- [ ] Theme dropdown changes the theme
- [ ] Theme toggle cycles through Auto, Light, and Dark
- [ ] Theme choice persists after closing and reopening the popup

## Possible Future Improvements

- Add task sorting by due date or priority
- Add drag-and-drop task reordering
- Add recurring tasks
- Add task categories or tags
- Add search
- Add notifications for due or overdue tasks
- Export and import tasks as JSON
- Add automated tests
- Publish to the Chrome Web Store

## Version

Current extension version: `1.1`

## Notes

This extension is designed to stay simple and local-first. Task data is stored in the browser and does not require a backend server.
