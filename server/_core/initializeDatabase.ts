import crypto from "crypto";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

/**
 * Hash password with salt using PBKDF2
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Initialize database with default admin user if it doesn't exist
 * This runs automatically on server startup
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.log("[Database] Skipping initialization - database not available");
      return;
    }

    // Credenciais padrão do admin
    const adminEmail = "admin@configvalidator.com";
    const adminPassword = "Admin@123456";
    const adminName = "Administrador";

    // Verificar se admin já existe
    const existingAdmin = await db
      .select()
      .from(users)
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("[Database] Admin user already exists, skipping initialization");
      return;
    }

    // Hash da senha
    const passwordHash = hashPassword(adminPassword);

    // Inserir admin
    await db.insert(users).values({
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("[Database] ✅ Admin user created successfully!");
    console.log("[Database] 📧 Email: " + adminEmail);
    console.log("[Database] 🔑 Password: " + adminPassword);
    console.log("[Database] ⚠️  IMPORTANT: Change password after first login!");
  } catch (error) {
    console.error("[Database] Error initializing database:", error);
    // Não lance erro, apenas log - a aplicação pode continuar funcionando
  }
}
