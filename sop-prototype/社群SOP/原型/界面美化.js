/* 界面美化：滚动区域阴影 + 消息列表分页条结构优化（纯展示，不改业务逻辑）。 */
(function () {
  /* ---------- 1. 滚动区域标记 ---------- */
  const SELECTOR = '.message-list-table-wrap,.asset-list-host,.asset-group-list,.time-nav-list,.opt-group-list,.node-workspace,.opt-action-menu,.el-dialog__body';
  function mark(el) {
    if (!el || el.nodeType !== 1 || typeof el.matches !== 'function' || !el.matches(SELECTOR)) return;
    const overflow = el.scrollHeight - el.clientHeight > 2;
    const top = overflow && el.scrollTop > 2;
    const bottom = overflow && el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    el.classList.toggle('is-scroll-top', top);
    el.classList.toggle('is-scroll-bottom', bottom);
  }
  function markAll() { document.querySelectorAll(SELECTOR).forEach(mark); }
  document.addEventListener('scroll', e => mark(e.target), { capture: true, passive: true });
  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; markAll(); }); };
  try { new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); } catch (e) { /* 忽略 */ }
  window.addEventListener('resize', schedule);
  document.addEventListener('click', () => setTimeout(markAll, 30), true);
  schedule();
})();

/* ---------- 2. 消息列表分页条：左侧信息、右侧页码 ---------- */
function uiPageNumbers(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page, page - 1, page + 1]);
  const list = [...set].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}
renderMessagePagination = function (group, pager) {
  const host = root.querySelector('.message-list-table-wrap');
  if (!host) return;
  host.parentElement.querySelector('.message-pagination')?.remove();
  const nav = document.createElement('div');
  nav.className = 'asset-pagination message-pagination';
  const total = group.nodes.length;
  const pages = Math.max(1, Math.ceil(total / pager.pageSize));
  const page = Math.min(Math.max(1, pager.page), pages);
  const numbers = pages > 1
    ? uiPageNumbers(page, pages).map(n => n === '…'
      ? '<span class="asset-page-ellipsis">…</span>'
      : '<button type="button" class="' + (n === page ? 'active' : '') + '" data-page="' + n + '" aria-label="第 ' + n + ' 页">' + n + '</button>').join('')
    : '';
  nav.innerHTML = '<span class="page-info"><span class="page-count">共 ' + total + ' 条消息</span><span class="page-index">第 ' + page + ' / ' + pages + ' 页</span><span class="message-page-size">每页 ' + pager.pageSize + ' 条</span></span>'
    + '<span class="page-actions"><button type="button" data-step="prev" aria-label="上一页消息"' + (page === 1 ? ' disabled' : '') + '>上一页</button>'
    + '<span class="asset-page-controls">' + numbers + '</span>'
    + '<button type="button" data-step="next" aria-label="下一页消息"' + (page === pages ? ' disabled' : '') + '>下一页</button></span>';
  nav.querySelector('[data-step="prev"]').onclick = () => { pager.page = page - 1; render(); };
  nav.querySelector('[data-step="next"]').onclick = () => { pager.page = page + 1; render(); };
  nav.querySelectorAll('[data-page]').forEach(b => { b.onclick = () => { pager.page = Number(b.dataset.page); render(); }; });
  host.after(nav);
};

/* 首次加载时上面的渲染早于本模块执行，这里补一次重绘，保证首屏就是新分页条。 */
try { if (typeof render === 'function') render(); } catch (e) { /* 忽略 */ }
