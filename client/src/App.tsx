import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Landing from "@/pages/landing";
import Interview from "@/pages/interview";
import BookPreview from "@/pages/book-preview";
import Order from "@/pages/order";
import Admin from "@/pages/admin";
import StoryLibrary from "@/pages/story-library";
import About from "@/pages/about";
import VideoViewer from "@/pages/video-viewer";
import Login from "@/pages/login";
import Register from "@/pages/register";
import MyLibrary from "@/pages/my-library";
import OrderSuccess from "@/pages/order-success";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/order" component={Order} />
      <Route path="/order/success" component={OrderSuccess} />
      <Route path="/admin" component={Admin} />
      <Route path="/library" component={StoryLibrary} />
      <Route path="/about" component={About} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/my-library" component={MyLibrary} />
      <Route path="/interview/:id" component={Interview} />
      <Route path="/book/:id/preview" component={BookPreview} />
      <Route path="/book/:id" component={BookPreview} />
      <Route path="/video/:id" component={VideoViewer} />
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
