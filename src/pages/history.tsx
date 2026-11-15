import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  Bone,
  Brain,
  Dumbbell,
  FlaskConical,
  HeartPulse,
  ShieldCheck,
  Siren,
  type LucideIcon,
} from 'lucide-react';

import { home, history } from 'virtual:content';
import Sidebar from '@/components/astrocare/Sidebar';
import StatusBar from '@/components/astrocare/StatusBar';
import CarlitosPanel, { CarlitosBubble, CarlitosLinkChips, UserBubble } from '@/components/astrocare/CarlitosPanel';
import { getReply } from '@/lib/carlitos-brain';
import EmergencyDialog from '@/components/astrocare/EmergencyDialog';
import EmergencyConsole from '@/components/astrocare/EmergencyConsole';
import EmergencyTriage from '@/components/astrocare/EmergencyTriage';
import { statusStyles, type HealthStatus } from '@/components/astrocare/status';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const SITE_URL = 'https://csocghs3xp.preview.c24.airoapp.ai';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  immunity: ShieldCheck,
  laboratory: FlaskConical,
  cardiovascular: HeartPulse,
  bone: Bone,
  muscle: Dumbbell,
  neuro: Brain,
};

const INTENSITY_STYLES: Record<string, string> = {
  Mild: 'border-success/40 bg-success/10 text-success',
  Moderate: 'border-warning/40 bg-warning/10 text-warning',
  Severe: 'border-destructive/40 bg-destructive/10 text-destructive',
};

const KIND_STYLES: Record<string, { dot: string; chip: string }> = {
  exam: { dot: 'bg-primary', chip: 'border-primary/40 bg-primary/10 text-primary' },
  monitoring: { dot: 'bg-info', chip: 'border-info/40 bg-info/10 text-info' },
  event: { dot: 'bg-warning', chip: 'border-warning/40 bg-warning/10 text-warning' },
};

interface ChatMessage {
  author: 'carlitos' | 'user';
  text: string;
  links?: { to: string; label: string }[];
}

export default function HistoryPage() {
  const [chatOpen, setChatOpen] = useState(true);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyView, setEmergencyView] = useState<'triage' | 'comms'>('triage');
  const [sharedSymptoms, setSharedSymptoms] = useState<Set<string>>(
    () => new Set(history.symptoms.map((s) => s.id)),
  );

  const sendToCarlitos = (text: string) => {
    const reply = getReply(text);
    setThread((prev) => [
      ...prev,
      { author: 'user', text },
      { author: 'carlitos', text: reply.text, links: reply.links },
    ]);
  };

  const url = `${SITE_URL}/history`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: `${home.mission.title} — Health history`,
      url,
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
  ];

  return (
    <>
      <Helmet>
        <title>Health history · AstroCare</title>
        <meta
          name="description"
          content="Medical records, symptom log, mission timeline and long-term health trends for the AstroCare astronaut health console."
        />
        <meta property="og:title" content="Health history · AstroCare" />
        <meta
          property="og:description"
          content="Medical records, symptom log, mission timeline and long-term health trends for the AstroCare astronaut health console."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Health history · AstroCare" />
        <meta
          name="twitter:description"
          content="Medical records, symptom log, mission timeline and long-term health trends for the AstroCare astronaut health console."
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <div className="flex h-screen overflow-hidden">
        <Sidebar onEmergency={() => setEmergencyOpen(true)} onToggleChat={() => setChatOpen((o) => !o)} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Page header */}
          <header className="flex items-center gap-4 border-b border-border bg-card/30 px-4 py-3 lg:px-6">
            <div className="min-w-0">
              <h1 className="truncate font-heading text-lg font-semibold text-foreground">
                {history.header.title}
              </h1>
              <p className="truncate text-xs text-muted-foreground">{history.header.subtitle}</p>
            </div>
            <p className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
              {history.header.syncNote}
            </p>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="flex flex-col gap-6">
              {/* Long-term trend charts */}
              <motion.section
                aria-label="Long-term trends"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' as const }}
              >
                <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
                  Long-term trends vs. pre-flight baseline
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {history.trends.map((t) => {
                    const st = statusStyles[t.status as HealthStatus];
                    const n = t.series.length;
                    const min = Math.min(...t.series, t.baseline);
                    const max = Math.max(...t.series, t.baseline);
                    const range = max - min || 1;
                    const y = (v: number) => 38 - ((v - min) / range) * 30;
                    const points = t.series
                      .map((v, i) => `${(i / (n - 1)) * 100},${y(v)}`)
                      .join(' ');
                    return (
                      <article key={t.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-medium text-foreground">{t.label}</h3>
                          <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium', st.chip)}>
                            {t.status === 'normal' ? 'Good' : t.status === 'watch' ? 'Watch' : 'Alert'}
                          </span>
                        </div>
                        <p className="font-heading text-2xl font-semibold text-foreground">
                          <span>{t.value}</span>
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">{t.unit}</span>
                        </p>
                        <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label={`${t.label} trend chart`}>
                          <line x1="0" y1={y(t.baseline)} x2="100" y2={y(t.baseline)} stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity={0.6} />
                          <polyline
                            points={points}
                            fill="none"
                            stroke={st.svg}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                          <circle cx={100} cy={y(t.series[n - 1])} r={2.4} fill={st.svg} />
                        </svg>
                        <div className="flex justify-between font-mono text-[10px] text-muted-foreground" aria-hidden="true">
                          {history.months.map((m) => (
                            <span key={m}>{m}</span>
                          ))}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          <span>{t.note}</span>
                        </p>
                      </article>
                    );
                  })}
                </div>
              </motion.section>

              {/* Medical records by category */}
              <motion.section
                aria-label="Medical records by category"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' as const }}
              >
                <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
                  Medical records by category
                </h2>
                <Accordion type="single" collapsible className="flex flex-col gap-3">
                  {history.categories.map((c, ci) => {
                    const Icon = CATEGORY_ICONS[c.id] ?? HeartPulse;
                    return (
                      <AccordionItem
                        key={c.id}
                        value={`cat-${ci}`}
                        className="rounded-xl border border-border bg-card/40 px-4 last:border-b"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <span className="flex items-center gap-3 text-left">
                            <span className="hud-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-heading text-sm font-semibold text-foreground">{c.name}</span>
                              <span className="block text-[11px] font-normal text-muted-foreground">{c.blurb}</span>
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-background/50">
                            {c.records.map((r) => (
                              <div key={r.title} className="flex flex-col gap-1 px-3 py-2.5">
                                <div className="flex items-baseline justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                                  <p className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                    <span>{r.day} · </span>
                                    <time dateTime={r.date}>{r.date}</time>
                                  </p>
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">{r.detail}</p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </motion.section>

              {/* Symptom log */}
              <motion.section
                aria-label="Symptom log"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12, ease: 'easeOut' as const }}
              >
                <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Symptom log</h2>
                <div className="overflow-hidden rounded-xl border border-border bg-card/40">
                  <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-4 py-2.5 font-mono text-[10px] text-muted-foreground md:grid">
                    <span>Symptom</span>
                    <span>Duration</span>
                    <span>Intensity</span>
                    <span>Location</span>
                  </div>
                  <div className="divide-y divide-border">
                    {history.symptoms.map((s) => (
                      <article key={s.name + s.date} className="grid grid-cols-1 gap-1.5 px-4 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {s.name}
                            <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                              <time dateTime={s.date}>{s.date}</time>
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">{s.note}</p>
                        </div>
                        <p className="font-mono text-xs text-foreground">{s.duration}</p>
                        <p className="md:w-24">
                          <span
                            className={cn(
                              'inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium',
                              INTENSITY_STYLES[s.intensity] ?? 'border-border text-muted-foreground'
                            )}
                          >
                            {s.intensity}
                          </span>
                        </p>
                        <p className="font-mono text-xs text-muted-foreground md:w-24 md:text-right">{s.location}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </motion.section>

              {/* Interactive timeline */}
              <motion.section
                aria-label="Medical timeline"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.16, ease: 'easeOut' as const }}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-base font-semibold text-foreground">Medical timeline</h2>
                  <div role="group" aria-label="Timeline legend" className="flex flex-wrap gap-1.5">
                    {history.timelineFilters.filter((f) => f.id !== 'all').map((f) => (
                      <span
                        key={f.id}
                        className={cn('rounded-full border px-2.5 py-1 text-[11px]', (KIND_STYLES[f.id] ?? KIND_STYLES.monitoring).chip)}
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
                <ol className="relative flex flex-col gap-0 border-l border-border pl-6">
                  {history.timeline.map((e) => {
                    const kind = KIND_STYLES[e.kind] ?? KIND_STYLES.monitoring;
                    return (
                      <li key={e.title} className="relative py-3">
                        <span
                          className={cn(
                            'absolute -left-[1.9rem] top-4 h-3 w-3 rounded-full border-2 border-background',
                            kind.dot
                          )}
                          aria-hidden="true"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[10px] text-muted-foreground">
                            <time dateTime={e.date}>{e.date}</time>
                          </p>
                          <span className={cn('rounded-full border px-2 py-0.5 text-[10px]', kind.chip)}>
                            {history.timelineFilters.find((f) => f.id === e.kind)?.label ?? e.kind}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground">{e.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{e.detail}</p>
                      </li>
                    );
                  })}
                </ol>
              </motion.section>
            </div>
          </main>

          <StatusBar>
            <span className="shrink-0">{history.header.syncNote}</span>
          </StatusBar>
        </div>

        {/* Carlitos panel */}
        <div
          className={cn(
            'z-40 flex min-h-0',
            chatOpen
              ? 'fixed inset-y-0 right-0 w-full max-w-sm border-l border-border shadow-2xl xl:static xl:w-96 xl:max-w-none xl:shadow-none'
              : 'hidden xl:flex xl:w-96'
          )}
        >
          <CarlitosPanel
            className="flex-1"
            onClose={() => setChatOpen(false)}
            onSend={sendToCarlitos}
            header={
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-foreground">{home.carlitos.name}</p>
                <p className="truncate text-xs text-muted-foreground">{home.carlitos.role}</p>
              </div>
            }
            footer={
              <div>
                <div className="flex flex-wrap gap-1.5">
                  {home.carlitos.quickAsks.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendToCarlitos(q)}
                      className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:text-primary"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-2 text-[11px] leading-relaxed text-warning">
                  {home.carlitos.disclaimer}
                </p>
              </div>
            }
          >
            {home.carlitos.messages.map((m, i) =>
              m.author === 'carlitos' ? (
                <CarlitosBubble key={`seed-${i}`}>
                  <span>{m.text}</span>
                </CarlitosBubble>
              ) : (
                <UserBubble key={`seed-${i}`}>
                  <span>{m.text}</span>
                </UserBubble>
              )
            )}
            {thread.map((m, i) =>
              m.author === 'carlitos' ? (
                <CarlitosBubble key={`live-${i}`}>
                  <span>{m.text}</span>
                  {m.links && m.links.length > 0 && <CarlitosLinkChips links={m.links} />}
                </CarlitosBubble>
              ) : (
                <UserBubble key={`live-${i}`}>
                  <span>{m.text}</span>
                </UserBubble>
              )
            )}
          </CarlitosPanel>
        </div>
      </div>

      {/* Emergency interface */}
      <EmergencyDialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Siren className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{home.emergency.title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-4">
          <div role="group" aria-label="Emergency mode" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEmergencyView('triage')}
              aria-pressed={emergencyView === 'triage'}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors duration-150',
                emergencyView === 'triage'
                  ? 'border-destructive/60 bg-destructive/10 text-destructive'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <span>{home.emergency.triage.viewTriage}</span>
            </button>
            <button
              type="button"
              onClick={() => setEmergencyView('comms')}
              aria-pressed={emergencyView === 'comms'}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors duration-150',
                emergencyView === 'comms'
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <span>{home.emergency.triage.viewComms}</span>
            </button>
          </div>
            {emergencyView === 'triage' ? (
              <EmergencyTriage
                protocols={home.emergency.triage.protocols.map((p) => ({
                  id: p.id,
                  tone: p.tone,
                  title: <span>{p.title}</span>,
                  severity: <span>{p.severity}</span>,
                  kit: <span>{p.kit}</span>,
                  steps: p.steps.map((s, i) => (
                    <span key={i}>{s}</span>
                  )),
                }))}
                headlineSlot={<span>{home.emergency.triage.title}</span>}
                subtitleSlot={<span>{home.emergency.triage.subtitle}</span>}
                stepsLabelSlot={<span>{home.emergency.triage.stepsLabel}</span>}
                kitLabelSlot={<span>{home.emergency.triage.kitLabel}</span>}
                burstTitleSlot={<span>{home.emergency.triage.burstTitle}</span>}
                burstStatusSlot={<span>{home.emergency.triage.burstStatus}</span>}
                burstNoteSlot={<span>{home.emergency.triage.burstNote}</span>}
                burstItems={home.emergency.triage.burstItems.map((b) => ({
                  id: b.id,
                  label: <span>{b.label}</span>,
                  value: <span>{b.value}</span>,
                }))}
                commsActionSlot={<span>{home.emergency.triage.commsAction}</span>}
                onOpenComms={() => setEmergencyView('comms')}
              />
            ) : (
              <>
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-xs font-semibold text-foreground">{home.emergency.shareTitle}</p>
            <dl className="mt-2 grid grid-cols-1 gap-1.5 font-mono text-xs">
              {home.emergency.shareItems.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="text-right text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col gap-2">
            {home.emergency.protocols.map((p) => (
              <div key={p.title} className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">{p.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.summary}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-xs font-semibold text-foreground">Recent symptoms to share</p>
            <div role="group" aria-label="Select recent symptoms to include in the transmission" className="mt-2 flex flex-col gap-1.5">
              {history.symptoms.map((s) => {
                const on = sharedSymptoms.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setSharedSymptoms((prev) => {
                        const next = new Set(prev);
                        if (on) next.delete(s.id);
                        else next.add(s.id);
                        return next;
                      })
                    }
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors duration-150',
                      on ? 'border-primary/50 bg-primary/10' : 'border-border bg-card/40'
                    )}
                  >
                    <span className="text-foreground">
                      {s.name}
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                        <time dateTime={s.date}>{s.date}</time>
                      </span>
                    </span>
                    <span className={cn('shrink-0 font-mono text-[10px]', on ? 'text-primary' : 'text-muted-foreground')}>
                      {on ? 'included' : 'excluded'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              <span>
                {sharedSymptoms.size} of {history.symptoms.length} symptoms will be attached to the call
              </span>
            </p>
          </div>
          <EmergencyConsole
            primarySlot={<span>{home.emergency.primaryAction}</span>}
            secondarySlot={<span>{home.emergency.secondaryAction}</span>}
            confirmSlot={<span>{home.emergency.confirmText}</span>}
          />
              </>
            )}
        </div>
      </EmergencyDialog>
    </>
  );
}
