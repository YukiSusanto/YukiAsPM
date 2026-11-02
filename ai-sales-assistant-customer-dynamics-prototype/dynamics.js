// 客户动态仅提供记录浏览与筛选；示例来自参考原型，不连接生产接口。
const CustomerDynamics = (() => {
  const groups = {
    '标签变动': ['打标签', '删除标签'],
    '好友关系变动': ['添加好友', '客户流失'],
    '转人工变更': ['转人工', 'AI接管'],
    '群聊变动': ['加入群聊', '退出群聊'],
    '直播行为': ['点击预约', '进入直播间'],
    '公众号行为': ['关注公众号'],
    '交易记录': ['下单产品', '成交记录']
  };
  const events = [
    {type:'转人工',time:'2026-10-29 16:18',platform:'企业微信',employee:'current',reason:'客户连续表达人工服务诉求'},
    {type:'AI接管',time:'2026-10-29 16:12',platform:'企业微信',employee:'current'},
    {type:'打标签',time:'2026-10-29 16:03',platform:'微信自动同步',employee:'current',action:'打上企微标签【D3预约】'},
    {type:'删除标签',time:'2026-10-29 15:48',platform:'企业微信',employee:'support',action:'删除企微标签【待跟进】'},
    {type:'关注公众号',time:'2026-10-29 09:16',platform:'微信自动同步',action:'关注公众号【雪梨英语】'},
    {type:'进入直播间',time:'2026-10-28 19:02',platform:'直播间',employee:'current',action:'进入【100篇阅读（新版）】直播间'},
    {type:'成交记录',time:'2026-10-28 14:36',platform:'APP',employee:'current',action:'完成订单成交，实付金额 ¥399'},
    {type:'下单产品',time:'2026-10-28 14:30',platform:'APP',action:'下单产品【单词拼读王年度课程】'},
    {type:'点击预约',time:'2026-10-28 10:26',platform:'APP',employee:'current',action:'完成三天家长直播课预约'},
    {type:'加入群聊',time:'2026-10-27 11:20',platform:'微信自动同步',employee:'support',action:'加入群聊【四年级英语规划交流群】'},
    {type:'退出群聊',time:'2026-10-26 20:14',platform:'微信自动同步',action:'退出群聊【自然拼读学习打卡群】'},
    {type:'添加好友',time:'2026-10-21 18:06',platform:'企业微信',employee:'current',action:'添加为企微好友并建立单聊关系'},
    {type:'客户流失',time:'2026-10-20 10:22',platform:'微信自动同步',employee:'support',action:'双向删除好友，客户状态变更为已流失'}
  ];
  const filtersByCustomer = new Map();
  let context;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const filterLabels = {employee:'员工',platform:'操作平台',type:'动态类型'};
  const allLabels = {employee:'全部员工',platform:'全部平台',type:'全部动态'};
  function options(key) {
    return key==='employee' ? context.employees.map(e=>[e.id,e.name]) :
      (key==='platform' ? ['企业微信','微信自动同步','APP','直播间'] : Object.keys(groups)).map(value=>[value,value]);
  }
  function selectionLabel(key) {
    const selected=context.filters[key];
    if (!selected.length) return allLabels[key];
    return selected.length===1 ? options(key).find(([value])=>value===selected[0])?.[1] || selected[0] : `已选 ${selected.length} 项`;
  }
  function filter(key) {
    const selected=context.filters[key];
    const item=(value,label,checked)=>`<label class="dynamics-filter-option"><input type="checkbox" data-dynamics-filter="${key}" value="${escape(value)}"${checked?' checked':''}><span>${escape(label)}</span></label>`;
    return `<div class="dynamics-filter-field ${key==='employee'?'dynamics-employee-filter':''}"><span id="dynamics-${key}-label" class="dynamics-filter-label">${filterLabels[key]}</span><details class="dynamics-multiselect" data-filter-key="${key}"><summary id="dynamics-${key}-filter" aria-label="${filterLabels[key]}：${escape(selectionLabel(key))}"><span class="dynamics-selection-text">${escape(selectionLabel(key))}</span><span class="dynamics-select-arrow" aria-hidden="true">⌄</span></summary><div class="dynamics-filter-menu" role="group" aria-labelledby="dynamics-${key}-label"><div class="dynamics-filter-hint">可选择一项或多项</div>${item('all',allLabels[key],!selected.length)}${options(key).map(([value,label])=>item(value,label,selected.includes(value))).join('')}</div></details></div>`;
  }
  function sentence(item) {
    const customer = context.customer.name;
    const employee = context.employees.find(e=>e.id===item.employee)?.name;
    if (employee && ['点击预约','进入直播间'].includes(item.type)) return `${customer}客户通过${employee}销售的链接${item.action}`;
    if (employee && item.type==='加入群聊') return `${customer}客户通过${employee}销售的邀请${item.action}`;
    if (item.type==='转人工') return `${employee}销售的${customer}客户，因为${item.reason}触发转人工`;
    if (item.type==='AI接管') return `${employee}销售的${customer}客户重置为AI回复中`;
    return employee ? `${employee} 对客户 ${customer} ${item.action}` : `客户 ${customer} ${item.action}`;
  }
  function results() {
    const f = context.filters;
    return context.events.filter(item =>
      (!f.employee.length||f.employee.includes(item.employee)) &&
      (!f.platform.length||f.platform.includes(item.platform)) &&
      (!f.type.length||f.type.some(type=>groups[type]?.includes(item.type)))
    ).sort((a,b)=>b.time.localeCompare(a.time));
  }
  function timeline(items) {
    if (!items.length) return `<div class="dynamics-empty">${context.events.length?'当前筛选条件下暂无客户动态':'暂无客户动态'}</div>`;
    return items.map(item=>`<article class="dynamics-event"><div class="dynamics-event-head"><strong>${escape(item.type)}</strong><time datetime="${item.time.replace(' ','T')}">${item.time}</time></div><div class="dynamics-event-card">${escape(sentence(item))}<br><span class="dynamics-event-platform">${item.platform}</span></div></article>`).join('');
  }
  function render(customer, teacher) {
    if (!filtersByCustomer.has(customer.id)) filtersByCustomer.set(customer.id,{employee:[],platform:[],type:[]});
    context = {
      customer,
      employees: customer.id===5 ? [{id:'current',name:teacher},{id:'support',name:'19-殷丽娟-助理-202303-202305'}] : [{id:'current',name:teacher}],
      // 仅示例客户绑定参考事件；切换客户不会复用别人的时间线。
      events: customer.id===5 ? events : [],
      filters: filtersByCustomer.get(customer.id)
    };
    const items=results();
    return `<section class="dynamics-records" aria-label="客户动态记录"><div class="dynamics-section-title"><h3>客户动态</h3><span id="dynamics-record-count" aria-live="polite">共 ${items.length} 条</span></div><div class="dynamics-filters">${['employee','platform','type'].map(filter).join('')}</div><div class="dynamics-timeline" id="dynamics-timeline">${timeline(items)}</div></section>`;
  }
  document.addEventListener('change', event => {
    const key = event.target.dataset.dynamicsFilter;
    if (!key || !context) return;
    const input=event.target;
    const selected=new Set(context.filters[key]);
    if (input.value==='all') selected.clear();
    else if (input.checked) selected.add(input.value);
    else selected.delete(input.value);
    context.filters[key]=[...selected];
    const dropdown=input.closest('.dynamics-multiselect');
    dropdown.querySelectorAll('input').forEach(checkbox=>{checkbox.checked=checkbox.value==='all'?!selected.size:selected.has(checkbox.value)});
    dropdown.querySelector('.dynamics-selection-text').textContent=selectionLabel(key);
    dropdown.querySelector('summary').setAttribute('aria-label',`${filterLabels[key]}：${selectionLabel(key)}`);
    const items=results();
    document.querySelector('#dynamics-record-count').textContent=`共 ${items.length} 条`;
    document.querySelector('#dynamics-timeline').innerHTML=timeline(items);
  });
  document.addEventListener('click',event=>{
    document.querySelectorAll('.dynamics-multiselect[open]').forEach(dropdown=>{
      if (!dropdown.contains(event.target)) dropdown.open=false;
    });
  });
  document.addEventListener('keydown',event=>{
    if (event.key!=='Escape') return;
    const dropdown=event.target.closest('.dynamics-multiselect[open]');
    if (dropdown) { dropdown.open=false; dropdown.querySelector('summary').focus(); }
  });
  return {render};
})();
