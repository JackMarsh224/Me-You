import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/logo_transparent.png";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function OrderSuccess() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("No session ID found. Please contact support.");
      return;
    }

    apiRequest("POST", "/api/stripe/complete-order", { sessionId })
      .then((res) => res.json())
      .then((book) => {
        if (book.error) {
          setStatus("error");
          setErrorMsg(book.error);
        } else {
          navigate(`/interview/${book.id}`);
        }
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Something went wrong completing your order.");
      });
  }, []);

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
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Confirming your payment…</h1>
              <p className="text-muted-foreground">Please wait while we set up your interview.</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Payment successful!</h1>
              <p className="text-muted-foreground">Redirecting you to your interview…</p>
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-muted-foreground mb-6">{errorMsg}</p>
              <Button onClick={() => navigate("/order")} data-testid="button-try-again">
                Try again
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
