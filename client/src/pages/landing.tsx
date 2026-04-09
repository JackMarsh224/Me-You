import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageCircle, Camera, Package, ArrowRight, BookOpen, User, Library, Check, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import logoImage from "@assets/logo_transparent.png";
import heroBg from "@assets/u6741236396_make_an_artistic_marketing_image_of_legacy_and_st__1772704006312.png";

export default function Landing() {
  const [, navigate] = useLocation();
  const [authorName, setAuthorName] = useState("");
  const [showStart, setShowStart] = useState(false);
  const [nameError, setNameError] = useState(false);

  const { data: user } = useQuery<{ id: number; username: string; isAdmin?: boolean } | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const handleBegin = (name: string) => {
    if (user) {
      navigate(`/order?name=${encodeURIComponent(name)}`);
    } else {
      navigate(`/login?next=/order&name=${encodeURIComponent(name)}`);
    }
  };

  const steps = [
    {
      number: "01",
      title: "Share your story",
      description: "An AI interviewer asks thoughtful questions across seven chapters of your life — at your own pace, in your own words.",
    },
    {
      number: "02",
      title: "We bring it to life",
      description: "The AI listens for how you speak and writes your story in your authentic voice — not generic prose, but unmistakably you.",
    },
    {
      number: "03",
      title: "Hold your story in your hands",
      description: "Your 50+ page memoir arrives beautifully formatted, printed, and shipped directly to your door.",
    },
  ];

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

  const audiences = [
    "People who want to capture their own life story before memories fade",
    "Adult children who want to preserve a parent or grandparent's story",
    "Families creating a lasting legacy gift for future generations",
    "Anyone who has always meant to write a memoir but never started",
  ];

  const testimonials = [
    {
      quote: "I never thought I had anything interesting to say. Three hours later I had a book I'm proud to give my grandchildren.",
      name: "Margaret, 71",
      role: "Retired teacher",
    },
    {
      quote: "We used this to capture my father's stories before his memory began to fade. It's the most important thing we've ever done as a family.",
      name: "David, 48",
      role: "Son and family historian",
    },
    {
      quote: "The AI somehow made it sound exactly like me. My kids said 'that's so you, Dad' on every page.",
      name: "Robert, 64",
      role: "Business owner",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <img
            src={logoImage}
            alt="You & Me"
            className="h-8 object-contain dark:invert"
            data-testid="img-logo"
          />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="button-nav-how-it-works"
            >
              How It Works
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/library")} data-testid="button-nav-library">
              Story Library
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/about")} data-testid="button-nav-about">
              About Us
            </Button>
            {user?.isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} data-testid="button-nav-admin">
                Admin
              </Button>
            )}
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
              Start Telling Your Story
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden min-h-[85vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background dark:to-background" />
        <div className="max-w-4xl mx-auto text-center relative w-full">
          <img
            src={logoImage}
            alt="You & Me — A Life Story, Told"
            className="mx-auto mb-6 h-24 sm:h-32 object-contain invert"
            data-testid="img-hero-logo"
          />
          <h1
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 text-white"
            data-testid="text-hero-title"
          >
            Turn your life into a story
            <br />
            your family will keep forever.
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto mb-3 leading-relaxed font-medium">
            A guided conversation that turns your life into a beautifully written book — in your own voice.
          </p>
          <p className="text-sm text-white/60 max-w-lg mx-auto mb-10">
            For yourself, a parent, or anyone whose story deserves to be told before it's lost.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="text-base px-10 py-6 shadow-lg shadow-black/20"
              onClick={() => setShowStart(true)}
              data-testid="button-start-hero"
            >
              Start Telling Your Story
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 border-white/30 text-white bg-white/10 hover:bg-white/20 dark:border-white/30 dark:text-white"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="button-hero-learn-more"
            >
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* Value bar */}
      <div className="bg-foreground text-background py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            50+ page personalised memoir
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            Written in your authentic voice
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            Printed &amp; shipped to your door
          </span>
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-how-it-works">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              From first question to finished book in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative" data-testid={`card-step-${i}`}>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%_-_16px)] w-8 border-t-2 border-dashed border-border z-10" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground text-background font-mono text-lg font-bold mb-5">
                    {step.number}
                  </div>
                  <h3 className="font-serif font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 mb-10 text-center">
            <p className="font-serif text-xl font-bold mb-5">A lifetime of stories, captured in under an hour.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block" />
                Takes 45–60 minutes
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block" />
                £49.99 for your complete book
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block" />
                Delivered within 5 working days
              </span>
            </div>
          </div>
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setShowStart(true)}
              data-testid="button-start-steps"
            >
              Start Telling Your Story
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* What's Inside */}
      <section className="py-24 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <BookOpen className="w-10 h-10 text-foreground mx-auto mb-5" />
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Seven Chapters. One Complete Life.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              The interview is designed to draw out the stories you didn't know you had — from childhood memories to the wisdom you want to pass on.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: "Early Life & Childhood", desc: "Where your story began — the places, people, and moments that made you" },
              { title: "Family & Relationships", desc: "The bonds that shaped you and the love that defined your life" },
              { title: "What You Built & Why It Mattered", desc: "Your professional journey and what you built along the way" },
              { title: "Core Beliefs & Values", desc: "What you stand for, what you believe, and why" },
              { title: "Life Lessons & Wisdom", desc: "Hard-won insights you'd want the next generation to carry forward" },
              { title: "Hopes for the Future", desc: "Your vision for the world and the people you love" },
              { title: "Legacy & Final Words", desc: "The message you most want remembered long after you're gone" },
            ].map((chapter, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-lg bg-background"
                data-testid={`text-chapter-${i}`}
              >
                <span className="text-xs font-mono text-muted-foreground font-bold shrink-0 mt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-serif font-bold mb-1">{chapter.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{chapter.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Everything Included
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              One interview. One finished book. No writing required.
            </p>
          </div>
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

      {/* Who This Is For */}
      <section className="py-24 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6">
                Who this is for
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                Stories get lost. Every year, memories fade, voices go unrecorded, and the details that make a life remarkable disappear with time.
                This is for anyone who wants to change that.
              </p>
              <ul className="space-y-4">
                {audiences.map((a, i) => (
                  <li key={i} className="flex items-start gap-3" data-testid={`text-audience-${i}`}>
                    <Check className="w-5 h-5 shrink-0 mt-0.5 text-foreground" />
                    <span className="text-muted-foreground leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-5">
              {testimonials.map((t, i) => (
                <Card key={i} className="p-6" data-testid={`card-testimonial-${i}`}>
                  <Quote className="w-6 h-6 text-muted-foreground/40 mb-3" />
                  <p className="font-serif italic text-foreground leading-relaxed mb-4">"{t.quote}"</p>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-3">
            Don't let the story wait.
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Enter your name and the interview begins. The AI takes care of the rest.
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
                    if (authorName.trim()) handleBegin(authorName.trim());
                    else setNameError(true);
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (authorName.trim()) handleBegin(authorName.trim());
                  else setNameError(true);
                }}
                data-testid="button-start-book"
              >
                Start
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {nameError && (
              <p className="text-sm text-destructive">Please enter your name to get started.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">£49.99 — printed &amp; shipped. No subscription.</p>
        </div>
      </section>

      <footer className="border-t py-10 px-4 text-center text-sm text-muted-foreground">
        <img
          src={logoImage}
          alt="You & Me"
          className="h-6 mx-auto object-contain mb-3 dark:invert"
        />
        <p className="mb-1">Your life deserves to be remembered.</p>
        <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} You &amp; Me. All rights reserved.</p>
      </footer>

      {/* Start modal */}
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
              <img
                src={logoImage}
                alt="You & Me"
                className="h-12 mx-auto object-contain mb-3 dark:invert"
              />
              <h3 className="font-serif text-2xl font-bold">Begin Your Book</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your name and your interview starts immediately.
                The whole process takes around 30–60 minutes.
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
                      if (authorName.trim()) handleBegin(authorName.trim());
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
                size="lg"
                onClick={() => {
                  if (authorName.trim()) handleBegin(authorName.trim());
                  else setNameError(true);
                }}
                data-testid="button-start-modal"
              >
                Continue to Order
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                £49.99 — printed &amp; shipped to your door.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
