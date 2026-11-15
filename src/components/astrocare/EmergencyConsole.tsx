import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Radio } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LOG_LINES = [
  'Opening secure channel to Mission Control…',
  'Uploading crew medical summary…',
  'Streaming live vitals — flight surgeon paged…',
  'Channel open. Speak when ready.',
];

interface EmergencyConsoleProps {
  /** Primary action label, rendered by the page from content. */
  primarySlot: ReactNode;
  /** Secondary action label, rendered by the page from content. */
  secondarySlot: ReactNode;
  /** Confirmation message, rendered by the page from content. */
  confirmSlot: ReactNode;
}

/**
 * Simulated Mission Control connection flow for the emergency dialog.
 * All visible copy that belongs to content arrives as rendered slots; the
 * connection log is interface chrome owned by this component.
 */
export default function EmergencyConsole({ primarySlot, secondarySlot, confirmSlot }: EmergencyConsoleProps) {
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'open'>('idle');
  const [step, setStep] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'connecting') return;
    if (step >= LOG_LINES.length) {
      setPhase('open');
      return;
    }
    timer.current = window.setTimeout(() => setStep((s) => s + 1), 650);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [phase, step]);

  const start = () => {
    if (phase === 'connecting') return;
    setPhase('connecting');
    setStep(0);
  };

  const end = () => {
    setPhase('idle');
    setStep(0);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-11 flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={start}
          disabled={phase === 'connecting'}
        >
          {primarySlot}
        </Button>
        <Button variant="outline" className="h-11 flex-1" onClick={start} disabled={phase === 'connecting'}>
          {secondarySlot}
        </Button>
      </div>

      {phase !== 'idle' && (
        <div className="rounded-lg border border-border bg-background/60 p-3" aria-live="polite">
          <p className="flex items-center gap-2 font-mono text-[11px] text-primary">
            <Radio className={cn('h-3.5 w-3.5', phase === 'connecting' && 'animate-pulse')} aria-hidden="true" />
            <span>{phase === 'connecting' ? 'Connecting to Mission Control…' : 'Secure channel open'}</span>
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {LOG_LINES.map((line, i) => (
              <li
                key={line}
                className={cn(
                  'flex items-center gap-2 font-mono text-[11px] transition-opacity duration-300',
                  i < step
                    ? 'text-muted-foreground'
                    : i === step && phase === 'connecting'
                      ? 'text-foreground'
                      : 'opacity-0',
                )}
              >
                <CheckCircle2 className="h-3 w-3 shrink-0 text-success" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {phase === 'open' && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs leading-relaxed text-success">
            {confirmSlot}
          </p>
          <Button variant="ghost" className="self-start px-2 text-xs text-muted-foreground hover:text-foreground" onClick={end}>
            End simulated session
          </Button>
        </div>
      )}
    </div>
  );
}
