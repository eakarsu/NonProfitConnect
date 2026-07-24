import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"),
  provider: varchar("provider"),
  providerId: varchar("provider_id"),
  roles: varchar("roles").array().default(["applicant"]).notNull(),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  bio: text("bio"),
  phone: varchar("phone"),
  organization: varchar("organization"),
  darkMode: boolean("dark_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  requestedAmount: decimal("requested_amount", { precision: 10, scale: 2 }).notNull(),
  timeline: varchar("timeline", { length: 100 }).notNull(),
  status: varchar("status", {
    enum: ["pending", "approved", "rejected", "funded", "completed"]
  }).default("pending").notNull(),
  priority: varchar("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  riskScore: integer("risk_score"),
  imageUrl: varchar("image_url"),
  isPublic: boolean("is_public").default(true),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  reviewerId: varchar("reviewer_id").notNull(),
  decision: varchar("decision", { enum: ["approved", "rejected"] }).notNull(),
  comments: text("comments"),
  reviewedAt: timestamp("reviewed_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  investorId: varchar("investor_id").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  recurring: boolean("recurring").default(false),
  investedAt: timestamp("invested_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("info"),
  link: varchar("link"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiResults = pgTable("ai_results", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  feature: varchar("feature", { length: 120 }).notNull(),
  input: jsonb("input").notNull(),
  output: jsonb("output").notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// NEW TABLES
// ==========================================

// Messages (direct messaging between users)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Milestones
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { enum: ["pending", "in_progress", "completed"] }).default("pending").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments (threaded discussions on projects)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookmarks / Watchlist
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Updates (progress posts from applicants)
export const projectUpdates = pgTable("project_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Log (audit trail)
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents / Links attached to projects
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }),
  type: varchar("type", { length: 50 }).default("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==========================================
// Relations
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  reviews: many(reviews),
  investments: many(investments),
  notifications: many(notifications),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  comments: many(comments),
  bookmarks: many(bookmarks),
  activities: many(activityLog),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
  investments: many(investments),
  milestones: many(milestones),
  comments: many(comments),
  bookmarks: many(bookmarks),
  updates: many(projectUpdates),
  documents: many(documents),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, { fields: [reviews.projectId], references: [projects.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id] }),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  project: one(projects, { fields: [investments.projectId], references: [projects.id] }),
  investor: one(users, { fields: [investments.investorId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sender" }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: "receiver" }),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, { fields: [milestones.projectId], references: [projects.id] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  project: one(projects, { fields: [comments.projectId], references: [projects.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "replies" }),
  replies: many(comments, { relationName: "replies" }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
  project: one(projects, { fields: [bookmarks.projectId], references: [projects.id] }),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(projects, { fields: [projectUpdates.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectUpdates.userId], references: [users.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, { fields: [activityLog.userId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, { fields: [documents.projectId], references: [projects.id] }),
  user: one(users, { fields: [documents.userId], references: [users.id] }),
}));

// ==========================================
// Insert schemas
// ==========================================

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true, userId: true, status: true, riskScore: true,
  submittedAt: true, reviewedAt: true, completedAt: true, createdAt: true, updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true, reviewerId: true, reviewedAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true, investorId: true, investedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true, read: true, createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true, read: true, createdAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true, completedAt: true, createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true, userId: true, createdAt: true, updatedAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true, createdAt: true,
});

export const insertProjectUpdateSchema = createInsertSchema(projectUpdates).omit({
  id: true, userId: true, createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true, userId: true, createdAt: true,
});

// Password validation
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  darkMode: z.boolean().optional(),
});

// ==========================================
// Types
// ==========================================
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
