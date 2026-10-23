# YukiAsPM · 产品原型与需求

`main` 保存验收后的完整成果，并作为 GitHub Pages 的唯一发布来源。

| 版本 | 原型与源码 | 需求文档 | 在线预览 |
|---|---|---|---|
| 固定 SOP | [原型](sop-prototype/固定SOP/原型/) | [需求文档](sop-prototype/固定SOP/需求文档/固定SOP需求文档.md) | [打开固定版](https://yukisusanto.github.io/YukiAsPM/stubborn-sop/) |
| 社群 SOP | [原型](sop-prototype/社群SOP/原型/) | [需求文档](sop-prototype/社群SOP/需求文档/销转期建群与群聊sop需求.md) | [打开社群版](https://yukisusanto.github.io/YukiAsPM/social-chat-sop/) |
| AI 会话质检 | [原型](conversation-quality-prototype/) | [需求文档](conversation-quality-prototype/需求文档/AI会话质检需求文档.md) | [打开会话质检](https://yukisusanto.github.io/YukiAsPM/conversation-quality-prototype/) |
| 134期转人工看板 | [代码与真实聊天数据](dashboard/134期-handoff-dashboard/) | [口径说明](dashboard/134期-handoff-dashboard/README.md) | [打开看板](https://yukisusanto.github.io/YukiAsPM/dashboard/134期-handoff-dashboard/) |

```text
sop-prototype/
├── 固定SOP/
│   ├── 原型/       # HTML、JS、CSS、采集模板、build.cjs、说明
│   └── 需求文档/   # 固定SOP需求文档.md
└── 社群SOP/
    ├── 原型/       # HTML、JS、CSS、采集模板、build.cjs、说明
    └── 需求文档/   # 销转期建群与群聊sop需求.md
conversation-quality-prototype/
├── index.html       # 会话质检原型入口
├── styles.css       # 页面样式
├── app.js           # 演示数据与交互
├── server.cjs       # 本地预览服务
└── 需求文档/        # Markdown 需求文档与基线原型图
```

## 构建与发布

在仓库根目录执行（需要 Node.js 和 Python 3）：

```sh
node "sop-prototype/固定SOP/原型/build.cjs"
node "sop-prototype/社群SOP/原型/build.cjs"
python .github/scripts/build_pages.py . _site
```

SOP原型为可独立打开的单文件HTML；134期看板为HTML/JS/CSS加JSON静态站点，需通过HTTP访问。`_site/` 是自动生成的发布产物，不提交。
推送 `main` 后，GitHub Actions 构建并发布全部原型，不再从版本分支读取文件。
Pages 设置继续使用 GitHub Actions，工作流仅允许 `main` 部署。会话质检原型是静态页面，不需要额外构建步骤。

- [网站首页](https://yukisusanto.github.io/YukiAsPM/)
- 原型目录也可直接访问：`/sop-prototype/固定SOP/原型/`、`/sop-prototype/社群SOP/原型/`、`/conversation-quality-prototype/`。
- 原有 `/stubborn-sop/`、`/social-chat-sop/` 和旧 HTML 链接保留兼容。
- `stubborn-sop` 与 `social-chat-sop` 保留原有开发历史，推送这两个分支不再自动发布。
- 后续建议从最新 `main` 新建功能分支，沿用本目录结构开发，完成后合并回 `main`。
- 若继续从旧版本分支整理成果，应按对应目录迁移变更后合入，避免把旧根目录结构带回 `main`。

2026-10-22 汇总：固定版来自 `695d7f8`，社群版来自 `27bb42e`。

## 134期转人工看板

代码和已授权发布的真实聊天数据统一放在 `dashboard/134期-handoff-dashboard/`。该目录使用13482大字号图形版界面，直接读取相对路径JSON，支持客户及消息懒加载。

Pages构建会先核验906次事件、746位客户和全部窗口消息，再复制该目录的前端与数据。首页提供单独入口，原有站点与链接继续保留。数据库连接配置、“聊天记录数据获取分析”文件夹、分享ZIP和运行环境不纳入仓库或发布产物。

原有SOP与会话质检是演示原型；134期看板使用实际业务数据。
