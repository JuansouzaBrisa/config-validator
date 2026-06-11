import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table with internal authentication (email/password)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  passwordHash: text("passwordHash").notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Submissions table - novatos submit configurations
 */
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  ticketLink: varchar("ticketLink", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_review", "completed"]).default("pending").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

/**
 * Devices table - each submission can have multiple devices
 */
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  config: text("config").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Review items table - each line of config can be reviewed
 */
export const reviewItems = mysqlTable("reviewItems", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  lineNumber: int("lineNumber").notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["correct", "error", "unnecessary"]),
  comment: text("comment"),
  reviewedBy: int("reviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewItem = typeof reviewItems.$inferSelect;
export type InsertReviewItem = typeof reviewItems.$inferInsert;
