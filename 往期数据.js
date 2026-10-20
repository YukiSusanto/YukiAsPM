/* Past-period archive: read-only history of actual trigger counts and the fixed SOP snapshot effective at that time. */
const PAST_SEED_VERSION=1;
const pastPeriodLimit=5;
const pastSalesPool=['销售甲','销售乙','销售丙','销售丁','销售戊','销售己','销售庚'];
/* Deterministic demo profile per archived period: older periods had fewer messages and slightly different send times. */
const pastProfiles=[{drop:0,shift:0},{drop:1,shift:-20},{drop:1,shift:-40},{drop:2,shift:-35},{drop:2,shift:-55}];

function pastToday(){return new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});}
function pastAddDays(iso,days){const d=new Date(iso+'T12:00:00+08:00');d.setDate(d.getDate()+days);return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});}
function pastNumber(value){return Number.isFinite(Number(value))?Number(value).toLocaleString('zh-CN'):'—';}
function pastSalesFor(period){const size=2+((period*7)%3),start=(period*3)%pastSalesPool.length,out=[];for(let i=0;i<size;i++)out.push(pastSalesPool[(start+i)%pastSalesPool.length]);return [...new Set(out)];}
function pastShiftTime(time,minutes){const m=/^(\d{1,2}):(\d{2})$/.exec(String(time||'').trim());if(!m||!minutes)return time;let total=(Number(m[1])*60+Number(m[2])+minutes)%1440;if(total<0)total+=1440;return String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');}

/* Period refs strictly before the demo current period, newest first. */
function pastPeriodRefs(){
  const current=Number(resolveDemoCurrentPeriod())||null;
  const known=Object.keys(periods).map(Number).filter(Number.isFinite);
  const anchor=current??(known.length?Math.min(...known):null);
  if(anchor===null)return [];
  const anchorStart=periods[anchor]?.start||pastToday();
  const refs=[];
  for(let i=0;i<pastPeriodLimit;i++){
    const period=anchor-(i+1);
    const start=periods[period]?.start||pastAddDays(anchorStart,-7*(i+1));
    refs.push({period,start,end:pastAddDays(start,6),sales:periods[period]?.sales||pastSalesFor(period)});
  }
  return refs;
}

/* The snapshot is a frozen deep copy of the fixed SOP config, so later edits cannot rewrite history. */
function pastSnapshotGroups(profile){
  const groups=copy(state).map(group=>({...group,nodes:group.nodes.map(node=>({...node,time:pastShiftTime(node.time,profile.shift)}))}));
  let drop=profile.drop;
  for(let i=groups.length-1;i>=0&&drop>0;i--){
    const take=Math.min(drop,groups[i].nodes.length);
    groups[i].nodes.splice(groups[i].nodes.length-take,take);
    drop-=take;
  }
  groups.forEach(g=>g.nodes.forEach(n=>{delete n.actualSentCount;}));
  return groups;
}
/* Actual result is always <= the estimate and never reused across periods. */
function pastSentCount(node,periodIndex,nodeIndex){
  const base=estimate(node).total;
  const factor=0.62+(((periodIndex+1)*7+(nodeIndex+1)*13)%23)/100;
  return Math.max(0,Math.round(base*factor));
}
function pastBuildEntry(ref,index){
  const profile=pastProfiles[index%pastProfiles.length]||{drop:0,shift:0};
  const groups=pastSnapshotGroups(profile);
  let cursor=0,total=0;
  groups.forEach(g=>g.nodes.forEach(n=>{n.actualSent=pastSentCount(n,index,cursor++);total+=n.actualSent;}));
  return {period:ref.period,start:ref.start,end:ref.end,sales:ref.sales,actualSent:total,nodeCount:groups.length,messageCount:cursor,savedAt:pastAddDays(ref.start,-1)+' 18:00',archivedAt:pastAddDays(ref.end,1)+' 00:05',demo:true,snapshot:{groups}};
}

function pastSeedHistory(force=false){
  const refs=pastPeriodRefs();
  if(!refs.length)return false;
  product.pastPeriods=Array.isArray(product.pastPeriods)?product.pastPeriods:[];
  if(product.pastSeedVersion!==PAST_SEED_VERSION)force=true;
  let changed=false;
  refs.forEach((ref,index)=>{
    if(!force&&product.pastPeriods.some(p=>p.period===ref.period))return;
    product.pastPeriods=product.pastPeriods.filter(p=>p.period!==ref.period);
    product.pastPeriods.push(pastBuildEntry(ref,index));
    changed=true;
  });
  if(product.pastSeedVersion!==PAST_SEED_VERSION){product.pastSeedVersion=PAST_SEED_VERSION;changed=true;}
  product.pastPeriods.sort((a,b)=>b.period-a.period);
  return changed;
}
/* When the demo period rolls over, freeze the period that just ended into the archive. */
function pastArchiveElapsed(){
  const current=Number(resolveDemoCurrentPeriod())||null;
  if(product.pastArchiveCursor===undefined||product.pastArchiveCursor===null){product.pastArchiveCursor=current;return false;}
  if(product.pastArchiveCursor===current)return false;
  const previous=product.pastArchiveCursor;
  product.pastArchiveCursor=current;
  if(!Number.isInteger(previous)||current===null||previous>=current)return true;
  pastSeedHistory();
  const existing=product.pastPeriods.find(p=>p.period===previous);
  if(existing){
    existing.snapshot={groups:pastSnapshotGroups({drop:0,shift:0})};
    existing.archivedAt=new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}).slice(0,16);
    existing.demo=false;
  }
  feedback('本期已切换到第'+current+'期，第'+previous+'期已归档到往期数据');
  return true;
}

function pastMessageRow(node){
  const include=Array.isArray(node.include)?node.include:[],exclude=Array.isArray(node.exclude)?node.exclude:[];
  const groups=Array.isArray(node.groups)?node.groups:[];
  const groupNote=groups.length?'<small class="past-group-note">目标群聊：'+escapeText(groups.map(g=>g.name).join('、'))+'</small>':'';
  const newName=node.newGroupName?'<small class="past-group-note">新群名称：'+escapeText(node.newGroupName)+'</small>':'';
  return '<tr><td class="past-col-time">'+escapeText(node.time||'—')+'</td><td>'+escapeText(communityLabel(node.action))+'</td><td class="past-col-tags">'+(include.length?'<small class="tag-logic-badge">'+(node.includeLogic==='and'?'且':'或')+'</small>'+include.map(t=>tag(t,'success')).join(''):'—')+'</td><td class="past-col-tags">'+(exclude.length?'<small class="tag-logic-badge">'+(node.excludeLogic==='and'?'且':'或')+'</small>'+exclude.map(t=>tag(t,'warning')).join(''):'—')+'</td><td><div class="past-message-text">'+escapeText(communityContentTitle(node)||'—')+'</div>'+groupNote+newName+'</td><td>'+communityMaterialCell(node)+'</td><td class="past-col-sent">'+(Number.isFinite(node.actualSent)?pastNumber(node.actualSent)+'人':'—')+'</td></tr>';
}
/* Inner level: one time node (W-D) per collapsible block, collapsed by default. */
function pastNodeMarkup(group){
  const nodes=Array.isArray(group.nodes)?group.nodes:[];
  const sent=nodes.reduce((n,node)=>n+(Number.isFinite(node.actualSent)?node.actualSent:0),0);
  const code=group.code||'';
  const rawName=group.name||'未命名时间节点';
  /* Node names already carry the W-D code in the captured data, so avoid printing it twice. */
  const name=code&&rawName.startsWith(code)?rawName.slice(code.length).replace(/^[\s\-·:：]+/,''):rawName;
  return '<details class="past-node"><summary class="past-node-summary"><span class="past-node-code">'+escapeText(code||'未编码')+'</span>'+(name?'<span class="past-node-name">'+escapeText(name)+'</span>':'')+'<span class="past-node-meta">'+(group.enabled===false?'停用':'启用')+' · '+nodes.length+'条消息'+(nodes.length?' · 实际发送 '+pastNumber(sent)+'人':'')+'</span><span class="past-toggle-open">展开 ⌄</span><span class="past-toggle-close">收起 ⌃</span></summary>'+(nodes.length?'<div class="past-table-wrap"><table class="past-table"><thead><tr><th>时间</th><th>发送动作</th><th>选中标签</th><th>排除标签</th><th>话术内容</th><th>素材</th><th>实际发送人数</th></tr></thead><tbody>'+nodes.map(pastMessageRow).join('')+'</tbody></table></div>':'<div class="past-snapshot-empty">该时间节点当期无消息</div>')+'</details>';
}
/* Outer level: one past period per collapsible block, collapsed by default. */
function pastPeriodMarkup(entry){
  const sales=Array.isArray(entry.sales)?entry.sales:[];
  const groups=entry.snapshot&&Array.isArray(entry.snapshot.groups)?entry.snapshot.groups:[];
  const messageCount=entry.messageCount??groups.reduce((n,g)=>n+(g.nodes?.length||0),0);
  const nodeCount=entry.nodeCount??groups.length;
  return '<details class="past-period"><summary class="past-period-summary"><span class="past-period-name">第'+entry.period+'期</span><span class="past-period-range">'+escapeText(entry.start)+' 至 '+escapeText(entry.end)+'</span><span class="past-period-sales">关联销售 '+sales.length+'名</span><span class="past-period-nodes">时间节点 '+nodeCount+'个 · 消息 '+messageCount+'条</span><span class="past-period-metric">实际触发人数 <strong>'+pastNumber(entry.actualSent)+'人</strong></span><span class="past-toggle-open">展开 ⌄</span><span class="past-toggle-close">收起 ⌃</span></summary><div class="past-period-body"><div class="past-period-cards"><div><label>期数</label><strong>第'+entry.period+'期</strong></div><div><label>期数时间</label><strong>'+escapeText(entry.start)+' 至 '+escapeText(entry.end)+'</strong></div><div><label>关联销售</label><strong>'+sales.length+'名</strong><small>'+escapeText(sales.join('、')||'—')+'</small></div><div><label>时间节点 / 消息</label><strong>'+nodeCount+'个 / '+messageCount+'条</strong></div><div class="past-metric"><label>实际触发人数</label><strong>'+pastNumber(entry.actualSent)+'人</strong><small>当期全部消息累计实际发送</small></div></div><div class="past-snapshot-head"><strong>当时的模块快照</strong><span class="past-readonly-badge">只读</span><span class="past-snapshot-meta">配置保存于 '+escapeText(entry.savedAt||'—')+' · 归档于 '+escapeText(entry.archivedAt||'—')+(entry.demo?' · 演示数据':'')+'</span></div><p class="past-snapshot-note">快照为该期执行时生效的固定SOP配置副本，之后修改固定SOP不会改变这里的内容；该期已发送记录也不会被重写。展开下方时间节点可查看当期的时间、发送动作、话术等字段。</p>'+(groups.map(pastNodeMarkup).join('')||'<div class="opt-empty">该期无时间节点配置</div>')+'</div></details>';
}

function pastListMarkup(list){
  if(!list.length)return '<div class="past-empty"><strong>暂无往期数据</strong><p>本期之前没有已结束的期数。系统在本期切换后会自动把上一期归档到这里。</p></div>';
  return '<div class="past-list">'+list.map(pastPeriodMarkup).join('')+'</div>';
}

/* Full page instead of a drawer, so long snapshots use the whole workspace width. */
function pastSetNav(){
  const nav=document.querySelector('.replica-sidebar');
  const link=nav&&nav.querySelector('a[href="#/node-config"]');
  if(link){
    link.querySelector('.el-text').textContent='消息节点配置';
    link.onclick=e=>{e.preventDefault();view='configuration';history.replaceState(null,'','#/node-config');render();};
  }
  document.querySelectorAll('.breadcrumb-container .el-breadcrumb__item').forEach((item,i)=>{if(i===1){const anchor=item.querySelector('a');if(anchor)anchor.textContent='往期数据';}});
}
function pastBackToConfiguration(){view='configuration';history.replaceState(null,'','#/node-config');render();}
function renderPastPage(){
  activeSop.period=Number(resolveDemoCurrentPeriod())||null;
  history.replaceState(null,'','#/past-periods');
  root.innerHTML='<div class="workspace-page past-page"><header class="workspace-header"><div><div class="workspace-breadcrumb">'+btn('消息节点配置','is-link el-button--primary')+'<span>/</span><span>往期数据</span></div><h2>往期数据</h2></div><div>'+btn('返回消息节点配置')+'</div></header><section class="past-page-panel"><p class="past-page-note">按时间倒序展示已结束期数：外层按期数、内层按时间节点（W-D）逐级折叠，默认均不展开。展开后可查看该期实际触发人数与当时的只读模块快照；修改当前固定SOP不会影响历史快照。</p><div class="past-page-host" aria-live="polite"><div class="past-loading"><span class="past-spinner" aria-hidden="true"></span>正在加载往期数据…</div></div></section></div>';
  pastSetNav();
  const back=buttons(root,'返回消息节点配置')[0];
  if(back)back.onclick=pastBackToConfiguration;
  const breadcrumb=buttons(root,'消息节点配置')[0];
  if(breadcrumb)breadcrumb.onclick=pastBackToConfiguration;
  const host=root.querySelector('.past-page-host');
  setTimeout(()=>{
    if(!host.isConnected)return;
    pastSeedHistory();
    host.innerHTML=pastListMarkup([...(product.pastPeriods||[])].sort((a,b)=>b.period-a.period));
  },420);
}
function openPastPeriods(){view='past';history.replaceState(null,'','#/past-periods');render();}

function pastAttachEntry(scope,title){
  if(!scope||!title||scope.querySelector('.past-periods-entry'))return;
  scope.classList.add('workspace-title-line');
  const entry=document.createElement('button');
  entry.type='button';
  entry.className='el-button past-periods-entry';
  entry.textContent='往期数据';
  entry.title='查看历史期数的实际触发人数与当时的模块快照';
  entry.onclick=openPastPeriods;
  title.after(entry);
}
const pastConfigurationBefore=renderConfiguration;
renderConfiguration=function(){
  pastConfigurationBefore();
  if(pastArchiveElapsed())saveProduct();
  const header=root.querySelector('.workspace-header');
  if(header){pastAttachEntry(header.querySelector('h2')?.parentElement,header.querySelector('h2'));return;}
  const fallback=root.querySelector('.opt-page-head');
  if(fallback)pastAttachEntry(fallback,fallback.querySelector('h2'));
};
const pastRenderBefore=render;
render=function(){
  if(view==='past'){if(pastArchiveElapsed())saveProduct();renderPastPage();return;}
  pastRenderBefore();
};

if(pastSeedHistory())saveProduct();
/* view already carries the deep link from the initial hash check. */
if(view==='past'||view==='configuration')render();
