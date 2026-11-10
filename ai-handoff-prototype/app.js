'use strict';

const byId = id => document.getElementById(id);
const form = byId('filters');
const detail = byId('detail');
const confirm = byId('confirm');
const storageKey = 'handoff-demo-state-v1';
const views = ['人工记录', '已忽略记录'];
let business = 0, view = 0, page = 1, size = 20, filters = {};
let activeId = '', analysisView = 0, confirmAction, toastTimer;
const selected = new Set();
const running = new Set();
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function getChanges() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}
const changes = getChanges();
records.forEach(record => Object.assign(record, changes[record.id]));
function save(record, patch) {
  Object.assign(record, patch);
  changes[record.id] = { ...changes[record.id], ...patch };
  try { localStorage.setItem(storageKey, JSON.stringify(changes)); } catch {}
}
function notify(message) {
  const toast = byId('toast');
  const target = detail.open ? detail : document.body;
  target.append(toast);
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}
function filteredRows() {
  const contains = (value, key) => !filters[key] || value.toLowerCase().includes(filters[key].toLowerCase());
  return records.filter(record => record.business === business &&
    (record.status === '已忽略') === Boolean(view) &&
    (view || !filters.status || record.status === filters.status) &&
    contains(record.customer, 'customer') && contains(record.employee, 'employee') &&
    contains(record.scenario.key, 'scene') &&
    (!filters.start || record.start >= filters.start) && (!filters.end || record.start <= filters.end));
}
function tabs(labels, index, group) {
  return labels.map((label, number) =>
    `<button type="button" role="tab" aria-selected="${number === index}" tabindex="${number === index ? 0 : -1}" data-${group}="${number}">${label}</button>`
  ).join('');
}
function roleClass(role) {
  return role === 'AI' ? 'ai' : role === '人工' ? 'human' : 'customer';
}
function badge(status) {
  const cls = status === '已通过' ? 'approved' : status === '已忽略' ? 'ignored' : 'waiting';
  return `<span class="pill badge ${cls}">${status}</span>`;
}
function messageHTML(message, summary) {
  const role = roleClass(message.role);
  return `<div class="${summary ? 'summary-line' : 'message'} ${role}">
    <span class="role ${role}">${message.role}</span><div>${escapeHtml(message.body)}<time>${message.time}</time></div>
  </div>`;
}
function card(record) {
  const { id, customer, employee, start, status, scenario, version, team } = record;
  const checked = selected.has(id);
  const reviewable = status === '待审核';
  return `<article class="card${checked ? ' selected' : ''}">
    <div class="card-head">
      ${reviewable ? `<input type="checkbox" data-select="${id}" aria-label="选择 ${escapeHtml(customer)}"${checked ? ' checked' : ''}>` : ''}
      <span class="avatar">${escapeHtml(customer[0])}</span>
      <div class="identity"><strong>${escapeHtml(customer)}</strong><small title="企业微信 · ${employee} · ${start}">企业微信 · ${employee} · ${start}</small></div>
      ${badge(status)}
    </div>
    <div class="tags"><span class="pill">${businessNames[business]}</span><span class="pill">${scenario.key}</span><span class="pill">人工前 20 分钟</span><span class="pill">${version ? '分析 v' + version : '待分析'}</span></div>
    <div class="team">${team}</div>
    <div class="summary"><h3>会话摘要</h3>${record.messages.slice(-4).map(message => messageHTML(message, true)).join('')}</div>
    <div class="card-footer"><code title="${id}">${id}</code><div class="card-actions">
      <button class="link" data-detail="${id}">查看详情</button>
      ${reviewable ? `<button class="link good" data-review="已通过" data-id="${id}">通过</button><button class="link bad" data-review="已忽略" data-id="${id}">忽略</button>` : ''}
    </div></div>
  </article>`;
}
function pagination(total, last) {
  const visible = last <= 7 ? Array.from({ length: last }, (_, index) => index + 1) :
    [1, ...(page > 4 ? ['back'] : []),
      ...Array.from({ length: 5 }, (_, index) => Math.min(Math.max(page - 2, 2), last - 5) + index),
      ...(page < last - 3 ? ['forward'] : []), last];
  const item = (label, destination, attributes = '') =>
    `<button data-page="${destination}" ${attributes}>${label}</button>`;
  return `<span>共 ${total} 条</span><select id="size" aria-label="每页条数">
    ${[10, 20, 50, 100].map(value => `<option value="${value}"${size === value ? ' selected' : ''}>${value}条/页</option>`).join('')}
    </select>${item('‹', page - 1, 'aria-label="上一页"' + (page === 1 ? ' disabled' : ''))}
    ${visible.map(number => number === 'back' ? item('•••', Math.max(page - 5, 1), 'aria-label="向前 5 页"') :
      number === 'forward' ? item('•••', Math.min(page + 5, last), 'aria-label="向后 5 页"') :
      item(number, number, `aria-label="第 ${number} 页"${number === page ? ' aria-current="page"' : ''}`)).join('')}
    ${item('›', page + 1, 'aria-label="下一页"' + (page === last ? ' disabled' : ''))}`;
}
let currentRows = [];
function render() {
  const rows = filteredRows();
  const last = Math.max(1, Math.ceil(rows.length / size));
  page = Math.max(1, Math.min(page, last));
  currentRows = rows.slice((page - 1) * size, page * size);
  const ready = currentRows.filter(record => record.status === '待审核');
  for (const id of selected) if (!ready.some(record => record.id === id)) selected.delete(id);
  byId('business').innerHTML = tabs(businessNames, business, 'business');
  byId('views').innerHTML = tabs(views, view, 'view');
  byId('status-field').style.display = view ? 'none' : '';
  byId('stats').hidden = Boolean(view);
  byId('stats').innerHTML = [
    ['待分析会话', '待分析', '#c68122', '当前页等待分析的记录'],
    ['待审核会话', '待审核', '#3464cf', '当前页已完成 AI 分析，可批量审核'],
    ['已完成审核', '已通过', '#209461', '当前页已审核通过的转人工记录']
  ].map(([label, status, color, hint]) => `<div class="metric" style="--metric:${color}">${label}<strong>${currentRows.filter(record => record.status === status).length}</strong><small>${hint}</small></div>`).join('');
  byId('total').textContent = '共 ' + rows.length + ' 条记录' + (selected.size ? '　已选 ' + selected.size + ' 条' : '');
  byId('batch').innerHTML = view ? '' : `
    <button data-select-all ${ready.length ? '' : 'disabled'}>${ready.length && selected.size === ready.length ? '取消全选' : '全选已分析'}</button>
    <button class="success" data-review="已通过" ${selected.size ? '' : 'disabled'}>批量通过</button>
    <button class="danger" data-review="已忽略" ${selected.size ? '' : 'disabled'}>批量忽略</button>`;
  byId('cards').innerHTML = currentRows.length ? currentRows.map(card).join('') : '<div class="empty"><span aria-hidden="true">▤</span>暂无数据</div>';
  byId('pages').innerHTML = pagination(rows.length, last);
}
function resetPage() {
  page = 1;
  selected.clear();
  render();
}
function readFilters() {
  const values = Object.fromEntries(new FormData(form));
  for (const key of Object.keys(values)) values[key] = values[key].trim();
  for (const key of ['start', 'end']) {
    values[key] = values[key].replace('T', ' ');
    if (values[key].length === 16) values[key] += key === 'start' ? ':00' : ':59';
  }
  return values;
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const values = readFilters();
  if (values.start && values.end && values.start > values.end) {
    notify('开始时间不能晚于结束时间');
    return;
  }
  filters = values;
  resetPage();
});
form.addEventListener('reset', () => { filters = {}; resetPage(); });

function field(label, value) {
  return `<div class="field"><span>${label}</span><strong>${escapeHtml(value || '-')}</strong></div>`;
}
function analysis(record) {
  const { scenario, status, version } = record;
  if (!version) return '<div class="analysis-card">暂无分析结果</div>';
  if (analysisView) {
    const payload = {
      version: 'sales_handoff_v2', question_category: scenario.category,
      customer_intent: scenario.intent, confidence: 0.72, retrieval_queries: [scenario.question],
      suggested_reply: scenario.answer, next_action: scenario.next, review_status: status
    };
    return `<pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;
  }
  return `${field('问题分类', scenario.category)}${field('客户意图', scenario.intent)}${field('分析版本', 'sales_handoff_v2')}${field('整体置信度', '72%')}
    <div class="analysis-card"><strong>v2 意图与检索</strong>${field('产品线', '英语学习')}${field('场景', scenario.category)}${field('检索决策', '需追问')}${field('证据分', '73%')}<small>检索问句</small><p>${scenario.question}</p></div>
    <div class="analysis-card"><strong>AI 解决方案</strong><p>${scenario.description}</p><small>${scenario.next}</small></div>
    <div class="analysis-card"><div class="section-head"><strong>分析出的有效话术</strong><button class="link" data-copy>复制话术</button></div><blockquote>${scenario.answer}</blockquote><small>仅供本次会话参考 · 话术来源 人工原话 · 复用置信度 88%</small></div>
    <div class="analysis-card"><strong>建议下一步</strong><p>${scenario.next}</p><small>置信度 72%</small></div>
    <details><summary>查看完整分析与复用边界</summary><small>客户问题、异议、限制条件和审核信息</small>
      ${field('客户问题', scenario.question)}${field('客户异议', scenario.description)}${field('知识复用边界', '须确认客户情况，涉及订单时先核对后台记录。')}
      <strong>Agent 审核信息</strong>${field('审核状态', status)}${field('审核人', record.reviewer)}${field('审核意见', record.reviewNote)}
    </details>`;
}
function renderDetail() {
  const record = records.find(item => item.id === activeId);
  const { customer, status, scenario, employee, start, end, team, version, updated, requested, messages } = record;
  byId('detail-content').innerHTML = `
    <header class="dialog-header"><h2 id="detail-title">${escapeHtml(customer)} · 会话记录详情</h2><button class="icon" aria-label="关闭此对话框" data-close>×</button></header>
    <div class="detail-layout">
      <section class="section-box"><div class="section-head">完整会话记录 <small>人工处理区间 · ${messages.length} 条消息</small></div><div class="chat">${messages.map(message => messageHTML(message, false)).join('')}</div></section>
      <aside><section class="section-box"><div class="section-head">场景信息 ${badge(status)}</div>
        ${field('业务分类', businessNames[record.business])}${field('当前所属区组', team)}${field('客户', customer)}
        ${field('服务员工', employee)}${field('转人工场景', scenario.key)}${field('转人工时间', start)}
        ${field('结束时间', end)}${field('分析版本', version)}${field('分析更新时间', version ? updated : '')}${field('最近发起分析', requested)}
        <small>场景说明</small><p>${scenario.description}</p></section>
      <section class="section-box"><div class="section-head"><span>Agent 结构化分析</span>
        <button data-analyze ${running.has(record.id) ? 'disabled' : ''}>${running.has(record.id) ? '分析中…' : version ? '重新发起分析' : '发起分析'}</button>
        <div role="tablist" aria-label="结构化分析展示方式" class="analysis-tabs">${tabs(['重点视图', '原始 JSON'], analysisView, 'analysis')}</div>
      </div><div id="analysis-content">${analysis(record)}</div></section></aside>
    </div>
    ${status === '待审核' ? `<footer class="dialog-footer"><button class="danger" data-review="已忽略" data-id="${record.id}">忽略</button><button class="success" data-review="已通过" data-id="${record.id}">通过</button></footer>` : ''}`;
}
function ask(title, message, action, danger = false) {
  byId('confirm-title').textContent = title;
  byId('confirm-text').textContent = message;
  byId('confirm-ok').className = danger ? 'danger' : 'primary';
  confirmAction = action;
  confirm.returnValue = 'cancel';
  confirm.showModal();
}
confirm.addEventListener('close', () => {
  const action = confirmAction;
  confirmAction = undefined;
  if (confirm.returnValue === 'ok' && action) action();
});
function review(status, id) {
  const ids = id ? [id] : [...selected];
  const action = status === '已通过' ? '通过' : '忽略';
  const title = (id ? '' : '批量') + action;
  ask(title, '确定' + action + '选中的 ' + ids.length + ' 条记录吗？' + (status === '已忽略' ? '记录将移至已忽略记录。' : ''), () => {
    for (const record of records) {
      if (ids.includes(record.id) && record.status === '待审核') {
        save(record, { status, reviewer: '演示管理员', reviewNote: action });
      }
    }
    selected.clear();
    if (detail.open) detail.close();
    render();
    notify(title + '成功');
  }, status === '已忽略');
}
function analyze(record) {
  const label = record.version ? '重新发起分析' : '发起分析';
  ask(label, '确定' + label + '？演示版将生成一份模拟分析结果。', () => {
    running.add(record.id);
    save(record, { requested: formatTime(Date.now()) });
    if (detail.open && activeId === record.id) renderDetail();
    setTimeout(() => {
      const status = record.status === '待分析' ? '待审核' : record.status;
      save(record, { status, version: record.version + 1, updated: formatTime(Date.now()) });
      running.delete(record.id);
      render();
      if (detail.open && activeId === record.id) renderDetail();
      notify('模拟分析已完成');
    }, 750);
  });
}
async function copyReply(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement('textarea');
    input.value = value;
    detail.append(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) { notify('复制失败，请手动选中话术复制'); return; }
  }
  notify('话术已复制');
}
document.addEventListener('change', event => {
  const { dataset, checked, id, value } = event.target;
  if (dataset.select) {
    if (checked) selected.add(dataset.select);
    else selected.delete(dataset.select);
    render();
    document.querySelector('[data-select="' + dataset.select + '"]')?.focus({ preventScroll: true });
  } else if (id === 'size') {
    size = Number(value);
    resetPage();
  }
});
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  const pop = byId('top-pop');
  if (!event.target.closest('.top') || button && !['menu', 'notice', 'account'].includes(button.id)) {
    pop.hidden = true;
    byId('menu').setAttribute('aria-expanded', 'false');
  }
  if (!button) {
    if (event.target === detail) {
      const rect = detail.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) detail.close();
    }
    return;
  }
  const data = button.dataset;
  if (data.business !== undefined || data.view !== undefined) {
    if (data.business !== undefined) business = Number(data.business);
    else view = Number(data.view);
    resetPage();
    const key = data.business !== undefined ? 'business' : 'view';
    document.querySelector('[data-' + key + '="' + data[key] + '"]').focus({ preventScroll: true });
  } else if (data.page !== undefined) {
    page = Number(data.page);
    selected.clear();
    render();
    byId('views').scrollIntoView({ block: 'start' });
  } else if (data.selectAll !== undefined) {
    const ready = currentRows.filter(record => record.status === '待审核');
    if (selected.size === ready.length) selected.clear();
    else ready.forEach(record => selected.add(record.id));
    render();
    document.querySelector('[data-select-all]').focus({ preventScroll: true });
  } else if (data.detail) {
    activeId = data.detail;
    analysisView = 0;
    renderDetail();
    detail.showModal();
    detail.scrollTop = 0;
  } else if (data.close !== undefined) detail.close();
  else if (data.review) review(data.review, data.id);
  else if (data.analysis !== undefined) {
    analysisView = Number(data.analysis);
    button.parentElement.innerHTML = tabs(['重点视图', '原始 JSON'], analysisView, 'analysis');
    byId('analysis-content').innerHTML = analysis(records.find(record => record.id === activeId));
    document.querySelector('[data-analysis="' + analysisView + '"]').focus({ preventScroll: true });
  } else if (data.copy !== undefined) copyReply(records.find(record => record.id === activeId).scenario.answer);
  else if (data.analyze !== undefined) analyze(records.find(record => record.id === activeId));
  else if (button.id === 'to-top') window.scrollTo({ top: 0, behavior: 'smooth' });
  else if (['menu', 'notice', 'account'].includes(button.id)) {
    pop.hidden = pop.dataset.owner === button.id && !pop.hidden;
    pop.dataset.owner = button.id;
    byId('menu').setAttribute('aria-expanded', String(button.id === 'menu' && !pop.hidden));
    pop.style.left = button.id === 'menu' ? '10px' : 'auto';
    pop.style.right = button.id === 'menu' ? 'auto' : '10px';
    pop.textContent = { menu: '销售管理 / AI转人工记录', notice: '演示通知 · 转人工审核', account: '演示管理员' }[button.id];
  }
});
document.addEventListener('keydown', event => {
  if (event.target.getAttribute('role') !== 'tab') return;
  const buttons = [...event.target.parentElement.querySelectorAll('[role=tab]')];
  const index = buttons.indexOf(event.target);
  const destinations = { ArrowLeft: (index + buttons.length - 1) % buttons.length, ArrowRight: (index + 1) % buttons.length, Home: 0, End: buttons.length - 1 };
  if (event.key in destinations) {
    event.preventDefault();
    buttons[destinations[event.key]].click();
  }
});
render();
