/* 社群动作：在【新增/编辑消息节点】中扩展社群发送动作，并按所选动作动态联动表单字段。
   需求来源：《销转期建群与群聊sop需求》三、消息节点发送动作扩展与表单联动。 */
const COMMUNITY_ACTION_IDS = ['pm', 'group', 'group_at_all', 'group_notice', 'create_group', 'rename_group', 'dissolve_group'];
const COMMUNITY_ACTIONS = [
  { id: 'pm', label: '私信1v1' },
  { id: 'group', label: '社群普通发送' },
  { id: 'group_at_all', label: '社群@ALL' },
  { id: 'group_notice', label: '群公告' },
  { id: 'create_group', label: '建群' },
  { id: 'rename_group', label: '改群名' },
  { id: 'dissolve_group', label: '解散群聊' }
];
/* 三个社群发送类动作：需要选择已有群聊、有话术与素材、按群数估算。 */
const COMMUNITY_GROUP_SEND = new Set(['group', 'group_at_all', 'group_notice']);
/* 三个静默/群管理动作：无话术与素材。 */
const COMMUNITY_SILENT = new Set(['create_group', 'rename_group', 'dissolve_group']);
const COMMUNITY_HINTS = {
  pm: '按添加好友时间与选中/排除标签圈选客户，逐人私信发送。',
  group: '向所选群聊发送一条普通消息，不在群内产生额外提醒。',
  group_at_all: '在群内发送消息并@所有人，会在群内产生强提醒。',
  group_notice: '更新所选群聊的群公告，新公告会替换当前群公告。',
  create_group: '按客户范围与产品线标签自动建群，并把对应客户拉进对应产品群。',
  rename_group: '修改所选群聊的群名称，不会在群内发送任何消息。',
  dissolve_group: '解散所选群聊，群内成员无法继续发言，操作不可恢复。'
};
/* 建群按产品线分别建群：APP类产品线…打卡群，图书类产品线…学习群（见需求二·群聊名称）。 */
const COMMUNITY_PRODUCT_LINES = [
  { product: '悦读小达人', category: 'APP类产品线', suffix: '打卡群' },
  { product: '单词拼读王', category: 'APP类产品线', suffix: '打卡群' },
  { product: '1500词', category: '图书类产品线', suffix: '学习群' },
  { product: '100篇', category: '图书类产品线', suffix: '学习群' }
];
function communityGroupNameFor(product) {
  const line = COMMUNITY_PRODUCT_LINES.find(x => x.product === product);
  return line ? '雪梨老师' + line.product + line.suffix : '';
}
/* 建群清单 = 客户范围 ∩ 产品通用渠道标签：命中哪个产品线就给哪个产品线建群；
   同一客户同时命中多条产品线标签时，会同时进入对应的多个群。 */
function communityBuildStats(node) {
  const sales = (periods[activeSop.period] || {}).sales || [];
  const products = COMMUNITY_PRODUCT_LINES.map(p => p.product);
  const counts = new Map();
  let matched = 0, multi = 0, joined = 0;
  for (let si = 0; si < sales.length; si++) {
    for (let i = 0; i < 120; i++) {
      const date = new Date('2026-10-01T08:00:00+08:00');
      date.setDate(date.getDate() + i % 28);
      const added = date.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).slice(0, 10);
      if ((node.friendStart && added < node.friendStart.slice(0, 10)) || (node.friendEnd && added > node.friendEnd.slice(0, 10))) continue;
      const tags = [];
      if (i % 3 === 0) tags.push('承诺到课');
      if (i % 4 === 0) tags.push('已到课');
      if (i % 11 === 0) tags.push('勿扰');
      if (i % 13 === 0) tags.push('非推广员');
      if (i % 7 === 0) tags.push('已购');
      if (node.include && node.include.length && !matchesAudienceTags(tags, node.include, node.includeLogic)) continue;
      if (node.exclude && node.exclude.length && matchesAudienceTags(tags, node.exclude, node.excludeLogic)) continue;
      /* 演示数据：约 1/9 的客户没有产品通用渠道标签，不会被拉进任何产品群；约 1/5 同时带两条产品线标签 */
      const key = i + si;
      const owned = [];
      if (key % 9 !== 0) {
        owned.push(products[key % 4]);
        if (key % 5 === 0) owned.push(products[(key % 4 + 2) % 4]);
      }
      if (owned.length) {
        matched++;
        joined += owned.length;
        if (owned.length > 1) multi++;
        owned.forEach(p => counts.set(p, (counts.get(p) || 0) + 1));
      }
    }
  }
  const groups = COMMUNITY_PRODUCT_LINES
    .map(p => ({ product: p.product, category: p.category, name: communityGroupNameFor(p.product), count: counts.get(p.product) || 0 }))
    .filter(g => g.count > 0);
  return { groups, matched, multi, joined };
}
const COMMUNITY_NOTICE_MAX = 2000;
const COMMUNITY_GROUP_MEMBER_LIMIT = 500;
const COMMUNITY_GROUP_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.1"></circle><path d="M3.2 19.2c0-3.1 2.6-5.2 5.8-5.2s5.8 2.1 5.8 5.2"></path><circle cx="17.2" cy="9.2" r="2.3"></circle><path d="M15.4 14.6c2.6.2 4.6 1.9 4.6 4.6"></path></svg>';

function communityNormalizeAction(value) {
  const id = String(value == null ? '' : value).trim();
  if (COMMUNITY_ACTION_IDS.includes(id)) return id;
  if (id === '私信1v1' || id === '私信1V1' || id === '私信' || id === '全量发送') return 'pm';
  return 'pm';
}
function communityMeta(id) { return COMMUNITY_ACTIONS.find(a => a.id === communityNormalizeAction(id)) || COMMUNITY_ACTIONS[0]; }
function communityLabel(id) { return communityMeta(id).label; }
function communityIsGroupSend(id) { return COMMUNITY_GROUP_SEND.has(communityNormalizeAction(id)); }
function communityNeedsGroup(id) { const a = communityNormalizeAction(id); return COMMUNITY_GROUP_SEND.has(a) || a === 'rename_group' || a === 'dissolve_group'; }
function communityNeedsText(id) { const a = communityNormalizeAction(id); return a === 'pm' || COMMUNITY_GROUP_SEND.has(a); }
function communityNeedsAudience(id) { const a = communityNormalizeAction(id); return a === 'pm' || a === 'create_group'; }
/* 建群先用添加好友时间框定客户总范围，因此好友时间对建群同样生效。 */
function communityNeedsFriendTime(id) { const a = communityNormalizeAction(id); return a === 'pm' || a === 'create_group'; }
/* 只有私信与建群估算人数；社群发送类与群改名、解散群聊不展示人数/群数。 */
function communityNeedsEstimate(id) { const a = communityNormalizeAction(id); return a === 'pm' || a === 'create_group'; }
function communityNeedsNewGroupName(id) { return communityNormalizeAction(id) === 'rename_group'; }
function communityNeedsBuildList(id) { return communityNormalizeAction(id) === 'create_group'; }
function communityActionTone(id) {
  const a = communityNormalizeAction(id);
  if (a === 'pm') return 'is-private';
  if (a === 'dissolve_group') return 'is-danger';
  if (COMMUNITY_SILENT.has(a)) return 'is-silent';
  return 'is-community';
}
/* 建群已改为先按添加好友时间框定范围，因此与私信共用同一套估算口径。 */
function communityEstimate(node) { return estimate(node); }
function communityGroupList(node) { return Array.isArray(node && node.groups) ? node.groups : []; }
/* 列表/快照里“话术内容”列：只有带话术的动作才展示内容，建群／改群名／解散群聊一律不展示。 */
function communityContentTitle(node) {
  const id = communityNormalizeAction(node && node.action);
  if (communityNeedsText(id)) return (node && node.text) || '';
  return '';
}
/* 往期数据/详情里的素材列：静默动作没有素材。 */
function communityMaterialCell(node) { return communityNeedsText(node && node.action) ? String(Number(node.materialCount || 0)) : '—'; }
function communityEstimateCell(node) {
  const id = communityNormalizeAction(node && node.action);
  if (id === 'pm') return '<span class="opt-estimate" title="基于演示客户数据估算">' + communityEstimate(node).total + '人</span>';
  if (id === 'create_group') {
    const fixed = Array.isArray(node && node.buildGroups) ? node.buildGroups : communityBuildStats(node).groups;
    const matched = Number.isFinite(node && node.buildMatched) ? node.buildMatched : communityBuildStats(node).matched;
    const tip = (fixed.length ? '将建群：' + fixed.map(g => g.name + '（' + g.count + '人）').join('、') : '当前范围内没有可建群的产品线') + ' · 单群上限 ' + COMMUNITY_GROUP_MEMBER_LIMIT + ' 人';
    return '<span class="opt-estimate" title="' + escapeText(tip) + '">' + matched + '人</span>';
  }
  return '<span class="opt-estimate is-empty" title="该动作不展示人数/群数估算">—</span>';
}

/* 演示用企微群列表：覆盖需求文档里的四条产品线，另含第二群与通用群，便于验证搜索与多选。 */
function communityDemoGroups() {
  if (communityDemoGroups.cache) return communityDemoGroups.cache;
  communityDemoGroups.cache = [
    { id: 'g-xdr-1', name: '雪梨老师悦读小达人打卡群', product: '悦读小达人', members: 486, owner: '销售甲' },
    { id: 'g-dcpd-1', name: '雪梨老师单词拼读王打卡群', product: '单词拼读王', members: 412, owner: '销售乙' },
    { id: 'g-1500-1', name: '雪梨老师1500词学习群', product: '1500词', members: 498, owner: '销售丙' },
    { id: 'g-100p-1', name: '雪梨老师100篇学习群', product: '100篇', members: 377, owner: '销售丁' },
    { id: 'g-xdr-2', name: '雪梨老师悦读小达人打卡群（2群）', product: '悦读小达人', members: 301, owner: '销售戊' },
    { id: 'g-1500-2', name: '雪梨老师1500词学习群（2群）', product: '1500词', members: 265, owner: '销售己' },
    { id: 'g-after', name: '雪梨老师售后答疑群', product: '通用', members: 128, owner: '销售庚' }
  ];
  return communityDemoGroups.cache;
}

function communityPickerModal(m, ctx) {
  const single = draft.action === 'rename_group' || draft.action === 'dissolve_group';
  const pool = communityDemoGroups();
  const chosen = new Set(communityGroupList(draft).map(g => g.id));
  const box = modal(captured.stage, '选择群聊');
  if (!box) return;
  box.classList.add('opt-group-modal');
  const body = box.querySelector('.el-dialog__body');
  body.innerHTML = '<p class="opt-muted">' + (single ? '该动作只能选择 1 个群聊。' : '可选择一个或多个目标群聊。') + '群名称会作为变量 <code>{{group_name}}</code> 写入该消息节点，发送时精准定向到所选群。演示群列表由接口返回，正式版对接企微群列表。</p><div class="opt-group-search"><input class="local-input" aria-label="搜索群聊名称" placeholder="搜索群名称或产品线"></div><div class="opt-group-list" role="group" aria-label="群聊列表"></div><div class="opt-group-empty-tip opt-muted" hidden>没有匹配的群聊</div><div class="opt-group-picker-count opt-muted">已选 0个群</div>';
  const list = body.querySelector('.opt-group-list');
  const search = body.querySelector('[aria-label="搜索群聊名称"]');
  const emptyTip = body.querySelector('.opt-group-empty-tip');
  const counter = body.querySelector('.opt-group-picker-count');
  const paint = () => {
    const keyword = search.value.trim();
    const rows = pool.filter(g => !keyword || g.name.includes(keyword) || g.product.includes(keyword));
    list.innerHTML = rows.map(g => '<label class="opt-group-row"><input type="' + (single ? 'radio' : 'checkbox') + '" name="opt-group-pick" value="' + escapeText(g.id) + '"' + (chosen.has(g.id) ? ' checked' : '') + '><span class="opt-group-icon">' + COMMUNITY_GROUP_ICON + '</span><span class="opt-group-main"><strong>' + escapeText(g.name) + '<span class="opt-group-badge">' + escapeText(g.product) + '</span></strong><small>' + g.members + '人 · 群主 ' + escapeText(g.owner) + ' · 企微群</small></span></label>').join('');
    emptyTip.hidden = rows.length > 0;
    counter.textContent = '已选 ' + chosen.size + '个群';
    list.querySelectorAll('input').forEach(input => {
      input.onchange = () => {
        if (single) { chosen.clear(); if (input.checked) chosen.add(input.value); }
        else if (input.checked) chosen.add(input.value);
        else chosen.delete(input.value);
        counter.textContent = '已选 ' + chosen.size + '个群';
      };
    });
  };
  search.oninput = paint;
  paint();
  buttons(box, '取消')[0].onclick = () => box.remove();
  const confirm = buttons(box, '保存')[0];
  confirm.textContent = '确认选择';
  confirm.onclick = () => {
    draft.groups = pool.filter(g => chosen.has(g.id)).map(g => ({ id: g.id, name: g.name, members: g.members, product: g.product }));
    box.remove();
    communityRenderGroups(m, ctx);
    updateEstimate(m);
  };
}

function communityRenderGroups(m, ctx) {
  const list = communityGroupList(draft);
  ctx.groupSelected.innerHTML = list.length
    ? list.map(g => '<span class="opt-group-chip"><span class="opt-group-icon">' + COMMUNITY_GROUP_ICON + '</span><span>' + escapeText(g.name) + '</span><button type="button" aria-label="移除群聊 ' + escapeText(g.name) + '">×</button></span>').join('')
    : '<span class="opt-group-empty-hint">' + (draft.action === 'create_group' ? '建群无需选择已有群聊' : '尚未选择群聊，点击右侧按钮选择') + '</span>';
  if (list.length) ctx.groupSelected.querySelectorAll('button').forEach((b, i) => { b.onclick = () => { if (b.disabled) return; draft.groups.splice(i, 1); communityRenderGroups(m, ctx); updateEstimate(m); }; });
  ctx.groupPickBtn.textContent = list.length ? '更换群聊' : '选择群聊';
}

/* 建群清单：只读预览，随客户范围（好友时间 + 标签）实时重算。 */
function communityRenderBuildPreview(m, stats) {
  const ctx = m.__community;
  if (!ctx || !ctx.buildList || ctx.buildList.style.display === 'none') return;
  stats = stats || communityBuildStats(draft);
  const total = communityEstimate(draft).total;
  const rows = stats.groups.map(g => {
    const over = g.count > COMMUNITY_GROUP_MEMBER_LIMIT;
    return '<tr><td class="opt-build-product"><strong>' + escapeText(g.product) + '</strong><small>' + escapeText(g.category) + '</small></td>'
      + '<td class="opt-build-name">' + escapeText(g.name) + '</td>'
      + '<td class="opt-build-count' + (over ? ' is-over' : '') + '">' + g.count + '人' + (over ? '<em>超出 ' + COMMUNITY_GROUP_MEMBER_LIMIT + ' 人上限</em>' : '') + '</td></tr>';
  }).join('');
  const unmatched = total - stats.matched;
  ctx.buildList.innerHTML = '<p class="opt-build-note">系统按客户范围（添加好友时间 + 选中／排除标签）圈定客户，再按客户持有的<b>产品通用渠道标签</b>分别建群：一条产品线建一个群，命中该产品线标签的客户进入对应群；<b>同一客户同时命中多条产品线标签时，会同时进入对应的多个群</b>。群名按「雪梨老师{产品线名称}打卡群／学习群」自动生成。</p>'
    + (stats.groups.length
      ? '<table class="opt-build-table"><thead><tr><th>产品线</th><th>群名称</th><th>入群人数</th></tr></thead><tbody>' + rows + '</tbody></table>'
      : '<div class="opt-build-empty">当前范围内没有可建群的产品线，请放宽添加好友时间或调整标签。</div>')
    + (stats.groups.length ? '<p class="opt-build-tip">共 ' + stats.matched + ' 人会被拉群，其中 ' + stats.multi + ' 人同时带多条产品线标签，会同时进入多个群（群内人数合计 ' + stats.joined + ' 人次）。</p>' : '')
    + (unmatched > 0 ? '<p class="opt-build-tip">范围内另有 ' + unmatched + ' 人未带产品线标签，不会进入任何产品群。</p>' : '')
    + '<p class="opt-build-tip">单群上限 ' + COMMUNITY_GROUP_MEMBER_LIMIT + ' 人，超出部分不会入群。群名为规则自动生成，无需手工填写。</p>';
  if (ctx.newGroupHint) ctx.newGroupHint.textContent = stats.groups.length ? '将自动建立 ' + stats.groups.length + ' 个产品群，创建后可在群管理查看。' : '';
}

/* 预计触发人数 的口径随动作切换。 */
updateEstimate = function (m) {
  const box = m.querySelector('.opt-draft-estimate');
  if (!box) return;
  const action = draft.action;
  if (action === 'pm') {
    const e = communityEstimate(draft);
    const invalid = draft.friendStart && draft.friendEnd && draft.friendStart > draft.friendEnd;
    box.innerHTML = invalid ? '<span class="opt-error">开始日期不能晚于结束日期</span>' : '<span>预计触发人数 <strong>' + e.total + '人</strong></span><span>添加好友时间筛选后 ' + e.base + '人 · 演示估算</span>';
    return;
  }
  if (communityIsGroupSend(action)) {
    /* 社群发送只看群聊，不展示人数/群数估算 */
    box.innerHTML = '';
    return;
  }
  if (action === 'create_group') {
    const e = communityEstimate(draft);
    const stats = communityBuildStats(draft);
    const invalid = draft.friendStart && draft.friendEnd && draft.friendStart > draft.friendEnd;
    const unmatched = e.total - stats.matched;
    box.innerHTML = invalid ? '<span class="opt-error">开始日期不能晚于结束日期</span>'
      : '<span>预计拉群人数 <strong>' + stats.matched + '人</strong></span><span>范围内客户 ' + e.total + ' 人' + (unmatched > 0 ? ' · ' + unmatched + ' 人未带产品线标签不入群' : '') + ' · 演示估算</span>';
    communityRenderBuildPreview(m, stats);
    return;
  }
  box.innerHTML = '';
};

function communityApplyEditorLayout(m, ctx, readOnly) {
  const action = draft.action;
  ctx.hint.textContent = COMMUNITY_HINTS[action] || '';
  if (ctx.audienceLabel) ctx.audienceLabel.textContent = action === 'pm' ? '发送人群' : action === 'create_group' ? '拉群对象' : '目标群聊';
  ctx.picker.style.display = communityNeedsGroup(action) ? '' : 'none';
  communityRenderGroups(m, ctx);
  const showTags = communityNeedsAudience(action);
  m.querySelectorAll('.audience-section').forEach(s => { s.style.display = showTags ? '' : 'none'; });
  m.querySelectorAll('.opt-tag-hint').forEach(s => { s.style.display = showTags ? '' : 'none'; });
  if (ctx.friend) ctx.friend.style.display = communityNeedsFriendTime(action) ? '' : 'none';
  if (ctx.estimate) ctx.estimate.style.display = communityNeedsEstimate(action) ? '' : 'none';
  if (ctx.composer) ctx.composer.style.display = communityNeedsText(action) ? '' : 'none';
  if (ctx.composerItem) ctx.composerItem.style.display = communityNeedsText(action) ? '' : 'none';
  ctx.atAll.style.display = action === 'group_at_all' ? '' : 'none';
  ctx.notice.style.display = action === 'group_notice' ? '' : 'none';
  const silent = COMMUNITY_SILENT.has(action);
  ctx.actionNote.style.display = silent ? '' : 'none';
  if (silent) {
    const silentText = action === 'create_group' ? '<span>ⓘ</span><span><strong>建群是静默动作：</strong>只按客户范围与产品线标签建群拉人，不产生任何群消息。系统用添加好友时间与标签框定客户范围，再按客户的产品线标签分别建群并拉入对应客户。</span>'
      : action === 'rename_group' ? '<span>ⓘ</span><span><strong>改群名不会在群内发送任何消息：</strong>只修改群名称，群内历史消息与成员不受影响。</span>'
        : '<span>⚠</span><span><strong>解散群聊属高危动作：</strong>保存时需二次确认，解散后群聊不可恢复。</span>';
    ctx.actionNote.className = 'opt-action-alert ' + (action === 'dissolve_group' ? 'warning' : 'info') + ' opt-action-note';
    ctx.actionNote.innerHTML = silentText;
  }
  const needNames = communityNeedsNewGroupName(action) || communityNeedsBuildList(action);
  ctx.newGroupItem.style.display = needNames ? '' : 'none';
  const buildList = communityNeedsBuildList(action);
  ctx.newGroupLabel.textContent = buildList ? '自动建群清单' : '新群名称';
  ctx.newGroupInput.style.display = buildList ? 'none' : '';
  ctx.buildList.style.display = buildList ? '' : 'none';
  if (!buildList) ctx.newGroupHint.textContent = '新群名称会覆盖当前群名；群内历史消息与成员不受影响。';
  if (ctx.textarea) {
    const notice = action === 'group_notice';
    ctx.textarea.maxLength = notice ? COMMUNITY_NOTICE_MAX : 10000;
    ctx.textarea.placeholder = notice ? '请输入群公告内容，支持变量；超出 ' + COMMUNITY_NOTICE_MAX + ' 字的部分将被截断' : '请输入节点话术，可保留变量占位符';
    try { if (typeof ctx.textarea.oninput === 'function') ctx.textarea.oninput(); } catch (e) { /* 字数计数器缺失时忽略 */ }
  }
  if (ctx.groupVar) ctx.groupVar.style.display = communityNeedsGroup(action) ? '' : 'none';
  updateEstimate(m);
}

function communityConfirmDissolve(onConfirm) {
  const box = modal(captured.stage, '解散群聊 · 二次确认');
  if (!box) return;
  box.classList.add('opt-danger-confirm');
  const groups = communityGroupList(draft);
  box.querySelector('.el-dialog__body').innerHTML = '<div class="opt-danger-box"><strong>该动作不可恢复</strong>即将解散 ' + (groups.length ? '「' + escapeText(groups.map(g => g.name).join('、')) + '」' : '所选群聊') + '，群内成员将无法继续在群内发言，历史群数据仅可保留只读记录。<br>请在下框输入 <b>确认解散</b> 后继续。</div><input class="local-input" aria-label="解散群聊确认输入" placeholder="请输入 确认解散">';
  const input = box.querySelector('[aria-label="解散群聊确认输入"]');
  const ok = buttons(box, '保存')[0];
  ok.textContent = '确认解散';
  ok.classList.add('el-button--danger');
  ok.disabled = true;
  buttons(box, '取消')[0].onclick = () => box.remove();
  input.oninput = () => { ok.disabled = input.value.trim() !== '确认解散'; };
  input.onkeydown = e => { if (e.key === 'Enter' && !ok.disabled) ok.click(); };
  ok.onclick = () => { if (ok.disabled) return; box.remove(); onConfirm(); };
  setTimeout(() => input.focus(), 30);
}

const communityEditNodeBefore = editNode;
editNode = function (i, readOnly = false) {
  communityEditNodeBefore(i, readOnly);
  const m = dialogs.lastElementChild;
  if (!m) return;
  const form = m.querySelector('form.node-editor');
  const select = m.querySelector('select[aria-label="发送动作"]');
  if (!form || !select) return;
  draft.action = communityNormalizeAction(draft.action);
  draft.groups = communityGroupList(draft).filter(g => g && g.id);
  draft.newGroupName = draft.newGroupName || '';
  const ctx = {};
  /* 发送动作：私信1v1 + 社群发送分组 */
  select.innerHTML = '<option value="pm">私信1v1</option><optgroup label="社群发送">' + COMMUNITY_ACTIONS.filter(a => a.id !== 'pm').map(a => '<option value="' + a.id + '">' + a.label + '</option>').join('') + '</optgroup>';
  select.value = draft.action;
  const hint = document.createElement('div');
  hint.className = 'opt-action-hint';
  select.closest('.el-form-item__content').append(hint);
  ctx.hint = hint;
  /* 发送人群：群聊选择控件放在最上方（原标签区域位置） */
  const audienceItem = Array.from(m.querySelectorAll('.el-form-item')).find(fi => (fi.querySelector('.el-form-item__label')?.textContent || '').trim() === '发送人群');
  const audience = m.querySelector('.audience-config');
  if (!audienceItem || !audience) return;
  const picker = document.createElement('div');
  picker.className = 'opt-group-picker';
  picker.innerHTML = '<div class="opt-group-picker-head"><span><strong>目标群聊</strong><span class="opt-group-required">必填</span></span><button type="button" class="el-button el-button--small opt-group-pick-btn">选择群聊</button></div><div class="opt-group-selected"></div><small class="opt-group-var-hint">群名称将作为变量 <code>{{group_name}}</code> 随消息下发，执行时精准定向到所选群。</small>';
  audience.prepend(picker);
  ctx.picker = picker;
  ctx.groupSelected = picker.querySelector('.opt-group-selected');
  ctx.groupPickBtn = picker.querySelector('.opt-group-pick-btn');
  ctx.groupPickBtn.onclick = () => { if (!readOnly) communityPickerModal(m, ctx); };
  ctx.audienceLabel = audienceItem.querySelector('.el-form-item__label');
  ctx.friend = m.querySelector('.opt-friend-time');
  ctx.estimate = m.querySelector('.opt-draft-estimate');
  /* 静默动作说明放在“发送人群”上方，话术/素材区整体隐藏时仍然可见 */
  const actionNote = document.createElement('div');
  actionNote.className = 'opt-action-alert info opt-action-note';
  audienceItem.before(actionNote);
  ctx.actionNote = actionNote;
  /* 新群名称（改群名）/ 自动建群清单（建群）：插在发送人群之后 */
  const newGroupItem = document.createElement('div');
  newGroupItem.className = 'el-form-item asterisk-left el-form-item--label-top opt-new-group-item';
  newGroupItem.innerHTML = '<label class="el-form-item__label">新群名称</label><div class="el-form-item__content"><input class="local-input opt-new-group-input" maxlength="64" aria-label="新群名称" placeholder="请输入新群名称，如：雪梨老师悦读小达人打卡群"><div class="opt-build-list"></div><small class="opt-field-hint"></small></div>';
  audienceItem.after(newGroupItem);
  ctx.newGroupItem = newGroupItem;
  ctx.newGroupLabel = newGroupItem.querySelector('.el-form-item__label');
  ctx.newGroupHint = newGroupItem.querySelector('.opt-field-hint');
  ctx.newGroupInput = newGroupItem.querySelector('.opt-new-group-input');
  ctx.buildList = newGroupItem.querySelector('.opt-build-list');
  ctx.newGroupInput.value = draft.newGroupName;
  ctx.newGroupInput.oninput = () => { draft.newGroupName = ctx.newGroupInput.value; };
  m.__community = ctx;
  /* 话术/素材组合区：插入动作警示与素材限制提示 */
  const composer = m.querySelector('.message-composer');
  if (composer) {
    ctx.composer = composer;
    /* 整行隐/显：只隐藏 .message-composer 会留下“话术内容”空标签 */
    ctx.composerItem = composer.closest('.el-form-item');
    ctx.textarea = composer.querySelector('textarea');
    /* 紧凑布局把话术 textarea 移出 .el-textarea 后，原字数计数器不再在 parentElement 下，
       直接调用原 oninput 会抛错；这里按弹窗范围重新绑定，保证字数与截断提示始终同步。 */
    if (ctx.textarea) {
      const counter = m.querySelector('.el-textarea .el-input__count');
      ctx.textarea.oninput = () => {
        if (counter && counter.isConnected) counter.textContent = ctx.textarea.value.length + ' / ' + ctx.textarea.maxLength;
      };
    }
    const makeAlert = (cls, html) => { const el = document.createElement('div'); el.className = 'opt-action-alert ' + cls; el.innerHTML = html; composer.insertBefore(el, composer.firstElementChild); return el; };
    ctx.atAll = makeAlert('warning', '<span>⚠</span><span><strong>注意：</strong>该动作将@群内所有成员，会触发强提醒，请谨慎使用。</span>');
    ctx.notice = makeAlert('info', '<span>ⓘ</span><span><strong>群公告字数限制：</strong>超出 ' + COMMUNITY_NOTICE_MAX + ' 字的部分将被截断。</span>');
    const shortcuts = composer.querySelector('.variable-shortcuts');
    if (shortcuts) {
      const groupVar = document.createElement('button');
      groupVar.type = 'button';
      groupVar.className = 'el-button el-button--primary el-button--small is-plain opt-group-var';
      groupVar.textContent = '群名称';
      groupVar.title = '插入 {{group_name}}，发送时替换为所选群名称';
      groupVar.onclick = () => {
        if (readOnly || !ctx.textarea) return;
        ctx.textarea.setRangeText('{{group_name}}', ctx.textarea.selectionStart, ctx.textarea.selectionEnd, 'end');
        if (typeof ctx.textarea.oninput === 'function') ctx.textarea.oninput();
        ctx.textarea.focus();
      };
      shortcuts.append(groupVar);
      ctx.groupVar = groupVar;
    }
  }
  select.onchange = () => {
    if (readOnly) return;
    draft.action = communityNormalizeAction(select.value);
    if (!communityNeedsAudience(draft.action)) { /* 标签数据保留，切回时仍可见 */ }
    communityApplyEditorLayout(m, ctx, readOnly);
  };
  communityApplyEditorLayout(m, ctx, readOnly);
  if (readOnly) {
    m.querySelectorAll('.opt-group-picker button,.opt-new-group-item input,.opt-new-group-item button,.opt-group-var').forEach(el => { el.disabled = true; });
    return;
  }
  /* 保存校验与高危二次确认：动作决定必填项，替代原“时间+话术”一刀切校验 */
  const save = buttons(m, '保存节点')[0];
  if (!save) return;
  save.onclick = () => {
    const time = m.querySelector('.time-control input');
    const noteArea = m.querySelectorAll('textarea')[1];
    if (!time || !time.value.trim()) return feedback('请填写节点时间');
    if (communityNeedsText(draft.action) && (!ctx.textarea || !ctx.textarea.value.trim())) return feedback(draft.action === 'group_notice' ? '请填写群公告内容' : '请填写话术内容');
    if (communityNeedsGroup(draft.action) && !communityGroupList(draft).length) return feedback(draft.action === 'dissolve_group' || draft.action === 'rename_group' ? '请选择目标群聊' : '请选择目标群聊后保存');
    if (communityNeedsBuildList(draft.action) && !communityBuildStats(draft).groups.length) return feedback('当前客户范围内没有可建群的产品线，请放宽添加好友时间或调整标签');
    if (communityNeedsNewGroupName(draft.action) && !String(draft.newGroupName || '').trim()) return feedback('请填写新群名称');
    if (draft.action === 'rename_group' && communityGroupList(draft).some(g => g.name === String(draft.newGroupName).trim())) return feedback('新群名称与当前群名相同，无需修改');
    if (communityNeedsFriendTime(draft.action) && draft.friendStart && draft.friendEnd && draft.friendStart > draft.friendEnd) return feedback('添加好友开始日期不能晚于结束日期');
    const relative = m.querySelector('.opt-relative');
    const offset = m.querySelector('[aria-label="偏移分钟"]');
    if (relative && relative.style.display !== 'none' && offset && (!Number.isFinite(Number(offset.value)) || Number(offset.value) < 0 || Number(offset.value) > 1440)) return feedback('请输入0至1440之间的分钟数');
    draft.time = time.value;
    draft.text = communityNeedsText(draft.action) ? (ctx.textarea ? ctx.textarea.value : '') : '';
    draft.note = noteArea ? noteArea.value : draft.note;
    if (!communityNeedsAudience(draft.action)) { draft.friendStart = ''; draft.friendEnd = ''; }
    /* 只保留当前动作用得到的字段，避免详情/快照里出现无关的群聊与群名 */
    if (!communityNeedsGroup(draft.action)) draft.groups = [];
    delete draft.productLines;
    if (draft.action !== 'rename_group') draft.newGroupName = '';
    /* 建群清单在保存时冻结，往期快照与详情读这份副本 */
    if (communityNeedsBuildList(draft.action)) {
      const stats = communityBuildStats(draft);
      draft.buildGroups = stats.groups.map(g => ({ product: g.product, name: g.name, count: g.count }));
      draft.buildMatched = stats.matched;
    } else { delete draft.buildGroups; delete draft.buildMatched; }
    const commit = () => {
      if (editIndex < 0) state[current].nodes.push(draft); else state[current].nodes[editIndex] = draft;
      persist();
      close();
      render();
      feedback(draft.action === 'pm' ? '已保存到本地副本' : '已保存「' + communityLabel(draft.action) + '」消息节点');
    };
    if (draft.action === 'dissolve_group') return communityConfirmDissolve(commit);
    commit();
  };
};

/* 列表与 SOP 详情沿用同一套动作文案。 */
const communityRenderMessagesBefore = renderMessages;
renderMessages = function (group) {
  communityRenderMessagesBefore(group);
  const table = root.querySelector('.message-list-table');
  if (!table) return;
  const heads = table.querySelectorAll('thead th');
  if (heads[6]) {
    heads[6].textContent = '预计触发人数';
    heads[6].title = '私信1v1 与建群按标签及添加好友时间估算人数；社群发送、改群名与解散群聊不估算';
  }
  const all = orderedMessages(group), pager = messagePaging(group);
  table.querySelectorAll('tbody tr[data-index]').forEach(row => {
    const node = all[(pager.page - 1) * pager.pageSize + Number(row.dataset.index)];
    if (!node) return;
    const cells = row.children;
    if (cells[2]) cells[2].innerHTML = '<span class="message-action-tag ' + communityActionTone(node.action) + '">' + escapeText(communityLabel(node.action)) + '</span>';
    if (cells[5]) { const title = communityContentTitle(node) || '—'; cells[5].innerHTML = '<div class="message-text' + (title === '—' ? ' is-empty' : '') + '" title="' + escapeText(title) + '">' + escapeText(title) + '</div>'; }
    if (cells[6]) cells[6].innerHTML = communityEstimateCell(node);
    if (cells[8]) cells[8].textContent = communityNeedsText(node.action) ? String(node.materialCount || 0) : '—';
  });
};
