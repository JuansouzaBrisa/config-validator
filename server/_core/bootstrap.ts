import { execSync } from "child_process";
import fs from "fs";

const BOOTSTRAP_FLAG_FILE = "/tmp/config-validator-bootstrapped";

/**
 * Run database migrations and seed admin user on first startup
 * This is called once per deployment
 */
export async function bootstrapDatabase(): Promise<void> {
  // Check if already bootstrapped in this deployment
  if (fs.existsSync(BOOTSTRAP_FLAG_FILE)) {
    console.log("[Bootstrap] Already bootstrapped in this deployment, skipping");
    return;
  }

  try {
    console.log("[Bootstrap] Starting database bootstrap...");

    // Wait a bit for database to be ready
    console.log("[Bootstrap] Waiting for database to be ready...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Run migrations
    console.log("[Bootstrap] Running migrations...");
    try {
      execSync("pnpm db:push", {
        cwd: process.cwd(),
        stdio: "pipe",
        env: { ...process.env, NODE_ENV: "production" },
        timeout: 30000,
      });
      console.log("[Bootstrap] ✅ Migrations completed successfully");
    } catch (error) {
      console.warn("[Bootstrap] ⚠️  Migrations failed - database may not be ready yet");
      console.warn("[Bootstrap] You may need to run 'pnpm db:push' manually later");
    }

    // Seed admin user
    console.log("[Bootstrap] Creating admin user...");
    try {
      execSync("pnpm seed:admin", {
        cwd: process.cwd(),
        stdio: "pipe",
        env: { ...process.env, NODE_ENV: "production" },
        timeout: 30000,
      });
      console.log("[Bootstrap] ✅ Admin user created successfully");
    } catch (error) {
      console.warn("[Bootstrap] ⚠️  Admin seed failed - you may need to run it manually later");
    }

    // Create flag file to prevent re-running
    fs.writeFileSync(BOOTSTRAP_FLAG_FILE, new Date().toISOString());
    console.log("[Bootstrap] ✅ Bootstrap completed!");
  } catch (error) {
    console.error("[Bootstrap] Error during bootstrap:", error);
    // Don't throw - let the app continue even if bootstrap fails
  }
}
