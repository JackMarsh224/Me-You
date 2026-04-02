import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, BookOpen, Package, Clock, CheckCircle, ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getQueryFn } from "@/lib/queryClient";
import logoImage from "@assets/logo_transparent.png";
import type { Book } from "@shared/schema";
import { useState } from "react";

type StatusFilter = "all" | "interviewing" | "completed" | "in_production";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: any }> = {
  interviewing: { label: "In Interview", variant: "secondary", icon: Clock },
  completed: { label: "Awaiting Approval", variant: "outline", icon: BookOpen },
  in_production: { label: "In Production", variant: "default", icon: Package },
};

export default function Admin() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: user, isLoading: userLoading } = useQuery<{ id: number; username: string; isAdmin: boolean } | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Book[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user?.isAdmin,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-serif text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">This area is for administrators only.</p>
          <Button onClick={() => navigate("/")} data-testid="button-go-home">Go Home</Button>
        </Card>
      </div>
    );
  }

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.authorName.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: orders.length,
    interviewing: orders.filter((o) => o.status === "interviewing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    in_production: orders.filter((o) => o.status === "in_production").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/">
            <img src={logoImage} alt="You & Me" className="h-8 object-contain cursor-pointer dark:invert" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Admin Dashboard</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-1">Orders</h1>
            <p className="text-muted-foreground text-sm">Track and manage all book orders</p>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(["all", "interviewing", "completed", "in_production"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  statusFilter === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground"
                }`}
                data-testid={`filter-${s}`}
              >
                {s === "all" ? "All Orders" : statusConfig[s]?.label ?? s}{" "}
                <span className="opacity-60">({counts[s]})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or order #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((order) => {
                const cfg = statusConfig[order.status] || { label: order.status, variant: "outline" as const, icon: Clock };
                const StatusIcon = cfg.icon;
                return (
                  <Card key={order.id} className="hover:border-foreground/30 transition-colors" data-testid={`order-card-${order.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs text-muted-foreground font-mono">#{order.id}</span>
                            <Badge variant={cfg.variant} className="text-xs flex items-center gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </Badge>
                            {order.paid && (
                              <Badge variant="outline" className="text-xs text-green-700 border-green-300 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" /> Paid
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-serif font-bold text-lg leading-tight" data-testid={`text-name-${order.id}`}>
                            {order.authorName}
                          </h3>
                          {order.customerEmail && (
                            <p className="text-sm text-muted-foreground" data-testid={`text-email-${order.id}`}>
                              {order.customerEmail}
                            </p>
                          )}
                        </div>

                        {/* Delivery */}
                        {order.deliveryAddress && (
                          <div className="text-sm text-muted-foreground min-w-0">
                            <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-1">Delivery</p>
                            <p>{order.deliveryName}</p>
                            <p>{order.deliveryAddress}</p>
                            <p>{order.deliveryCity}, {order.deliveryPostcode}</p>
                            <p>{order.deliveryCountry}</p>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="text-xs text-muted-foreground shrink-0 space-y-1">
                          <p>Ordered: {new Date(order.createdAt).toLocaleDateString("en-GB")}</p>
                          {order.approvedAt && (
                            <p className="text-green-600 dark:text-green-400 font-medium">
                              Approved: {new Date(order.approvedAt).toLocaleDateString("en-GB")}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          {order.status !== "interviewing" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/book/${order.id}`)}
                              data-testid={`button-view-${order.id}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              View Book
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
