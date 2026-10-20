"""Publish compiled prototypes from both development branches in one Pages site."""
import html
from pathlib import Path
import shutil
import sys


def redirect(target):
    escaped = html.escape(target, quote=True)
    return ('<!doctype html><html lang="zh-CN"><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>正在打开原型</title>'
            f'<meta http-equiv="refresh" content="0;url={escaped}">'
            f'<script>location.replace("{target}"+location.search+location.hash)</script>'
            f'<a href="{escaped}">打开原型</a></html>')


def build(sources, output):
    prototypes = [
        ('stubborn-sop', 'AI触发SOP-固定SOP版.html', 'AI触发SOP-固定SOP单文件版.html'),
        ('social-chat-sop', 'AI触发SOP-社群SOP版.html', 'AI触发SOP-社群SOP单文件版.html'),
    ]
    # Validate all inputs before writing the collection.
    for branch, filename, _ in prototypes:
        source = sources / branch / filename
        if not source.is_file():
            raise FileNotFoundError(source)
    output.mkdir(parents=True, exist_ok=True)
    for branch, filename, alternate in prototypes:
        folder = output / branch
        folder.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(sources / branch / filename, folder / 'index.html')
        # Keep previously shared file URLs working.
        for alias in (filename, alternate):
            (output / alias).write_text(redirect(f'./{branch}/'), encoding='utf-8')
    legacy = output / 'sop-prototype'
    legacy.mkdir(parents=True, exist_ok=True)
    for filename in ('index.html', 'optimized-sop.html'):
        (legacy / filename).write_text(redirect('../social-chat-sop/'), encoding='utf-8')
    (output / '.nojekyll').write_text('', encoding='utf-8')
    (output / 'index.html').write_text(HOME, encoding='utf-8')
    print('Built collection: stubborn-sop/ and social-chat-sop/')


HOME = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>YukiAsPM · 产品原型</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f6f8fc;color:#25324a;font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif}
main{max-width:980px;margin:100px auto;padding:0 28px}.brand{font-size:14px;color:#536dca;font-weight:600;letter-spacing:.05em}h1{font-size:38px;letter-spacing:-.04em;margin:16px 0}p{color:#6b778c;line-height:1.8}.cards{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:38px}
a.card{display:flex;flex-direction:column;align-items:flex-start;min-height:240px;padding:30px;border:1px solid #e1e7f0;border-radius:16px;background:#fff;color:inherit;text-decoration:none;transition:transform .15s,border-color .15s}a.card:hover{transform:translateY(-3px);border-color:#9babdf}a:focus-visible{outline:3px solid #536dca;outline-offset:4px}.badge{font-size:12px;background:#edf2ff;color:#536dca;border-radius:6px;padding:5px 9px}h2{font-size:23px;margin:18px 0 8px}.card p{font-size:14px;margin:0 0 24px}.open{margin-top:auto;color:#4a65c0;font-size:14px;font-weight:600}footer{margin-top:30px;font-size:12px;color:#8b95a8}
@media(max-width:640px){main{margin:55px auto;padding:0 20px}.cards{grid-template-columns:1fr}h1{font-size:30px}a.card{min-height:210px;padding:24px}}
</style></head><body><main><span class="brand">YukiAsPM</span><h1>产品原型</h1><p>选择一个版本，查看并体验完整交互。</p>
<div class="cards"><a class="card" href="./stubborn-sop/"><span class="badge">固定 SOP</span><h2>固定 SOP 版</h2><p>固定消息规则、时间节点配置与素材引用。</p><span class="open">打开原型 →</span></a>
<a class="card" href="./social-chat-sop/"><span class="badge">社群 SOP</span><h2>社群 SOP 版</h2><p>社群消息、自动建群、群公告与群聊管理。</p><span class="open">打开原型 →</span></a></div><footer>原型中的业务数据为演示数据。</footer></main></body></html>'''


if __name__ == '__main__':
    build(Path(sys.argv[1]), Path(sys.argv[2]))
