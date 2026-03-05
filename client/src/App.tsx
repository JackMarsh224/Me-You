import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Landing from "@/pages/landing";
import Interview from "@/pages/interview";
import BookPreview from "@/pages/book-preview";
import Checkout from "@/pages/checkout";
import StoryLibrary from "@/pages/story-library";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/library" component={StoryLibrary} />
      <Route path="/about" component={About} />
      <Route path="/interview/:id" component={Interview} />
      <Route path="/book/:id/checkout" component={Checkout} />
      <Route path="/book/:id/preview" component={BookPreview} />
      <Route path="/book/:id" component={BookPreview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
