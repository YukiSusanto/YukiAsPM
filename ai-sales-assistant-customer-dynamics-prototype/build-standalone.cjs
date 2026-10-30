const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');

async function build() {
  const root = __dirname;
  const read = name => fs.readFile(path.join(root, name), 'utf8');
  let [html, app, dynamics, styles, dynamicsStyles] = await Promise.all([
    read('index.html'), read('app.js'), read('dynamics.js'), read('style.css'), read('dynamics.css')
  ]);
  const cachePath = path.join(root, 'standalone-assets.json');
  let cache = {};
  try { cache = JSON.parse(await fs.readFile(cachePath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const mainAvatar = app.match(/const avatarImage = '([^']+)';/)[1];
  const teacherAvatar = app.match(/const teacherImage = '([^']+)';/)[1];
  const avatarKeys = vm.runInNewContext('(' + app.match(/const customerAvatars=(\{[\s\S]*?\n\});/)[1] + ')');
  const urls = [mainAvatar, teacherAvatar, ...Object.values(avatarKeys).map(key => 'https://wx.qlogo.cn/mmhead/' + key + '/0')];
  await Promise.all(urls.map(async url => {
    if (cache[url]) return;
    const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`Avatar download failed (${response.status})`);
    const mime = response.headers.get('content-type')?.split(';')[0];
    if (!mime?.startsWith('image/')) throw new Error('Avatar response is not an image');
    cache[url] = `data:${mime};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
  }));
  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
  const standaloneAvatars = Object.fromEntries(Object.entries(avatarKeys).map(([id,key]) => [id, cache['https://wx.qlogo.cn/mmhead/' + key + '/0']]));
  app = app.replace(/const avatarImage = '[^']+';/, 'const avatarImage = ' + JSON.stringify(cache[mainAvatar]) + ';')
    .replace(/const teacherImage = '[^']+';/, 'const teacherImage = ' + JSON.stringify(cache[teacherAvatar]) + ';')
    .replace("'https://wx.qlogo.cn/mmhead/'+customerAvatars[c.id]+'/0'", 'standaloneAvatars[c.id]');
  app = 'const standaloneAvatars = ' + JSON.stringify(standaloneAvatars) + ';\n' + app;
  const script = source => '<script>\n' + source.replace(/<\/script/gi, '<\\/script') + '\n</script>';
  html = html.replace('<link rel="stylesheet" href="./style.css">', '<style>\n' + styles + '\n</style>')
    .replace('<link rel="stylesheet" href="./dynamics.css">', '<style>\n' + dynamicsStyles + '\n</style>')
    .replace('<script src="./dynamics.js"></script>', () => script(dynamics))
    .replace('<script src="./app.js"></script>', () => script(app))
    .replace('<meta charset="UTF-8">', '<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; font-src \'none\'; media-src \'none\'; object-src \'none\'; base-uri \'none\'">');
  if (/https?:\/\//i.test(html) || /<(?:script|link)\b[^>]*(?:src|href)=/i.test(html) || /\b(?:fetch|import)\s*\(/.test(html)) throw new Error('External dependency detected in standalone output');
  const output = path.join(root, 'index-standalone.html');
  await fs.writeFile(output, html);
  console.log(`Standalone HTML ready: ${output} (${Buffer.byteLength(html)} bytes, ${urls.length} embedded images)`);
}
build().catch(error => { console.error(error.message); process.exitCode = 1; });
