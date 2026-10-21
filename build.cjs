const fs=require('fs'),path=require('path');
const dir=__dirname;
const data=JSON.parse(fs.readFileSync(path.join(dir,'页面采集.json'),'utf8'));
data.navigation=JSON.parse(fs.readFileSync(path.join(dir,'导航采集.json'),'utf8'));
const savedCss=path.join(dir,'原版样式.css');
const inlineCss=source=>source.replace(/@import\s+[^;]+;/gi,'').replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(whole,quote,url)=>/^(data:|blob:|#)/i.test(url.trim())?whole:'none');
const css=inlineCss(fs.existsSync(savedCss)?fs.readFileSync(savedCss,'utf8'):data.assets.map(x=>fs.readFileSync(x.path,'utf8')).join('\n'));
fs.writeFileSync(path.join(dir,'原版样式.css'),css);
const js=['交互.js','优化交互.js','布局优化.js','素材库.js','素材库布局.js','素材分页.js','紧凑布局.js','固定SOP交互.js','社群动作.js','界面美化.js','视频号素材.js','建群示例.js','任务发送情况.js','素材简化.js','欢迎语配置.js'].map(name=>fs.readFileSync(path.join(dir,name),'utf8')).join('\n');
const extra=inlineCss(fs.readFileSync(path.join(dir,'适配.css'),'utf8'));
// Package only templates actually used by the page; omit collection logs and unused remote material snapshots.
const templates={pages:data.pages,editor:data.editor,stage:data.stage,relative:data.relative,navigation:{sidebar:data.navigation.sidebar,header:data.navigation.header}};
const html='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI触发SOP · 社群SOP版</title><style>'+css+'\n'+extra+'</style></head><body><main id="replica"></main><div id="dialogs"></div><script>const captured='+JSON.stringify(templates).replace(/</g,'\\u003c')+';\n'+js+'</script></body></html>';
if(/<script\b[^>]*\bsrc\s*=/i.test(html)||/<link\b[^>]*\b(?:href|rel)\s*=/i.test(html))throw new Error('单文件校验失败：存在外链脚本或样式');
const packagedStyles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
if(/@import\s/i.test(packagedStyles)||[...packagedStyles.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)].some(m=>!/^(data:|blob:|#)/i.test(m[2].trim())))throw new Error('单文件校验失败：存在外部CSS资源');
fs.writeFileSync(path.join(dir,'AI触发SOP-社群SOP版.html'),html);
fs.writeFileSync(path.join(dir,'AI触发SOP-社群SOP单文件版.html'),html);
console.log('已生成并校验单文件HTML：CSS/JS全部内联，无外链脚本、样式或CSS资源。');

