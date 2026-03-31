import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookOpen, Download, Video, QrCode, LogOut, Play, PenLine } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getQueryFn } from "@/lib/queryClient";
import type { Book, Video as VideoType, User } from "@shared/schema";
import logoImage from "@assets/logo_transparent.png";

export default function MyLibrary() {
  const [, navigate] = useLocation();

  const { data: user, isLoading: userLoading, error: userError } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login");
    }
  }, [userLoading, user, navigate]);

  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/my-books"],
    enabled: !!user,
  });

  const { data: videos, isLoading: videosLoading } = useQuery<VideoType[]>({
    queryKey: ["/api/my-videos"],
    enabled: !!user,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      navigate("/");
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) return null;

  function getStatusBadge(book: Book) {
    if (book.paid) {
      return <Badge variant="default" data-testid={`badge-status-${book.id}`}>Paid</Badge>;
    }
    if (book.status === "completed") {
      return <Badge variant="secondary" data-testid={`badge-status-${book.id}`}>Completed</Badge>;
    }
    return <Badge variant="outline" data-testid={`badge-status-${book.id}`}>Interviewing</Badge>;
  }

  function getBookAction(book: Book) {
    if (book.paid) {
      return (
        <Button
          variant="default"
          size="sm"
          onClick={() => window.open(`/api/books/${book.id}/download`, "_blank")}
          data-testid={`button-download-book-${book.id}`}
        >
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
      );
    }
    if (book.status === "completed") {
      return (
        <Link href={`/book/${book.id}/checkout`}>
          <Button variant="default" size="sm" data-testid={`button-checkout-book-${book.id}`}>
            Complete Purchase
          </Button>
        </Link>
      );
    }
    return (
      <Link href={`/interview/${book.id}`}>
        <Button variant="outline" size="sm" data-testid={`button-continue-interview-${book.id}`}>
          <PenLine className="w-4 h-4 mr-1" />
          Continue Interview
        </Button>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <img
              src={logoImage}
              alt="You & Me"
              className="h-8 object-contain cursor-pointer invert dark:invert-0"
              data-testid="img-logo"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <BookOpen className="w-10 h-10 text-foreground mx-auto mb-4" />
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4" data-testid="text-my-library-title">
              My Library
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Your personal collection of books and videos.
            </p>
          </div>

          <section className="mb-16" data-testid="section-books">
            <h2 className="font-serif text-2xl font-bold mb-6" data-testid="text-books-heading">My Books</h2>

            {booksLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-5 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-8 w-full mt-4" />
                  </Card>
                ))}
              </div>
            ) : books && books.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="p-6" data-testid={`card-book-${book.id}`}>
                    <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                      <h3 className="font-serif font-bold text-lg leading-tight" data-testid={`text-book-title-${book.id}`}>
                        {book.title}
                      </h3>
                      {getStatusBadge(book)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1" data-testid={`text-book-author-${book.id}`}>
                      by {book.authorName}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-4" data-testid={`text-book-date-${book.id}`}>
                      Created {new Date(book.createdAt).toLocaleDateString()}
                    </p>
                    {getBookAction(book)}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-books">You haven't created any books yet.</p>
                <Link href="/">
                  <Button variant="outline" className="mt-4" data-testid="button-create-book">
                    Create Your First Book
                  </Button>
                </Link>
              </div>
            )}
          </section>

          <section data-testid="section-videos">
            <h2 className="font-serif text-2xl font-bold mb-6" data-testid="text-videos-heading">My Videos</h2>

            {videosLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-24 w-full mb-3 rounded-md" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-8 w-full" />
                  </Card>
                ))}
              </div>
            ) : videos && videos.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="p-6" data-testid={`card-video-${video.id}`}>
                    <div className="flex items-center justify-center h-24 bg-muted rounded-md mb-4">
                      <Video className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-serif font-bold text-lg leading-tight mb-1" data-testid={`text-video-title-${video.id}`}>
                      {video.title || video.originalName}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4" data-testid={`text-video-desc-${video.id}`}>
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-auto flex-wrap">
                      <Link href={`/video/${video.id}`}>
                        <Button variant="default" size="sm" data-testid={`button-watch-video-${video.id}`}>
                          <Play className="w-4 h-4 mr-1" />
                          Watch
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`/api/videos/${video.id}/qr`, "_blank")}
                        data-testid={`button-qr-video-${video.id}`}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-videos">No videos yet.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <img src={logoImage} alt="You & Me" className="h-6 mx-auto object-contain mb-2 invert dark:invert-0" />
        <p>Your life deserves to be remembered.</p>
      </footer>
    </div>
  );
}
