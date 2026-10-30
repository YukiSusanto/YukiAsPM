"""Publish the stable prototype collection from main only."""
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
        ('stubborn-sop', '固定SOP', 'AI触发SOP-固定SOP版.html', 'AI触发SOP-固定SOP单文件版.html'),
        ('social-chat-sop', '社群SOP', 'AI触发SOP-社群SOP版.html', 'AI触发SOP-社群SOP单文件版.html'),
    ]
    # Validate all inputs before writing the collection.
    for branch, label, filename, _ in prototypes:
        source = sources / 'sop-prototype' / label / '原型' / filename
        if not source.is_file():
            raise FileNotFoundError(source)
    quality_source = sources / 'conversation-quality-prototype'
    quality_files = ('index.html', 'styles.css', 'app.js')
    for filename in quality_files:
        source = quality_source / filename
        if not source.is_file():
            raise FileNotFoundError(source)
    dynamics_source = sources / 'customer-dynamics-prototype'
    dynamics_files = ('index.html', 'styles.css', 'app.js')
    for filename in dynamics_files:
        source = dynamics_source / filename
        if not source.is_file():
            raise FileNotFoundError(source)
    sales_source = sources / 'ai-sales-assistant-customer-dynamics-prototype'
    sales_files = ('index.html', 'style.css', 'app.js', 'dynamics.css', 'dynamics.js', 'AI销售助手-侧边栏优化需求文档.md')
    for filename in sales_files:
        source = sales_source / filename
        if not source.is_file():
            raise FileNotFoundError(source)
    dashboard_source = sources / 'dashboard' / '134期-handoff-dashboard'
    dashboard_files = ('index.html', 'app.js', 'style.css')
    for filename in (*dashboard_files, 'data/catalog.json', 'data/classification.json'):
        source = dashboard_source / filename
        if not source.is_file():
            raise FileNotFoundError(source)
    output.mkdir(parents=True, exist_ok=True)
    for branch, label, filename, alternate in prototypes:
        folder = output / branch
        folder.mkdir(parents=True, exist_ok=True)
        source_folder = sources / 'sop-prototype' / label / '原型'
        canonical = output / 'sop-prototype' / label / '原型'
        canonical.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source_folder / filename, canonical / 'index.html')
        for name in (filename, alternate):
            shutil.copyfile(source_folder / name, canonical / name)
        # Retain the existing share URLs with identical content.
        shutil.copyfile(source_folder / filename, folder / 'index.html')
        # Keep previously shared file URLs working.
        for alias in (filename, alternate):
            (output / alias).write_text(redirect(f'./{branch}/'), encoding='utf-8')
    quality_output = output / 'conversation-quality-prototype'
    quality_output.mkdir(parents=True, exist_ok=True)
    for filename in quality_files:
        shutil.copyfile(quality_source / filename, quality_output / filename)
    dynamics_output = output / 'customer-dynamics-prototype'
    dynamics_output.mkdir(parents=True, exist_ok=True)
    for filename in dynamics_files:
        shutil.copyfile(dynamics_source / filename, dynamics_output / filename)
    sales_output = output / 'ai-sales-assistant-customer-dynamics-prototype'
    sales_output.mkdir(parents=True, exist_ok=True)
    for filename in sales_files:
        shutil.copyfile(sales_source / filename, sales_output / filename)
    shutil.copytree(sales_source / 'screenshots', sales_output / 'screenshots', dirs_exist_ok=True)
    dashboard_output = output / 'dashboard' / '134期-handoff-dashboard'
    dashboard_output.mkdir(parents=True, exist_ok=True)
    for filename in dashboard_files:
        shutil.copyfile(dashboard_source / filename, dashboard_output / filename)
    shutil.copytree(dashboard_source / 'data', dashboard_output / 'data', dirs_exist_ok=True)
    legacy = output / 'sop-prototype'
    legacy.mkdir(parents=True, exist_ok=True)
    for filename in ('index.html', 'optimized-sop.html'):
        (legacy / filename).write_text(redirect('../social-chat-sop/'), encoding='utf-8')
    (output / '.nojekyll').write_text('', encoding='utf-8')
    (output / 'index.html').write_text(HOME, encoding='utf-8')
    print('Built main collection including period-134 dashboard and legacy share URLs')


HOME = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>YukiAsPM · 产品原型</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f6f8fc;color:#25324a;font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif}
main{max-width:1200px;margin:100px auto;padding:0 28px}.brand{font-size:14px;color:#536dca;font-weight:600;letter-spacing:.05em}h1{font-size:38px;letter-spacing:-.04em;margin:16px 0}p{color:#6b778c;line-height:1.8}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:38px}
a.card{display:flex;flex-direction:column;align-items:flex-start;min-height:240px;padding:30px;border:1px solid #e1e7f0;border-radius:16px;background:#fff;color:inherit;text-decoration:none;transition:transform .15s,border-color .15s}a.card:hover{transform:translateY(-3px);border-color:#9babdf}a:focus-visible{outline:3px solid #536dca;outline-offset:4px}.badge{font-size:12px;background:#edf2ff;color:#536dca;border-radius:6px;padding:5px 9px}h2{font-size:23px;margin:18px 0 8px}.card p{font-size:14px;margin:0 0 24px}.open{margin-top:auto;color:#4a65c0;font-size:14px;font-weight:600}footer{margin-top:30px;font-size:12px;color:#8b95a8}
@media(max-width:900px){.cards{grid-template-columns:1fr 1fr}}@media(max-width:640px){main{margin:55px auto;padding:0 20px}.cards{grid-template-columns:1fr}h1{font-size:30px}a.card{min-height:210px;padding:24px}}
</style></head><body><main><span class="brand">YukiAsPM</span><h1>产品原型</h1><p>选择一个版本，查看并体验完整交互。</p>
<div class="cards"><a class="card" href="./sop-prototype/固定SOP/原型/"><span class="badge">固定 SOP</span><h2>固定 SOP 版</h2><p>固定消息规则、时间节点配置与素材引用。</p><span class="open">打开原型 →</span></a>
<a class="card" href="./sop-prototype/社群SOP/原型/"><span class="badge">社群 SOP</span><h2>社群 SOP 版</h2><p>社群消息、自动建群、群公告与群聊管理。</p><span class="open">打开原型 →</span></a>
<a class="card" href="./conversation-quality-prototype/"><span class="badge">AI 销售</span><h2>AI 会话质检</h2><p>按销售企微账号和客户查看只读会话，支持日期、搜索、筛选与分页。</p><span class="open">打开原型 →</span></a>
<a class="card" href="./customer-dynamics-prototype/"><span class="badge">客户运营</span><h2>客户动态</h2><p>查看客户关系、员工企微标签与跨平台行为时间线。</p><span class="open">打开原型 →</span></a>
<a class="card" href="./ai-sales-assistant-customer-dynamics-prototype/"><span class="badge">AI 销售</span><h2>AI销售助手 · 客户动态</h2><p>销售助手客户画像侧栏，支持动态时间线及员工、平台、事件类型筛选。</p><span class="open">打开原型 →</span></a>
<a class="card" href="./dashboard/134期-handoff-dashboard/"><span class="badge">数据看板</span><h2>134期转人工分析</h2><p>两级原因图形钻取、客户筛选及真实前置聊天记录，支持按需加载。</p><span class="open">打开看板 →</span></a></div><footer>SOP与会话质检为演示原型；134期看板使用实际业务数据。</footer></main></body></html>'''


if __name__ == '__main__':
    build(Path(sys.argv[1]), Path(sys.argv[2]))
