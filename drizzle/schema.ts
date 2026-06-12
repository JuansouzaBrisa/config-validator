import { pgTable, serial, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

/**
 * Roles and Status Enums
 */
export const roleEnum = pgEnum("role", ["user", "analyst", "admin"]);
export const submissionStatusEnum = pgEnum("submission_status", ["Pendente", "Em revisão", "Concluído"]);
export const reviewStatusEnum = pgEnum("review_status", ["Pendente", "Correto", "Erro", "Desnecessário"]);

/**
 * Core user table
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("passwordHash").notNull(),
  role: roleEnum("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Submissions table - "Os Chamados"
 */
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  createdByUserId: integer("created_by_user_id").references(() => users.id).notNull(),
  title: text("title").notNull(), // INC123456
  ticketLink: text("ticket_link").notNull(),
  status: submissionStatusEnum("status").default("Pendente").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

/**
 * Devices table - Equipamentos
 */
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").references(() => submissions.id).notNull(),
  name: text("name").notNull(), // Switch-Core-01
  configCode: text("config_code").notNull(), // Bloco bruto
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Review items table - Linhas de Comando Fatiadas
 */
export const reviewItems = pgTable("review_items", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => devices.id).notNull(),
  lineNumber: integer("line_number").notNull(),
  lineContent: text("line_content").notNull(),
  reviewStatus: reviewStatusEnum("review_status").default("Pendente").notNull(),
  comment: text("comment"),
  reviewedByUserId: integer("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
});

export type ReviewItem = typeof reviewItems.$inferSelect;
export type InsertReviewItem = typeof reviewItems.$inferInsert;
