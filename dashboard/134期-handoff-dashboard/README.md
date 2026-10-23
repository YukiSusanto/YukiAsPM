# 134期转人工原因看板

唯一界面基线为13482端口的大字号图形分享版。此目录为完整静态站点，真实聊天数据按用户明确授权随代码提交，用于GitHub Pages发布。

## 数据范围

- 北京时间2026-10-12 00:00:00至2026-10-19 00:00:00（不含结束时刻）加微的客户关系。
- 906次转人工，746位客户，5个一级原因、25个二级原因。
- 只展示各事件 `[pre_window_start, pre_window_end)` 内的24,389条消息条次；按源消息ID去重为22,346条。
- 一级按scenario_type；二级对52种scenario_description进行语义归并，保留原始描述。
- 附件保留链接，不自动下载。客户使用本地编号，事件及消息保留实际定位字段。

## 本地预览与验证

需要Node.js 22或更新版本，无需安装依赖。在此目录执行：

```sh
npm run check
npm run preview
```

预览默认监听 http://127.0.0.1:13482/ ，如已有分享版运行需先关闭以避免端口冲突。也可显式指定测试端口与项目子路径：

```sh
node scripts/serve.cjs --port 13484 --base-path /YukiAsPM/dashboard/134-period/
```

## 静态结构

- index.html、app.js、style.css：大字号图形钻取前端。
- data/catalog.json：分类与客户索引，首屏加载。
- data/classification.json：完整原始原因映射。
- data/events/*.json：906个事件文件，打开聊天时按需加载。
- scripts/check-data.cjs：检查分类、身份、消息窗口、条数、重复及静态路径。
- scripts/serve.cjs：仅供本地预览；Pages不需要运行该服务。

部署位置：`/YukiAsPM/dashboard/134期-handoff-dashboard/`。站点和数据路径均相对当前目录。Pages构建只复制前端及data目录，不发布本地工具、数据库配置或分享运行环境。

此目录有实际业务数据，不是演示数据。数据库密码、连接配置和“聊天记录数据获取分析”文件夹未纳入仓库。本次未重新访问生产数据库，仅发布已核验的本地导出。
