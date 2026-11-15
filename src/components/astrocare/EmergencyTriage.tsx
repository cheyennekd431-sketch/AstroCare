import { useState, type ReactNode } from 'react';
import { ChevronDown, PackageCheck, Radio, Wrench } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface TriageProtocolSlot {
  id: string;
  /** Severity chip tone for styling ('alert' | 'watch' | 'normal'). */
  tone: string;
  title: ReactNode;
  severity: ReactNode;
  kit: ReactNode;
  steps: ReactNode[];
}

export interface BurstItemSlot {
  id: string;
  label: ReactNode;
  value: ReactNode;
}

interface EmergencyTriageProps {
  protocols: TriageProtocolSlot[];
  headlineSlot: ReactNode;
  subtitleSlot: ReactNode;
  stepsLabelSlot: ReactNode;
  kitLabelSlot: ReactNode;
  burstTitleSlot: ReactNode;
  burstStatusSlot: ReactNode;
  burstNoteSlot: ReactNode;
  burstItems: BurstItemSlot[];
  commsActionSlot: ReactNode;
  onOpenComms: () => void;
}

const TONE_CHIP: Record<string, string> = {
  alert: 'border-destructive/40 bg-destructive/10 text-destructive',
  watch: 'border-warning/40 bg-warning/10 text-warning',
  normal: 'border-success/40 bg-success/10 text-success',
};

/**
 * Offline, no-comms medical triage screen shown when the emergency button is
 * pressed: step-by-step protocols, exact med-kit locations and the
 * auto-packaged burst report queued for Earth. All copy arrives as rendered
 * slots from the page so it stays inline-editable; this component owns only
 * selection state and layout.
 */
export default function EmergencyTriage({
  protocols,
  headlineSlot,
  subtitleSlot,
  stepsLabelSlot,
  kitLabelSlot,
  burstTitleSlot,
  burstStatusSlot,
  burstNoteSlot,
  burstItems,
  commsActionSlot,
  onOpenComms,
}: EmergencyTriageProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
        <p className="flex items-center gap-2 font-heading text-sm font-semibold text-destructive">
          <Radio className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{headlineSlot}</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitleSlot}</p>
      </div>

      <div role="group" aria-label="Offline triage protocols" className="flex flex-col gap-2">
        {(protocols).map((p, pi) => {
          const expanded = openId === p.id || (openId === null && pi === 0);
          return (
            <article
              key={p.id}
              className={cn(
                'overflow-hidden rounded-lg border bg-background/60 transition-colors duration-150',
                expanded ? 'border-primary/60' : 'border-border',
              )}
            >
              <button
                type="button"
                onClick={() => setOpenId(expanded ? '' : p.id)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              >
                <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{p.title}</span>
                <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px]', TONE_CHIP[p.tone] ?? TONE_CHIP.normal)}>
                  {p.severity}
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150', expanded && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {expanded && (
                <div className="border-t border-border px-3 py-3">
                  <ol className="flex flex-col gap-2">
                    {p.steps.map((step, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-[10px] text-primary">
                          <span aria-hidden="true">{i + 1}</span>
                        </span>
                        <span className="text-xs leading-relaxed text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-2 text-xs">
                    <Wrench className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">{kitLabelSlot}</span>
                    <span className="text-foreground">{p.kit}</span>
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <PackageCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{burstTitleSlot}</span>
          </p>
          <span className="shrink-0 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] text-success">
            {burstStatusSlot}
          </span>
        </div>
        <dl className="mt-2 grid grid-cols-1 gap-1.5 font-mono text-[11px]">
          {burstItems.map((b) => (
            <div key={b.id} className="flex items-baseline justify-between gap-3 rounded bg-background/60 px-2 py-1.5">
              <dt className="text-muted-foreground">{b.label}</dt>
              <dd className="shrink-0 text-right text-foreground">{b.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{burstNoteSlot}</p>
        <button
          type="button"
          onClick={onOpenComms}
          className="mt-2 flex items-center gap-2 rounded-lg border border-primary/40 px-3 py-2 text-xs font-medium text-primary transition-colors duration-150 hover:bg-primary/10"
        >
          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{commsActionSlot}</span>
        </button>
      </div>
    </div>
  );
}