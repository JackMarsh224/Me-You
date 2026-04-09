import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Loader2, ArrowLeft, Lock, Package, BookOpen, Check, CreditCard, ChevronRight,
} from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/logo_transparent.png";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ── Stripe payment form (mounted inside <Elements>) ─────────────────────────
function PaymentForm({
  onSuccess,
  onBack,
  authorName,
}: {
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
  authorName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: "if_required",
    });
    if (error) {
      toast({
        title: "Payment failed",
        description: error.message || "Please check your card details and try again.",
        variant: "destructive",
      });
      setPaying(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      toast({ title: "Unexpected payment state", description: "Please try again.", variant: "destructive" });
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button
        type="submit"
        size="lg"
        className="w-full text-base mt-2"
        disabled={!stripe || !elements || paying}
        data-testid="button-pay-now"
      >
        {paying ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing payment…</>
        ) : (
          <><Lock className="w-4 h-4 mr-2" />Pay £49.99 — Begin My Story</>
        )}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        disabled={paying}
      >
        ← Edit delivery details
      </button>
    </form>
  );
}

// ── Main Order page ──────────────────────────────────────────────────────────
export default function Order() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search] = useState(() => new URLSearchParams(window.location.search));
  const urlName = search.get("name") || "";

  const { data: user, isLoading: userLoading } = useQuery<{
    id: number; username: string; email?: string | null;
  } | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [form, setForm] = useState({
    authorName: urlName,
    deliveryName: urlName,
    address: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
  });

  // Stripe state
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [step, setStep] = useState<"details" | "payment" | "confirming">("details");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const paymentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate(
        `/login?next=/order${urlName ? `&name=${encodeURIComponent(urlName)}` : ""}`
      );
    }
  }, [user, userLoading]);

  // Load Stripe publishable key
  useEffect(() => {
    apiRequest("GET", "/api/stripe/config")
      .then((r) => r.json())
      .then(({ publishableKey }) => {
        if (publishableKey) setStripePromise(loadStripe(publishableKey));
      })
      .catch(() => {});
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = [
      form.authorName, form.deliveryName,
      form.address, form.city, form.postcode, form.country,
    ];
    if (required.some((f) => !f.trim())) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoadingPayment(true);
    try {
      const res = await apiRequest("POST", "/api/stripe/create-payment-intent", {
        authorName: form.authorName || form.deliveryName,
        deliveryName: form.deliveryName,
        deliveryAddress: form.address,
        deliveryCity: form.city,
        deliveryPostcode: form.postcode,
        deliveryCountry: form.country,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep("payment");
      setTimeout(() => paymentRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      toast({
        title: "Could not load payment",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPayment(false);
    }
  };

  const handlePaymentSuccess = async (piId: string) => {
    setStep("confirming");
    try {
      const res = await apiRequest("POST", "/api/stripe/complete-payment-intent", {
        paymentIntentId: piId,
      });
      const book = await res.json();
      if (book.error) throw new Error(book.error);
      navigate(`/interview/${book.id}`);
    } catch (err: any) {
      toast({
        title: "Order setup failed",
        description: err.message || "Your payment was taken but we couldn't set up your order. Please contact support.",
        variant: "destructive",
      });
      setStep("payment");
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {/* Order summary banner */}
          <div className="mb-6 p-5 rounded-xl border bg-card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">You are ordering</p>
              <h2 className="font-serif text-lg font-bold leading-tight truncate">
                {form.authorName
                  ? `${form.authorName}'s Life Story Book`
                  : "Your Life Story Book"}
              </h2>
              <p className="text-xs text-muted-foreground">
                AI interview · 50+ page memoir · Printed &amp; shipped
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-xl">£49.99</p>
              <p className="text-xs text-muted-foreground">inc. delivery</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <span className={`font-medium ${step === "details" ? "text-foreground" : "text-muted-foreground"}`}>
              1. Your details
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className={`font-medium ${step !== "details" ? "text-foreground" : "text-muted-foreground"}`}>
              2. Payment
            </span>
          </div>

          {/* STEP 1: Details form */}
          {step === "details" && (
            <form onSubmit={handleContinueToPayment} className="space-y-4">
              {/* Book subject name */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Book subject name <span className="text-muted-foreground font-normal">(whose story is this?)</span>
                    </label>
                    <Input
                      placeholder="e.g. Margaret Smith"
                      value={form.authorName}
                      onChange={set("authorName")}
                      required
                      data-testid="input-author-name"
                    />
                  </div>
                  {user?.email && (
                    <p className="text-xs text-muted-foreground">
                      Order confirmation will be sent to <strong>{user.email}</strong>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Delivery address */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" /> Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Full name</label>
                    <Input
                      placeholder="Name on delivery label"
                      value={form.deliveryName}
                      onChange={set("deliveryName")}
                      required
                      data-testid="input-delivery-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Address</label>
                    <Input
                      placeholder="Street address"
                      value={form.address}
                      onChange={set("address")}
                      required
                      data-testid="input-address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">City / Town</label>
                      <Input
                        placeholder="City"
                        value={form.city}
                        onChange={set("city")}
                        required
                        data-testid="input-city"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Postcode</label>
                      <Input
                        placeholder="SW1A 1AA"
                        value={form.postcode}
                        onChange={set("postcode")}
                        required
                        data-testid="input-postcode"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Country</label>
                    <Input
                      placeholder="Country"
                      value={form.country}
                      onChange={set("country")}
                      required
                      data-testid="input-country"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* What's included */}
              <div className="space-y-1.5 text-sm text-muted-foreground pt-1">
                {[
                  "AI-guided interview — 7 life chapters",
                  "50+ page personalised memoir in your voice",
                  "Photos woven throughout your story",
                  "Professionally printed & delivered to your door",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-foreground shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-base"
                disabled={loadingPayment}
                data-testid="button-continue-payment"
              >
                {loadingPayment ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading payment…</>
                ) : (
                  <>Continue to Payment <ChevronRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>
          )}

          {/* STEP 2: Embedded Stripe Payment Element */}
          {(step === "payment" || step === "confirming") && clientSecret && stripePromise && (
            <div ref={paymentRef} className="space-y-4">
              {/* Delivery summary */}
              <Card>
                <CardContent className="pt-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Book for</span>
                    <span className="font-medium">{form.authorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivering to</span>
                    <span className="font-medium text-right">
                      {form.deliveryName}, {form.address}, {form.city} {form.postcode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold">£49.99</span>
                  </div>
                </CardContent>
              </Card>

              {step === "confirming" ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">Setting up your interview…</p>
                  <p className="text-sm text-muted-foreground">Just a moment</p>
                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Card Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: "stripe",
                          variables: {
                            colorPrimary: "#000000",
                            borderRadius: "6px",
                          },
                        },
                      }}
                    >
                      <PaymentForm
                        onSuccess={handlePaymentSuccess}
                        onBack={() => setStep("details")}
                        authorName={form.authorName}
                      />
                    </Elements>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Secured by Stripe — we never see your card details
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
