import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  Camera,
  BookOpen,
  ArrowLeft,
  Baby,
  Heart,
  Briefcase,
  Compass,
  Lightbulb,
  Telescope,
  Loader2,
  X,
  Image as ImageIcon,
  Feather,
} from "lucide-react";
import type { Book, InterviewMessage, Photo, InterviewCategory } from "@shared/schema";
import { INTERVIEW_CATEGORIES } from "@shared/schema";
import logoImage from "@assets/Screenshot_2025-05-12_at_16.42.36_1771496833828.png";

const categoryIcons: Record<string, any> = {
  early_life: Baby,
  family: Heart,
  career: Briefcase,
  beliefs: Compass,
  wisdom: Lightbulb,
  predictions: Telescope,
  legacy: Feather,
};

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: ["/api/books", id],
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<InterviewMessage[]>({
    queryKey: ["/api/books", id, "messages"],
  });

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["/api/books", id, "photos"],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

  const currentCategoryIndex = INTERVIEW_CATEGORIES.findIndex(
    (c) => c.id === book?.currentCategory
  );
  const progress = book?.status === "completed"
    ? 100
    : ((currentCategoryIndex + 1) / INTERVIEW_CATEGORIES.length) * 100;

  const sendMessage = async () => {
    if (!message.trim() || isStreaming) return;
    const content = message.trim();
    setMessage("");
    setIsStreaming(true);
    setStreamedContent("");

    queryClient.setQueryData<InterviewMessage[]>(
      ["/api/books", id, "messages"],
      (old = []) => [
        ...old,
        {
          id: Date.now(),
          bookId: Number(id),
          role: "user",
          content,
          category: book?.currentCategory || null,
          createdAt: new Date(),
        },
      ]
    );

    try {
      const res = await fetch(`/api/books/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.content) {
              fullResponse += event.content;
              setStreamedContent(fullResponse);
            }
            if (event.done) {
              queryClient.invalidateQueries({ queryKey: ["/api/books", id, "messages"] });
              queryClient.invalidateQueries({ queryKey: ["/api/books", id] });
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
    }
  };

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("category", book?.currentCategory || "");
      const res = await fetch(`/api/books/${id}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", id, "photos"] });
      setShowPhotoUpload(false);
    },
  });

  const generateBook = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/books/${id}/generate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", id] });
      navigate(`/book/${id}`);
    },
  });

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your interview...</p>
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

  const currentCategory = INTERVIEW_CATEGORIES.find((c) => c.id === book.currentCategory);
  const CurrentIcon = currentCategory ? categoryIcons[currentCategory.id] : Feather;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md shrink-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate("/")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="font-serif font-bold text-lg" data-testid="text-book-title">
                  {book.authorName}'s Story
                </h1>
                {currentCategory && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CurrentIcon className="w-3.5 h-3.5" />
                    <span>{currentCategory.label}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowPhotoUpload(true)}
                data-testid="button-upload-photo"
              >
                <Camera className="w-4 h-4" />
              </Button>
              {book.status === "interviewing" && messages.length > 5 && (
                <Button
                  variant="outline"
                  onClick={() => generateBook.mutate()}
                  disabled={generateBook.isPending}
                  data-testid="button-generate-book"
                >
                  {generateBook.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-1" />
                  )}
                  Generate Book
                </Button>
              )}
              {book.status === "completed" && (
                <Button
                  onClick={() => navigate(`/book/${id}`)}
                  data-testid="button-view-book"
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  View Book
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1 h-1.5" data-testid="progress-interview" />
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </header>

      <div className="hidden sm:block border-b bg-card/50 shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-2 flex gap-1 overflow-x-auto">
          {INTERVIEW_CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat.id];
            const catIndex = INTERVIEW_CATEGORIES.indexOf(cat);
            const isActive = cat.id === book.currentCategory;
            const isDone = catIndex < currentCategoryIndex;
            return (
              <Badge
                key={cat.id}
                variant={isActive ? "default" : isDone ? "secondary" : "outline"}
                className="shrink-0 gap-1"
                data-testid={`badge-category-${cat.id}`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden md:inline">{cat.label}</span>
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {msgsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className="h-16 w-3/4 rounded-md" />
              </div>
            ))
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.role}-${msg.id}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-md px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <img src={logoImage} alt="" className="h-3.5 object-contain" />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isStreaming && streamedContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[75%] rounded-md px-4 py-3 bg-card border">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <img src={logoImage} alt="" className="h-3.5 object-contain" />
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamedContent}</p>
              </div>
            </div>
          )}

          {isStreaming && !streamedContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[75%] rounded-md px-4 py-3 bg-card border">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {photos.length > 0 && (
        <div className="border-t bg-card/50 shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
            <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="w-10 h-10 rounded-md overflow-hidden shrink-0 border"
                data-testid={`photo-thumb-${photo.id}`}
              >
                <img
                  src={`/api/uploads/${photo.filename}`}
                  alt={photo.caption || "Photo"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <span className="text-xs text-muted-foreground shrink-0">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} attached
            </span>
          </div>
        </div>
      )}

      <div className="border-t bg-background shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 resize-none min-h-[44px] max-h-32"
              rows={1}
              data-testid="input-message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!message.trim() || isStreaming}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {showPhotoUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowPhotoUpload(false)}
        >
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-serif font-bold text-lg">Upload Photos</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowPhotoUpload(false)}
                data-testid="button-close-upload"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Add photos that are meaningful to this chapter of your life. They'll be woven into your book.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto.mutate(file);
              }}
              data-testid="input-file-upload"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              data-testid="button-choose-photo"
            >
              {uploadPhoto.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {uploadPhoto.isPending ? "Uploading..." : "Choose Photo"}
            </Button>
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-md overflow-hidden border"
                  >
                    <img
                      src={`/api/uploads/${photo.filename}`}
                      alt={photo.caption || "Photo"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
