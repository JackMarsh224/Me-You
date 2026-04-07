import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, ArrowLeft, Lock, Package, BookOpen, Check, CreditCard } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/logo_transparent.png";

export default function Order() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search] = useState(() => new URLSearchParams(window.location.search));
  const authorName = search.get("name") || "";

  const { data: user, isLoading: userLoading } = useQuery<{ id: number; username: string } | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [form, setForm] = useState({
    email: "",
    deliveryName: authorName,
    address: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
  });

  useEffect(() => {
    if (!userLoading && !user) {
      navigate(`/login?next=/order${authorName ? `&name=${encodeURIComponent(authorName)}` : ""}`);
    }
  }, [user, userLoading]);

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/create-checkout", {
        authorName: form.deliveryName || authorName,
        customerEmail: form.email,
        deliveryName: form.deliveryName,
        deliveryAddress: form.address,
        deliveryCity: form.city,
        deliveryPostcode: form.postcode,
        deliveryCountry: form.country,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data.error || "Could not start checkout", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Order failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required = [form.email, form.deliveryName, form.address, form.city, form.postcode, form.country];
    if (required.some((f) => !f.trim())) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    checkout.mutate();
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {/* Order summary */}
          <div className="mb-8 p-6 rounded-xl border bg-card flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-background" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-0.5">You are ordering</p>
              <h2 className="font-serif text-xl font-bold">
                {authorName ? `${authorName}'s Life Story Book` : "Your Life Story Book"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                AI-guided interview · 50+ page memoir · Printed &amp; shipped to your door
              </p>
            </div>
            <div className="ml-auto text-right shrink-0">
              <p className="font-bold text-2xl">£49.99</p>
              <p className="text-xs text-muted-foreground">inc. delivery</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email address</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={set("email")}
                    required
                    data-testid="input-email"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
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

            {/* Payment info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Secure Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CreditCard className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    You'll be redirected to Stripe's secure checkout to enter your payment details. 
                    We never store your card information.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* What's included */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {[
                "AI-guided interview — 7 life chapters",
                "50+ page personalised memoir written in your voice",
                "Photo integration throughout your story",
                "Professionally printed hardcover book",
                "Delivered to your door",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-base"
              disabled={checkout.isPending}
              data-testid="button-place-order"
            >
              {checkout.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting to payment…</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" />Pay £49.99 Securely</>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By placing your order you agree to our terms of service. You'll complete your payment via Stripe's secure checkout.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
