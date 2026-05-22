/** Batches rapid stream updates to reduce React re-renders during AI generation. */
export function createThrottledStreamUpdate<T>(
  commit: (value: T) => void,
  intervalMs = 80,
) {
  let pending: T | undefined;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    push(value: T) {
      pending = value;
      if (timer !== null) return;
      timer = setTimeout(() => {
        timer = null;
        if (pending !== undefined) {
          commit(pending);
          pending = undefined;
        }
      }, intervalMs);
    },
    flush(value: T) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pending = undefined;
      commit(value);
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pending = undefined;
    },
  };
}
