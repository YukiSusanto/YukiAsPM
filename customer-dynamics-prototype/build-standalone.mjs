import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceHtmlPath = path.join(projectDirectory, 'index.html');
const sourceCssPath = path.join(projectDirectory, 'styles.css');
const sourceJsPath = path.join(projectDirectory, 'app.js');
const outputPath = path.join(projectDirectory, 'index-standalone.html');

const [html, css, javascript] = await Promise.all([
  readFile(sourceHtmlPath, 'utf8'),
  readFile(sourceCssPath, 'utf8'),
  readFile(sourceJsPath, 'utf8'),
]);

if (css.includes('</style>')) throw new Error('styles.css 包含 </style>，无法安全内嵌');
if (javascript.includes('</script>')) throw new Error('app.js 包含 </script>，无法安全内嵌');

const stylesheetTag = '    <link rel="stylesheet" href="styles.css" />';
const scriptTag = '    <script src="app.js"></script>';
const contentSecurityPolicy = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
  "img-src data:",
  "connect-src 'none'",
  "font-src 'none'",
  "media-src 'none'",
  "object-src 'none'",
].join('; ');

if (!html.includes(stylesheetTag)) throw new Error('index.html 中未找到 styles.css 引用');
if (!html.includes(scriptTag)) throw new Error('index.html 中未找到 app.js 引用');

const standaloneHtml = html
  .replace(
    '    <meta name="theme-color" content="#f5f7fa" />',
    `    <meta name="theme-color" content="#f5f7fa" />\n    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />`,
  )
  .replace(stylesheetTag, `    <style>\n${css}\n    </style>`)
  .replace(scriptTag, `    <script>\n${javascript}\n    </script>`);

await writeFile(outputPath, standaloneHtml, 'utf8');
console.log(`已生成无外部依赖版本：${outputPath}`);
