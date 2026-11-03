function keyOf(event) {
  if (!event?.chat_id || !event?.sender_id) return '';
  return event.chat_id + '\0' + event.sender_id;
}

export class MessageBatchWindow {
  constructor(windowMs = 5000, options = {}) {
    this.windowMs = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 5000;
    this.now = options.now || Date.now;
    this.setTimer = options.setTimer || setTimeout;
    this.clearTimer = options.clearTimer || clearTimeout;
    this.onError = options.onError || (() => {});
    this.windows = new Map();
  }

  add(event, onFlush) {
    const key = keyOf(event);
    if (!key || !event?.message_id || typeof onFlush !== 'function') return null;
    const now = this.now();
    let batch = this.windows.get(key);
    if (batch && now >= batch.expiresAt) {
      this.#finish(key, batch, onFlush);
      batch = null;
    }
    if (batch) {
      if (!batch.messageIds.has(event.message_id)) {
        batch.messageIds.add(event.message_id);
        batch.events.push(event);
      }
      return { opened: false, openedAt: batch.openedAt, expiresAt: batch.expiresAt,
        eventCount: batch.events.length };
    }
    batch = {
      key,
      openedAt: now,
      expiresAt: now + this.windowMs,
      events: [event],
      messageIds: new Set([event.message_id]),
      timer: null,
    };
    batch.timer = this.setTimer(() => this.#finish(key, batch, onFlush), this.windowMs);
    this.windows.set(key, batch);
    return { opened: true, openedAt: batch.openedAt, expiresAt: batch.expiresAt, eventCount: 1 };
  }

  flushAll(onFlush) {
    for (const [key, batch] of [...this.windows]) this.#finish(key, batch, onFlush);
  }

  #finish(key, batch, onFlush) {
    if (this.windows.get(key) !== batch) return;
    this.windows.delete(key);
    if (batch.timer) this.clearTimer(batch.timer);
    const result = onFlush({
      key: batch.key,
      openedAt: batch.openedAt,
      expiresAt: batch.expiresAt,
      events: [...batch.events],
    });
    Promise.resolve(result).catch(this.onError);
  }
}
