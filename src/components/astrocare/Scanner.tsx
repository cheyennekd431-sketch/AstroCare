import { useState } from 'react';
import { Minus, Plus, RotateCw, Scan, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { statusStyles, type HealthStatus } from './status';

export type ScannerLayer = 'full' | 'muscular' | 'skeletal';

/** Color-coded status dots: each region is tappable on its own layer. */
const REGION_DOTS: { id: string; layer: ScannerLayer; x: number; y: number; status: HealthStatus }[] = [
  { id: 'brain', layer: 'full', x: 100, y: 26, status: 'watch' },
  { id: 'eyes', layer: 'full', x: 100, y: 36, status: 'watch' },
  { id: 'heart', layer: 'full', x: 91, y: 103, status: 'normal' },
  { id: 'abdomen', layer: 'full', x: 100, y: 152, status: 'normal' },
  { id: 'lumbar', layer: 'skeletal', x: 100, y: 210, status: 'watch' },
  { id: 'femur', layer: 'skeletal', x: 87, y: 302, status: 'watch' },
  { id: 'quadriceps', layer: 'muscular', x: 113, y: 302, status: 'watch' },
  { id: 'calves', layer: 'muscular', x: 80, y: 340, status: 'normal' },
];

/**
 * Anatomically-shaped silhouette shared by every layer: skull with jaw, neck,
 * shoulders with deltoid slope, tapered waist, hips, arms spread slightly
 * outward with open hands, conical legs with calves, ankles and feet.
 */
const SILHOUETTE_PATHS = [
  // Head — cranium tapering to the chin
  'M100,14 C108,14 114,19 116,27 C118,35 117,44 113,52 C110,58 107,62 103,66 C102,68 98,68 97,66 C93,62 90,58 87,52 C83,44 82,35 84,27 C86,19 92,14 100,14 Z',
  // Neck
  'M93,66 C93,72 91,76 89,80 L111,80 C109,76 107,72 107,66 C104,69 96,69 93,66 Z',
  // Torso — shoulders, chest, waist, hips
  'M89,80 C77,83 66,89 61,97 C57,105 58,115 63,122 C61,136 62,150 66,160 C69,170 73,176 74,182 C71,196 71,210 76,222 C81,232 90,237 100,237 C110,237 119,232 124,222 C129,210 129,196 126,182 C127,176 131,170 134,160 C138,150 139,136 137,122 C142,115 143,105 139,97 C134,89 123,83 111,80 C107,84 93,84 89,80 Z',
  // Left arm — upper arm, forearm, tapering to the wrist
  'M63,93 C55,99 49,111 47,126 C45,141 44,155 42,167 C40,179 39,191 38,201 C36,207 36,213 38,217 C41,220 45,218 46,213 C48,203 49,193 51,183 C54,167 57,151 59,135 C61,121 62,107 63,99 C63,95 63,93 63,93 Z',
  // Right arm
  'M137,93 C145,99 151,111 153,126 C155,141 156,155 158,167 C160,179 161,191 162,201 C164,207 164,213 162,217 C159,220 155,218 154,213 C152,203 151,193 149,183 C146,167 143,151 141,135 C139,121 138,107 137,99 C137,95 137,93 137,93 Z',
  // Left palm
  'M38,216 C35,222 34,230 36,236 C38,241 44,242 47,238 C49,233 49,226 47,219 C44,215 41,214 38,216 Z',
  // Right palm
  'M162,216 C165,222 166,230 164,236 C162,241 156,242 153,238 C151,233 151,226 153,219 C156,215 159,214 162,216 Z',
  // Left leg — thigh, knee, calf, ankle
  'M79,232 C75,250 73,270 75,290 C76,300 77,306 76,312 C74,328 75,344 78,358 C77,370 79,382 81,392 C81,400 81,408 83,412 C85,415 89,415 91,412 C92,402 91,390 90,378 C89,362 88,348 88,336 C89,324 90,312 90,302 C91,284 92,264 93,246 C93,240 93,236 93,234 C88,232 83,231 79,232 Z',
  // Right leg
  'M121,232 C125,250 127,270 125,290 C124,300 123,306 124,312 C126,328 125,344 122,358 C123,370 121,382 119,392 C119,400 119,408 117,412 C115,415 111,415 109,412 C108,402 109,390 110,378 C111,362 112,348 112,336 C111,324 110,312 110,302 C109,284 108,264 107,246 C107,240 107,236 107,234 C112,232 117,231 121,232 Z',
  // Left foot
  'M82,410 C77,416 74,424 75,432 C76,440 82,444 89,442 C94,440 95,434 93,428 C92,422 91,416 91,410 C88,413 85,413 82,410 Z',
  // Right foot
  'M118,410 C123,416 126,424 125,432 C124,440 118,444 111,442 C106,440 105,434 107,428 C108,422 109,416 109,410 C112,413 115,413 118,410 Z',
];

/** Open-hand fingers and thumb, drawn as rounded strokes. */
const HAND_STROKES = [
  'M39,238 L33,258',
  'M42,240 L39,262',
  'M45,239 L45,260',
  'M47,236 L51,254',
  'M47,222 L55,230',
  'M161,238 L167,258',
  'M158,240 L161,262',
  'M155,239 L155,260',
  'M153,236 L149,254',
  'M153,222 L145,230',
];

/** Toe markers on the soles, full-body layer only. */
const TOE_DOTS = [
  [78, 441],
  [83, 443],
  [88, 442],
  [92, 439],
  [122, 441],
  [117, 443],
  [112, 442],
  [108, 439],
] as const;

interface ScannerProps {
  activeLayer: ScannerLayer;
  selectedRegion: string | null;
  onSelectRegion: (id: string) => void;
}

/**
 * The AstroCare anatomical scanner: an anatomically-detailed human figure in
 * the style of a medical atlas — three crossfading layers (full body, muscular,
 * skeletal) plus a scan-line sweep, zoom and tilt controls, and tappable
 * region indicators.
 */
export default function Scanner({ activeLayer, selectedRegion, onSelectRegion }: ScannerProps) {
  const [zoom, setZoom] = useState(1);
  const [tilted, setTilted] = useState(false);

  const layerCls = (layer: ScannerLayer) =>
    cn(
      'transition-opacity duration-700 ease-out',
      activeLayer === layer ? 'opacity-100' : 'opacity-0 pointer-events-none',
    );

  const dimSilhouette = (
    <g fill="hsl(var(--primary) / 0.04)" stroke="hsl(var(--primary) / 0.28)" strokeWidth={1.2}>
      {SILHOUETTE_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
      {HAND_STROKES.map((d) => (
        <path key={d} d={d} fill="none" strokeLinecap="round" strokeWidth={2.2} />
      ))}
    </g>
  );

  const controls: { icon: LucideIcon; label: string; action: () => void; active?: boolean }[] = [
    { icon: Plus, label: 'Zoom in', action: () => setZoom((z) => Math.min(2.2, z + 0.2)) },
    { icon: Minus, label: 'Zoom out', action: () => setZoom((z) => Math.max(0.8, z - 0.2)) },
    { icon: RotateCw, label: 'Tilt view', action: () => setTilted((t) => !t), active: tilted },
    {
      icon: Scan,
      label: 'Reset view',
      action: () => {
        setZoom(1);
        setTilted(false);
      },
    },
  ];

  return (
    <div className="relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl bg-card/40">
      {/* HUD chrome */}
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="ac-scanline" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-3 border border-primary/15"
        aria-hidden="true"
      />
      {(['left-2 top-2 border-l border-t', 'right-2 top-2 border-r border-t', 'bottom-2 left-2 border-b border-l', 'bottom-2 right-2 border-b border-r'] as const).map(
        (pos) => (
          <span key={pos} className={`pointer-events-none absolute h-4 w-4 border-primary/60 ${pos}`} aria-hidden="true" />
        )
      )}

      {/* Controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        {controls.map(({ icon: Icon, label, action, active }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            aria-label={label}
            aria-pressed={active ?? undefined}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/70 text-muted-foreground backdrop-blur transition-colors duration-150 hover:border-primary/60 hover:text-primary',
              active && 'border-primary/60 text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Figure */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden py-4">
        <div className="ac-float">
          <div
            className="transition-transform duration-300 ease-out"
            style={{ transform: `perspective(900px) rotateY(${tilted ? 14 : 0}deg) scale(${zoom})` }}
          >
            <svg
              viewBox="0 0 200 460"
              className="h-[440px] max-h-[58vh] w-auto md:h-[520px] lg:h-[560px]"
              role="img"
              aria-label="Interactive anatomical body map with selectable regions"
            >
              <defs>
                <radialGradient id="ac-halo" cx="50%" cy="40%" r="65%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.14" />
                  <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="100" cy="230" rx="90" ry="210" fill="url(#ac-halo)" />

              {/* Layer 1 — full body */}
              <g className={layerCls('full')} aria-hidden="true">
                <g fill="hsl(var(--primary) / 0.10)" stroke="hsl(var(--primary) / 0.75)" strokeWidth={1.4}>
                  {SILHOUETTE_PATHS.map((d) => (
                    <path key={d.slice(0, 24)} d={d} />
                  ))}
                  {HAND_STROKES.map((d) => (
                    <path key={d} d={d} fill="none" strokeLinecap="round" strokeWidth={2.2} />
                  ))}
                </g>
                {TOE_DOTS.map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill="none" stroke="hsl(var(--primary) / 0.6)" strokeWidth={0.8} />
                ))}
                <ellipse cx="86" cy="100" rx="8" ry="12" fill="none" stroke="hsl(var(--info) / 0.55)" strokeWidth={1} />
                <ellipse cx="114" cy="100" rx="8" ry="12" fill="none" stroke="hsl(var(--info) / 0.55)" strokeWidth={1} />
                <circle cx="91" cy="103" r="7" fill="hsl(var(--destructive) / 0.35)" stroke="hsl(var(--destructive) / 0.8)" strokeWidth={1} />
                <rect x="86" y="126" width="28" height="50" rx="9" fill="hsl(var(--primary) / 0.06)" stroke="hsl(var(--primary) / 0.4)" strokeWidth={1} />
              </g>

              {/* Layer 2 — muscular (atlas red) */}
              <g className={layerCls('muscular')} aria-hidden="true">
                {dimSilhouette}
                <g fill="hsl(var(--destructive) / 0.30)" stroke="hsl(var(--destructive) / 0.7)" strokeWidth={1} strokeLinecap="round">
                  {/* Trapezius slopes */}
                  <path d="M100,82 C92,84 84,86 76,90" fill="none" strokeWidth={5} />
                  <path d="M100,82 C108,84 116,86 124,90" fill="none" strokeWidth={5} />
                  {/* Deltoids */}
                  <path d="M80,86 C70,88 62,94 60,103 C59,111 63,117 69,119 C75,117 79,111 80,104 Z" />
                  <path d="M120,86 C130,88 138,94 140,103 C141,111 137,117 131,119 C125,117 121,111 120,104 Z" />
                  {/* Pectorals */}
                  <path d="M97,96 C89,96 79,99 74,105 C73,112 78,118 85,119 C91,118 96,112 97,105 Z" />
                  <path d="M103,96 C111,96 121,99 126,105 C127,112 122,118 115,119 C109,118 104,112 103,105 Z" />
                  {/* Rectus abdominis with tendinous bands */}
                  <rect x="92" y="128" width="16" height="58" rx="7" />
                  <line x1="92" y1="142" x2="108" y2="142" fill="none" />
                  <line x1="92" y1="156" x2="108" y2="156" fill="none" />
                  <line x1="92" y1="170" x2="108" y2="170" fill="none" />
                  {/* Obliques */}
                  <path d="M80,136 C77,146 76,158 77,168" fill="none" strokeWidth={6} />
                  <path d="M120,136 C123,146 124,158 123,168" fill="none" strokeWidth={6} />
                  {/* Biceps */}
                  <path d="M63,108 L55,148" fill="none" strokeWidth={10} />
                  <path d="M137,108 L145,148" fill="none" strokeWidth={10} />
                  {/* Forearm flexors */}
                  <path d="M53,160 L44,198" fill="none" strokeWidth={7} />
                  <path d="M147,160 L156,198" fill="none" strokeWidth={7} />
                  {/* Quadriceps teardrops */}
                  <path d="M86,244 C81,262 79,284 83,302 C86,310 92,310 94,302 C96,284 96,262 94,246 Z" />
                  <path d="M114,244 C119,262 121,284 117,302 C114,310 108,310 106,302 C104,284 104,262 106,246 Z" />
                  <ellipse cx="91" cy="296" rx="4" ry="8" />
                  <ellipse cx="109" cy="296" rx="4" ry="8" />
                  {/* Sartorius lines */}
                  <path d="M93,242 L84,298" fill="none" strokeWidth={2.5} />
                  <path d="M107,242 L116,298" fill="none" strokeWidth={2.5} />
                  {/* Gastrocnemius (calves) */}
                  <path d="M78,320 C74,332 74,346 79,355 C83,360 88,359 90,352 C91,342 89,330 87,322 Z" />
                  <path d="M122,320 C126,332 126,346 121,355 C117,360 112,359 110,352 C109,342 111,330 113,322 Z" />
                  {/* Tibialis anterior */}
                  <path d="M84,330 L83,384" fill="none" strokeWidth={4} />
                  <path d="M116,330 L117,384" fill="none" strokeWidth={4} />
                </g>
              </g>

              {/* Layer 3 — skeletal (atlas bone) */}
              <g className={layerCls('skeletal')} aria-hidden="true">
                {dimSilhouette}
                <g stroke="hsl(var(--foreground) / 0.85)" fill="hsl(var(--foreground) / 0.10)" strokeWidth={1.3} strokeLinecap="round">
                  {/* Skull with orbits, nasal aperture and jaw */}
                  <path d="M100,16 C109,16 115,22 116,30 C117,38 114,46 110,51 C108,54 104,56 100,56 C96,56 92,54 90,51 C86,46 83,38 84,30 C85,22 91,16 100,16 Z" />
                  <path d="M91,50 C91,57 94,63 98,66 C99,67 101,67 102,66 C106,63 109,57 109,50 C106,53 94,53 91,50 Z" />
                  <ellipse cx="93" cy="33" rx="4" ry="3.2" fill="hsl(var(--background) / 0.9)" stroke="none" />
                  <ellipse cx="107" cy="33" rx="4" ry="3.2" fill="hsl(var(--background) / 0.9)" stroke="none" />
                  <path d="M100,38 L98,43 L102,43 Z" fill="none" strokeWidth={1} />
                  <line x1="94" y1="59" x2="106" y2="59" strokeWidth={1} />
                  {/* Spine — stacked vertebrae */}
                  {Array.from({ length: 12 }, (_, i) => (
                    <rect key={`vert-${i}`} x={97} y={88 + i * 12} width={6} height={9} rx={2} />
                  ))}
                  {/* Clavicles and sternum */}
                  <path d="M100,92 C94,88 84,88 76,92" fill="none" />
                  <path d="M100,92 C106,88 116,88 124,92" fill="none" />
                  <line x1="100" y1="90" x2="100" y2="150" strokeWidth={3} />
                  {/* Ribcage — seven pairs of arcing ribs */}
                  {Array.from({ length: 7 }, (_, i) => {
                    const y = 96 + i * 8;
                    return (
                      <g key={`rib-${i}`}>
                        <path d={`M98,${y} C88,${y + 2} 79,${y + 7} 77,${y + 15}`} fill="none" />
                        <path d={`M102,${y} C112,${y + 2} 121,${y + 7} 123,${y + 15}`} fill="none" />
                      </g>
                    );
                  })}
                  <path d="M98,152 C90,154 84,157 82,163" fill="none" />
                  <path d="M102,152 C110,154 116,157 118,163" fill="none" />
                  {/* Pelvis with sacrum */}
                  <path d="M100,238 C94,236 88,232 84,226 C78,220 75,210 78,202 C82,196 90,196 95,200 C97,206 98,212 100,214 C102,212 103,206 105,200 C110,196 118,196 122,202 C125,210 122,220 116,226 C112,232 106,236 100,238 Z" />
                  <path d="M100,216 L96,226 L104,226 Z" fill="hsl(var(--foreground) / 0.3)" stroke="none" />
                  {/* Shoulder joints and humeri */}
                  <circle cx="64" cy="96" r="4" />
                  <circle cx="136" cy="96" r="4" />
                  <line x1="64" y1="98" x2="50" y2="178" strokeWidth={4.5} />
                  <line x1="136" y1="98" x2="150" y2="178" strokeWidth={4.5} />
                  {/* Radius and ulna */}
                  <line x1="51" y1="184" x2="42" y2="262" strokeWidth={3} />
                  <line x1="55" y1="186" x2="46" y2="262" strokeWidth={3} />
                  <line x1="149" y1="184" x2="158" y2="262" strokeWidth={3} />
                  <line x1="145" y1="186" x2="154" y2="262" strokeWidth={3} />
                  {/* Hand bones — fanned metacarpals and digits */}
                  <line x1="42" y1="218" x2="33" y2="258" strokeWidth={1.5} />
                  <line x1="42" y1="218" x2="38" y2="262" strokeWidth={1.5} />
                  <line x1="42" y1="218" x2="44" y2="262" strokeWidth={1.5} />
                  <line x1="42" y1="218" x2="49" y2="258" strokeWidth={1.5} />
                  <line x1="42" y1="218" x2="55" y2="230" strokeWidth={1.5} />
                  <line x1="158" y1="218" x2="167" y2="258" strokeWidth={1.5} />
                  <line x1="158" y1="218" x2="162" y2="262" strokeWidth={1.5} />
                  <line x1="158" y1="218" x2="156" y2="262" strokeWidth={1.5} />
                  <line x1="158" y1="218" x2="151" y2="258" strokeWidth={1.5} />
                  <line x1="158" y1="218" x2="145" y2="230" strokeWidth={1.5} />
                  {/* Femurs with heads, patellae */}
                  <circle cx="90" cy="234" r="3.5" />
                  <circle cx="110" cy="234" r="3.5" />
                  <line x1="90" y1="236" x2="85" y2="306" strokeWidth={5} />
                  <line x1="110" y1="236" x2="115" y2="306" strokeWidth={5} />
                  <circle cx="85" cy="310" r="4" />
                  <circle cx="115" cy="310" r="4" />
                  {/* Tibiae and fibulae */}
                  <line x1="85" y1="314" x2="82" y2="398" strokeWidth={4.5} />
                  <line x1="89" y1="316" x2="87" y2="396" strokeWidth={2} />
                  <line x1="115" y1="314" x2="118" y2="398" strokeWidth={4.5} />
                  <line x1="111" y1="316" x2="113" y2="396" strokeWidth={2} />
                  {/* Foot bones */}
                  <line x1="85" y1="402" x2="76" y2="436" strokeWidth={1.5} />
                  <line x1="85" y1="402" x2="81" y2="440" strokeWidth={1.5} />
                  <line x1="85" y1="402" x2="87" y2="440" strokeWidth={1.5} />
                  <line x1="85" y1="402" x2="92" y2="437" strokeWidth={1.5} />
                  <line x1="115" y1="402" x2="124" y2="436" strokeWidth={1.5} />
                  <line x1="115" y1="402" x2="119" y2="440" strokeWidth={1.5} />
                  <line x1="115" y1="402" x2="113" y2="440" strokeWidth={1.5} />
                  <line x1="115" y1="402" x2="108" y2="437" strokeWidth={1.5} />
                </g>
              </g>

              {/* Region indicators — active per layer */}
              {REGION_DOTS.map((d) => {
                if (d.layer !== activeLayer) return null;
                const color = statusStyles[d.status].svg;
                const selected = selectedRegion === d.id;
                return (
                  <g
                    key={d.id}
                    className="cursor-pointer transition-opacity duration-200 hover:opacity-100"
                    onClick={() => onSelectRegion(d.id)}
                  >
                    <circle cx={d.x} cy={d.y} r={15} fill="transparent" />
                    {selected && (
                      <circle cx={d.x} cy={d.y} r={9.5} fill="none" stroke={color} strokeWidth={1.4} opacity={0.9} />
                    )}
                    <circle cx={d.x} cy={d.y} r={3.2} fill={color} className="ac-pulse" />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
