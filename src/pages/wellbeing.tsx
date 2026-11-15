import { useMemo, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  Activity,
  Clock,
  Flame,
  Headphones,
  Home,
  Moon,
  Smile,
  Siren,
  Users,
  Waves,
  type LucideIcon,
} from 'lucide-react';

import { home, history, wellbeing } from 'virtual:content';
import Sidebar from '@/components/astrocare/Sidebar';
import StatusBar from '@/components/astrocare/StatusBar';
import CarlitosPanel, { CarlitosBubble, CarlitosLinkChips, UserBubble } from '@/components/astrocare/CarlitosPanel';
import { getReply } from '@/lib/carlitos-brain';
import EmergencyDialog from '@/components/astrocare/EmergencyDialog';
import EmergencyConsole from '@/components/astrocare/EmergencyConsole';
import EmergencyTriage from '@/components/astrocare/EmergencyTriage';
import CognitiveTestStage, { type CognitiveResult } from '@/components/astrocare/CognitiveTest';
import { statusStyles, type HealthStatus } from '@/components/astrocare/status';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const SITE_URL = 'https://csocghs3xp.preview.c24.airoapp.ai';

const DIMENSION_ICONS: Record<string, LucideIcon> = {
  loneliness: Users,
  stress: Activity,
  mood: Smile,
  sleep: Moon,
  motivation: Flame,
  confinement: Home,
};

const VR_IMAGES: Record<string, string> = {
  beach: '/airo-assets/images/pages/wellbeing/vr-beach',
  forest: '/airo-assets/images/pages/wellbeing/vr-forest',
  mountain: '/airo-assets/images/pages/wellbeing/vr-mountain',
  personal: '/airo-assets/images/pages/wellbeing/vr-personal',
};

interface ChatMessage {
  author: 'carlitos' | 'user';
  text: string;
  links?: { to: string; label: string }[];
}

export default function WellbeingPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyView, setEmergencyView] = useState<'triage' | 'comms'>('triage');
  const [cogResult, setCogResult] = useState<CognitiveResult | null>(null);
  const [sharedSymptoms, setSharedSymptoms] = useState<Set<string>>(
    () => new Set(history.symptoms.map((s) => s.id)),
  );
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const total = wellbeing.questions.length;

  const result = useMemo(() => {
    if (!submitted) return null;
    const score = Object.values(answers).reduce((sum, s) => sum + s, 0);
    const band = wellbeing.resultBands.find((b) => score >= b.min && score <= b.max) ?? wellbeing.resultBands[0];
    const flags = wellbeing.questions
      .map((q) => ({ id: q.id, name: q.dimension, score: answers[q.id] ?? 0 }))
      .filter((d) => d.score >= 2)
      .map((d) => d.id);
    return { score, band, flags };
  }, [answers, submitted]);

  const sendToCarlitos = (text: string) => {
    const reply = getReply(text);
    setThread((prev) => [
      ...prev,
      { author: 'user', text },
      { author: 'carlitos', text: reply.text, links: reply.links },
    ]);
  };

  const resetCheckIn = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const url = `${SITE_URL}/wellbeing`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: `${home.mission.title} — Psychological well-being`,
      url,
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
  ];

  return (
    <>
      <Helmet>
        <title>Psychological well-being · AstroCare</title>
        <meta
          name="description"
          content="Weekly psychological check-in with support recommendations and the VR relaxation room for astronauts on long missions."
        />
        <meta property="og:title" content="Psychological well-being · AstroCare" />
        <meta
          property="og:description"
          content="Weekly psychological check-in with support recommendations and the VR relaxation room for astronauts on long missions."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Psychological well-being · AstroCare" />
        <meta
          name="twitter:description"
          content="Weekly psychological check-in with support recommendations and the VR relaxation room for astronauts on long missions."
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
                {wellbeing.header.title}
              </h1>
              <p className="truncate text-xs text-muted-foreground">{wellbeing.header.subtitle}</p>
            </div>
            <p className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
              {wellbeing.header.checkinNote}
            </p>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="flex flex-col gap-6">
              {/* Weekly check-in */}
              <motion.section
                aria-label="Weekly check-in"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' as const }}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-heading text-base font-semibold text-foreground">Weekly check-in</h2>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    <span>{wellbeing.header.privacyNote}</span>
                  </p>
                </div>

                {!submitted ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {wellbeing.questions.map((q) => {
                        const Icon = DIMENSION_ICONS[q.id] ?? Smile;
                        return (
                          <fieldset
                            key={q.id}
                            className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4"
                          >
                            <legend className="sr-only">{q.dimension}</legend>
                            <div className="flex items-center gap-2.5">
                              <span className="hud-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                              </span>
                              <span className="text-sm font-semibold text-foreground">{q.dimension}</span>
                            </div>
                            <p className="text-sm font-medium leading-snug text-foreground">{q.question}</p>
                            <div role="group" aria-label={`Options for ${q.dimension}`} className="grid grid-cols-1 gap-1.5">
                              {q.options.map((o) => {
                                const selected = answers[q.id] === o.score;
                                return (
                                  <button
                                    key={o.label}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: o.score }))}
                                    className={cn(
                                      'rounded-lg border px-2.5 py-2 text-xs transition-colors duration-150',
                                      selected
                                        ? 'border-primary/70 bg-primary/15 text-primary'
                                        : 'border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                    )}
                                  >
                                    {o.label}
                                  </button>
                                );
                              })}
                            </div>
                          </fieldset>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        size="lg"
                        disabled={answeredCount < total}
                        onClick={() => setSubmitted(true)}
                        className="min-w-40"
                      >
                        See my summary
                      </Button>
                      <div className="flex flex-1 items-center gap-3">
                        <Progress value={(answeredCount / total) * 100} className="h-2 flex-1" aria-label="Check-in progress" />
                        <p className="shrink-0 font-mono text-xs text-muted-foreground">
                          <span>
                            {answeredCount} of {total} answered
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  result && (
                    <div className="flex flex-col gap-4">
                      {/* Overall result */}
                      <div
                        className={cn(
                          'flex flex-col gap-3 rounded-xl border p-5',
                          result.band.status === 'normal' && 'border-success/50 bg-success/10',
                          result.band.status === 'watch' && 'border-warning/50 bg-warning/10',
                          result.band.status === 'attention' && 'border-destructive/50 bg-destructive/10'
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-heading text-lg font-semibold text-foreground">
                            {result.band.title}
                          </h3>
                          <p className="font-mono text-sm text-foreground">
                            <span>
                              Score {result.score} / {total * 3}
                            </span>
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/90">{result.band.text}</p>
                        <div role="group" aria-label="Dimension summary" className="flex flex-wrap gap-1.5">
                          {wellbeing.questions.map((q) => {
                            const s = answers[q.id] ?? 0;
                            const st: HealthStatus = s >= 3 ? 'alert' : s === 2 ? 'watch' : 'normal';
                            const chip = statusStyles[st].chip;
                            return (
                              <span
                                key={q.id}
                                className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium', chip)}
                              >
                                {q.dimension} · {s}/3
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="flex flex-col gap-3">
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          Recommended support
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {wellbeing.recommendations.map((r) => {
                            const matches =
                              result.flags.includes(r.audience) ||
                              (r.audience === 'attention' && result.band.status === 'attention');
                            return (
                              <article
                                key={r.id}
                                className={cn(
                                  'flex flex-col gap-2 rounded-xl border bg-card/40 p-4',
                                  matches ? 'border-primary/50' : 'border-border opacity-70'
                                )}
                              >
                                {matches && (
                                  <span className="w-fit rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    Suggested for you
                                  </span>
                                )}
                                <p className="font-heading text-sm font-semibold text-foreground">{r.title}</p>
                                <p className="text-xs leading-relaxed text-muted-foreground">{r.text}</p>
                              </article>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={resetCheckIn} className="min-w-40">
                          Retake check-in
                        </Button>
                        <Button
                          variant="outline"
                          className="min-w-40 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                          onClick={() => sendToCarlitos('I just finished my weekly check-in — can we talk about it?')}
                        >
                          Discuss with Carlitos
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </motion.section>

              {/* Objective cognitive & motor mini-tests */}
              <motion.section
                aria-label={wellbeing.miniTest.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06, ease: 'easeOut' as const }}
              >
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h2 className="font-heading text-base font-semibold text-foreground">{wellbeing.miniTest.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{wellbeing.miniTest.subtitle}</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-background/60 p-3">
                        <p className="text-xs leading-relaxed text-muted-foreground">{wellbeing.miniTest.reactionHow}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">{wellbeing.miniTest.traceHow}</p>
                      </div>
                      <CognitiveTestStage
                        onComplete={(result) => {
                          setCogResult(result);
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-4">
                      {cogResult ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                              <p className="font-mono text-xl text-primary">
                                <span>{cogResult.reactionMs}</span>
                                <span aria-hidden="true"> ms</span>
                              </p>
                              <p className="text-[11px] text-muted-foreground">Average reaction</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                              <p className="font-mono text-xl text-primary">
                                <span>{cogResult.accuracy}</span>
                                <span aria-hidden="true">%</span>
                              </p>
                              <p className="text-[11px] text-muted-foreground">Trace accuracy</p>
                            </div>
                          </div>
                          {cogResult.reactionMs <= 330 && cogResult.accuracy >= 85 ? (
                            <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs leading-relaxed text-success">
                              {wellbeing.miniTest.normalText}
                            </p>
                          ) : (
                            <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning">
                              {wellbeing.miniTest.watchText}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          <span>{wellbeing.miniTest.idleHint}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">{wellbeing.miniTest.disclaimer}</p>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* VR relaxation room */}
              <motion.section
                aria-label={wellbeing.vrRoom.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' as const }}
              >
                <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
                  {wellbeing.vrRoom.title}
                </h2>
                <p className="mb-3 text-xs text-muted-foreground">{wellbeing.vrRoom.subtitle}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {wellbeing.vrRoom.environments.map((env) => {
                    const inSession = activeSession === env.id;
                    return (
                      <article
                        key={env.id}
                        className={cn(
                          'flex flex-col overflow-hidden rounded-xl border bg-card/40 transition-colors duration-150',
                          inSession ? 'border-primary/70' : 'border-border'
                        )}
                      >
                        <img
                          src={VR_IMAGES[env.id] ?? VR_IMAGES.beach}
                          alt={env.name}
                          width={640}
                          height={360}
                          loading="lazy"
                          fetchPriority="auto"
                          className="h-36 w-full object-cover"
                        />
                        <div className="flex flex-col gap-1.5 p-4">
                          <p className="font-heading text-sm font-semibold text-foreground">{env.name}</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">{env.description}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              <span>{env.duration}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Waves className="h-3 w-3" aria-hidden="true" />
                              <span>{env.soundscape}</span>
                            </span>
                          </div>
                        </div>
                        <div className="mt-auto border-t border-border p-3">
                          {inSession ? (
                            <div className="flex flex-col gap-2">
                              <p className="flex items-center gap-2 font-mono text-[11px] text-success">
                                <span className="ac-pulse inline-block h-2 w-2 rounded-full bg-success" aria-hidden="true" />
                                <span>Session in progress · {env.duration}</span>
                              </p>
                              <Button size="sm" variant="outline" className="w-full" onClick={() => setActiveSession(null)}>
                                End session
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" className="w-full" onClick={() => setActiveSession(env.id)}>
                              <Headphones className="h-4 w-4" aria-hidden="true" />
                              Start session
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">{wellbeing.vrRoom.note}</p>
              </motion.section>

              <p className="rounded-lg border border-border bg-card/40 px-3 py-2 text-[11px] text-muted-foreground">
                {wellbeing.vrRoom.disclaimer}
              </p>
            </div>
          </main>

          <StatusBar>
            <span className="shrink-0">{wellbeing.header.checkinNote}</span>
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
