import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { interviewChat, generateBookContent, getInitialQuestion } from "./ai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { INTERVIEW_CATEGORIES } from "@shared/schema";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/books", async (req, res) => {
    try {
      const { authorName } = req.body;
      if (!authorName || typeof authorName !== "string") {
        return res.status(400).json({ error: "Author name is required" });
      }
      const book = await storage.createBook({
        authorName: authorName.trim(),
        title: `${authorName.trim()}'s Story`,
        status: "interviewing",
        currentCategory: "early_life",
      });

      const initialQ = await getInitialQuestion(authorName.trim());
      await storage.createMessage({
        bookId: book.id,
        role: "assistant",
        content: initialQ,
        category: "early_life",
      });

      res.status(201).json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBook(Number(req.params.id));
      if (!book) return res.status(404).json({ error: "Book not found" });
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch book" });
    }
  });

  app.get("/api/books/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(Number(req.params.id));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/books/:id/chat", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      const { content } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Content is required" });
      }

      const book = await storage.getBook(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });

      await storage.createMessage({
        bookId,
        role: "user",
        content: content.trim(),
        category: book.currentCategory,
      });

      const messages = await storage.getMessages(bookId);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      const stream = await interviewChat(messages, book);

      for await (const chunk of stream) {
        if (chunk) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      }

      await storage.createMessage({
        bookId,
        role: "assistant",
        content: fullResponse,
        category: book.currentCategory,
      });

      const shouldAdvance = checkShouldAdvanceCategory(messages.length, fullResponse);
      if (shouldAdvance && book.currentCategory) {
        const catIndex = INTERVIEW_CATEGORIES.findIndex(c => c.id === book.currentCategory);
        if (catIndex < INTERVIEW_CATEGORIES.length - 1) {
          await storage.updateBook(bookId, {
            currentCategory: INTERVIEW_CATEGORIES[catIndex + 1].id,
          });
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Chat error" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  app.post("/api/books/:id/generate", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      const book = await storage.getBook(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });

      const messages = await storage.getMessages(bookId);
      const photos = await storage.getPhotos(bookId);

      const bookContent = await generateBookContent(book, messages, photos);

      const updatedBook = await storage.updateBook(bookId, {
        status: "completed",
        generatedContent: bookContent,
      });

      res.json(updatedBook);
    } catch (error) {
      console.error("Error generating book:", error);
      res.status(500).json({ error: "Failed to generate book" });
    }
  });

  app.get("/api/books/:id/download", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      const book = await storage.getBook(bookId);
      if (!book || !book.generatedContent) {
        return res.status(404).json({ error: "Book not found or not generated" });
      }

      const bookPhotos = await storage.getPhotos(bookId);
      const photosWithData = bookPhotos.map((photo) => {
        const filePath = path.join(uploadsDir, photo.filename);
        let base64 = "";
        let mimeType = "image/jpeg";
        if (fs.existsSync(filePath)) {
          const ext = path.extname(photo.filename).toLowerCase();
          if (ext === ".png") mimeType = "image/png";
          else if (ext === ".gif") mimeType = "image/gif";
          else if (ext === ".webp") mimeType = "image/webp";
          base64 = fs.readFileSync(filePath).toString("base64");
        }
        return { ...photo, base64, mimeType };
      });

      const html = generatePrintHTML(book, photosWithData);

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="${book.authorName}-you-and-me.html"`);
      res.send(html);
    } catch (error) {
      res.status(500).json({ error: "Failed to download book" });
    }
  });

  app.post("/api/books/:id/photos", upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const photo = await storage.createPhoto({
        bookId: Number(req.params.id),
        filename: req.file.filename,
        originalName: req.file.originalname,
        caption: (req.body.caption as string) || null,
        category: (req.body.category as string) || null,
      });

      res.status(201).json(photo);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  app.get("/api/books/:id/photos", async (req, res) => {
    try {
      const photos = await storage.getPhotos(Number(req.params.id));
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  app.get("/api/uploads/:filename", (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  return httpServer;
}

function checkShouldAdvanceCategory(messageCount: number, lastResponse: string): boolean {
  const categoryMessageThreshold = 6;
  const perCategoryCount = messageCount % categoryMessageThreshold;
  return perCategoryCount >= categoryMessageThreshold - 1;
}

function generatePrintHTML(book: any, photos: any[]): string {
  const content = book.generatedContent || "";
  const photoMap = new Map(photos.map((p: any) => [String(p.id), p]));
  const chapters = content.split(/^## /m).filter(Boolean);

  let chaptersHtml = chapters.map((chapter: string, i: number) => {
    const lines = chapter.trim().split("\n");
    const title = lines[0].replace(/^#+\s*/, "");
    const body = lines.slice(1).join("\n").trim();

    const processedBody = body.split("\n\n").map((paragraph: string) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return "";
      const photoRegex = /\[PHOTO:(\d+):([^\]]*)\]/g;
      if (photoRegex.test(trimmed)) {
        photoRegex.lastIndex = 0;
        const parts = trimmed.split(/\[PHOTO:\d+:[^\]]*\]/);
        const markers = [...trimmed.matchAll(/\[PHOTO:(\d+):([^\]]*)\]/g)];
        let result = "";
        parts.forEach((part: string, idx: number) => {
          const text = part.trim();
          if (text) result += `<p>${text}</p>`;
          if (idx < markers.length) {
            const photo = photoMap.get(markers[idx][1]);
            if (photo && photo.base64) {
              result += `
                <div class="photo">
                  <img src="data:${photo.mimeType};base64,${photo.base64}" alt="${photo.caption || photo.originalName}" style="max-width: 100%; height: auto; border-radius: 4px;" />
                  ${photo.caption ? `<p class="photo-caption">${photo.caption}</p>` : `<p class="photo-caption">${photo.originalName}</p>`}
                </div>
              `;
            }
          }
        });
        return result;
      }
      return `<p>${trimmed}</p>`;
    }).join("");

    const titleLower = title.toLowerCase();
    const categoryPhotos = photos.filter((p: any) => {
      const cat = (p.category || "").replace("_", " ");
      return cat && titleLower.includes(cat) && !content.includes(`[PHOTO:${p.id}:`);
    });
    const remainingPhotosHtml = categoryPhotos.map((p: any) => {
      if (p.base64) {
        return `
          <div class="photo">
            <img src="data:${p.mimeType};base64,${p.base64}" alt="${p.caption || p.originalName}" style="max-width: 100%; height: auto; border-radius: 4px;" />
            ${p.caption ? `<p class="photo-caption">${p.caption}</p>` : ""}
          </div>
        `;
      }
      return "";
    }).join("");

    return `
      <div class="chapter" style="page-break-before: always;">
        <p class="chapter-num">Chapter ${String(i + 1).padStart(2, "0")}</p>
        <h2>${title}</h2>
        ${processedBody}
        ${remainingPhotosHtml}
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${book.title} by ${book.authorName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600&display=swap');
    @page { size: 6in 9in; margin: 1in; }
    body { font-family: 'Libre Baskerville', Georgia, serif; font-size: 11pt; line-height: 1.7; color: #1a1a1a; max-width: 5in; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 28pt; text-align: center; margin-bottom: 8pt; }
    h2 { font-size: 18pt; margin-top: 0; margin-bottom: 16pt; border-bottom: 1px solid #ccc; padding-bottom: 8pt; }
    .cover { text-align: center; page-break-after: always; padding-top: 3in; }
    .cover h1 { font-size: 32pt; }
    .cover .author { font-size: 16pt; color: #555; margin-top: 20pt; }
    .cover .subtitle { font-size: 12pt; color: #777; margin-top: 8pt; font-style: italic; }
    .dedication { text-align: center; font-style: italic; padding: 3in 0; page-break-after: always; }
    .chapter-num { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10pt; color: #555; font-weight: 600; margin-bottom: 4pt; letter-spacing: 1px; }
    p { margin: 0 0 12pt 0; text-align: justify; }
    .photo { margin: 20pt 0; padding: 12pt; background: #f5f5f5; border-radius: 4pt; text-align: center; }
    .photo-caption { font-style: italic; font-size: 9pt; color: #666; margin: 8pt 0 0 0; }
    .end { text-align: center; margin-top: 40pt; font-style: italic; color: #777; }
    @media print { body { max-width: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${book.title}</h1>
    ${book.subtitle ? `<p class="subtitle">${book.subtitle}</p>` : ""}
    <p class="author">${book.authorName}</p>
  </div>
  ${book.dedication ? `<div class="dedication"><p>Dedicated to</p><p>${book.dedication}</p></div>` : ""}
  ${chaptersHtml}
  <div class="end">
    <p>~ The End ~</p>
    <p>You & Me — A Life Story, Told</p>
    <p>${book.authorName}</p>
  </div>
</body>
</html>`;
}
