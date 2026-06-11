import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { users, submissions, devices, reviewItems } from "../drizzle/schema";
import fs from "fs";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      // Garante que a pasta /data exista no servidor do Railway
      if (!fs.existsSync("/data")) {
        fs.mkdirSync("/data", { recursive: true });
      }
      // Conecta no arquivo SQLite local protegido pelo Volume do Railway
      const client = createClient({ url: "file:/data/sqlite.db" });
      _db = drizzle(client);
      console.log("[Database] Conectado com sucesso ao SQLite no Railway (/data/sqlite.db)");
    } catch (error) {
      console.warn("[Database] Falha ao inicializar o SQLite:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User queries
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  role?: "user" | "analyst" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values({
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    role: data.role || "user",
    loginMethod: "internal",
    isActive: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  return { insertId: Number(result.lastInsertRowid) };
}

export async function updateUser(id: number, data: {
  name?: string;
  role?: "user" | "analyst" | "admin";
  isActive?: number;
  passwordHash?: string;
}){
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({
    ...data,
    updatedAt: new Date().toISOString(),
  }).where(eq(users.id, id));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(users);
}

export async function deactivateUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ isActive: 0, updatedAt: new Date().toISOString() }).where(eq(users.id, id));
}

export async function activateUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ isActive: 1, updatedAt: new Date().toISOString() }).where(eq(users.id, id));
}

/**
 * Submissions queries
 */
export async function createSubmission(data: {
  createdByUserId: number;
  title: string;
  ticketLink: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(submissions).values({
    ...data,
    status: "Pendente",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return { insertId: Number(result.lastInsertRowid) };
}

export async function getSubmissionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  return result[0];
}

export async function getSubmissionsByUser(userId: number, role: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (role === "user") {
    return await db.select().from(submissions).where(eq(submissions.createdByUserId, userId));
  } else if (role === "admin" || role === "analyst") { // Incluído o 'analyst' para listar chamados
    return await db.select().from(submissions);
  }
  return [];
}

export async function updateSubmissionStatus(id: number, status: "Pendente" | "Em revisão" | "Concluído") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(submissions).set({ status, updatedAt: new Date().toISOString() }).where(eq(submissions.id, id));
}

/**
 * Devices queries
 */
export async function createDevice(data: {
  submissionId: number;
  name: string;
  configCode: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(devices).values(data);
  return { insertId: Number(result.lastInsertRowid) };
}

export async function getDevicesBySubmission(submissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(devices).where(eq(devices.submissionId, submissionId));
}

/**
 * Review items queries
 */
export async function createReviewItem(data: {
  deviceId: number;
  lineNumber: number;
  lineContent: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reviewItems).values({
    ...data,
    reviewStatus: "Pendente" as any // Garante status inicial neutro/pendente
  });
  return { insertId: Number(result.lastInsertRowid) };
}

export async function getReviewItemsByDevice(deviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(reviewItems).where(eq(reviewItems.deviceId, deviceId));
}

export async function updateReviewItem(id: number, data: {
  reviewStatus: "Correto" | "Erro" | "Desnecessário";
  comment?: string;
  reviewedByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reviewItems).set({
    ...data,
    reviewedAt: new Date().toISOString(),
  }).where(eq(reviewItems.id, id));
}