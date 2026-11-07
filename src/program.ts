// The whole program lives here. The DB only stores what changes at the gym
// (weights, chosen variants, logs). Edit this file + commit to change the program.
// Sources for the injury text: docs/research.md

export type Person = 'kevin' | 'emily'
export const PEOPLE: Person[] = ['kevin', 'emily']
export const PERSON_NAME: Record<Person, string> = { kevin: 'Kevin', emily: 'Emily' }

export type Load = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight'

export type Exercise = {
  id: string
  name: string
  load: Load
  /** /media/<file>; .mp4 plays as a looping muted video, anything else as <img> */
  media?: string
  cues?: string[]
  /** reps are per side */
  perSide?: boolean
  /** "reps" are seconds held */
  timed?: boolean
}

export type Scheme = {
  sets: number
  /** [min, max]; equal for fixed-rep sets like 5x5 */
  reps: [number, number]
  /** last set is AMRAP ("5+") */
  amrapLast?: boolean
}

export type SlotPerson = {
  /** first entry is the default; the rest show in the swap dropdown */
  variants: string[]
  /** starting weight per variant id (lb). Missing = 0 */
  start: Record<string, number>
  /** overrides the slot scheme for this person */
  scheme?: Scheme
  /** per-variant scheme overrides (e.g. kneeling side plank is shorter) */
  variantScheme?: Record<string, Scheme>
  /** suggested jump in lb; defaults by load type */
  increment?: number
  /** always-visible warnings for this person on this exercise */
  warnings?: string[]
  /** shown only while Emily's healing mode is on */
  healingWarnings?: string[]
}

export type Slot = {
  id: string
  main?: boolean
  scheme: Scheme
  kevin?: SlotPerson
  emily?: SlotPerson
}

export type DayId = 'pushA' | 'pullA' | 'legs1' | 'pushB' | 'pullB' | 'legs2'
export type DayKind = 'push' | 'pull' | 'legs'

export type Day = {
  id: DayId
  name: string
  short: string
  kind: DayKind
  slots: Slot[]
}

export const ROTATION: DayId[] = ['pushA', 'pullA', 'legs1', 'pushB', 'pullB', 'legs2']

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

const ex = (e: Exercise) => e

export const EXERCISES: Record<string, Exercise> = Object.fromEntries(
  [
    ex({ id: 'bench', name: 'Bench press', load: 'barbell', media: '/media/bench-press.mp4',
      cues: ['Shoulder blades pulled back and down, slight arch', 'Elbows ~45° from your sides, not flared', 'Touch lower chest, press back up over shoulders'] }),
    ex({ id: 'neutral-db-bench', name: 'Neutral-grip DB bench', load: 'dumbbell', media: '/media/neutral-db-bench.mp4',
      cues: ['Palms facing each other', 'Lower until elbows are about level with your torso'] }),
    ex({ id: 'floor-press', name: 'Floor press', load: 'barbell', media: '/media/floor-press.mp4',
      cues: ['Lie on the floor in the rack', 'Lower until upper arms touch the floor, pause, press', 'Shorter range = less stretch on the front of the shoulder'] }),
    ex({ id: 'machine-shoulder-press', name: 'Machine shoulder press', load: 'machine',
      cues: ['Use the neutral (palms-in) handles if the machine has them', 'Seat so handles start at shoulder height', 'Press only through the pain-free range'] }),
    ex({ id: 'incline-bench', name: 'Incline barbell bench (30–45°)', load: 'barbell', media: '/media/incline-bench.mp4',
      cues: ['Bench at 30–45°, not steeper', 'Touch upper chest, elbows slightly tucked'] }),
    ex({ id: 'seated-db-press', name: 'Seated DB shoulder press (neutral grip)', load: 'dumbbell', media: '/media/seated-db-press.mp4',
      cues: ['Back against an upright bench', 'Palms facing each other', 'Brace lightly, exhale as you press'] }),
    ex({ id: 'standing-db-press', name: 'Standing single-arm DB press', load: 'dumbbell', media: '/media/standing-db-press.mp4', perSide: true,
      cues: ['One DB, free hand on your hip', 'Squeeze glutes, ribs down, don’t lean away', 'Exhale through the press'] }),
    ex({ id: 'cable-y-raise', name: 'Cable Y-raise', load: 'machine', media: '/media/cable-y-raise.mp4',
      cues: ['Light weight, thumbs up', 'Raise in a Y only as high as is pain-free'] }),
    ex({ id: 'incline-db-press', name: 'Incline DB press', load: 'dumbbell', media: '/media/incline-db-press.mp4',
      cues: ['Bench at 15–30° (low incline)', 'Lower until elbows are level with your torso'] }),
    ex({ id: 'triceps-pushdown', name: 'Triceps pushdown', load: 'machine', media: '/media/triceps-pushdown.mp4',
      cues: ['Elbows pinned to your sides', 'Full lockout, slow on the way up'] }),
    ex({ id: 'lateral-raise', name: 'Lateral raise', load: 'dumbbell', media: '/media/lateral-raise.mp4',
      cues: ['Raise to shoulder height only', 'Thumbs slightly up, slight bend in elbows'] }),

    ex({ id: 'deadlift', name: 'Deadlift', load: 'barbell', media: '/media/deadlift.mp4',
      cues: ['Bar over mid-foot, shins close', 'Brace, push the floor away', 'Hips and shoulders rise together, lock out with glutes'] }),
    ex({ id: 'barbell-row', name: 'Barbell row', load: 'barbell', media: '/media/barbell-row.mp4',
      cues: ['Overhand grip', 'Hinge to ~45°, pull to lower chest', 'No jerking with the hips'] }),
    ex({ id: 'chest-supported-row', name: 'Chest-supported row', load: 'dumbbell', media: '/media/chest-supported-row.mp4',
      cues: ['Chest on an incline bench', 'Pull elbows back, squeeze shoulder blades'] }),
    ex({ id: 'lat-pulldown', name: 'Lat pulldown', load: 'machine', media: '/media/lat-pulldown.mp4',
      cues: ['Overhand grip, a bit wider than shoulders', 'Pull to upper chest, chest up'] }),
    ex({ id: 'neutral-pulldown', name: 'Neutral-grip pulldown', load: 'machine', media: '/media/neutral-pulldown.mp4',
      cues: ['Palms-facing handle (V-bar or parallel grip)', 'Pull to upper chest'] }),
    ex({ id: 'seated-cable-row', name: 'Seated cable row', load: 'machine', media: '/media/seated-cable-row.mp4',
      cues: ['Sit tall, pull to belly button', 'Squeeze shoulder blades, slow return'] }),
    ex({ id: 'face-pull', name: 'Face pull', load: 'machine', media: '/media/face-pull.mp4',
      cues: ['Rope at upper-chest height', 'Pull to chin/nose, elbows at or below shoulder height'] }),
    ex({ id: 'db-curl', name: 'Dumbbell curl', load: 'dumbbell', media: '/media/db-curl.mp4',
      cues: ['Elbows at your sides, no swinging'] }),
    ex({ id: 'hammer-curl', name: 'Hammer curl', load: 'dumbbell', media: '/media/hammer-curl.mp4',
      cues: ['Palms facing each other', 'Elbows at your sides'] }),
    ex({ id: 'bird-dog', name: 'Bird dog', load: 'bodyweight', media: '/media/bird-dog.mp4', perSide: true,
      cues: ['On hands and knees, opposite arm and leg out', 'Keep hips level, move slowly'] }),
    ex({ id: 'side-plank', name: 'Side plank', load: 'bodyweight', media: '/media/side-plank.mp4', perSide: true, timed: true,
      cues: ['Elbow under shoulder, body in a straight line'] }),
    ex({ id: 'kneeling-side-plank', name: 'Kneeling side plank', load: 'bodyweight', media: '/media/kneeling-side-plank.mp4', perSide: true, timed: true,
      cues: ['Knees bent, hips lifted', 'Shorter lever = less load on the waist'] }),

    ex({ id: 'back-squat', name: 'Back squat', load: 'barbell', media: '/media/back-squat.mp4',
      cues: ['High bar, comfortable grip width', 'Set the safety pins just above parallel as a depth marker', 'Control the way down, no bouncing'] }),
    ex({ id: 'goblet-squat', name: 'Goblet squat', load: 'dumbbell', media: '/media/goblet-squat.mp4',
      cues: ['Hold one DB at your chest', 'Sit between your heels, chest up'] }),
    ex({ id: 'bench-box-squat', name: 'Bar squat to bench', load: 'barbell', media: '/media/bench-box-squat.mp4',
      cues: ['Flat bench behind you in the rack', 'Sit back until you lightly touch, then stand'] }),
    ex({ id: 'rdl', name: 'Romanian deadlift', load: 'barbell', media: '/media/rdl.mp4',
      cues: ['Soft knees, push hips back', 'Bar close to legs, lower to mid-shin', 'Flat back, no bouncing'] }),
    ex({ id: 'leg-press', name: 'Leg press', load: 'machine', media: '/media/leg-press.mp4',
      cues: ['Feet mid-to-low on the platform', 'Stop before knees come toward chest or your lower back tucks', 'Controlled, no bouncing'] }),
    ex({ id: 'leg-curl', name: 'Leg curl', load: 'machine', media: '/media/leg-curl.mp4',
      cues: ['Seated or lying, whichever the gym has', 'Slow on the way back'] }),
    ex({ id: 'calf-raise', name: 'Calf raise', load: 'machine', media: '/media/calf-raise.mp4',
      cues: ['On the leg press or a step (0 lb = bodyweight)', 'Full stretch at the bottom, pause at the top'] }),
    ex({ id: 'dead-bug', name: 'Dead bug', load: 'bodyweight', media: '/media/dead-bug.mp4', perSide: true,
      cues: ['Low back pressed into the floor', 'Opposite arm and leg, one side at a time'] }),
    ex({ id: 'heel-tap-dead-bug', name: 'Dead bug: bent-knee heel taps', load: 'bodyweight', media: '/media/heel-tap-dead-bug.mp4', perSide: true,
      cues: ['Knees bent 90°, tap one heel to the floor at a time', 'Low back stays down'] }),
    ex({ id: 'pallof-press', name: 'Pallof press', load: 'machine', media: '/media/pallof-press.mp4', perSide: true,
      cues: ['Stand side-on to the cable', 'Press straight out and resist the twist'] }),
  ].map((e) => [e.id, e]),
)

// ---------------------------------------------------------------------------
// Shared warning text
// ---------------------------------------------------------------------------

const EMILY_BRACE =
  'Ab strain: keep it conservative with reps in reserve. Moderate breath and brace, exhale through the hard part. Sharp ab pain while bracing = stop.'
const KEVIN_HIP_CONTROL = 'Hip flexor: controlled, no bouncing at the bottom.'

// ---------------------------------------------------------------------------
// Day building blocks
// ---------------------------------------------------------------------------

const S = (sets: number, min: number, max = min, amrapLast = false): Scheme => ({
  sets,
  reps: [min, max],
  amrapLast,
})
const MAIN_5 = S(5, 5, 5, true) // 4x5, 1x5+

const inclineSlot: Slot = {
  id: 'incline',
  scheme: S(3, 8, 12),
  kevin: {
    variants: ['incline-db-press'],
    start: { 'incline-db-press': 15 },
    warnings: ['Shoulder: low incline (15–30°), stop the descent when elbows are level with your torso.'],
  },
  emily: { variants: ['incline-db-press'], start: { 'incline-db-press': 10 } },
}
const pushdownSlot: Slot = {
  id: 'pushdown',
  scheme: S(3, 10, 12),
  kevin: { variants: ['triceps-pushdown'], start: { 'triceps-pushdown': 30 } },
  emily: { variants: ['triceps-pushdown'], start: { 'triceps-pushdown': 20 } },
}
const lateralSlot: Slot = {
  id: 'lateral',
  scheme: S(3, 15, 20),
  kevin: {
    variants: ['lateral-raise'],
    start: { 'lateral-raise': 5 },
    warnings: ['Shoulder: raise only to shoulder height, thumbs slightly up.'],
  },
  emily: { variants: ['lateral-raise'], start: { 'lateral-raise': 5 } },
}

const pullAccessories: Slot[] = [
  {
    id: 'pulldown',
    scheme: S(3, 8, 12),
    kevin: {
      variants: ['lat-pulldown', 'neutral-pulldown'],
      start: { 'lat-pulldown': 70, 'neutral-pulldown': 70 },
      warnings: ['Biceps tendon: overhand or neutral grip only, no underhand (chin-up) grip.'],
    },
    emily: { variants: ['lat-pulldown', 'neutral-pulldown'], start: { 'lat-pulldown': 60, 'neutral-pulldown': 60 } },
  },
  {
    id: 'cable-row',
    scheme: S(3, 8, 12),
    kevin: { variants: ['seated-cable-row'], start: { 'seated-cable-row': 60 } },
    emily: { variants: ['seated-cable-row'], start: { 'seated-cable-row': 50 } },
  },
  {
    id: 'face-pull',
    scheme: S(4, 15, 20),
    kevin: {
      variants: ['face-pull'],
      start: { 'face-pull': 20 },
      warnings: ['Shoulder: elbows at or below shoulder height; stop if the front of the shoulder pinches at the end.'],
    },
    emily: { variants: ['face-pull'], start: { 'face-pull': 15 } },
  },
  {
    id: 'curl',
    scheme: S(3, 10, 12),
    kevin: {
      variants: ['db-curl', 'hammer-curl'],
      start: { 'db-curl': 15, 'hammer-curl': 15 },
      warnings: ['Biceps tendon: start light, strict. Switch to hammer curls if it hurts. No incline or behind-the-body curls.'],
    },
    emily: { variants: ['db-curl', 'hammer-curl'], start: { 'db-curl': 10, 'hammer-curl': 10 } },
  },
  {
    id: 'bird-dog',
    scheme: S(3, 8),
    emily: { variants: ['bird-dog'], start: {} },
  },
  {
    id: 'side-plank',
    scheme: S(3, 20, 30),
    emily: {
      variants: ['side-plank', 'kneeling-side-plank'],
      start: {},
      variantScheme: { 'kneeling-side-plank': S(3, 10, 20) },
      healingWarnings: ['Ab strain: use the kneeling version for now. Skip it entirely if the pain is on the side of your waist.'],
    },
  },
]

const deadliftEmily: SlotPerson = {
  variants: ['deadlift'],
  start: { deadlift: 115 },
  warnings: [EMILY_BRACE],
}

const legsSlots: Slot[] = [
  {
    id: 'squat',
    main: true,
    scheme: S(3, 5, 5, true), // 2x5, 1x5+
    kevin: {
      variants: ['back-squat', 'goblet-squat'],
      start: { 'back-squat': 45, 'goblet-squat': 25 },
      warnings: [
        'Hip flexor: go to just above parallel, set the safety pins there as a depth marker. Control the descent, no bouncing.',
        'If the front of the hip or groin pinches at the bottom, cut the depth a notch.',
      ],
    },
    emily: {
      variants: ['goblet-squat', 'bench-box-squat'],
      start: { 'goblet-squat': 20, 'bench-box-squat': 45 },
      warnings: [EMILY_BRACE],
    },
  },
  {
    id: 'rdl',
    scheme: S(3, 8, 12),
    kevin: { variants: ['rdl'], start: { rdl: 65 }, warnings: [KEVIN_HIP_CONTROL] },
    emily: { variants: ['rdl'], start: { rdl: 65 }, warnings: [EMILY_BRACE] },
  },
  {
    id: 'leg-press',
    scheme: S(3, 8, 12),
    kevin: {
      variants: ['leg-press'],
      start: { 'leg-press': 90 },
      warnings: [KEVIN_HIP_CONTROL + " Don't let knees come toward your chest. Save your seat/depth in setup notes."],
    },
    emily: { variants: ['leg-press'], start: { 'leg-press': 90 }, warnings: [EMILY_BRACE] },
  },
  {
    id: 'leg-curl',
    scheme: S(3, 10, 12),
    kevin: { variants: ['leg-curl'], start: { 'leg-curl': 40 } },
    emily: { variants: ['leg-curl'], start: { 'leg-curl': 30 } },
  },
  {
    id: 'calf',
    scheme: S(3, 10, 15),
    kevin: { variants: ['calf-raise'], start: { 'calf-raise': 0 } },
    emily: { variants: ['calf-raise'], start: { 'calf-raise': 0 } },
  },
  {
    id: 'dead-bug',
    scheme: S(3, 10),
    kevin: {
      variants: ['dead-bug', 'heel-tap-dead-bug'],
      start: {},
      warnings: ['Hip flexor: if straight-leg lowering bothers the hip, use bent-knee heel taps.'],
    },
    emily: {
      variants: ['dead-bug', 'heel-tap-dead-bug'],
      start: {},
      healingWarnings: ['Ab strain: bent-knee heel taps, one limb at a time. No double-leg lowering.'],
    },
  },
  {
    id: 'pallof',
    scheme: S(3, 10),
    kevin: { variants: ['pallof-press'], start: { 'pallof-press': 10 } },
    emily: {
      variants: ['pallof-press'],
      start: { 'pallof-press': 10 },
      warnings: ['Ab strain: keep it light; stop if the side of your waist hurts.'],
    },
  },
]

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

const kevinBench: SlotPerson = {
  variants: ['bench', 'neutral-db-bench', 'floor-press'],
  start: { bench: 60, 'neutral-db-bench': 20, 'floor-press': 60 },
  warnings: [
    'Shoulder: tuck elbows ~45°, shoulder blades back and down, touch lower chest.',
    'If the bottom pinches, switch to floor press or neutral-grip DB bench.',
  ],
}

export const DAYS: Record<DayId, Day> = {
  pushA: {
    id: 'pushA',
    name: 'Push A',
    short: 'PA',
    kind: 'push',
    slots: [
      {
        id: 'bench',
        main: true,
        scheme: MAIN_5,
        kevin: kevinBench,
        emily: { variants: ['bench'], start: { bench: 50 }, increment: 2.5 },
      },
      {
        id: 'shoulder-acc',
        scheme: S(3, 8, 12),
        kevin: {
          variants: ['seated-db-press', 'cable-y-raise'],
          start: { 'seated-db-press': 15, 'cable-y-raise': 10 },
          warnings: [
            'Shoulder: overhead pressing is your known trigger. Neutral grip, light, pain-free range only. Stop at any pinch; switch to cable Y-raise.',
          ],
        },
        emily: {
          variants: ['seated-db-press', 'standing-db-press'],
          start: { 'seated-db-press': 10, 'standing-db-press': 10 },
        },
      },
      inclineSlot,
      pushdownSlot,
      lateralSlot,
    ],
  },
  pullA: {
    id: 'pullA',
    name: 'Pull A',
    short: 'LA',
    kind: 'pull',
    slots: [
      {
        id: 'deadlift',
        main: true,
        scheme: S(1, 5, 5, true), // 1x5+ after warm-ups
        kevin: {
          variants: ['deadlift'],
          start: { deadlift: 115 },
          warnings: [
            'Biceps tendon: double overhand grip; hook grip once it slips. Never mixed grip (the palm-up arm is the one that tears).',
          ],
        },
        emily: deadliftEmily,
      },
      ...pullAccessories,
    ],
  },
  legs1: { id: 'legs1', name: 'Legs', short: 'L', kind: 'legs', slots: legsSlots },
  pushB: {
    id: 'pushB',
    name: 'Push B',
    short: 'PB',
    kind: 'push',
    slots: [
      {
        id: 'press-main',
        main: true,
        scheme: MAIN_5,
        kevin: {
          variants: ['machine-shoulder-press', 'incline-bench', 'seated-db-press'],
          start: { 'machine-shoulder-press': 30, 'incline-bench': 45, 'seated-db-press': 15 },
          // No AMRAP on the one overhead main lift; straight 5x5.
          scheme: S(5, 5),
          warnings: [
            'Shoulder: overhead pressing is your known trigger. Neutral handles, start light, stop at any pinch. Swap to incline bench if it pinches.',
            'If pinching persists even on this, see a physio.',
          ],
        },
        emily: {
          variants: ['seated-db-press', 'standing-db-press'],
          start: { 'seated-db-press': 15, 'standing-db-press': 15 },
          // DB jumps are 10 lb total, so double progression instead of 5x5.
          scheme: S(4, 6, 10),
        },
      },
      {
        id: 'bench-acc',
        scheme: S(3, 8, 12),
        kevin: { ...kevinBench, start: { bench: 45, 'neutral-db-bench': 15, 'floor-press': 45 } },
        emily: { variants: ['bench'], start: { bench: 45 }, increment: 2.5 },
      },
      inclineSlot,
      pushdownSlot,
      lateralSlot,
    ],
  },
  pullB: {
    id: 'pullB',
    name: 'Pull B',
    short: 'LB',
    kind: 'pull',
    slots: [
      {
        id: 'row',
        main: true,
        scheme: MAIN_5,
        kevin: {
          variants: ['barbell-row', 'chest-supported-row'],
          start: { 'barbell-row': 55, 'chest-supported-row': 20 },
          warnings: ['Biceps tendon: overhand grip, not underhand.'],
        },
        emily: {
          variants: ['barbell-row', 'chest-supported-row'],
          start: { 'barbell-row': 55, 'chest-supported-row': 15 },
          warnings: [EMILY_BRACE],
          healingWarnings: ['If anything twinges, use the chest-supported row for now.'],
        },
      },
      ...pullAccessories,
    ],
  },
  legs2: { id: 'legs2', name: 'Legs', short: 'L', kind: 'legs', slots: legsSlots },
}

// ---------------------------------------------------------------------------
// Warm-ups, cardio, program info
// ---------------------------------------------------------------------------

export type WarmupItem = { text: string; media?: string }
const W = (text: string, media?: string): WarmupItem => ({ text, media })
const PULL_APART = W('Band pull-aparts 2x15', '/media/warmup-pull-apart.mp4')
const EXT_ROT = W('Band external rotations 2x15 per arm', '/media/warmup-external-rotation.mp4')
const BICEPS_ISO = W('Biceps isometric: hold a light curl at 90°, 2x30s')

export const WARMUPS: Record<Person, Partial<Record<DayKind, WarmupItem[]>>> = {
  kevin: {
    push: [PULL_APART, EXT_ROT, BICEPS_ISO, W('2–3 ramp-up sets before the main lift')],
    pull: [PULL_APART, EXT_ROT, BICEPS_ISO],
    legs: [
      W('5 min easy upright bike or incline walk'),
      W('Glute bridges 2x10', '/media/warmup-glute-bridge.mp4'),
      W('90/90 hip switches 2x8 per side', '/media/warmup-9090.mp4'),
      W('Bodyweight squats to your working depth 1x10'),
      W('No hard static hip-flexor stretching before lifting'),
    ],
  },
  emily: {},
}

export type CardioPlan = { label: string; hard?: boolean }
export const EMILY_CARDIO: Record<DayId, CardioPlan> = {
  pushA: { label: 'Intervals after lifting', hard: true },
  pullA: { label: 'Easy run, 20–30 min' },
  legs1: { label: 'Easy run or none' },
  pushB: { label: 'Intervals after lifting', hard: true },
  pullB: { label: 'Easy run' },
  legs2: { label: 'Easy run or none' },
}
export const SUNDAY_CARDIO = 'Optional standalone intervals'

export type CardioKind = 'int-8x1' | 'int-4x4' | 'int-10x30' | 'easy' | 'none'
export const CARDIO_OPTIONS: { id: CardioKind; label: string; sprint?: boolean }[] = [
  { id: 'int-4x4', label: '4 × (4 min hard / 3 min easy)' },
  { id: 'int-8x1', label: '8 × (1 min hard / 2 min easy)' },
  { id: 'int-10x30', label: '10 × (30 s sprint / 90 s walk)', sprint: true },
  { id: 'easy', label: 'Easy run' },
  { id: 'none', label: 'None today' },
]

export const PROGRAM_RULES = [
  'Hit all prescribed reps → add weight next time. Fail the same weight 3 sessions in a row → deload 10%.',
  '"5+" = AMRAP last set: stop 1–2 reps shy of failure.',
  'Warm up main lifts: empty bar → ~50% → 70% → 85%.',
  'Machines vary by brand: recalibrate the first session (>12 reps → heavier, <8 → lighter).',
  'Start conservatively on anything touching an injury.',
  'Sleep and protein matter a lot on a 6-day split. If it feels rough early, keep leg days light or skip the second one.',
  'Stop for sharp or joint pain. Normal soreness is fine.',
]

export const GLOBAL_NOTES: Record<Person, string[]> = {
  kevin: [
    'Right shoulder (biceps tendonitis): overhead pressing is the known trigger. Stop any lift at a pinch; use the swap.',
    'Hip flexor: no deep squats, no sprinting. Controlled depth everywhere.',
    'No hanging leg raises or sit-ups.',
  ],
  emily: [
    'NO crunches, sit-ups, hyperextended crunches, ab wheel or hanging leg raises.',
    'Roll onto your side and push up with your arms to get up from the floor or bed.',
  ],
}

export const HEALING_NOTES = [
  'Healing mode: no AMRAP sets (last set is a normal set) and no sprint intervals.',
  'Turn it off once getting out of bed, coughing and sneezing have been pain-free for ~2 weeks. Then bring back AMRAP first, then full side planks, then sprints, one at a time.',
]

export type DoctorBox = { title: string; items: string[]; urgent?: string[] }
export const DOCTOR: Record<Person, DoctorBox[]> = {
  kevin: [
    {
      title: 'Shoulder: see a doctor if',
      items: [
        'Pain doesn’t improve with modified training, or keeps coming back',
        'Night pain, weakness lifting the arm, or growing snapping/catching',
        'Pinching continues even on the swapped exercises → physio',
      ],
      urgent: ['A sudden pop followed by a “Popeye” bulge in the upper arm (possible tendon rupture)'],
    },
    {
      title: 'Hip: see a doctor or physio if',
      items: [
        'Pain persists after a few weeks, or the hip gets harder to move',
        'A limp, pain at night or at rest, or catching/locking/clicking deep in the groin',
        'It keeps recurring: a diagnosis changes how it’s managed',
      ],
    },
  ],
  emily: [
    {
      title: 'Abdomen: see a doctor if',
      items: [
        'A bulge or lump in the groin, upper thigh or belly, especially one that grows when you cough or strain and shrinks lying down (hernia, not a strain)',
        'A heavy, dragging feeling in the groin',
        'Pain or pulling during lifts, coughing or sneezing that isn’t improving',
        'Pain not improving, or worse, after 2–3 weeks',
      ],
      urgent: [
        'A bulge that won’t push back in, especially if tender, red or dark',
        'Sudden severe pain with nausea or vomiting, fever, or bloating',
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const DEFAULT_INCREMENT: Record<Load, number> = {
  barbell: 5,
  dumbbell: 5,
  machine: 5,
  bodyweight: 0,
}

/** Weight state key. Same exercise as main vs accessory keeps separate weights. */
export const stateKey = (variantId: string, main: boolean | undefined) =>
  main ? `${variantId}:main` : variantId

export function slotsFor(person: Person, dayId: DayId) {
  return DAYS[dayId].slots.filter((s) => s[person]).map((s) => ({ slot: s, cfg: s[person]! }))
}

export function schemeFor(slot: Slot, cfg: SlotPerson, variantId: string): Scheme {
  return cfg.variantScheme?.[variantId] ?? cfg.scheme ?? slot.scheme
}

export function incrementFor(cfg: SlotPerson, variantId: string): number {
  return cfg.increment ?? DEFAULT_INCREMENT[EXERCISES[variantId].load]
}

export const MAIN_LIFTS: { label: string; keys: Record<Person, string[]> }[] = [
  { label: 'Bench', keys: { kevin: ['bench:main'], emily: ['bench:main'] } },
  { label: 'Deadlift', keys: { kevin: ['deadlift:main'], emily: ['deadlift:main'] } },
  { label: 'Squat', keys: { kevin: ['back-squat:main'], emily: ['goblet-squat:main', 'bench-box-squat:main'] } },
  { label: 'Row', keys: { kevin: ['barbell-row:main'], emily: ['barbell-row:main'] } },
  {
    label: 'Shoulder press',
    keys: { kevin: ['machine-shoulder-press:main'], emily: ['seated-db-press:main'] },
  },
]
