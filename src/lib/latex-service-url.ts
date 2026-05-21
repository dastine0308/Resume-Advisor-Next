/** Base URL for the LaTeX compilation microservice. */
export function getLatexServiceUrl(): string {
  return process.env.LATEX_SERVICE_URL ?? "http://localhost:5400";
}

/** Reject oversized payloads before forwarding to the compiler. */
export const MAX_LATEX_BODY_BYTES = 512 * 1024;
