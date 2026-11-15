import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Bot, SendHorizonal, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CarlitosPanelProps {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  onSend: (text: string) => void;
  onClose?: () => void;
  className?: string;
}

interface CarlitosLinkChip {
  to: string;
  label: string;
}

/** Navigation chips Carlitos can attach to a reply, for cross-section guidance. */
export function CarlitosLinkChips({ links }: { links: CarlitosLinkChip[] }) {
  return (
    <div role="group" aria-label="Suggested destinations" className="mt-2 flex flex-wrap gap-1.5">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors duration-150 hover:bg-primary/20"
        >
          {l.label}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

/** Chat-bubble for Carlitos' replies. Rendered content is passed as children. */
export function CarlitosBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-primary/10">
        <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  );
}

/** Chat-bubble for the astronaut's own messages. Rendered content is passed as children. */
export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-primary/40 bg-primary/15 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  );
}

/** Persistent docked chat panel for the Carlitos assistant. */
export default function CarlitosPanel({ header, children, footer, onSend, onClose, className }: CarlitosPanelProps) {
  const [draft, setDraft] = useState('');

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <aside
      aria-label="Carlitos assistant"
      className={cn('flex min-h-0 flex-col border-l border-border bg-card/50 backdrop-blur', className)}
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="hud-glow flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 bg-primary/10">
          <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">{header}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Carlitos panel"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">{children}</div>
      </div>

      <div className="border-t border-border p-3">
        {footer}
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            type="text"
            aria-label="Message Carlitos"
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background/80 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
          >
            <SendHorizonal className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </aside>
  );
}
