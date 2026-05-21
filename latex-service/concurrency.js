function parsePositiveInt(raw, fallback, min) {
  const n = parseInt(raw ?? String(fallback), 10);
  if (!Number.isFinite(n) || n < min) return fallback;
  return n;
}

const MAX_CONCURRENT = parsePositiveInt(
  process.env.MAX_CONCURRENT_COMPILES,
  2,
  1,
);
const MAX_QUEUE = parsePositiveInt(process.env.MAX_COMPILE_QUEUE, 5, 0);
const QUEUE_WAIT_MS = parsePositiveInt(process.env.COMPILE_QUEUE_WAIT_MS, 120000, 0);

let active = 0;
const queue = [];

function tryDequeue() {
  while (queue.length > 0 && active < MAX_CONCURRENT) {
    active++;
    queue.shift().resolve();
  }
}

function removeQueuedEntry(entry) {
  const idx = queue.indexOf(entry);
  if (idx !== -1) queue.splice(idx, 1);
}

/**
 * Wait for a compile slot. Rejects when the queue is full or wait times out.
 */
function acquireCompileSlot() {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }

  if (queue.length >= MAX_QUEUE) {
    return Promise.reject(new Error("COMPILE_QUEUE_FULL"));
  }

  return new Promise((resolve, reject) => {
    const entry = {
      resolve: () => {
        if (entry.timer) clearTimeout(entry.timer);
        resolve();
      },
      reject: (err) => {
        if (entry.timer) clearTimeout(entry.timer);
        reject(err);
      },
    };

    if (QUEUE_WAIT_MS > 0) {
      entry.timer = setTimeout(() => {
        removeQueuedEntry(entry);
        entry.reject(new Error("COMPILE_QUEUE_TIMEOUT"));
      }, QUEUE_WAIT_MS);
    }

    queue.push(entry);
  });
}

function releaseCompileSlot() {
  active = Math.max(0, active - 1);
  tryDequeue();
}

function getCompileConcurrencyStats() {
  return {
    maxConcurrent: MAX_CONCURRENT,
    maxQueue: MAX_QUEUE,
    queueWaitMs: QUEUE_WAIT_MS,
    active,
    queued: queue.length,
  };
}

function isCompileCapacityExhausted() {
  if (MAX_QUEUE === 0) {
    return active >= MAX_CONCURRENT;
  }
  return queue.length >= MAX_QUEUE;
}

module.exports = {
  acquireCompileSlot,
  releaseCompileSlot,
  getCompileConcurrencyStats,
  isCompileCapacityExhausted,
};
