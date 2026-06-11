import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BOOTSTRAP_FLAG_FILE = "/tmp/config-validator-bootstrapped";

/**
 * Run database migrations and seed admin user on first startup
 * This is called once per deployment
 */
export async function bootstrapDatabase(): Promise<void> {
  // Check if already bootstrapped in this deployment
  if (fs.existsSync(BOOTSTRAP_FLAG_FILE)) {
    return;
  }

  try {
    console.log("[Bootstrap] Starting database bootstrap...");

    // Run migrations
    console.log("[Bootstrap] Running migrations...");
    try {
      execSync("pnpm db:push", {
        cwd: process.cwd(),
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "production" },
      });
      console.log("[Bootstrap] ✅ Migrations completed successfully");
    } catch (error) {
      console.error("[Bootstrap] ⚠️  Migrations failed (this may be expected if DB is not ready):", error);
    }

    // Seed admin user
    console.log("[Bootstrap] Creating admin user...");
    try {
      execSync("pnpm seed:admin", {
        cwd: process.cwd(),
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "production" },
      });
      console.log("[Bootstrap] ✅ Admin user created successfully");
    } catch (error) {
      console.error("[Bootstrap] ⚠️  Admin seed failed (this may be expected if DB is not ready):", error);
    }

    // Create flag file to prevent re-running
    fs.writeFileSync(BOOTSTRAP_FLAG_FILE, new Date().toISOString());
    console.log("[Bootstrap] ✅ Bootstrap completed!");
  } catch (error) {
    console.error("[Bootstrap] Error during bootstrap:", error);
    // Don't throw - let the app continue even if bootstrap fails
  }
}
