import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("My Personal Manifesto"),
  authorName: text("author_name").notNull(),
  subtitle: text("subtitle"),
  dedication: text("dedication"),
  status: text("status").notNull().default("interviewing"),
  currentCategory: text("current_category").default("early_life"),
  generatedContent: text("generated_content"),
  coverColor: text("cover_color").default("#1a1a2e"),
  paid: boolean("paid").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const interviewMessages = pgTable("interview_messages", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  caption: text("caption"),
  category: text("category"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});

export const insertInterviewMessageSchema = createInsertSchema(interviewMessages).omit({
  id: true,
  createdAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type InterviewMessage = typeof interviewMessages.$inferSelect;
export type InsertInterviewMessage = z.infer<typeof insertInterviewMessageSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export const INTERVIEW_CATEGORIES = [
  { id: "early_life", label: "Early Life & Childhood", icon: "baby" },
  { id: "family", label: "Family & Relationships", icon: "heart" },
  { id: "career", label: "Career & Achievements", icon: "briefcase" },
  { id: "beliefs", label: "Core Beliefs & Values", icon: "compass" },
  { id: "wisdom", label: "Life Lessons & Wisdom", icon: "lightbulb" },
  { id: "predictions", label: "Predictions & Future Vision", icon: "telescope" },
  { id: "legacy", label: "Legacy & Final Words", icon: "feather" },
] as const;

export type InterviewCategory = typeof INTERVIEW_CATEGORIES[number]["id"];
