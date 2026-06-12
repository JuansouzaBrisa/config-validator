import { eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import { getDatabaseUrl } from "./_core/databaseUrl";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
  if (!_db) {
    const dbUrl = getDatabaseUrl();
    if (dbUrl) {
      try {
        const queryClient = postgres(dbUrl);
        _db = drizzle(queryClient, { schema });
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
}

/**
 * User CRUD
 */
export async function createUser(user: schema.InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schema.users).values(user).returning({ id: schema.users.id });
  return result[0].id;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Submissions Logic
 */
export async function createSubmissionWithItems(data: {
  userId: number;
  title: string;
  ticketLink: string;
  deviceName: string;
  configCode: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.transaction(async (tx) => {
    // 1. Create Submission
    const [submission] = await tx.insert(schema.submissions).values({
      createdByUserId: data.userId,
      title: data.title,
      ticketLink: data.ticketLink,
      status: "Pendente",
    }).returning({ id: schema.submissions.id });

    // 2. Create Device
    const [device] = await tx.insert(schema.devices).values({
      submissionId: submission.id,
      name: data.deviceName,
      configCode: data.configCode,
    }).returning({ id: schema.devices.id });

    // 3. Slice config and create review items
    const lines = data.configCode.split("\n");
    const reviewItemsToInsert = lines.map((line, index) => ({
      deviceId: device.id,
      lineNumber: index + 1,
      lineContent: line,
      reviewStatus: "Pendente" as const,
    }));

    if (reviewItemsToInsert.length > 0) {
      await tx.insert(schema.reviewItems).values(reviewItemsToInsert);
    }

    return submission.id;
  });
}

export async function getSubmissionDetails(submissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const submission = await db.query.submissions.findFirst({
    where: eq(schema.submissions.id, submissionId),
  });

  if (!submission) return null;

  const device = await db.query.devices.findFirst({
    where: eq(schema.devices.submissionId, submissionId),
  });

  if (!device) return { submission, device: null, items: [] };

  const items = await db.query.reviewItems.findMany({
    where: eq(schema.reviewItems.deviceId, device.id),
    orderBy: [asc(schema.reviewItems.lineNumber)],
  });

  return { submission, device, items };
}

export async function updateLineStatus(data: {
  itemId: number;
  status: "Correto" | "Erro" | "Desnecessário";
  comment?: string;
  reviewerId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.reviewItems)
    .set({
      reviewStatus: data.status,
      comment: data.comment,
      reviewedByUserId: data.reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(schema.reviewItems.id, data.itemId));
}
