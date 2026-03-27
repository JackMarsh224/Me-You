import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageCircle, Camera, Package, ArrowRight, BookOpen, User, Library } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import logoImage from "@assets/Screenshot_2025-05-12_at_16.42.36_1771496833828.png";
import heroBg from "@assets/u6741236396_make_an_artistic_marketing_image_of_legacy_and_st__1772704006312.png";

export default function Landing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [authorName, setAuthorName] = useState("");
  const [showStart, setShowStart] = useState(false);
  const [nameError, setNameError] = useState(false);

  const { data: user } = useQuery<{ id: number; username: string } | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const createBook = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/books", { authorName: name });
      return res.json();
    },
    onSuccess: (book) => {
      navigate(`/interview/${book.id}`);
    },
    onError: (err: Error) => {
      toast({
        title: "Something went wrong",
        description: err.message || "Could not start your book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const features = [
    {
      icon: MessageCircle,
      title: "AI-Guided Interview",
      description: "Thoughtful questions about your life, beliefs, and vision — in your own voice.",
    },
    {
      icon: Camera,
      title: "Photo Integration",
      description: "Upload your most meaningful photos and they'll be woven into your book.",
    },
    {
      icon: BookOpen,
      title: "Beautiful Book Design",
      description: "Your words are crafted into a professionally designed, print-ready book.",
    },
    {
      icon: Package,
      title: "Shipped to Your Door",
      description: "Once you're happy with your book, we'll print and ship it straight to you.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <img src={logoImage} alt="You & Me" className="h-8 object-contain mix-blend-multiply dark:mix-blend-screen dark:invert" data-testid="img-logo" />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/library")} data-testid="button-nav-library">
              Story Library
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/about")} data-testid="button-nav-about">
              About Us
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-library")} data-testid="button-nav-my-library">
                <Library className="w-4 h-4 mr-1" />
                My Library
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} data-testid="button-nav-sign-in">
                <User className="w-4 h-4 mr-1" />
                Sign In
              </Button>
            )}
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => setShowStart(true)}
              data-testid="button-start-header"
            >
              Start Your Book
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/85" />
        <div className="max-w-4xl mx-auto text-center relative">
          <img
            src={logoImage}
            alt="You & Me — A Life Story, Told"
            className="mx-auto mb-8 h-40 sm:h-52 md:h-64 object-contain mix-blend-multiply dark:mix-blend-screen dark:invert"
            data-testid="img-hero-logo"
          />
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6" data-testid="text-hero-title">
            Your Life. Your Words.
            <br />
            Your Voice.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            An AI-guided conversation that captures your story exactly the way you tell it.
            Your personality, your expressions, your truth — preserved forever in a beautiful book.
          </p>
          <Button
            size="lg"
            className="text-base px-8"
            onClick={() => setShowStart(true)}
            data-testid="button-start-hero"
          >
            Begin Your Story
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center mb-4" data-testid="text-how-it-works">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            From conversation to a beautiful book, shipped right to your door
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="p-6 text-center hover-elevate" data-testid={`card-feature-${i}`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card">
        <div className="max-w-3xl mx-auto text-center">
          <BookOpen className="w-10 h-10 text-foreground mx-auto mb-6" />
          <h2 className="font-serif text-3xl font-bold mb-4">
            What's Inside Your Book
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Seven chapters covering every dimension of your life
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              { title: "Early Life & Childhood", desc: "Where your story began" },
              { title: "Family & Relationships", desc: "The bonds that shaped you" },
              { title: "Career & Achievements", desc: "Your professional journey" },
              { title: "Core Beliefs & Values", desc: "What you stand for" },
              { title: "Life Lessons & Wisdom", desc: "Hard-won insights" },
              { title: "Predictions & Future", desc: "Your vision for tomorrow" },
              { title: "Legacy & Final Words", desc: "What you want remembered" },
            ].map((chapter, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-md bg-background"
                data-testid={`text-chapter-${i}`}
              >
                <span className="text-sm font-mono text-muted-foreground font-bold shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-serif font-bold">{chapter.title}</p>
                  <p className="text-sm text-muted-foreground">{chapter.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">
            Ready to Begin?
          </h2>
          <p className="text-muted-foreground mb-8">
            Enter your name and start your journey. The AI will guide you through the entire process.
          </p>
          <div className="space-y-2">
            <div className="flex gap-3">
              <Input
                placeholder="Your full name"
                value={authorName}
                onChange={(e) => { setAuthorName(e.target.value); setNameError(false); }}
                className={`flex-1 ${nameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                data-testid="input-author-name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (authorName.trim()) createBook.mutate(authorName.trim());
                    else setNameError(true);
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (authorName.trim()) createBook.mutate(authorName.trim());
                  else setNameError(true);
                }}
                disabled={createBook.isPending}
                data-testid="button-start-book"
              >
                {createBook.isPending ? "Creating..." : "Start"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {nameError && (
              <p className="text-sm text-destructive">Please enter your name to get started.</p>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <img src={logoImage} alt="You & Me" className="h-6 mx-auto object-contain mb-2 mix-blend-multiply dark:mix-blend-screen dark:invert" />
        <p>Your life deserves to be remembered.</p>
      </footer>

      {showStart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowStart(false)}
        >
          <Card
            className="w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <img src={logoImage} alt="You & Me" className="h-12 mx-auto object-contain mb-3 mix-blend-multiply dark:mix-blend-screen dark:invert" />
              <h3 className="font-serif text-2xl font-bold">Begin Your Book</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your name to start the interview process
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <Input
                  placeholder="Your full name"
                  value={authorName}
                  onChange={(e) => { setAuthorName(e.target.value); setNameError(false); }}
                  className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
                  data-testid="input-author-name-modal"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (authorName.trim()) createBook.mutate(authorName.trim());
                      else setNameError(true);
                    }
                  }}
                />
                {nameError && (
                  <p className="text-sm text-destructive">Please enter your name to continue.</p>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (authorName.trim()) createBook.mutate(authorName.trim());
                  else setNameError(true);
                }}
                disabled={createBook.isPending}
                data-testid="button-start-modal"
              >
                {createBook.isPending ? "Creating your book..." : "Start Interview"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
