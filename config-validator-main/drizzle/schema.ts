import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).unique(),
  name: text("name"),
  passwordHash: varchar("passwordHash", { length: 255 }),
  openId: varchar("openId", { length: 64 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }).default("internal").notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Submissions table: stores configuration submission requests
 */
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the user who created the submission (novato) */
  createdByUserId: int("createdByUserId").notNull(),
  /** Reference to the analyst assigned to review (analista) */
  assignedAnalystId: int("assignedAnalystId"),
  /** Submission title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Link to the internal ticket/chamado */
  ticketLink: varchar("ticketLink", { length: 512 }).notNull(),
  /** Description or observations */
  description: text("description"),
  /** Status: Pendente, Em revisão, Concluído */
  status: mysqlEnum("status", ["Pendente", "Em revisão", "Concluído"]).default("Pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

/**
 * Devices table: stores multiple devices/configurations per submission
 */
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the submission */
  submissionId: int("submissionId").notNull(),
  /** Device name/identifier */
  name: varchar("name", { length: 255 }).notNull(),
  /** Device configuration/commands in code block format */
  configCode: text("configCode").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Review items table: stores individual line reviews for each device configuration
 */
export const reviewItems = mysqlTable("reviewItems", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the device being reviewed */
  deviceId: int("deviceId").notNull(),
  /** Line number in the configuration code */
  lineNumber: int("lineNumber").notNull(),
  /** The actual code line content */
  lineContent: text("lineContent").notNull(),
  /** Review status: Correto (green), Erro (red), Desnecessário (yellow) */
  reviewStatus: mysqlEnum("reviewStatus", ["Correto", "Erro", "Desnecessário"]),
  /** Analyst comment/note for this line */
  comment: text("comment"),
  /** Reference to the analyst who reviewed this */
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReviewItem = typeof reviewItems.$inferSelect;
export type InsertReviewItem = typeof reviewItems.$inferInsert;