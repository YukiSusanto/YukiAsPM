'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
try{
 const catalog=read('data/catalog.json'),mapping=read('data/classification.json');
 const ids=new Set(),customers=new Set(),messages=new Set(),secondary=new Set(catalog.secondary.map(s=>s.id)),mapped=new Map(mapping.map(m=>[m.primary+'\t'+m.description,m.secondary]));
 let occurrences=0;
 for(const e of catalog.events){
  if(!/^\d+$/.test(e.id)||ids.has(e.id)||!secondary.has(e.secondary)||!catalog.primary[e.primary])throw Error('Invalid event/index identity');ids.add(e.id);customers.add(e.customer);
  if(mapped.get(e.primary+'\t'+e.description)!==e.secondary)throw Error('Classification mismatch');
  const record=read('data/events/'+e.id+'.json');
  if(record.handoff.handoff_id!==e.handoffId||record.messages.length!==e.messageCount)throw Error('Event file/index mismatch');
  const begin=Date.parse(e.start.replace(' ','T')+'+08:00'),end=Date.parse(e.end.replace(' ','T')+'+08:00');
  const local=new Set();let previous=-Infinity;
  for(const m of record.messages){const time=typeof m.createdAt==='string'&&!/^\d+$/.test(m.createdAt)?Date.parse(m.createdAt):Number(m.createdAt);if(!(time>=begin&&time<end)||time<previous||local.has(m._id))throw Error('Message window/order/duplicate mismatch');previous=time;local.add(m._id);messages.add(m._id);if(String(m.vid)!==String(e.vid)||String(m.userId)!==String(e.userId))throw Error('Message customer mismatch');occurrences++;}
 }
 const files=fs.readdirSync(path.join(root,'data/events'));if(files.length!==ids.size||files.some(f=>!/^\d+\.json$/.test(f)||!ids.has(f.slice(0,-5))))throw Error('Unexpected or missing event files');
 if(ids.size!==catalog.totals.events||customers.size!==catalog.totals.customers||occurrences!==catalog.totals.messages||messages.size!==catalog.totals.uniqueMessages)throw Error('Summary mismatch');
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');if(app.includes('/api/events/')||/fetch\(['"]\//.test(app)||/(?:href|src)="\//.test(html))throw Error('Non-static or origin-absolute resource path');
 console.log(JSON.stringify({events:ids.size,customers:customers.size,message_occurrences:occurrences,unique_messages:messages.size,primary:Object.keys(catalog.primary).length,secondary:secondary.size,classification_descriptions:mapping.length,validation:'passed'}));
}catch(error){console.error(error.message);process.exitCode=1;}
