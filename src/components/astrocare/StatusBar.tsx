import { useEffect, useState, type ReactNode } from 'react';

/** Slim mission status bar shown instead of a traditional footer. */
export default function StatusBar({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const utc = now.toISOString().slice(11, 19);

  return (
    <footer className="flex items-center gap-3 overflow-x-auto border-t border-border bg-card/60 px-4 py-2 font-mono text-xs text-muted-foreground">
      <span className="shrink-0 text-primary">{utc} UTC</span>
      <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
      {children}
      <span className="ml-auto hidden shrink-0 lg:inline">AstroCare · simulated preview data</span>
    </footer>
  );
}
