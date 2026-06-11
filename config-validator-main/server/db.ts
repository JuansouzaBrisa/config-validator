import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, submissions, devices, reviewItems } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  role?: "user" | "analyst" | "admin"; // <-- Adicione "analyst" aqui
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
  });
  return { insertId: (result as any).insertId };
}

export async function updateUser(id: number, data: {
  name?: string;
  role?: "user" | "analyst" | "admin"; // <-- Adicione "analyst" aqui
  isActive?: number;
  passwordHash?: string;
}){
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({
    ...data,
    updatedAt: new Date(),
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

  await db.update(users).set({ isActive: 0, updatedAt: new Date() }).where(eq(users.id, id));
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

  const result = await db.insert(submissions).values(data);
  return { insertId: (result as any).insertId };
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
  } else if (role === "admin") {
    return await db.select().from(submissions);
  }
  return [];
}

export async function updateSubmissionStatus(id: number, status: "Pendente" | "Em revisão" | "Concluído") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(submissions).set({ status, updatedAt: new Date() }).where(eq(submissions.id, id));
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
  return { insertId: (result as any).insertId };
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

  const result = await db.insert(reviewItems).values(data);
  return { insertId: (result as any).insertId };
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
    reviewedAt: new Date(),
  }).where(eq(reviewItems.id, id));
}

export async function activateUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ isActive: 1, updatedAt: new Date() }).where(eq(users.id, id));
}
