import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, BookOpen, User } from "lucide-react";
import type { Book } from "@shared/schema";
import logoImage from "@assets/Screenshot_2025-05-12_at_16.42.36_1771496833828.png";

export default function StoryLibrary() {
  const [, navigate] = useLocation();

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/shared-books"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <img src={logoImage} alt="You & Me" className="h-8 object-contain cursor-pointer mix-blend-multiply dark:mix-blend-screen dark:invert" data-testid="img-logo" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/")} data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <BookOpen className="w-10 h-10 text-foreground mx-auto mb-4" />
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4" data-testid="text-library-title">
              Story Library
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Real stories from real people who chose to share their life with the world.
              Every story is unique — just like the person who told it.
            </p>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-6" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : books && books.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <Card
                  key={book.id}
                  className="p-6 hover-elevate cursor-pointer transition-all"
                  onClick={() => navigate(`/book/${book.id}/preview`)}
                  data-testid={`card-shared-book-${book.id}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg leading-tight">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">by {book.authorName}</p>
                    </div>
                  </div>
                  {book.generatedContent && (
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {book.generatedContent.replace(/^#.*\n/gm, "").replace(/\[PHOTO:[^\]]*\]/g, "").trim().slice(0, 200)}...
                    </p>
                  )}
                  <Button variant="ghost" size="sm" className="mt-4 w-full" data-testid={`button-read-book-${book.id}`}>
                    Read Story
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold mb-3" data-testid="text-no-stories">No Stories Yet</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Be the first to share your story with the world. Create your book and choose to make it public for others to enjoy.
              </p>
              <Button onClick={() => navigate("/")} data-testid="button-create-first">
                Create Your Story
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <img src={logoImage} alt="You & Me" className="h-6 mx-auto object-contain mb-2 mix-blend-multiply dark:mix-blend-screen dark:invert" />
        <p>Your life deserves to be remembered.</p>
      </footer>
    </div>
  );
}
