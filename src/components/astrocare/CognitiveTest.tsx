import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, MoveRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface CognitiveResult {
  /** Average reaction time across the tap rounds, in milliseconds. */
  reactionMs: number;
  /** Percentage of trace samples kept inside the channel, 0–100. */
  accuracy: number;
}

type Phase = 'idle' | 'tap' | 'trace' | 'done';

const TAP_ROUNDS = 5;
const TRACE_W = 400;
const TRACE_H = 180;
const CHANNEL_HALF = 16;
/** Centerline of the trace channel — a fixed sine wave the pointer must follow. */
const centerY = (x: number) => 90 + 34 * Math.sin((x / TRACE_W) * Math.PI * 2.2 - 1.2);

const CENTER_POINTS = Array.from({ length: 41 }, (_, i) => {
  const x = (i / 40) * TRACE_W;
  return `${x},${centerY(x).toFixed(1)}`;
}).join(' ');

const TOP_POINTS = Array.from({ length: 41 }, (_, i) => {
  const x = (i / 40) * TRACE_W;
  return `${x},${(centerY(x) - CHANNEL_HALF).toFixed(1)}`;
}).join(' ');

const BOTTOM_POINTS = Array.from({ length: 41 }, (_, i) => {
  const x = (i / 40) * TRACE_W;
  return `${x},${(centerY(x) + CHANNEL_HALF).toFixed(1)}`;
}).join(' ');

/**
 * Interactive stage for the objective 2-minute cognitive & motor check:
 * a 5-round reaction-time tap test followed by a fine-motor line trace.
 * All instruction copy is rendered by the page from content; this component
 * owns only the interactive mechanics and its runtime readouts.
 */
export default function CognitiveTestStage({ onComplete }: { onComplete: (result: CognitiveResult) => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [accNow, setAccNow] = useState<number | null>(null);

  const shownAt = useRef(0);
  const times = useRef<number[]>([]);
  const timer = useRef<number | null>(null);
  const tracing = useRef(false);
  const samples = useRef({ total: 0, inside: 0 });
  const furthestX = useRef(0);
  const doneRef = useRef(false);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const scheduleTarget = useCallback((nextRound: number) => {
    setTarget(null);
    clearTimer();
    timer.current = window.setTimeout(
      () => {
        setTarget({
          x: 14 + Math.random() * 72,
          y: 14 + Math.random() * 66,
        });
        shownAt.current = performance.now();
      },
      800 + Math.random() * 1400,
    );
    setRound(nextRound);
  }, []);

  const startTap = () => {
    times.current = [];
    setLastMs(null);
    setPhase('tap');
    scheduleTarget(1);
  };

  const hitTarget = () => {
    if (!target) return;
    const ms = Math.round(performance.now() - shownAt.current);
    times.current.push(ms);
    setLastMs(ms);
    setTarget(null);
    if (times.current.length >= TAP_ROUNDS) {
      clearTimer();
      setPhase('trace');
    } else {
      scheduleTarget(times.current.length + 1);
    }
  };

  const startTrace = () => {
    samples.current = { total: 0, inside: 0 };
    furthestX.current = 0;
    setTrail([]);
    setAccNow(null);
    tracing.current = false;
  };

  const readPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * TRACE_W;
    const y = ((e.clientY - rect.top) / rect.height) * TRACE_H;
    return { x, y };
  };

  const onTraceMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (phase !== 'trace' || doneRef.current) return;
    if (!tracing.current) {
      if (e.buttons !== 1) return;
      tracing.current = true;
      startTrace();
    }
    const { x, y } = readPointer(e);
    const cy = centerY(x);
    const inside = Math.abs(y - cy) <= CHANNEL_HALF;
    samples.current.total += 1;
    if (inside) samples.current.inside += 1;
    furthestX.current = Math.max(furthestX.current, x);
    setTrail((prev) => [...prev.slice(-90), { x, y }]);
    setAccNow(Math.round((samples.current.inside / samples.current.total) * 100));
    if (furthestX.current >= TRACE_W - 12) {
      doneRef.current = true;
      const accuracy =
        samples.current.total > 0 ? Math.round((samples.current.inside / samples.current.total) * 100) : 0;
      const avg =
        times.current.length > 0
          ? Math.round(times.current.reduce((a, b) => a + b, 0) / times.current.length)
          : 0;
      setPhase('done');
      onComplete({ reactionMs: avg, accuracy });
    }
  };

  const endTrace = () => {
    tracing.current = false;
  };

  const reset = () => {
    clearTimer();
    doneRef.current = false;
    times.current = [];
    samples.current = { total: 0, inside: 0 };
    furthestX.current = 0;
    setPhase('idle');
    setTarget(null);
    setTrail([]);
    setLastMs(null);
    setAccNow(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {phase === 'idle' && (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background/60 p-6">
          <Crosshair className="h-6 w-6 text-primary" aria-hidden="true" />
          <button
            type="button"
            onClick={startTap}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
          >
            Start the check
          </button>
        </div>
      )}

      {phase === 'tap' && (
        <div className="flex min-h-40 flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>
              Round <span>{round}</span>
              <span aria-hidden="true"> / {TAP_ROUNDS}</span>
            </span>
            <span>
              {lastMs !== null && (
                <>
                  <span>Last: </span>
                  <span>{lastMs}</span>
                  <span aria-hidden="true"> ms</span>
                </>
              )}
            </span>
          </div>
          <div
            role="group"
            aria-label="Reaction-time tap test stage"
            className="relative h-40 overflow-hidden rounded-lg border border-border bg-background/60"
          >
            {target ? (
              <button
                type="button"
                onClick={hitTarget}
                aria-label="Tap target"
                className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg transition-transform duration-75 hover:scale-105"
                style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <Crosshair className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </button>
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="animate-pulse font-mono text-xs text-muted-foreground">Hold steady…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'trace' && (
        <div className="flex min-h-40 flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MoveRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Press and drag across the channel</span>
            </span>
            <span>
              {accNow !== null && (
                <>
                  <span>Accuracy: </span>
                  <span>{accNow}</span>
                  <span aria-hidden="true">%</span>
                </>
              )}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${TRACE_W} ${TRACE_H}`}
            className="h-40 w-full touch-none rounded-lg border border-border bg-background/60"
            role="group"
            aria-label="Fine-motor line trace stage"
            onPointerMove={onTraceMove}
            onPointerUp={endTrace}
            onPointerLeave={endTrace}
          >
            <polyline points={TOP_POINTS} fill="none" stroke="hsl(var(--border))" strokeWidth={2} />
            <polyline points={BOTTOM_POINTS} fill="none" stroke="hsl(var(--border))" strokeWidth={2} />
            <polyline
              points={CENTER_POINTS}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeDasharray="4 6"
              opacity={0.5}
            />
            <polyline
              points={trail.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background/60 p-6">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="font-mono text-2xl text-primary">
                <span>{Math.round(times.current.reduce((a, b) => a + b, 0) / TAP_ROUNDS)}</span>
                <span aria-hidden="true"> ms</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Average reaction</p>
            </div>
            <div>
              <p className="font-mono text-2xl text-primary">
                <span>{accNow ?? 0}</span>
                <span aria-hidden="true">%</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Trace accuracy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className={cn('rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary transition-colors duration-150 hover:bg-primary/10')}
          >
            Run again
          </button>
        </div>
      )}
    </div>
  );
}