import { defineConfig } from "drizzle-kit";
import path from "path";

// Load environment variables natively in Node 24
try {
  process.loadEnvFile(path.join(__dirname, "../../.env"));
} catch {
  try {
    process.loadEnvFile(path.join(__dirname, "./.env"));
  } catch {
    // Fall back to shell-defined env vars
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
