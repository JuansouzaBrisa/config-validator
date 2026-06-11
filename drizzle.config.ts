import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Convert Aiven URL format to MySQL2 compatible format
function convertAivenUrl(url: string): string {
  if (url.includes("ssl-mode=REQUIRED")) {
    return url.replace(/[?&]ssl-mode=REQUIRED/i, "?ssl={}");
  }
  return url;
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: convertAivenUrl(connectionString),
  },
});
