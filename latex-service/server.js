const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3002;
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "latex-pdf-service" });
});

// LaTeX compilation endpoint
app.post("/api/compile-latex", async (req, res) => {
  const jobId = crypto.randomBytes(16).toString("hex");
  const jobDir = path.join(TEMP_DIR, jobId);

  try {
    const { latex } = req.body;

    if (!latex) {
      return res.status(400).json({ error: "LaTeX content is required" });
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
