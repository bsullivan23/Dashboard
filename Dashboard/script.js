// Default empty arrays
let panels = JSON.parse(localStorage.getItem('dashboard_panels')) || [];
let categories = JSON.parse(localStorage.getItem('dashboard_categories')) || [];
let links = JSON.parse(localStorage.getItem('dashboard_links')) || [];
let currentPanelId = localStorage.getItem('dashboard_current_panel') || null;

// Drag globals
let draggedItem = null;
let dragType = null;

// Theme globals
let currentTheme = localStorage.getItem('dashboard_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

// DOM Elements
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const panelTabsEl = document.getElementById('panel-tabs');
const dashboardContent = document.getElementById('dashboard-content');
const fab = document.getElementById('fab');
const actionMenu = document.getElementById('action-menu');
const modalOverlay = document.getElementById('modal-overlay');

// Theme Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIconMoon = document.getElementById('theme-icon-moon');
const themeIconSun = document.getElementById('theme-icon-sun');

// Modals
const linkModal = document.getElementById('link-modal');
const categoryModal = document.getElementById('category-modal');
const panelModal = document.getElementById('panel-modal');

const linkForm = document.getElementById('link-form');
const categoryForm = document.getElementById('category-form');
const panelForm = document.getElementById('panel-form');

const linkCategorySelect = document.getElementById('link-category');

// Initialization
function init() {
    applyTheme(currentTheme);
    updateClock();
    setInterval(updateClock, 1000);

    // Migration: If we have categories but no panels, create a default panel
    if (panels.length === 0) {
        if (categories.length > 0) {
            const defaultPanelId = generateId();
            panels.push({ id: defaultPanelId, name: 'Main' });
            categories.forEach(c => {
                if (!c.panelId) c.panelId = defaultPanelId;
            });
            currentPanelId = defaultPanelId;
            saveData();
        } else {
            // First time setup with panels
            const workPanelId = generateId();
            const personalPanelId = generateId();

            panels.push({ id: workPanelId, name: 'Work' });
            panels.push({ id: personalPanelId, name: 'Personal' });

            categories.push({ id: generateId(), name: 'Projects', panelId: workPanelId });
            categories.push({ id: generateId(), name: 'Favorites', panelId: personalPanelId });

            currentPanelId = workPanelId;

            saveData();
        }
    }

    if (!currentPanelId || !panels.find(p => p.id === currentPanelId)) {
        currentPanelId = panels[0] ? panels[0].id : null;
    }

    renderPanels();
    renderDashboard();
    setupEventListeners();
}

// Clock & Date
function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

// Render Panels
function renderPanels() {
    panelTabsEl.innerHTML = '';

    panels.forEach(panel => {
        const btn = document.createElement('button');
        btn.className = `panel-tab ${panel.id === currentPanelId ? 'active' : ''}`;
        btn.dataset.id = panel.id;

        btn.innerHTML = `
            ${escapeHTML(panel.name)}
            <button class="icon-btn edit-panel-btn" data-id="${panel.id}" title="Edit Panel" aria-label="Edit Panel">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="icon-btn danger delete-panel-btn" data-id="${panel.id}" title="Delete Panel" aria-label="Delete Panel">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;

        btn.addEventListener('click', (e) => {
            if (e.target.closest('.icon-btn')) return; // Ignore if clicking action buttons inside tab
            currentPanelId = panel.id;
            localStorage.setItem('dashboard_current_panel', currentPanelId);
            renderPanels();
            renderDashboard();
        });

        panelTabsEl.appendChild(btn);
    });
}

// Render Dashboard
function renderDashboard() {
    dashboardContent.innerHTML = '';

    if (panels.length === 0) {
        dashboardContent.innerHTML = `
            <div class="empty-state">
                <h3>No Panels</h3>
                <p>Click the + button below to create your first panel.</p>
            </div>
        `;
        return;
    }

    const panelCategories = categories.filter(c => c.panelId === currentPanelId);

    if (panelCategories.length === 0) {
        dashboardContent.innerHTML = `
            <div class="empty-state">
                <h3>Welcome to this Panel</h3>
                <p>Click the + button below to create your first category and add some links.</p>
            </div>
        `;
        return;
    }

    panelCategories.forEach(category => {
        const catLinks = links.filter(link => link.categoryId === category.id);

        const catEl = document.createElement('div');
        catEl.className = 'category';
        catEl.dataset.id = category.id;

        catEl.innerHTML = `
            <div class="category-header">
                <div style="display: flex; align-items: center;">
                    <div class="drag-handle cat-handle" aria-label="Drag category">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                    </div>
                    <div class="category-title">${escapeHTML(category.name)}</div>
                </div>
                <div class="category-actions">
                    <button class="icon-btn edit-cat-btn" data-id="${category.id}" title="Edit Category" aria-label="Edit Category">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="icon-btn danger delete-cat-btn" data-id="${category.id}" title="Delete Category" aria-label="Delete Category">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
            <div class="links-list"></div>
        `;

        const linksList = catEl.querySelector('.links-list');

        if (catLinks.length === 0) {
            linksList.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin-top: 4px; display: block; padding-bottom: 20px;">No links in this category. Select a link to drag here!</span>';
        }

        catLinks.forEach(link => {
            const domain = extractDomain(link.url);
            const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

            const linkEl = document.createElement('a');
            linkEl.className = 'link-item';
            linkEl.href = link.url;
            linkEl.dataset.id = link.id;

            linkEl.innerHTML = `
                <div class="link-info">
                    <div class="drag-handle link-handle" aria-label="Drag link">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                    </div>
                    <div class="link-icon">
                        <img src="${iconUrl}" alt="" onerror="this.style.display='none'; this.parentElement.innerText='${escapeHTML(link.name).charAt(0)}'">
                    </div>
                    <div class="link-text">
                        <span class="link-name">${escapeHTML(link.name)}</span>
                        ${link.description ? `<span class="link-desc">${escapeHTML(link.description)}</span>` : ''}
                    </div>
                </div>
                <div class="link-actions">
                    <button class="icon-btn edit-link-btn" data-id="${link.id}" title="Edit Link" aria-label="Edit Link">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="icon-btn danger delete-link-btn" data-id="${link.id}" title="Delete Link" aria-label="Delete Link">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;

            // Prevent link from opening when clicking action buttons
            linkEl.querySelector('.link-actions').addEventListener('click', (e) => {
                e.preventDefault();
            });

            // Prevent link from opening when clicking drag handle
            linkEl.querySelector('.drag-handle').addEventListener('click', (e) => {
                e.preventDefault();
            });

            linksList.appendChild(linkEl);
        });

        dashboardContent.appendChild(catEl);
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // FAB Toggle
    fab.addEventListener('click', (e) => {
        e.stopPropagation();
        actionMenu.classList.toggle('active');
        const rect = fab.getBoundingClientRect();
        actionMenu.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        actionMenu.style.right = '40px';
    });

    // Close Action Menu when clicking outside
    document.addEventListener('click', () => {
        actionMenu.classList.remove('active');
    });

    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
        localStorage.setItem('dashboard_theme', currentTheme);
    });

    // Add Link Button
    document.getElementById('btn-add-link').addEventListener('click', () => {
        const panelCategories = categories.filter(c => c.panelId === currentPanelId);
        if (panelCategories.length === 0) {
            alert('Please create a category first!');
            return;
        }
        openModal('link');
    });

    // Add Category Button
    document.getElementById('btn-add-category').addEventListener('click', () => {
        if (!currentPanelId) {
            alert('Please create a panel first!');
            return;
        }
        openModal('category');
    });

    // Add Panel Button
    document.getElementById('btn-add-panel').addEventListener('click', () => {
        openModal('panel');
    });

    // General Modal Close bindings
    document.querySelectorAll('.cancel-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    modalOverlay.addEventListener('click', closeModal);

    // Form submissions
    linkForm.addEventListener('submit', handleLinkSubmit);
    categoryForm.addEventListener('submit', handleCategorySubmit);
    panelForm.addEventListener('submit', handlePanelSubmit);

    // Auto-fill Link Name based on URL domain
    document.getElementById('link-url').addEventListener('blur', (e) => {
        const urlStr = e.target.value.trim();
        const nameInput = document.getElementById('link-name');

        if (urlStr && !nameInput.value) {
            let hostname = extractDomain(urlStr);
            if (hostname) {
                let siteName = hostname.split('.')[0];
                nameInput.value = siteName.charAt(0).toUpperCase() + siteName.slice(1);
            }
        }
    });

    // Panel hover actions delegates (Edit / Delete)
    panelTabsEl.addEventListener('click', (e) => {
        const editPanelBtn = e.target.closest('.edit-panel-btn');
        const deletePanelBtn = e.target.closest('.delete-panel-btn');

        if (editPanelBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = editPanelBtn.dataset.id;
            const panel = panels.find(p => p.id === id);
            if (panel) openModal('panel', panel);
        } else if (deletePanelBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = deletePanelBtn.dataset.id;
            const panelCats = categories.filter(c => c.panelId === id);
            let msg = 'Are you sure you want to delete this panel?';
            if (panelCats.length > 0) {
                msg += `\nIt contains ${panelCats.length} category(ies) which will also be deleted.`;
            }
            if (confirm(msg)) {
                panels = panels.filter(p => p.id !== id);
                categories = categories.filter(c => c.panelId !== id);
                const remainingCatIds = new Set(categories.map(c => c.id));
                links = links.filter(l => remainingCatIds.has(l.categoryId));

                if (currentPanelId === id) {
                    currentPanelId = panels.length > 0 ? panels[0].id : null;
                    localStorage.setItem('dashboard_current_panel', currentPanelId || '');
                }

                saveData();
                renderPanels();
                renderDashboard();
            }
        }
    });

    // Delegate hover actions clicks (Edit / Delete) dashboard elements
    dashboardContent.addEventListener('click', (e) => {
        const editLinkBtn = e.target.closest('.edit-link-btn');
        const deleteLinkBtn = e.target.closest('.delete-link-btn');
        const editCatBtn = e.target.closest('.edit-cat-btn');
        const deleteCatBtn = e.target.closest('.delete-cat-btn');

        if (editLinkBtn) {
            e.preventDefault();
            const id = editLinkBtn.dataset.id;
            const link = links.find(l => l.id === id);
            if (link) openModal('link', link);
        } else if (deleteLinkBtn) {
            e.preventDefault();
            const id = deleteLinkBtn.dataset.id;
            if (confirm('Are you sure you want to delete this link?')) {
                links = links.filter(l => l.id !== id);
                saveData();
                renderDashboard();
            }
        } else if (editCatBtn) {
            e.preventDefault();
            const id = editCatBtn.dataset.id;
            const category = categories.find(c => c.id === id);
            if (category) openModal('category', category);
        } else if (deleteCatBtn) {
            e.preventDefault();
            const id = deleteCatBtn.dataset.id;
            const catLinks = links.filter(l => l.categoryId === id);
            let msg = 'Are you sure you want to delete this category?';
            if (catLinks.length > 0) {
                msg += `\nIt contains ${catLinks.length} link(s) which will also be deleted.`;
            }
            if (confirm(msg)) {
                categories = categories.filter(c => c.id !== id);
                links = links.filter(l => l.categoryId !== id);
                saveData();
                renderDashboard();
            }
        }
    });

    /* --- HTML5 DRAG & DROP LOGIC --- */

    // Limit draggable attribute specifically to grab moments
    dashboardContent.addEventListener('mousedown', (e) => {
        const handle = e.target.closest('.drag-handle');
        if (handle) {
            const el = handle.classList.contains('cat-handle') ? handle.closest('.category') : handle.closest('.link-item');
            if (el) el.setAttribute('draggable', 'true');
        }
    });

    dashboardContent.addEventListener('mouseup', () => {
        document.querySelectorAll('[draggable="true"]').forEach(el => el.removeAttribute('draggable'));
    });

    dashboardContent.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('category')) {
            draggedItem = e.target;
            dragType = 'category';
            setTimeout(() => e.target.classList.add('dragging'), 0);
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        } else if (e.target.classList.contains('link-item')) {
            draggedItem = e.target;
            dragType = 'link';
            setTimeout(() => e.target.classList.add('dragging'), 0);
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        }
    });

    dashboardContent.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem.removeAttribute('draggable');
            draggedItem = null;
            dragType = null;
        }
        document.querySelectorAll('.drag-over, .drag-over-link').forEach(el => {
            el.classList.remove('drag-over', 'drag-over-link');
        });
    });

    dashboardContent.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

        document.querySelectorAll('.drag-over, .drag-over-link').forEach(el => {
            el.classList.remove('drag-over', 'drag-over-link');
        });

        if (dragType === 'category') {
            const overCat = e.target.closest('.category');
            if (overCat && overCat !== draggedItem) {
                overCat.classList.add('drag-over');
            }
        } else if (dragType === 'link') {
            const overLink = e.target.closest('.link-item');
            const overCat = e.target.closest('.category');
            if (overLink && overLink !== draggedItem) {
                overLink.classList.add('drag-over-link');
            } else if (overCat) {
                overCat.classList.add('drag-over');
            }
        }
    });

    dashboardContent.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        if (dragType === 'category') {
            const dropTarget = e.target.closest('.category');
            if (dropTarget && dropTarget !== draggedItem) {
                const draggedId = draggedItem.dataset.id;
                const targetId = dropTarget.dataset.id;

                const draggedIdx = categories.findIndex(c => c.id === draggedId);
                const [removed] = categories.splice(draggedIdx, 1);

                const targetIdx = categories.findIndex(c => c.id === targetId);
                categories.splice(targetIdx, 0, removed);

                saveData();
                renderDashboard();
            }
        } else if (dragType === 'link') {
            const dropLink = e.target.closest('.link-item');
            const dropCat = e.target.closest('.category');

            const draggedId = draggedItem.dataset.id;
            const draggedIdx = links.findIndex(l => l.id === draggedId);
            const [removedLink] = links.splice(draggedIdx, 1);

            if (dropLink && dropLink !== draggedItem) {
                const targetId = dropLink.dataset.id;
                const targetLink = links.find(l => l.id === targetId);
                removedLink.categoryId = targetLink.categoryId;

                const newTargetIdx = links.findIndex(l => l.id === targetId);
                links.splice(newTargetIdx, 0, removedLink);
            } else if (dropCat) {
                const targetCatId = dropCat.dataset.id;
                removedLink.categoryId = targetCatId;
                links.push(removedLink);
            } else {
                links.splice(draggedIdx, 0, removedLink); // Revert
            }

            saveData();
            renderDashboard();
        }
    });
}

// Handlers
function handleLinkSubmit(e) {
    e.preventDefault();

    let url = document.getElementById('link-url').value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const name = document.getElementById('link-name').value.trim();
    const description = document.getElementById('link-description').value.trim();
    const categoryId = document.getElementById('link-category').value;
    const id = document.getElementById('link-id').value;

    if (id) {
        const index = links.findIndex(l => l.id === id);
        if (index !== -1) {
            links[index] = { id, name, description, url, categoryId };
        }
    } else {
        links.push({ id: generateId(), name, description, url, categoryId });
    }

    saveData();
    closeModal();
    renderDashboard();
}

function handleCategorySubmit(e) {
    e.preventDefault();

    const name = document.getElementById('category-name').value.trim();
    const id = document.getElementById('category-id').value;

    if (id) {
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index].name = name;
        }
    } else {
        categories.push({ id: generateId(), name, panelId: currentPanelId });
    }

    saveData();
    closeModal();
    renderDashboard();
}

function handlePanelSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('panel-name').value.trim();
    const id = document.getElementById('panel-id').value;

    if (id) {
        const index = panels.findIndex(p => p.id === id);
        if (index !== -1) {
            panels[index].name = name;
        }
    } else {
        const newPanelId = generateId();
        panels.push({ id: newPanelId, name });
        currentPanelId = newPanelId; // Switch to the newly created panel
        localStorage.setItem('dashboard_current_panel', currentPanelId);
    }

    saveData();
    closeModal();
    renderPanels();
    renderDashboard();
}

// Modals
function openModal(type, data = null) {
    closeModal();

    modalOverlay.classList.add('active');

    if (type === 'link') {
        updateCategorySelect();

        linkModal.classList.add('active');
        linkForm.reset();

        if (data) {
            document.getElementById('link-modal-title').textContent = 'Edit Link';
            document.getElementById('link-id').value = data.id;
            document.getElementById('link-url').value = data.url;
            document.getElementById('link-name').value = data.name;
            document.getElementById('link-description').value = data.description || '';
            document.getElementById('link-category').value = data.categoryId;
        } else {
            document.getElementById('link-modal-title').textContent = 'Add Link';
            document.getElementById('link-id').value = '';
            document.getElementById('link-description').value = '';
            const panelCategories = categories.filter(c => c.panelId === currentPanelId);
            if (panelCategories.length > 0) {
                document.getElementById('link-category').value = panelCategories[0].id;
            }
        }

        setTimeout(() => document.getElementById('link-url').focus(), 100);
    } else if (type === 'category') {
        categoryModal.classList.add('active');
        categoryForm.reset();

        if (data) {
            document.getElementById('category-modal-title').textContent = 'Edit Category';
            document.getElementById('category-id').value = data.id;
            document.getElementById('category-name').value = data.name;
        } else {
            document.getElementById('category-modal-title').textContent = 'Add Category';
            document.getElementById('category-id').value = '';
        }

        setTimeout(() => document.getElementById('category-name').focus(), 100);
    } else if (type === 'panel') {
        panelModal.classList.add('active');
        panelForm.reset();

        if (data) {
            document.getElementById('panel-modal-title').textContent = 'Edit Panel';
            document.getElementById('panel-id').value = data.id;
            document.getElementById('panel-name').value = data.name;
        } else {
            document.getElementById('panel-modal-title').textContent = 'Add Panel';
            document.getElementById('panel-id').value = '';
        }

        setTimeout(() => document.getElementById('panel-name').focus(), 100);
    }
}

function closeModal() {
    modalOverlay.classList.remove('active');
    linkModal.classList.remove('active');
    categoryModal.classList.remove('active');
    panelModal.classList.remove('active');
}

function updateCategorySelect() {
    linkCategorySelect.innerHTML = '';
    const panelCategories = categories.filter(c => c.panelId === currentPanelId);
    panelCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        linkCategorySelect.appendChild(option);
    });
}

// Helpers
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function saveData() {
    localStorage.setItem('dashboard_panels', JSON.stringify(panels));
    localStorage.setItem('dashboard_categories', JSON.stringify(categories));
    localStorage.setItem('dashboard_links', JSON.stringify(links));
}

function extractDomain(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch (e) {
        return '';
    }
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIconMoon.style.display = 'none';
        themeIconSun.style.display = 'block';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIconMoon.style.display = 'block';
        themeIconSun.style.display = 'none';
    }
}

// Start
init();
