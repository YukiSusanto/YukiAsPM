/* 素材库简化：去掉按格式的固定分类与格式限制，改成一个简单文件系统（文件夹 + 任意格式文件）。
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
      const count = product.materials.filter(a => (a.groupId || '') === g.id).length;
      return '<div class="folder-tree-node" role="treeitem" aria-level="' + (depth + 1) + '" aria-selected="' + (active === g.id) + '"' + (children.length ? ' aria-expanded="' + expanded + '"' : '') + '>'
        + '<div class="folder-tree-row ' + (active === g.id ? 'active' : '') + '" style="--folder-depth:' + depth + '">'
        + (children.length
          ? '<button type="button" class="folder-toggle" data-expand-folder="' + escapeText(g.id) + '" aria-label="' + (expanded ? '收起' : '展开') + escapeText(g.name) + '">' + (expanded ? '⌄' : '›') + '</button>'
          : '<span class="folder-toggle-placeholder"></span>')
        + '<button type="button" class="folder-select" data-material-group="' + escapeText(g.id) + '" title="' + escapeText(folderPath(g.id)) + '"><span class="folder-symbol">▱</span><strong>' + escapeText(g.name) + '</strong><small>' + count + '</small></button>'
        + '<button type="button" class="folder-add" data-add-subgroup="' + escapeText(g.id) + '" aria-label="在' + escapeText(g.name) + '下新建子文件夹" title="新建子文件夹">＋</button>'
        + '<button type="button" class="asset-group-edit" data-rename-group="' + escapeText(g.id) + '" aria-label="重命名' + escapeText(g.name) + '" title="修改文件夹名称">' + folderPencil + '</button>'
        + '</div>'
        + (children.length && expanded ? '<div role="group">' + branch(g.id, depth + 1, next) + '</div>' : '')
        + '</div>';
    }).join('');
  }
  /* 保留一个隐藏的「全部素材」节点：旧的渲染逻辑仍会去绑定它的点击事件 */
  return '<div class="folder-all" style="display:none"><button type="button" data-material-group="all"><span>▱</span><strong>全部素材</strong><small>' + product.materials.length + '</small></button></div>'
    + '<div class="asset-detail-group-heading">文件夹</div>'
    + (branch(null, 0, new Set()) || '<div class="opt-empty">暂无文件夹</div>');
};

/* 列表渲染：永远不按类型过滤 */
const simpleCardsBefore = renderMaterialCards;
renderMaterialCards = function (container, options) {
  return simpleCardsBefore(container, Object.assign({}, options || {}, { type: 'all' }));
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

/* 页面渲染后：隐藏类型/格式筛选，只留一个右上角上传入口 + 视频号上传 */
const simpleLibraryBefore = renderMaterialLibrary;
renderMaterialLibrary = function () {
  materialType = 'all';
  simpleEnsureFolder();
  simpleLibraryBefore();
  const page = root.querySelector('.asset-page');
  if (!page) return;
  materialType = 'all';
  page.querySelectorAll('.asset-default-types,[aria-label="筛选素材类型"],.asset-format-filter,.folder-type-hint').forEach(el => el.remove());
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
};

/* 引用素材库弹窗：去掉类型/格式筛选，列表始终全部素材 */
const simplePickerBefore = materialLibrary;
materialLibrary = function (editor, initialType) {
  simplePickerBefore(editor, 'all');
  if (!editor || !materialType) return;
  const m = dialogs.lastElementChild;
  if (!m) return;
  m.querySelectorAll('[aria-label="引用素材类型"],.asset-format-filter').forEach(el => el.remove());
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
