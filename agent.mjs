import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, appendFile, unlink } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeMessage, normalizeMessageContent, toBaseFields } from './analyzer.mjs';
import { classifyWithOpenAI, llmConfigured } from './llm.mjs';
import { MessageBatchWindow } from './message-window.mjs';
import {
  beijingDateKey, beijingTimestamp, buildDailyReportCard, isReportDue,
  matrixResultToRecords, parseReportTime, summarizeRecords,
} from './daily-report.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const runtimeLedger = path.join(dataDir, 'runtime.ndjson');
const cliScript = process.platform === 'win32'
  ? process.env.LARK_CLI_SCRIPT || path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@larksuite', 'cli', 'scripts', 'run.js')
  : '';
const cliEnv = { ...process.env, LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1', LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1' };
const spawnCli = args => spawn(process.platform === 'win32' ? process.execPath : 'lark-cli',
  process.platform === 'win32' ? [cliScript, ...args] : args,
  { cwd: root, env: cliEnv, stdio: ['pipe', 'pipe', 'pipe'] });

async function logRuntime(level, event, details = {}) {
  await appendFile(runtimeLedger, JSON.stringify({
    timestamp: beijingTimestamp(), level, event, ...details,
  }) + '\n');
}

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawnCli(args);
    let out = '', err = '';
    child.stdout.setEncoding('utf8').on('data', x => { out += x; });
    child.stderr.setEncoding('utf8').on('data', x => { err += x; });
    child.on('error', reject);
    child.on('close', code => {
      let result;
      try { result = JSON.parse(out); } catch { result = null; }
      if (code === 0 && result?.ok === true) resolve(result);
      else reject(new Error(err.trim() || out.trim() || 'CLI exited with ' + code));
    });
  });
}

function firstRecordId(writeResult) {
  return writeResult?.data?.record_id_list?.[0] ||
    writeResult?.data?.records?.[0]?.record_id ||
    writeResult?.data?.items?.[0]?.record_id || '';
}

function firstMessageId(sendResult) {
  return sendResult?.data?.message_id || sendResult?.data?.message?.message_id ||
    sendResult?.message_id || '';
}

function ledgerMessageIds(content) {
  return content.split(/\r?\n/).filter(Boolean).flatMap(line => {
    try {
      const value = JSON.parse(line);
      const ids = Array.isArray(value?.messageIds) ? value.messageIds : [];
      if (typeof value?.messageId === 'string' && value.messageId) ids.push(value.messageId);
      return ids.filter(id => typeof id === 'string' && id);
    } catch {
      return [];
    }
  });
}

async function fetchAllReportRecords(config) {
  const selectedFields = [config.fields.type, config.fields.message, config.fields.suggestion,
    config.fields.submittedAt, config.fields.completed].filter(Boolean);
  const records = [];
  let offset = 0;
  for (let page = 0; page < 1000; page += 1) {
    const result = await runCli(['base', '+record-list', '--base-token', config.baseToken,
      '--table-id', config.tableId,
      ...selectedFields.flatMap(field => ['--field-id', field]),
      '--offset', String(offset), '--limit', '200', '--format', 'json', '--as', 'bot']);
    const batch = matrixResultToRecords(result);
    records.push(...batch);
    if (!result?.data?.has_more) return records;
    if (batch.length === 0) throw new Error('多维表格分页返回 has_more，但本页没有记录');
    offset += batch.length;
  }
  throw new Error('多维表格记录超过日报安全分页上限');
}

async function fetchBatchDetails(messageIds) {
  const messages = [];
  for (let index = 0; index < messageIds.length; index += 50) {
    const chunk = messageIds.slice(index, index + 50);
    const result = await runCli(['im', '+messages-mget', '--message-ids', chunk.join(','),
      '--download-resources', '--no-reactions', '--as', 'bot']);
    messages.push(...(result?.data?.messages || result?.messages || []));
  }
  const first = messages.find(message => message.message_id === messageIds[0]);
  const resources = messages.flatMap(message => message.resources || []);
  const failedImages = resources.filter(resource => resource.type === 'image' && resource.error);
  const imageFiles = [...new Set(resources
    .filter(resource => resource.type === 'image' && !resource.error && resource.local_path)
    .map(resource => resource.local_path))];
  const downloadedFiles = [...new Set(resources
    .filter(resource => !resource.error && resource.local_path)
    .map(resource => resource.local_path))];
  return {
    messageLink: typeof first?.message_app_link === 'string' ? first.message_app_link : '',
    imageFiles,
    downloadedFiles,
    failedImageCount: failedImages.length,
  };
}

function combineBatchEvents(events) {
  const first = events[0];
  const textParts = events
    .filter(event => event.message_type === 'text' || event.message_type === 'post')
    .map(normalizeMessageContent)
    .filter(Boolean);
  return {
    ...first,
    message_id: first.message_id,
    message_type: events.some(event => event.message_type === 'post') ? 'post' : 'text',
    content: textParts.join('\n'),
  };
}

function sortBatchEvents(events) {
  return events.map((event, index) => ({ event, index })).sort((left, right) => {
    const leftTime = Number(left.event.create_time);
    const rightTime = Number(right.event.create_time);
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return left.index - right.index;
  }).map(value => value.event);
}

async function cleanupFiles(files) {
  for (const file of files) {
    try {
      await unlink(file);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('清理图片失败：' + error.message);
    }
  }
}

async function main() {
  await mkdir(dataDir, { recursive: true });
  const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));
  if (!/^oc_[A-Za-z0-9]+$/.test(config.chatId)) throw new Error('请填写有效的 chatId');
  const salesSenderIds = new Set(Array.isArray(config.salesSenderIds) ? config.salesSenderIds : []);
  if (salesSenderIds.size === 0 || [...salesSenderIds].some(id => !/^ou_[A-Za-z0-9]+$/.test(id))) {
    throw new Error('salesSenderIds 必须填写至少一个有效的销售 open_id');
  }
  if (config.live && !llmConfigured()) {
    throw new Error('正式写入需配置 OPENAI_API_KEY 和 OPENAI_MODEL');
  }
  const ledger = path.join(dataDir, 'processed.ndjson');
  let stored = '';
  try { stored = await readFile(ledger, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const processed = new Set(ledgerMessageIds(stored));
  const reviewLedger = path.join(dataDir, 'needs-review.ndjson');
  const reviewMode = config.reviewMode === 'queue' ? 'queue' : 'ignore';
  let reviewStored = '';
  if (reviewMode === 'queue') {
    try { reviewStored = await readFile(reviewLedger, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  const reviewed = new Set(ledgerMessageIds(reviewStored));
  const handledMessageIds = new Set([...processed, ...reviewed]);
  const configuredBatchSeconds = Number(config.messageBatchWindowSeconds);
  const messageBatchWindowSeconds = Number.isFinite(configuredBatchSeconds) && configuredBatchSeconds > 0
    ? configuredBatchSeconds : 5;
  const pendingMessageIds = new Set();
  let processingQueue = Promise.resolve();
  const messageWindows = new MessageBatchWindow(messageBatchWindowSeconds * 1000, {
    onError: error => console.error('消息窗口处理失败：' + error.message),
  });
  const dailyReport = {
    enabled: config.dailyReport?.enabled !== false,
    time: config.dailyReport?.time || '18:00',
    chatId: config.dailyReport?.chatId || config.chatId,
    baseUrl: config.dailyReport?.baseUrl || '',
  };
  const parsedReportTime = parseReportTime(dailyReport.time);
  if (dailyReport.enabled && !/^oc_[A-Za-z0-9]+$/.test(dailyReport.chatId)) {
    throw new Error('dailyReport.chatId 必须是有效的群聊 ID');
  }
  const reportLedger = path.join(dataDir, 'daily-reports.ndjson');
  let reportStored = '';
  try { reportStored = await readFile(reportLedger, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const sentReportDates = new Set(reportStored.split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line).dateKey].filter(Boolean); } catch { return []; }
  }));
  let reportInFlight = false;
  let nextReportRetryAt = 0;
  if (config.live) await runCli(['base', '+field-list', '--base-token', config.baseToken,
    '--table-id', config.tableId, '--as', 'bot']);

  async function sendDailyReport(now = new Date()) {
    if (!config.live || !dailyReport.enabled || reportInFlight || Date.now() < nextReportRetryAt ||
        !isReportDue(now, dailyReport.time, sentReportDates)) return;
    reportInFlight = true;
    const dateKey = beijingDateKey(now);
    try {
      const records = await fetchAllReportRecords(config);
      const summary = summarizeRecords(records, dateKey, config.fields);
      const card = buildDailyReportCard(summary, now, { baseUrl: dailyReport.baseUrl });
      const result = await runCli(['im', '+messages-send', '--chat-id', dailyReport.chatId,
        '--msg-type', 'interactive', '--content', JSON.stringify(card), '--as', 'bot',
        '--idempotency-key', `sales-daily-${dateKey}-${dailyReport.chatId.slice(-8)}`]);
      const messageId = firstMessageId(result);
      await appendFile(reportLedger, JSON.stringify({
        timestamp: beijingTimestamp(now), dateKey, chatId: dailyReport.chatId, messageId,
        todayTotal: summary.total, todayCompleted: summary.completed,
        todayPending: summary.pending, cumulativeTotal: summary.cumulativeTotal,
        cumulativePending: summary.cumulativePending,
      }) + '\n');
      sentReportDates.add(dateKey);
      await logRuntime('info', 'daily_report_sent', {
        dateKey, chatId: dailyReport.chatId, messageId,
        todayTotal: summary.total, todayCompleted: summary.completed,
        todayPending: summary.pending, cumulativeTotal: summary.cumulativeTotal,
        cumulativePending: summary.cumulativePending,
      });
      console.log(`已发送 ${dateKey} 话术建议日报`);
    } catch (error) {
      nextReportRetryAt = Date.now() + 15 * 60 * 1000;
      await logRuntime('error', 'daily_report_failed', { dateKey, error: error.message });
      console.error('日报发送失败（15 分钟后重试）：' + error.message);
    } finally {
      reportInFlight = false;
    }
  }

  async function handleBatch(batch) {
    const events = sortBatchEvents(batch.events.filter(event => !handledMessageIds.has(event.message_id)));
    const messageIds = events.map(event => event.message_id);
    for (const messageId of messageIds) pendingMessageIds.delete(messageId);
    if (!events.length) return;
    const event = combineBatchEvents(events);
    if (!event.content) {
      for (const messageId of messageIds) handledMessageIds.add(messageId);
      await logRuntime('info', 'image_only_batch_ignored', {
        firstMessageId: event.message_id, messageIds, senderId: event.sender_id,
      });
      return;
    }
    const result = await analyzeMessage(event, config.chatId,
      llmConfigured() ? classifyWithOpenAI : undefined);
    if (!result) {
      for (const messageId of messageIds) handledMessageIds.add(messageId);
      return;
    }
    if (result.state === 'review') {
      if (reviewMode === 'queue' && config.live) {
        console.log('待复核消息 ' + result.messageId + '：' + result.reason);
        await appendFile(reviewLedger, JSON.stringify({ ...result, messageIds }) + '\n');
        await logRuntime('warn', 'message_review', {
          messageId: result.messageId, messageIds, reason: result.reason, source: result.source,
        });
        for (const messageId of messageIds) reviewed.add(messageId);
      } else {
        console.log('已忽略消息 ' + result.messageId + '：' + result.reason);
        if (config.live) {
          await logRuntime('info', 'message_ignored', {
            messageId: result.messageId, messageIds, reason: result.reason, source: result.source,
          });
        }
      }
      for (const messageId of messageIds) handledMessageIds.add(messageId);
      return;
    }
    const item = result.item;
    if (!config.live) {
      const fields = toBaseFields(item, config.fields);
      console.log(JSON.stringify({ mode: 'dry-run', source: result.source,
        firstMessageId: item.messageId, messageIds, fields,
        imageHandling: events.some(value => value.message_type === 'image' || value.message_type === 'post')
          ? '正式写入时下载并上传本批次中的图片' : '无图片附件' }));
      for (const messageId of messageIds) handledMessageIds.add(messageId);
      return;
    }
    let imageFiles = [];
    let downloadedFiles = [];
    let detailError = '';
    try {
      const details = await fetchBatchDetails(messageIds);
      item.messageLink = details.messageLink;
      imageFiles = details.imageFiles;
      downloadedFiles = details.downloadedFiles;
      if (details.failedImageCount) detailError = `有 ${details.failedImageCount} 张图片下载失败`;
    } catch (error) {
      detailError = '消息详情读取失败：' + error.message;
      await logRuntime('error', 'message_details_fetch_failed', {
        messageId: item.messageId, messageIds, error: error.message,
      });
    }
    const fields = toBaseFields(item, config.fields);
    let writeResult, recordId = '', attachmentError = detailError;
    try {
      await writeFile(path.join(dataDir, 'pending-record.json'), JSON.stringify({ create_records: [fields] }));
      writeResult = await runCli(['base', '+record-batch-create', '--base-token', config.baseToken,
        '--table-id', config.tableId, '--json', '@./data/pending-record.json', '--as', 'bot']);
      recordId = firstRecordId(writeResult);
      if (imageFiles.length) {
        if (!recordId) {
          attachmentError = '记录已创建，但响应中缺少 record_id，无法上传图片';
        } else {
          try {
            await runCli(['base', '+record-upload-attachment', '--base-token', config.baseToken,
              '--table-id', config.tableId, '--record-id', recordId,
              '--field-id', config.fields.messageImage,
              ...imageFiles.flatMap(file => ['--file', file]), '--as', 'bot']);
          } catch (error) {
            attachmentError = [attachmentError, error.message].filter(Boolean).join('；');
          }
        }
      }
    } finally {
      await cleanupFiles(downloadedFiles);
    }
    await appendFile(ledger, JSON.stringify({ messageId: item.messageId, messageIds, recordId,
      imageCount: imageFiles.length, attachmentError, result: writeResult.data }) + '\n');
    for (const messageId of messageIds) processed.add(messageId);
    for (const messageId of messageIds) handledMessageIds.add(messageId);
    if (attachmentError) {
      const reviewItem = { state: 'review', messageId: item.messageId,
        messageIds, reason: '记录已写入，但消息链接或图片处理不完整：' + attachmentError,
        source: 'attachment' };
      await appendFile(reviewLedger, JSON.stringify(reviewItem) + '\n');
      await logRuntime('error', 'attachment_upload_failed', {
        messageId: item.messageId, messageIds, recordId, reason: reviewItem.reason,
      });
      console.error(reviewItem.reason);
    } else {
      await logRuntime('info', 'record_created', {
        messageId: item.messageId, messageIds, recordId, intent: item.type,
        imageCount: imageFiles.length, source: result.source,
      });
      console.log('已写入批次 ' + item.messageId + '，共 ' + messageIds.length +
        ' 条消息、图片 ' + imageFiles.length + ' 张，来源 ' + result.source);
    }
  }

  function enqueueBatch(batch) {
    processingQueue = processingQueue.then(() => handleBatch(batch)).catch(async error => {
      const messageIds = batch.events.map(event => event.message_id).filter(Boolean);
      for (const messageId of messageIds) pendingMessageIds.delete(messageId);
      console.error('处理失败：' + error.message);
      await logRuntime('error', 'message_processing_failed', {
        messageId: messageIds[0] || '', messageIds, error: error.message,
      });
    });
    return processingQueue;
  }

  async function collect(event) {
    const messageId = event?.message_id;
    if (!messageId || event.chat_id !== config.chatId || event.chat_type !== 'group' ||
        event.sender_type === 'bot' || !['text', 'post', 'image'].includes(event.message_type) ||
        !salesSenderIds.has(event.sender_id) || handledMessageIds.has(messageId) ||
        pendingMessageIds.has(messageId)) return;
    pendingMessageIds.add(messageId);
    const state = messageWindows.add(event, enqueueBatch);
    await logRuntime('info', state?.opened ? 'message_batch_opened' : 'message_batch_joined', {
      messageId, senderId: event.sender_id, eventCount: state?.eventCount || 0,
      windowSeconds: messageBatchWindowSeconds, expiresAt: state?.expiresAt || 0,
    });
  }

  console.log(config.live ? '正式写入模式' : '试运行模式：不会写入多维表格');
  if (!llmConfigured()) console.log('LLM 未配置；当前仅可试运行保守规则');
  await logRuntime('info', 'service_started', {
    mode: config.live ? 'live' : 'dry-run', processedCount: processed.size,
    reviewMode, reviewCount: reviewed.size, messageBatchWindowSeconds,
    salesSenderCount: salesSenderIds.size,
    dailyReportEnabled: dailyReport.enabled, dailyReportTime: parsedReportTime.label,
    dailyReportChatId: dailyReport.chatId,
  });
  const reportTimer = setInterval(() => {
    sendDailyReport().catch(error => console.error('日报调度失败：' + error.message));
  }, 60 * 1000);
  const child = spawnCli(['event', 'consume', 'im.message.receive_v1', '--as', 'bot']);
  const exit = new Promise(resolve => child.on('close', resolve));
  let diagnostic = '';
  child.stderr.setEncoding('utf8').on('data', chunk => {
    diagnostic += chunk;
    if (chunk.includes('[event] ready')) {
      console.log('消息监听已就绪');
      logRuntime('info', 'listener_ready').catch(error => console.error('运行日志写入失败：' + error.message));
      sendDailyReport().catch(error => console.error('日报调度失败：' + error.message));
    }
  });
  for await (const line of createInterface({ input: child.stdout, crlfDelay: Infinity })) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    await collect(event);
  }
  messageWindows.flushAll(enqueueBatch);
  await processingQueue;
  const code = await exit;
  clearInterval(reportTimer);
  await logRuntime(code === 0 ? 'info' : 'error', 'listener_exited', { code });
  if (code !== 0) throw new Error('监听退出：' + diagnostic.trim());
}

main().catch(async error => {
  console.error(error.message);
  try {
    await mkdir(dataDir, { recursive: true });
    await logRuntime('error', 'service_failed', { error: error.message });
  } catch {}
  process.exitCode = 1;
});
