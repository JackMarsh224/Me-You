import { db } from "./db";
import {
  users, books, interviewMessages, photos, videos,
  type User, type InsertUser,
  type Book, type InsertBook,
  type InterviewMessage, type InsertInterviewMessage,
  type Photo, type InsertPhoto,
  type Video, type InsertVideo,
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  createUser(data: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createBook(data: InsertBook): Promise<Book>;
  getBook(id: number): Promise<Book | undefined>;
  updateBook(id: number, data: Partial<InsertBook>): Promise<Book>;
  getBooksByUserId(userId: number): Promise<Book[]>;
  getMessages(bookId: number): Promise<InterviewMessage[]>;
  createMessage(data: InsertInterviewMessage): Promise<InterviewMessage>;
  getPhotos(bookId: number): Promise<Photo[]>;
  createPhoto(data: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;
  getSharedBooks(): Promise<Book[]>;
  createVideo(data: InsertVideo): Promise<Video>;
  getVideo(id: number): Promise<Video | undefined>;
  getVideosByBookId(bookId: number): Promise<Video[]>;
  getVideosByUserId(userId: number): Promise<Video[]>;
}

export class DatabaseStorage implements IStorage {
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

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

  async getBooksByUserId(userId: number): Promise<Book[]> {
    return db.select().from(books)
      .where(eq(books.userId, userId))
      .orderBy(desc(books.createdAt));
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

  async createVideo(data: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(data).returning();
    return video;
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async getVideosByBookId(bookId: number): Promise<Video[]> {
    return db.select().from(videos)
      .where(eq(videos.bookId, bookId))
      .orderBy(asc(videos.createdAt));
  }

  async getVideosByUserId(userId: number): Promise<Video[]> {
    return db.select().from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
  }
}

export const storage = new DatabaseStorage();
