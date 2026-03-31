import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Heart, BookOpen, Users, Sparkles } from "lucide-react";
import logoImage from "@assets/logo_transparent.png";
import heroBg from "@assets/u6741236396_make_an_artistic_marketing_image_of_legacy_and_st__1772704006312.png";

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <img src={logoImage} alt="You & Me" className="h-8 object-contain cursor-pointer invert dark:invert-0" data-testid="img-logo" />
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

      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-background/85 dark:bg-background/90" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-6" data-testid="text-about-title">
            About You & Me
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We believe every person has a story worth telling — and worth preserving.
          </p>
        </div>
      </section>

      <main className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-primary shrink-0" />
              <h2 className="font-serif text-2xl font-bold" data-testid="text-why-title">Why We Started</h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                It started with a simple realization: the people we love most in this world won't be here forever. And when they're gone, what remains? A few photos, maybe some letters, fragments of memories that fade a little more with each passing year.
              </p>
              <p>
                We wanted something more. We wanted a way to sit down with someone — a parent, a grandparent, a friend — and truly hear their story. Not just the highlights, but the quiet moments, the hard-won wisdom, the way they laugh when they tell a certain story, the phrases only they use.
              </p>
              <p>
                That's why we built You & Me. It's a conversation that becomes a book. An AI that listens carefully, asks the right questions, and then writes your story in your voice — not in some generic, polished way, but exactly the way you would tell it yourself.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-primary shrink-0" />
              <h2 className="font-serif text-2xl font-bold" data-testid="text-believe-title">What We Believe</h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We believe that everyone is the author of an extraordinary life. Not because everyone climbs mountains or wins awards — but because every person carries within them a universe of experiences, relationships, beliefs, and dreams that no one else has ever lived.
              </p>
              <p>
                We believe your voice matters. The way you speak, the words you choose, the rhythm of your storytelling — these are as much a part of your legacy as the stories themselves. That's why our AI doesn't rewrite you. It captures you.
              </p>
              <p>
                And we believe that a physical book — something you can hold, flip through, and pass down — is still the most powerful way to preserve a life story. Digital files get lost. Books endure.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-primary shrink-0" />
              <h2 className="font-serif text-2xl font-bold" data-testid="text-who-title">Who It's For</h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                You & Me is for anyone who wants to capture a life story. Maybe you want to interview your mother about her childhood before those memories slip away. Maybe you want to record your own journey for your children and grandchildren. Maybe you just want to reflect on the life you've lived and hold it in your hands.
              </p>
              <p>
                It's for the storyteller and the listener. For the person who has always wanted to write a book but never knew where to start. For the family that wants to preserve their history. For anyone who believes that their story — or someone else's — deserves to be told.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-primary shrink-0" />
              <h2 className="font-serif text-2xl font-bold" data-testid="text-how-title">How It Works</h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The process is simple. You start a conversation with our AI interviewer. It asks thoughtful, open-ended questions across seven areas of your life — from childhood memories to your hopes for the future. You answer however you want: long or short, serious or funny, in whatever way feels natural.
              </p>
              <p>
                Along the way, you can upload photos that capture key moments. When the interview is complete, the AI takes everything you've shared and writes a beautiful, multi-chapter book in your authentic voice. You review it, place your order, and a printed copy arrives at your door.
              </p>
              <p>
                No writing experience needed. No templates to fill out. Just a real conversation and a real book at the end of it.
              </p>
            </div>
          </section>

          <section className="text-center pt-8 pb-4">
            <h2 className="font-serif text-2xl font-bold mb-4" data-testid="text-cta-title">
              Ready to tell your story?
            </h2>
            <p className="text-muted-foreground mb-8">
              Every great book starts with a single conversation.
            </p>
            <Button size="lg" className="text-base px-8" onClick={() => navigate("/")} data-testid="button-start-story">
              Begin Your Story
            </Button>
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
