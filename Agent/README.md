# Agent 项目

本目录集中保存可独立运行的 Agent 源码与测试。项目通过 Git subtree 导入；普通克隆会带上文件，不需要额外初始化子模块。现有 Pages 构建不复制本目录，也不会启动 Agent。

## 飞书销售话术收集 Agent

- 目录：[feishu-sales-script-agent](feishu-sales-script-agent/)
- 原始项目说明：[README](feishu-sales-script-agent/README.md)
- 来源仓库：[YukiSusanto/feishu-sales-script-agent](https://github.com/YukiSusanto/feishu-sales-script-agent)
- 来源分支：`semantic-batch-window`
- 首次导入日期：2026-11-03；来源提交：`1be5307`
- 导入方式：`git subtree add --prefix=Agent/feishu-sales-script-agent sales-agent/semantic-batch-window --squash`

Agent 监听指定飞书群内白名单销售的消息，识别话术优化、删除等需求并写入多维表格。同一群、同一销售的消息按固定 5 秒窗口合并；支持图片与北京时间日报。能力和业务限制以项目原始 README 为准。

| 文件 | 用途 |
|---|---|
| `agent.mjs` | 服务入口，消息监听、写入、去重及日报调度 |
| `analyzer.mjs` / `llm.mjs` | 消息识别、字段校验及模型接口 |
| `message-window.mjs` | 固定批次窗口 |
| `daily-report.mjs` | 日报统计与卡片内容 |
| `*.test.mjs` | 本地测试 |
| `config.json` | 来源项目的业务配置；运行前按目标环境核对 |
| `llm-config.example.json` | 模型配置示例 |

## 验证与运行

先进入项目目录：

```sh
cd Agent/feishu-sales-script-agent
node analyzer.test.mjs
node message-window.test.mjs
node daily-report.test.mjs
```

运行服务需要 Node.js、已安装并完成认证的飞书 CLI、目标群/多维表格权限，以及本机模型配置。Windows 下项目默认查找当前用户 npm 安装的 CLI，也可通过 `LARK_CLI_SCRIPT` 指定 CLI 入口。

当前来源分支已包含 `config.json`，没有 `config.example.json`；原始 README 中“复制 config.example.json”的步骤应以实际文件为准。启动前核对群、销售白名单、表格及字段映射，先将 `live` 设为 `false` 试运行。将 `llm-config.example.json` 复制为本机 `llm-config.json` 后填写模型配置；核对后按项目说明决定是否启用正式写入：

```sh
node agent.mjs
```

密钥、`llm-config.json`、`bot-config.txt`、`data/` 运行日志及飞书资源缓存由项目 `.gitignore` 排除，不作为同步成果提交。修改代码或配置后，需要重启已运行的服务。

## 从来源仓库同步更新

以下命令均在 **YukiAsPM 仓库根目录** 执行。同步前保持工作区干净，建议从最新 `main` 新建功能分支。

```sh
# 每份新克隆只需添加一次；已存在时跳过。
git remote add sales-agent https://github.com/YukiSusanto/feishu-sales-script-agent.git

# 把来源分支的新版本合入固定子目录，并保留 subtree 同步记录。
git subtree pull --prefix=Agent/feishu-sales-script-agent sales-agent semantic-batch-window --squash
```

检查变更、运行上述测试，再推送当前功能分支并通过 PR 合入 `main`。`--squash` 汇总每次引入的来源历史，不改变项目文件内容，也不修改来源仓库。

两个仓库不会自动双向同步。本仓库如修改了该子目录，与来源的新改动重叠时可能需要解决冲突。Agent 总目录的说明维护在本文件，尽量保留子项目原始文件，减少后续同步冲突。
