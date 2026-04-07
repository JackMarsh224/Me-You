import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/logo_transparent.png";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function OrderSuccess() {
  const [, navigate] = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // payment_intent is passed by Stripe when a 3DS redirect happens
    const paymentIntentId = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");

    if (!paymentIntentId) {
      setError("No payment information found. Please contact support.");
      return;
    }

    if (redirectStatus && redirectStatus !== "succeeded") {
      setError("Payment was not completed. Please try again.");
      return;
    }

    apiRequest("POST", "/api/stripe/complete-payment-intent", { paymentIntentId })
      .then((res) => res.json())
      .then((book) => {
        if (book.error) throw new Error(book.error);
        navigate(`/interview/${book.id}`);
      })
      .catch((err) => {
        setError(err.message || "Something went wrong completing your order. Please contact support.");
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/">
              <img src={logoImage} alt="You & Me" className="h-8 object-contain cursor-pointer dark:invert" />
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-screen">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="font-serif text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/order")} data-testid="button-try-again">
              Try again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="font-medium">Confirming your payment…</p>
        <p className="text-sm text-muted-foreground">Setting up your interview</p>
      </div>
    </div>
  );
}
