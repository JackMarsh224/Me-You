import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CreditCard,
  Loader2,
  Package,
  Eye,
} from "lucide-react";
import type { Book, Photo } from "@shared/schema";
import { useState, useEffect } from "react";
import logoImage from "@assets/logo_transparent.png";

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);

  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: ["/api/books", id],
  });

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["/api/books", id, "photos"],
  });

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/books/${id}/pay`);
      queryClient.invalidateQueries({ queryKey: ["/api/books", id] });
      navigate(`/book/${id}`);
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
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
          <img src={logoImage} alt="You & Me" className="h-10 mx-auto object-contain mb-4 dark:invert" />
          <h2 className="font-serif text-xl font-bold mb-2">Book Not Ready Yet</h2>
          <p className="text-muted-foreground mb-6">
            Complete your interview and generate the book first.
          </p>
          <Button onClick={() => navigate(`/interview/${id}`)} data-testid="button-back-interview">
            Continue Interview
          </Button>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (book?.paid) {
      navigate(`/book/${id}`);
    }
  }, [book?.paid, id, navigate]);

  if (book.paid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Redirecting to your book...</p>
        </div>
      </div>
    );
  }

  const wordCount = book.generatedContent.split(/\s+/).length;
  const estimatedPages = Math.max(50, Math.ceil(wordCount / 250));
  const chapterCount = (book.generatedContent.match(/^## /gm) || []).length;

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
            <img src={logoImage} alt="You & Me" className="h-6 object-contain dark:invert" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-3" data-testid="text-checkout-title">
            Your Book Is Ready
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            We've crafted your life story into a beautiful book. Review it below, then order your printed copy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="p-6" data-testid="card-book-summary">
            <div
              className="w-full aspect-[3/4] rounded-md flex flex-col items-center justify-center gap-6 p-6 mb-6 bg-foreground"
              data-testid="book-cover-preview"
            >
              <img
                src={logoImage}
                alt="You & Me"
                className="w-40 object-contain invert"
              />
              <h3 className="font-serif text-xl font-bold text-background text-center leading-tight">
                {book.authorName}'s Story
              </h3>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/book/${id}/preview`)}
              data-testid="button-preview-book"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Your Book
            </Button>
          </Card>

          <div className="space-y-6">
            <Card className="p-6" data-testid="card-book-details">
              <h3 className="font-serif font-bold text-lg mb-4">What's Included</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">{chapterCount} beautifully written chapters</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">~{estimatedPages} pages of your life story</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">Written in your authentic voice</span>
                </div>
                {photos.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm">{photos.length} personal photo{photos.length !== 1 ? "s" : ""} included</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">Professional print quality</span>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">Shipped directly to your door</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-primary/20" data-testid="card-payment">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg">Order Your Book</h3>
                <div className="text-right">
                  <p className="text-2xl font-bold">$49.99</p>
                  <p className="text-xs text-muted-foreground">includes shipping</p>
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={processing}
                data-testid="button-pay"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Secure payment powered by Stripe (coming soon)
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
