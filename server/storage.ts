import { db } from "./db";
import {
  books, interviewMessages, photos,
  type Book, type InsertBook,
  type InterviewMessage, type InsertInterviewMessage,
  type Photo, type InsertPhoto,
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  createBook(data: InsertBook): Promise<Book>;
  getBook(id: number): Promise<Book | undefined>;
  updateBook(id: number, data: Partial<InsertBook>): Promise<Book>;
  getMessages(bookId: number): Promise<InterviewMessage[]>;
  createMessage(data: InsertInterviewMessage): Promise<InterviewMessage>;
  getPhotos(bookId: number): Promise<Photo[]>;
  createPhoto(data: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;
  getSharedBooks(): Promise<Book[]>;
}

export class DatabaseStorage implements IStorage {
  async createBook(data: InsertBook): Promise<Book> {
    const [book] = await db.insert(books).values(data).returning();
    return book;
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async updateBook(id: number, data: Partial<InsertBook>): Promise<Book> {
    const [book] = await db.update(books).set(data).where(eq(books.id, id)).returning();
    return book;
  }

  async getMessages(bookId: number): Promise<InterviewMessage[]> {
    return db.select().from(interviewMessages)
      .where(eq(interviewMessages.bookId, bookId))
      .orderBy(asc(interviewMessages.createdAt));
  }

  async createMessage(data: InsertInterviewMessage): Promise<InterviewMessage> {
    const [msg] = await db.insert(interviewMessages).values(data).returning();
    return msg;
  }

  async getPhotos(bookId: number): Promise<Photo[]> {
    return db.select().from(photos)
      .where(eq(photos.bookId, bookId))
      .orderBy(asc(photos.createdAt));
  }

  async createPhoto(data: InsertPhoto): Promise<Photo> {
    const [photo] = await db.insert(photos).values(data).returning();
    return photo;
  }

  async deletePhoto(id: number): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  async getSharedBooks(): Promise<Book[]> {
    return db.select().from(books)
      .where(eq(books.shared, true))
      .orderBy(desc(books.createdAt));
  }
}

export const storage = new DatabaseStorage();
