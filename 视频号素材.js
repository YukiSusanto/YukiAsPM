/* 视频号素材：在素材库左侧分组里作为独立分类「视频号」，上传入口仍共用「上传素材」；
   在该分类下上传时改用视频号专用字段表单（链接型素材，不传文件）。 */
(function registerVideoChannelCategory() {
  const labelOrder = [['image', '全部图片'], ['video', '全部视频'], ['videochannel', '全部视频号'], ['audio', '全部音频'], ['document', '全部文档']];
  const kindOrder = [['image', '图片'], ['video', '视频'], ['videochannel', '视频号'], ['audio', '音频'], ['document', '文档']];
  const reorder = (target, entries) => {
    const extra = Object.keys(target).filter(k => !entries.some(([n]) => n === k)).map(k => [k, target[k]]);
    Object.keys(target).forEach(k => { delete target[k]; });
    entries.concat(extra).forEach(([k, v]) => { target[k] = v; });
  };
  if (typeof materialCategoryLabels === 'object') reorder(materialCategoryLabels, labelOrder);
  if (typeof materialKinds === 'object') reorder(materialKinds, kindOrder);
})();

const VIDEO_CHANNEL_TYPES = [
  { id: 'dynamic', label: '视频号动态' },
  { id: 'live', label: '视频号直播' }
];
const VIDEO_CHANNEL_FIELDS = [
  { key: 'title', label: '消息标题', max: 256, required: true, placeholder: '请输入企微消息中展示的标题' },
  { key: 'authorName', label: '作者昵称', required: true, placeholder: '请输入视频号作者昵称' },
  { key: 'avatarUrl', label: '作者头像', placeholder: '请输入作者头像地址' },
  { key: 'coverUrl', label: '封面地址', required: true, placeholder: '请输入视频或直播封面地址' },
  { key: 'description', label: '内容描述', max: 500, multiline: true, placeholder: '请输入视频号动态描述' },
  { key: 'link', label: '原始链接', required: true, placeholder: '请输入视频号动态原始链接' },
  { key: 'previewUrl', label: '预览链接', placeholder: '请输入预览链接' }
];

function videoChannelTypeLabel(id) {
  return (VIDEO_CHANNEL_TYPES.find(t => t.id === id) || VIDEO_CHANNEL_TYPES[0]).label;
}
function videoChannelGroups() { return (product.materialGroups || []).filter(g => g.kind === 'videochannel'); }
function videoChannelFieldMarkup(f) {
  const input = f.multiline
    ? '<textarea class="el-textarea__inner asset-vc-textarea" maxlength="' + f.max + '" aria-label="视频号' + f.label + '" placeholder="' + f.placeholder + '"></textarea>'
    : '<input class="local-input" ' + (f.max ? 'maxlength="' + f.max + '" ' : '') + 'aria-label="视频号' + f.label + '" placeholder="' + f.placeholder + '">';
  const counter = f.max ? '<div class="asset-vc-count">0 / ' + f.max + '</div>' : '';
  return '<div class="opt-field"><label>' + f.label + (f.required ? '<span class="asset-vc-required">*</span>' : '') + '</label>' + input + counter + '</div>';
}

function openVideoChannelUpload(targetGroup, onUploaded) {
  const groups = videoChannelGroups();
  const fixedGroup = targetGroup && targetGroup !== 'all' && groups.some(g => g.id === targetGroup) ? targetGroup : null;
  const groupField = fixedGroup
    ? '<div class="asset-upload-destination">上传到：<strong>' + escapeText(folderPath(fixedGroup)) + '</strong></div>'
    : field('放入分组', '<select class="local-select" aria-label="视频号素材分组">' + (groups.length
      ? groups.map(g => '<option value="' + escapeText(g.id) + '">' + escapeText(folderPath(g.id)) + '</option>').join('')
      : '<option value="">视频号未分组</option>') + '</select>');
  const body = '<p class="opt-muted">视频号素材通过链接下发，不需要上传文件；素材ID由后端生成。消息标题同时作为素材库内的识别名称。</p>'
    + field('内容类型', '<select class="local-select" aria-label="视频号内容类型">' + VIDEO_CHANNEL_TYPES.map(t => '<option value="' + t.id + '">' + t.label + '</option>').join('') + '</select>')
    + VIDEO_CHANNEL_FIELDS.map(videoChannelFieldMarkup).join('')
    + groupField
    + '<div class="asset-upload-error" role="status"></div>';
  const m = simpleModal('上传视频号素材', body, modal => {
    const data = {};
    VIDEO_CHANNEL_FIELDS.forEach(f => { data[f.key] = ((modal.querySelector('[aria-label="视频号' + f.label + '"]') || {}).value || '').trim(); });
    data.contentType = (modal.querySelector('[aria-label="视频号内容类型"]') || {}).value || 'dynamic';
    const missing = VIDEO_CHANNEL_FIELDS.filter(f => f.required && !data[f.key]);
    if (missing.length) {
      const text = '请填写：' + missing.map(f => f.label).join('、');
      modal.querySelector('.asset-upload-error').textContent = text;
      return feedback(text);
    }
    const groupSelect = modal.querySelector('[aria-label="视频号素材分组"]');
    const groupId = fixedGroup || (groupSelect && groupSelect.value) || 'ungrouped-videochannel';
    const asset = {
      id: 'video-channel-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      name: data.title,
      originalName: data.title,
      size: 0,
      mime: 'video/x-videochannel',
      kind: 'videochannel',
      sourceType: 'video-channel',
      /* 24 位占位ID（沿用原视频号占位样式 000…001），正式值由后端生成后覆盖 */
      videoChannelId: '00000000000000000000' + String((product.materials || []).filter(a => a.sourceType === 'video-channel' && a.videoChannelDemo).length + 1).padStart(4, '0'),
      videoChannelDemo: true,
      videoChannel: {
        contentType: data.contentType,
        contentTypeLabel: videoChannelTypeLabel(data.contentType),
        title: data.title,
        authorName: data.authorName,
        avatarUrl: data.avatarUrl,
        coverUrl: data.coverUrl,
        description: data.description,
        link: data.link,
        previewUrl: data.previewUrl
      },
      groupId,
      uploadedAt: new Date().toISOString()
    };
    modal.remove();
    document.body.style.overflow = '';
    product.materials = product.materials || [];
    product.materials.push(asset);
    if (typeof materialPersist === 'function' && !materialPersist()) {
      product.materials = product.materials.filter(a => a.id !== asset.id);
      feedback('保存失败，请检查浏览器存储空间');
      return;
    }
    if (onUploaded) { onUploaded([asset.id]); feedback('已上传视频号素材'); return; }
    materialGroup = groupId;
    materialType = 'videochannel';
    materialSearch = '';
    render();
    feedback('已上传视频号素材');
  }, '开始上传');
  m.classList.add('asset-upload-modal', 'asset-video-channel-modal');
  m.querySelectorAll('.asset-vc-count').forEach((counter, i) => {
    const def = VIDEO_CHANNEL_FIELDS.filter(f => f.max)[i];
    if (!def) return;
    const input = m.querySelector('[aria-label="视频号' + def.label + '"]');
    input.oninput = () => { counter.textContent = input.value.length + ' / ' + def.max; };
  });
}

/* 共用「上传素材」入口：只在该分类（含视频号分组）下切换为视频号表单 */
const videoChannelUploadBefore = uploadMaterial;
uploadMaterial = function (target, onUploaded, uploadKind) {
  const groupKind = (product.materialGroups.find(g => g.id === target) || {}).kind;
  const kind = groupKind || (uploadKind === 'all' ? null : uploadKind) || (typeof materialType === 'string' && materialType !== 'all' ? materialType : null);
  if (kind === 'videochannel') { openVideoChannelUpload(target, onUploaded); return; }
  return videoChannelUploadBefore(target, onUploaded, uploadKind);
};

/* 左侧分组图标：给「视频号」一个可区分的标记；「全部素材」总览下隐藏上传入口（上传必须落到具体分类/分组） */
const videoChannelRenderLibraryBefore = renderMaterialLibrary;
renderMaterialLibrary = function () {
  videoChannelRenderLibraryBefore();
  const page = root.querySelector('.asset-page');
  if (!page) return;
  const overview = (typeof materialType === 'string' ? materialType : 'all') === 'all';
  page.querySelectorAll('button').forEach(b => {
    if (b.textContent.trim() !== '上传素材') return;
    b.style.display = overview ? 'none' : '';
  });
  const icon = page.querySelector('[data-material-type="videochannel"] span');
  if (icon) icon.textContent = '◎';
  const count = page.querySelector('[data-material-type="videochannel"] small');
  if (count) count.textContent = product.materials.filter(a => a.kind === 'videochannel').length;
};

/* 列表：视频号素材展示类型、作者与封面标记 */
const videoChannelMarkupBefore = videoChannelIdMarkup;
videoChannelIdMarkup = function (asset) {
  const base = videoChannelMarkupBefore(asset);
  if (!asset || !asset.videoChannel) return base;
  const vc = asset.videoChannel;
  const meta = '<div class="asset-vc-meta"><span class="asset-vc-type">' + escapeText(vc.contentTypeLabel) + '</span>'
    + '<span>作者：' + escapeText(vc.authorName || '—') + '</span>'
    + (vc.coverUrl ? '<span class="asset-vc-has-cover" title="' + escapeText(vc.coverUrl) + '">含封面</span>' : '')
    + '</div>';
  return meta + base;
};

/* 预览：展示视频号字段 */
const videoChannelPreviewBefore = previewMaterial;
previewMaterial = function (asset) {
  const result = videoChannelPreviewBefore(asset);
  if (!asset || !asset.videoChannel) return result;
  const vc = asset.videoChannel;
  setTimeout(() => {
    const m = dialogs.lastElementChild;
    const bodyEl = m && m.querySelector('.el-dialog__body');
    if (!bodyEl || bodyEl.querySelector('.asset-vc-detail')) return;
    const rows = [
      ['内容类型', vc.contentTypeLabel],
      ['消息标题', vc.title],
      ['作者昵称', vc.authorName],
      ['作者头像', vc.avatarUrl],
      ['封面地址', vc.coverUrl],
      ['内容描述', vc.description],
      ['原始链接', vc.link],
      ['预览链接', vc.previewUrl]
    ].filter(([, v]) => v);
    const box = document.createElement('div');
    box.className = 'asset-vc-detail';
    box.innerHTML = '<h4>视频号信息</h4><dl>' + rows.map(([k, v]) => '<dt>' + escapeText(k) + '</dt><dd>' + escapeText(v) + '</dd>').join('') + '</dl>';
    bodyEl.append(box);
  }, 0);
  return result;
};

/* 话术区素材入口：给「全部视频号」一个可区分的图标 */
const videoChannelEditNodeBefore = editNode;
editNode = function (i, readOnly = false) {
  videoChannelEditNodeBefore(i, readOnly);
  const m = dialogs.lastElementChild;
  if (!m) return;
  m.querySelectorAll('.material-type-shortcuts button').forEach((b, idx) => {
    if (Object.keys(materialCategoryLabels)[idx] !== 'videochannel') return;
    const icon = b.querySelector('.composer-tool-icon');
    if (icon) icon.textContent = '◎';
    b.title = '引用视频号素材';
  });
};
