import type { Path } from '@/routes';
import { home, history, wellbeing, radiation, environment } from 'virtual:content';

export interface CarlitosLink {
  to: Path;
  label: string;
}

export interface CarlitosReply {
  text: string;
  links?: CarlitosLink[];
}

const SECTION_LINKS: CarlitosLink[] = [
  { to: '/', label: 'Scanner' },
  { to: '/history', label: 'Health history' },
  { to: '/wellbeing', label: 'Well-being' },
  { to: '/radiation', label: 'Radiation' },
  { to: '/environment', label: 'Environment' },
];

const scanLink: CarlitosLink = { to: '/', label: 'Open Scanner' };
const historyLink: CarlitosLink = { to: '/history', label: 'Open Health history' };
const wellbeingLink: CarlitosLink = { to: '/wellbeing', label: 'Open Well-being' };
const radiationLink: CarlitosLink = { to: '/radiation', label: 'Open Radiation' };
const environmentLink: CarlitosLink = { to: '/environment', label: 'Open Environment' };

/** Lowercase, strip accents and punctuation so "días", "dias" and "DIAS" all match. */
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const region = (id: string) => home.scanner.regions.find((r) => r.id === id);
const vital = (id: string) => home.vitals.find((v) => v.id === id);
const trend = (id: string) => history.trends.find((t) => t.id === id);
const category = (id: string) => history.categories.find((c) => c.id === id);
const recommendation = (audience: string) => wellbeing.recommendations.find((r) => r.audience === audience);

/** Compose a reply from a scanner region's own content: summary, key reading and Carlitos' note. */
const regionReply = (id: string, links: CarlitosLink[]): CarlitosReply | null => {
  const r = region(id);
  if (!r) return null;
  const first = r.metrics[0];
  const reading = first ? ` Key reading: ${first.value} — ${first.label.toLowerCase()}, ${first.delta.toLowerCase()}.` : '';
  return { text: `${r.summary}${reading} ${r.carlitosNote}`, links };
};

interface Knowledge {
  /** Label shown when suggesting "closest topics" in the fallback. */
  topic: string;
  /** Multi-word or distinctive phrases — strong signal (weight 3). */
  phrases: string[];
  /** Single supporting words (weight 1, plural-tolerant). */
  words: string[];
  /** Extra weight for guard entries that must win over topic matches. */
  boost?: number;
  /** Casual entries (greetings, thanks) lose ties and never beat topic answers. */
  soft?: boolean;
  get: () => CarlitosReply;
}

const ENTRIES: Knowledge[] = [
  // ── Guards: these must win whenever they match ──────────────────────────
  {
    topic: 'Diagnosis & prescriptions',
    boost: 8,
    phrases: [
      'diagnos', 'prescri', 'what do i have', 'which illness', 'do i have', 'medication', 'medicine',
      'pill', 'antibiot', 'treatment for', 'cure', 'disease', 'illness', 'receta', 'medicamento',
      'tratamiento', 'enfermedad', 'cura', 'que tengo', 'diagnostico',
    ],
    words: ['diagnosis', 'prescription', 'medication', 'medicine', 'pills', 'antibiotics', 'treatment', 'cure', 'disease', 'illness'],
    get: () => ({
      text: 'That one is above my pay grade — I explain data, I never diagnose or prescribe. The flight surgeon is the one who makes those calls, and booking a private session is completely routine and confidential.',
      links: [wellbeingLink],
    }),
  },
  {
    topic: 'Emergency',
    boost: 8,
    phrases: [
      'emergency', 'mission control', 'urgent', 'help me now', 'injur', 'bleeding', 'chest pain',
      'cannot breathe', "can't breathe", 'severe pain', 'worst pain', 'emergencia', 'urgente',
      'socorro', 'sangrado', 'herida', 'auxilio', 'no puedo respirar',
    ],
    words: ['emergency', 'urgent', 'bleeding', 'injury', 'sos', 'suffocating'],
    get: () => ({
      text: 'If this is urgent, use the red Emergency button in the sidebar — it opens a direct line to Mission Control with your medical summary and live vitals attached. I can stay with you in the meantime.',
    }),
  },
  {
    topic: 'Pain & symptoms',
    phrases: ['pain', 'hurts', 'aching', 'dolor', 'me duele', 'soreness', 'discomfort'],
    words: ['pain', 'hurts', 'sore', 'aching', 'soreness'],
    get: () => ({
      text: 'Log it in the symptom table under Health history — date, duration and intensity. Mild aches that ease after exercise are common up here; anything sharp, worsening or unusual goes straight to the red Emergency button.',
      links: [historyLink],
    }),
  },

  // ── Greetings & assistant ────────────────────────────────────────────────
  {
    topic: 'Greeting',
    phrases: ['hello', 'hi carlitos', 'hey carlitos', 'good morning', 'good evening', 'good afternoon', 'hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'howdy'],
    words: ['hello', 'hey', 'hi', 'hola'],
    soft: true,
    get: () => ({
      text: `Hello, Commander. Mission day ${home.mission.day} is looking good — ${home.mission.scanStatus.toLowerCase()}. Ask me about any reading, region or section, or pick a topic below.`,
      links: SECTION_LINKS,
    }),
  },
  {
    topic: 'Thanks',
    phrases: ['thank you', 'thanks', 'gracias', 'muchas gracias', 'appreciate it'],
    words: ['thanks', 'gracias'],
    soft: true,
    get: () => ({ text: 'Anytime, Commander. I am here around the clock — ask me anything else, or use the chips below to jump to a section.' }),
  },
  {
    topic: 'What Carlitos can do',
    phrases: ['who are you', 'what can you do', 'what are you', 'what do you do', 'help me navigate', 'ayuda', 'quien eres', 'que puedes hacer'],
    words: ['carlitos'],
    soft: true,
    get: () => ({
      text: 'I am your onboard health guide. I can read out any of your numbers with a plain-language explanation, walk you through any section, translate medical jargon, and flag when something should go to the flight surgeon. Try asking "how is my femur", "what is my radiation dose" or "why do my legs feel weaker".',
      links: SECTION_LINKS,
    }),
  },

  // ── Mission overview ─────────────────────────────────────────────────────
  {
    topic: 'Mission status',
    phrases: ['mission day', 'day 148', 'which day', 'how long have we been', 'mission status', 'la mision', 'dia de mision', 'crew status'],
    words: ['mission', 'crew'],
    get: () => ({
      text: `Mission day ${home.mission.day} — ${home.mission.astronaut} aboard the ${home.mission.crew}. ${home.mission.scanStatus}. All four monitoring sections are synced and up to date.`,
      links: SECTION_LINKS,
    }),
  },
  {
    topic: 'Anatomical scanner',
    phrases: ['scanner', 'body map', 'body scan', 'how do i use the scanner', 'layers', 'escaner', 'capas'],
    words: ['scanner', 'layers'],
    get: () => ({
      text: 'The scanner shows your body in three layers — full body, muscular and skeletal — with color-coded status per region. Select a layer, then tap any glowing region to open its detail panel with metrics, trend and a plain-language explanation.',
      links: [scanLink],
    }),
  },

  // ── Scanner regions (data-driven) ───────────────────────────────────────
  {
    topic: 'Femur',
    phrases: ['femur', 'femoral', 'thigh bone', 'check my femur', 'muslo', 'femur izquierdo'],
    words: ['femur', 'femoral', 'thigh'],
    get: () => regionReply('femur', [scanLink, historyLink]) ?? { text: 'Open the Skeletal layer in the scanner and tap the left thigh to see your femur readings.', links: [scanLink] },
  },
  {
    topic: 'Bone density',
    phrases: ['bone density', 'bone loss', 'dexa', 'osteopor', 'calcium loss', 'densidad osea', 'densidad', 'huesos', 'hueso'],
    words: ['bone', 'bones', 'density', 'dexa', 'calcium', 'osteoporosis'],
    get: () => {
      const v = vital('bone-density');
      const t = trend('bone');
      return {
        text: `In plain terms: without gravity loading, bones slowly give up calcium — about 1% per month without countermeasures. Yours reads ${v?.value} ${v?.unit} (${v?.delta.toLowerCase()}). ${t?.note ?? ''} Daily resistance exercise is what keeps that loss slow, and the DEXA scans measure how well it is working.`,
        links: [scanLink, historyLink],
      };
    },
  },
  {
    topic: 'Muscle mass',
    phrases: ['muscle mass', 'lean mass', 'muscle loss', 'atroph', 'masa muscular', 'musculos', 'muscle'],
    words: ['muscle', 'muscles', 'strength', 'atrophy'],
    get: () => {
      const t = trend('muscle');
      return {
        text: `Lean mass is ${t?.value} ${t?.unit} (${trend('muscle')?.baseline ?? 56} kg at pre-flight). ${t?.note ?? ''} Muscles get "lazy" without gravity loading — the daily ARED resistance sessions are the antidote, and the plan was tuned on day 145 to help the quadriceps catch up.`,
        links: [scanLink, historyLink],
      };
    },
  },
  {
    topic: 'Quadriceps & leg strength',
    phrases: ['legs feel weaker', 'why do my legs', 'quadriceps', 'quads', 'knee extension', 'cuadriceps', 'piernas'],
    words: ['quadriceps', 'quads', 'legs', 'leg'],
    get: () => regionReply('quadriceps', [scanLink]) ?? { text: 'The quadriceps panel in the Muscular layer has your current numbers.', links: [scanLink] },
  },
  {
    topic: 'Calves',
    phrases: ['calves', 'calf', 'gemelos', 'pantorrilla'],
    words: ['calves', 'calf'],
    get: () => regionReply('calves', [scanLink]) ?? { text: 'The calves panel in the Muscular layer has your current numbers.', links: [scanLink] },
  },
  {
    topic: 'Heart & cardiovascular',
    phrases: ['heart rate', 'resting heart', 'heartbeat', 'cardiac', 'corazon', 'ritmo cardiaco', 'cardiovascular'],
    words: ['heart', 'cardiac', 'pulse'],
    get: () => {
      const v = vital('heart-rate');
      return {
        text: `Resting heart rate is ${v?.value} ${v?.unit} (${v?.delta.toLowerCase()}) and blood pressure holds at ${vital('blood-pressure')?.value}. In microgravity the heart slowly remodels because it no longer pumps against gravity — ${v?.note.toLowerCase() ?? ''} Today's echo showed normal rhythm and 58% ejection fraction.`,
        links: [scanLink, historyLink],
      };
    },
  },
  {
    topic: 'Blood pressure',
    phrases: ['blood pressure', 'presion arterial', 'tension arterial', 'tension'],
    words: ['pressure', 'bp'],
    get: () => {
      const v = vital('blood-pressure');
      return { text: `Blood pressure is ${v?.value} ${v?.unit} — ${v?.delta.toLowerCase()} across the mission. ${v?.note ?? ''}`, links: [scanLink] };
    },
  },
  {
    topic: 'Body mass & hydration',
    phrases: ['body mass', 'my weight', 'hydration', 'hydrated', 'abdomen', 'digestion', 'peso', 'hidratacion'],
    words: ['weight', 'hydration', 'abdomen', 'digestion'],
    get: () => regionReply('abdomen', [scanLink]) ?? { text: 'The abdomen & core panel in the Full body layer covers mass and hydration.', links: [scanLink] },
  },
  {
    topic: 'Headaches & head pressure',
    phrases: ['headache', 'head pressure', 'intracranial', 'dolor de cabeza', 'cabeza'],
    words: ['headache', 'headaches', 'brain'],
    get: () => regionReply('brain', [scanLink, historyLink]) ?? { text: 'The brain & head panel in the Full body layer covers intracranial pressure and headaches.', links: [scanLink] },
  },
  {
    topic: 'Eyes & vision (SANS)',
    phrases: ['sans', 'vision', 'blurry', 'eye strain', 'visual acuity', 'ojos', 'vista', 'neuro-ocular'],
    words: ['vision', 'eyes', 'eye', 'blurry'],
    get: () => regionReply('eyes', [scanLink, historyLink]) ?? { text: 'The eyes & vision panel in the Full body layer covers your SANS monitoring.', links: [scanLink] },
  },
  {
    topic: 'Lumbar spine & back',
    phrases: ['lumbar', 'spine', 'back stiffness', 'lower back', 'espalda', 'columna', 'intervertebral'],
    words: ['lumbar', 'spine', 'discs', 'disc'],
    get: () => regionReply('lumbar', [scanLink]) ?? { text: 'The lumbar spine panel in the Skeletal layer covers disc hydration and stiffness.', links: [scanLink] },
  },

  // ── Health history (data-driven) ────────────────────────────────────────
  {
    topic: 'Health history overview',
    phrases: ['health history', 'medical records', 'my records', 'historial', 'expediente', 'historia clinica'],
    words: ['history', 'records', 'historial'],
    get: () => ({
      text: 'Your health history keeps every record and symptom log for the mission, with four trend charts compared against your pre-flight baseline and a timeline from launch to today.',
      links: [historyLink],
    }),
  },
  {
    topic: 'Symptom log',
    phrases: ['symptom log', 'my symptoms', 'logged symptoms', 'log a symptom', 'sintomas', 'sintoma'],
    words: ['symptoms', 'symptom'],
    get: () => {
      const latest = history.symptoms
        .slice(0, 3)
        .map((s) => `${s.name.toLowerCase()} — ${s.intensity.toLowerCase()}, ${s.date}`)
        .join('; ');
      return {
        text: `Your most recent entries: ${latest}. Anything new goes in the same table — the medical team reviews it with every sync.`,
        links: [historyLink],
      };
    },
  },
  {
    topic: 'Sleep quality',
    phrases: ['sleep', 'insomnia', 'circadian', 'sueno', 'dormir', 'rest quality', 'tired'],
    words: ['sleep', 'tired', 'fatigue', 'insomnia'],
    get: () => {
      const t = trend('sleep');
      return {
        text: `You are averaging ${t?.value} ${t?.unit} against a ${t?.baseline} pre-flight baseline. ${t?.note ?? ''} Up here you see 16 sunrises a day, so the station keeps its own clock — the light schedule adjustment is already helping.`,
        links: [historyLink, wellbeingLink],
      };
    },
  },
  {
    topic: 'Immunity',
    phrases: ['immune', 'immunity', 'immune system', 'inmunidad', 'defensas', 'vaccination', 'vacuna', 'virus screening'],
    words: ['immune', 'immunity', 'virus', 't-cell'],
    get: () => {
      const c = category('immunity');
      const recs = c?.records.map((r) => `${r.title.toLowerCase()} (${r.day.toLowerCase()}): ${r.detail.toLowerCase()}`).join(' ') ?? '';
      return { text: `Immunity records: ${recs}`, links: [historyLink] };
    },
  },
  {
    topic: 'Laboratory results',
    phrases: ['lab', 'labs', 'laboratory', 'blood draw', 'urinalysis', 'blood test', 'analisis', 'sangre', 'orina'],
    words: ['lab', 'labs', 'blood', 'urine', 'urinalysis'],
    get: () => {
      const c = category('laboratory');
      const recs = c?.records.map((r) => `${r.title.toLowerCase()} (${r.day.toLowerCase()}): ${r.detail.toLowerCase()}`).join(' ') ?? '';
      return { text: `Latest laboratory work: ${recs}`, links: [historyLink] };
    },
  },
  {
    topic: 'VO2 max & aerobic capacity',
    phrases: ['vo2', 'aerobic capacity', 'aerobic fitness', 'aerobico', 'ejection fraction'],
    words: ['vo2', 'echo', 'aerobic'],
    get: () => {
      const c = category('cardiovascular');
      const recs = c?.records.map((r) => `${r.title} (${r.day}): ${r.detail}`).join(' ') ?? '';
      return { text: `Cardiovascular records: ${recs}`, links: [historyLink] };
    },
  },
  {
    topic: 'Cognition',
    phrases: ['cognitive', 'cognition', 'reaction time', 'spatial memory', 'memory test', 'cognitivo', 'memoria'],
    words: ['cognitive', 'cognition', 'memory'],
    get: () => {
      const c = category('neuro');
      const rec = c?.records.find((r) => r.id === 'neuro-cognition');
      return { text: rec ? `${rec.title} (${rec.day}): ${rec.detail} Sharp work, Commander.` : 'The neurological category in Health history holds your cognition results.', links: [historyLink] };
    },
  },
  {
    topic: 'Medical timeline',
    phrases: ['timeline', 'mission timeline', 'linea de tiempo', 'cronologia'],
    words: ['timeline'],
    get: () => ({
      text: `The medical timeline runs from your pre-flight baseline (${history.timeline[0]?.date}) through launch, the first in-flight scan, Radi-N2 going online and today — ${history.timeline[history.timeline.length - 1]?.detail.toLowerCase() ?? 'up to date'}.`,
      links: [historyLink],
    }),
  },

  // ── Well-being (data-driven) ────────────────────────────────────────────
  {
    topic: 'Well-being check-in',
    phrases: ['check-in', 'check in', 'weekly questionnaire', 'well-being', 'wellbeing', 'bienestar', 'psychological', 'mental health', 'psicologico', 'salud mental'],
    words: ['mood', 'stress', 'loneliness', 'confinement', 'motivation', 'wellbeing'],
    get: () => ({
      text: `The weekly check-in asks six quick questions — ${wellbeing.questions.map((q) => q.dimension.toLowerCase()).join(', ')} — and builds a personal summary with recommendations. It takes two minutes, and your answers stay private between you and the flight surgeon.`,
      links: [wellbeingLink],
    }),
  },
  {
    topic: 'Loneliness',
    phrases: ['lonely', 'loneliness', 'miss my family', 'connect with home', 'soledad', 'familia', 'isolated', 'aislado'],
    words: ['loneliness', 'isolated'],
    get: () => {
      const r = recommendation('loneliness');
      return { text: r ? `${r.title} — ${r.text}` : 'Schedule protected comms time with home; it is the strongest loneliness countermeasure.', links: [wellbeingLink] };
    },
  },
  {
    topic: 'Stress relief',
    phrases: ['stressed', 'stressed out', 'too much stress', 'breathing', 'estres', 'estresado', 'relax', 'relajarme', 'calm down'],
    words: ['stress', 'relax', 'breathing'],
    get: () => {
      const r = recommendation('stress');
      return {
        text: r ? `${r.title} — ${r.text}` : 'Two guided breathing sessions a day pair well with the VR room.',
        links: [wellbeingLink],
      };
    },
  },
  {
    topic: 'Confinement & crew time',
    phrases: ['confinement', 'claustrophob', 'crew dinner', 'social time', 'confinamiento', 'encierro', 'cabin fever'],
    words: ['confinement', 'claustrophobia'],
    get: () => {
      const r = recommendation('confinement');
      return { text: r ? `${r.title} — ${r.text}` : 'Shared meals and one joint exercise block are the strongest buffers in a confined mission.', links: [wellbeingLink] };
    },
  },
  {
    topic: 'Motivation',
    phrases: ['motivation', 'unmotivated', 'no energy', 'motivacion', 'cant focus', "can't focus"],
    words: ['motivation', 'motivated'],
    get: () => {
      const r = recommendation('motivation');
      return { text: r ? `For mood and motivation: ${r.title} — ${r.text}` : 'One low-effort treadmill walk after dinner reliably lifts mood within days.', links: [wellbeingLink] };
    },
  },
  {
    topic: 'VR relaxation room',
    phrases: ['vr', 'virtual reality', 'relaxation room', 'headset', 'sala de relajacion', 'realidad virtual'],
    words: ['vr', 'beach', 'forest', 'mountain'],
    get: () => ({
      text: `The VR room has four environments: ${wellbeing.vrRoom.environments.map((e) => `${e.name} (${e.duration})`).join(', ')}. Each one streams with its own soundscape — a good pair for the breathing protocol.`,
      links: [wellbeingLink],
    }),
  },
  {
    topic: 'Privacy of check-in answers',
    phrases: ['privacy', 'private', 'confidential', 'who sees my', 'privacidad', 'confidencial'],
    words: ['privacy', 'confidential'],
    get: () => ({ text: wellbeing.header.privacyNote, links: [wellbeingLink] }),
  },

  // ── Radiation (data-driven) ─────────────────────────────────────────────
  {
    topic: 'Radiation overview',
    phrases: ['radiation', 'my dose', 'exposure', 'irradiation', 'radiacion', 'dosis de radiacion'],
    words: ['radiation', 'dose', 'dosimeter', 'msv', 'exposure'],
    get: () => ({
      text: `Your cumulative effective dose is ${radiation.trend.value} ${radiation.trend.unit} — ${home.vitals.find((v) => v.id === 'radiation')?.delta.toLowerCase() ?? 'within mission limits'}. ${radiation.trend.note}`,
      links: [radiationLink],
    }),
  },
  {
    topic: 'Sensors & detectors',
    phrases: ['sensor', 'detectors', 'bubble detector', 'neutron detector', 'instruments', 'radi-n2', 'sensores', 'dosimeter readings'],
    words: ['sensor', 'sensors', 'detector', 'detectors'],
    get: () => ({
      text: `Four instruments are live: ${radiation.sensors.map((s) => `${s.name.toLowerCase()} at ${s.reading} (${s.location.toLowerCase()})`).join('; ')}.`,
      links: [radiationLink],
    }),
  },
  {
    topic: 'Neutron campaigns',
    phrases: ['neutron', 'campaigns', 'neutron counts', 'charged particle', 'south atlantic', 'saa'],
    words: ['neutrons', 'neutron', 'campaign', 'campaigns'],
    get: () => {
      const worst = radiation.campaigns.find((c) => c.status === 'alert');
      return {
        text: `The current 7-day campaign counts ${radiation.campaigns[0]?.neutrons.toLocaleString('en-US')} neutrons — quiet background. The notable one: ${worst?.label.toLowerCase()} with ${worst?.neutrons.toLocaleString('en-US')} counts when the solar event nearly doubled detections.`,
        links: [radiationLink],
      };
    },
  },
  {
    topic: 'Day-140 solar event',
    phrases: ['solar particle event', 'particle event', 'solar flare', 'day 140', 'evento solar', 'solar storm', 'tormenta solar'],
    words: ['solar', 'flare'],
    get: () => {
      const a = radiation.alarms.find((al) => al.level === 'alert');
      return { text: a ? `${a.title} — ${a.text}` : 'The day-140 solar particle event was handled with the shelter protocol; dose inside shelter stayed within limits.', links: [radiationLink] };
    },
  },
  {
    topic: 'Shelter spots',
    phrases: ['shelter spots', 'storm shelter', 'safest place', 'shielded module', 'sheltering', 'refugio', 'donde refugiarme'],
    words: ['shelter', 'shielding', 'cupola', 'shields'],
    get: () => ({
      text: `Dose rate by location during the day-140 event: ${radiation.shielding.comparison.map((c) => `${c.label.toLowerCase()} ${c.value}`).join(', ')}. ${radiation.shielding.note}`,
      links: [radiationLink],
    }),
  },
  {
    topic: 'EVA & spacewalks',
    phrases: ['eva', 'spacewalk', 'space walk', 'caminata espacial', 'traje'],
    words: ['eva', 'spacewalk'],
    get: () => {
      const s = radiation.sensors.find((x) => x.id === 'dosim-eVA');
      return {
        text: `A spacewalk is the highest-radiation activity on the mission — the EVA dosimeter reads ${s?.reading} per walk, trend ${s?.trend}. Nothing about your last EVA exceeded limits.`,
        links: [radiationLink],
      };
    },
  },
  {
    topic: 'What the numbers mean',
    phrases: ['what does msv mean', 'units', 'microsievert', 'sievert', 'unidades', 'que significa', 'career limits', 'career dose'],
    words: ['units', 'sievert'],
    get: () => {
      const u = radiation.explanation.units.map((x) => `${x.label}: ${x.meaning.toLowerCase()}`).join(' · ');
      return { text: `${u}. ${radiation.explanation.bioEffects.text}`, links: [radiationLink] };
    },
  },

  // ── General space-health topics ─────────────────────────────────────────
  {
    topic: 'Microgravity & fluid shift',
    phrases: ['microgravity', 'zero-g', 'weightless', 'fluid shift', 'why do astronauts', 'microgravedad', 'ingravidez', 'gravedad'],
    words: ['microgravity', 'gravity', 'weightlessness'],
    get: () => ({
      text: 'In microgravity your body stops "working against" gravity: fluids drift upward (head pressure, SANS), muscles and bones lose load (atrophy, calcium loss), and the heart pumps differently. That is exactly why the exercise, diet and monitoring routines exist.',
      links: SECTION_LINKS,
    }),
  },
  {
    topic: 'Exercise countermeasures',
    phrases: ['exercise', 'ared', 'resistance training', 'workout', 'training plan', 'ejercicio', 'entrenamiento', 'countermeasure'],
    words: ['exercise', 'workout', 'treadmill', 'ared'],
    get: () => ({
      text: 'Your daily prescription pairs ARED resistance work with treadmill cardio — it is what keeps bone loss near the action limit and VO2 at 88% of pre-flight. The plan was retuned on day 145 to help the quadriceps; keep the sessions honest and the numbers follow.',
      links: [scanLink, historyLink],
    }),
  },

  // ── Biological biomarkers (radiation page) ───────────────────────────────
  {
    topic: 'Blood biomarkers',
    phrases: ['biomarker', '8-oxo', 'oxo-dg', 'oxodg', 'oxidative', 'microsatellite', 'msi', 'white blood', 'wbc', 'immune cell', 'biomarcador', 'globulos blancos', 'leucocitos', 'adn'],
    words: ['biomarker', 'dna', 'leukocyte'],
    get: () => {
      const oxo = radiation.biomarkers.items[0];
      const msi = radiation.biomarkers.items[1];
      const wbc = radiation.biomarkers.items[2];
      return {
        text: `Your latest blood panel reads: ${oxo.name} at ${oxo.value} (${oxo.reference.toLowerCase()}); ${msi.name}: ${msi.value}; ${wbc.name} at ${wbc.value}. ${wbc.note} Bloodwork sees what the detectors cannot — damage and recovery inside your cells. Next panel is drawn on day 155.`,
        links: [radiationLink],
      };
    },
  },

  // ── Environment & circadian light page ───────────────────────────────────
  {
    topic: 'Cabin air',
    phrases: ['co2', 'carbon dioxide', 'o2', 'oxygen', 'cabin air', 'air quality', 'atmosphere', 'aire', 'oxigeno', 'dioxido de carbono'],
    words: ['air', 'scrubber', 'atmosphere'],
    get: () => {
      const co2 = environment.air.sensors[0];
      const o2 = environment.air.sensors[1];
      return {
        text: `Cabin air is healthy: ${co2.name.toLowerCase()} at ${co2.value} (${co2.reference.toLowerCase()}) and ${o2.name} at ${o2.value}. ${co2.note} If CO2 ever creeps up, it is a scrubber cartridge rotation — an equipment task, not a health event.`,
        links: [environmentLink],
      };
    },
  },
  {
    topic: 'Microbial swabs',
    phrases: ['swab', 'microbial', 'microbiological', 'bacteria', 'mold', 'mould', 'allergy', 'germ', 'hisopo', 'microbios', 'bacterias', 'hongos'],
    words: ['swab', 'microbe', 'bacteria', 'hygiene', 'cleanliness'],
    get: () => {
      const flagged = environment.swabs.points.filter((p) => p.result !== 'clear');
      const names = flagged.map((p) => p.area.toLowerCase()).join(' and ');
      return {
        text: flagged.length > 0
          ? `Weekly swabs are mostly clean. Two stations are on watch: ${names}. ${flagged[0].detail} Both actions are already scheduled — no crew action needed beyond routine wipe-downs.`
          : 'All weekly swab stations came back clear — no bacterial or mold growth anywhere on the checklist.',
        links: [environmentLink],
      };
    },
  },
  {
    topic: 'Circadian light schedule',
    phrases: ['circadian', 'light schedule', 'lighting', 'lights out', 'amber light', 'blue light', 'body clock', 'luz', 'luz circadiana', 'ritmo circadiano'],
    words: ['light', 'lighting', 'circadian', 'amber', 'daylight'],
    get: () => {
      const alert = environment.circadian.modes[0];
      const recovery = environment.circadian.modes[1];
      return {
        text: `${alert.name} runs ${alert.hours} on ${alert.light.toLowerCase()} — it keeps reaction time sharp. Then ${recovery.name} from ${recovery.hours} switches to ${recovery.light.toLowerCase()} so melatonin can rise naturally before lights-out. ${environment.circadian.sleepSync}`,
        links: [environmentLink, wellbeingLink],
      };
    },
  },
];

const FALLBACK_TOPICS = 3;

const FALLBACK: CarlitosReply = {
  text: 'I could not find that one in my console knowledge. I can walk you through any reading or section — scanner, health history, well-being, radiation or environment — in plain language.',
  links: SECTION_LINKS,
};

const matchWord = (word: string, tokens: string[]): boolean => {
  const stem = word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
  return tokens.some((t) => t === word || (stem.length >= 4 && (t === stem || t.startsWith(stem))));
};

/**
 * Simulated reply engine for the Carlitos assistant. Fuzzy keyword scoring over a
 * mission-data knowledge base: answers quote the crew member's actual readings from
 * the content layer, understand English and Spanish phrasing (accent-insensitive),
 * and route anything clinical to the flight surgeon. Carlitos explains and guides —
 * it never diagnoses or prescribes.
 */
export function getReply(text: string): CarlitosReply {
  const q = normalize(text);
  if (!q) return FALLBACK;
  const tokens = q.split(' ');

  let best: Knowledge | null = null;
  let bestScore = 0;
  let bestSoft: Knowledge | null = null;
  let bestSoftScore = 0;
  const near: { topic: string; score: number }[] = [];

  for (const entry of ENTRIES) {
    let score = 0;
    for (const phrase of entry.phrases) {
      if (q.includes(phrase)) score += 3;
    }
    for (const word of entry.words) {
      if (matchWord(word, tokens)) score += 1;
    }
    if (entry.boost) score += entry.boost;
    if (score > 0) {
      if (!entry.soft) near.push({ topic: entry.topic, score });
      if (entry.soft) {
        if (score > bestSoftScore) {
          bestSoftScore = score;
          bestSoft = entry;
        }
      } else if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
  }

  // Topic answers win ties over casual small talk ("hey, how is my femur?").
  const winner = best ?? bestSoft;
  if (winner) return winner.get();

  const suggestions = near
    .sort((a, b) => b.score - a.score)
    .slice(0, FALLBACK_TOPICS)
    .map((n) => n.topic.toLowerCase());
  if (suggestions.length > 0) {
    return {
      text: `I did not find an exact answer for that, but these topics are closest to what you asked: ${suggestions.join(', ')}. Ask me about one, or jump to a section below.`,
      links: SECTION_LINKS,
    };
  }
  return FALLBACK;
}
