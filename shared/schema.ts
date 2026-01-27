import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===
export const confessions = pgTable("confessions", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  category: text("category").notNull().default("Thoughts"),
  meTooCount: integer("me_too_count").default(0).notNull(),
  nopeCount: integer("nope_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  confessionId: integer("confession_id").notNull(), // FK added in relations or DB level, keeping simple here
  content: text("content").notNull(),
  authorName: text("author_name").notNull(), // "Quirky Penguin", etc.
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === RELATIONS ===
export const confessionsRelations = relations(confessions, ({ many }) => ({
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  confession: one(confessions, {
    fields: [comments.confessionId],
    references: [confessions.id],
  }),
}));

// === SCHEMAS ===
export const insertConfessionSchema = createInsertSchema(confessions).omit({ 
  id: true, 
  meTooCount: true, 
  nopeCount: true, 
  createdAt: true 
}).extend({
  content: z.string().min(1, "Confession cannot be empty").max(200, "Confession must be under 200 characters"),
  category: z.string().min(1, "Category is required"),
});

export const insertCommentSchema = createInsertSchema(comments).omit({ 
  id: true, 
  likes: true, 
  createdAt: true,
  authorName: true // Generated on backend
}).extend({
  content: z.string().min(1, "Comment cannot be empty"),
});

// === EXPLICIT TYPES ===
export type Confession = typeof confessions.$inferSelect;
export type InsertConfession = z.infer<typeof insertConfessionSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type CreateConfessionRequest = InsertConfession;
export type CreateCommentRequest = InsertComment;

// API Response types
export interface ConfessionResponse extends Confession {
  commentCount?: number;
}

export type VoteType = "meToo" | "nope";
export type VoteRequest = { type: VoteType };

export interface TrendingStats {
  totalConfessions: number;
  totalVotes: number;
}
