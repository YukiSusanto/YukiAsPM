# YukiAsPM · 产品原型与需求

`main` 保存验收后的完整成果，并作为 GitHub Pages 的唯一发布来源。

| 版本 | 原型与源码 | 需求文档 | 在线预览 |
|---|---|---|---|
| 固定 SOP | [原型](sop-prototype/固定SOP/原型/) | [需求文档](sop-prototype/固定SOP/需求文档/固定SOP需求文档.md) | [打开固定版](https://yukisusanto.github.io/YukiAsPM/stubborn-sop/) |
| 社群 SOP | [原型](sop-prototype/社群SOP/原型/) | [需求文档](sop-prototype/社群SOP/需求文档/销转期建群与群聊sop需求.md) | [打开社群版](https://yukisusanto.github.io/YukiAsPM/social-chat-sop/) |
| AI 会话质检 | [原型](conversation-quality-prototype/) | [需求文档](conversation-quality-prototype/需求文档/AI会话质检需求文档.md) | [打开会话质检](https://yukisusanto.github.io/YukiAsPM/conversation-quality-prototype/) |

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

每份 HTML 均为可独立打开的单文件原型。`_site/` 是自动生成的发布产物，不提交。
推送 `main` 后，GitHub Actions 构建并发布全部原型，不再从版本分支读取文件。
Pages 设置继续使用 GitHub Actions，工作流仅允许 `main` 部署。会话质检原型是静态页面，不需要额外构建步骤。

- [网站首页](https://yukisusanto.github.io/YukiAsPM/)
- 原型目录也可直接访问：`/sop-prototype/固定SOP/原型/`、`/sop-prototype/社群SOP/原型/`、`/conversation-quality-prototype/`。
- 原有 `/stubborn-sop/`、`/social-chat-sop/` 和旧 HTML 链接保留兼容。
- `stubborn-sop` 与 `social-chat-sop` 保留原有开发历史，推送这两个分支不再自动发布。
- 后续建议从最新 `main` 新建功能分支，沿用本目录结构开发，完成后合并回 `main`。
- 若继续从旧版本分支整理成果，应按对应目录迁移变更后合入，避免把旧根目录结构带回 `main`。

2026-10-22 汇总：固定版来自 `695d7f8`，社群版来自 `27bb42e`。
