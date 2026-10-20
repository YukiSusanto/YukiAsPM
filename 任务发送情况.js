/* Local replica of AI销售 → AI触发SOP → 任务发送情况. All records are synthetic. */
const sendTaskToday = new Date().toLocaleDateString('sv-SE', {timeZone:'Asia/Shanghai'});
const sendTaskFilters = {date:sendTaskToday, period:'', status:'', start:'', end:''};
const sendTaskPaging = {page:1, size:20};
const sendTaskStatuses = ['待触发','执行中','已完成','执行失败'];
function sendTaskDay(offset) {
  const date = new Date(sendTaskToday+'T12:00:00+08:00');
  date.setDate(date.getDate()+offset);
  return date.toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
}
/* 群发任务的群聊演示数据：按产品线命名，销售与群聊一对一/一对多分配 */
const sendTaskGroupPool = [
  {name:'雪梨老师悦读小达人打卡群', members:486, product:'悦读小达人'},
  {name:'雪梨老师单词拼读王打卡群', members:412, product:'单词拼读王'},
  {name:'雪梨老师1500词学习群', members:498, product:'1500词'},
  {name:'雪梨老师100篇学习群', members:377, product:'100篇'},
  {name:'雪梨老师悦读小达人打卡群（2群）', members:301, product:'悦读小达人'},
  {name:'雪梨老师1500词学习群（2群）', members:265, product:'1500词'}
];
/* 建群任务的演示数据：按客户的产品通用渠道标签各建一个群，并记录拉进群里的客户 */
const sendTaskCreatePool = [
  {name:'雪梨老师悦读小达人打卡群', product:'悦读小达人', members:486},
  {name:'雪梨老师单词拼读王打卡群', product:'单词拼读王', members:412},
  {name:'雪梨老师1500词学习群', product:'1500词', members:498},
  {name:'雪梨老师100篇学习群', product:'100篇', members:377}
];
function sendTaskSeed(date, historical=false) {
  const times=['14:00','16:30','18:58','19:10','19:20','19:30','22:03'];
  const labels=['14:00','16:30','直播开始时间-2分钟','直播开始时间+10分钟','直播开始时间+20分钟','直播开始时间+30分钟','直播结束时间+3分钟'];
  /* j=1/3/4 为群发任务（演示群聊维度），j=5 为建群任务（可看每个群拉进哪些客户），其余为私信任务 */
  const groupIndexes=[1,3,4];
  const groupActions={1:'社群普通发送',3:'社群@ALL',4:'群公告'};
  const plannedMap={1:4,3:6,4:5};
  return Array.from({length:historical?27:7},(_,i)=>{
    const j=i%7, status=historical?sendTaskStatuses[i%4]:(i<2||i%7===5?'已完成':'待触发');
    const isCreate=j===5;
    const isGroup=groupIndexes.includes(j)||isCreate;
    const sopCreate=isCreate?sendTaskSopCreateNode():null;
    const customerCount=status==='待触发'?0:(j===0?67:83);
    const plannedGroups=isCreate?((sopCreate&&Array.isArray(sopCreate.node.buildGroups)&&sopCreate.node.buildGroups.length)||sendTaskCreatePool.length):isGroup?plannedMap[j]:0;
    const actualGroups=!isGroup||status==='待触发'||status==='执行失败'?0:status==='执行中'?Math.ceil(plannedGroups*0.4):plannedGroups;
    return {id:date+'-'+i,date,period:j===0?133:134,business:j===0?'133期内部ai':'134内部ai',
      stage:j===0?'W2-D2追单私信-周二':'W1-D2直播-周二',code:j===0?'W2-D2':'W1-D2',
      time:isCreate&&sopCreate?String(sopCreate.node.time):labels[j],action:isCreate?'建群':isGroup?groupActions[j]:'私信1v1',
      planned:date+' '+(isCreate&&sopCreate?String(sopCreate.node.time):times[j])+':00',
      actual:status==='待触发'?'':date+' '+(isCreate&&sopCreate?String(sopCreate.node.time):times[j])+':00',status,customerCount,
      success:status==='已完成'?customerCount*(j===0?2:1):status==='执行中'?35:0,
      failure:status==='执行失败'?customerCount:0,progress:status==='已完成'?100:status==='执行中'?42:0,
      isGroup,isCreate,plannedGroups,actualGroups,failedGroups:Math.max(0,plannedGroups-actualGroups),
      text:'家长您好，今天的英语直播即将开始，欢迎通过 {{live1_url}} 进入直播间。期待与您一起学习！',
      material:j===0?'直播提醒海报.png':''};
  });
}
const sendTaskRecords=[...sendTaskSeed(sendTaskToday),...sendTaskSeed(sendTaskDay(-1),true)];
function sendTaskBadge(status) {
  const tone={'待触发':'info','执行中':'primary','已完成':'success','执行失败':'danger'}[status]||'info';
  return tag(status,tone);
}
function sendTaskTable(headers,rows,cls='') {
  return '<div class="send-task-table-scroll"><table class="send-task-table '+cls+'"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function sendTaskPager(host,pager,total,onChange,label='任务') {
  const pages=Math.max(1,Math.ceil(total/pager.size));
  pager.page=Math.max(1,Math.min(pages,pager.page));
  const numbers=uiPageNumbers(pager.page,pages).map(n=>n==='…'?'<span>…</span>':'<button type="button" data-page="'+n+'" '+(n===pager.page?'aria-current="page"':'')+' aria-label="'+label+'第'+n+'页">'+n+'</button>').join('');
  host.innerHTML='<span>共 '+total+' 条</span><select aria-label="'+label+'每页数量">'+[10,20,50,100].map(n=>'<option value="'+n+'" '+(n===pager.size?'selected':'')+'>'+n+'条/页</option>').join('')+'</select><button type="button" data-step="-1" aria-label="上一页'+label+'" '+(pager.page===1?'disabled':'')+'>‹</button>'+numbers+'<button type="button" data-step="1" aria-label="下一页'+label+'" '+(pager.page===pages?'disabled':'')+'>›</button><label>前往 <input type="number" min="1" max="'+pages+'" value="'+pager.page+'" aria-label="'+label+'跳转页码"> 页</label>';
  host.querySelector('select').onchange=e=>{pager.size=Number(e.target.value);pager.page=1;onChange()};
  host.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{pager.page=Number(b.dataset.page);onChange()});
  host.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{pager.page+=Number(b.dataset.step);onChange()});
  host.querySelector('input').onchange=e=>{pager.page=Math.max(1,Math.min(pages,Number(e.target.value)||1));onChange()};
}
function sendTaskMatching() {
  return sendTaskRecords.filter(t=>(!sendTaskFilters.date||t.date===sendTaskFilters.date)
    &&(!sendTaskFilters.period||String(t.period).includes(sendTaskFilters.period)||t.business.includes(sendTaskFilters.period))
    &&(!sendTaskFilters.status||t.status===sendTaskFilters.status)
    &&(!sendTaskFilters.start||t.planned.slice(11,16)>=sendTaskFilters.start)
    &&(!sendTaskFilters.end||t.planned.slice(11,16)<=sendTaskFilters.end));
}
function renderSendTasks() {
  history.replaceState(null,'','#/send-tasks');
  const dateTasks=sendTaskRecords.filter(t=>t.date===(sendTaskFilters.date||sendTaskToday));
  const cards=[['今日任务',dateTasks.length,''],['待触发',dateTasks.filter(t=>t.status==='待触发').length,'muted'],['执行中',dateTasks.filter(t=>t.status==='执行中').length,'blue'],['执行失败',dateTasks.filter(t=>t.status==='执行失败').length,'red']];
  root.innerHTML='<div class="send-tasks-page"><h2>任务消息发送情况</h2><div class="send-task-cards">'+cards.map(([label,count,cls])=>'<section><span>'+label+'</span><strong class="'+cls+'">'+count+'</strong></section>').join('')+'</div><form class="send-task-filters"><label>日期 <input type="date" name="date" aria-label="任务日期" value="'+escapeText(sendTaskFilters.date)+'"></label><label>销售期数 <input name="period" aria-label="销售期数" placeholder="期数编号或ID" value="'+escapeText(sendTaskFilters.period)+'"></label><label>任务状态 <select name="status" aria-label="任务状态"><option value="">全部状态</option>'+sendTaskStatuses.map(s=>'<option '+(sendTaskFilters.status===s?'selected':'')+'>'+s+'</option>').join('')+'</select></label><label>触发时间 <span class="send-task-time-range"><input type="time" name="start" aria-label="触发开始时间" value="'+escapeText(sendTaskFilters.start)+'"><span>至</span><input type="time" name="end" aria-label="触发结束时间" value="'+escapeText(sendTaskFilters.end)+'"></span></label><div class="send-task-filter-actions"><button type="submit" class="el-button el-button--primary">查询</button>'+btn('重置')+'</div></form><section class="send-task-results" aria-label="任务发送列表"><div class="send-task-list-host"></div><nav class="send-task-pagination" aria-label="任务分页"></nav></section></div>';
  const form=root.querySelector('form');
  form.onsubmit=e=>{e.preventDefault();const values=new FormData(form);const start=values.get('start'),end=values.get('end');if(start&&end&&start>end)return feedback('触发开始时间不能晚于结束时间');Object.keys(sendTaskFilters).forEach(key=>sendTaskFilters[key]=String(values.get(key)||'').trim());sendTaskPaging.page=1;renderSendTasks();sendTaskSyncNav()};
  buttons(form,'重置')[0].onclick=()=>{Object.assign(sendTaskFilters,{date:sendTaskToday,period:'',status:'',start:'',end:''});sendTaskPaging.page=1;renderSendTasks();sendTaskSyncNav()};
  sendTaskRenderRows();
}
function sendTaskRenderRows() {
  const all=sendTaskMatching(),pages=Math.max(1,Math.ceil(all.length/sendTaskPaging.size));sendTaskPaging.page=Math.min(sendTaskPaging.page,pages);
  const rows=all.slice((sendTaskPaging.page-1)*sendTaskPaging.size,sendTaskPaging.page*sendTaskPaging.size);
  const markup=rows.map(t=>{
    const counts=t.isGroup
      ? '<div class="send-task-counts"><span class="send-task-kind">群聊</span>预计 <b>'+t.plannedGroups+'</b> 个 '
        +(t.status==='待触发'?'实际 <b>—</b>':'实际 <b>'+t.actualGroups+'</b> 个'+(t.failedGroups?' <span class="send-task-red">失败 '+t.failedGroups+' 个</span>':''))
        +'</div>'
      : '<div class="send-task-counts">客户 <b>'+t.customerCount+'</b> 成功 <b>'+t.success+'</b>'+(t.failure?' <span class="send-task-red">失败 '+t.failure+'</span>':'')+'</div>';
    const op=t.isGroup
      ?(t.isCreate?(t.status==='待触发'?'预拉群':'拉群明细'):(t.status==='待触发'?'预发送群聊':'发送群聊'))
      :(t.status==='待触发'?'预触达客户':'触达客户');
    return '<tr><td>'+escapeText(t.business)+'</td><td>'+t.period+'期</td><td>'+escapeText(t.stage)+'</td><td>'+t.code+'</td><td>'+escapeText(t.time)+'</td><td>'+t.action+'</td><td>'+t.planned+'</td><td>'+(t.actual||'—')+'</td><td>'+sendTaskBadge(t.status)+'</td><td>'+counts+'<div class="send-task-progress-line"><progress max="100" value="'+t.progress+'" aria-label="发送进度 '+t.progress+'%"></progress><small>'+t.progress+'%</small></div></td><td><button type="button" class="el-button is-link el-button--primary" data-task="'+t.id+'">'+op+'</button></td></tr>';
  }).join('');
  const headers=['业务期数','期数','阶段名称','阶段Code','节点时间','发送动作','计划触发时间','实际触发时间','任务状态','发送情况','操作'];
  root.querySelector('.send-task-list-host').innerHTML=sendTaskTable(headers,markup||'<tr><td colspan="11" class="send-task-empty">暂无数据</td></tr>','send-task-main-table');
  root.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>{
    const t=sendTaskRecords.find(x=>x.id===b.dataset.task);
    if(!t)return;
    if(t.isCreate)openSendTaskCreateGroups(t);
    else if(t.isGroup)openSendTaskGroups(t);
    else openSendTaskClients(t);
  });
  sendTaskPager(root.querySelector('.send-task-pagination'),sendTaskPaging,all.length,sendTaskRenderRows);
}
function sendTaskDialog(title,body,kind='') {
  const previous=document.activeElement;
  const layer=simpleModal(title,body,m=>dismiss(),'关闭');layer.classList.add('send-task-modal');if(kind)layer.classList.add(kind);
  buttons(layer,'取消')[0]?.remove();
  function dismiss(){layer.remove();if(!dialogs.children.length)document.body.style.overflow='';previous?.focus()}
  layer.querySelector('.el-dialog__headerbtn').onclick=dismiss;
  layer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();dismiss()} });
  return layer;
}
function sendTaskSummary(task) {
  const entries=[['业务期数',task.business],['期数',task.period+'期'],['任务状态',sendTaskBadge(task.status),true],['阶段',task.stage+'（'+task.code+'）'],['节点时间',task.time],[task.status==='待触发'?'计划触发时间':'实际触发时间',task.status==='待触发'?task.planned:(task.actual||'—')]];
  return '<div class="send-task-description">'+entries.map(([key,value,raw])=>'<div><strong>'+key+'</strong><span>'+(raw?value:escapeText(value))+'</span></div>').join('')+'</div>';
}
function sendTaskSales(task) {
  const counts=task.customerCount===67?[23,18,15,11]:[24,21,20,18];
  return counts.map((count,i)=>({name:'销售'+['甲','乙','丙','丁'][i],id:i,count}));
}
function sendTaskClient(task,sale,index) {
  const number=sale.id*100+index+1;
  return {name:'演示客户 '+String(number).padStart(3,'0'),wechat:'demo_wm_'+task.period+'_'+number,third:'DEMO-'+(10000+number),added:sendTaskDay(-3)+' '+String(9+index%8).padStart(2,'0')+':24:00',corp:'demo_corp_001',success:task.status==='执行失败'?0:(task.material?2:1),failure:task.status==='执行失败'?(task.material?2:1):0};
}
function openSendTaskClients(task) {
  if(!task)return;const preview=task.status==='待触发',sales=sendTaskSales(task);let selected=0;const pager={page:1,size:10};
  const metrics=preview?'':'<div class="send-task-detail-metrics">实际发送销售 <b>'+sales.length+'</b> 人 <span>实际触达客户 <b>'+task.customerCount+'</b> 人</span></div>';
  const body=sendTaskSummary(task)+metrics+'<div class="send-task-sales-tabs" role="tablist" aria-label="销售客户分组"></div><div class="send-task-clients-host"></div><nav class="send-task-pagination" aria-label="客户分页"></nav>'+(preview?'<section class="send-task-node-content"><h3>节点话术及物料</h3><p>'+escapeText(task.text)+'</p>'+sendTaskTable(['素材名称','素材类型','素材预览','素材大小'],task.material?'<tr><td>'+escapeText(task.material)+'</td><td>图片</td><td><button type="button" class="el-button is-link el-button--primary" data-preview-material>预览</button></td><td>24 KB</td></tr>':'<tr><td colspan="4" class="send-task-empty">该节点未配置物料</td></tr>')+'</section>':'');
  const layer=sendTaskDialog(preview?'预触达客户':'触达客户',body,'send-task-clients-modal');
  function paint(){
    const tabs=layer.querySelector('.send-task-sales-tabs');tabs.innerHTML=sales.map((s,i)=>'<button type="button" role="tab" aria-selected="'+(selected===i)+'" data-sale="'+i+'">'+s.name+'（'+s.count+'）</button>').join('');tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.sale);pager.page=1;paint()});
    const sale=sales[selected],clients=Array.from({length:sale.count},(_,i)=>sendTaskClient(task,sale,i));
    const rows=clients.slice((pager.page-1)*pager.size,pager.page*pager.size).map((c,i)=>'<tr><td>'+escapeText(c.name)+'</td><td title="'+c.wechat+'">'+c.wechat+'</td><td>'+c.third+'</td><td>'+c.added+'</td><td>'+c.corp+'</td>'+(preview?'':'<td>'+c.success+'</td><td>'+c.failure+'</td><td><button type="button" class="el-button is-link el-button--primary" data-client="'+((pager.page-1)*pager.size+i)+'">发送明细</button></td>')+'</tr>').join('');
    layer.querySelector('.send-task-clients-host').innerHTML=sendTaskTable(['客户名称','客户企微ID','三方客户ID','加微时间','企业ID',...(preview?[]:['成功','失败','操作'])],rows,'send-task-client-table');
    layer.querySelectorAll('[data-client]').forEach(b=>b.onclick=()=>openSendTaskMessages(task,sale,clients[Number(b.dataset.client)]));
    sendTaskPager(layer.querySelector('.send-task-pagination'),pager,clients.length,paint,'客户');
  }
  paint();const materialButton=layer.querySelector('[data-preview-material]');if(materialButton)materialButton.onclick=()=>sendTaskPreviewMaterial();
}
/* ---------- 群发任务：销售 → 群聊 → 群内客户 ---------- */
function sendTaskGroupSales(task) {
  const planned=task.plannedGroups||0;
  const names=['销售甲','销售乙','销售丙','销售丁'];
  if(!planned)return [];
  const base=Math.floor(planned/names.length), extra=planned%names.length;
  return names.map((name,i)=>({name,id:i,count:base+(i<extra?1:0)})).filter(s=>s.count>0);
}
function sendTaskGroupList(task) {
  const preview=task.status==='待触发';
  const out=[];
  let cursor=0;
  sendTaskGroupSales(task).forEach(sale=>{
    for(let k=0;k<sale.count;k++){
      const g=sendTaskGroupPool[cursor%sendTaskGroupPool.length];
      const sent=cursor<task.actualGroups;
      out.push({
        id:'g-'+cursor,sale:sale.name,saleId:sale.id,index:cursor,
        name:g.name,members:g.members,product:g.product,
        status:preview?'待发送':sent?'已发送':'发送失败',
        time:preview?task.planned.slice(11,16)+'（预计）':sent?task.actual.slice(11,16):'—',
        reason:preview||sent?'':['群已被解散','机器人不在群内','群人数已达上限'][cursor%3]
      });
      cursor++;
    }
  });
  return out;
}
function sendTaskNodeContent(task) {
  const material=task.material
    ?'<tr><td>'+escapeText(task.material)+'</td><td>图片</td><td><button type="button" class="el-button is-link el-button--primary" data-preview-material>预览</button></td><td>24 KB</td></tr>'
    :'<tr><td colspan="4" class="send-task-empty">该节点未配置物料</td></tr>';
  return '<section class="send-task-node-content"><h3>节点话术及物料</h3><p>'+escapeText(task.text)+'</p>'+sendTaskTable(['素材名称','素材类型','素材预览','素材大小'],material)+'</section>';
}
function openSendTaskGroups(task) {
  const preview=task.status==='待触发';
  const groups=sendTaskGroupList(task), sales=sendTaskGroupSales(task);
  const pager={page:1,size:10};
  let selected=0;
  const metrics=preview?'':'<div class="send-task-detail-metrics">实际发送销售 <b>'+sales.length+'</b> 人 <span>实际触达群聊 <b>'+task.actualGroups+'</b> 个</span></div>';
  /* 群发任务不论是否已触达，都在最下面展示该节点的话术与物料 */
  const body=sendTaskSummary(task)+metrics+'<div class="send-task-sales-tabs" role="tablist" aria-label="销售群聊分组"></div><div class="send-task-clients-host"></div><nav class="send-task-pagination" aria-label="群聊分页"></nav>'
    +sendTaskNodeContent(task);
  const layer=sendTaskDialog(preview?'预发送群聊':'发送群聊',body,'send-task-clients-modal');
  layer.classList.add('send-task-groups-modal');
  function paint() {
    const tabs=layer.querySelector('.send-task-sales-tabs');
    tabs.innerHTML=sales.map((s,i)=>'<button type="button" role="tab" aria-selected="'+(selected===i)+'" data-sale="'+i+'">'+s.name+'（'+s.count+'）</button>').join('');
    tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.sale);pager.page=1;paint()});
    const sale=sales[selected]||{name:'',count:0};
    const own=groups.filter(g=>g.sale===sale.name);
    const rows=own.slice((pager.page-1)*pager.size,pager.page*pager.size).map(g=>'<tr><td>'+escapeText(g.name)+'</td><td>'+g.members+' 人</td><td>'+tag(g.status,g.status==='已发送'?'success':g.status==='待发送'?'info':'danger')+(g.reason?'<small class="send-task-reason">'+escapeText(g.reason)+'</small>':'')+'</td><td>'+escapeText(g.time)+'</td></tr>').join('');
    layer.querySelector('.send-task-clients-host').innerHTML=sendTaskTable(['群名称','群人数','状态','发送时间'],rows||'<tr><td colspan="4" class="send-task-empty">暂无群聊</td></tr>','send-task-group-table');
    sendTaskPager(layer.querySelector('.send-task-pagination'),pager,own.length,paint,'群聊');
  }
  paint();
  const materialButton=layer.querySelector('[data-preview-material]');
  if(materialButton)materialButton.onclick=()=>sendTaskPreviewMaterial();
}
/* ---------- 建群任务：每个产品群拉进了哪些客户 ---------- */
/* 当前固定SOP 里的建群节点：任务发送情况的建群任务直接读它的自动建群清单 */
function sendTaskSopCreateNode() {
  if (typeof state === 'undefined' || !Array.isArray(state)) return null;
  for (const g of state) for (const n of (g.nodes || [])) if (n && n.action === 'create_group') return { node: n, group: g };
  return null;
}
function sendTaskCreateGroups(task) {
  const preview=task.status==='待触发';
  const sop=sendTaskSopCreateNode();
  const source=(sop && Array.isArray(sop.node.buildGroups) && sop.node.buildGroups.length)
    ? sop.node.buildGroups.map(b=>({name:b.name,product:b.product,pulled:b.count}))
    : sendTaskCreatePool.map((g,i)=>({name:g.name,product:g.product,pulled:Math.min(g.members,268+i*41)}));
  return source.slice(0, task.plannedGroups||source.length).map((g,i)=>{
    const built=i<task.actualGroups;
    return {
      index:i, name:g.name, product:g.product, pulled:g.pulled, planned:g.pulled,
      status:preview?'待建群':built?'已建群':'建群失败',
      time:preview?task.planned.slice(11,16)+'（预计）':built?task.actual.slice(11,16):'—',
      reason:preview||built?'':['产品标签同步失败','企微建群接口超时'][i%2]
    };
  });
}
function sendTaskCreateRows(task,group) {
  const total=Math.min(group.planned,12);
  return Array.from({length:total},(_,i)=>{
    const number=group.index*100+i+1;
    return {
      name:'群客户 '+String(number).padStart(3,'0'),
      wechat:'demo_gm_'+task.period+'_'+number,
      added:'2026-10-0'+(1+i%9)+' '+String(9+i%8).padStart(2,'0')+':24'
    };
  });
}
function openSendTaskCreateGroups(task) {
  const preview=task.status==='待触发';
  const groups=sendTaskCreateGroups(task);
  const pulledTotal=groups.reduce((n,g)=>n+(g.status==='已建群'?g.pulled:0),0);
  const metrics=preview?'':'<div class="send-task-detail-metrics">实际建群 <b>'+task.actualGroups+'</b> 个 <span>实际拉群客户 <b>'+pulledTotal+'</b> 人</span></div>';
  const rows=groups.map(g=>'<tr><td>'+escapeText(g.name)+'</td><td>'+escapeText(g.product)+'</td><td>'+(g.status==='建群失败'?'—':g.planned+' 人')+'</td><td>'+tag(g.status,g.status==='已建群'?'success':g.status==='待建群'?'info':'danger')+(g.reason?'<small class="send-task-reason">'+escapeText(g.reason)+'</small>':'')+'</td><td>'+escapeText(g.time)+'</td><td><button type="button" class="el-button is-link el-button--primary" data-create-detail="'+g.index+'">发送明细</button></td></tr>').join('');
  const body=sendTaskSummary(task)+metrics
    +'<p class="opt-muted">按客户的产品通用渠道标签分别建群；点「发送明细」可查看该群拉进的具体客户。</p>'
    +sendTaskTable(['群名称','产品线','拉群人数','状态','建群时间','操作'],rows,'send-task-group-table');
  const layer=sendTaskDialog(preview?'预拉群':'拉群明细',body,'send-task-clients-modal');
  layer.classList.add('send-task-groups-modal');
  layer.classList.add('send-task-create-modal');
  layer.querySelectorAll('[data-create-detail]').forEach(b=>b.onclick=()=>{
    const g=groups.find(x=>String(x.index)===b.dataset.createDetail);
    if(g)openSendTaskPulledCustomers(task,g);
  });
  const materialButton=layer.querySelector('[data-preview-material]');
  if(materialButton)materialButton.onclick=()=>sendTaskPreviewMaterial();
}
function openSendTaskPulledCustomers(task,group) {
  const customers=sendTaskCreateRows(task,group);
  const values=[['群名称',group.name],['产品线',group.product],['拉群人数',group.planned+' 人'],['群状态',group.status],['建群时间',group.time]].concat(group.reason?[['失败原因',group.reason]]:[]);
  const description='<div class="send-task-description">'+values.map(([key,value])=>'<div><strong>'+key+'</strong><span>'+escapeText(value)+'</span></div>').join('')+'</div>';
  const rows=customers.map(c=>'<tr><td>'+escapeText(c.name)+'</td><td>'+c.wechat+'</td><td>'+c.added+'</td></tr>').join('');
  sendTaskDialog('发送明细',description+sendTaskTable(['客户名称','客户企微ID','加微时间'],rows,'send-task-client-table')+'<p class="opt-muted">演示数据：仅展示前 '+customers.length+' 位客户，该群共 '+group.planned+' 人。</p>','send-task-messages-modal');
}
function sendTaskPreviewMaterial() {
  sendTaskDialog('素材预览','<div class="send-task-demo-poster"><small>雪梨英语 · 演示素材</small><h3>今天，一起开口说英语</h3><p>直播课堂 · 快乐学习</p><span>19:00 准时开课</span></div>','send-task-poster-modal');
}
function openSendTaskMessages(task,sale,client) {
  const values=[['客户名称',client.name],['客户企微ID',client.wechat],['三方客户ID',client.third],['销售企微账号','demo_sales_'+(sale.id+1)],['成功条数',String(client.success)],['失败条数',String(client.failure)]];
  const description='<div class="send-task-description">'+values.map(([key,value])=>'<div><strong>'+key+'</strong><span>'+escapeText(value)+'</span></div>').join('')+'</div>';
  const parts=[{type:'话术',text:task.text},...(task.material?[{type:'图片',text:task.material}]:[])];
  const rows=parts.map((p,i)=>{const failed=task.status==='执行失败';const pending=task.status==='执行中'&&i>0;const status=failed?'失败':pending?'待发送':'成功';return '<tr><td>'+(i+1)+'</td><td>'+p.type+'</td><td class="send-task-message-copy">'+escapeText(p.text)+(p.type==='图片'?'<button type="button" class="el-button is-link el-button--primary" data-message-image>预览</button>':'')+'</td><td>'+tag(status,failed?'danger':pending?'info':'success')+'</td><td>DEMO-MSG-'+task.period+'-'+(sale.id+1)+'-'+(i+1)+'</td><td>'+(pending||failed?'—':task.actual)+'</td><td>'+(failed?'演示：客户关系失效':'—')+'</td></tr>'}).join('');
  const layer=sendTaskDialog('发送明细',description+sendTaskTable(['顺序','消息类型','话术/物料','发送状态','消息ID','完成时间','失败原因'],rows,'send-task-message-table'),'send-task-messages-modal');
  layer.querySelector('[data-message-image]')?.addEventListener('click',sendTaskPreviewMaterial);
}
function sendTaskSyncNav() {
  const nav=document.querySelector('.replica-sidebar');if(!nav)return;
  const config=nav.querySelector('a[href="#/node-config"]');if(!config)return;
  let link=nav.querySelector('a[href="#/send-tasks"]');
  if(!link){link=config.cloneNode(true);link.setAttribute('href','#/send-tasks');link.removeAttribute('aria-current');link.querySelector('.el-text').textContent='任务发送情况';config.after(link)}
  config.onclick=e=>{e.preventDefault();view='configuration';history.replaceState(null,'','#/node-config');render()};
  link.onclick=e=>{e.preventDefault();view='send-tasks';render()};
  for(const item of nav.querySelectorAll('a')){
    const selected=view==='send-tasks'?item===link:view==='configuration'?item===config:view==='materials'?item.getAttribute('href')==='#/material-library':false;
    item.classList.toggle('replica-current',selected);item.querySelector('.el-menu-item')?.classList.toggle('is-active',selected);
    if(selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');
  }
  if(view==='send-tasks')document.querySelectorAll('.breadcrumb-container .el-breadcrumb__item').forEach((item,i)=>{if(i===1){const a=item.querySelector('a');if(a)a.textContent='任务发送情况'}});
}
const sendTaskRenderBefore=render;
render=function(){if(view==='send-tasks')renderSendTasks();else sendTaskRenderBefore();sendTaskSyncNav()};
window.addEventListener('hashchange',()=>{const next={'#/send-tasks':'send-tasks','#/node-config':'configuration','#/material-library':'materials','#/past-periods':'past'}[location.hash];if(next&&next!==view){view=next;render()}});
if(initialPrototypeHash==='#/send-tasks')view='send-tasks';
render();
