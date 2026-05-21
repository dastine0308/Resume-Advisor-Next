const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const {
  acquireCompileSlot,
  releaseCompileSlot,
  getCompileConcurrencyStats,
  isCompileCapacityExhausted,
} = require("./concurrency");

const app = express();
const PORT = process.env.PORT || 80;
const TEMP_DIR = "/tmp/latex-compile";

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Ensure temp directory exists
(async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`Temp directory created: ${TEMP_DIR}`);
  } catch (err) {
    console.error("Failed to create temp directory:", err);
  }
})();

function buildHealthBody() {
  const overloaded = isCompileCapacityExhausted();
  return {
    status: overloaded ? "degraded" : "ok",
    service: "latex-pdf-service",
    concurrency: getCompileConcurrencyStats(),
  };
}

// Liveness — always 200 while the process is running (safe for orchestrator probes)
app.get("/health", (_req, res) => {
  res.json(buildHealthBody());
});

// Readiness — 503 when the compile queue is saturated
app.get("/health/ready", (_req, res) => {
  const body = buildHealthBody();
  if (body.status === "degraded") {
    return res.status(503).json(body);
  }
  res.json(body);
});

// LaTeX compilation endpoint
app.post("/api/compile-latex", async (req, res) => {
  const jobId = crypto.randomBytes(16).toString("hex");
  const jobDir = path.join(TEMP_DIR, jobId);
  let slotAcquired = false;

  try {
    const { latex } = req.body;

    if (!latex) {
      return res.status(400).json({ error: "LaTeX content is required" });
    }

    try {
      await acquireCompileSlot();
      slotAcquired = true;
    } catch (error) {
      if (
        error.message === "COMPILE_QUEUE_FULL" ||
        error.message === "COMPILE_QUEUE_TIMEOUT"
      ) {
        return res.status(503).json({
          error: "Service busy",
          message:
            error.message === "COMPILE_QUEUE_TIMEOUT"
              ? "Compilation queue wait timed out. Please try again."
              : "Too many concurrent compilations. Please try again in a moment.",
        });
      }
      throw error;
    }

    console.log(`[${jobId}] Starting LaTeX compilation...`);

    // Create job directory
    await fs.mkdir(jobDir, { recursive: true });

    // Write LaTeX file
    const texFile = path.join(jobDir, "document.tex");
    await fs.writeFile(texFile, latex, "utf8");

    console.log(`[${jobId}] LaTeX file written: ${texFile}`);

    // Compile LaTeX to PDF using pdflatex
    // Run twice to resolve references
    const compilePromise = new Promise((resolve, reject) => {
      const command = `cd ${jobDir} && pdflatex -interaction=nonstopmode -halt-on-error document.tex && pdflatex -interaction=nonstopmode -halt-on-error document.tex`;

      exec(command, { timeout: 30000 }, async (error, stdout, stderr) => {
        if (error) {
          console.error(`[${jobId}] Compilation error:`, error);

          // Try to read the log file for better error messages
          try {
            const logFile = path.join(jobDir, "document.log");
            const logContent = await fs.readFile(logFile, "utf8");

            // Extract error messages from log
            const errorLines = logContent
              .split("\n")
              .filter((line) => line.includes("!") || line.includes("Error"))
              .slice(0, 10)
              .join("\n");

            reject(
              new Error(`LaTeX compilation failed:\n${errorLines || stderr}`),
            );
          } catch {
            reject(new Error(`LaTeX compilation failed: ${error.message}`));
          }
          return;
        }

        console.log(`[${jobId}] Compilation successful`);
        resolve();
      });
    });

    await compilePromise;

    // Read the generated PDF
    const pdfFile = path.join(jobDir, "document.pdf");
    const pdfBuffer = await fs.readFile(pdfFile);

    console.log(
      `[${jobId}] PDF file read successfully (${pdfBuffer.length} bytes)`,
    );

    // Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.end(pdfBuffer, "binary");
  } catch (error) {
    console.error(`[${jobId}] Error:`, error);
    res.status(500).json({
      error: "Failed to compile LaTeX",
      message: error.message,
    });
  } finally {
    if (slotAcquired) {
      releaseCompileSlot();
    }

    // Cleanup job directory after a delay
    setTimeout(async () => {
      try {
        await fs.rm(jobDir, { recursive: true, force: true });
        console.log(`[${jobId}] Cleanup completed`);
      } catch (err) {
        console.error(`[${jobId}] Cleanup error:`, err);
      }
    }, 5000);
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`LaTeX service listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});
