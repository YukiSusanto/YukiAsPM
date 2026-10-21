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

function videoChannelGroups() { return (product.materialGroups || []).filter(g => g.kind === 'videochannel'); }
function videoChannelLinkTail(link) {
  const clean = String(link || '').split(/[?#]/)[0];
  return (clean.split('/').filter(Boolean).pop() || '').slice(0, 24);
}

function openVideoChannelUpload(targetGroup, onUploaded) {
  const groups = videoChannelGroups();
  const fixedGroup = targetGroup && targetGroup !== 'all' && groups.some(g => g.id === targetGroup) ? targetGroup : null;
  const groupField = fixedGroup
    ? '<div class="asset-upload-destination">上传到：<strong>' + escapeText(folderPath(fixedGroup)) + '</strong></div>'
    : field('放入分组', '<select class="local-select" aria-label="视频号素材分组">' + (groups.length
      ? groups.map(g => '<option value="' + escapeText(g.id) + '">' + escapeText(folderPath(g.id)) + '</option>').join('')
      : '<option value="">视频号未分组</option>') + '</select>');
  const body = '<p class="opt-muted">视频号素材通过链接下发，不需要上传文件；素材ID由后端生成。</p>'
    + field('原始链接', '<input class="local-input" aria-label="视频号原始链接" placeholder="请输入视频号动态原始链接">')
    + groupField
    + '<div class="asset-upload-error" role="status"></div>';
  const m = simpleModal('上传视频号素材', body, modal => {
    const link = ((modal.querySelector('[aria-label="视频号原始链接"]') || {}).value || '').trim();
    if (!link) {
      modal.querySelector('.asset-upload-error').textContent = '请填写原始链接';
      return feedback('请填写原始链接');
    }
    const groupSelect = modal.querySelector('[aria-label="视频号素材分组"]');
    const groupId = fixedGroup || (groupSelect && groupSelect.value) || 'ungrouped-videochannel';
    const tail = videoChannelLinkTail(link);
    const name = '视频号素材' + (tail ? ' · ' + tail : '');
    const asset = {
      id: 'video-channel-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      name,
      originalName: name,
      size: 0,
      mime: 'video/x-videochannel',
      kind: 'videochannel',
      sourceType: 'video-channel',
      /* 24 位占位ID（沿用原视频号占位样式 000…001），正式值由后端生成后覆盖 */
      videoChannelId: '00000000000000000000' + String((product.materials || []).filter(a => a.sourceType === 'video-channel' && a.videoChannelDemo).length + 1).padStart(4, '0'),
      videoChannelDemo: true,
      videoChannel: { link },
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

/* 列表：视频号素材只补一行原始链接（类型列已显示「视频号素材」） */
const videoChannelMarkupBefore = videoChannelIdMarkup;
videoChannelIdMarkup = function (asset) {
  const base = videoChannelMarkupBefore(asset);
  if (!asset || !asset.videoChannel) return base;
  const link = String(asset.videoChannel.link || '');
  const short = link.replace(/^https?:\/\//, '').slice(0, 32);
  const meta = '<div class="asset-vc-meta"><span class="asset-vc-link" title="' + escapeText(link) + '">' + escapeText(short || '未填写原始链接') + '</span></div>';
  return meta + base;
};

/* 预览：展示原始链接 */
const videoChannelPreviewBefore = previewMaterial;
previewMaterial = function (asset) {
  const result = videoChannelPreviewBefore(asset);
  if (!asset || !asset.videoChannel) return result;
  const vc = asset.videoChannel;
  setTimeout(() => {
    const m = dialogs.lastElementChild;
    const bodyEl = m && m.querySelector('.el-dialog__body');
    if (!bodyEl || bodyEl.querySelector('.asset-vc-detail')) return;
    const rows = [['原始链接', vc.link]].filter(([, v]) => v);
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
