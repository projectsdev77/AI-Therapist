"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Button } from "@/components/ui/Button";
import { BackIcon, BreatheIcon, CheckIcon, CloseIcon } from "@/components/ui/icons";
import { MoodScale } from "@/components/talk/MoodScale";

/**
 * Guided exercises drawn from therapy: grounding, a self-compassion break, a thought record
 * (CBT), and a small plan (behavioural activation), next to Breathe. Everything stays on this device.
 */

type ExerciseId = "grounding" | "compassion" | "thought" | "plan";

const LIST: { id: ExerciseId | "breathe"; title: string; when: string; minutes: string }[] = [
  { id: "breathe", title: "Breathe", when: "When you feel tense or your thoughts are racing", minutes: "2–5 min" },
  { id: "grounding", title: "5-4-3-2-1 grounding", when: "When you feel panicky or far away", minutes: "3 min" },
  { id: "compassion", title: "Self-compassion break", when: "When you're being hard on yourself", minutes: "3 min" },
  { id: "thought", title: "Look at a thought", when: "When one thought keeps hurting", minutes: "10 min" },
  { id: "plan", title: "Plan one small thing", when: "When you feel low or stuck", minutes: "5 min" },
];

const input =
  "w-full rounded-sm border border-edge-hi bg-field px-4 py-3 text-base text-text placeholder:text-faint focus:border-[rgba(143,240,232,.6)] focus:outline-none";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: nothing is kept */
  }
}

export function ExercisesView() {
  const [open, setOpen] = useState<ExerciseId | null>(null);
  const current = LIST.find((e) => e.id === open);

  return (
    <PageShell title={current?.title ?? "Exercises"} subtitle={open ? undefined : "Short exercises therapists use, for hard moments and everyday ones. Nothing here leaves this device."}>
      {!open ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {LIST.map((e) => {
            const inner = (
              <>
                <span className="flex flex-1 flex-col">
                  <span className="text-[17px] font-semibold">{e.title}</span>
                  <span className="text-[14px] text-muted">{e.when}</span>
                </span>
                <span className="text-[13px] whitespace-nowrap text-faint">{e.minutes}</span>
              </>
            );
            const cls =
              "press flex min-h-[72px] w-full items-center gap-3 rounded-md border border-edge-hi bg-glass px-4 py-3 text-left text-text no-underline hover:bg-glass-strong hover:text-text";
            return (
              <li key={e.id}>
                {e.id === "breathe" ? (
                  <Link href="/breathe" className={cls}>
                    <BreatheIcon size={20} className="text-accent-strong" />
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={() => setOpen(e.id as ExerciseId)} className={cls}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <button type="button" onClick={() => setOpen(null)} className="press flex min-h-10 items-center gap-1 self-start rounded-pill pr-3 pl-1 text-[15px] text-muted hover:text-text">
            <BackIcon size={18} />
            All exercises
          </button>
          {open === "grounding" && <Grounding onDone={() => setOpen(null)} />}
          {open === "compassion" && <Compassion onDone={() => setOpen(null)} />}
          {open === "thought" && <ThoughtRecord />}
          {open === "plan" && <SmallPlan />}
        </>
      )}
    </PageShell>
  );
}

/** Step-through card used by the short guided exercises. */
function Steps({ steps, onDone }: { steps: { title: string; body: ReactNode }[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = steps[i];
  return (
    <section aria-live="polite" className="flex flex-col gap-4 rounded-lg border border-edge-hi bg-glass p-5">
      <span className="text-[13px] text-faint tabular-nums">
        {i + 1} of {steps.length}
      </span>
      <h2 className="m-0 text-[22px] leading-[1.25] font-semibold tracking-[-0.02em]">{step.title}</h2>
      <div className="text-[16px] text-muted">{step.body}</div>
      <div className="flex gap-2">
        {i > 0 && (
          <Button variant="tertiary" onClick={() => setI(i - 1)}>
            Back
          </Button>
        )}
        {i < steps.length - 1 ? (
          <Button variant="primary" onClick={() => setI(i + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="primary" onClick={onDone}>
            I&apos;m done
          </Button>
        )}
      </div>
    </section>
  );
}

function Grounding({ onDone }: { onDone: () => void }) {
  const senses = [
    ["5", "things you can see", "Look around slowly. Name them, out loud or in your head."],
    ["4", "things you can feel", "Your feet on the floor, the chair, your clothes, the air on your skin."],
    ["3", "things you can hear", "Near and far. Even quiet sounds count."],
    ["2", "things you can smell", "Or two smells you like, if nothing comes."],
    ["1", "thing you can taste", "Or take a sip of water and notice it."],
  ] as const;
  return (
    <Steps
      onDone={onDone}
      steps={[
        { title: "Let's come back to right here", body: "This brings your attention to what's around you, one sense at a time. Go at your own pace." },
        ...senses.map(([n, what, hint]) => ({ title: `Notice ${n} ${what}`, body: hint })),
        { title: "Take one slow breath", body: "Notice how you feel now, compared with a few minutes ago. Whatever you notice is fine." },
      ]}
    />
  );
}

function Compassion({ onDone }: { onDone: () => void }) {
  return (
    <Steps
      onDone={onDone}
      steps={[
        { title: "Think of what's hard right now", body: "Let yourself feel it a little, without pushing it away. If it's too much, pick something smaller." },
        { title: "“This is a moment of difficulty.”", body: "Say it to yourself, or in words that feel like yours: “This hurts.” “This is hard.”" },
        { title: "“I'm not the only one who feels this.”", body: "Struggling is part of being human. Other people have felt something like this too." },
        {
          title: "“May I be kind to myself.”",
          body: "Put a hand on your chest if it helps. Ask: what would I say to a friend feeling this? Say that to yourself.",
        },
      ]}
    />
  );
}

type Record_ = { id: string; at: string; situation: string; thought: string; feelingBefore: number | null; evidenceFor: string; evidenceAgainst: string; balanced: string; feelingAfter: number | null };
const RECORDS = "haven:thought-records";

function ThoughtRecord() {
  const blank = (): Record_ => ({ id: crypto.randomUUID(), at: new Date().toISOString(), situation: "", thought: "", feelingBefore: null, evidenceFor: "", evidenceAgainst: "", balanced: "", feelingAfter: null });
  const [r, setR] = useState<Record_>(blank);
  const [saved, setSaved] = useState<Record_[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restores saved records from this device
    setSaved(load<Record_[]>(RECORDS, []));
  }, []);
  const set = (patch: Partial<Record_>) => setR((x) => ({ ...x, ...patch }));
  const field = (key: keyof Record_, label: string, hint: string, rows = 2) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`tr-${key}`} className="text-[16px] font-semibold">
        {label}
      </label>
      <span className="text-[14px] text-muted">{hint}</span>
      <textarea id={`tr-${key}`} rows={rows} maxLength={600} value={r[key] as string} onChange={(e) => set({ [key]: e.target.value })} className={`${input} resize-y`} />
    </div>
  );
  const done = r.thought.trim() && r.balanced.trim();
  return (
    <>
      <p className="m-0 text-[15px] text-muted">A thought isn&apos;t always a fact. This helps you look at one painful thought, gently, from a few sides.</p>
      {field("situation", "What happened?", "Where were you, and what was going on?")}
      {field("thought", "What went through your mind?", "The thought that hurt most, in your own words.")}
      <div className="flex flex-col gap-1.5">
        <span className="text-[16px] font-semibold">How strong was the feeling?</span>
        <MoodScale label="How strong was the feeling, 0 to 10" value={r.feelingBefore} onChange={(v) => set({ feelingBefore: v })} compact />
      </div>
      {field("evidenceFor", "What makes the thought feel true?", "Facts, not guesses.")}
      {field("evidenceAgainst", "What doesn't quite fit it?", "Anything that suggests it's not the whole story.")}
      {field("balanced", "A fairer way to see it", "What would you say to a friend who had this thought?", 3)}
      <div className="flex flex-col gap-1.5">
        <span className="text-[16px] font-semibold">How strong is the feeling now?</span>
        <MoodScale label="How strong is the feeling now, 0 to 10" value={r.feelingAfter} onChange={(v) => set({ feelingAfter: v })} compact />
      </div>
      <Button
        variant="primary"
        size="lg"
        disabled={!done}
        onClick={() => {
          const next = [r, ...saved].slice(0, 50);
          setSaved(next);
          save(RECORDS, next);
          setR(blank());
        }}
        className="self-start"
      >
        Save to this device
      </Button>
      {saved.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="t-group m-0 ml-1">Saved</h2>
          {saved.map((x) => (
            <div key={x.id} className="flex items-start gap-2 rounded-md border border-edge-lo bg-glass p-3.5">
              <div className="flex flex-1 flex-col gap-1 text-[15px]">
                <span className="text-[13px] text-faint">{new Date(x.at).toLocaleDateString()}</span>
                <span className="text-muted line-through decoration-[rgba(239,252,250,.3)]">{x.thought}</span>
                <span>{x.balanced}</span>
                {x.feelingBefore != null && x.feelingAfter != null && (
                  <span className="text-[13px] text-muted">
                    Feeling {x.feelingBefore} → {x.feelingAfter}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="Delete this record"
                onClick={() => {
                  const next = saved.filter((y) => y.id !== x.id);
                  setSaved(next);
                  save(RECORDS, next);
                }}
                className="press flex size-10 items-center justify-center rounded-full text-muted hover:bg-glass hover:text-text"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

type Plan = { id: string; what: string; when: string; done: boolean };
const PLANS = "haven:small-plans";
const IDEAS = ["A 10-minute walk", "Text someone I like", "Make a proper meal", "Tidy one small spot", "Listen to a favourite album", "Step outside in daylight"];

function SmallPlan() {
  const [what, setWhat] = useState("");
  const [when, setWhen] = useState("");
  const [likely, setLikely] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restores saved plans from this device
    setPlans(load<Plan[]>(PLANS, []));
  }, []);
  const store = (next: Plan[]) => {
    setPlans(next);
    save(PLANS, next);
  };
  return (
    <>
      <p className="m-0 text-[15px] text-muted">
        When you&apos;re low, waiting to feel like doing things can keep you stuck. Doing one small thing first often helps the feeling follow.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="plan-what" className="text-[16px] font-semibold">
          One small thing
        </label>
        <span className="text-[14px] text-muted">Something that used to bring a bit of pleasure or feels worthwhile.</span>
        <input id="plan-what" value={what} maxLength={120} onChange={(e) => setWhat(e.target.value)} className={input} />
        <div className="flex flex-wrap gap-1.5">
          {IDEAS.map((i) => (
            <button key={i} type="button" onClick={() => setWhat(i)} className="press min-h-9 rounded-pill border border-edge-lo px-3 text-[13px] text-muted hover:bg-glass hover:text-text">
              {i}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="plan-when" className="text-[16px] font-semibold">
          When?
        </label>
        <input id="plan-when" value={when} maxLength={60} onChange={(e) => setWhen(e.target.value)} placeholder="e.g. Tomorrow after lunch" className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[16px] font-semibold">How likely are you to do it?</span>
        <MoodScale label="How likely are you to do it, 0 to 10" value={likely} onChange={setLikely} compact />
        {likely != null && likely < 7 && <p className="m-0 text-[14px] text-accent-strong">Could you make it a bit smaller, so it feels like a 7 or more?</p>}
      </div>
      <Button
        variant="primary"
        size="lg"
        disabled={!what.trim()}
        onClick={() => {
          store([{ id: crypto.randomUUID(), what: what.trim(), when: when.trim(), done: false }, ...plans].slice(0, 30));
          setWhat("");
          setWhen("");
          setLikely(null);
        }}
        className="self-start"
      >
        Add to my plan
      </Button>
      {plans.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="t-group m-0 ml-1">My small things</h2>
          {plans.map((p) => (
            <div key={p.id} className="flex min-h-14 items-center gap-3 rounded-md border border-edge-lo bg-glass py-1 pr-1 pl-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={p.done}
                aria-label={`Done: ${p.what}`}
                onClick={() => store(plans.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)))}
                className={`press flex size-7 shrink-0 items-center justify-center rounded-[8px] ${p.done ? "bg-mic text-mic-fg" : "border-[1.5px] border-faint"}`}
              >
                {p.done && <CheckIcon size={16} strokeWidth={2.4} />}
              </button>
              <span className={`flex flex-1 flex-col text-[15px] ${p.done ? "text-muted" : ""}`}>
                {p.what}
                {p.when && <span className="text-[13px] text-faint">{p.when}</span>}
              </span>
              <button
                type="button"
                aria-label={`Remove: ${p.what}`}
                onClick={() => store(plans.filter((x) => x.id !== p.id))}
                className="press flex size-10 items-center justify-center rounded-full text-muted hover:bg-glass hover:text-text"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
