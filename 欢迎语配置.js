/* 入群欢迎语配置：按产品线维护入群欢迎语（4 条产品线固定），支持快捷插入变量与引用素材库。
   入口：消息区右上角「入群欢迎语配置」，以及群聊节点里选择「建群」时的同名按钮。 */
const WELCOME_DEFAULT_TEXT = {
  '悦读小达人': '欢迎加入雪梨老师悦读小达人打卡群！本周开始每天完成 1 个跟读任务发到群里，老师会逐一点评，坚持打卡还有小奖励～',
  '单词拼读王': '欢迎加入雪梨老师单词拼读王打卡群！每周会发 3 个拼读任务，完成后发到群里即可获得点评，记得关注群公告～',
  '1500词': '欢迎加入雪梨老师1500词学习群！本周会下发词汇清单和带读音频，跟着群里节奏走，有疑问随时在群里问老师～',
  '100篇': '欢迎加入雪梨老师100篇学习群！精读材料会发在群里，建议每天完成 1 篇并打卡，老师会挑典型问题统一讲解～'
};
const WELCOME_LIVE_FIELDS = [['直播名称', 'name'], ['直播日期', 'date'], ['直播时间', 'time'], ['直播链接', 'url']];

function welcomeProducts() { return COMMUNITY_PRODUCT_LINES.map(p => p.product); }
function welcomeStore() {
  product.welcomeMessages = product.welcomeMessages && typeof product.welcomeMessages === 'object' ? product.welcomeMessages : {};
  product.welcomeMaterials = product.welcomeMaterials && typeof product.welcomeMaterials === 'object' ? product.welcomeMaterials : {};
  welcomeProducts().forEach(p => {
    if (typeof product.welcomeMessages[p] !== 'string') product.welcomeMessages[p] = WELCOME_DEFAULT_TEXT[p] || '';
    if (!Array.isArray(product.welcomeMaterials[p])) product.welcomeMaterials[p] = [];
  });
  return { messages: product.welcomeMessages, materials: product.welcomeMaterials };
}

/* 素材选择：直接列出简单文件系统里的全部素材 */
function openWelcomeMaterialPicker(selected, onConfirm) {
  const chosen = new Set((selected || []).map(a => a.id));
  const box = modal(captured.stage, '选择素材');
  if (!box) return;
  box.classList.add('welcome-material-modal');
  const body = box.querySelector('.el-dialog__body');
  body.innerHTML = '<div class="opt-group-search"><input class="local-input" aria-label="搜索素材名称" placeholder="搜索素材名称或文件夹"></div>'
    + '<div class="welcome-material-list" role="group" aria-label="素材列表"></div>'
    + '<div class="opt-group-empty-tip opt-muted" hidden>没有匹配的素材</div>'
    + '<div class="opt-group-picker-count opt-muted">已选 0 项</div>';
  const list = body.querySelector('.welcome-material-list');
  const search = body.querySelector('[aria-label="搜索素材名称"]');
  const emptyTip = body.querySelector('.opt-group-empty-tip');
  const counter = body.querySelector('.opt-group-picker-count');
  const paint = () => {
    const keyword = search.value.trim();
    const items = (product.materials || []).filter(a => !keyword || String(a.name).includes(keyword) || folderPath(a.groupId || '').includes(keyword));
    list.innerHTML = items.map(a => '<label class="welcome-material-row"><input type="checkbox" value="' + escapeText(a.id) + '"' + (chosen.has(a.id) ? ' checked' : '') + '>'
      + '<span class="material-ref-icon">' + materialIcon(a.kind) + '</span>'
      + '<span class="welcome-material-main"><strong>' + escapeText(a.name) + '</strong><small>' + materialSize(a.size) + (a.groupId ? ' · ' + escapeText(folderPath(a.groupId)) : '') + '</small></span></label>').join('');
    emptyTip.hidden = items.length > 0;
    counter.textContent = '已选 ' + chosen.size + ' 项';
    list.querySelectorAll('input').forEach(input => {
      input.onchange = () => {
        if (input.checked) chosen.add(input.value); else chosen.delete(input.value);
        counter.textContent = '已选 ' + chosen.size + ' 项';
      };
    });
  };
  search.oninput = paint;
  paint();
  buttons(box, '取消')[0].onclick = () => box.remove();
  const save = buttons(box, '保存')[0];
  save.textContent = '确认引用';
  save.onclick = () => {
    const picked = (product.materials || []).filter(a => chosen.has(a.id)).map(a => ({ id: a.id, name: a.name, mime: a.mime, size: a.size }));
    box.remove();
    if (!dialogs.children.length) document.body.style.overflow = '';
    onConfirm(picked);
  };
}

function openWelcomeMessageConfig(initialProduct) {
  const store = welcomeStore();
  const products = welcomeProducts();
  let active = products.includes(initialProduct) ? initialProduct : products[0];
  const box = modal(captured.stage, '入群欢迎语配置');
  if (!box) return;
  box.classList.add('welcome-config-modal');
  const body = box.querySelector('.el-dialog__body');
  body.innerHTML = '<p class="opt-muted">建群时按客户命中的产品线，把对应入群欢迎语发到该产品群；每条产品线各自维护话术与素材。</p>'
    + '<div class="welcome-tabs" role="tablist" aria-label="产品线"></div>'
    + '<div class="opt-field"><label>入群欢迎语话术</label>'
    + '<div class="variable-shortcuts welcome-shortcuts"><span class="variable-shortcuts-label">快捷插入：</span></div>'
    + '<textarea class="el-textarea__inner welcome-textarea" maxlength="2000" aria-label="入群欢迎语话术" placeholder="请输入该产品线的入群欢迎语"></textarea>'
    + '<div class="asset-vc-count welcome-count">0 / 2000</div></div>'
    + '<div class="welcome-material-field"><label>素材</label>'
    + '<div class="welcome-material-actions"><button type="button" class="el-button el-button--primary is-plain welcome-material-btn">素材库</button><span class="opt-muted welcome-material-tip">从素材库引用，发送时只发文件本身</span></div>'
    + '<div class="welcome-material-chips"></div></div>';
  const tabs = body.querySelector('.welcome-tabs');
  const textarea = body.querySelector('[aria-label="入群欢迎语话术"]');
  const counter = body.querySelector('.welcome-count');
  const shortcuts = body.querySelector('.welcome-shortcuts');
  const chips = body.querySelector('.welcome-material-chips');
  const insertToken = token => {
    textarea.setRangeText(token, textarea.selectionStart, textarea.selectionEnd, 'end');
    counter.textContent = textarea.value.length + ' / 2000';
    textarea.focus();
  };
  /* 快捷插入：只保留直播场次二级菜单 */
  [1, 2, 3].forEach(n => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'el-button el-button--primary el-button--small is-plain welcome-live-btn';
    button.textContent = '直播场次' + n + ' ▾';
    button.setAttribute('aria-haspopup', 'menu');
    button.onclick = () => {
      document.querySelector('.welcome-live-menu')?.remove();
      const menu = document.createElement('div');
      menu.className = 'local-menu welcome-live-menu';
      menu.setAttribute('role', 'menu');
      const rect = button.getBoundingClientRect();
      menu.style.left = rect.left + 'px';
      menu.style.top = rect.bottom + 'px';
      WELCOME_LIVE_FIELDS.forEach(([label, key]) => {
        const choice = document.createElement('button');
        choice.type = 'button';
        choice.textContent = label;
        choice.setAttribute('role', 'menuitem');
        choice.onclick = () => { insertToken('{{live' + n + '_' + key + '}}'); menu.remove(); };
        menu.append(choice);
      });
      document.body.append(menu);
      setTimeout(() => document.addEventListener('click', e => { if (!menu.contains(e.target)) menu.remove(); }, { once: true }), 0);
    };
    shortcuts.append(button);
  });
  const paintMaterials = () => {
    const list = store.materials[active] || [];
    chips.innerHTML = list.length
      ? list.map((a, i) => '<span class="opt-group-chip"><span class="material-ref-icon">' + materialIcon((product.materials.find(x => x.id === a.id) || {}).kind || 'document') + '</span><span>' + escapeText(a.name) + '</span><button type="button" aria-label="移除素材 ' + escapeText(a.name) + '">×</button></span>').join('')
      : '<span class="opt-group-empty-hint">未引用素材</span>';
    chips.querySelectorAll('button').forEach((b, i) => { b.onclick = () => { list.splice(i, 1); store.materials[active] = list; paintMaterials(); }; });
  };
  const paint = () => {
    tabs.innerHTML = products.map(p => '<button type="button" role="tab" aria-selected="' + (p === active) + '" data-welcome="' + escapeText(p) + '">' + escapeText(p) + '</button>').join('');
    tabs.querySelectorAll('[data-welcome]').forEach(b => {
      b.onclick = () => { store.messages[active] = textarea.value; active = b.dataset.welcome; paint(); };
    });
    textarea.value = store.messages[active] || '';
    counter.textContent = textarea.value.length + ' / 2000';
    paintMaterials();
  };
  textarea.oninput = () => { counter.textContent = textarea.value.length + ' / 2000'; };
  body.querySelector('.welcome-material-btn').onclick = () => {
    openWelcomeMaterialPicker(store.materials[active] || [], picked => {
      store.materials[active] = picked;
      paintMaterials();
    });
  };
  paint();
  buttons(box, '取消')[0].onclick = () => box.remove();
  const save = buttons(box, '保存')[0];
  save.textContent = '保存入群欢迎语';
  save.onclick = () => {
    store.messages[active] = textarea.value;
    try { persist(); } catch (e) { }
    box.remove();
    document.body.style.overflow = '';
    feedback('已保存「' + active + '」入群欢迎语');
  };
}

/* 入口一：消息区右上角，和两个新增节点按钮并排 */
const welcomeRenderConfigurationBefore = renderConfiguration;
renderConfiguration = function () {
  welcomeRenderConfigurationBefore();
  const actions = root.querySelector('.message-header-actions');
  if (!actions || actions.querySelector('.welcome-config-entry')) return;
  const entry = document.createElement('button');
  entry.type = 'button';
  entry.className = 'el-button welcome-config-entry';
  entry.textContent = '入群欢迎语配置';
  entry.title = '按产品线维护入群欢迎语';
  entry.onclick = () => openWelcomeMessageConfig();
  actions.append(entry);
};

/* 入口二：群聊节点选「建群」时，自动建群清单标题旁给一个入口 */
const welcomeApplyLayoutBefore = communityApplyEditorLayout;
communityApplyEditorLayout = function (m, ctx, readOnly) {
  welcomeApplyLayoutBefore(m, ctx, readOnly);
  const buildItem = ctx && ctx.buildItem;
  if (!buildItem) return;
  const label = buildItem.querySelector('.el-form-item__label');
  if (!label) return;
  /* 只有建群动作才挂这个入口 */
  if (!communityNeedsBuildList(draft.action)) {
    const stale = label.querySelector('.welcome-config-inline');
    if (stale) stale.remove();
    return;
  }
  if (label.querySelector('.welcome-config-inline')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'el-button is-link el-button--primary welcome-config-inline';
  button.textContent = '入群欢迎语配置';
  button.title = '按产品线维护入群欢迎语';
  button.style.marginLeft = '10px';
  button.onclick = e => {
    e.preventDefault();
    if (readOnly) return;
    const first = communityBuildStats(draft).groups[0];
    openWelcomeMessageConfig(first ? first.product : undefined);
  };
  label.append(button);
};

/* 首屏补渲染：本模块在初次 render 之后才加载，补一次让右上也出现入口 */
try { if (typeof render === 'function') render(); } catch (e) { /* 忽略 */ }
