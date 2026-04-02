import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import type { Book, Photo } from "@shared/schema";

const uploadsDir = path.join(process.cwd(), "uploads");

export async function generateBookHTML(
  book: Book,
  photos: Photo[],
  videoIds: { id: number; title: string | null }[],
  baseUrl: string
): Promise<Buffer> {
  const photosWithData = photos.map((photo) => {
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

  const videoQrMap = new Map<string, string>();
  for (const video of videoIds) {
    const videoUrl = `${baseUrl}/video/${video.id}`;
    const qrBuffer = await QRCode.toBuffer(videoUrl, { width: 200, margin: 2 });
    videoQrMap.set(String(video.id), qrBuffer.toString("base64"));
  }

  const content = book.generatedContent || "";
  const photoMap = new Map(photosWithData.map((p) => [String(p.id), p]));
  const chapters = content.split(/^## /m).filter(Boolean);

  const chaptersHtml = chapters.map((chapter, i) => {
    const lines = chapter.trim().split("\n");
    const title = lines[0].replace(/^#+\s*/, "");
    const body = lines.slice(1).join("\n").trim();

    const processedBody = body.split("\n\n").map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return "";

      const videoQrRegex = /\[VIDEO_QR:(\d+):([^\]]*)\]/g;
      if (videoQrRegex.test(trimmed)) {
        videoQrRegex.lastIndex = 0;
        const parts = trimmed.split(/\[VIDEO_QR:\d+:[^\]]*\]/);
        const markers = Array.from(trimmed.matchAll(/\[VIDEO_QR:(\d+):([^\]]*)\]/g));
        let result = "";
        parts.forEach((part, idx) => {
          const text = part.trim();
          if (text) result += `<p>${text}</p>`;
          if (idx < markers.length) {
            const qrBase64 = videoQrMap.get(markers[idx][1]);
            if (qrBase64) {
              result += `<div class="photo" style="text-align:center;">
                <p style="font-size:9pt;color:#666;margin-bottom:8pt;">Scan to watch</p>
                <img src="data:image/png;base64,${qrBase64}" alt="QR code: ${markers[idx][2]}" style="width:150px;height:150px;" />
                <p class="photo-caption">${markers[idx][2]}</p>
              </div>`;
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
        parts.forEach((part, idx) => {
          const text = part.trim();
          if (text) result += `<p>${text}</p>`;
          if (idx < markers.length) {
            const photo = photoMap.get(markers[idx][1]);
            if (photo && photo.base64) {
              result += `<div class="photo">
                <img src="data:${photo.mimeType};base64,${photo.base64}" alt="${photo.caption || photo.originalName}" style="max-width:100%;height:auto;border-radius:4px;" />
                <p class="photo-caption">${photo.caption || photo.originalName}</p>
              </div>`;
            }
          }
        });
        return result;
      }

      return `<p>${trimmed}</p>`;
    }).join("");

    const titleLower = title.toLowerCase();
    const categoryPhotos = photosWithData.filter((p) => {
      const cat = (p.category || "").replace("_", " ");
      return cat && titleLower.includes(cat) && !content.includes(`[PHOTO:${p.id}:`);
    });
    const remainingPhotosHtml = categoryPhotos.map((p) =>
      p.base64 ? `<div class="photo">
        <img src="data:${p.mimeType};base64,${p.base64}" alt="${p.caption || p.originalName}" style="max-width:100%;height:auto;border-radius:4px;" />
        ${p.caption ? `<p class="photo-caption">${p.caption}</p>` : ""}
      </div>` : ""
    ).join("");

    return `<div class="chapter" style="page-break-before:always;">
      <p class="chapter-num">Chapter ${String(i + 1).padStart(2, "0")}</p>
      <h2>${title}</h2>
      ${processedBody}
      ${remainingPhotosHtml}
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${book.authorName}'s Story — You &amp; Me</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600&display=swap');
    @page { size: 6in 9in; margin: 1in; }
    body { font-family: 'Libre Baskerville', Georgia, serif; font-size: 11pt; line-height: 1.7; color: #1a1a1a; max-width: 5in; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 28pt; text-align: center; margin-bottom: 8pt; }
    h2 { font-size: 18pt; margin-top: 0; margin-bottom: 16pt; border-bottom: 1px solid #ccc; padding-bottom: 8pt; }
    .cover { text-align: center; page-break-after: always; padding-top: 3in; }
    .cover h1 { font-size: 32pt; }
    .cover .author { font-size: 16pt; color: #555; margin-top: 20pt; }
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
    <h1>${book.authorName}'s Story</h1>
    <p class="author">You &amp; Me — A Life Story, Told</p>
  </div>
  ${chaptersHtml}
  <div class="end">
    <p>~ The End ~</p>
    <p>You &amp; Me — A Life Story, Told</p>
    <p>${book.authorName}</p>
  </div>
</body>
</html>`;

  return Buffer.from(html, "utf-8");
}
