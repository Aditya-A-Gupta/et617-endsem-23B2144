# et617-endsem-23B2144
# DESIGN.md - ET617 End-Sem

## 0. Identity card
- Roll no: **23B2144**
- Card: **P5** Inquiry-based virtual laboratory · **T1** Simple pendulum: length, mass, amplitude vs period (Cl. 9–11) · **L6** High-achieving Olympiad learner, bored by routine practice · **C4** 10-minute sessions
- App: `et617-23b2144.vercel.app` · Repo: `et617-endsem-23B2144`
- App name: **Pendulum Lab: Break the Rule**

## 1. Educational problem (D1)
Olympiad aspirants usually learn T = 2π√(L/g) as a formula to memorise and plug numbers into. They rarely test *why* mass does not matter, why period depends on √L and not L, or when the formula stops working (large amplitude). Routine practice problems bore them, so they skim and keep partial, untested beliefs. This app turns the pendulum into a short inquiry lab: the learner predicts, experiments, and revises their hypothesis, then faces an Olympiad-style extension. The whole sequence fits in one 10-minute sitting.

**Learning outcomes** (by the end of one session the learner can):
1. **Predict** the new period when length is changed by a given factor (e.g. ×4 gives ×2).
2. **Explain**, using controlled-variable evidence from their own trials, why mass and (small) amplitude do not change the period.
3. **Compare** results at small and large amplitude to **judge** when T = 2π√(L/g) is a valid model.

**Context of use:** Evening, ~10 minutes between study blocks, on a phone or laptop browser, in English, alone.

## 2. Learner persona (D2)
- **Name/age:** Meera Iyer, 16, Class 11, preparing for INPhO (Physics Olympiad).
- **Prior knowledge:** Comfortable with proportionality, square roots, graph plotting, and SHM definitions. Knows T = 2π√(L/g) as a formula but has never tested it.
- **Misconceptions:**
  - **M1: "Heavier bob swings faster (or slower)."** Intuition from heavier things falling or pushing harder.
  - **M2: "Period is directly proportional to length"** (quadruple L, quadruple T). Linear thinking carried over from other proportional relations.
  - (Extension, not a diagnosed misconception: assuming the formula holds at any amplitude.)
- **Device/time:** Phone or laptop, about 10 min in short slots.
- **Language:** English, technical vocabulary is fine.
- **Motivation:** Wants Olympiad-level insight, hates drill. Responds to challenge, "gotchas" and precision.

## 3. Learning activity and content plan (D3)

### Concept explanation (conversational, key points boxed)
"Let us find out what a pendulum's swing time really depends on. **Period T** is the time for one full back-and-forth swing. **Three things could matter: length L, mass m, amplitude θ.** We'll test them one at a time. To keep it fair, we change **only one** and hold the others fixed. First, make a prediction."

### Session plan (≈10 min, C4)
| Step | Time | Activity | Format |
|---|---|---|---|
| 1 | 1 min | Diagnostic prediction | Multiple choice |
| 2 | 2 min | Mass experiment | Run lab + record |
| 3 | 3 min | Length experiment, T² vs L graph | Numeric prediction + graph |
| 4 | 2 min | Amplitude challenge (5° → 60°) | Explain in words |
| 5 | 2 min | Olympiad extension: "A clock runs slow, what do you change?" | Short answer |

### Tasks, model answers, feedback
**Task 1 (MCQ, prediction).** "A 1 kg and a 3 kg bob hang from identical 1 m strings. Which has the shorter period?" (a) 1 kg (b) 3 kg (c) same (d) depends on amplitude.
- *Model:* (c) same.
- *Correct feedback:* "Right, and now let us prove it. Mass cancels because both gravity's pull and the bob's inertia scale with m."
- *M1 feedback (a or b):* "Many people expect that! Gravity pulls harder on the heavy bob, but it is also harder to accelerate. Do these cancel? Let's test it, run both masses and compare."

**Task 2 (run lab, record).** Swing at the same L and amplitude with m = 0.5, 1, 2 kg. Time 10 oscillations each.
- *Model:* T ≈ 2.0 s each for L = 1 m (differences are only measurement noise).
- *Correct feedback:* "Same T within error, so mass is not a factor."
- *M1 feedback (learner still claims mass matters):* "Look at your 3 trials. By how much do they differ? Is that bigger than your reaction-time error (~0.2 s per 10 swings)?"

**Task 3 (numeric prediction).** "At L = 1 m, T ≈ 2.0 s. Predict T when L = 4 m." Then run it.
- *Model:* ≈ 4.0 s (T ∝ √L).
- *Correct feedback:* "Exactly, ×4 length gives ×2 period."
- *M2 feedback (answer 8 s):* "You predicted ×4. The lab gave 4.0 s. What does that say about 'T ∝ L'? Plot T² against L. What shape do you get?"

**Task 4 (graph interpretation).** The learner sees T vs L (curved) and T² vs L (straight). "Which graph shows a direct proportion, and what does the slope equal?"
- *Model:* T² vs L, slope = 4π²/g ≈ 4.03 s²/m, so g ≈ 9.8 m/s².
- *Correct feedback:* "Slope gives g. You just measured gravity with a string."
- *M2 feedback (picks T vs L):* "Is that line straight? Straight means proportional. Which axis pairs give a straight line?"

**Task 5 (explanation, free text + Olympiad extension).** "At 60° amplitude the lab shows T ≈ 2.15 s instead of 2.0 s. Explain, and say when the formula is safe to use."
- *Model:* Formula assumes sin θ ≈ θ (small angles, ≲ 15°). At 60° the restoring force is weaker than the linear approximation, so T is ~7% longer.
- *Correct feedback:* "Exactly. The formula is a small-angle approximation."
- *Partial feedback:* "You noticed the change. What approximation did we make when deriving T = 2π√(L/g)? Check sin θ vs θ at 60°."

## 4. Lab design (P5 core)
- **Manipulable variables:** length (0.25–4 m), mass (0.5–5 kg), amplitude (5°–80°). g fixed at 9.8 (optional planet toggle later).
- **Inquiry loop:** *Hypothesis → Experiment → Result → Revise hypothesis.* Before each run the learner writes or selects a hypothesis. After the run, they mark it "supported / not supported / unclear" and edit it.
- **Tools (beyond generic):** stopwatch with 10-oscillation timer, results table, T vs L and T² vs L graph plotter, calculator, "variables changed" tracker.
- **Response to choices:** the sim animates the actual pendulum from the physics (exact numerical solution, so large-angle effects are real, not scripted).

## 5. Design challenge: learning from an unsuccessful experiment (no answer reveal)
**Failed experiment example.** Meera changes mass **and** length together (m: 1→3 kg, L: 1→2 m), sees T go up, and concludes "heavier means longer period".
**Support (never states the answer):**
1. **Variables tracker** highlights: "You changed 2 things between trial 1 and 2."
2. **Question prompt:** "Which change might have caused the new period? Design a trial that separates them."
3. **Locked-variable mode** offered: the lab locks length and lets her re-run with mass only.
4. She revises her hypothesis herself. The system only reveals the result of *her* new trial.
Other failures handled the same way: timing a single swing (prompt: "How can you reduce reaction-time error?" → time 10 oscillations), or comparing only two data points.

## 6. C4 constraint: 10-minute sessions
- A **progress bar and time estimate** ("≈ 7 min left") are visible on every screen.
- Each step is a self-contained "checkpoint". State (step, trials, hypotheses, answers) is saved to `localStorage` after every action.
- **Stop and resume:** a "Save & pause" button. On return: "Welcome back, you were at Step 3 (Length experiment). Resume?"
- If the learner runs out of time, a short summary of what was learned and the next step is shown.

## 7. Adaptivity (profile + performance + interaction)
- **Profile:** Task 1 diagnostic. If correct on the first try *and* confident, skip the guided Step 2 and show the "Olympiad challenge" path (less hand-holding, harder tasks).
- **Performance:** a wrong answer that matches M1 or M2 routes to the specific targeted experiment. Two correct answers in a row unlock the harder extension (large-amplitude or "find g from your data").
- **Interaction:** hints requested, repeated identical runs, and time per step are logged. Three hint requests on one task triggers a simpler worked example.

## 8. Screen map (D4) (footer on all screens: roll no.)
1. **Welcome/Resume:** pick Start or Resume, time estimate. → 2
2. **Diagnostic prediction (Task 1).** → 3a (guided) or 3b (challenge path)
3. **Lab bench:** controls, pendulum animation, stopwatch, results table. Used in Tasks 2, 3, 5.
4. **Graph and analysis (Task 4):** T vs L and T² vs L.
5. **Explain and extend (Task 5):** free-text answer with feedback.
6. **Session summary:** outcomes achieved, misconceptions addressed, "Save and continue later".
7. **About:** identity card, tools used, AI disclosure.

## 9. Feedback and AI functionality (D6 preview)
**No API keys are used (not permitted).** The app makes no external calls. All feedback runs in the browser as rule-based logic, and is labelled "Rule-based feedback" on screen.

| Feature | Input | Output | Check | If it fails or is wrong |
|---|---|---|---|---|
| **Explanation evaluator** (Task 5) | Learner's text | `{label: correct/partial/other, feedback}` from keyword rules for the small-angle idea | Fixed label set; prewritten feedback that asks a guiding question for partial/other | The "other" label asks the learner to re-read their two trials |
| **Failed-experiment coach** | Which variables changed between two trials | A guiding question naming the changed variables | Fires only when 2 or more variables changed; never states the physics result | Offers a locked re-run changing one variable |

AI tools (an LLM chat assistant) were used at design time to help draft the content, misconceptions and feedback text. Every such chat is listed in the report's AI-use log.

## 10. Two scenarios (D5)
- **(a) Correct learner:** Task 1 correct → Step 2 skipped/shortened → predicts ×2 for 4× length → unlocks the large-amplitude extension.
- **(b) M1 learner:** picks "heavier swings faster" → forced to run the mass experiment → sees equal periods → revises hypothesis → Task 1 variant re-asked.
  (M2 learner, as a secondary path: predicts 8 s → T² vs L graph prompt.)

## 11. Evaluation plan (D8)
- **Outcome 1 (predict):** 3 new prediction items (e.g. L ×9, ×0.25). Success: ≥ 2/3 correct, within 5%.
- **Outcome 2 (explain):** rubric (identifies controlled variable + cites own data). Success: ≥ 3/4 rubric points.
- **Outcome 3 (compare/judge):** transfer item at 45° and 5°. Success: correctly states formula validity.
- **Logs:** variables changed per trial, number of trials, hint requests, time per step, misconception label per answer, resume events.
- **Overall success:** ≥ 70% of learners meet outcomes 1 and 2, and the M1/M2 rate drops from pre- to post-test.

## 12. Process plan
- DESIGN.md committed by 0:30 · first deploy by 1:00 · commit every ≤ 30 min.
- Tools: plain HTML/CSS/JS (no framework, no build step), hosted on Vercel, no external APIs. No course-project code reused.
