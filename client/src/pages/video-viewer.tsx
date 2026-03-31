import { Link } from "wouter";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import logoImage from "@assets/logo_transparent.png";

interface VideoMeta {
  id: number;
  bookId: number;
  filename: string;
  originalName: string;
  title: string | null;
  description: string | null;
  category: string | null;
  authorName: string;
}

export default function VideoViewer() {
  const [, params] = useRoute("/video/:id");
  const videoId = params?.id;

  const { data: video, isLoading, error } = useQuery<VideoMeta>({
    queryKey: ["/api/videos", videoId],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${videoId}`);
      if (!res.ok) throw new Error("Video not found");
      return res.json();
    },
    enabled: !!videoId,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <img
              src={logoImage}
              alt="You & Me"
              className="h-8 object-contain cursor-pointer invert dark:invert-0"
              data-testid="img-logo"
            />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div data-testid="video-loading">
              <Skeleton className="w-full aspect-video rounded-md mb-6" />
              <Skeleton className="h-8 w-2/3 mb-3" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : error || !video ? (
            <div className="text-center py-20" data-testid="video-error">
              <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2" data-testid="text-error-title">
                Video Not Found
              </h1>
              <p className="text-muted-foreground">
                This video may have been removed or the link is no longer valid.
              </p>
            </div>
          ) : (
            <div data-testid="video-content">
              <video
                className="w-full rounded-md bg-black mb-8"
                controls
                preload="metadata"
                src={`/api/uploads/${video.filename}`}
                data-testid="video-player"
              />

              <h1
                className="font-serif text-3xl sm:text-4xl font-bold mb-2"
                data-testid="text-video-title"
              >
                {video.title || video.originalName}
              </h1>

              <p className="text-muted-foreground mb-6" data-testid="text-video-author">
                by {video.authorName}
              </p>

              {video.description && (
                <p
                  className="text-foreground/80 leading-relaxed"
                  data-testid="text-video-description"
                >
                  {video.description}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <img
          src={logoImage}
          alt="You & Me"
          className="h-6 mx-auto object-contain mb-2 invert dark:invert-0"
        />
        <p>Your life deserves to be remembered.</p>
      </footer>
    </div>
  );
}
