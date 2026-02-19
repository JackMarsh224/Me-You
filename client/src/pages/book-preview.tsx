import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  Download,
  Feather,
  MessageCircle,
  Loader2,
} from "lucide-react";
import type { Book, Photo } from "@shared/schema";
import { useState } from "react";

export default function BookPreview() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [downloading, setDownloading] = useState(false);

  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: ["/api/books", id],
  });

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["/api/books", id, "photos"],
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/books/${id}/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book?.authorName || "manifesto"}-book.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Feather className="w-8 h-8 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">Book not found</p>
          <Button onClick={() => navigate("/")} data-testid="button-go-home">Go Home</Button>
        </Card>
      </div>
    );
  }

  if (book.status !== "completed" || !book.generatedContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Feather className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold mb-2">Book Not Ready Yet</h2>
          <p className="text-muted-foreground mb-6">
            Complete your interview and generate the book first.
          </p>
          <Button onClick={() => navigate(`/interview/${id}`)} data-testid="button-back-interview">
            <MessageCircle className="w-4 h-4 mr-2" />
            Continue Interview
          </Button>
        </Card>
      </div>
    );
  }

  const chapters = parseBookContent(book.generatedContent);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate(`/interview/${id}`)}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-serif font-bold" data-testid="text-book-title">
                {book.title}
              </h1>
              <p className="text-sm text-muted-foreground">by {book.authorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              data-testid="button-download"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {downloading ? "Preparing..." : "Download PDF"}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div
            className="w-full max-w-sm mx-auto aspect-[3/4] rounded-md flex flex-col items-center justify-center p-8 mb-8"
            style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
            data-testid="book-cover"
          >
            <Feather className="w-10 h-10 text-white/60 mb-6" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white text-center leading-tight">
              {book.title}
            </h2>
            {book.subtitle && (
              <p className="text-white/70 mt-3 text-sm text-center">{book.subtitle}</p>
            )}
            <div className="mt-auto">
              <p className="text-white/80 font-serif text-lg">{book.authorName}</p>
            </div>
          </div>
        </div>

        {book.dedication && (
          <div className="text-center mb-16 py-12 border-t border-b" data-testid="text-dedication">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Dedication</p>
            <p className="font-serif text-lg italic max-w-md mx-auto leading-relaxed">
              {book.dedication}
            </p>
          </div>
        )}

        <div className="space-y-16">
          {chapters.map((chapter, i) => {
            const chapterPhotos = photos.filter(
              (p) => p.category === chapter.category
            );
            return (
              <section key={i} data-testid={`chapter-${i}`}>
                <div className="mb-8">
                  <p className="text-sm text-primary font-mono font-bold mb-1">
                    Chapter {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                    {chapter.title}
                  </h3>
                </div>

                <div className="prose prose-lg max-w-none dark:prose-invert font-serif leading-relaxed">
                  {chapter.paragraphs.map((p, j) => (
                    <p key={j} className="text-foreground/90 mb-4 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>

                {chapterPhotos.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {chapterPhotos.map((photo) => (
                      <figure key={photo.id} className="space-y-2" data-testid={`photo-${photo.id}`}>
                        <div className="rounded-md overflow-hidden border">
                          <img
                            src={`/api/uploads/${photo.filename}`}
                            alt={photo.caption || "Photo"}
                            className="w-full object-cover"
                          />
                        </div>
                        {photo.caption && (
                          <figcaption className="text-xs text-muted-foreground text-center italic">
                            {photo.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-20 text-center py-12 border-t">
          <Feather className="w-6 h-6 text-primary mx-auto mb-4" />
          <p className="font-serif text-lg italic text-muted-foreground">
            The End
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            A personal manifesto by {book.authorName}
          </p>
        </div>
      </div>
    </div>
  );
}

interface Chapter {
  title: string;
  category?: string;
  paragraphs: string[];
}

function parseBookContent(content: string): Chapter[] {
  const chapters: Chapter[] = [];
  const lines = content.split("\n");
  let currentChapter: Chapter | null = null;

  const categoryMap: Record<string, string> = {
    "early life": "early_life",
    "childhood": "early_life",
    "family": "family",
    "relationships": "family",
    "career": "career",
    "achievements": "career",
    "beliefs": "beliefs",
    "values": "beliefs",
    "wisdom": "wisdom",
    "lessons": "wisdom",
    "predictions": "predictions",
    "future": "predictions",
    "legacy": "legacy",
    "final": "legacy",
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
      if (currentChapter && currentChapter.paragraphs.length > 0) {
        chapters.push(currentChapter);
      }
      const title = trimmed.replace(/^#+\s*/, "");
      let category: string | undefined;
      const titleLower = title.toLowerCase();
      for (const [key, val] of Object.entries(categoryMap)) {
        if (titleLower.includes(key)) {
          category = val;
          break;
        }
      }
      currentChapter = { title, category, paragraphs: [] };
    } else if (currentChapter) {
      currentChapter.paragraphs.push(trimmed);
    } else {
      currentChapter = { title: "Prologue", paragraphs: [trimmed] };
    }
  }

  if (currentChapter && currentChapter.paragraphs.length > 0) {
    chapters.push(currentChapter);
  }

  return chapters;
}
