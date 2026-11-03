import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  beijingDateKey, beijingTimestamp, buildDailyReportCard,
  matrixResultToRecords, summarizeRecords,
} from './daily-report.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const cliScript = process.platform === 'win32'
  ? process.env.LARK_CLI_SCRIPT || path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@larksuite', 'cli', 'scripts', 'run.js')
  : '';
const cliEnv = { ...process.env, LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1', LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1' };

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? process.execPath : 'lark-cli',
      process.platform === 'win32' ? [cliScript, ...args] : args,
      { cwd: root, env: cliEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', diagnostic = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { diagnostic += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      let result;
      try { result = JSON.parse(output); } catch { result = null; }
      if (code === 0 && result?.ok === true) resolve(result);
      else reject(new Error(diagnostic.trim() || output.trim() || `CLI exited with ${code}`));
    });
  });
}

async function fetchRecords(config) {
  const selectedFields = [config.fields.type, config.fields.message, config.fields.suggestion,
    config.fields.submittedAt, config.fields.completed].filter(Boolean);
  const records = [];
  let offset = 0;
  for (let page = 0; page < 1000; page += 1) {
    const result = await runCli(['base', '+record-list', '--base-token', config.baseToken,
      '--table-id', config.tableId, ...selectedFields.flatMap(field => ['--field-id', field]),
      '--offset', String(offset), '--limit', '200', '--format', 'json', '--as', 'bot']);
    const batch = matrixResultToRecords(result);
    records.push(...batch);
    if (!result?.data?.has_more) return records;
    if (!batch.length) throw new Error('分页读取中断');
    offset += batch.length;
  }
  throw new Error('记录数量超过预览脚本安全上限');
}

const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));
const chatId = config.dailyReport?.chatId || config.chatId;
const now = new Date();
const dateKey = beijingDateKey(now);
const records = await fetchRecords(config);
const summary = summarizeRecords(records, dateKey, config.fields);
const card = buildDailyReportCard(summary, now, { baseUrl: config.dailyReport?.baseUrl || '' });
card.header.title.content = '话术修改建议日报（样式预览）';
card.header.text_tag_list = [{
  tag: 'text_tag', text: { tag: 'plain_text', content: '测试卡片' }, color: 'blue',
}];
card.config.summary.content = `${dateKey} 话术建议日报样式预览`;
const minuteKey = beijingTimestamp(now).slice(0, 16).replace(/[-:T]/g, '');
const result = await runCli(['im', '+messages-send', '--chat-id', chatId,
  '--msg-type', 'interactive', '--content', JSON.stringify(card), '--as', 'bot',
  '--idempotency-key', `sales-preview-${minuteKey}-${chatId.slice(-6)}`]);

console.log(JSON.stringify({
  ok: true,
  chatId,
  messageId: result?.data?.message_id || result?.message_id || '',
  dateKey,
  todayTotal: summary.total,
  cumulativePending: summary.cumulativePending,
}, null, 2));
