import { useStats } from "@/hooks/use-confessions";
import { cn } from "@/lib/utils";

export function Footer() {
  const { data: stats } = useStats();

  const statsText = stats
    ? `${stats.totalConfessions} confessions • ${stats.totalVotes} votes`
    : "Loading the latest weirdness stats...";

  return (
    <footer
      className={cn(
        "border-t-2 border-black bg-white/90 backdrop-blur-sm",
        "px-4 sm:px-6 lg:px-8 py-4"
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
        <div>
          <p className="font-bold tracking-tight">Weirdness Validator</p>
          <p className="font-mono text-xs text-muted-foreground">
            Anonymous confessions. Mild chaos. Zero judgment.
          </p>
        </div>

        <div className="font-mono text-xs text-muted-foreground">
          {statsText}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
          <span>Built with Neon &amp; Vercel</span>
          <a
            href="https://github.com/ZedoMak/weirdness-validator"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
          >
            View source
          </a>
        </div>
      </div>
    </footer>
  );
}

