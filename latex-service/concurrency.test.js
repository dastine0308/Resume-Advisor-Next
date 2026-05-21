import { describe, it, expect, beforeEach, vi } from "vitest";

async function loadConcurrency(env = {}) {
  vi.resetModules();
  for (const key of [
    "MAX_CONCURRENT_COMPILES",
    "MAX_COMPILE_QUEUE",
    "COMPILE_QUEUE_WAIT_MS",
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
  return import("./concurrency.js");
}

describe("latex-service/concurrency", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("grants slots immediately up to max concurrent", async () => {
    const mod = await loadConcurrency({ MAX_CONCURRENT_COMPILES: "2" });
    await mod.acquireCompileSlot();
    await mod.acquireCompileSlot();
    expect(mod.getCompileConcurrencyStats().active).toBe(2);
    mod.releaseCompileSlot();
    mod.releaseCompileSlot();
    expect(mod.getCompileConcurrencyStats().active).toBe(0);
  });

  it("rejects when queue is full", async () => {
    const mod = await loadConcurrency({
      MAX_CONCURRENT_COMPILES: "1",
      MAX_COMPILE_QUEUE: "1",
    });
    await mod.acquireCompileSlot();
    const queued = mod.acquireCompileSlot();
    await expect(mod.acquireCompileSlot()).rejects.toThrow("COMPILE_QUEUE_FULL");
    mod.releaseCompileSlot();
    await queued;
    mod.releaseCompileSlot();
  });

  it("dequeues waiters in FIFO order after release", async () => {
    const mod = await loadConcurrency({
      MAX_CONCURRENT_COMPILES: "1",
      MAX_COMPILE_QUEUE: "2",
    });
    await mod.acquireCompileSlot();
    const order = [];
    const first = mod.acquireCompileSlot().then(() => order.push("first"));
    const second = mod.acquireCompileSlot().then(() => order.push("second"));
    mod.releaseCompileSlot();
    await first;
    mod.releaseCompileSlot();
    await second;
    expect(order).toEqual(["first", "second"]);
  });

  it("reports capacity exhausted when queue is full", async () => {
    const mod = await loadConcurrency({
      MAX_CONCURRENT_COMPILES: "1",
      MAX_COMPILE_QUEUE: "1",
    });
    await mod.acquireCompileSlot();
    mod.acquireCompileSlot();
    expect(mod.isCompileCapacityExhausted()).toBe(true);
    mod.releaseCompileSlot();
    await new Promise((r) => setTimeout(r, 0));
    expect(mod.isCompileCapacityExhausted()).toBe(false);
    mod.releaseCompileSlot();
  });

  it("reports capacity exhausted when MAX_QUEUE=0 and all slots are active", async () => {
    const mod = await loadConcurrency({
      MAX_CONCURRENT_COMPILES: "2",
      MAX_COMPILE_QUEUE: "0",
    });
    await mod.acquireCompileSlot();
    await mod.acquireCompileSlot();
    expect(mod.isCompileCapacityExhausted()).toBe(true);
    await expect(mod.acquireCompileSlot()).rejects.toThrow("COMPILE_QUEUE_FULL");
    mod.releaseCompileSlot();
    mod.releaseCompileSlot();
  });

  it("falls back to defaults for invalid env values", async () => {
    const mod = await loadConcurrency({
      MAX_CONCURRENT_COMPILES: "not-a-number",
      MAX_COMPILE_QUEUE: "-1",
    });
    const stats = mod.getCompileConcurrencyStats();
    expect(stats.maxConcurrent).toBe(2);
    expect(stats.maxQueue).toBe(5);
  });

  it("rejects queued waiters after queue wait timeout", async () => {
    vi.useFakeTimers();
    try {
      const mod = await loadConcurrency({
        MAX_CONCURRENT_COMPILES: "1",
        MAX_COMPILE_QUEUE: "2",
        COMPILE_QUEUE_WAIT_MS: "50",
      });
      await mod.acquireCompileSlot();
      const waiter = mod.acquireCompileSlot();
      const rejection = expect(waiter).rejects.toThrow("COMPILE_QUEUE_TIMEOUT");
      await vi.advanceTimersByTimeAsync(60);
      await rejection;
      mod.releaseCompileSlot();
    } finally {
      vi.useRealTimers();
    }
  });
});
