"use client";

import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { CloseIcon, PhoneIcon, PlusIcon } from "@/components/ui/icons";
import { useStore } from "@/lib/data/StoreProvider";
import { emptySafetyPlan, nowIso, SAFETY_PLAN_STEPS, type SafetyPlan, type SafetyPlanStep } from "@/lib/data/types";
import { callLabel, resourcesFor, smsHref, textLabel } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";

/** The Stanley-Brown safety plan steps, in plain words. */
const STEPS: Record<SafetyPlanStep, { title: string; hint: string; placeholder: string }> = {
  warningSigns: {
    title: "My warning signs",
    hint: "Thoughts, feelings or situations that tell me a hard moment may be starting.",
    placeholder: "e.g. Not sleeping, pulling away from everyone",
  },
  coping: {
    title: "Things I can do on my own",
    hint: "Small things that help me take my mind off it, without needing anyone else.",
    placeholder: "e.g. A cold shower, a walk, my playlist",
  },
  distractions: {
    title: "People and places that help me feel better",
    hint: "Somewhere to go or someone to be around, even without talking about how I feel.",
    placeholder: "e.g. The library, my cousin's house",
  },
  people: {
    title: "People I can ask for help",
    hint: "Who I can tell that I'm struggling, and how to reach them.",
    placeholder: "e.g. Sam, 555 0123",
  },
  professionals: {
    title: "Professionals and services",
    hint: "My doctor, a counselor, or a service I trust. Crisis lines for my region are below.",
    placeholder: "e.g. Dr. Lee, 555 0199",
  },
  safeSurroundings: {
    title: "Making my surroundings safer",
    hint: "Ways to put distance between me and anything I could use to hurt myself, like asking someone to hold onto it.",
    placeholder: "e.g. Ask my sister to keep my medication",
  },
  reasons: {
    title: "What matters most to me",
    hint: "People, plans, or things worth staying for.",
    placeholder: "e.g. My dog, seeing my niece grow up",
  },
};

/**
 * A personal safety plan, after the Stanley-Brown Safety Planning Intervention: a short plan in
 * the person's own words, to use when things get hard. Saved privately, with their other data.
 */
export function SafetyPlanView() {
  const { profile, updateProfile } = useStore();
  const region = useRegion();
  const res = resourcesFor(region);
  const plan = profile?.safetyPlan ?? null;
  const [drafts, setDrafts] = useState<Partial<Record<SafetyPlanStep, string>>>({});

  function save(next: SafetyPlan) {
    void updateProfile({ safetyPlan: { ...next, updatedAt: nowIso() } });
  }

  function add(step: SafetyPlanStep, e: FormEvent) {
    e.preventDefault();
    const text = (drafts[step] ?? "").trim();
    if (!text) return;
    const base = plan ?? emptySafetyPlan();
    save({ ...base, [step]: [...base[step], text.slice(0, 200)] });
    setDrafts((d) => ({ ...d, [step]: "" }));
  }

  function remove(step: SafetyPlanStep, index: number) {
    if (!plan) return;
    save({ ...plan, [step]: plan[step].filter((_, i) => i !== index) });
  }

  return (
    <PageShell
      title="My safety plan"
      subtitle="A short plan, in your own words, for when things get hard. Fill in what you can; you can come back to it anytime. Only you can see it."
    >
      {profile &&
        SAFETY_PLAN_STEPS.map((step, i) => (
          <section key={step} aria-labelledby={`step-${step}`} className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 id={`step-${step}`} className="m-0 text-[17px] font-semibold">
                <span className="mr-2 text-accent-strong">{i + 1}</span>
                {STEPS[step].title}
              </h2>
              <p className="m-0 text-[14px] text-muted">{STEPS[step].hint}</p>
            </div>
            {(plan?.[step] ?? []).length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {plan![step].map((item, j) => (
                  <li key={`${item}-${j}`} className="flex min-h-12 items-center gap-2 rounded-sm border border-edge-lo bg-glass py-1 pr-1 pl-4">
                    <span className="flex-1 text-[15px]">{item}</span>
                    <button
                      type="button"
                      onClick={() => remove(step, j)}
                      aria-label={`Remove: ${item}`}
                      className="press flex size-10 items-center justify-center rounded-full text-muted hover:bg-glass hover:text-text"
                    >
                      <CloseIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {step === "professionals" && (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {/^\d+$/.test(res.emergency) && (
                  <li>
                    <a
                      href={`tel:${res.emergency}`}
                      className="press flex min-h-12 items-center gap-2 rounded-sm bg-care-surface px-4 text-[15px] font-semibold text-care no-underline hover:text-care"
                    >
                      <PhoneIcon size={16} />
                      Emergency: {res.emergency}
                    </a>
                  </li>
                )}
                {res.lines.slice(0, 2).map((line) => (
                  <li key={line.name}>
                    <a
                      href={line.call ? `tel:${line.call}` : line.text ? smsHref(line.text) : line.url}
                      target={line.call || line.text ? undefined : "_blank"}
                      rel={line.call || line.text ? undefined : "noreferrer"}
                      className="press flex min-h-12 items-center gap-2 rounded-sm bg-care-surface px-4 text-[15px] text-care no-underline hover:text-care"
                    >
                      <PhoneIcon size={16} />
                      <span className="font-semibold">{line.name}</span>
                      <span className="ml-auto text-[14px]">{line.call ? callLabel(line) : line.text ? textLabel(line) : line.display}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={(e) => add(step, e)} className="flex gap-2">
              <label htmlFor={`add-${step}`} className="sr-only">
                Add to: {STEPS[step].title}
              </label>
              <input
                id={`add-${step}`}
                value={drafts[step] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [step]: e.target.value }))}
                placeholder={STEPS[step].placeholder}
                maxLength={200}
                className="min-h-12 min-w-0 flex-1 rounded-sm border border-edge-hi bg-field px-4 text-[15px] text-text placeholder:text-faint focus:border-[rgba(143,240,232,.6)] focus:outline-none"
              />
              <button
                type="submit"
                aria-label={`Add to ${STEPS[step].title}`}
                className="press flex size-12 shrink-0 items-center justify-center rounded-full border border-edge-hi bg-glass-strong text-text hover:bg-glass-hover"
              >
                <PlusIcon size={18} />
              </button>
            </form>
          </section>
        ))}
      <p className="m-0 text-[13px] text-faint">
        Based on the Stanley-Brown Safety Planning Intervention. If you might be in danger now, use the emergency number above.
      </p>
    </PageShell>
  );
}
