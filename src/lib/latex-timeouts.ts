/** Health / readiness probe timeout for the Next.js → latex-service gateway. */
export const LATEX_HEALTH_TIMEOUT_MS = 10_000;

const DEFAULT_QUEUE_WAIT_MS = 120_000;
/** pdflatex runs twice with a 30s exec timeout each. */
const PDFLATEX_BUDGET_MS = 60_000;
const TIMEOUT_BUFFER_MS = 10_000;

/**
 * Compile fetch timeout: queue wait + pdflatex budget + buffer.
 * Override with LATEX_COMPILE_TIMEOUT_MS or align queue wait via LATEX_COMPILE_QUEUE_WAIT_MS.
 */
export function getLatexCompileTimeoutMs(): number {
  const fromEnv = process.env.LATEX_COMPILE_TIMEOUT_MS;
  if (fromEnv) {
    const n = parseInt(fromEnv, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const queueWait = parseInt(
    process.env.LATEX_COMPILE_QUEUE_WAIT_MS ?? String(DEFAULT_QUEUE_WAIT_MS),
    10,
  );
  const safeQueueWait =
    Number.isFinite(queueWait) && queueWait > 0
      ? queueWait
      : DEFAULT_QUEUE_WAIT_MS;

  return safeQueueWait + PDFLATEX_BUDGET_MS + TIMEOUT_BUFFER_MS;
}
