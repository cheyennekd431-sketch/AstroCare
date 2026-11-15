import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { FlaskConical, Siren, SunDim, Wind } from 'lucide-react';

import { home, environment, history } from 'virtual:content';
import Sidebar from '@/components/astrocare/Sidebar';
import StatusBar from '@/components/astrocare/StatusBar';
import CarlitosPanel, { CarlitosBubble, CarlitosLinkChips, UserBubble } from '@/components/astrocare/CarlitosPanel';
import { getReply } from '@/lib/carlitos-brain';
import EmergencyDialog from '@/components/astrocare/EmergencyDialog';
import EmergencyConsole from '@/components/astrocare/EmergencyConsole';
import EmergencyTriage from '@/components/astrocare/EmergencyTriage';
import { statusStyles, type HealthStatus } from '@/components/astrocare/status';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const SITE_URL = 'https://csocghs3xp.preview.c24.airoapp.ai';

interface ChatMessage {
  author: 'carlitos' | 'user';
  text: string;
  links?: { to: string; label: string }[];
}

const SWAB_STATUS = {
  clear: { dot: 'bg-success', chip: 'border-success/40 bg-success/10 text-success' },
  watch: { dot: 'bg-warning', chip: 'border-warning/40 bg-warning/10 text-warning' },
} as const;

const LIGHT_SEGMENT = {
  alert: 'bg-primary/80',
  recovery: 'bg-warning/80',
  dark: 'bg-background border border-border/50',
} as const;

export default function EnvironmentPage() {
  const [chatOpen, setChatOpen] = useState(true);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyView, setEmergencyView] = useState<'triage' | 'comms'>('triage');
  const [selectedPoint, setSelectedPoint] = useState<string | null>('exercise');
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

  const url = `${SITE_URL}/environment`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: `${home.mission.title} — Environment & circadian light`,
      url,
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
  ];

  return (
    <>
      <Helmet>
        <title>Environment & circadian light · AstroCare</title>
        <meta
          name="description"
          content="Cabin air quality, microbial swab checks and the Earth-simulating circadian light schedule that keeps the crew's body clocks on Earth time."
        />
        <meta property="og:title" content="Environment & circadian light · AstroCare" />
        <meta
          property="og:description"
          content="Cabin air quality, microbial swab checks and the circadian lighting schedule for astronauts on long missions."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Environment & circadian light · AstroCare" />
        <meta
          name="twitter:description"
          content="Cabin air quality, microbial swab checks and the circadian lighting schedule for astronauts on long missions."
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
                {environment.header.title}
              </h1>
              <p className="truncate text-xs text-muted-foreground">{environment.header.subtitle}</p>
            </div>
            <p className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
              {environment.header.syncNote}
            </p>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="flex flex-col gap-6">
              {/* Cabin air */}
              <motion.section
                aria-label={environment.air.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' as const }}
              >
                <h2 className="mb-3 font-heading text-base font-semibold text-foreground">{environment.air.title}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {environment.air.sensors.map((s) => {
                    const st = statusStyles[s.status as HealthStatus];
                    const k = s.series.length;
                    const min = Math.min(...s.series);
                    const max = Math.max(...s.series);
                    const range = max - min || 1;
                    const sparkPoints = s.series
                      .map((v, j) => `${(j / (k - 1)) * 100},${26 - ((v - min) / range) * 22}`)
                      .join(' ');
                    return (
                      <article key={s.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="hud-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
                            <Wind className="h-4 w-4 text-primary" aria-hidden="true" />
                          </span>
                          <span className={cn('rounded-full border px-2 py-0.5 text-[10px]', st.chip)}>{s.reference}</span>
                        </div>
                        <p className="font-heading text-sm font-semibold text-foreground">{s.name}</p>
                        <p className={cn('font-mono text-2xl', st.text)}>
                          <span>{s.value}</span>
                        </p>
                        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
                          <polyline
                            points={sparkPoints}
                            fill="none"
                            stroke={st.svg}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                        <p className="text-xs text-muted-foreground">{s.note}</p>
                      </article>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{environment.air.note}</p>
              </motion.section>

              {/* Microbial swab map */}
              <motion.section
                aria-label={environment.swabs.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06, ease: 'easeOut' as const }}
              >
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                      <FlaskConical className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>{environment.swabs.title}</span>
                    </h2>
                    <div className="flex gap-2" role="group" aria-label="Swab result legend">
                      {environment.swabs.legend.map((l) => {
                        const tone = SWAB_STATUS[l.level as keyof typeof SWAB_STATUS] ?? SWAB_STATUS.clear;
                        return (
                          <span key={l.id} className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px]', tone.chip)}>
                            <span className={cn('h-2 w-2 rounded-full', tone.dot)} aria-hidden="true" />
                            <span>{l.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{environment.swabs.subtitle}</p>

                  {/* Schematic station map */}
                  <div className="relative mt-4 aspect-[5/3] overflow-hidden rounded-lg border border-border bg-background/70">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                      <defs>
                        <pattern id="env-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />
                        </pattern>
                      </defs>
                      <rect x="0" y="0" width="100" height="100" fill="url(#env-grid)" />
                      <rect x="8" y="20" width="16" height="18" rx="1.5" fill="none" stroke="hsl(var(--border))" strokeWidth="0.6" />
                      <rect x="8" y="58" width="12" height="20" rx="1.5" fill="none" stroke="hsl(var(--border))" strokeWidth="0.6" />
                      <rect x="24" y="54" width="14" height="16" rx="1.5" fill="none" stroke="hsl(var(--border))" strokeWidth="0.6" />
                      <rect x="46" y="66" width="18" height="14" rx="1.5" fill="none" stroke="hsl(var(--border))" strokeWidth="0.6" />
                      <rect x="60" y="32" width="16" height="14" rx="1.5" fill="none" stroke="hsl(var(--border))" strokeWidth="0.6" />
                      <rect x="76" y="58" width="14" height="14" rx="1.5" fill="none" stroke="hsl(var(--border))" strokeWidth="0.6" />
                    </svg>
                    {environment.swabs.points.map((pt) => {
                      const tone = SWAB_STATUS[pt.result as keyof typeof SWAB_STATUS] ?? SWAB_STATUS.clear;
                      const isSelected = selectedPoint === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setSelectedPoint(pt.id)}
                          aria-pressed={isSelected}
                          title={pt.area}
                          className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                          style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                        >
                          <span
                            className={cn(
                              'h-4 w-4 rounded-full border-2 shadow-lg transition-all duration-150',
                              tone.dot,
                              isSelected ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'group-hover:scale-110',
                            )}
                            aria-hidden="true"
                          />
                          <span className="pointer-events-none absolute top-4 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            {pt.area}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-muted-foreground">{environment.swabs.mapNote}</p>

                  {/* Selected point detail */}
                  {environment.swabs.points.map((pt) => {
                    if (pt.id !== selectedPoint) return null;
                    const tone = SWAB_STATUS[pt.result as keyof typeof SWAB_STATUS] ?? SWAB_STATUS.clear;
                    return (
                      <div key={pt.id} className="mt-3 rounded-lg border border-border bg-background/60 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{pt.area}</p>
                          <span className={cn('rounded-full border px-2 py-0.5 text-[10px]', tone.chip)}>
                            <span>
                              {pt.result === 'clear' ? 'Clear' : 'Watch'}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span>
                              <time dateTime={`day-${pt.lastChecked.replace('Day ', '')}`}>{pt.lastChecked}</time>
                            </span>
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pt.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

              {/* Circadian light schedule */}
              <motion.section
                aria-label={environment.circadian.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12, ease: 'easeOut' as const }}
              >
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                    <SunDim className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{environment.circadian.title}</span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{environment.circadian.subtitle}</p>

                  <div className="mt-4">
                    <div className="flex h-7 overflow-hidden rounded-lg border border-border" role="group" aria-label="24-hour light schedule">
                      {environment.circadian.schedule.map((seg) => (
                        <div
                          key={seg.id}
                          className={cn('h-full', LIGHT_SEGMENT[seg.mode as keyof typeof LIGHT_SEGMENT] ?? LIGHT_SEGMENT.dark)}
                          style={{ width: `${((seg.to - seg.from) / 24) * 100}%` }}
                        />
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground" aria-hidden="true">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>24:00</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {environment.circadian.modes.map((m) => (
                      <article key={m.id} className="flex flex-col gap-1.5 rounded-lg border border-border bg-background/60 p-3">
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="font-mono text-[11px] text-primary">{m.light}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{m.hours}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.detail}</p>
                      </article>
                    ))}
                  </div>
                  <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                    {environment.circadian.sleepSync}
                  </p>
                </div>
              </motion.section>
            </div>
          </main>

          <StatusBar>
            <span className="shrink-0">{environment.header.syncNote}</span>
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

        {/* Emergency interface */}
        <EmergencyDialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{home.emergency.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{home.emergency.intro}</p>
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
      </div>
    </>
  );
}