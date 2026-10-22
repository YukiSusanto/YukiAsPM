/* 素材库简化：使用文件夹管理任意格式文件，格式筛选只作用于当前目录。
   消息节点里的素材入口也合并为「素材库」一个按钮。 */

(function normalizeSimpleFS() {
  product.materialGroups = product.materialGroups || [];
  product.materials = product.materials || [];
  /* 统一为一个中性分组类型，取消按格式分组；老数据的 kind 不再参与筛选 */
  product.materialGroups.forEach(g => { g.kind = g.kind || 'file'; });
  /* 类型体系收敛成单一类型，避免每次渲染又自动补出按格式的「未分组」 */
  if (typeof materialCategoryLabels === 'object') {
    Object.keys(materialCategoryLabels).forEach(k => { delete materialCategoryLabels[k]; });
    materialCategoryLabels.file = '全部件';
  }
  if (typeof materialKinds === 'object') {
    Object.keys(materialKinds).forEach(k => { delete materialKinds[k]; });
    materialKinds.file = '文件';
  }
  /* 旧的按格式建出来的多个「未分组」合并成一个 ungrouped-file */
  const defaults = product.materialGroups.filter(g => g.isDefault || /^未分组/.test(String(g.name || '')));
  let keep = product.materialGroups.find(g => g.id === 'ungrouped-file') || defaults.find(g => !g.parentId) || defaults[0];
  if (keep) {
    const oldId = keep.id;
    keep.id = 'ungrouped-file';
    if (oldId !== keep.id) product.materials.forEach(a => { if ((a.groupId || '') === oldId) a.groupId = keep.id; });
    keep.name = '未分组';
    keep.isDefault = true;
    keep.parentId = null;
    keep.kind = 'file';
    defaults.forEach(g => {
      if (g.id === keep.id) return;
      product.materials.forEach(a => { if ((a.groupId || '') === g.id) a.groupId = keep.id; });
      product.materialGroups = product.materialGroups.filter(x => x.id !== g.id);
    });
  }
  product.materialGroups.forEach(g => { g.kind = 'file'; });
  if (typeof materialPersist === 'function') materialPersist();
  materialType = 'all';
})();

/* 简化后不再做"按类型迁移分组"，否则会把素材硬塞回 ungrouped-<kind> */
migrateTypedFolders = function () { /* noop */ };

function materialFileKind(file) {
  const mime = String((file && file.type) || '');
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}
/* 分组树：全部素材 + 平铺文件夹（保留原有展开/改名/新建子分组交互） */
materialGroupsMarkup = function (active) {
  const entries = folderEntries();
  function branch(parent, depth, seen) {
    return entries.filter(g => (g.parentId || null) === parent).map(g => {
      if (seen.has(g.id)) return '';
      const next = new Set(seen);
      next.add(g.id);
      const children = entries.filter(x => x.parentId === g.id);
      const expanded = expandedMaterialFolders.has(g.id);
      return '<div class="folder-tree-node" role="treeitem" aria-level="' + (depth + 1) + '" aria-selected="' + (active === g.id) + '"' + (children.length ? ' aria-expanded="' + expanded + '"' : '') + ' data-folder-node="' + escapeText(g.id) + '">'
        + '<div class="folder-tree-row ' + (active === g.id ? 'active' : '') + '" style="--folder-depth:' + depth + '" draggable="true" data-folder-row="' + escapeText(g.id) + '">'
        + (children.length
          ? '<button type="button" class="folder-toggle" data-expand-folder="' + escapeText(g.id) + '" aria-label="' + (expanded ? '收起' : '展开') + escapeText(g.name) + '">' + (expanded ? '⌄' : '›') + '</button>'
          : '<span class="folder-toggle-placeholder"></span>')
        + '<button type="button" class="folder-select" data-material-group="' + escapeText(g.id) + '" title="' + escapeText(folderPath(g.id)) + '"><span class="folder-symbol">▱</span><strong>' + escapeText(g.name) + '</strong></button>'
        + '<button type="button" class="folder-pencil" data-rename-group="' + escapeText(g.id) + '" aria-label="重命名' + escapeText(g.name) + '" title="重命名文件夹">' + folderPencil + '</button>'
        + '<span class="folder-spacer"></span>'
        + '<button type="button" class="folder-more" data-folder-menu="' + escapeText(g.id) + '" aria-label="' + escapeText(g.name) + '的更多操作" title="更多操作" aria-haspopup="menu">···</button>'
        + '</div>'
        + (children.length && expanded ? '<div role="group">' + branch(g.id, depth + 1, next) + '</div>' : '')
        + '</div>';
    }).join('');
  }
  /* 保留一个隐藏的「全部素材」节点：旧的渲染逻辑仍会去绑定它的点击事件 */
  return '<div class="folder-all" style="display:none"><button type="button" data-material-group="all"><span>▱</span><strong>全部素材</strong></button></div>'
    + '<div class="asset-detail-group-heading">文件夹</div>'
    + (branch(null, 0, new Set()) || '<div class="opt-empty">暂无文件夹</div>');
};

/* 列表渲染：永远不按类型过滤 */
const simpleMaterialFormatState = {format:'all', folder:null};
assetFormatKey = function (asset) {
  if (asset.kind === 'videochannel' || asset.videoChannel) return 'videochannel';
  const name = String(asset.originalName || asset.name || '');
  const match = name.match(/\.([^.\s]+)$/);
  return match ? 'ext:' + match[1].toLowerCase() : 'none';
};
/* 两处共用筛选器：素材管理页，以及节点/欢迎语的引用弹窗。 */
prepareMaterialFormat = function (container, options) {
  const picker = !!options.picker;
  const group = options.group ?? materialGroup;
  const state = picker ? options : simpleMaterialFormatState;
  if (state.folder !== group) { state.folder = group; state.format = 'all'; }
  const filters = container.querySelector(picker ? '.asset-picker-filters' : '.asset-filters');
  if (!filters) return 'all';
  const choices = new Map();
  product.materials.filter(a => group === 'all' || (a.groupId || 'ungrouped') === group).forEach(a => {
    const key = assetFormatKey(a);
    choices.set(key, key === 'videochannel' ? '视频号' : key === 'none' ? '无扩展名' : '.' + key.slice(4).toUpperCase());
  });
  if (state.format !== 'all' && !choices.has(state.format)) state.format = 'all';
  let select = filters.querySelector('.asset-format-filter');
  if (!select) {
    select = document.createElement('select');
    select.className = 'local-select asset-format-filter';
    select.setAttribute('aria-label', picker ? '引用素材文件格式' : '筛选素材文件格式');
    const search = filters.querySelector('input');
    if (search) search.before(select); else filters.append(select);
  }
  select.innerHTML = '<option value="all">全部格式</option>' + [...choices].sort((a,b) => a[1].localeCompare(b[1])).map(([key,label]) => '<option value="' + escapeText(key) + '">' + escapeText(label) + '</option>').join('');
  select.value = state.format || 'all';
  select.disabled = choices.size === 0;
  select.onchange = () => { state.format = select.value; renderMaterialCards(container, options); };
  return state.format || 'all';
};
const simpleCardsBefore = renderMaterialCards;
renderMaterialCards = function (container, options) {
  const state = options || {};
  state.type = 'all';
  return simpleCardsBefore(container, state);
};

/* 上传：任意格式，落进当前/所选文件夹 */
uploadMaterial = function (targetGroup, onUploaded) {
  const folders = flattenedFolders();
  const current = targetGroup && targetGroup !== 'all' ? targetGroup : (materialGroup !== 'all' ? materialGroup : null);
  let files = [];
  const folderSelect = current
    ? '<div class="asset-upload-destination">上传到：<strong>' + escapeText(folderPath(current)) + '</strong></div>'
    : field('上传到文件夹', '<select class="local-select" aria-label="上传到文件夹">'
      + (folders.length ? folders.map(g => '<option value="' + escapeText(g.id) + '">' + escapeText(folderPath(g.id)) + '</option>').join('') : '<option value="">未分组</option>')
      + '</select>');
  const m = simpleModal('上传素材', '<div class="asset-upload-drop"><strong>上传文件</strong><p>支持任意格式，可一次选择多个文件</p>'
    + btn('选择文件', 'el-button--primary')
    + '<input type="file" class="asset-file-input" hidden multiple></div><div class="asset-upload-files"></div>'
    + folderSelect
    + '<p class="opt-muted">素材名称仅供内部识别，发送时只发送对应文件；文件保存在当前浏览器。</p><div class="asset-upload-error" role="status"></div>',
    async modal => {
      if (!files.length) return feedback('请先选择文件');
      const select = modal.querySelector('[aria-label="上传到文件夹"]');
      const groupId = current || (select && select.value) || simpleUngroupedId();
      const button = buttons(modal, '开始上传')[0];
      button.disabled = true;
      button.textContent = '正在保存…';
      const entries = files.map((file, i) => ({ file, id: 'asset-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2) }));
      try {
        await writeMaterialFiles(entries);
        const now = new Date().toISOString();
        entries.forEach(({ file, id }) => product.materials.push({
          id,
          name: file.name,
          originalName: file.name,
          size: file.size,
          mime: file.type || 'application/octet-stream',
          kind: materialFileKind(file),
          sourceType: 'file',
          videoChannelId: null,
          groupId,
          uploadedAt: now
        }));
        if (!materialPersist()) {
          const failed = new Set(entries.map(e => e.id));
          product.materials = product.materials.filter(a => !failed.has(a.id));
          throw new Error('元数据保存失败');
        }
        modal.remove();
        document.body.style.overflow = '';
        if (onUploaded) { onUploaded(entries.map(e => e.id)); }
        else { materialGroup = groupId; materialType = 'all'; materialSearch = ''; render(); }
        feedback('已上传' + entries.length + '个文件');
      } catch (e) {
        modal.querySelector('.asset-upload-error').textContent = '上传保存失败，文件未完成入库。请检查浏览器存储空间后重试。';
        button.disabled = false;
        button.textContent = '开始上传';
      }
    }, '开始上传');
  m.classList.add('asset-upload-modal');
  const input = m.querySelector('input[type=file]');
  input.removeAttribute('accept');
  buttons(m, '选择文件')[0].onclick = () => input.click();
  input.onchange = () => {
    files = Array.from(input.files);
    m.querySelector('.asset-upload-files').innerHTML = files.map(f => '<div><span>' + escapeText(f.name) + '</span><small>' + materialSize(f.size) + '</small></div>').join('');
    m.querySelector('.asset-upload-error').textContent = '';
  };
};
function simpleUngroupedId() {
  let g = product.materialGroups.find(x => x.name === '未分组' && !x.parentId);
  if (!g) {
    g = { id: 'group-' + Date.now(), name: '未分组', kind: 'file', parentId: null };
    product.materialGroups.push(g);
    materialPersist();
  }
  return g.id;
}

/* 文件夹管理：不再要求先选素材类型 */
editMaterialGroup = function (id, parentId = null) {
  const existing = product.materialGroups.find(g => g.id === id);
  if (existing && existing.isDefault) return feedback('默认文件夹不可修改');
  const excluded = new Set(id ? [id, ...folderDescendants(id)] : []);
  const m = simpleModal(existing ? '修改文件夹' : '新建文件夹',
    field('文件夹名称', '<input class="local-input" aria-label="文件夹名称" maxlength="40" value="' + escapeText(existing ? existing.name : '') + '">')
    + (existing ? '' : field('上级文件夹', '<select class="local-select" aria-label="上级文件夹"><option value="">一级文件夹</option>'
      + flattenedFolders(excluded).map(g => '<option value="' + escapeText(g.id) + '"' + (g.id === parentId ? ' selected' : '') + '>' + escapeText(folderPath(g.id)) + '</option>').join('') + '</select>')),
    modal => {
      const name = modal.querySelector('[aria-label="文件夹名称"]').value.trim();
      const parent = existing ? (existing.parentId || null) : ((modal.querySelector('[aria-label="上级文件夹"]') || {}).value || null);
      if (!name) return feedback('请输入文件夹名称');
      if (product.materialGroups.some(g => g.id !== id && (g.parentId || null) === parent && g.name === name)) return feedback('同一级文件夹名称已存在');
      if (existing) { existing.name = name; }
      else {
        const folder = { id: 'group-' + Date.now(), name, kind: 'file', parentId: parent };
        product.materialGroups.push(folder);
        /* 新建后停留在当前目录，子文件夹以行形式出现在内容区 */
        if (!parent) materialGroup = folder.id;
      }
      if (parent) expandedMaterialFolders.add(parent);
      materialPersist();
      modal.remove();
      render();
    });
};

function simpleFolderList() { return flattenedFolders(); }
function simpleEnsureFolder() {
  const list = simpleFolderList();
  if (materialGroup && materialGroup !== 'all' && list.some(g => g.id === materialGroup)) return materialGroup;
  const preferred = list.find(g => g.name === '未分组') || list[0];
  materialGroup = preferred ? preferred.id : simpleUngroupedId();
  return materialGroup;
}
function simpleSubfolders(id) {
  return product.materialGroups.filter(g => (g.parentId || null) === id);
}
/* 文件夹「···」菜单：只放新增子文件夹 / 删除文件夹；重命名的铅笔紧贴文件夹名 */
function simpleFolderMenu(anchor, folderId) {
  document.querySelectorAll('.folder-action-menu').forEach(m => m.remove());
  const folder = folderId ? product.materialGroups.find(g => g.id === folderId) : null;
  const items = folder
    ? [['新增子文件夹', () => editMaterialGroup(null, folder.id)], ['删除文件夹', () => simpleDeleteFolder(folder.id)]]
    : [['新增一级文件夹', () => editMaterialGroup(null, null)]];
  const menu = document.createElement('div');
  menu.className = 'local-menu folder-action-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = items.map(([label], i) => '<button type="button" role="menuitem" data-folder-action="' + i + '">' + escapeText(label) + '</button>').join('');
  document.body.append(menu);
  const rect = anchor.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.right - 140, window.innerWidth - 160));
  menu.style.left = left + 'px';
  menu.style.top = Math.round(rect.bottom + 4) + 'px';
  menu.querySelectorAll('button').forEach((b, i) => {
    b.onclick = e => { e.stopPropagation(); menu.remove(); items[i][1](); };
  });
  const close = ev => {
    if (menu.contains(ev.target)) return;
    menu.remove();
    document.removeEventListener('click', close);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = ev => {
    if (ev.key !== 'Escape') return;
    menu.remove();
    document.removeEventListener('click', close);
    document.removeEventListener('keydown', onKey);
  };
  setTimeout(() => { document.addEventListener('click', close); document.addEventListener('keydown', onKey); }, 0);
}
/* 删除文件夹：连同子文件夹一起删除（弹窗里明确提醒），其中文件移到上一级、不删文件本身 */
function simpleDeleteFolder(id) {
  const folder = product.materialGroups.find(g => g.id === id);
  if (!folder) return;
  const parent = folder.parentId || null;
  const descendants = [...new Set(folderDescendants(id))];
  const ids = new Set([id, ...descendants]);
  const files = product.materials.filter(a => ids.has(a.groupId || ''));
  const target = parent ? folderPath(parent) : '未分组';
  const m = simpleModal('删除文件夹',
    '<p>确认删除文件夹「' + escapeText(folder.name) + '」？</p>'
    + (descendants.length ? '<p class="asset-deletion-warning">注意：该文件夹下还有 ' + descendants.length + ' 个子文件夹（含多级），删除父文件夹时会一并删除，不可恢复。</p>' : '')
    + '<p class="opt-muted">' + (files.length ? '其中 ' + files.length + ' 个文件不会被删除，会移到「' + escapeText(target) + '」。' : '该文件夹下没有文件。') + '</p>',
    modal => {
      product.materialGroups = product.materialGroups.filter(g => !ids.has(g.id));
      const dropTo = parent && !ids.has(parent) ? parent : simpleUngroupedId();
      files.forEach(a => { a.groupId = dropTo; });
      ids.forEach(fid => expandedMaterialFolders.delete(fid));
      if (ids.has(materialGroup)) materialGroup = parent && !ids.has(parent) ? parent : dropTo;
      product.materialExpanded = [...expandedMaterialFolders];
      if (!materialPersist()) return feedback('删除失败，请检查浏览器存储空间');
      modal.remove();
      if (!dialogs.children.length) document.body.style.overflow = '';
      render();
      feedback(descendants.length ? '文件夹及其 ' + descendants.length + ' 个子文件夹已删除' : '文件夹已删除');
    }, '删除');
  buttons(m, '删除')[0].classList.add('el-button--danger');
}
/* 拖动文件夹改变分级：拖到另一个文件夹上成为它的子文件夹，拖到空白处变回一级 */
function simpleInitFolderDrag(page) {
  const rows = [...page.querySelectorAll('[data-folder-row]')];
  const tree = page.querySelector('.asset-group-list');
  if (!tree || !rows.length) return;
  const descendants = id => new Set(folderDescendants(id));
  const clearMarks = () => rows.forEach(r => r.classList.remove('drop-into', 'dragging'));
  rows.forEach(row => {
    row.ondragstart = e => {
      const id = row.dataset.folderRow;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      window.__folderDragId = id;
      row.classList.add('dragging');
    };
    row.ondragend = () => { window.__folderDragId = null; clearMarks(); };
    row.ondragover = e => {
      const from = window.__folderDragId;
      if (!from || from === row.dataset.folderRow || descendants(from).has(row.dataset.folderRow)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      rows.forEach(r => r.classList.remove('drop-into'));
      row.classList.add('drop-into');
    };
    row.ondragleave = () => row.classList.remove('drop-into');
    row.ondrop = e => {
      const from = window.__folderDragId;
      clearMarks();
      if (!from) return;
      e.preventDefault();
      const to = row.dataset.folderRow;
      if (from === to || descendants(from).has(to)) return;
      simpleMoveFolder(from, to);
    };
  });
  tree.ondragover = e => {
    if (!window.__folderDragId) return;
    if (e.target.closest('[data-folder-row]')) return;
    e.preventDefault();
  };
  tree.ondrop = e => {
    const from = window.__folderDragId;
    if (!from || e.target.closest('[data-folder-row]')) return;
    e.preventDefault();
    clearMarks();
    simpleMoveFolder(from, null);
  };
}
function simpleMoveFolder(id, parentId) {
  const folder = product.materialGroups.find(g => g.id === id);
  if (!folder) return;
  const currentParent = folder.parentId || null;
  let parent = parentId || null;
  /* 拖到自己的父文件夹＝向外拖出，与父文件夹平级 */
  if (parent && parent === currentParent) {
    parent = (product.materialGroups.find(g => g.id === currentParent) || {}).parentId || null;
  }
  if (parent === currentParent) return;
  const ban = new Set(folderDescendants(id));
  if (parent && (parent === id || ban.has(parent))) return feedback('不能把文件夹移动到自身或其子文件夹中');
  if (product.materialGroups.some(g => g.id !== id && (g.parentId || null) === parent && g.name === folder.name)) return feedback('目标文件夹下已存在同名文件夹');
  folder.parentId = parent;
  if (parent) expandedMaterialFolders.add(parent);
  product.materialExpanded = [...expandedMaterialFolders];
  if (!materialPersist()) return feedback('移动失败，请检查浏览器存储空间');
  render();
  feedback(parent ? '已移动到「' + folderPath(parent) + '」' : '已向上移动一级，与「' + (product.materialGroups.find(g => g.id === currentParent) || {}).name + '」平级');
}
function simpleFileCount(id) {
  return product.materials.filter(a => (a.groupId || '') === id).length;
}
/* 内容区：子文件夹以行形式排在文件列表之前（不设目录导航条，返回上级走左侧文件夹树） */
function simpleMountExplorer(page) {
  const main = page.querySelector('.asset-main');
  if (!main) return;
  const current = materialGroup;
  main.querySelector('.asset-explorer-bar')?.remove();
  /* 子文件夹以行形式排在文件列表之前 */
  main.querySelector('.asset-subfolders')?.remove();
  const subs = simpleSubfolders(current);
  if (subs.length) {
    const strip = document.createElement('div');
    strip.className = 'asset-subfolders';
    strip.innerHTML = subs.map(g => '<button type="button" class="asset-subfolder-row" data-open-folder="' + escapeText(g.id) + '" title="打开 ' + escapeText(folderPath(g.id)) + '">'
      + '<span class="folder-symbol">▱</span><strong>' + escapeText(g.name) + '</strong>'
      + '<small>' + simpleFileCount(g.id) + ' 个文件</small><span class="asset-subfolder-open">打开 ›</span></button>').join('');
    const listHost = main.querySelector('.asset-list-host');
    if (listHost) listHost.before(strip); else main.append(strip);
    strip.querySelectorAll('[data-open-folder]').forEach(b => {
      b.onclick = () => { materialGroup = b.dataset.openFolder; render(); };
    });
  }
}

/* 页面渲染后：保留目录内的格式筛选，隐藏旧类型分类。 */
const simpleLibraryBefore = renderMaterialLibrary;
renderMaterialLibrary = function () {
  materialType = 'all';
  simpleEnsureFolder();
  simpleLibraryBefore();
  const page = root.querySelector('.asset-page');
  if (!page) return;
  materialType = 'all';
  page.querySelectorAll('.asset-default-types,[aria-label="筛选素材类型"],.folder-type-hint').forEach(el => el.remove());
  /* 内容区里散落的上传按钮统一收进右上角 */
  page.querySelectorAll('button').forEach(b => {
    if (b.textContent.trim() === '上传素材' && !b.closest('.asset-header-actions')) b.remove();
  });
  let header = page.querySelector('.asset-header-actions');
  if (!header) {
    header = document.createElement('div');
    header.className = 'asset-header-actions';
    const head = page.querySelector('.opt-page-head');
    (head || page).append(header);
  }
  if (!header.querySelector('.asset-upload-entry')) {
    const upload = document.createElement('button');
    upload.type = 'button';
    upload.className = 'el-button el-button--primary asset-upload-entry';
    upload.textContent = '上传素材';
    upload.onclick = () => uploadMaterial(materialGroup !== 'all' ? materialGroup : null);
    header.append(upload);
    const video = document.createElement('button');
    video.type = 'button';
    video.className = 'el-button asset-vc-entry';
    video.textContent = '上传视频号素材';
    video.onclick = () => openVideoChannelUpload(materialGroup !== 'all' ? materialGroup : null);
    header.append(video);
  }
  simpleMountExplorer(page);
  const title = page.querySelector('.asset-section-title p');
  if (title) title.textContent = folderPath(materialGroup);
  const newGroup = page.querySelector('.asset-new-group');
  if (newGroup) newGroup.disabled = false;
  const groupsTitleBtn = page.querySelector('.asset-groups-title button');
  if (groupsTitleBtn) groupsTitleBtn.disabled = false;
  /* 素材数量跟着文件夹名字走，不再放在筛选行最右侧 */
  const count = page.querySelector('.asset-result-count');
  const titleHost = page.querySelector('.asset-current-group-title');
  if (count && titleHost && count.parentElement !== titleHost) {
    count.classList.add('asset-current-group-count');
    titleHost.append(count);
  }
  /* 右侧当前文件夹最右端：··· 菜单（新增子文件夹 / 重命名 / 删除） */
  const sectionTitle = page.querySelector('.asset-section-title');
  if (sectionTitle && !sectionTitle.querySelector('.asset-folder-more')) {
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'asset-folder-more';
    more.textContent = '···';
    more.title = '文件夹操作';
    more.setAttribute('aria-label', '文件夹操作');
    more.setAttribute('aria-haspopup', 'menu');
    more.onclick = e => {
      e.stopPropagation();
      const id = materialGroup && product.materialGroups.some(g => g.id === materialGroup) ? materialGroup : null;
      simpleFolderMenu(more, id);
    };
    sectionTitle.append(more);
  }
  /* 左侧文件夹行的 ··· 菜单 */
  page.querySelectorAll('[data-folder-menu]').forEach(b => {
    b.onclick = e => { e.stopPropagation(); simpleFolderMenu(b, b.dataset.folderMenu); };
  });
  simpleInitFolderDrag(page);
};

/* 引用素材库弹窗：文件夹与文件格式筛选共用素材管理页的口径。 */
const simplePickerBefore = materialLibrary;
materialLibrary = function (editor, initialType) {
  simplePickerBefore(editor, 'all');
  if (!editor || !materialType) return;
  const m = dialogs.lastElementChild;
  if (!m) return;
  m.querySelectorAll('[aria-label="引用素材类型"]').forEach(el => el.remove());
  const groupSelect = m.querySelector('[aria-label="引用素材分组"]');
  if (groupSelect) {
    const options = '<option value="all">全部文件夹</option>' + flattenedFolders().map(g => '<option value="' + escapeText(g.id) + '">' + escapeText(folderPath(g.id)) + '</option>').join('');
    groupSelect.innerHTML = options;
    groupSelect.value = 'all';
  }
  let upload = m.querySelector('.asset-picker-upload');
  if (!upload) {
    const host = m.querySelector('.asset-picker-info') || m.querySelector('.el-dialog__body');
    if (host) {
      upload = document.createElement('button');
      upload.type = 'button';
      upload.className = 'el-button el-button--primary is-plain asset-picker-upload';
      upload.textContent = '上传素材';
      host.append(upload);
    }
  }
  if (upload && !upload.dataset.simple) {
    upload.dataset.simple = '1';
    upload.onclick = () => {
      const group = groupSelect && groupSelect.value !== 'all' ? groupSelect.value : null;
      uploadMaterial(group, () => {
        if (!m.isConnected) return;
        const search = m.querySelector('[aria-label="搜索引用素材"]');
        if (search) { search.value = ''; search.dispatchEvent(new Event('input')); }
        if (groupSelect) groupSelect.dispatchEvent(new Event('change'));
      });
    };
  }
  const refreshUploadedVideo = ids => {
    if (!m.isConnected) return;
    const asset = product.materials.find(a => a.id === ids[0]);
    if (groupSelect && asset) groupSelect.value = asset.groupId;
    const search = m.querySelector('[aria-label="搜索引用素材"]');
    if (search) { search.value = ''; search.dispatchEvent(new Event('input')); }
    if (groupSelect) groupSelect.dispatchEvent(new Event('change'));
    const format = m.querySelector('[aria-label="引用素材文件格式"]');
    if (format) { format.value = 'all'; format.dispatchEvent(new Event('change')); }
    document.body.style.overflow = 'hidden';
  };
  const host = upload && upload.parentElement;
  if (host && !m.querySelector('.asset-picker-video-upload')) {
    const video = document.createElement('button');
    video.type = 'button';
    video.className = 'el-button is-plain asset-picker-video-upload';
    video.textContent = '上传视频号素材';
    video.onclick = () => openVideoChannelUpload(
      groupSelect && groupSelect.value !== 'all' ? groupSelect.value : null,
      refreshUploadedVideo
    );
    host.append(video);
  }
};

/* 消息节点：不再有独立「素材库」按钮，改为点「暂未引用素材」或列表下方「添加」来引用 */
function simpleSyncMaterialEntry(m) {
  if (!m) return;
  const uploader = m.querySelector('.material-uploader');
  if (!uploader) return;
  const empty = uploader.querySelector('.material-empty');
  const items = uploader.querySelectorAll('.material-local-item').length;
  if (empty) {
    empty.classList.toggle('is-clickable', items === 0 && empty.dataset.readonly !== '1');
    if (items === 0) empty.textContent = '暂未引用素材 · 点击引用';
    if (!empty.dataset.materialBound) {
      empty.dataset.materialBound = '1';
      empty.onclick = () => {
        if (!empty.classList.contains('is-clickable') || empty.dataset.readonly === '1') return;
        const ed = dialogs.lastElementChild;
        if (ed) materialLibrary(ed);
      };
    }
  }
  let add = uploader.querySelector('.material-add-btn');
  if (items > 0) {
    if (!add) {
      add = document.createElement('button');
      add.type = 'button';
      add.className = 'material-add-btn';
      add.textContent = '＋ 添加素材';
      add.title = '继续从素材库引用';
      uploader.append(add);
    }
    add.onclick = () => {
      if (add.dataset.readonly === '1') return;
      const ed = dialogs.lastElementChild;
      if (ed) materialLibrary(ed);
    };
  } else if (add) add.remove();
}
const simpleRenderMaterialsBefore = renderMaterials;
renderMaterials = function (m) {
  simpleRenderMaterialsBefore(m);
  simpleSyncMaterialEntry(m);
};

const simpleEditNodeBefore = editNode;
editNode = function (i, readOnly = false) {
  simpleEditNodeBefore(i, readOnly);
  const m = dialogs.lastElementChild;
  if (!m) return;
  const shortcuts = m.querySelector('.material-type-shortcuts');
  if (shortcuts) shortcuts.remove();
  const empty = m.querySelector('.material-empty');
  if (empty) {
    empty.dataset.readonly = readOnly ? '1' : '0';
    if (readOnly) empty.classList.remove('is-clickable');
  }
  simpleSyncMaterialEntry(m);
  const add = m.querySelector('.material-add-btn');
  if (add) add.dataset.readonly = readOnly ? '1' : '0';
};
