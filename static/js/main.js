// UniSpace Main Frontend Engine — Complete Production Digital Workspace

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/>' },
  { id: 'drive', label: 'My Drive', icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>' },
  { id: 'notes', label: 'Notes', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
  { id: 'tasks', label: 'Tasks', icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { id: 'calendar', label: 'Calendar', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  { id: 'timetable', label: 'Timetable', icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/>' },
  { id: 'bookmarks', label: 'Bookmarks', icon: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>' },
  { id: 'projects', label: 'Projects', icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polyline points="12 11 12 17"/><polyline points="9 14 15 14"/>' },
  { id: 'reminders', label: 'Reminders', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
  { id: 'settings', label: 'Settings', icon: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>' }
];

let activeView = 'dashboard';
let currentFolderId = null; // null = root
let selectedNoteId = null;
let taskViewMode = 'kanban'; // kanban or list
let bookmarkCategoryFilter = 'All';
let driveSortBy = 'date';
let workspaceData = { notes: [], files: [], folders: [], tasks: [], timetable: [], projects: [], bookmarks: [], calendar: [], reminders: [], activities: [] };

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerHTML = `✨ ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function renderSidebarNav() {
  const container = document.getElementById('sidebarNav');
  if (!container) return;
  container.innerHTML = navItems.map(item => `
    <a class="nav-item ${item.id === activeView ? 'active' : ''}" data-view="${item.id}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.icon}</svg>
      <span class="nav-text">${item.label}</span>
    </a>
  `).join('');

  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.getAttribute('data-view');
      if (view === 'drive') currentFolderId = null;
      switchView(view);
    });
  });
}

async function fetchWorkspaceData() {
  try {
    const [notesRes, filesRes, foldersRes, tasksRes, timetableRes, projectsRes, bookmarksRes, calendarRes, remindersRes, actRes] = await Promise.all([
      fetch('/api/v1/notes').then(r => r.json()),
      fetch(`/api/v1/files?sort_by=${driveSortBy}`).then(r => r.json()),
      fetch('/api/v1/folders').then(r => r.json()),
      fetch('/api/v1/tasks').then(r => r.json()),
      fetch('/api/v1/timetable').then(r => r.json()),
      fetch('/api/v1/projects').then(r => r.json()),
      fetch('/api/v1/bookmarks').then(r => r.json()),
      fetch('/api/v1/calendar').then(r => r.json()),
      fetch('/api/v1/reminders').then(r => r.json()),
      fetch('/api/v1/activity').then(r => r.json())
    ]);

    workspaceData = {
      notes: notesRes || [],
      files: filesRes || [],
      folders: foldersRes || [],
      tasks: tasksRes || [],
      timetable: timetableRes || [],
      projects: projectsRes || [],
      bookmarks: bookmarksRes || [],
      calendar: calendarRes || [],
      reminders: remindersRes || [],
      activities: actRes || []
    };
  } catch (err) {
    console.error('Error fetching workspace data:', err);
  }
}

async function deleteItem(type, id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  try {
    await fetch(`/api/v1/${type}/${id}`, { method: 'DELETE' });
    showToast('Item deleted successfully.');
    if (type === 'folders' && currentFolderId === id) {
      currentFolderId = null;
    }
    await switchView(activeView);
  } catch (err) {
    console.error(err);
  }
}

async function renameFile(fileId, currentName) {
  const newName = prompt('Enter new file name:', currentName);
  if (!newName || newName.trim() === '' || newName === currentName) return;
  try {
    await fetch(`/api/v1/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: newName.trim() })
    });
    showToast('File renamed successfully.');
    const modal = document.getElementById('filePreviewModal');
    if (modal) modal.classList.remove('active');
    await switchView(activeView);
  } catch (err) {
    console.error(err);
  }
}

async function moveFile(fileId) {
  const file = workspaceData.files.find(f => f.id === fileId);
  if (!file) return;

  const folderOptions = [
    '0: [ Root Directory ] (My Drive)',
    ...workspaceData.folders.map((f, i) => `${i + 1}: 📁 ${f.name}`)
  ];

  const selection = prompt(`Select target folder for "${file.file_name}":\n\n` + folderOptions.join('\n') + '\n\nEnter option number (0 for Root):', '0');
  if (selection === null) return;

  const idx = parseInt(selection.trim(), 10);
  let targetFolderId = null;
  if (idx > 0 && idx <= workspaceData.folders.length) {
    targetFolderId = workspaceData.folders[idx - 1].id;
  }

  try {
    await fetch(`/api/v1/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: targetFolderId })
    });
    showToast('File moved successfully.');
    const modal = document.getElementById('filePreviewModal');
    if (modal) modal.classList.remove('active');
    await switchView(activeView);
  } catch (err) {
    console.error(err);
  }
}

async function renameFolder(folderId, currentName) {
  const newName = prompt('Enter new folder name:', currentName);
  if (!newName || newName.trim() === '' || newName === currentName) return;
  try {
    await fetch(`/api/v1/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() })
    });
    showToast('Folder renamed successfully.');
    await switchView(activeView);
  } catch (err) {
    console.error(err);
  }
}

async function createFolder(parentId = null) {
  const name = prompt('Enter folder name:');
  if (!name || name.trim() === '') return;
  try {
    await fetch('/api/v1/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color: '#00F5A0', parent_id: parentId || currentFolderId })
    });
    showToast('Folder created successfully.');
    await switchView(activeView);
  } catch (err) {
    console.error(err);
  }
}

function openFolder(folderId) {
  currentFolderId = folderId;
  switchView('drive');
}

async function previewFile(fileId) {
  const file = workspaceData.files.find(f => f.id === fileId);
  if (!file) return;

  const modal = document.getElementById('filePreviewModal');
  const body = document.getElementById('filePreviewBody');
  const nameEl = document.getElementById('previewFileName');
  const extEl = document.getElementById('previewFileExt');
  const metaEl = document.getElementById('previewFileMeta');
  const btnDownload = document.getElementById('btnDownloadFile');
  const btnDelete = document.getElementById('btnDeleteFile');
  const btnRename = document.getElementById('btnRenameFile');
  const btnMove = document.getElementById('btnMoveFile');
  if (!modal) return;

  nameEl.innerText = file.file_name;
  extEl.innerText = (file.file_extension || 'FILE').toUpperCase();
  metaEl.innerText = `Size: ${(file.file_size / 1024 / 1024).toFixed(2)} MB • ${file.mime_type || ''}`;

  let downloadName = file.file_name;
  const extSuffix = `.${file.file_extension}`;
  if (!downloadName.toLowerCase().endsWith(extSuffix.toLowerCase())) {
    downloadName = `${downloadName}${extSuffix}`;
  }

  btnDownload.href = `/api/v1/files/${file.id}/download`;
  btnDownload.download = downloadName;

  btnDelete.onclick = async () => {
    modal.classList.remove('active');
    await deleteItem('files', file.id);
  };

  btnRename.onclick = () => renameFile(file.id, file.file_name);
  if (btnMove) btnMove.onclick = () => moveFile(file.id);

  const ext = (file.file_extension || '').toLowerCase();
  const contentUrl = `/api/v1/files/${file.id}/content`;

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    body.innerHTML = `<img src="${contentUrl}" style="max-width: 100%; max-height: 520px; border-radius: 12px; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" alt="${file.file_name}" />`;
  } else if (ext === 'pdf') {
    body.innerHTML = `<iframe src="${contentUrl}" style="width: 100%; height: 540px; border: none; border-radius: 12px;"></iframe>`;
  } else if (['txt', 'py', 'js', 'json', 'html', 'css', 'md', 'csv', 'log'].includes(ext)) {
    try {
      const text = await fetch(contentUrl).then(r => r.text());
      body.innerHTML = `<pre style="width: 100%; max-height: 480px; overflow: auto; background: #070B14; padding: 18px; border-radius: 12px; font-family: var(--font-mono); color: #00F5A0; font-size: 0.88rem; line-height: 1.6; border: 1px solid var(--border-glass);"><code>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    } catch (err) {
      body.innerHTML = `<div style="text-align: center; color: var(--text-muted);">Error loading text file content.</div>`;
    }
  } else {
    body.innerHTML = `
      <div style="text-align: center; padding: 36px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">📄</div>
        <h4 style="font-family: var(--font-heading); font-weight: 700; color: #FFF; font-size: 1.2rem;">Preview unavailable for this format</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px; margin-bottom: 20px;">Direct browser preview is not supported for .${ext} files. Download the file to view it locally.</p>
        <a href="${contentUrl}?download=1" target="_blank" download="${downloadName}" class="btn-quick-add" style="display: inline-flex; text-decoration: none;">⬇️ Download File</a>
      </div>
    `;
  }

  modal.classList.add('active');

  const closeBtn = document.getElementById('closeFilePreview');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
}

async function toggleTaskStatus(id, currentStatus) {
  const nextStatus = currentStatus === 'todo' ? 'in_progress' : (currentStatus === 'in_progress' ? 'done' : 'todo');
  try {
    await fetch(`/api/v1/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, progress: nextStatus === 'done' ? 100 : (nextStatus === 'in_progress' ? 50 : 0) })
    });
    showToast(`Task status updated to ${nextStatus.replace('_', ' ').toUpperCase()}`);
    await switchView(activeView);
  } catch (err) {
    console.error(err);
  }
}

async function openProjectDetails(projId) {
  try {
    const res = await fetch(`/api/v1/projects/${projId}/details`).then(r => r.json());
    const modal = document.getElementById('projectDetailsModal');
    const nameEl = document.getElementById('projModalName');
    const statusEl = document.getElementById('projModalStatus');
    const descEl = document.getElementById('projModalDesc');
    const bodyEl = document.getElementById('projModalBody');
    if (!modal) return;

    nameEl.innerText = res.project.name;
    statusEl.innerText = (res.project.status || 'IN PROGRESS').toUpperCase();
    descEl.innerText = res.project.description || 'No description provided';

    bodyEl.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div class="glass-card" style="padding: 16px;">
          <h4 style="color: var(--neon-mint); font-family: var(--font-heading); margin-bottom: 10px;">Associated Tasks (${res.tasks.length})</h4>
          ${res.tasks.length > 0 ? res.tasks.map(t => `<div style="padding: 6px 0; border-bottom: 1px dashed var(--border-glass); color: #FFF; font-size: 0.9rem;">✅ ${t.title} (${t.status})</div>`).join('') : '<div style="color: var(--text-muted); font-size: 0.85rem;">No connected tasks.</div>'}
        </div>
        <div class="glass-card" style="padding: 16px;">
          <h4 style="color: var(--neon-cyan); font-family: var(--font-heading); margin-bottom: 10px;">Associated Notes (${res.notes.length})</h4>
          ${res.notes.length > 0 ? res.notes.map(n => `<div style="padding: 6px 0; border-bottom: 1px dashed var(--border-glass); color: #FFF; font-size: 0.9rem;">📝 ${n.title}</div>`).join('') : '<div style="color: var(--text-muted); font-size: 0.85rem;">No connected notes.</div>'}
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.getElementById('closeProjectModal').onclick = () => modal.classList.remove('active');
  } catch (err) {
    console.error(err);
  }
}

async function switchView(viewId) {
  activeView = viewId;
  renderSidebarNav();
  await fetchWorkspaceData();
  const main = document.getElementById('mainContent');
  if (!main) return;

  if (viewId === 'dashboard') renderDashboardView(main);
  else if (viewId === 'drive') renderDriveView(main);
  else if (viewId === 'notes') renderNotesView(main);
  else if (viewId === 'tasks') renderTasksView(main);
  else if (viewId === 'timetable') renderTimetableView(main);
  else if (viewId === 'bookmarks') renderBookmarksView(main);
  else if (viewId === 'projects') renderProjectsView(main);
  else if (viewId === 'calendar') renderCalendarView(main);
  else if (viewId === 'reminders') renderRemindersView(main);
  else if (viewId === 'settings') renderSettingsView(main);
  else {
    main.innerHTML = `<div class="empty-state"><h3 class="empty-title">${viewId.toUpperCase()} View</h3><p>Loaded from Flask SQLite backend.</p></div>`;
  }
  setupCardTiltEffect();
}

function renderDashboardView(container) {
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const pendingTasks = workspaceData.tasks.filter(t => t.status !== 'done');
  const activeProjects = workspaceData.projects.filter(p => p.status !== 'completed');

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Greeting Banner -->
      <div class="col-12">
        <div class="greeting-banner">
          <div class="greeting-text">
            <span class="badge-tag">⚡ Personal Digital Workspace</span>
            <h1 style="margin-top: 6px;">Welcome back 👋</h1>
            <p>${todayStr}</p>
          </div>
        </div>
      </div>

      <!-- Dynamic Stat Cards -->
      <div class="col-3">
        <div class="glass-panel" style="padding: 18px 20px; cursor: pointer;" onclick="window.switchView('tasks')">
          <h3 style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px; font-family: var(--font-mono); font-weight: 700;">PENDING TASKS</h3>
          <div style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: 800; color: var(--neon-mint);">${pendingTasks.length} Tasks</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">${pendingTasks.length > 0 ? pendingTasks[0].title : 'All tasks completed'}</p>
        </div>
      </div>

      <div class="col-3">
        <div class="glass-panel" style="padding: 18px 20px; cursor: pointer;" onclick="window.switchView('projects')">
          <h3 style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px; font-family: var(--font-mono); font-weight: 700;">ACTIVE PROJECTS</h3>
          <div style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: 800; color: var(--neon-cyan);">${activeProjects.length} Projects</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">${activeProjects.length > 0 ? activeProjects[0].name : 'No active projects'}</p>
        </div>
      </div>

      <div class="col-3">
        <div class="glass-panel" style="padding: 18px 20px; cursor: pointer;" onclick="window.switchView('timetable')">
          <h3 style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px; font-family: var(--font-mono); font-weight: 700;">WEEKLY LECTURES</h3>
          <div style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: 800; color: var(--neon-purple);">${workspaceData.timetable.length} Classes</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">Timetable schedule</p>
        </div>
      </div>

      <div class="col-3">
        <div class="glass-panel" style="padding: 18px 20px; cursor: pointer;" onclick="window.switchView('drive')">
          <h3 style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px; font-family: var(--font-mono); font-weight: 700;">DRIVE FILES</h3>
          <div style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: 800; color: var(--neon-amber);">${workspaceData.files.length} Files</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">Local SQLite storage</p>
        </div>
      </div>

      <!-- Recent Activity Stream -->
      <div class="col-6">
        <div class="glass-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem;">Recent Activity Stream</h3>
            <span class="badge-tag">Real-Time Sync</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${workspaceData.activities.length > 0 ? workspaceData.activities.slice(0, 4).map(act => `
              <div class="glass-card" style="padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.88rem; color: #FFF;">⚡ ${act.description}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${act.created_at}</div>
              </div>
            `).join('') : '<div style="padding: 18px; text-align: center; color: var(--text-muted); font-size: 0.88rem;">✨ Your workspace is clean. Create items to see activity logs.</div>'}
          </div>
        </div>
      </div>

      <!-- Recent Notes -->
      <div class="col-6">
        <div class="glass-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem;">Recent Notes</h3>
            <button class="badge-tag" style="cursor: pointer;" onclick="window.openCreationModal('note')">+ New Note</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${workspaceData.notes.length > 0 ? workspaceData.notes.slice(0, 3).map(n => `
              <div class="glass-card" onclick="window.switchView('notes')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; font-size: 1rem; color: #FFF;">${n.title}</div>
                  <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px;">${n.content}</p>
                </div>
                <button onclick="event.stopPropagation(); window.deleteItem('notes', '${n.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 1.1rem;" title="Delete Note">🗑️</button>
              </div>
            `).join('') : `
              <div style="padding: 24px; text-align: center; border: 1px dashed var(--border-glass); border-radius: var(--radius-md);">
                <div style="font-size: 1.5rem; margin-bottom: 8px;">📝</div>
                <div style="font-weight: 700; color: #FFF;">Your notes space is empty</div>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px; margin-bottom: 14px;">Capture thoughts, study notes, or meeting minutes.</p>
                <button class="btn-quick-add" style="padding: 6px 16px; font-size: 0.8rem;" onclick="window.openCreationModal('note')">+ Create your first note</button>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDriveView(container) {
  const currentFolder = workspaceData.folders.find(f => f.id === currentFolderId);
  const displayedFiles = workspaceData.files.filter(f => {
    if (!currentFolderId) return !f.folder_id;
    return f.folder_id === currentFolderId;
  });

  container.innerHTML = `
    <!-- Header & Breadcrumbs & Toolbar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; font-family: var(--font-heading); font-weight: 800; font-size: 1.6rem; color: var(--neon-mint); margin-bottom: 4px;">
          <span style="cursor: pointer;" onclick="window.openFolder(null)">📁 My Drive</span>
          ${currentFolder ? `<span style="color: var(--text-muted);">&gt;</span> <span style="color: #FFF;">${currentFolder.name}</span>` : ''}
        </div>
        <p style="color: var(--text-secondary); font-size: 0.88rem;">Nested folder management, in-app file previewer & original format downloader</p>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <select style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 8px 12px; border-radius: var(--radius-sm); color: #FFF; outline: none; font-size: 0.85rem;" onchange="window.setDriveSort(this.value)">
          <option value="date" ${driveSortBy === 'date' ? 'selected' : ''}>Sort by Date</option>
          <option value="name" ${driveSortBy === 'name' ? 'selected' : ''}>Sort by Name</option>
          <option value="size" ${driveSortBy === 'size' ? 'selected' : ''}>Sort by Size</option>
          <option value="type" ${driveSortBy === 'type' ? 'selected' : ''}>Sort by Type</option>
        </select>
        <button class="btn-quick-add" style="background: rgba(0, 245, 160, 0.15); color: var(--neon-mint); border: 1px solid var(--neon-mint); box-shadow: none;" onclick="window.createFolder()">+ New Folder</button>
        <button class="btn-quick-add" onclick="window.openCreationModal('file')">↑ Upload File</button>
      </div>
    </div>

    <!-- Folders Grid -->
    ${workspaceData.folders.length > 0 ? `
      <div style="margin-bottom: 28px;">
        <h3 style="font-family: var(--font-heading); font-size: 0.88rem; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; font-family: var(--font-mono);">FOLDERS</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;">
          ${workspaceData.folders.filter(f => currentFolderId ? f.parent_id === currentFolderId : !f.parent_id).map(fold => {
            const count = workspaceData.files.filter(f => f.folder_id === fold.id).length;
            return `
              <div class="glass-card" onclick="window.openFolder('${fold.id}')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 14px; border-left: 3px solid ${fold.color || 'var(--neon-mint)'};">
                <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                  <span style="font-size: 1.4rem;">📁</span>
                  <div style="overflow: hidden;">
                    <div style="font-weight: 700; color: #FFF; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${fold.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${count} ${count === 1 ? 'file' : 'files'}</div>
                  </div>
                </div>
                <div style="display: flex; gap: 4px;">
                  <button onclick="event.stopPropagation(); window.renameFolder('${fold.id}', '${fold.name}')" style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; padding: 4px;" title="Rename Folder">✏️</button>
                  <button onclick="event.stopPropagation(); window.deleteItem('folders', '${fold.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; padding: 4px;" title="Delete Folder">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Files Section -->
    <div>
      <h3 style="font-family: var(--font-heading); font-size: 0.88rem; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; font-family: var(--font-mono);">
        ${currentFolder ? `FILES IN "${currentFolder.name.toUpperCase()}"` : 'ROOT FILES'} (CLICK TO PREVIEW)
      </h3>
      ${displayedFiles.length > 0 ? `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;">
          ${displayedFiles.map(f => `
            <div class="glass-card" onclick="window.previewFile('${f.id}')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(0, 245, 160, 0.15); color: var(--neon-mint); display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-mono); font-size: 0.8rem; border: 1px solid rgba(0, 245, 160, 0.3);">${(f.file_extension || 'FILE').toUpperCase()}</div>
                <div style="overflow: hidden;">
                  <div style="font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #FFF;">${f.file_name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${(f.file_size / 1024 / 1024).toFixed(1)} MB &bull; Click to Preview</div>
                </div>
              </div>
              <div style="display: flex; gap: 4px;">
                <button onclick="event.stopPropagation(); window.moveFile('${f.id}')" style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; font-size: 0.95rem; padding: 4px;" title="Move File">🚚</button>
                <button onclick="event.stopPropagation(); window.renameFile('${f.id}', '${f.file_name}')" style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; font-size: 0.95rem; padding: 4px;" title="Rename File">✏️</button>
                <button onclick="event.stopPropagation(); window.deleteItem('files', '${f.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 0.95rem; padding: 4px;" title="Delete File">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="glass-panel" style="padding: 48px; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">📁</div>
          <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: #FFF;">This directory is empty</h3>
          <p style="color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">${currentFolder ? `No files in "${currentFolder.name}". Click "+ Upload File" to add files here.` : 'Upload documents, PDFs, or images to your storage root.'}</p>
          <button class="btn-quick-add" onclick="window.openCreationModal('file')">+ Upload File Here</button>
        </div>
      `}
    </div>
  `;
}

function setDriveSort(sortBy) {
  driveSortBy = sortBy;
  switchView('drive');
}

function renderNotesView(container) {
  if (!selectedNoteId && workspaceData.notes.length > 0) {
    selectedNoteId = workspaceData.notes[0].id;
  }
  const curNote = workspaceData.notes.find(n => n.id === selectedNoteId);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 1.7rem; color: var(--neon-mint);">Personal Knowledge Notes</h2>
      <button class="btn-quick-add" onclick="window.openCreationModal('note')">+ New Note</button>
    </div>

    ${workspaceData.notes.length > 0 ? `
      <div style="display: flex; gap: 20px; height: calc(100vh - 180px);">
        <div style="width: 320px;" class="glass-panel">
          <div style="padding-bottom: 14px; border-bottom: 1px solid var(--border-glass); margin-bottom: 12px;">
            <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem;">All Notes (${workspaceData.notes.length})</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; max-height: calc(100% - 40px);">
            ${workspaceData.notes.map(n => `
              <div class="glass-card" onclick="window.selectNote('${n.id}')" style="padding: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; ${n.id === selectedNoteId ? 'border-color: var(--neon-mint); box-shadow: var(--glow-mint);' : ''}">
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: #FFF;">${n.is_pinned ? '📌 ' : ''}${n.title}</div>
                </div>
                <button onclick="event.stopPropagation(); window.deleteItem('notes', '${n.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 1rem;" title="Delete Note">🗑️</button>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="flex: 1; padding: 24px; display: flex; flex-direction: column;" class="glass-panel">
          ${curNote ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: var(--neon-mint);">${curNote.title}</h2>
              <button class="badge-tag" style="cursor: pointer;" onclick="window.togglePinNote('${curNote.id}', ${!curNote.is_pinned})">${curNote.is_pinned ? '📌 Pinned' : 'Pin to top'}</button>
            </div>
            <textarea style="flex: 1; width: 100%; background: #070B14; border: 1px solid var(--border-glass); padding: 18px; border-radius: 12px; color: #FFF; font-family: var(--font-display); font-size: 1rem; line-height: 1.7; outline: none; resize: none;" onchange="window.updateNoteContent('${curNote.id}', this.value)">${curNote.content}</textarea>
          ` : '<p>Select a note to read.</p>'}
        </div>
      </div>
    ` : `
      <div class="glass-panel" style="padding: 48px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">📝</div>
        <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: #FFF;">Your Notes workspace is empty</h3>
        <p style="color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">Start organizing your research, code snippets, and lecture notes.</p>
        <button class="btn-quick-add" onclick="window.openCreationModal('note')">+ Create Your First Note</button>
      </div>
    `}
  `;
}

function selectNote(id) {
  selectedNoteId = id;
  switchView('notes');
}

async function updateNoteContent(id, content) {
  try {
    await fetch(`/api/v1/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content })
    });
    showToast('Note autosaved.');
  } catch (err) {
    console.error(err);
  }
}

async function togglePinNote(id, isPinned) {
  try {
    await fetch(`/api/v1/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: isPinned })
    });
    showToast(isPinned ? 'Note pinned to top.' : 'Note unpinned.');
    switchView('notes');
  } catch (err) {
    console.error(err);
  }
}

function renderTasksView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 1.7rem; color: var(--neon-mint);">Tasks Matrix</h2>
      <div style="display: flex; gap: 12px;">
        <button class="badge-tag" style="cursor: pointer;" onclick="window.setTaskViewMode('${taskViewMode === 'kanban' ? 'list' : 'kanban'}')">Switch to ${taskViewMode === 'kanban' ? 'List View' : 'Kanban View'}</button>
        <button class="btn-quick-add" onclick="window.openCreationModal('task')">+ New Task</button>
      </div>
    </div>

    ${workspaceData.tasks.length > 0 ? `
      ${taskViewMode === 'kanban' ? `
        <div class="kanban-board">
          <div class="kanban-column">
            <div class="kanban-column-header">TO DO</div>
            ${workspaceData.tasks.filter(t => t.status === 'todo').map(t => `
              <div class="glass-card" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div style="font-weight: 700; color: #FFF;">${t.title}</div>
                  <button onclick="window.deleteItem('tasks', '${t.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 0.9rem;" title="Delete Task">🗑️</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                  <span class="badge-tag" style="background: rgba(255, 46, 147, 0.15); color: var(--neon-rose);">${(t.priority || 'medium').toUpperCase()}</span>
                  <button class="badge-tag" style="cursor: pointer;" onclick="window.toggleTaskStatus('${t.id}', '${t.status}')">Move to In Progress &rarr;</button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="kanban-column">
            <div class="kanban-column-header">IN PROGRESS</div>
            ${workspaceData.tasks.filter(t => t.status === 'in_progress').map(t => `
              <div class="glass-card" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div style="font-weight: 700; color: #FFF;">${t.title}</div>
                  <button onclick="window.deleteItem('tasks', '${t.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 0.9rem;" title="Delete Task">🗑️</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                  <span class="badge-tag" style="background: rgba(0, 245, 160, 0.15); color: var(--neon-mint);">${(t.priority || 'high').toUpperCase()}</span>
                  <button class="badge-tag" style="cursor: pointer; background: rgba(0, 245, 160, 0.2);" onclick="window.toggleTaskStatus('${t.id}', '${t.status}')">Mark Complete &check;</button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="kanban-column">
            <div class="kanban-column-header">COMPLETED</div>
            ${workspaceData.tasks.filter(t => t.status === 'done').map(t => `
              <div class="glass-card" style="margin-bottom: 12px; opacity: 0.7;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div style="font-weight: 700; text-decoration: line-through; color: #FFF;">${t.title}</div>
                  <button onclick="window.deleteItem('tasks', '${t.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 0.9rem;" title="Delete Task">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="glass-panel">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${workspaceData.tasks.map(t => `
              <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <input type="checkbox" ${t.status === 'done' ? 'checked' : ''} onchange="window.toggleTaskStatus('${t.id}', '${t.status}')" style="width: 18px; height: 18px; accent-color: var(--neon-mint);" />
                  <div>
                    <div style="font-weight: 700; color: #FFF; ${t.status === 'done' ? 'text-decoration: line-through;' : ''}">${t.title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Due: ${t.due_date || 'No date set'} &bull; Category: ${t.category || 'General'}</div>
                  </div>
                </div>
                <button onclick="window.deleteItem('tasks', '${t.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer;" title="Delete Task">🗑️</button>
              </div>
            `).join('')}
          </div>
        </div>
      `}
    ` : `
      <div class="glass-panel" style="padding: 48px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">✅</div>
        <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: #FFF;">No tasks created yet</h3>
        <p style="color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">Break down your goals into actionable tasks with priorities and deadlines.</p>
        <button class="btn-quick-add" onclick="window.openCreationModal('task')">+ Add Your First Task</button>
      </div>
    `}
  `;
}

function setTaskViewMode(mode) {
  taskViewMode = mode;
  switchView('tasks');
}

function renderTimetableView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 1.7rem; color: var(--neon-mint);">College Timetable Matrix</h2>
      <button class="btn-quick-add" onclick="window.openCreationModal('timetable')">+ Add Lecture</button>
    </div>

    ${workspaceData.timetable.length > 0 ? `
      <div class="glass-panel">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          ${workspaceData.timetable.map(t => `
            <div class="class-card" style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-size: 0.75rem; color: var(--neon-mint); font-family: var(--font-mono); font-weight: 700; text-transform: uppercase;">${t.day_of_week}</div>
                <div class="class-title" style="margin-top: 4px;">${t.subject}</div>
                <div class="class-meta" style="margin-top: 8px;">⏰ ${t.start_time} - ${t.end_time || ''}</div>
                <div class="class-meta">📍 ${t.room || 'Hall TBD'} &bull; 👤 ${t.instructor || 'Instructor TBD'}</div>
              </div>
              <button onclick="window.deleteItem('timetable', '${t.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 1rem;" title="Delete Lecture">🗑️</button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `
      <div class="glass-panel" style="padding: 48px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">📅</div>
        <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: #FFF;">No lectures scheduled</h3>
        <p style="color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">Keep track of your weekly classes, instructors, and hall locations.</p>
        <button class="btn-quick-add" onclick="window.openCreationModal('timetable')">+ Add Your First Lecture</button>
      </div>
    `}
  `;
}

function renderBookmarksView(container) {
  const filtered = bookmarkCategoryFilter === 'All' ? workspaceData.bookmarks : workspaceData.bookmarks.filter(b => b.category === bookmarkCategoryFilter);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 1.7rem; color: var(--neon-mint);">Bookmarks Matrix</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Saved web resources, repositories, and learning hubs</p>
      </div>
      <button class="btn-quick-add" onclick="window.openCreationModal('bookmark')">+ Add Bookmark</button>
    </div>

    ${workspaceData.bookmarks.length > 0 ? `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        ${filtered.map(b => `
          <div class="glass-card" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-weight: 700; font-size: 1rem; margin-bottom: 6px; color: #FFF;">${b.title}</div>
              <a href="${b.url}" target="_blank" style="color: var(--neon-cyan); text-decoration: none; font-size: 0.85rem; word-break: break-all; font-family: var(--font-mono);">${b.url}</a>
            </div>
            <button onclick="window.deleteItem('bookmarks', '${b.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 1rem;" title="Delete Bookmark">🗑️</button>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="glass-panel" style="padding: 48px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🔖</div>
        <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: #FFF;">No bookmarks saved yet</h3>
        <p style="color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">Save links to research papers, documentation, or study tools.</p>
        <button class="btn-quick-add" onclick="window.openCreationModal('bookmark')">+ Save Your First Bookmark</button>
      </div>
    `}
  `;
}

function renderProjectsView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 1.7rem; color: var(--neon-mint);">Projects Hub</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Development workspaces and SaaS project hubs</p>
      </div>
      <button class="btn-quick-add" onclick="window.openCreationModal('project')">+ New Project</button>
    </div>

    ${workspaceData.projects.length > 0 ? `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
        ${workspaceData.projects.map(p => `
          <div class="glass-panel" style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer;" onclick="window.openProjectDetails('${p.id}')">
            <div>
              <div style="font-family: var(--font-heading); font-weight: 800; font-size: 1.25rem; margin-bottom: 6px; color: #FFF;">${p.name}</div>
              <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">${p.description || 'No description provided'}</p>
              <div style="display: flex; gap: 10px; align-items: center;">
                <span class="badge-tag">${(p.status || 'In Progress').toUpperCase()}</span>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${p.task_count || 0} Connected Tasks</span>
              </div>
            </div>
            <button onclick="event.stopPropagation(); window.deleteItem('projects', '${p.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 1.1rem;" title="Delete Project">🗑️</button>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="glass-panel" style="padding: 48px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🚀</div>
        <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: #FFF;">No projects created yet</h3>
        <p style="color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">Manage personal software projects, research papers, and assignments.</p>
        <button class="btn-quick-add" onclick="window.openCreationModal('project')">+ Launch Your First Project</button>
      </div>
    `}
  `;
}

function renderCalendarView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 1.7rem; color: var(--neon-mint);">Calendar Events</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Schedule events, exams, and key milestones</p>
      </div>
      <button class="btn-quick-add" onclick="window.openCreationModal('calendar')">+ Add Event</button>
    </div>

    ${workspaceData.calendar.length > 0 ? `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        ${workspaceData.calendar.map(ev => `
          <div class="glass-card" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px; color: #FFF;">${ev.title}</div>
              <div style="font-size: 0.8rem; color: var(--neon-cyan); margin-bottom: 4px;">⏰ ${ev.start_time}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">📍 ${ev.location || 'Location TBD'}</div>
            </div>
            <button onclick="window.deleteItem('calendar', '${ev.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 1rem;" title="Delete Event">🗑️</button>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="glass-panel" style="padding: 48px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🗓️</div>
        <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: #FFF;">No calendar events</h3>
        <p style="color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">Keep track of exam dates, study sessions, and social events.</p>
        <button class="btn-quick-add" onclick="window.openCreationModal('calendar')">+ Add Your First Event</button>
      </div>
    `}
  `;
}

function renderRemindersView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 1.7rem; color: var(--neon-mint);">Reminders Matrix</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Notifications and timely workspace alerts</p>
      </div>
      <button class="btn-quick-add" onclick="window.openCreationModal('reminder')">+ Add Reminder</button>
    </div>

    ${workspaceData.reminders.length > 0 ? `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        ${workspaceData.reminders.map(r => `
          <div class="glass-card" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px; color: #FFF;">${r.title}</div>
              <div style="font-size: 0.8rem; color: var(--neon-amber);">🔔 ${r.remind_at || 'Set alert'}</div>
            </div>
            <button onclick="window.deleteItem('reminders', '${r.id}')" style="background: none; border: none; color: var(--neon-rose); cursor: pointer; font-size: 1rem;" title="Delete Reminder">🗑️</button>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="glass-panel" style="padding: 48px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🔔</div>
        <h3 style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: #FFF;">No reminders set</h3>
        <p style="color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">Set timely reminders so you never miss an assignment deadline.</p>
        <button class="btn-quick-add" onclick="window.openCreationModal('reminder')">+ Add Your First Reminder</button>
      </div>
    `}
  `;
}

async function renderSettingsView(container) {
  try {
    const res = await fetch('/api/v1/user/settings').then(r => r.json());
    const prof = res.profile;
    const appr = res.appearance;
    const notif = res.notifications;
    const work = res.workspace;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 1.7rem; color: var(--neon-mint);">Settings & Control Center</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Manage your account, security, appearance, notifications, and workspace data</p>
      </div>

      <div class="dashboard-grid">
        <!-- 1. PROFILE -->
        <div class="col-6">
          <div class="glass-panel">
            <h3 style="font-weight: 700; margin-bottom: 16px; color: #FFF; font-family: var(--font-heading);">1. Profile Settings</h3>
            <form id="profileForm" style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; font-family: var(--font-mono);">EMAIL ADDRESS (READONLY)</label>
                <input type="email" value="${prof.email}" readonly style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); padding: 10px; border-radius: var(--radius-sm); color: var(--text-muted); margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; font-family: var(--font-mono);">FULL NAME</label>
                <input type="text" id="settingFullName" value="${prof.full_name}" required style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 10px; border-radius: var(--radius-sm); color: #FFF; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; font-family: var(--font-mono);">MAJOR / FIELD OF STUDY</label>
                <input type="text" id="settingMajor" value="${prof.major_study}" required style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 10px; border-radius: var(--radius-sm); color: #FFF; margin-top: 4px;" />
              </div>
              <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Save Profile Changes</button>
            </form>
          </div>
        </div>

        <!-- 2. SECURITY -->
        <div class="col-6">
          <div class="glass-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-weight: 700; color: #FFF; font-family: var(--font-heading);">2. Security & Password</h3>
              <a href="/logout" class="badge-tag" style="background: rgba(255, 46, 147, 0.15); color: var(--neon-rose); text-decoration: none;">🚪 Logout</a>
            </div>
            <form id="passwordForm" style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; font-family: var(--font-mono);">CURRENT PASSWORD</label>
                <input type="password" id="oldPassword" required style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 10px; border-radius: var(--radius-sm); color: #FFF; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; font-family: var(--font-mono);">NEW PASSWORD</label>
                <input type="password" id="newPassword" required style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 10px; border-radius: var(--radius-sm); color: #FFF; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; font-family: var(--font-mono);">CONFIRM NEW PASSWORD</label>
                <input type="password" id="confirmPassword" required style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 10px; border-radius: var(--radius-sm); color: #FFF; margin-top: 4px;" />
              </div>
              <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%; background: rgba(0, 210, 255, 0.15); color: var(--neon-cyan); border: 1px solid var(--neon-cyan);">Update Password</button>
            </form>
          </div>
        </div>

        <!-- 3. APPEARANCE & 4. NOTIFICATIONS -->
        <div class="col-6">
          <div class="glass-panel" style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <h3 style="font-weight: 700; margin-bottom: 12px; color: #FFF; font-family: var(--font-heading);">3. Theme & Appearance</h3>
              <form id="appearanceForm" style="display: flex; gap: 12px; align-items: center;">
                <select id="themeSelect" style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 10px; border-radius: var(--radius-sm); color: #FFF;">
                  <option value="cyber-dark" ${appr.theme_preference === 'cyber-dark' ? 'selected' : ''}>Cyber-Aurora Obsidian (Default)</option>
                  <option value="deep-space" ${appr.theme_preference === 'deep-space' ? 'selected' : ''}>Deep Space Midnight</option>
                </select>
                <button type="submit" class="btn-quick-add" style="padding: 10px 16px; font-size: 0.82rem;">Save Theme</button>
              </form>
            </div>

            <div style="border-top: 1px solid var(--border-glass); padding-top: 16px;">
              <h3 style="font-weight: 700; margin-bottom: 12px; color: #FFF; font-family: var(--font-heading);">4. Notification Preferences</h3>
              <form id="notifForm" style="display: flex; flex-direction: column; gap: 10px;">
                <label style="display: flex; align-items: center; justify-content: space-between; color: #FFF; font-size: 0.9rem;">
                  <span>🔔 Reminder Notifications</span>
                  <input type="checkbox" id="notifReminders" ${notif.reminder_notifs ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--neon-mint);" />
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; color: #FFF; font-size: 0.9rem;">
                  <span>⏰ Task Deadline Notifications</span>
                  <input type="checkbox" id="notifTasks" ${notif.task_notifs ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--neon-mint);" />
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; color: #FFF; font-size: 0.9rem;">
                  <span>🗓️ Calendar Event Notifications</span>
                  <input type="checkbox" id="notifEvents" ${notif.event_notifs ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--neon-mint);" />
                </label>
                <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%; margin-top: 8px;">Save Preferences</button>
              </form>
            </div>
          </div>
        </div>

        <!-- 5. WORKSPACE STORAGE & 6. DATA PRIVACY -->
        <div class="col-6">
          <div class="glass-panel" style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <h3 style="font-weight: 700; margin-bottom: 8px; color: #FFF; font-family: var(--font-heading);">5. Calculated Workspace Storage</h3>
              <div style="font-size: 1.8rem; font-weight: 800; color: var(--neon-mint); font-family: var(--font-heading);">${work.total_mb} MB <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 400;">(${work.file_count} files)</span></div>
              <div style="display: flex; gap: 16px; margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary);">
                <span>📝 ${work.note_count} Notes</span>
                <span>✅ ${work.task_count} Tasks</span>
                <span>🚀 ${work.project_count} Projects</span>
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-glass); padding-top: 16px;">
              <h3 style="font-weight: 700; margin-bottom: 12px; color: #FFF; font-family: var(--font-heading);">6. Data & Privacy Control Center</h3>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="btn-quick-add" style="justify-content: center; background: rgba(0, 245, 160, 0.15); color: var(--neon-mint); border: 1px solid var(--neon-mint);" onclick="window.exportWorkspaceData()">📥 Export Workspace Data (JSON)</button>
                <button class="btn-quick-add" style="justify-content: center; background: rgba(255, 183, 3, 0.15); color: var(--neon-amber); border: 1px solid var(--neon-amber);" onclick="window.clearWorkspaceData()">⚠️ Clear All Workspace Data</button>
                <button class="btn-quick-add" style="justify-content: center; background: rgba(255, 46, 147, 0.15); color: var(--neon-rose); border: 1px solid var(--neon-rose);" onclick="window.deleteUserAccount()">🛑 Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('profileForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: document.getElementById('settingFullName').value, major_study: document.getElementById('settingMajor').value })
      });
      showToast('Profile updated successfully.');
    };

    document.getElementById('passwordForm').onsubmit = async (e) => {
      e.preventDefault();
      const oldPw = document.getElementById('oldPassword').value;
      const newPw = document.getElementById('newPassword').value;
      const confirmPw = document.getElementById('confirmPassword').value;

      if (newPw !== confirmPw) {
        alert('New password and confirmation do not match.');
        return;
      }

      const res = await fetch('/api/v1/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPw, new_password: newPw, confirm_password: confirmPw })
      });
      if (res.ok) {
        showToast('Password updated successfully.');
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } else {
        const err = await res.json();
        alert(err.error || 'Password update failed.');
      }
    };

    document.getElementById('appearanceForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/user/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_preference: document.getElementById('themeSelect').value })
      });
      showToast('Theme preference saved.');
    };

    document.getElementById('notifForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_notifs: document.getElementById('notifReminders').checked,
          task_notifs: document.getElementById('notifTasks').checked,
          event_notifs: document.getElementById('notifEvents').checked
        })
      });
      showToast('Notification preferences saved.');
    };

  } catch (err) {
    console.error(err);
  }
}

async function exportWorkspaceData() {
  try {
    const data = await fetch('/api/v1/user/export').then(r => r.json());
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unispace_backup_${Date.now()}.json`;
    a.click();
    showToast('Workspace data exported successfully.');
  } catch (err) {
    console.error(err);
  }
}

async function clearWorkspaceData() {
  if (!confirm('⚠️ WARNING: This will permanently delete all your files, notes, tasks, projects, timetable, bookmarks, and events from SQLite. Are you sure?')) return;
  try {
    await fetch('/api/v1/user/clear-data', { method: 'POST' });
    showToast('All workspace data has been cleared.');
    switchView('dashboard');
  } catch (err) {
    console.error(err);
  }
}

async function deleteUserAccount() {
  if (!confirm('🛑 CRITICAL: Are you sure you want to delete your entire account? All data will be destroyed.')) return;
  try {
    await fetch('/api/v1/user/account', { method: 'DELETE' });
    window.location.href = '/login';
  } catch (err) {
    console.error(err);
  }
}

// Quick Creation Modal Forms
function openCreationModal(type) {
  const modal = document.getElementById('quickAddModal');
  const grid = document.getElementById('quickAddGrid');
  if (!modal || !grid) return;

  grid.style.gridTemplateColumns = '1fr';

  if (type === 'note') {
    grid.innerHTML = `
      <form id="createNoteForm" style="display: flex; flex-direction: column; gap: 14px;">
        <h3 style="color: var(--neon-mint); font-family: var(--font-heading);">Create Note</h3>
        <input type="text" id="noteTitle" placeholder="Note Title..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none; font-size: 1rem;" />
        <textarea id="noteContent" placeholder="Write your note content here..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none; height: 120px; font-size: 0.95rem; resize: none;"></textarea>
        <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Create Note</button>
      </form>
    `;
    document.getElementById('createNoteForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: document.getElementById('noteTitle').value, content: document.getElementById('noteContent').value })
      });
      modal.classList.remove('active');
      showToast('Note created successfully!');
      switchView(activeView);
    };
  } else if (type === 'task') {
    grid.innerHTML = `
      <form id="createTaskForm" style="display: flex; flex-direction: column; gap: 14px;">
        <h3 style="color: var(--neon-mint); font-family: var(--font-heading);">Create Task</h3>
        <input type="text" id="taskTitle" placeholder="Task Title..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none; font-size: 1rem;" />
        <select id="taskPriority" style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;">
          <option value="high">High Priority</option>
          <option value="medium" selected>Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Create Task</button>
      </form>
    `;
    document.getElementById('createTaskForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: document.getElementById('taskTitle').value, priority: document.getElementById('taskPriority').value, status: 'todo' })
      });
      modal.classList.remove('active');
      showToast('Task created successfully!');
      switchView(activeView);
    };
  } else if (type === 'file') {
    const curFolder = workspaceData.folders.find(f => f.id === currentFolderId);
    grid.innerHTML = `
      <form id="uploadFileForm" style="display: flex; flex-direction: column; gap: 14px;">
        <h3 style="color: var(--neon-mint); font-family: var(--font-heading);">Upload File ${curFolder ? `to "${curFolder.name}"` : 'to Root'}</h3>
        <input type="file" id="fileInput" required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Upload File</button>
      </form>
    `;
    document.getElementById('uploadFileForm').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('file', document.getElementById('fileInput').files[0]);
      if (currentFolderId) {
        formData.append('folder_id', currentFolderId);
      }
      await fetch('/api/v1/files', { method: 'POST', body: formData });
      modal.classList.remove('active');
      showToast('File uploaded successfully!');
      switchView(activeView);
    };
  } else if (type === 'timetable') {
    grid.innerHTML = `
      <form id="createLectureForm" style="display: flex; flex-direction: column; gap: 14px;">
        <h3 style="color: var(--neon-mint); font-family: var(--font-heading);">Add Class Lecture</h3>
        <input type="text" id="lecSubject" placeholder="Subject / Class Name..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <input type="text" id="lecDay" placeholder="Day of Week (e.g. Monday)..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <input type="text" id="lecTime" placeholder="Time (e.g. 09:00 AM - 10:30 AM)..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Save Class</button>
      </form>
    `;
    document.getElementById('createLectureForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: document.getElementById('lecSubject').value, day_of_week: document.getElementById('lecDay').value, start_time: document.getElementById('lecTime').value, end_time: '' })
      });
      modal.classList.remove('active');
      showToast('Lecture scheduled successfully!');
      switchView(activeView);
    };
  } else if (type === 'bookmark') {
    grid.innerHTML = `
      <form id="createBookmarkForm" style="display: flex; flex-direction: column; gap: 14px;">
        <h3 style="color: var(--neon-mint); font-family: var(--font-heading);">Add Bookmark</h3>
        <input type="text" id="bmTitle" placeholder="Bookmark Title..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <input type="url" id="bmUrl" placeholder="https://..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Save Bookmark</button>
      </form>
    `;
    document.getElementById('createBookmarkForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: document.getElementById('bmTitle').value, url: document.getElementById('bmUrl').value })
      });
      modal.classList.remove('active');
      showToast('Bookmark saved successfully!');
      switchView(activeView);
    };
  } else if (type === 'project') {
    grid.innerHTML = `
      <form id="createProjectForm" style="display: flex; flex-direction: column; gap: 14px;">
        <h3 style="color: var(--neon-mint); font-family: var(--font-heading);">Create Project</h3>
        <input type="text" id="projName" placeholder="Project Name..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <input type="text" id="projDesc" placeholder="Description..." style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Launch Project</button>
      </form>
    `;
    document.getElementById('createProjectForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: document.getElementById('projName').value, description: document.getElementById('projDesc').value })
      });
      modal.classList.remove('active');
      showToast('Project created successfully!');
      switchView(activeView);
    };
  } else if (type === 'calendar') {
    grid.innerHTML = `
      <form id="createCalForm" style="display: flex; flex-direction: column; gap: 14px;">
        <h3 style="color: var(--neon-mint); font-family: var(--font-heading);">Add Calendar Event</h3>
        <input type="text" id="calTitle" placeholder="Event Title..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <input type="text" id="calTime" placeholder="Event Time (e.g. Tomorrow 3:00 PM)..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Save Event</button>
      </form>
    `;
    document.getElementById('createCalForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: document.getElementById('calTitle').value, start_time: document.getElementById('calTime').value })
      });
      modal.classList.remove('active');
      showToast('Event saved successfully!');
      switchView(activeView);
    };
  } else if (type === 'reminder') {
    grid.innerHTML = `
      <form id="createRemForm" style="display: flex; flex-direction: column; gap: 14px;">
        <h3 style="color: var(--neon-mint); font-family: var(--font-heading);">Add Reminder</h3>
        <input type="text" id="remTitle" placeholder="Reminder Title..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <input type="text" id="remTime" placeholder="Alert Time (e.g. 5:00 PM)..." required style="background: var(--bg-surface); border: 1px solid var(--border-glass); padding: 12px; border-radius: var(--radius-sm); color: #FFF; outline: none;" />
        <button type="submit" class="btn-quick-add" style="justify-content: center; width: 100%;">Save Reminder</button>
      </form>
    `;
    document.getElementById('createRemForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch('/api/v1/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: document.getElementById('remTitle').value, remind_at: document.getElementById('remTime').value })
      });
      modal.classList.remove('active');
      showToast('Reminder saved successfully!');
      switchView(activeView);
    };
  }

  modal.classList.add('active');
}

function setupQuickAddModal() {
  const btn = document.getElementById('quickAddBtn');
  const modal = document.getElementById('quickAddModal');
  const close = document.getElementById('closeQuickAdd');
  const grid = document.getElementById('quickAddGrid');
  if (!btn || !modal) return;

  const options = [
    { label: 'New Note', type: 'note', color: '#00F5A0', icon: '📝' },
    { label: 'Upload File', type: 'file', color: '#00D2FF', icon: '📁' },
    { label: 'New Task', type: 'task', color: '#10B981', icon: '✅' },
    { label: 'New Lecture', type: 'timetable', color: '#FFB703', icon: '📅' },
    { label: 'New Bookmark', type: 'bookmark', color: '#FF2E93', icon: '🔖' },
    { label: 'New Project', type: 'project', color: '#7B2CBF', icon: '🚀' }
  ];

  btn.addEventListener('click', () => {
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.innerHTML = options.map(opt => `
      <div class="quick-option-card" onclick="window.openCreationModal('${opt.type}')">
        <div class="quick-option-icon" style="background: ${opt.color}; font-size: 1.3rem;">${opt.icon}</div>
        <span style="font-weight: 700; font-size: 0.85rem;">${opt.label}</span>
      </div>
    `).join('');
    modal.classList.add('active');
  });

  close.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

function setupGlobalSearch() {
  const btn = document.getElementById('globalSearchBtn');
  const modal = document.getElementById('searchModal');
  const close = document.getElementById('closeSearchModal');
  const input = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');
  if (!btn || !modal) return;

  btn.addEventListener('click', () => {
    modal.classList.add('active');
    input.focus();
  });

  if (close) close.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  input.addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    if (!q) {
      resultsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; padding: 20px 0; text-align: center;">Start typing to search notes, tasks, files, projects, bookmarks, events...</p>';
      return;
    }
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`).then(r => r.json());
      const notes = res.results.notes || [];
      const tasks = res.results.tasks || [];
      const files = res.results.files || [];
      const projects = res.results.projects || [];
      const bookmarks = res.results.bookmarks || [];
      const events = res.results.events || [];

      if (notes.length === 0 && tasks.length === 0 && files.length === 0 && projects.length === 0 && bookmarks.length === 0 && events.length === 0) {
        resultsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; padding: 20px 0; text-align: center;">No matching results found.</p>';
        return;
      }

      resultsContainer.innerHTML = `
        <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          ${notes.map(n => `<div class="glass-card" style="padding: 10px; cursor: pointer;" onclick="window.switchView('notes'); document.getElementById('searchModal').classList.remove('active');">📝 <b>Note:</b> ${n.title}</div>`).join('')}
          ${tasks.map(t => `<div class="glass-card" style="padding: 10px; cursor: pointer;" onclick="window.switchView('tasks'); document.getElementById('searchModal').classList.remove('active');">✅ <b>Task:</b> ${t.title}</div>`).join('')}
          ${files.map(f => `<div class="glass-card" style="padding: 10px; cursor: pointer;" onclick="window.previewFile('${f.id}'); document.getElementById('searchModal').classList.remove('active');">📁 <b>File:</b> ${f.title}</div>`).join('')}
          ${projects.map(p => `<div class="glass-card" style="padding: 10px; cursor: pointer;" onclick="window.openProjectDetails('${p.id}'); document.getElementById('searchModal').classList.remove('active');">🚀 <b>Project:</b> ${p.title}</div>`).join('')}
          ${bookmarks.map(b => `<div class="glass-card" style="padding: 10px;">🔖 <b>Bookmark:</b> ${b.title}</div>`).join('')}
          ${events.map(ev => `<div class="glass-card" style="padding: 10px;">🗓️ <b>Event:</b> ${ev.title}</div>`).join('')}
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      modal.classList.add('active');
      input.focus();
    }
    if (e.key === 'Escape') modal.classList.remove('active');
  });
}

function initAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const numParticles = Math.floor((width * height) / 22000);

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.6 + 0.5,
      color: Math.random() > 0.5 ? '#00F5A0' : '#00D2FF'
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.35;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = '#00F5A0';
          ctx.globalAlpha = (1 - dist / 100) * 0.12;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

function setupCardTiltEffect() {
  document.querySelectorAll('.glass-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `perspective(1000px) rotateX(${-y / 18}deg) rotateY(${x / 18}deg) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  window.switchView = switchView;
  window.deleteItem = deleteItem;
  window.renameFile = renameFile;
  window.moveFile = moveFile;
  window.renameFolder = renameFolder;
  window.createFolder = createFolder;
  window.openFolder = openFolder;
  window.previewFile = previewFile;
  window.toggleTaskStatus = toggleTaskStatus;
  window.openCreationModal = openCreationModal;
  window.openProjectDetails = openProjectDetails;
  window.selectNote = selectNote;
  window.updateNoteContent = updateNoteContent;
  window.togglePinNote = togglePinNote;
  window.setTaskViewMode = setTaskViewMode;
  window.setDriveSort = setDriveSort;
  renderSidebarNav();
  switchView('dashboard');
  setupQuickAddModal();
  setupGlobalSearch();
  initAmbientCanvas();
});
