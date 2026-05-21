#!/usr/bin/env node

/**
 * LaTeX service availability probe.
 *
 * Usage:
 *   npm run latex:availability
 *   LATEX_SERVICE_URL=https://your-app.azurecontainerapps.io npm run latex:availability
 *   node scripts/latex-availability.mjs --health-only --requests 100
 */

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

const BASE_URL = (
  process.env.LATEX_SERVICE_URL || "http://localhost:5400"
).replace(/\/$/, "");
const HEALTH_REQUESTS = Number(getArg("--requests", "50"));
const COMPILE_REQUESTS = Number(getArg("--compiles", "5"));
const CONCURRENT = Number(getArg("--concurrent", "5"));
const HEALTH_ONLY = args.includes("--health-only");
const TIMEOUT_MS = Number(getArg("--timeout", "35000"));

function buildLatex(id) {
  return String.raw`\documentclass[letterpaper,11pt]{article}
\usepackage[empty]{fullpage}
\begin{document}
\section{Availability Probe ${id}}
Generated at ${new Date().toISOString()}
\end{document}`;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.floor((p / 100) * sorted.length),
  );
  return sorted[idx];
}

function summarize(results) {
  const ok = results.filter((r) => r.ok);
  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  return {
    total: results.length,
    success: ok.length,
    failed: results.length - ok.length,
    availabilityPct: ((ok.length / results.length) * 100).toFixed(2),
    latencyMs: {
      min: latencies[0]?.toFixed(1) ?? "0",
      p50: percentile(latencies, 50).toFixed(1),
      p95: percentile(latencies, 95).toFixed(1),
      max: latencies[latencies.length - 1]?.toFixed(1) ?? "0",
    },
    statusCodes: results.reduce((acc, r) => {
      const key = r.status ?? r.error ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

async function probeHealth() {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const ms = performance.now() - start;
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { ok: res.ok, ms, status: res.status, body };
  } catch (error) {
    return {
      ok: false,
      ms: performance.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function probeReadiness() {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/health/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const ms = performance.now() - start;
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    // 503 = saturated queue but service is reachable
    return { ok: res.ok || res.status === 503, ms, status: res.status, body };
  } catch (error) {
    return {
      ok: false,
      ms: performance.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function probeCompile(id) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/api/compile-latex`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latex: buildLatex(id) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ms = performance.now() - start;
    const buf = await res.arrayBuffer();
    const isPdf =
      res.ok &&
      buf.byteLength > 100 &&
      new TextDecoder().decode(new Uint8Array(buf.slice(0, 4))) === "%PDF";
    return { ok: isPdf || res.status === 503, ms, status: res.status };
  } catch (error) {
    return {
      ok: false,
      ms: performance.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function printSection(title, summary) {
  console.log(`\n${title}`);
  console.log(`  Availability: ${summary.availabilityPct}% (${summary.success}/${summary.total})`);
  console.log(
    `  Latency ms  min/p50/p95/max: ${summary.latencyMs.min} / ${summary.latencyMs.p50} / ${summary.latencyMs.p95} / ${summary.latencyMs.max}`,
  );
  if (Object.keys(summary.statusCodes).length > 0) {
    console.log(`  Status breakdown: ${JSON.stringify(summary.statusCodes)}`);
  }
}

async function main() {
  console.log("LaTeX Service Availability Probe");
  console.log(`Target: ${BASE_URL}`);

  const initial = await probeHealth();
  if (!initial.ok) {
    console.error("\nService unreachable.");
    console.error(JSON.stringify(initial, null, 2));
    process.exit(1);
  }

  console.log("\nInitial health:");
  console.log(JSON.stringify(initial.body, null, 2));

  const healthResults = [];
  for (let i = 0; i < HEALTH_REQUESTS; i++) {
    healthResults.push(await probeHealth());
  }
  printSection(`Health checks (${HEALTH_REQUESTS} sequential)`, summarize(healthResults));

  const readinessResults = [];
  for (let i = 0; i < HEALTH_REQUESTS; i++) {
    readinessResults.push(await probeReadiness());
  }
  printSection(
    `Readiness checks (${HEALTH_REQUESTS} sequential)`,
    summarize(readinessResults),
  );

  if (HEALTH_ONLY) {
    process.exit(Number(summarize(healthResults).availabilityPct) < 99 ? 1 : 0);
  }

  const compileResults = [];
  for (let i = 0; i < COMPILE_REQUESTS; i++) {
    compileResults.push(await probeCompile(`seq-${i}`));
  }
  printSection(
    `Compiles (${COMPILE_REQUESTS} sequential)`,
    summarize(compileResults),
  );

  const concurrentResults = await Promise.all(
    Array.from({ length: CONCURRENT }, (_, i) => probeCompile(`concurrent-${i}`)),
  );
  printSection(
    `Compiles (${CONCURRENT} concurrent)`,
    summarize(concurrentResults),
  );

  const healthScore = Number(summarize(healthResults).availabilityPct);
  const compileScore = Number(summarize(compileResults).availabilityPct);
  const concurrentScore = Number(summarize(concurrentResults).availabilityPct);
  const overall = ((healthScore + compileScore + concurrentScore) / 3).toFixed(2);

  console.log(`\nOverall availability score: ${overall}%`);
  console.log("Note: HTTP 503 (service busy) counts as reachable, not a hard failure.");

  process.exit(Number(overall) < 95 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
