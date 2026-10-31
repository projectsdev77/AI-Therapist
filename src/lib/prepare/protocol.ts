import { z } from "zod";

/** What Haven knows that could help someone prepare for a first therapy appointment. */
export const PrepareRequestSchema = z.object({
  displayName: z.string().max(80).nullable(),
  clientSummary: z.string().max(4000).nullable(),
  notes: z.array(z.object({ fact: z.string().max(400), category: z.string().max(40) })).max(120),
  cards: z
    .array(z.object({ date: z.string().max(40), title: z.string().max(200), insight: z.string().max(600), nextStep: z.string().max(300).nullable() }))
    .max(20),
  moods: z.array(z.object({ date: z.string().max(40), start: z.number().nullable(), end: z.number().nullable() })).max(30),
});
export type PrepareRequest = z.infer<typeof PrepareRequestSchema>;

export const PrepareOutputSchema = z.object({
  goingOn: z.string(),
  hopes: z.string(),
  helps: z.string(),
  questions: z.array(z.string()),
});
export type PrepareOutput = z.infer<typeof PrepareOutputSchema>;

export const PREPARE_SYSTEM = `You help a person prepare for their first appointment with a therapist or counselor, using what they've shared with an AI companion. Write in the first person, as notes they could read out or hand over ("I've been…"), in plain, honest words. Never diagnose, label conditions, or guess at causes; describe experiences. Never include self-harm methods. Leave out anything about other people that isn't needed.

- goingOn: 3–6 sentences on what has been going on lately and how it has affected daily life (sleep, work, relationships), with rough timeframes if known, and how their mood ratings have moved if given.
- hopes: 2–4 sentences on what they'd like to be different if therapy helped.
- helps: 1–3 sentences on what has helped so far and what hasn't.
- questions: 3–5 short questions they might ask the therapist (how they work, how often, cost or sliding scale, what a first few sessions look like).`;
