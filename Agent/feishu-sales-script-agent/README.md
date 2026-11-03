# AI销售话术优化收集 Agent（本地 MVP）

只处理指定群内、`salesSenderIds` 白名单销售发送的消息。非销售消息会在调用 LLM 前直接过滤。LLM 先用 decision 判断消息应入库、忽略还是复核，再用 intent 将明确需求分为优化、删除或其他，并提取原文证据；本地再次校验字段类型、长度、证据来源和否定语义。LLM 失败时只用高精度规则保底。第一版 reviewMode=ignore，无法确认的消息直接忽略；以后改为 queue 可恢复本地待复核队列。

1. 将 config.example.json 复制为 config.json，填入机器人所在测试群的 chatId。
2. 确认应用订阅 im.message.receive_v1，机器人已入群，并有目标多维表格编辑权限及所需 Base scopes。
3. 复制 llm-config.example.json 为 llm-config.json，在项目本地填写 API Key。该文件已被 .gitignore 排除，程序不会打印密钥；没有配置时只允许试运行保守规则。模型接入使用 OpenAI Responses API，默认启用严格 JSON Schema 输出；第三方不支持时可把 responseFormat 改为 json_object。
4. 运行 node analyzer.test.mjs，再运行 node agent.mjs。默认 live=false，只打印将写入的字段。
5. 核对消息识别结果后，把 live 改为 true 并重启。

data/processed.ndjson 保存已写入的消息 ID，用于本机去重。建议在多维表格加文本字段“消息ID”，并把 config.json 的 fields.messageId 设为该字段名，以便跨机器核对重复记录。

data/runtime.ndjson 保存服务启动、监听就绪、写入成功、忽略及错误等运行事件；日志只记录消息 ID、记录 ID、分类和错误原因，不保存 API Key。reviewMode=queue 时，data/needs-review.ndjson 保存需要人工复核的原消息；data/processed.ndjson 保存成功处理结果。

运行日志的新记录统一使用北京时间，时间戳以 `+08:00` 结尾；已有历史日志不会被改写。

当前版本处理纯文本、富文本和独立图片。文字写入“原始消息”，图片写入“原始消息图片”附件字段；其他附件暂不处理。LLM 不会代写新话术。“修改建议”只保存最多 12 个字的主题标签：原文明确给出主题时按“主题+话术+动作”生成，例如“直播课话术优化”；主题不明确时留空。

服务收到销售的第一条文字、富文本或图片消息后，按“群 + 发送人”打开固定 5 秒批次窗口。窗口内同一人的文字和图片全部归并，后续消息不会延长截止时间；5 秒到点后只调用一次 LLM、只创建一条记录。原始消息使用批次内文字的顺序合并结果，提出时间和“原始消息链接”固定取第一条消息，所有图片合并上传。不同销售使用互不影响的独立窗口，服务重启后未结束的窗口不会保留。

`dailyReport` 控制飞书卡片日报。默认每天北京时间 18:00，发送前实时读取多维表格全部现存记录，因此已删除记录不会继续计数；卡片汇总当天新增、已完成、未完成、优化/删除/其他数量、当前总记录和全表累计未完成数，并在底部提供多维表格跳转按钮。`chatId` 留空时发到当前监听群，也可填写另一个 `oc_...` 群。服务若在发送时间之后才启动，会补发当天日报；`data/daily-reports.ndjson` 只保存发送账本，不参与统计，同一天只发一次。发送端同时使用飞书幂等键，失败后每 15 分钟重试。

消息写入继续以 `data/processed.ndjson` 做持久去重，并增加进程内的处理中集合，防止同一事件在尚未完成时并发进入。由于表格目前没有“消息ID”字段，极端情况下若进程恰好在 Base 创建成功、但本地账本落盘前崩溃，重启重放仍可能生成重复记录；如后续需要跨机器或强幂等，可新增“消息ID”文本字段并在写入前查询。

修改配置或代码后需要重启服务。测试命令：`node analyzer.test.mjs`、`node message-window.test.mjs`、`node daily-report.test.mjs`。
