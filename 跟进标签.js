/* Follow-up tag selection uses a temporary selection until confirmation. */
function followupTagGroups(rule){
 const common=[...new Set([...state.flatMap(g=>g.nodes.flatMap(n=>[...(n.include||[]),...(n.exclude||[])])),...(rule.tags||[]),'承诺到课','已到课','勿扰','非推广员','已购'])];
 return [
  {name:'支援AI标签2',tags:['测试线134期D3到课-1022','测试线134期D2到课-1021','测试线134期D1到课-1020','测试线134期D3点链接-1022','测试线134期D2点链接-1021','测试线134期D1点链接-1020','测试线134期APP-1018','测试线134期APP-1017']},
  {name:'体验课-用户标签',tags:common},
  {name:'芝麻微客-在群状态',tags:['已入群','未入群','已退群']},
  {name:'测试线直播标',tags:['直播预约','直播到课','直播未到课']},
  {name:'螳螂测试-勿动',tags:['测试用户','测试已回复']},
  {name:'ai 测试-勿动',tags:['AI待跟进','AI已跟进']},
  {name:'销转-大课营销到课标-CD区',tags:['大课已到课','大课待到课']},
  {name:'销转-大课营销临时进群标签1',tags:['临时进群','待转化']},
  {name:'客户跟进状态',tags:['待回复','已回复','有意向','暂不考虑']}
 ];
}
function selectFollowupTags(editor,rule){
 const groups=followupTagGroups(rule),selected=new Set(rule.tags||[]),pageSize=8;
 let groupIndex=0,groupPage=1,tagPage=1,query='';
 const layer=document.createElement('div');layer.className='el-overlay followup-tag-overlay';
 layer.innerHTML='<section class="followup-tag-dialog" role="dialog" aria-modal="true" aria-label="选择企微标签"><header><h2>选择企微标签</h2><button type="button" class="followup-tag-close" aria-label="关闭标签选择">×</button></header><div class="followup-tag-workspace"><aside class="followup-tag-selected"><strong>已选标签</strong><p class="followup-selected-count"></p><div class="followup-selected-list"></div></aside><div class="followup-tag-main"><input class="local-input followup-tag-search" aria-label="搜索企微标签" placeholder="请输入标签名称搜索"><div class="followup-tag-columns"><section><h3>一级标签</h3><div class="followup-tag-groups"></div><nav class="followup-group-pages" aria-label="一级标签分页"></nav></section><section><h3>二级标签</h3><div class="followup-tag-options"></div><nav class="followup-option-pages" aria-label="二级标签分页"></nav></section></div></div></div><footer><button type="button" class="el-button followup-tag-cancel">取消</button><button type="button" class="el-button el-button--primary followup-tag-confirm">确认选择</button></footer></section>';
 const previousFocus=document.activeElement,controller=new AbortController();
 function dismiss(){controller.abort();layer.remove();previousFocus?.focus();}
 function filteredGroups(){return groups.map((g,index)=>({...g,index,tags:g.tags.filter(t=>!query||t.toLowerCase().includes(query)||g.name.toLowerCase().includes(query))})).filter(g=>!query||g.tags.length);}
 function pagination(host,total,page,onChange){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  host.innerHTML='<span>共 '+total+' 条</span><button type="button" aria-label="上一页" '+(page===1?'disabled':'')+'>‹</button>'+Array.from({length:pages},(_,i)=>'<button type="button" data-page="'+(i+1)+'" '+(page===i+1?'aria-current="page"':'')+'>'+(i+1)+'</button>').join('')+'<button type="button" aria-label="下一页" '+(page===pages?'disabled':'')+'>›</button>';
  host.querySelector('[aria-label="上一页"]').onclick=()=>onChange(page-1);host.querySelector('[aria-label="下一页"]').onclick=()=>onChange(page+1);host.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>onChange(Number(b.dataset.page)));
 }
 function paint(){
  const visible=filteredGroups();if(!visible.some(g=>g.index===groupIndex)){groupIndex=visible[0]?.index??-1;tagPage=1;}
  groupPage=Math.min(groupPage,Math.max(1,Math.ceil(visible.length/pageSize)));
  const chosen=layer.querySelector('.followup-selected-list');chosen.innerHTML='';layer.querySelector('.followup-selected-count').textContent='已选择 '+selected.size+' 个标签';
  if(!selected.size)chosen.innerHTML='<div class="followup-tag-empty"><span aria-hidden="true">◇</span><p>暂未选择标签</p></div>';
  selected.forEach(t=>{const chip=document.createElement('div');chip.className='followup-selected-chip';const name=document.createElement('span');name.textContent=t;const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','移除标签 '+t);remove.onclick=()=>{selected.delete(t);paint()};chip.append(name,remove);chosen.append(chip)});
  const left=layer.querySelector('.followup-tag-groups');left.innerHTML='';
  visible.slice((groupPage-1)*pageSize,groupPage*pageSize).forEach(g=>{const b=document.createElement('button');b.type='button';b.className=g.index===groupIndex?'active':'';b.innerHTML='<span>'+escapeText(g.name)+'</span><span aria-hidden="true">›</span>';b.onclick=()=>{groupIndex=g.index;tagPage=1;paint()};left.append(b)});
  if(!visible.length)left.innerHTML='<p class="followup-no-tags">暂无匹配分类</p>';
  const tags=visible.find(g=>g.index===groupIndex)?.tags||[];tagPage=Math.min(tagPage,Math.max(1,Math.ceil(tags.length/pageSize)));
  const right=layer.querySelector('.followup-tag-options');right.innerHTML='';
  tags.slice((tagPage-1)*pageSize,tagPage*pageSize).forEach(t=>{const label=document.createElement('label');label.innerHTML='<span>'+escapeText(t)+'</span><input type="checkbox" aria-label="'+escapeText(t)+'" '+(selected.has(t)?'checked':'')+'>';label.querySelector('input').onchange=e=>{if(e.target.checked)selected.add(t);else selected.delete(t);paint()};right.append(label)});
  if(!tags.length)right.innerHTML='<p class="followup-no-tags">暂无匹配标签</p>';
  pagination(layer.querySelector('.followup-group-pages'),visible.length,groupPage,p=>{groupPage=p;groupIndex=visible[(p-1)*pageSize]?.index??-1;tagPage=1;paint()});
  pagination(layer.querySelector('.followup-option-pages'),tags.length,tagPage,p=>{tagPage=p;paint()});
 }
 layer.querySelector('.followup-tag-search').oninput=e=>{query=e.target.value.trim().toLowerCase();groupPage=tagPage=1;paint()};
 layer.querySelector('.followup-tag-close').onclick=dismiss;layer.querySelector('.followup-tag-cancel').onclick=dismiss;
 layer.querySelector('.followup-tag-confirm').onclick=()=>{rule.tags=[...selected];dismiss();renderReply(editor)};
 layer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();dismiss();return;}if(e.key==='Tab'){const focusable=[...layer.querySelectorAll('button:not(:disabled),input')];const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}},{signal:controller.signal});
 dialogs.append(layer);paint();layer.querySelector('.followup-tag-search').focus();
}
renderReply=function(editor){
 const sw=editor.querySelector('.reply-config .el-switch');sw.classList.toggle('is-checked',draft.reply);sw.querySelector('input').checked=draft.reply;sw.querySelector('input').setAttribute('aria-checked',String(draft.reply));sw.querySelector('.el-switch__label--left').classList.toggle('is-active',!draft.reply);sw.querySelector('.el-switch__label--right').classList.toggle('is-active',draft.reply);
 editor.querySelector('.local-rules')?.remove();if(!draft.reply)return;
 const host=document.createElement('div');host.className='local-rules opt-reply-list';
 draft.rules.forEach((r,i)=>{
  const card=document.createElement('div');card.className='opt-reply-card';
  card.innerHTML='<div class="opt-section-head"><strong>跟进回复 '+(i+1)+'</strong>'+btn('删除','is-link el-button--danger')+'</div>'+field('用户回复内容','<input class="local-input" aria-label="用户回复内容 '+(i+1)+'" placeholder="例如：1 / 可以参加" value="'+escapeText(r.trigger)+'">')+field('跟进方式','<select class="local-select" aria-label="跟进方式 '+(i+1)+'"><option>快捷回复</option><option>打标签</option></select>');
  card.querySelector('input').oninput=e=>r.trigger=e.target.value;
  const select=card.querySelector('select');select.value=r.type==='打标签'?'打标签':'快捷回复';select.onchange=()=>{r.type=select.value;renderReply(editor);if(r.type==='打标签')selectFollowupTags(editor,r)};
  if(r.type==='打标签'){
   const box=document.createElement('div');box.className='opt-field followup-rule-tags';box.innerHTML='<label>企微标签</label><div class="followup-rule-selected">'+((r.tags||[]).length?r.tags.map(t=>tag(t,'primary')).join(' '):'<span class="opt-muted">暂未选择标签</span>')+'</div>'+btn('选择企微标签','is-plain el-button--primary');box.querySelector('button').onclick=()=>selectFollowupTags(editor,r);card.append(box);
  }else{
   const content=document.createElement('div');content.innerHTML=field('回复内容','<textarea class="el-textarea__inner" aria-label="跟进回复内容 '+(i+1)+'" rows="3" placeholder="填写回复话术">'+escapeText(r.content||'')+'</textarea>');content.querySelector('textarea').oninput=e=>r.content=e.target.value;card.append(content);
  }
  buttons(card,'删除')[0].onclick=()=>{draft.rules.splice(i,1);renderReply(editor)};host.append(card);
 });
 const add=document.createElement('button');add.type='button';add.className='el-button el-button--primary is-plain';add.textContent='添加跟进回复';add.onclick=()=>{draft.rules.push({trigger:'',type:'快捷回复',content:'',tags:[]});renderReply(editor)};host.append(add);editor.querySelector('.reply-config').append(host);
};
