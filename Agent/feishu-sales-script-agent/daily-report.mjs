const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

export function beijingTimestamp(date = new Date()) {
  const shifted = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return shifted.toISOString().replace('Z', '+08:00');
}

export function beijingDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return beijingTimestamp(date).slice(0, 10);
}

export function parseReportTime(value = '18:00') {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) throw new Error('dailyReport.time 必须是 HH:mm，例如 18:00');
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error('dailyReport.time 超出有效时间范围');
  return { hour, minute, label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}

export function isReportDue(now, reportTime, sentDates) {
  const { hour, minute } = parseReportTime(reportTime);
  const stamp = beijingTimestamp(now);
  const dateKey = stamp.slice(0, 10);
  const currentMinutes = Number(stamp.slice(11, 13)) * 60 + Number(stamp.slice(14, 16));
  return !sentDates.has(dateKey) && currentMinutes >= hour * 60 + minute;
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function asBoolean(value) {
  return value === true || value === 1 || value === 'true';
}

function recordDateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  if (typeof value === 'number' && value < 1e12) return beijingDateKey(value * 1000);
  return beijingDateKey(value);
}

export function summarizeRecords(records, dateKey, fields) {
  const normalized = records.map(record => {
    const values = record.fields || record;
    return {
      recordId: record.recordId || record.record_id || '',
      type: String(firstValue(values[fields.type]) || '其他'),
      message: String(values[fields.message] || ''),
      suggestion: String(values[fields.suggestion] || ''),
      completed: asBoolean(values[fields.completed]),
      dateKey: recordDateKey(values[fields.submittedAt]),
    };
  });
  const today = normalized.filter(record => record.dateKey === dateKey);
  const typeCounts = { 优化: 0, 删除: 0, 其他: 0 };
  for (const record of today) {
    if (record.type === '优化' || record.type === '删除') typeCounts[record.type] += 1;
    else typeCounts.其他 += 1;
  }
  return {
    dateKey,
    total: today.length,
    completed: today.filter(record => record.completed).length,
    pending: today.filter(record => !record.completed).length,
    typeCounts,
    cumulativeTotal: normalized.length,
    cumulativePending: normalized.filter(record => !record.completed).length,
    items: today,
  };
}

function escapeMarkdown(value) {
  return String(value)
    .replace(/&/g, '&#38;').replace(/</g, '&#60;').replace(/>/g, '&#62;')
    .replace(/\*/g, '&#42;').replace(/~/g, '&#126;').replace(/#/g, '&#35;')
    .replace(/_/g, '&#95;').replace(/\[/g, '&#91;').replace(/\]/g, '&#93;')
    .replace(/\(/g, '&#40;').replace(/\)/g, '&#41;');
}

function truncate(value, max = 160) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function metricColumn(value, label, color = 'blue', focus = false) {
  return {
    tag: 'column', width: 'weighted', weight: 1,
    background_style: focus ? 'blue-50' : 'grey-50', padding: '12px', vertical_spacing: '2px',
    elements: [
      { tag: 'markdown', content: `## <font color='${color}'>${value}</font>`, text_align: 'center' },
      { tag: 'markdown', content: `<font color='grey'>${label}</font>`, text_align: 'center', text_size: 'notation' },
    ],
  };
}

export function buildDailyReportCard(summary, generatedAt = new Date(), options = {}) {
  const detailLimit = 20;
  const visibleItems = summary.items.slice(0, detailLimit);
  const detail = visibleItems.length
    ? visibleItems.map((item, index) => {
      const typeColor = item.type === '删除' ? 'orange' : item.type === '优化' ? 'blue' : 'violet';
      const statusColor = item.completed ? 'green' : 'yellow';
      const message = escapeMarkdown(truncate(item.message || '（无原始消息）'));
      const suggestion = item.suggestion
        ? `\n   建议：${escapeMarkdown(truncate(item.suggestion))}` : '';
      return `${index + 1}. <text_tag color='${typeColor}'>${escapeMarkdown(item.type)}</text_tag> ` +
        `<text_tag color='${statusColor}'>${item.completed ? '已完成' : '未完成'}</text_tag> ${message}${suggestion}`;
    }).join('\n') + (summary.items.length > detailLimit
      ? `\n\n<font color='grey'>另有 ${summary.items.length - detailLimit} 条，请在多维表格中查看。</font>` : '')
    : '<font color=\'grey\'>今天没有新增话术修改建议。</font>';
  const pendingMessage = summary.cumulativePending > 0
    ? `当前累计还有 **${summary.cumulativePending}** 条未完成，请及时推进修改并在多维表格中更新状态。`
    : '当前没有累计未完成记录，今天的建议均已处理。';

  return {
    schema: '2.0',
    config: {
      update_multi: true,
      width_mode: 'default',
      summary: { content: `${summary.dateKey} 话术建议日报：今日 ${summary.total} 条，累计未完成 ${summary.cumulativePending} 条` },
    },
    header: {
      title: { tag: 'plain_text', content: '话术修改建议日报' },
      subtitle: { tag: 'plain_text', content: `${summary.dateKey} · 北京时间` },
      template: 'blue',
      icon: { tag: 'standard_icon', token: 'wiki-bitable_colorful' },
      text_tag_list: [{
        tag: 'text_tag', text: { tag: 'plain_text', content: summary.pending > 0 ? '有待处理' : '今日已清' },
        color: summary.pending > 0 ? 'yellow' : 'blue',
      }],
    },
    body: {
      direction: 'vertical', padding: '12px 12px 20px 12px', vertical_spacing: '12px',
      elements: [
        {
          tag: 'column_set', flex_mode: 'none', horizontal_spacing: '12px',
          columns: [
            metricColumn(summary.cumulativeTotal, '当前总记录', 'blue'),
            metricColumn(summary.cumulativePending, '累计未完成', 'violet', true),
          ],
        },
        {
          tag: 'column_set', flex_mode: 'none', horizontal_spacing: '12px',
          columns: [
            metricColumn(summary.total, '今日新增', 'blue'),
            metricColumn(summary.completed, '今日已完成', 'blue'),
            metricColumn(summary.pending, '今日未完成', 'violet'),
          ],
        },
        {
          tag: 'column_set', flex_mode: 'none', horizontal_spacing: '12px',
          columns: [
            metricColumn(summary.typeCounts.优化, '优化', 'blue'),
            metricColumn(summary.typeCounts.删除, '删除', 'violet'),
            metricColumn(summary.typeCounts.其他, '其他', 'purple'),
          ],
        },
        {
          tag: 'column_set', flex_mode: 'none',
          columns: [{
            tag: 'column', width: 'weighted', weight: 1,
            background_style: 'blue-50', padding: '12px', vertical_spacing: '8px',
            elements: [
              { tag: 'markdown', content: '**今日建议明细**' },
              { tag: 'markdown', content: detail },
              { tag: 'markdown', content: `**提醒**\n${pendingMessage}\n\n<font color='grey'>生成时间：${beijingTimestamp(generatedAt).slice(0, 16).replace('T', ' ')}（北京时间）</font>`, text_size: 'normal' },
            ],
          }],
        },
        ...(options.baseUrl ? [{
          tag: 'button',
          text: { tag: 'plain_text', content: '打开话术建议表' },
          type: 'primary_filled',
          size: 'medium',
          width: 'fill',
          behaviors: [{ type: 'open_url', default_url: options.baseUrl }],
        }] : []),
      ],
    },
  };
}

export function matrixResultToRecords(result) {
  const data = result?.data;
  const fieldNames = Array.isArray(data?.fields) ? data.fields : [];
  const rows = Array.isArray(data?.data) ? data.data : [];
  const ids = Array.isArray(data?.record_id_list) ? data.record_id_list : [];
  return rows.map((row, index) => ({
    recordId: ids[index] || '',
    fields: Object.fromEntries(fieldNames.map((name, fieldIndex) => [name, row[fieldIndex]])),
  }));
}
