/**
 * Convert Aiven MySQL URI to MySQL2 compatible format
 * Aiven uses: mysql://user:pass@host:port/db?ssl-mode=REQUIRED
 * MySQL2 needs: mysql://user:pass@host:port/db?ssl={}
 */
export function convertAivenUrlToMysql2(url: string): string {
  if (!url) return url;

  // Replace ssl-mode=REQUIRED with ssl={}
  let converted = url.replace(/[?&]ssl-mode=REQUIRED/i, "?ssl={}");

  // If there are other query params, make sure ssl={} is added properly
  if (converted.includes("?") && !converted.includes("ssl=")) {
    converted = converted.replace("?", "?ssl={}&");
  } else if (!converted.includes("?") && !converted.includes("ssl=")) {
    converted += "?ssl={}";
  }

  return converted;
}

/**
 * Get the database URL, converting from Aiven format if necessary
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || "";
  
  if (url.includes("ssl-mode=REQUIRED")) {
    console.log("[Database] Converting Aiven URL format to MySQL2 compatible format");
    return convertAivenUrlToMysql2(url);
  }
  
  return url;
}
