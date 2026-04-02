import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Loader2,
  CheckCircle,
  PackageCheck,
} from "lucide-react";
import type { Book, Photo } from "@shared/schema";
import { useState } from "react";
import logoImage from "@assets/logo_transparent.png";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BookPreview() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [downloading, setDownloading] = useState(false);
  const [approveConfirmed, setApproveConfirmed] = useState(false);
  const isPreviewOnly = window.location.pathname.endsWith("/preview");
  const { toast } = useToast();

  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: ["/api/books", id],
  });

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["/api/books", id, "photos"],
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/books/${id}/approve`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.alreadyApproved) {
        setApproveConfirmed(true);
        return;
      }
      setApproveConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/books", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Approval failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
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
      a.download = `${book?.authorName || "you-and-me"}-book.html`;
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
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
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

  if (!["completed", "in_production"].includes(book.status) || !book.generatedContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <img src={logoImage} alt="You & Me" className="h-10 mx-auto object-contain mb-4 dark:invert" />
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
            {isPreviewOnly ? null : book.paid && book.status === "in_production" ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="status-in-production">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  In Production
                </span>
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  variant="outline"
                  data-testid="button-download"
                >
                  {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {downloading ? "Preparing..." : "Download"}
                </Button>
              </div>
            ) : book.paid && book.status === "completed" ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  variant="outline"
                  data-testid="button-download"
                >
                  {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {downloading ? "Preparing..." : "Download"}
                </Button>
                {!approveConfirmed ? (
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    data-testid="button-approve-print"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <PackageCheck className="w-4 h-4 mr-2" />
                    )}
                    {approveMutation.isPending ? "Submitting..." : "Approve for Print"}
                  </Button>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="status-approved">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Approved
                  </span>
                )}
              </div>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {(approveConfirmed || book.status === "in_production") && (
        <div className="border-b bg-green-50 dark:bg-green-950/30 px-4 py-4" data-testid="banner-approved">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Your book has been approved and is now being prepared for production.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div
            className="w-full max-w-sm mx-auto aspect-[3/4] rounded-md flex flex-col items-center justify-center gap-8 p-8 mb-8 bg-foreground"
            data-testid="book-cover"
          >
            <img
              src={logoImage}
              alt="You & Me"
              className="w-64 object-contain invert"
            />
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-background text-center leading-tight">
              {book.authorName}'s Story
            </h2>
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

            const photoMap = new Map(photos.map((p) => [p.id, p]));
            const usedPhotoIds = new Set(
              chapter.content.filter((c) => c.type === "photo").map((c) => c.photoId)
            );
            const remainingCategoryPhotos = photos.filter(
              (p) => p.category === chapter.category && !usedPhotoIds.has(p.id)
            );
            return (
              <section key={i} data-testid={`chapter-${i}`}>
                <div className="mb-8">
                  <p className="text-sm text-muted-foreground font-mono font-bold mb-1">
                    Chapter {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                    {chapter.title}
                  </h3>
                </div>

                <div className="prose prose-lg max-w-none dark:prose-invert font-serif leading-relaxed">
                  {chapter.content.map((item, j) => {
                    if (item.type === "photo") {
                      const photo = photoMap.get(item.photoId!);
                      if (!photo) return null;
                      return (
                        <figure key={`photo-${j}`} className="my-8 space-y-2" data-testid={`photo-${photo.id}`}>
                          <div className="rounded-md overflow-hidden border">
                            <img
                              src={`/api/uploads/${photo.filename}`}
                              alt={photo.caption || photo.originalName}
                              className="w-full object-cover"
                            />
                          </div>
                          <figcaption className="text-xs text-muted-foreground text-center italic">
                            {photo.caption || photo.originalName}
                          </figcaption>
                        </figure>
                      );
                    }
                    if (item.type === "video_qr") {
                      return (
                        <div key={`video-qr-${j}`} className="my-8 flex flex-col items-center gap-3 p-6 rounded-lg border bg-card" data-testid={`video-qr-${item.videoId}`}>
                          <p className="text-sm font-medium text-muted-foreground">Scan to watch</p>
                          <img
                            src={`/api/videos/${item.videoId}/qr`}
                            alt={`QR code for ${item.videoTitle}`}
                            className="w-40 h-40"
                          />
                          <p className="text-sm font-serif italic">{item.videoTitle}</p>
                          <a
                            href={`/video/${item.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline"
                          >
                            Watch video
                          </a>
                        </div>
                      );
                    }
                    return (
                      <p key={j} className="text-foreground/90 mb-4 leading-relaxed">
                        {item.text}
                      </p>
                    );
                  })}
                </div>

                {remainingCategoryPhotos.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {remainingCategoryPhotos.map((photo) => (
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
          <img src={logoImage} alt="You & Me" className="h-8 mx-auto object-contain mb-4 dark:invert" />
          <p className="font-serif text-lg italic text-muted-foreground">
            The End
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            A life story by {book.authorName}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ChapterContent {
  type: "text" | "photo" | "video_qr";
  text?: string;
  photoId?: number;
  videoId?: number;
  videoTitle?: string;
}

interface Chapter {
  title: string;
  category?: string;
  paragraphs: string[];
  content: ChapterContent[];
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
      if (currentChapter && (currentChapter.paragraphs.length > 0 || currentChapter.content.length > 0)) {
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
      currentChapter = { title, category, paragraphs: [], content: [] };
    } else if (currentChapter) {
      const photoRegex = /\[PHOTO:(\d+):([^\]]*)\]/g;
      const videoQrRegex = /\[VIDEO_QR:(\d+):([^\]]*)\]/g;
      if (videoQrRegex.test(trimmed)) {
        videoQrRegex.lastIndex = 0;
        const parts = trimmed.split(/\[VIDEO_QR:\d+:[^\]]*\]/);
        const markers = Array.from(trimmed.matchAll(/\[VIDEO_QR:(\d+):([^\]]*)\]/g));
        parts.forEach((part, idx) => {
          const text = part.trim();
          if (text) {
            currentChapter!.paragraphs.push(text);
            currentChapter!.content.push({ type: "text", text });
          }
          if (idx < markers.length) {
            currentChapter!.content.push({ type: "video_qr", videoId: Number(markers[idx][1]), videoTitle: markers[idx][2] });
          }
        });
      } else if (photoRegex.test(trimmed)) {
        photoRegex.lastIndex = 0;
        const parts = trimmed.split(/\[PHOTO:\d+:[^\]]*\]/);
        const markers = Array.from(trimmed.matchAll(/\[PHOTO:(\d+):([^\]]*)\]/g));
        parts.forEach((part, idx) => {
          const text = part.trim();
          if (text) {
            currentChapter!.paragraphs.push(text);
            currentChapter!.content.push({ type: "text", text });
          }
          if (idx < markers.length) {
            currentChapter!.content.push({ type: "photo", photoId: Number(markers[idx][1]) });
          }
        });
      } else {
        currentChapter.paragraphs.push(trimmed);
        currentChapter.content.push({ type: "text", text: trimmed });
      }
    } else {
      currentChapter = { title: "Prologue", paragraphs: [trimmed], content: [{ type: "text", text: trimmed }] };
    }
  }

  if (currentChapter && (currentChapter.paragraphs.length > 0 || currentChapter.content.length > 0)) {
    chapters.push(currentChapter);
  }

  return chapters;
}
