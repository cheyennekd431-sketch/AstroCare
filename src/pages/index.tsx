import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Activity, Bot, Siren } from 'lucide-react';

import { home, history } from 'virtual:content';
import Scanner, { type ScannerLayer } from '@/components/astrocare/Scanner';
import Sidebar from '@/components/astrocare/Sidebar';
import StatusBar from '@/components/astrocare/StatusBar';
import CarlitosPanel, { CarlitosBubble, CarlitosLinkChips, UserBubble } from '@/components/astrocare/CarlitosPanel';
import { getReply } from '@/lib/carlitos-brain';
import EmergencyDialog from '@/components/astrocare/EmergencyDialog';
import EmergencyConsole from '@/components/astrocare/EmergencyConsole';
import EmergencyTriage from '@/components/astrocare/EmergencyTriage';
import { statusStyles, type HealthStatus } from '@/components/astrocare/status';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const SITE_URL = 'https://csocghs3xp.preview.c24.airoapp.ai';

interface ChatMessage {
  author: 'carlitos' | 'user';
  text: string;
  links?: { to: string; label: string }[];
}

const VITAL_SPANS = ['', '', '', '', 'md:col-span-2', 'md:col-span-2'];

export default function HomePage() {
  const [activeLayer, setActiveLayer] = useState<ScannerLayer>('full');
  const [selectedRegion, setSelectedRegion] = useState<string | null>('femur');
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

  const selectRegion = (id: string) => setSelectedRegion(id);

  const selectRegionFromList = (id: string, layer: string) => {
    setActiveLayer(layer as ScannerLayer);
    setSelectedRegion(id);
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'AstroCare',
      url: SITE_URL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      name: 'AstroCare Health Console',
      url: SITE_URL,
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
  ];

  return (
    <>
      <Helmet>
        <title>AstroCare · Astronaut Health Console</title>
        <meta
          name="description"
          content="Interactive health monitoring for astronauts: anatomical scanner, medical history, psychological well-being and radiation tracking."
        />
        <meta property="og:title" content="AstroCare · Astronaut Health Console" />
        <meta
          property="og:description"
          content="Monitor physical and psychological health during space missions — body scanner, vitals, radiation and the Carlitos assistant."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AstroCare · Astronaut Health Console" />
        <meta
          name="twitter:description"
          content="Monitor physical and psychological health during space missions — body scanner, vitals, radiation and the Carlitos assistant."
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <div className="flex h-screen overflow-hidden">
        <Sidebar onEmergency={() => setEmergencyOpen(true)} onToggleChat={() => setChatOpen((o) => !o)} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mission top bar */}
          <header className="flex items-center gap-4 border-b border-border bg-card/30 px-4 py-3 lg:px-6">
            <div className="min-w-0">
              <h1 className="truncate font-heading text-lg font-semibold text-foreground">
                {home.mission.title}
              </h1>
              <p className="truncate text-xs text-muted-foreground">{home.mission.subhead}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 font-mono text-xs lg:gap-3">
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-primary">
                <span aria-hidden="true">{home.mission.dayLabel} </span>
                <span>{home.mission.day}</span>
              </span>
              <span className="hidden text-muted-foreground md:inline">{home.mission.crew}</span>
              <span className="hidden text-muted-foreground lg:inline">{home.mission.astronaut}</span>
            </div>
          </header>

          {/* Main content */}
          <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* Scanner centerpiece */}
              <motion.section
                aria-label={home.scanner.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' as const }}
                className="hud-glow flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-border bg-card/40 md:col-span-2 xl:row-span-2"
              >
                <div className="flex flex-col gap-3 border-b border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-heading text-base font-semibold text-foreground">
                      {home.scanner.title}
                    </h2>
                    <p className="font-mono text-[11px] text-muted-foreground">{home.mission.scanStatus}</p>
                  </div>
                  <div role="group" aria-label="Anatomical layers" className="flex gap-2">
                    {home.scanner.layers.map((l) => {
                      const isActive = activeLayer === l.id;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setActiveLayer(l.id as ScannerLayer)}
                          aria-pressed={isActive}
                          className={cn(
                            'flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                            isActive
                              ? 'border-primary/70 bg-primary/15'
                              : 'border-border bg-background/50 hover:border-primary/40'
                          )}
                        >
                          <span className={cn('block text-sm font-medium', isActive && 'text-primary')}>
                            {l.name}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">{l.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">{home.scanner.hint}</p>
                </div>
                <div className="min-h-0 flex-1">
                  <Scanner activeLayer={activeLayer} selectedRegion={selectedRegion} onSelectRegion={selectRegion} />
                </div>
              </motion.section>

              {/* Region detail panel */}
              <motion.section
                aria-label="Region detail"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' as const }}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card/40 md:col-span-2 xl:col-span-1 xl:row-span-2"
              >
                <div className="flex-1 overflow-y-auto p-4">
                  {home.scanner.regions.map((r) => {
                    const st = statusStyles[r.status as HealthStatus];
                    const visible = selectedRegion === r.id;
                    return (
                      <div key={r.id} className={visible ? 'flex flex-col gap-4' : 'hidden'} aria-hidden={!visible}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-heading text-lg font-semibold text-foreground">{r.name}</h3>
                            <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {r.layer} layer
                            </span>
                          </div>
                          <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium', st.chip)}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
                        <p className="flex items-center gap-2 font-mono text-xs text-primary">
                          <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{r.trend}</span>
                        </p>
                        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-background/50">
                          {r.metrics.map((m) => (
                            <div key={m.label} className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                              <span className="text-xs text-muted-foreground">{m.label}</span>
                              <span className="text-right">
                                <span className="block font-mono text-sm text-foreground">{m.value}</span>
                                <span className={cn('block text-[11px]', st.text)}>{m.delta}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2.5 rounded-lg border border-primary/25 bg-primary/5 p-3">
                          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <p className="text-xs leading-relaxed text-foreground/90">{r.carlitosNote}</p>
                        </div>
                        <Button
                          variant="outline"
                          className="h-10 w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                          onClick={() => sendToCarlitos(`Tell me more about my ${r.name.toLowerCase()}.`)}
                        >
                          Ask Carlitos
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

              {/* Watchlist */}
              <motion.section
                aria-label="Watchlist"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12, ease: 'easeOut' as const }}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4"
              >
                {home.watchlist.map((w) => {
                  const st = statusStyles[w.level as HealthStatus];
                  return (
                    <div key={w.title} className="flex gap-3">
                      <span className={cn('ac-pulse mt-1.5 h-2 w-2 shrink-0 rounded-full', st.dot)} aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{w.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{w.text}</p>
                      </div>
                    </div>
                  );
                })}
              </motion.section>

              {/* Vitals bento cards */}
              {home.vitals.map((v, i) => {
                const st = statusStyles[v.status as HealthStatus];
                const min = Math.min(...v.series);
                const max = Math.max(...v.series);
                const range = max - min || 1;
                const sparkPoints = v.series
                  .map((n, j) => `${(j / (v.series.length - 1)) * 100},${26 - ((n - min) / range) * 22}`)
                  .join(' ');
                return (
                  <motion.article
                    key={v.id}
                    aria-label={v.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.16 + i * 0.05, ease: 'easeOut' as const }}
                    className={cn('flex flex-col gap-2 rounded-xl border border-border bg-card/40 p-4', VITAL_SPANS[i])}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">{v.label}</p>
                      <span className={cn('h-2 w-2 rounded-full', st.dot)} aria-hidden="true" />
                    </div>
                    <p className="font-mono text-2xl font-semibold text-foreground">
                      <span>{v.value}</span>
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">{v.unit}</span>
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
                    <div className="mt-auto flex flex-col gap-1">
                      <p className={cn('font-mono text-[11px]', st.text)}>{v.delta}</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">{v.note}</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </main>

          {/* Status bar */}
          <StatusBar>
            {home.statusbar.sensors.map((s) => (
              <span key={s.name} className="flex shrink-0 items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                <span>{s.name}</span>
                <span className="text-success">{s.state}</span>
              </span>
            ))}
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

      {/* Screen-reader accessible region list (mirrors the scanner dots) */}
      <div className="sr-only">
        {home.scanner.regions.map((r) => (
          <button key={r.id} type="button" onClick={() => selectRegionFromList(r.id, r.layer)}>
            {r.name}
          </button>
        ))}
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
