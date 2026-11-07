# Program review: is the PPL as built good and safe?

_Reviewed 2026-11-07 against `src/program.ts`, `src/logic.ts`, `src/db.ts` (`useFinish`), `src/ExerciseCard.tsx`, and `docs/research.md` (section 8 wins over section 6). No code was changed._

> **Not medical advice.** This is a training-design review written to shape an app. Nobody here has had a formal diagnosis. The "see a doctor" boxes already in the app still apply, and anything they list overrides this document. Tags: **[reasoning]** means the author's own reasoning with no direct source; **[research.md]** means the point is already sourced there and isn't repeated here.

---

## Verdict

- **The structure is sound.** It follows the Reddit PPL closely: same days, the same main-lift schemes, and the same 3-fail / -10% rule. Weekly volume is in a reasonable beginner range for every muscle group, and push and pull are balanced. Dropping some arm and calf volume and adding core work is a fair trade.
- **Kevin: good, with one open risk.** He presses overhead twice a week (8 sets) on the movement that triggers his tendon. One of those slots is a main lift that the app pushes up +5 lb every week, and nothing in the app holds the weight when it pinches. The "safer" Push A swap (cable Y-raise) also raises the arm overhead.
- **Emily: good structure, but healing mode doesn't do what its name suggests.** It removes AMRAP sets and intervals, but the progression engine still suggests weekly load increases on her deadlift, row and squat. It also suggests **+10 lb a week on the Pallof press**, the one lift aimed squarely at the obliques. Her Push B DB press can get stuck repeating 15 lb → 20 lb → 15 lb, and her goblet squat is a poor main lift at 20 lb.
- None of this needs a redesign. It's about ten small edits, listed below.

---

## Weekly volume (working sets per week, one full rotation)

Counted from `DAYS` / `legsSlots`. A compound lift counts toward its main muscle groups. The Kevin and Emily columns are the totals from this program. The **Orig.** column is the original Reddit PPL, counted per its [archive](https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/).

| Muscle / pattern | Kevin | Emily | Orig. | Where it comes from |
|---|---|---|---|---|
| Chest (horizontal press) | 14 | 14 | 14 | bench main 5 + bench acc 3 + incline 3+3 |
| Overhead press (front delt) | **8** | 7 | 8 | Push A acc 3 + Push B main 5 (Emily: 4) |
| Front delt, all pressing | ~22 | ~21 | ~22 | the two rows above combined |
| Side delt (laterals) | 6 | 6 | 12 | 3+3 |
| Triceps (direct) | 6 | 6 | 12 | pushdown 3+3; original adds overhead extension |
| Lats (vertical pull) | 6 | 6 | 6 | pulldown 3+3 |
| Upper back (rows) | 11 | 11 | 11 | BB row 5 + cable row 3+3 |
| Rear delt / cuff (face pull) | 8 | 8 | 10 | 4+4 |
| Biceps (direct) | 6 | 6 | 16 | curl 3+3 |
| Quads | 12 | 12 | 12 | squat 3+3 + leg press 3+3 |
| Hamstrings / hinge | 13 | 13 | 13 | deadlift 1 + RDL 3+3 + leg curl 3+3 |
| Calves | 6 | 6 | 10 | 3+3 |
| Core | 12 | **24** | ~0–6 | dead bug + Pallof 3+3 each; Emily adds bird dog + side plank 3+3 each |
| **Push : pull total** | 34 : 32 | 33 : 32 | — | balanced |
| **Total sets per week** | ~108 | ~119 | ~124 | |

**Reading the table**
- The big compound patterns get 11–14 sets a week: chest, rows, quads and hinge. In the dose-response meta-analysis, 10+ weekly sets per muscle produced more growth than fewer sets ([Schoenfeld et al. 2017](https://doi.org/10.1080/02640414.2016.1210197)).
- Lats, side delts, direct biceps and triceps, and calves sit at 6 direct sets. Arms also get indirect work from the presses and pulls, and for beginners 6 is acceptable to start. N4 covers adding more later.
- Nothing is over-dosed in absolute terms. The exception is **overhead pressing for Kevin**: 8 sets isn't high in general, but it's high *for the movement that triggers his tendon*.
- Each muscle is trained twice a week, which matches ACSM's per-muscle frequency for novices. ACSM's "2–3 days/week" applies to total-body sessions; a split spreads the same per-muscle frequency over more days ([ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/)).
- Six days is demanding but realistic. `PROGRAM_RULES` already allows skipping the second leg day.
- **Two identical leg days** match the original ([archive](https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/)) and are fine.
- **Exercise order** is correct: main lift first, then compounds, isolation, and core last.

---

## Findings

### Critical

**C1. Emily's (and Kevin's) Pallof press goes up +10 lb a week, including during healing.**
- **What's wrong:** The Pallof slot is `S(3, 10)` (fixed reps), `load: 'machine'`, so the default increment is +5. `evaluate` returns `up` every time 3×10 is completed. `legs1` and `legs2` share `legsSlots`, so both legs days feed the same state key (`pallof-press`), giving +5 twice a week: 10 → 50 lb in about 4 weeks. Emily's card says "keep it light", but the app suggests the opposite. This is the anti-rotation exercise that loads the obliques **[research.md]**, the likely injured tissue.
- **Who:** Emily (injury risk); Kevin (just too fast).
- **Fix:** `program.ts`, `legsSlots` → `pallof`:
  - change the slot scheme `S(3, 10)` → `S(3, 10, 15)`, so it progresses by reps first;
  - set `emily: { ..., increment: 0 }` while healing. Increment 0 always returns `hold`. Change it to 2.5 after healing mode ends.
  - Kevin: `increment: 2.5` (or keep 5 now that the range is 10–15).
- **Source:** Return should be symptom-guided ([Johnson 2006](https://pubmed.ncbi.nlm.nih.gov/16529681/)). A twice-weekly fixed-rep auto-increment isn't symptom-guided **[reasoning]**.

**C2. Healing mode doesn't affect load progression.**
- **What's wrong:** Healing mode only hides the AMRAP label and adds `healingWarnings`. `useFinish` → `evaluate` never checks it, so Emily still gets +5 suggestions every session on the deadlift (115 → 135 in about 4 weeks), barbell row, goblet squat (twice a week) and RDL. research.md said "keep the weight… progress only after a pain-free session and a pain-free next day". With pain logging dropped (section 8), nothing implements that rule.
- **Who:** Emily.
- **Fix:** the cheapest version, with no pain log needed:
  - `db.ts` `useFinish`: pass `healing` in. When it's true and `ev.outcome === 'up'`, store the suggestion but show it in `ExerciseCard` with a confirm line: "Only take this if today and yesterday were pain-free."
  - Simpler still: during healing, cap the `up` outcome to every other session for Emily's main lifts.
- **Source:** Intra-abdominal pressure rises with load and effort ([Hackett & Chow 2013](https://pubmed.ncbi.nlm.nih.gov/23222073/)). Return should be symptom-guided ([Johnson 2006](https://pubmed.ncbi.nlm.nih.gov/16529681/)).

**C3. Kevin: two overhead slots on his known trigger, an auto-progressing main lift, no pain gate, and an overhead "safe" swap.**
- **What's wrong:** This was Kevin's informed decision (research.md §8), so this finding doesn't reverse it. It is the program's largest remaining injury risk:
  - **8 overhead sets a week:** Push A 3×8–12 plus Push B 5×5.
  - Overhead lifting is the classic aggravator for long-head biceps tendinitis ([AAOS](https://www.orthoinfo.org/en/diseases--conditions/biceps-tendinitis/)).
  - The main lift adds +5 every successful week, and on a machine stack +5 can be +17% (30 → 35). The app has no way to hold the weight when it pinches.
  - The Push A fallback, **cable Y-raise**, raises the arm into a Y (about 120–135° of elevation). That is an overhead position, so it isn't the non-overhead exit the warning suggests **[reasoning]**.
  - Front delts already get about 14 sets a week from bench and incline, so the Push A overhead slot adds little that's needed **[reasoning]**.
- **Who:** Kevin.
- **Fix:** the minimum that keeps his decision.
  - **Push A `shoulder-acc`, Kevin:** make one overhead exposure a week the default.
    - Simplest: delete the `kevin` block from the Push A `shoulder-acc` slot. `slotsFor` filters on `s[person]`, so the slot just disappears for him. He keeps 1 overhead slot (Push B) and about 14 front-delt sets from bench and incline.
    - **Don't** add `lateral-raise` as a variant here. Accessory state is keyed by variant ID (`stateKey(variant, undefined)`), so it would collide with `lateralSlot`'s `lateral-raise` on the same day: shared weight, double evaluation, and the wrong 8–12 scheme. If you want an exercise in this slot, it needs an ID not used elsewhere on Push A.
    - Remove `cable-y-raise` as a "pinch exit", or relabel it "light scapular work, *not* a pressing substitute".
  - **Push B `press-main`, Kevin:** add `increment: 2.5`. If the stack can't do 2.5, use a magnetic add-on plate or progress by repeating the weight. Change the warning to: "Two sessions in a row with any pinch → switch to incline bench for 2 weeks." That gives him a manual pain gate in place of the dropped pain log.
- **Source:**
  - AAOS (above).
  - Pain-monitored loading is the evidence-based model **[research.md: Silbernagel]**.
  - Load increases should be 2–10% ([ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/)).

### Should fix

**S1. Emily's Push B DB press repeats 15 → 20 → 15 indefinitely.**
- **What's wrong:** The slot is `S(4, 6, 10)`, main, with a dumbbell increment of 5 (per DB):
  - 4×10 at 15 lb suggests 20 lb, a **+33%** jump.
  - Someone who just managed 10 reps at 15 lb will typically get about 4–6 reps at 20 lb **[reasoning]**, which counts as a "fail".
  - After 3 fails, the deload is `roundDown(20 × 0.9 = 18, 5)` = **15**, back where she started, and the loop repeats.
  - More generally, `roundDown` makes every light-load deload larger than 10%. Kevin's machine press goes 30 → 25 (-17%).
- **Who:** Emily (the main lift most likely to stall); also her seated DB press accessory and chest-supported row.
- **Fix:**
  - (a) Set `increment: 2.5` on Emily's `press-main`, and get fractional jumps either from 17.5 lb DBs or from 1.25 lb magnetic plates on each DB.
  - (b) If 2.5 isn't possible, widen the range to `S(3, 8, 15)`. An 8–15 span covers only about a 1.2x load ratio, so this narrows the gap without closing it. The real fix is (a).
  - (c) `logic.ts` deload: `Math.max(MIN_WEIGHT[load], Math.min(weight - increment, Math.round(weight * 0.9 / increment) * increment))`. Keep the existing floor. On barbells this gives about -10% (115 → 105, not 100), and it always drops by at least one step.
- **Source:** ACSM's 2–10% load increase ([ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/)). StrongLifts' 2.5 lb press jumps for women **[research.md]**.

**S2. Light DB accessories make 33–100% jumps, and the app never suggests going back down.**
- **What's wrong:**
  - The jumps: lateral raise 5 → 10 (+100%); Emily's incline DB press and curls 10 → 15 (+50%); Kevin's 15 → 20 (+33%); face pull 15 → 20.
  - After the jump, the sets drop below the bottom of the range and `evaluate` returns `fail`. Accessories never deload, so the app keeps showing the heavier weight indefinitely.
  - The original's accessory rule is "if you can't stay in 8–12, reduce the weight" ([archive](https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/)).
- **Who:** both, mostly Emily.
- **Fix:**
  - `logic.ts`: for `!main`, when `nextFails >= 2`, return `{ suggested: weight - increment, fails: 0, outcome: 'deload' }` (reduce one step).
  - `program.ts` `lateralSlot`: set `increment: 2.5` for both if 7.5 lb DBs exist. Otherwise use cable laterals (a single-handle cable can go up in small steps). No rep range can absorb a doubled DB: 12–25 reps spans only about a 1.2x load ratio **[reasoning]**.
  - Emily `inclineSlot` / `curl`: `increment: 2.5` if the gym has 12.5s.
- **Source:** archive (above); ACSM 2–10% (above).

**S3. Emily's goblet squat at 20 lb is a poor 5-rep main lift.**
- **What's wrong:**
  - She deadlifts 115, so 20 lb for 5 reps is far below her capacity.
  - Each DB step is +25% at first.
  - The goblet squat is limited by how much she can hold, so low reps on it don't build much.
  - ACSM's novice loading is 8–12 RM ([ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/)).
- **Who:** Emily.
- **Fix:** `legsSlots` → `squat` → `emily`:
  - add `variantScheme: { 'goblet-squat': S(3, 8, 12) }` and start at 30 (calibrate in the first session);
  - keep `bench-box-squat` on the 2×5, 1×5+ scheme, and make it the default once healing mode is off. The barbell gives 5 lb jumps on a 45+ base.
  - `MAIN_LIFTS` already tracks both keys.
- **Source:** ACSM (above).

**S4. Healing defaults should be the regressions, not just warnings about them.**
- **What's wrong:** For Emily, the first variant is the default:
  - `side-plank` → `['side-plank', 'kneeling-side-plank']`
  - `dead-bug` → `['dead-bug', 'heel-tap-dead-bug']`
  - `row` → `['barbell-row', 'chest-supported-row']`

  So in healing mode she sees the full version plus a note telling her to use something else.
- **Who:** Emily.
- **Fix:**
  - Reorder Emily's variants to `['kneeling-side-plank', 'side-plank']` and `['heel-tap-dead-bug', 'dead-bug']`. Change them back after healing.
  - Row: make `chest-supported-row` the default while healing, and add `'chest-supported-row:main'` to `MAIN_LIFTS.Row.keys.emily`.
  - Note the chest-supported row has the same 5 lb/DB jump problem as S1, so give it `increment: 2.5`.
- **Source:**
  - The full side bridge is a strengthening-level load for the obliques ([Ekstrom 2007](https://pubmed.ncbi.nlm.nih.gov/18560185/)).
  - The bent-over row produced the **largest lumbar spine load and highest spine stiffness** of the rows tested ([Fenwick, Brown & McGill 2009](https://pubmed.ncbi.nlm.nih.gov/19197209/)). That is a trunk co-contraction demand the chest-supported row removes. Extending this to an ab strain is **[reasoning]**.

**S5. Missing or incorrect warnings.**
- **Kevin, back squat (`legsSlots` → `squat` → `kevin.warnings`):**
  - Problem: the warnings only cover the hip. Holding the bar puts the right shoulder in abduction and external rotation.
  - Add: "Shoulder: wide, comfortable grip, high bar. If holding the bar hurts the front of the shoulder, use goblet squat today." **[research.md §3]**
- **Goblet squat exercise cue (`EXERCISES['goblet-squat'].cues`):**
  - Problem: the shared cue "Sit between your heels" encourages deep hip flexion. Kevin's slot warnings already show on this variant, but the cue contradicts them.
  - Fix: change the cue to "Squat to your working depth, chest up" **[reasoning; deep-flexion limit per research.md §4]**.
- **Kevin, deadlift:**
  - Problem: there's no hip note. At 115 lb, a bar loaded with smaller-diameter iron 35s or 25s sits lower than standard height, which means a deeper hip-flexion start.
  - Add: "Until you're pulling 135 with 45s, set the bar on plates/blocks at standard height. If setup pinches the hip, raise it further." **[reasoning; blocks per research.md §4]**
- **Emily, `standing-db-press` (Push A acc and Push B main swap):**
  - Problem: a single-arm standing press is an anti-side-bend load on the obliques **[reasoning]**.
  - Add `healingWarnings: ['Ab strain: stay seated while healing.']`.
- **Emily, deadlift / RDL:**
  - Problem: the brace text is fine, but there's no specific instruction for healing mode.
  - Add `healingWarnings: ['Healing: keep this weight unless today and yesterday were pain-free.']`. This pairs with C2.

**S6. Gaps in the warm-ups.**
- **Problem:**
  - `WARMUPS.emily = {}`: she has no warm-up at all.
  - Kevin's pull day has no ramp sets or hip prep before a 1×5+ deadlift, and the deadlift is a single working set.
  - The global rule "empty bar → 50% → 70% → 85%" doesn't make sense at a 45 lb squat or a 50 lb bench.
- **Fix:** `program.ts` `WARMUPS`:
  - `emily.push`, `emily.pull`, `emily.legs` (all three): `W('5 min easy jog or bike')`, `W('Bird dog 1x5 per side, slow')`, `W('Glute bridges 2x10')`, `W('2–3 ramp-up sets before the main lift')`. For legs, add `W('Bodyweight squats 1x10')`.
  - `kevin.pull`: add `W('3 min easy bike')`, `W('Glute bridges 2x10')`, `W('Deadlift ramp: 2–3 sets of 5→3 building to your working weight')`.
  - `PROGRAM_RULES`: change the warm-up line to "Main lifts: 2–3 lighter sets of 5→3 building to the work weight. Under ~95 lb, 1–2 sets with the empty bar is enough."
- **Source:**
  - Warm-ups improve performance in about 79% of criteria studied, with little evidence of harm ([Fradkin et al. 2010](https://pubmed.ncbi.nlm.nih.gov/19996770/)).
  - The original uses ramp sets of the lift itself ([archive](https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/)).

**S7. Healing mode's exit criteria are vague, and turning it off restores everything at once.**
- **Problem:**
  - `HEALING_NOTES` says to bring things back "one at a time", but the toggle is all-or-nothing. Turning it off restores AMRAP, the full side plank (if she reorders per S4) and every interval option on the same day.
  - The exit criterion checks daily life only. There's no lifting check.
  - There's no step timing and no rule for going back a step.
- **Fix:**
  - `HEALING_NOTES[1]` → "Turn it off when ALL of these are true:
    - (1) getting out of bed, coughing and sneezing have been pain-free for 2 weeks;
    - (2) your current deadlift, row and Pallof weights feel pain-free during the session and the next day.

    Then bring back one item **per week**: AMRAP → full side plank → 4×4 intervals → sprints. Any pain → go back one step. Not pain-free in daily life by week 3 → see a doctor (see the Abdomen box)."
  - Later, replace the boolean with a `healing_stage` of 0–4.
- **Source:** Symptom-guided return ([Johnson 2006](https://pubmed.ncbi.nlm.nih.gov/16529681/)). Dropping back a level when pain returns is the AAOS strain principle **[research.md §4]**.

**S8. Starting weights.**
- **Identical starting weights:** Kevin and Emily have the same deadlift (115), RDL (65), barbell row (55) and leg press (90). These look like placeholders, not individual numbers.
- **Kevin's starts look light:** bench 60, row 55, squat 45. For a beginner male, light is fine. But bench, deadlift, row and press each run once a week, so they only rise +5 a week. Starting 30–40% low wastes 1–2 months.
- **Emily's row (55) and deadlift (115):** these are plausible, but keep them, don't raise them, while healing (see C2).
- **Kevin's machine press (30):** sensible as a light start on the trigger. Keep it.
- **Fix:**
  - Use the original's day-1 ramp test for the non-injured main lifts: Kevin's bench, deadlift, row and squat, and Emily's bench. Work up in sets of 5 from the empty bar until bar speed slows, then take 5 lb off ([archive](https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/)).
  - For Kevin's squat, cap the test at the depth-limited, pain-free weight.
  - `PROGRAM_RULES` line "Machines vary by brand… (>12 reps → heavier, <8 → lighter)": this rule only fits 8–12 slots. Add: "On 5-rep main lifts: pick a weight you could do ~8 times."

**S9. A skipped set counts toward a deload.**
- **Problem:** In `evaluate`, `anyBelowMin = … || !allDone`. If someone cuts a set for time or for a pinch, that counts the same as a failed rep, and three of those deload the lift. That's different from research.md O4 (off days).
- **Fix:** `logic.ts`: when `!allDone` but every logged set hit `min`, return `hold` with `fails` unchanged, not `fail`.

### Nice to have

- **N1. Calf raise starts at 0 lb on a `machine` load.**
  - Problem: 3×15 at bodyweight is easy, and "+5" means different things on a step and on a leg-press sled.
  - Fix: split it into `calf-raise-step` (dumbbell load, start 0, use single-leg once 3×15 is easy) and `calf-raise-machine`, or give it `increment: 10` with a sled note **[reasoning]**.
- **N2. Bodyweight and timed items never progress (increment 0 → `hold`).**
  - Problem: that's fine during healing, but there's no progression path afterwards.
  - Fix: add a cue line such as "When 3×max is easy two sessions running, move to the next variant (heel taps → full dead bug; kneeling → full side plank)."
- **N3. Emily's Sunday "optional standalone intervals" uses up her only rest day.**
  - Problem: with intervals on both push days, that's 3 hard sessions plus 6 lifting days.
  - Fix: `SUNDAY_CARDIO = 'Rest. Easy walk if you want.'` The card already says "max 2–3 hard sessions a week" **[reasoning]**.
- **N4. Bring some original volume back once settled:** laterals back to the original's 6 sets per push day, and hammer curls 3×8–12 on one pull day. This is research.md O5, still valid.
- **N5. Kevin's deadlift** could use +10 lb jumps while sets move fast. This is research.md O2. It was declined and is low priority.
- **N6. Kevin has no aerobic work.** That's fine for the program, but adding 2–3 × 20 min incline walks on non-leg days costs little and doesn't stress the hip **[research.md §4 cardio options]**.

---

## Logic check by lift type

| Lift | Scheme / step | Behaviour | Verdict |
|---|---|---|---|
| Squat 2×5, 1×5+ | fixed 5, +5, twice a week (shared key) | +10 lb a week while all sets hit 5; the AMRAP set doesn't speed things up | Works. Matches the original. |
| Deadlift 1×5+ | fixed 5, +5, once a week | One bad set counts as a fail. 3 → -10% via `roundDown` (115 → 100, -13%). | Works. The deload is a bit deep (S1c). |
| Bench / row 4×5, 1×5+ | +5 (Emily bench +2.5) | Linear, once a week | Works |
| Kevin machine press 5×5 | +5 machine | The stack step may be 10 lb or more; no pain gate | See C3 |
| Emily DB press 4×6–10 | +5 per DB | +33% jump; the deload rounds back to the start | **Loops** (S1) |
| Light-DB accessories | +5 per DB | +33–100% jumps; never reduces | **Stalls** (S2) |
| Pallof 3×10 | fixed, +5 machine, twice a week | +10 lb every week | **Over-progresses** (C1) |
| Calf raise from 0 | +5 machine | Ambiguous meaning | N1 |
| Bodyweight / timed | increment 0 | Always `hold` | Safe; no progression path (N2) |
| Deload floor | barbell 45, others 0 | Empty bar never deloads further (`suggested: null`). Correct. | OK |
| Fail counting, rep ranges | below min or a missing set = fail; within range = reset | Reset on `hold` is right. Missing set = fail is too strict (S9). | Mostly OK |

---

## Things that are good and should stay

- **Kevin's specific shoulder choices:**
  - double overhand → hook deadlift grip, never mixed;
  - overhand/neutral pulldown and row grips;
  - hammer-curl fallback;
  - no overhead triceps work;
  - incline at 15–30°;
  - floor-press and neutral-DB bench swaps.

  All consistent with research.md.
- **Kevin's hip:** squat to just above parallel with safety pins as a depth marker; leg-press depth note; heel-tap dead bug option; no running; leg-day warm-up with no pre-lift static stretching.
- **Emily's healing basics:** no AMRAP, intervals blocked, 4×4 before sprints, the "roll onto your side" cue, the crunch and ab-wheel ban, and the hernia red-flag box.
- **The rest of the progression and tracking setup:**
  - Rest guidance is already on every card: about 3 min on the main lift, 90 s on accessories (`ExerciseCard.tsx`). That's in line with the original's 3–5 min / 1–3 min ([archive](https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/)).
  - Per-exercise weight-jump buttons (2.5 / 5 / 10) already exist. Several fixes above can be applied in-app today, without a code change, by tapping 2.5.
  - Separate weights per variant and for main vs accessory.
  - Suggestions are only suggestions: the lifter has to tap them.
  - The 3-fail / 10% rule matches the original and StrongLifts **[research.md]**.

---

_Not medical advice. Kevin's shoulder and hip, and Emily's abdomen, have not been examined by a clinician. If pain persists, keeps coming back, or matches any red flag in the app's doctor boxes, see a GP, sports-medicine doctor or physio before following any of the above._
