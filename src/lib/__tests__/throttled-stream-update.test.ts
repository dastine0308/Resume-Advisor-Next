import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createThrottledStreamUpdate } from "../throttled-stream-update";

describe("createThrottledStreamUpdate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("batches rapid pushes into a single commit", () => {
    const commit = vi.fn();
    const throttle = createThrottledStreamUpdate(commit, 80);

    throttle.push("a");
    throttle.push("ab");
    throttle.push("abc");
    expect(commit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(80);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith("abc");
  });

  it("flush commits immediately and clears pending timer", () => {
    const commit = vi.fn();
    const throttle = createThrottledStreamUpdate(commit, 80);

    throttle.push("partial");
    throttle.flush("final");

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith("final");

    vi.advanceTimersByTime(80);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("cancel drops pending updates", () => {
    const commit = vi.fn();
    const throttle = createThrottledStreamUpdate(commit, 80);

    throttle.push("drop me");
    throttle.cancel();

    vi.advanceTimersByTime(80);
    expect(commit).not.toHaveBeenCalled();
  });
});
