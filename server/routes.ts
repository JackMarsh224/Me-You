import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { interviewChat, generateBookContent, getInitialQuestion } from "./ai";
import multer from "multer";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { INTERVIEW_CATEGORIES } from "@shared/schema";
import { generateBookHTML } from "./services/generateBookFile";
import { sendOrderEmail } from "./services/sendOrderEmail";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

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

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only videos are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Stripe: get publishable key for frontend
  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (err: any) {
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  // Stripe: create PaymentIntent (embedded payment, no redirect)
  app.post("/api/stripe/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    try {
      const { authorName, customerEmail, deliveryName, deliveryAddress, deliveryCity, deliveryPostcode, deliveryCountry } = req.body;
      if (!authorName) return res.status(400).json({ error: "Author name is required" });

      const stripe = await getUncachableStripeClient();
      const pi = await (stripe.paymentIntents as any).create({
        amount: 4999,
        currency: "gbp",
        payment_method_types: ["card"],
        receipt_email: customerEmail || undefined,
        description: `You & Me — Life Story Book for ${authorName}`,
        metadata: {
          userId: String(req.user!.id),
          authorName,
          customerEmail: customerEmail || "",
          deliveryName: deliveryName || "",
          deliveryAddress: deliveryAddress || "",
          deliveryCity: deliveryCity || "",
          deliveryPostcode: deliveryPostcode || "",
          deliveryCountry: deliveryCountry || "",
        },
      });

      res.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id });
    } catch (err: any) {
      console.error("[stripe] PaymentIntent error:", err);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Stripe: complete order after inline payment confirmation
  app.post("/api/stripe/complete-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    try {
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) return res.status(400).json({ error: "PaymentIntent ID required" });

      const stripe = await getUncachableStripeClient();
      const pi = await (stripe.paymentIntents as any).retrieve(paymentIntentId);

      if (pi.status !== "succeeded") {
        return res.status(402).json({ error: "Payment not completed" });
      }

      const meta = pi.metadata || {};
      if (String(meta.userId) !== String(req.user!.id)) {
        return res.status(403).json({ error: "Payment does not belong to this user" });
      }

      const authorName = meta.authorName || "Unknown";
      const book = await storage.createBook({
        authorName: authorName.trim(),
        title: `${authorName.trim()}'s Story`,
        status: "interviewing",
        currentCategory: "tone_setting",
        userId: req.user!.id,
        paid: true,
        customerEmail: meta.customerEmail || null,
        deliveryName: meta.deliveryName || null,
        deliveryAddress: meta.deliveryAddress || null,
        deliveryCity: meta.deliveryCity || null,
        deliveryPostcode: meta.deliveryPostcode || null,
        deliveryCountry: meta.deliveryCountry || null,
      });

      const initialQ = await getInitialQuestion(authorName.trim());
      await storage.createMessage({
        bookId: book.id,
        role: "assistant",
        content: initialQ,
        category: "tone_setting",
      });

      res.status(201).json(book);
    } catch (err: any) {
      console.error("[stripe] Complete payment error:", err);
      res.status(500).json({ error: "Failed to complete order" });
    }
  });

  app.post("/api/books", async (req, res) => {
    try {
      const { authorName, paid, customerEmail, deliveryName, deliveryAddress, deliveryCity, deliveryPostcode, deliveryCountry } = req.body;
      if (!authorName || typeof authorName !== "string") {
        return res.status(400).json({ error: "Author name is required" });
      }
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "You must be logged in to create a book" });
      }
      const book = await storage.createBook({
        authorName: authorName.trim(),
        title: `${authorName.trim()}'s Story`,
        status: "interviewing",
        currentCategory: "tone_setting",
        userId: req.user!.id,
        paid: paid === true,
        customerEmail: customerEmail || null,
        deliveryName: deliveryName || null,
        deliveryAddress: deliveryAddress || null,
        deliveryCity: deliveryCity || null,
        deliveryPostcode: deliveryPostcode || null,
        deliveryCountry: deliveryCountry || null,
      });

      const initialQ = await getInitialQuestion(authorName.trim());
      await storage.createMessage({
        bookId: book.id,
        role: "assistant",
        content: initialQ,
        category: "tone_setting",
      });

      res.status(201).json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  app.get("/api/shared-books", async (req, res) => {
    try {
      const sharedBooks = await storage.getSharedBooks();
      res.json(sharedBooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared books" });
    }
  });

  app.post("/api/books/:id/share", async (req, res) => {
    try {
      const book = await storage.getBook(Number(req.params.id));
      if (!book) return res.status(404).json({ error: "Book not found" });
      const updated = await storage.updateBook(book.id, { shared: !book.shared });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update sharing" });
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

      // Tone-setting phase: advance to early_life when user says "let's begin"
      if (book.currentCategory === "tone_setting") {
        const userSaidBegin = /let['']?s\s+begin|let us begin|i['']?m\s+ready|lets\s+begin|start\s+(the\s+)?interview|ready\s+to\s+begin|begin\s+now/i.test(content.trim());
        if (userSaidBegin) {
          await storage.updateBook(bookId, { currentCategory: "early_life" });
        }
      } else {
        // Normal interview phase: advance by message count
        const shouldAdvance = checkShouldAdvanceCategory(messages.length, fullResponse);
        if (shouldAdvance && book.currentCategory) {
          const catIndex = INTERVIEW_CATEGORIES.findIndex(c => c.id === book.currentCategory);
          if (catIndex < INTERVIEW_CATEGORIES.length - 1) {
            await storage.updateBook(bookId, {
              currentCategory: INTERVIEW_CATEGORIES[catIndex + 1].id,
            });
          }
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

  app.post("/api/books/:id/pay", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      const book = await storage.getBook(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });
      if (book.status !== "completed") {
        return res.status(400).json({ error: "Book must be generated before payment" });
      }

      // TODO: Integrate Stripe payment processing here
      // For now, mark as paid directly (placeholder)
      const updatedBook = await storage.updateBook(bookId, { paid: true });
      res.json(updatedBook);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  app.post("/api/books/:id/generate", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      const book = await storage.getBook(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });

      const messages = await storage.getMessages(bookId);
      const photos = await storage.getPhotos(bookId);
      const videos = await storage.getVideosByBookId(bookId);

      const bookContent = await generateBookContent(book, messages, photos, videos);

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
      if (!book.paid) {
        return res.status(403).json({ error: "Payment required to download the book" });
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

      const bookVideos = await storage.getVideosByBookId(bookId);
      const host = req.get("host") || "localhost:5000";
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const videoQrMap = new Map<string, string>();
      for (const video of bookVideos) {
        const videoUrl = `${protocol}://${host}/video/${video.id}`;
        const qrBuffer = await QRCode.toBuffer(videoUrl, { width: 200, margin: 2 });
        videoQrMap.set(String(video.id), qrBuffer.toString("base64"));
      }

      const html = generatePrintHTML(book, photosWithData, videoQrMap);

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

  app.post("/api/books/:id/videos", videoUpload.single("video"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No video uploaded" });

      const video = await storage.createVideo({
        bookId: Number(req.params.id),
        filename: req.file.filename,
        originalName: req.file.originalname,
        title: (req.body.title as string) || null,
        description: (req.body.description as string) || null,
        category: (req.body.category as string) || null,
        userId: req.isAuthenticated() ? req.user!.id : null,
      });

      res.status(201).json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  app.get("/api/books/:id/videos", async (req, res) => {
    try {
      const videos = await storage.getVideosByBookId(Number(req.params.id));
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(Number(req.params.id));
      if (!video) return res.status(404).json({ error: "Video not found" });
      const book = await storage.getBook(video.bookId);
      res.json({ ...video, authorName: book?.authorName || "Unknown" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  app.get("/api/videos/:id/qr", async (req, res) => {
    try {
      const videoId = Number(req.params.id);
      const video = await storage.getVideo(videoId);
      if (!video) return res.status(404).json({ error: "Video not found" });

      const host = req.get("host") || "localhost:5000";
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const videoUrl = `${protocol}://${host}/video/${videoId}`;

      const qrBuffer = await QRCode.toBuffer(videoUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });

      res.setHeader("Content-Type", "image/png");
      res.send(qrBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  app.post("/api/books/:id/approve", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      const book = await storage.getBook(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });
      if (!book.paid) return res.status(403).json({ error: "Payment required before approval" });
      if (book.status !== "completed") return res.status(400).json({ error: "Book must be generated before approval" });

      // Idempotency guard — never send twice
      if (book.emailSentAt) {
        return res.json({ ...book, alreadyApproved: true });
      }

      const photos = await storage.getPhotos(bookId);
      const videos = await storage.getVideosByBookId(bookId);
      const host = req.get("host") || "localhost:5000";
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const baseUrl = `${protocol}://${host}`;

      // Generate book file
      let fileBuffer: Buffer;
      try {
        fileBuffer = await generateBookHTML(book, photos, videos.map(v => ({ id: v.id, title: v.title })), baseUrl);
      } catch (genErr) {
        console.error("[approve] Book file generation failed:", genErr);
        return res.status(500).json({ error: "Failed to generate book file" });
      }

      const fileName = `legacy-book-${bookId}-${book.authorName.replace(/\s+/g, "-")}.html`;
      const approvedAt = new Date();

      // Send email
      try {
        await sendOrderEmail({
          bookId,
          authorName: book.authorName,
          approvedAt,
          fileBuffer,
          fileName,
          customerEmail: book.customerEmail,
          deliveryName: book.deliveryName,
          deliveryAddress: book.deliveryAddress,
          deliveryCity: book.deliveryCity,
          deliveryPostcode: book.deliveryPostcode,
          deliveryCountry: book.deliveryCountry,
        });
      } catch (emailErr) {
        console.error("[approve] Email sending failed:", emailErr);
        return res.status(500).json({ error: "Failed to send order email. Please check SMTP configuration." });
      }

      // Update status — only after successful email
      const updatedBook = await storage.updateBook(bookId, {
        status: "in_production",
        approvedAt,
        emailSentAt: approvedAt,
      });

      res.json(updatedBook);
    } catch (error) {
      console.error("Error approving book:", error);
      res.status(500).json({ error: "Failed to approve book" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allBooks = await storage.getAllBooks();
      res.json(allBooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/my-books", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const books = await storage.getBooksByUserId(req.user!.id);
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });

  app.get("/api/my-videos", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const videos = await storage.getVideosByUserId(req.user!.id);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  return httpServer;
}

function checkShouldAdvanceCategory(messageCount: number, lastResponse: string): boolean {
  const categoryMessageThreshold = 6;
  const perCategoryCount = messageCount % categoryMessageThreshold;
  return perCategoryCount >= categoryMessageThreshold - 1;
}

function generatePrintHTML(book: any, photos: any[], videoQrMap: Map<string, string> = new Map()): string {
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
      const videoQrRegex = /\[VIDEO_QR:(\d+):([^\]]*)\]/g;
      if (videoQrRegex.test(trimmed)) {
        videoQrRegex.lastIndex = 0;
        const parts = trimmed.split(/\[VIDEO_QR:\d+:[^\]]*\]/);
        const markers = Array.from(trimmed.matchAll(/\[VIDEO_QR:(\d+):([^\]]*)\]/g));
        let result = "";
        parts.forEach((part: string, idx: number) => {
          const text = part.trim();
          if (text) result += `<p>${text}</p>`;
          if (idx < markers.length) {
            const qrBase64 = videoQrMap.get(markers[idx][1]);
            if (qrBase64) {
              result += `
                <div class="photo" style="text-align: center;">
                  <p style="font-size: 9pt; color: #666; margin-bottom: 8pt;">Scan to watch</p>
                  <img src="data:image/png;base64,${qrBase64}" alt="QR code: ${markers[idx][2]}" style="width: 150px; height: 150px;" />
                  <p class="photo-caption">${markers[idx][2]}</p>
                </div>
              `;
            }
          }
        });
        return result;
      }
      const photoRegex = /\[PHOTO:(\d+):([^\]]*)\]/g;
      if (photoRegex.test(trimmed)) {
        photoRegex.lastIndex = 0;
        const parts = trimmed.split(/\[PHOTO:\d+:[^\]]*\]/);
        const markers = Array.from(trimmed.matchAll(/\[PHOTO:(\d+):([^\]]*)\]/g));
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
