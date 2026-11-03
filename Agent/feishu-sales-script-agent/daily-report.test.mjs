import assert from 'node:assert/strict';
import {
  beijingDateKey, beijingTimestamp, buildDailyReportCard, isReportDue,
  matrixResultToRecords, parseReportTime, summarizeRecords,
} from './daily-report.mjs';

assert.equal(beijingTimestamp(new Date('2026-10-08T10:00:00Z')), '2026-10-08T18:00:00.000+08:00');
assert.equal(beijingDateKey(new Date('2026-10-08T16:30:00Z')), '2026-10-09');
assert.deepEqual(parseReportTime('6:05'), { hour: 6, minute: 5, label: '06:05' });
assert.throws(() => parseReportTime('25:00'));
assert.equal(isReportDue(new Date('2026-10-08T10:00:00Z'), '18:00', new Set()), true);
assert.equal(isReportDue(new Date('2026-10-08T09:59:00Z'), '18:00', new Set()), false);
assert.equal(isReportDue(new Date('2026-10-08T10:00:00Z'), '18:00', new Set(['2026-10-08'])), false);

const matrix = {
  data: {
    fields: ['类型', '原始消息', '修改建议', '提出时间', '是否完成'],
    data: [
      [['优化'], '优化第一条', '建议 A', '2026-10-08T09:00:00+08:00', true],
      [['删除'], '删除第二条', null, '2026-10-08T17:00:00+08:00', false],
      [['其他'], '昨天一条', null, '2026-10-07T17:00:00+08:00', false],
    ],
    record_id_list: ['rec1', 'rec2', 'rec3'],
  },
};
const records = matrixResultToRecords(matrix);
const summary = summarizeRecords(records, '2026-10-08', {
  type: '类型', message: '原始消息', suggestion: '修改建议',
  submittedAt: '提出时间', completed: '是否完成',
});
assert.equal(summary.total, 2);
assert.equal(summary.completed, 1);
assert.equal(summary.pending, 1);
assert.equal(summary.cumulativePending, 2);
assert.deepEqual(summary.typeCounts, { 优化: 1, 删除: 1, 其他: 0 });
const card = buildDailyReportCard(summary, new Date('2026-10-08T10:00:00Z'), {
  baseUrl: 'https://example.com/base',
});
assert.equal(card.schema, '2.0');
assert.equal(card.header.template, 'blue');
assert.equal(card.body.elements.length, 5);
assert.match(JSON.stringify(card), /累计未完成/);
assert.match(JSON.stringify(card), /当前总记录/);
assert.match(JSON.stringify(card), /打开话术建议表/);
assert.match(JSON.stringify(card), /https:\/\/example.com\/base/);
assert.match(JSON.stringify(card), /优化第一条/);

console.log('daily report tests passed');
