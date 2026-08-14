(() => {
    const STORAGE_KEY = 'ai-toolbox-data';
    const FAVORITES_KEY = 'ai-toolbox-favorites';
    const RECENT_KEY = 'ai-toolbox-recent';
    const DELETE_PASSWORD_FALLBACK = '請在 supabase-config.js 設定刪除密碼';
    const ADMIN_DELETE_PASSWORD = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.deletePassword) || DELETE_PASSWORD_FALLBACK;
    let toolboxData = null, activeCategory = 'ai', activeView = 'category', searchQuery = '', pendingDeleteId = null, undoSnapshot = null, undoTimer = null, syncTimer = null, isSaving = false;
    const $ = id => document.getElementById(id);
    const tabsEl = $('category-tabs'), viewTabsEl = $('view-tabs'), mainEl = $('main-content'), searchEl = $('search-input'), statusEl = $('storage-status');
    const detailModal = $('detail-modal'), detailForm = $('detail-form'), addModal = $('add-modal'), addForm = $('add-form'), passwordModal = $('password-modal');

    function setStatus(text, isError = false) { if (statusEl) { statusEl.textContent = text; statusEl.style.color = isError ? '#b42318' : ''; } }
    function readList(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; } }
    function writeList(key, list) { localStorage.setItem(key, JSON.stringify([...new Set(list)])); }
    function favorites() { return readList(FAVORITES_KEY); }
    function recent() { return readList(RECENT_KEY); }
    function isFavorite(id) { return favorites().includes(id); }
    function escapeHtml(value) { const div = document.createElement('div'); div.textContent = String(value ?? ''); return div.innerHTML; }
    function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
    function localData() { try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) return JSON.parse(saved); } catch (_) {} return deepCopy(DEFAULT_DATA); }
    function supabaseEndpoint() { return `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`; }

    function dataSignature(data) { try { return JSON.stringify(data); } catch (_) { return ''; } }
    async function loadData() {
        const fallback = localData();
        if (!SUPABASE_ENABLED) { setStatus('資料儲存於此裝置瀏覽器（尚未設定雲端同步）'); return fallback; }
        try {
            const response = await fetch(`${supabaseEndpoint()}?select=data&id=eq.${SUPABASE_CONFIG.rowId}`, { headers: { apikey: SUPABASE_CONFIG.anonKey, Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}` } });
            if (!response.ok) throw new Error(`讀取失敗（HTTP ${response.status}）`);
            const rows = await response.json();
            if (rows[0]?.data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows[0].data)); setStatus('資料已由雲端載入，所有裝置共用同一份資料'); return rows[0].data; }
            toolboxData = fallback; await saveData(); setStatus('已建立第一份雲端資料'); return toolboxData;
        } catch (error) { console.error(error); setStatus('雲端讀取失敗，暫時使用此裝置資料', true); return fallback; }
    }
    async function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toolboxData));
        if (!SUPABASE_ENABLED) { setStatus('已儲存於此裝置瀏覽器；設定 Supabase 後才能跨裝置同步'); return; }
        isSaving = true;
        try {
            const response = await fetch(supabaseEndpoint(), { method: 'POST', headers: { apikey: SUPABASE_CONFIG.anonKey, Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ id: SUPABASE_CONFIG.rowId, data: toolboxData }) });
            if (!response.ok) throw new Error(`儲存失敗（HTTP ${response.status}）`);
            setStatus(`已同步至雲端 · ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`);
        } finally { isSaving = false; }
    }
    async function refreshFromCloud(force = false) {
        if (!SUPABASE_ENABLED || isSaving || !toolboxData) return;
        if (!force && !document.hidden && (detailModal && !detailModal.classList.contains('hidden') || addModal && !addModal.classList.contains('hidden') || passwordModal && !passwordModal.classList.contains('hidden'))) return;
        try {
            const response = await fetch(`${supabaseEndpoint()}?select=data&id=eq.${SUPABASE_CONFIG.rowId}`, { headers: { apikey: SUPABASE_CONFIG.anonKey, Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`, 'Cache-Control': 'no-cache' }, cache: 'no-store' });
            if (!response.ok) throw new Error(`同步讀取失敗（HTTP ${response.status}）`);
            const rows = await response.json();
            const cloudData = rows[0]?.data;
            if (cloudData && dataSignature(cloudData) !== dataSignature(toolboxData)) {
                toolboxData = cloudData;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(toolboxData));
                renderTabs();
                renderContent();
                setStatus('已從雲端更新，其他裝置的變更已同步');
            }
        } catch (error) { console.warn('背景同步暫時失敗', error); }
    }
    function startCloudSync() {
        if (!SUPABASE_ENABLED) return;
        clearInterval(syncTimer);
        syncTimer = setInterval(() => refreshFromCloud(), 8000);
        window.addEventListener('focus', () => refreshFromCloud(true));
        document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshFromCloud(true); });
        window.addEventListener('online', () => refreshFromCloud(true));
    }
    function getAllItems() { const items = []; toolboxData.categories.forEach(cat => { if (cat.subcategories) cat.subcategories.forEach(sub => sub.items.forEach(item => items.push({ ...item, category: cat, subcategory: sub.name }))); else if (cat.items) cat.items.forEach(item => items.push({ ...item, category: cat, subcategory: null })); }); return items; }
    function findItemById(id) { return getAllItems().find(item => item.id === id) || null; }
    function findItemRecordById(id) { for (const cat of toolboxData.categories) { if (cat.subcategories) { for (const sub of cat.subcategories) { const item = sub.items.find(entry => entry.id === id); if (item) return { item, category: cat, subcategory: sub.name }; } } else if (cat.items) { const item = cat.items.find(entry => entry.id === id); if (item) return { item, category: cat, subcategory: null }; } } return null; }
    function matchesSearch(item, query) { if (!query) return true; const fields = [item.name, item.url, item.note || '', ...(item.tags || []), item.subcategory || '', item.category.name].join(' ').toLowerCase(); return fields.includes(query.toLowerCase()); }

    function renderViewTabs() {
        const views = [['all', '全部工具'], ['favorites', '★ 收藏'], ['recent', '最近使用']];
        viewTabsEl.innerHTML = views.map(([id, label]) => `<button type="button" class="view-tab ${activeView === id ? 'active' : ''}" data-view="${id}">${label}</button>`).join('');
        viewTabsEl.querySelectorAll('.view-tab').forEach(btn => btn.addEventListener('click', () => { activeView = btn.dataset.view; renderViewTabs(); renderTabs(); renderContent(); }));
    }
    function renderTabs() {
        tabsEl.innerHTML = toolboxData.categories.map(cat => `<button type="button" class="tab-btn ${activeView === 'category' && cat.id === activeCategory ? 'active' : ''}" data-id="${escapeHtml(cat.id)}">${cat.icon} ${escapeHtml(cat.name)}</button>`).join('');
        tabsEl.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => { activeCategory = btn.dataset.id; activeView = 'category'; renderViewTabs(); renderTabs(); renderContent(); }));
    }
    function renderCard(item) {
        const tags = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
        const note = item.note ? `<p class="card-note">${escapeHtml(item.note)}</p>` : '';
        const favorite = isFavorite(item.id);
        return `<article class="card ${item.url ? '' : 'no-link'}" data-id="${escapeHtml(item.id)}" tabindex="0"><div class="card-header"><span class="card-name">${escapeHtml(item.name)}</span><button type="button" class="favorite-btn ${favorite ? 'active' : ''}" data-favorite="${escapeHtml(item.id)}" aria-label="${favorite ? '取消收藏' : '加入收藏'}">${favorite ? '★' : '☆'}</button></div>${note}${tags ? `<div class="card-tags">${tags}</div>` : ''}<div class="card-actions"><button type="button" class="card-detail">查看詳情</button>${item.url ? `<a class="card-open" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" data-visit="${escapeHtml(item.id)}">開啟網站 ↗</a>` : '<span class="card-unavailable">尚無網址</span>'}</div></article>`;
    }
    function updateHeroStats() { const stat = $('stat-total'); if (stat) stat.textContent = toolboxData ? getAllItems().length : '—'; }
    function renderContent() {
        const allItems = getAllItems();
        updateHeroStats();
        let filtered = allItems.filter(item => matchesSearch(item, searchQuery));
        if (activeView === 'favorites') filtered = filtered.filter(item => isFavorite(item.id));
        if (activeView === 'recent') { const order = recent(); filtered = filtered.filter(item => order.includes(item.id)).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)); }
        if (activeView === 'category') filtered = filtered.filter(item => item.category.id === activeCategory);
        const clearText = searchQuery ? `，搜尋「${escapeHtml(searchQuery)}」` : '';
        if (!filtered.length) { mainEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${activeView === 'favorites' ? '☆' : '🔍'}</div><p>${activeView === 'favorites' ? '尚未收藏工具' : activeView === 'recent' ? '尚無最近使用紀錄' : '找不到符合的工具'}</p><button type="button" class="btn btn-primary" id="empty-add">＋ 新增第一個工具</button></div>`; $('empty-add')?.addEventListener('click', openAddModal); return; }
        let html = `<p class="stats-bar">找到 ${filtered.length} 個工具${clearText}</p>`;
        const groups = new Map(); filtered.forEach(item => { const key = activeView === 'category' && item.category.subcategories ? item.subcategory : item.category.name; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
        groups.forEach((items, key) => { html += `<h3 class="subsection-title">${escapeHtml(key)}</h3><div class="cards-grid">${items.map(renderCard).join('')}</div>`; });
        mainEl.innerHTML = html;
        mainEl.querySelectorAll('.card').forEach(card => { card.addEventListener('click', e => { if (!e.target.closest('a,button')) openDetailModal(card.dataset.id); }); card.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.target.closest('button')) openDetailModal(card.dataset.id); }); });
        mainEl.querySelectorAll('.card-detail').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openDetailModal(btn.closest('.card').dataset.id); }));
        mainEl.querySelectorAll('[data-favorite]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); toggleFavorite(btn.dataset.favorite); }));
        mainEl.querySelectorAll('[data-visit]').forEach(link => link.addEventListener('click', () => markRecent(link.dataset.visit)));
    }
    function toggleFavorite(id) { const list = favorites(); writeList(FAVORITES_KEY, list.includes(id) ? list.filter(x => x !== id) : [id, ...list]); renderContent(); }
    function markRecent(id) { writeList(RECENT_KEY, [id, ...recent().filter(x => x !== id)].slice(0, 20)); }
    function openModal(modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
    function closeModal(modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
    function updateVisitButton() { const url = $('detail-url').value.trim(); const btn = $('detail-visit'); if (url) { btn.href = url; btn.classList.remove('hidden'); } else btn.classList.add('hidden'); }
    function openDetailModal(id) { const record = findItemRecordById(id); if (!record) return; const found = record.item; $('detail-id').value = found.id; $('detail-category-id').value = record.category.id; $('detail-subcategory').value = record.subcategory || ''; $('detail-name').value = found.name; $('detail-url').value = found.url || ''; $('detail-tags').value = (found.tags || []).join(', '); $('detail-note').value = found.note || ''; updateVisitButton(); openModal(detailModal); }
    function openAddModal() { addForm.reset(); populateAddCategorySelect(); updateSubcategoryField(); openModal(addModal); }
    function populateAddCategorySelect() { $('add-category').innerHTML = toolboxData.categories.map(cat => `<option value="${escapeHtml(cat.id)}">${cat.icon} ${escapeHtml(cat.name)}</option>`).join(''); $('add-category').value = activeCategory; }
    function updateSubcategoryField() { const cat = toolboxData.categories.find(c => c.id === $('add-category').value); const field = $('add-subcategory-field'); const select = $('add-subcategory'); if (cat?.subcategories) { field.classList.remove('hidden'); select.innerHTML = cat.subcategories.map(sub => `<option value="${escapeHtml(sub.name)}">${escapeHtml(sub.name)}</option>`).join(''); } else { field.classList.add('hidden'); select.innerHTML = ''; } }
    function parseTags(str) { return str.split(/[,，]/).map(t => t.trim()).filter(Boolean); }
    function generateId() { return 'custom-' + Date.now(); }
    function hasDuplicateUrl(url, ignoreId = '') { return url && getAllItems().some(item => item.id !== ignoreId && item.url && item.url.trim().toLowerCase() === url.toLowerCase()); }

    detailForm.addEventListener('submit', async e => { e.preventDefault(); const record = findItemRecordById($('detail-id').value); if (!record) return; const found = record.item; const name = $('detail-name').value.trim(), url = $('detail-url').value.trim(); if (hasDuplicateUrl(url, found.id) && !confirm('已有工具使用相同網址，仍要儲存嗎？')) return; found.name = name; found.url = url; found.tags = parseTags($('detail-tags').value); found.note = $('detail-note').value.trim(); try { await saveData(); closeModal(detailModal); renderContent(); } catch (error) { console.error(error); setStatus('儲存失敗，請稍後再試', true); } });
    $('detail-url').addEventListener('input', updateVisitButton);
    $('detail-delete').addEventListener('click', () => { pendingDeleteId = $('detail-id').value; $('delete-password').value = ''; $('password-error').classList.add('hidden'); closeModal(detailModal); openModal(passwordModal); setTimeout(() => $('delete-password').focus(), 50); });
    $('password-form').addEventListener('submit', async e => { e.preventDefault(); const enteredPassword = $('delete-password').value; if (enteredPassword !== ADMIN_DELETE_PASSWORD || ADMIN_DELETE_PASSWORD === DELETE_PASSWORD_FALLBACK) { $('password-error').classList.remove('hidden'); return; } const record = findItemRecordById(pendingDeleteId); if (!record) return; const deletedId = pendingDeleteId; undoSnapshot = deepCopy(toolboxData); const cat = record.category; if (cat.subcategories) { const sub = cat.subcategories.find(s => s.name === record.subcategory); if (!sub) { setStatus('找不到工具所在的子分類，刪除未完成', true); return; } sub.items = sub.items.filter(item => item.id !== deletedId); } else if (cat.items) { cat.items = cat.items.filter(item => item.id !== deletedId); } if (findItemById(deletedId)) { toolboxData = undoSnapshot; undoSnapshot = null; setStatus('刪除未完成，請重新整理後再試', true); return; } renderViewTabs(); renderTabs(); renderContent(); try { await saveData(); closeModal(passwordModal); pendingDeleteId = null; showToast('工具已刪除並同步至雲端，可在 8 秒內復原'); } catch (error) { toolboxData = undoSnapshot; undoSnapshot = null; renderViewTabs(); renderTabs(); renderContent(); setStatus('刪除同步失敗，資料已復原', true); } });
    addForm.addEventListener('submit', async e => { e.preventDefault(); const catId = $('add-category').value, cat = toolboxData.categories.find(c => c.id === catId); if (!cat) return; const url = $('add-url').value.trim(); if (hasDuplicateUrl(url) && !confirm('已有工具使用相同網址，仍要新增嗎？')) return; const item = { id: generateId(), name: $('add-name').value.trim(), url, tags: parseTags($('add-tags').value), note: $('add-note').value.trim() }; if (cat.subcategories) { const sub = cat.subcategories.find(s => s.name === $('add-subcategory').value); if (sub) sub.items.push(item); } else cat.items.push(item); try { await saveData(); activeCategory = catId; activeView = 'category'; closeModal(addModal); renderViewTabs(); renderTabs(); renderContent(); showToast('工具已新增並同步'); } catch (error) { setStatus('新增失敗，請稍後再試', true); } });

    function showToast(message) { clearTimeout(undoTimer); $('toast-message').textContent = message; $('toast-action').classList.toggle('hidden', !undoSnapshot); $('toast').classList.remove('hidden'); if (undoSnapshot) undoTimer = setTimeout(() => { undoSnapshot = null; $('toast').classList.add('hidden'); }, 8000); else setTimeout(() => $('toast').classList.add('hidden'), 3500); }
    $('toast-action').addEventListener('click', async () => { if (!undoSnapshot) return; toolboxData = undoSnapshot; undoSnapshot = null; try { await saveData(); renderContent(); $('toast').classList.add('hidden'); showToast('已復原刪除'); } catch (_) { setStatus('復原同步失敗', true); } });
    $('btn-export').addEventListener('click', () => { const blob = new Blob([JSON.stringify(toolboxData, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `ai-toolbox-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); showToast('備份已下載'); });
    $('btn-import').addEventListener('click', () => $('import-file').click());
    $('import-file').addEventListener('change', async e => { const file = e.target.files[0]; if (!file) return; try { const imported = JSON.parse(await file.text()); if (!Array.isArray(imported.categories)) throw new Error('format'); if (!confirm('匯入備份會取代目前工具資料，確定繼續嗎？')) return; undoSnapshot = deepCopy(toolboxData); toolboxData = imported; await saveData(); renderTabs(); renderContent(); showToast('備份已匯入'); } catch (_) { setStatus('匯入失敗：檔案格式不正確', true); } finally { e.target.value = ''; } });

    $('add-category').addEventListener('change', updateSubcategoryField); $('btn-add').addEventListener('click', openAddModal); $('hero-add')?.addEventListener('click', openAddModal); $('detail-close').addEventListener('click', () => closeModal(detailModal)); $('detail-cancel').addEventListener('click', () => closeModal(detailModal)); $('add-close').addEventListener('click', () => closeModal(addModal)); $('add-cancel').addEventListener('click', () => closeModal(addModal)); $('password-close').addEventListener('click', () => closeModal(passwordModal)); $('password-cancel').addEventListener('click', () => closeModal(passwordModal)); [detailModal, addModal, passwordModal].forEach(modal => modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); }));
    searchEl.addEventListener('input', e => { searchQuery = e.target.value.trim(); $('search-clear').classList.toggle('hidden', !searchQuery); renderContent(); }); $('search-clear').addEventListener('click', () => { searchEl.value = ''; searchQuery = ''; $('search-clear').classList.add('hidden'); searchEl.focus(); renderContent(); });
    async function init() { mainEl.innerHTML = '<div class="empty-state"><p>正在載入資料…</p></div>'; toolboxData = await loadData(); renderViewTabs(); renderTabs(); renderContent(); startCloudSync(); }
    init();
})();
