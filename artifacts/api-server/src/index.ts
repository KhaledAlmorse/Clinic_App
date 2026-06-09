import path from "node:path";
import app from "./app";
import { logger } from "./lib/logger";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
