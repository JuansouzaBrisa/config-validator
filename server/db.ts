import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, submissions, devices, reviewItems } from "../drizzle/schema";
import { getDatabaseUrl } from "./_core/databaseUrl";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    const dbUrl = getDatabaseUrl();
    if (dbUrl) {
      try {
        _db = drizzle(dbUrl);
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
}

/**
 * Create a new user with internal authentication
 */
export async function createUser(user: InsertUser): Promise<number> {
  if (!user.email || !user.passwordHash) {
    throw new Error("Email and password hash are required");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(users).values(user);
    return result[0].insertId as number;
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

/**
 * Get user by email
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

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update user
 */
export async function updateUser(id: number, updates: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(users).set(updates).where(eq(users.id, id));
  } catch (error) {
    console.error("[Database] Failed to update user:", error);
    throw error;
  }
}

/**
 * Get all users (for admin management)
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("[Database] Failed to get users:", error);
    return [];
  }
}

/**
 * Create submission
 */
export async function createSubmission(submission: typeof submissions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(submissions).values(submission);
    return result[0].insertId as number;
  } catch (error) {
    console.error("[Database] Failed to create submission:", error);
    throw error;
  }
}

/**
 * Get submission by ID with devices and review items
 */
export async function getSubmissionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const submission = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
    if (submission.length === 0) return undefined;

    const submissionDevices = await db.select().from(devices).where(eq(devices.submissionId, id));
    
    return {
      ...submission[0],
      devices: submissionDevices,
    };
  } catch (error) {
    console.error("[Database] Failed to get submission:", error);
    return undefined;
  }
}

/**
 * Get all submissions by creator
 */
export async function getSubmissionsByCreator(createdBy: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(submissions).where(eq(submissions.createdBy, createdBy));
  } catch (error) {
    console.error("[Database] Failed to get submissions:", error);
    return [];
  }
}

/**
 * Get all submissions (for analysts)
 */
export async function getAllSubmissions() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(submissions);
  } catch (error) {
    console.error("[Database] Failed to get submissions:", error);
    return [];
  }
}

/**
 * Create device
 */
export async function createDevice(device: typeof devices.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(devices).values(device);
    return result[0].insertId as number;
  } catch (error) {
    console.error("[Database] Failed to create device:", error);
    throw error;
  }
}

/**
 * Create review item
 */
export async function createReviewItem(item: typeof reviewItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(reviewItems).values(item);
    return result[0].insertId as number;
  } catch (error) {
    console.error("[Database] Failed to create review item:", error);
    throw error;
  }
}

/**
 * Get review items by device
 */
export async function getReviewItemsByDevice(deviceId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(reviewItems).where(eq(reviewItems.deviceId, deviceId));
  } catch (error) {
    console.error("[Database] Failed to get review items:", error);
    return [];
  }
}

/**
 * Update review item
 */
export async function updateReviewItem(id: number, updates: Partial<typeof reviewItems.$inferInsert>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(reviewItems).set(updates).where(eq(reviewItems.id, id));
  } catch (error) {
    console.error("[Database] Failed to update review item:", error);
    throw error;
  }
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(id: number, status: "pending" | "in_review" | "completed"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(submissions).set({ status }).where(eq(submissions.id, id));
  } catch (error) {
    console.error("[Database] Failed to update submission status:", error);
    throw error;
  }
}
