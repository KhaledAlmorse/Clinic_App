import path from "node:path";
import app from "./app";
import { logger } from "./lib/logger";
import patientsRouter from "./routes/patients";
import dashboardRouter from "./routes/dashboard";
import settingsRouter from "./routes/settings";
import { initCronJobs } from "./cron";
import { Request, Response, NextFunction } from "express";

// Natively load environment variables in Node 24
try {
  process.loadEnvFile(path.join(process.cwd(), "../../.env"));
} catch {
  try {
    process.loadEnvFile(path.join(process.cwd(), ".env"));
  } catch {
    // Fall back to shell-defined env vars
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.use("/api", patientsRouter);
app.use("/api", dashboardRouter);
app.use("/api", settingsRouter);

initCronJobs();

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Internal server error");
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
