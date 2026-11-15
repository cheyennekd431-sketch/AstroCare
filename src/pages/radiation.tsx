import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  PersonStanding,
  Radiation,
  Shield,
  Siren,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { home, history, radiation } from 'virtual:content';
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

const SENSOR_ICONS: Record<string, LucideIcon> = {
  'radi-n2': Sparkles,
  'dosim-primary': PersonStanding,
  'dosim-eVA': PersonStanding,
  'detector-particle': Radiation,
};

const TREND_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  rising: { icon: ArrowUpRight, label: 'trending up' },
  falling: { icon: ArrowDownRight, label: 'trending down' },
  stable: { icon: Minus, label: 'stable' },
};

interface ChatMessage {
  author: 'carlitos' | 'user';
  text: string;
  links?: { to: string; label: string }[];
}

export default function RadiationPage() {
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

  const n = radiation.trend.series.length;
  const url = `${SITE_URL}/radiation`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: `${home.mission.title} — Radiation monitoring`,
      url,
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
  ];

  return (
    <>
      <Helmet>
        <title>Radiation monitoring · AstroCare</title>
        <meta
          name="description"
          content="Neutron detectors, personal dosimeters, cumulative dose tracking and solar particle event alerts for the AstroCare astronaut health console."
        />
        <meta property="og:title" content="Radiation monitoring · AstroCare" />
        <meta
          property="og:description"
          content="Neutron detectors, personal dosimeters, cumulative dose tracking and solar particle event alerts for the AstroCare astronaut health console."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Radiation monitoring · AstroCare" />
        <meta
          name="twitter:description"
          content="Neutron detectors, personal dosimeters, cumulative dose tracking and solar particle event alerts for the AstroCare astronaut health console."
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
                {radiation.header.title}
              </h1>
              <p className="truncate text-xs text-muted-foreground">{radiation.header.subtitle}</p>
            </div>
            <p className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
              {radiation.header.syncNote}
            </p>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="flex flex-col gap-6">
              {/* Plain-language intro */}
              <motion.section
                aria-label="What this page means"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' as const }}
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                    <p className="font-heading text-sm font-semibold text-primary">
                      {radiation.explanation.monitoring.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {radiation.explanation.monitoring.text}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                    <p className="font-heading text-sm font-semibold text-primary">
                      {radiation.explanation.bioEffects.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {radiation.explanation.bioEffects.text}
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* Live sensor readings */}
              <motion.section
                aria-label="Live sensor readings"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' as const }}
              >
                <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Live sensors</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {radiation.sensors.map((s) => {
                    const st = statusStyles[s.status as HealthStatus];
                    const Icon = SENSOR_ICONS[s.id] ?? Radiation;
                    const trend = TREND_ICONS[s.trend] ?? TREND_ICONS.stable;
                    const TrendIcon = trend.icon;
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
                            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                          </span>
                          <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]', st.chip)}>
                            <TrendIcon className="h-3 w-3" aria-hidden="true" />
                            {trend.label}
                          </span>
                        </div>
                        <div>
                          <p className="font-heading text-sm font-semibold text-foreground">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.location}</p>
                        </div>
                        <p className={cn('font-mono text-xl', st.text)}>
                          <span>{s.reading}</span>
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
                      </article>
                    );
                  })}
                </div>
              </motion.section>

              {/* Biological & blood biomarkers */}
              <motion.section
                aria-label={radiation.biomarkers.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' as const }}
              >
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h2 className="font-heading text-base font-semibold text-foreground">{radiation.biomarkers.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{radiation.biomarkers.intro}</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {radiation.biomarkers.items.map((b) => {
                      const st = statusStyles[b.status as HealthStatus];
                      const min = Math.min(...b.series);
                      const max = Math.max(...b.series);
                      const range = max - min || 1;
                      const sparkPoints = b.series
                        .map((v, j) => String((j / (b.series.length - 1)) * 100) + ',' + String(26 - ((v - min) / range) * 22))
                        .join(' ');
                      return (
                        <article key={b.id} className="flex flex-col gap-2 rounded-lg border border-border bg-background/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{b.name}</p>
                            <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px]', st.chip)}>
                              <span>{b.status === 'normal' ? 'Normal' : 'Watch'}</span>
                            </span>
                          </div>
                          <p className={cn('font-mono text-xl', st.text)}>
                            <span>{b.value}</span>
                          </p>
                          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-6 w-full" aria-hidden="true">
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
                          <p className="text-[11px] text-muted-foreground">{b.reference}</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">{b.note}</p>
                        </article>
                      );
                    })}
                  </div>
                  <p className="mt-3 font-mono text-[10px] text-muted-foreground">{radiation.biomarkers.footer}</p>
                </div>
              </motion.section>

              {/* Cumulative dose + neutron campaigns */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <motion.section
                  aria-label="Cumulative dose"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.06, ease: 'easeOut' as const }}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-heading text-base font-semibold text-foreground">{radiation.trend.label}</h2>
                    <p className="font-mono text-2xl text-primary">
                      <span>{radiation.trend.value}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{radiation.trend.unit}</span>
                    </p>
                  </div>
                  <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="h-28 w-full" role="img" aria-label="Cumulative dose trend chart">
                    <polyline
                      points={radiation.trend.series.map((v, i) => `${(i / (n - 1)) * 100},${42 - (v / Math.max(...radiation.trend.series)) * 36}`).join(' ')}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={100}
                      cy={42 - (radiation.trend.series[n - 1] / Math.max(...radiation.trend.series)) * 36}
                      r={2.4}
                      fill="hsl(var(--primary))"
                    />
                  </svg>
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground" aria-hidden="true">
                    {radiation.trend.months.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{radiation.trend.note}</p>
                </motion.section>

                <motion.section
                  aria-label="Neutron detection campaigns"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' as const }}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-5"
                >
                  <h2 className="font-heading text-base font-semibold text-foreground">Neutron detection campaigns</h2>
                  <div className="flex flex-col gap-2.5">
                    {radiation.campaigns.map((c) => {
                      const st = statusStyles[c.status as HealthStatus];
                      return (
                        <div key={c.id} className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{c.label}</p>
                            <p className="font-mono text-xs text-foreground">
                              <span>{c.neutrons.toLocaleString('en-US')}</span>
                              <span className="ml-1 text-muted-foreground">neutrons</span>
                            </p>
                          </div>
                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{c.date}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.note}</p>
                          <span className={cn('mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px]', st.chip)}>
                            {c.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.section>
              </div>

              {/* Alerts */}
              <motion.section
                aria-label="Radiation alerts"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.14, ease: 'easeOut' as const }}
              >
                <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Event alerts & notices</h2>
                <div className="flex flex-col gap-3">
                  {radiation.alarms.map((a) => {
                    const st = statusStyles[a.level as HealthStatus];
                    return (
                      <article
                        key={a.id}
                        className={cn('flex items-start gap-3 rounded-xl border p-4', st.chip)}
                      >
                        <Activity className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{a.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{a.text}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </motion.section>

              {/* Shelter spots */}
              <motion.section
                aria-label="Shelter spots"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.18, ease: 'easeOut' as const }}
              >
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="hud-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-heading text-base font-semibold text-foreground">{radiation.shielding.title}</h2>
                      <p className="text-[11px] text-muted-foreground">{radiation.shielding.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {radiation.shielding.comparison.map((c) => (
                      <div key={c.id} className="flex items-baseline justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                        <p className="shrink-0 font-mono text-sm text-foreground">{c.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{radiation.shielding.note}</p>
                </div>
              </motion.section>

              {/* Units glossary */}
              <motion.section
                aria-label="Units glossary"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22, ease: 'easeOut' as const }}
              >
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h2 className="font-heading text-base font-semibold text-foreground">{radiation.explanation.title}</h2>
                  <dl className="mt-3 flex flex-col gap-2">
                    {radiation.explanation.units.map((u) => (
                      <div key={u.id} className="flex flex-col gap-0.5 rounded-lg bg-background/60 px-3 py-2 sm:flex-row sm:items-baseline sm:gap-3">
                        <dt className="shrink-0 font-mono text-xs font-semibold text-primary">{u.label}</dt>
                        <dd className="text-xs text-muted-foreground">{u.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </motion.section>
            </div>
          </main>

          <StatusBar>
            <span className="shrink-0">{radiation.header.syncNote}</span>
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
