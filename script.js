(function () {
    const STORAGE_KEY = 'ai-toolbox-data';

    let toolboxData = loadData();
    let activeCategory = 'ai';
    let searchQuery = '';

    const tabsEl = document.getElementById('category-tabs');
    const mainEl = document.getElementById('main-content');
    const searchEl = document.getElementById('search-input');

    const detailModal = document.getElementById('detail-modal');
    const detailForm = document.getElementById('detail-form');
    const addModal = document.getElementById('add-modal');
    const addForm = document.getElementById('add-form');

    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (_) { /* use default */ }
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toolboxData));
    }

    function findItemById(id) {
        for (const cat of toolboxData.categories) {
            if (cat.subcategories) {
                for (const sub of cat.subcategories) {
                    const item = sub.items.find(i => i.id === id);
                    if (item) return { item, cat, subcategory: sub.name };
                }
            } else if (cat.items) {
                const item = cat.items.find(i => i.id === id);
                if (item) return { item, cat, subcategory: null };
            }
        }
        return null;
    }

    function getAllItems() {
        const items = [];
        toolboxData.categories.forEach(cat => {
            if (cat.subcategories) {
                cat.subcategories.forEach(sub => {
                    sub.items.forEach(item => {
                        items.push({ ...item, category: cat, subcategory: sub.name });
                    });
                });
            } else if (cat.items) {
                cat.items.forEach(item => {
                    items.push({ ...item, category: cat, subcategory: null });
                });
            }
        });
        return items;
    }

    function matchesSearch(item, query) {
        if (!query) return true;
        const q = query.toLowerCase();
        const fields = [
            item.name,
            item.url,
            item.note || '',
            ...(item.tags || []),
            item.subcategory || '',
            item.category.name
        ].join(' ').toLowerCase();
        return fields.includes(q);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderTabs() {
        tabsEl.innerHTML = toolboxData.categories.map(cat => `
            <button class="tab-btn ${cat.id === activeCategory ? 'active' : ''}"
                    data-id="${cat.id}">
                ${cat.icon} ${cat.name}
            </button>
        `).join('');

        tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeCategory = btn.dataset.id;
                renderTabs();
                renderContent();
            });
        });
    }

    function renderCard(item) {
        const tagsHtml = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
        const noteHtml = item.note ? `<p class="card-note">${escapeHtml(item.note)}</p>` : '';
        const hasUrl = item.url && item.url.trim() !== '';

        return `
            <button type="button" class="card ${hasUrl ? '' : 'no-link'}" data-id="${item.id}">
                <div class="card-header">
                    <span class="card-name">${escapeHtml(item.name)}</span>
                    <span class="card-arrow">›</span>
                </div>
                ${noteHtml}
                ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
            </button>
        `;
    }

    function renderContent() {
        const allItems = getAllItems();
        let filtered = allItems.filter(item =>
            item.category.id === activeCategory && matchesSearch(item, searchQuery)
        );

        if (filtered.length === 0) {
            mainEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>找不到符合的工具</p>
                    <button type="button" class="btn btn-primary" id="empty-add">＋ 新增第一個工具</button>
                </div>
            `;
            document.getElementById('empty-add')?.addEventListener('click', openAddModal);
            return;
        }

        const cat = toolboxData.categories.find(c => c.id === activeCategory);
        let html = `<p class="stats-bar">共 ${filtered.length} 個項目</p>`;

        if (cat.subcategories) {
            cat.subcategories.forEach(sub => {
                const subItems = filtered.filter(i => i.subcategory === sub.name);
                if (subItems.length === 0) return;
                html += `<h3 class="subsection-title">${escapeHtml(sub.name)}</h3>`;
                html += `<div class="cards-grid">${subItems.map(renderCard).join('')}</div>`;
            });
        } else {
            html += `<div class="cards-grid">${filtered.map(renderCard).join('')}</div>`;
        }

        mainEl.innerHTML = html;

        mainEl.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => openDetailModal(card.dataset.id));
        });
    }

    function openModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function updateVisitButton() {
        const url = document.getElementById('detail-url').value.trim();
        const visitBtn = document.getElementById('detail-visit');
        if (url) {
            visitBtn.href = url;
            visitBtn.classList.remove('hidden');
        } else {
            visitBtn.classList.add('hidden');
        }
    }

    function openDetailModal(id) {
        const found = findItemById(id);
        if (!found) return;

        const { item, cat, subcategory } = found;

        document.getElementById('detail-id').value = item.id;
        document.getElementById('detail-category-id').value = cat.id;
        document.getElementById('detail-subcategory').value = subcategory || '';
        document.getElementById('detail-name').value = item.name;
        document.getElementById('detail-url').value = item.url || '';
        document.getElementById('detail-tags').value = (item.tags || []).join(', ');
        document.getElementById('detail-note').value = item.note || '';

        document.getElementById('detail-delete').classList.toggle('hidden', !item.id.startsWith('custom-'));
        updateVisitButton();
        openModal(detailModal);
    }

    function openAddModal() {
        addForm.reset();
        populateAddCategorySelect();
        updateSubcategoryField();
        openModal(addModal);
    }

    function populateAddCategorySelect() {
        const select = document.getElementById('add-category');
        select.innerHTML = toolboxData.categories.map(cat =>
            `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
        ).join('');
        if (activeCategory) select.value = activeCategory;
    }

    function updateSubcategoryField() {
        const catId = document.getElementById('add-category').value;
        const cat = toolboxData.categories.find(c => c.id === catId);
        const field = document.getElementById('add-subcategory-field');
        const select = document.getElementById('add-subcategory');

        if (cat && cat.subcategories) {
            field.classList.remove('hidden');
            select.innerHTML = cat.subcategories.map(sub =>
                `<option value="${escapeHtml(sub.name)}">${escapeHtml(sub.name)}</option>`
            ).join('');
        } else {
            field.classList.add('hidden');
            select.innerHTML = '';
        }
    }

    function parseTags(str) {
        return str.split(/[,，]/).map(t => t.trim()).filter(Boolean);
    }

    function generateId() {
        return 'custom-' + Date.now();
    }

    detailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('detail-id').value;
        const found = findItemById(id);
        if (!found) return;

        found.item.name = document.getElementById('detail-name').value.trim();
        found.item.url = document.getElementById('detail-url').value.trim();
        found.item.tags = parseTags(document.getElementById('detail-tags').value);
        found.item.note = document.getElementById('detail-note').value.trim();

        saveData();
        closeModal(detailModal);
        renderContent();
    });

    document.getElementById('detail-url').addEventListener('input', updateVisitButton);

    document.getElementById('detail-delete').addEventListener('click', () => {
        const id = document.getElementById('detail-id').value;
        if (!id.startsWith('custom-')) return;
        if (!confirm('確定要刪除此工具嗎？')) return;

        const found = findItemById(id);
        if (!found) return;

        const { cat, subcategory } = found;
        if (cat.subcategories) {
            const sub = cat.subcategories.find(s => s.name === subcategory);
            if (sub) sub.items = sub.items.filter(i => i.id !== id);
        } else if (cat.items) {
            cat.items = cat.items.filter(i => i.id !== id);
        }

        saveData();
        closeModal(detailModal);
        renderContent();
    });

    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const catId = document.getElementById('add-category').value;
        const cat = toolboxData.categories.find(c => c.id === catId);
        if (!cat) return;

        const newItem = {
            id: generateId(),
            name: document.getElementById('add-name').value.trim(),
            url: document.getElementById('add-url').value.trim(),
            tags: parseTags(document.getElementById('add-tags').value),
            note: document.getElementById('add-note').value.trim()
        };

        if (cat.subcategories) {
            const subName = document.getElementById('add-subcategory').value;
            const sub = cat.subcategories.find(s => s.name === subName);
            if (sub) sub.items.push(newItem);
        } else {
            cat.items.push(newItem);
        }

        saveData();
        activeCategory = catId;
        closeModal(addModal);
        renderTabs();
        renderContent();
    });

    document.getElementById('add-category').addEventListener('change', updateSubcategoryField);

    document.getElementById('btn-add').addEventListener('click', openAddModal);
    document.getElementById('detail-close').addEventListener('click', () => closeModal(detailModal));
    document.getElementById('detail-cancel').addEventListener('click', () => closeModal(detailModal));
    document.getElementById('add-close').addEventListener('click', () => closeModal(addModal));
    document.getElementById('add-cancel').addEventListener('click', () => closeModal(addModal));

    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeModal(detailModal);
    });
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) closeModal(addModal);
    });

    searchEl.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderContent();
    });

    renderTabs();
    renderContent();
})();
