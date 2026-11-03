import assert from 'node:assert/strict';
import { MessageBatchWindow } from './message-window.mjs';

let now = 1000;
let timerId = 0;
const timers = new Map();
const windows = new MessageBatchWindow(5000, {
  now: () => now,
  setTimer: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, at: now + delay }); return id; },
  clearTimer: id => timers.delete(id),
});
const event = (id, sender = 'ou_a', chat = 'oc_target', type = 'text') => ({
  message_id: id, sender_id: sender, chat_id: chat, message_type: type,
});
const flushed = [];
const flush = batch => flushed.push(batch);

const first = windows.add(event('om_1'), flush);
assert.equal(first.opened, true);
assert.equal(first.expiresAt, 6000);
now = 4000;
const second = windows.add(event('om_2', 'ou_a', 'oc_target', 'image'), flush);
assert.equal(second.opened, false);
assert.equal(second.expiresAt, 6000);
assert.equal(timers.size, 1, '后续消息不能重置 5 秒定时器');

now = 6000;
for (const [id, timer] of [...timers]) {
  if (timer.at <= now) { timers.delete(id); timer.fn(); }
}
assert.equal(flushed.length, 1);
assert.deepEqual(flushed[0].events.map(item => item.message_id), ['om_1', 'om_2']);

const next = windows.add(event('om_3'), flush);
assert.equal(next.opened, true, '窗口结束后的消息必须开启新批次');
assert.equal(next.expiresAt, 11000);
const otherSender = windows.add(event('om_4', 'ou_b'), flush);
assert.equal(otherSender.opened, true, '不同用户必须使用独立窗口');
assert.equal(timers.size, 2);

windows.flushAll(flush);
assert.equal(flushed.length, 3);

console.log('message window tests passed');
