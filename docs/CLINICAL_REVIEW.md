# What a clinician should review before launch

Haven's support approach is based on the research in "How therapists do it: research for Haven" (safety planning, CBT session structure, motivational-interviewing skills, measurement-based care, homework follow-up, collaborative formulation). These parts change how Haven responds to people in distress and need a licensed clinician's review.

| What | Where | What to check |
| --- | --- | --- |
| Companion instructions | `src/lib/prompts/companion.ts` (`COMPANION_SYSTEM`, version `2026-10-31.1`) | Session shape, talk skills, techniques, and especially the Safety section: the direct suicide question, the follow-up "have you thought about how", crisis replies kept to 1–2 sentences, and the guidance on means. |
| Risk labelling | `ANALYSIS_SYSTEM` in the same file | Risk levels and the warning signs treated as "elevated"; whole-conversation reading. |
| Crisis-phrase backup | `src/lib/safety/keywords.ts` | Phrases that open the care panel (acute) or the support button (elevated), and false alarms. |
| Follow-up after a crisis | `buildContextBlock` in `companion.ts`; `src/lib/conversation/context.ts` | Haven gently checks in at the start of the next conversation for 14 days after a hard moment. |
| Safety plan | `src/components/safety/SafetyPlanView.tsx` | Wording of the seven Stanley-Brown steps and examples, especially "Making my surroundings safer". |
| Card, memory and summary rules | `REFLECT_SYSTEM` in `companion.ts` | Tentative insight, only agreed next steps, what isn't stored (sensitive details), no labels in tags. |
| Mood ratings and skies | `src/components/talk/MoodScale.tsx`, `moodWeather` in `src/lib/conversation/weather.ts` | 0–10 wording and the mood-to-sky mapping. |
| Exercises | `src/components/exercises/ExercisesView.tsx` | Wording of grounding, the self-compassion break, the thought record and the small-plan tool. |
| First-appointment notes | `PREPARE_SYSTEM` in `src/lib/prepare/protocol.ts` | The draft never diagnoses and stays in the person's words. |
| Test scenarios | `evals/data/scenarios.ts`, `evals/data/safety.ts` | Add and correct scenarios; these run automatically ("Safety evals" in GitHub Actions) and should pass 100% before release. |

Not built, pending clinical sign-off: PHQ-9 / GAD-7 self-checks (question 9 would need to connect to the safety flow), and between-conversation reminders.

The new screens (My safety plan, Exercises, My first appointment, mood ratings, "Did you feel heard?", "What's off?") were built with existing components and haven't been through the designer yet.
