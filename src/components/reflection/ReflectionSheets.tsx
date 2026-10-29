"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { WEATHERS, WEATHER_LABELS, type Weather } from "@/lib/conversation/types";
import { SKY_REASONS, skyGradient } from "@/lib/design/skies";

/** "Choose a sky": six skies, the app's pick with its reason, Use this sky / Cancel. */
export function SkyPicker({
  open,
  onClose,
  current,
  byPerson,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  current: Weather;
  byPerson: boolean;
  onChoose: (w: Weather) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Choose a sky" subtitle="How did this conversation feel to you?">
      <SkyChoices current={current} byPerson={byPerson} onChoose={onChoose} onClose={onClose} />
    </Sheet>
  );
}

/** The sky choices themselves: in the phone sheet, or inline in the desktop panel (`compact`). */
export function SkyChoices({
  current,
  byPerson,
  onChoose,
  onClose,
  compact = false,
}: {
  current: Weather;
  byPerson: boolean;
  onChoose: (w: Weather) => void;
  onClose: () => void;
  compact?: boolean;
}) {
  const [picked, setPicked] = useState<Weather>(current);
  return (
    <>
      <div role="radiogroup" aria-label="Choose a sky" className={`grid grid-cols-3 ${compact ? "gap-1.5" : "gap-2"}`}>
        {WEATHERS.map((w) => {
          const on = w === picked;
          return (
            <button
              key={w}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPicked(w)}
              className={`press flex flex-col items-stretch border-[1.5px] bg-glass text-text ${
                compact ? "gap-1.5 rounded-[12px] px-[5px] pt-[5px] pb-[7px] text-[12px] leading-[1.2]" : "gap-2 rounded-md px-2 pt-2 pb-2.5 text-[14px]"
              } ${on ? "border-[#8ff0e8] font-semibold" : "border-transparent"}`}
            >
              <span aria-hidden className={compact ? "h-[38px] rounded-[8px]" : "h-16 rounded-[12px]"} style={{ background: skyGradient(w) }} />
              {WEATHER_LABELS[w]}
            </button>
          );
        })}
      </div>
      <p className={`m-0 text-muted ${compact ? "text-[13px]" : "text-sm"}`}>
        {byPerson
          ? `You chose ${WEATHER_LABELS[current]}. Choose whatever feels truer.`
          : `I picked ${WEATHER_LABELS[current]} because ${SKY_REASONS[current]}. Choose whatever feels truer.`}
      </p>
      <div className={`flex ${compact ? "gap-1.5" : "gap-2"}`}>
        <Button
          variant="primary"
          onClick={() => {
            onChoose(picked);
            onClose();
          }}
          className={compact ? "min-h-10 flex-1 text-[14px]" : "min-h-[52px] flex-1 text-base"}
        >
          Use this sky
        </Button>
        <Button variant="outline" onClick={onClose} className={compact ? "min-h-10 px-3.5 text-[14px]" : "min-h-[52px] px-5 text-base"}>
          Cancel
        </Button>
      </div>
    </>
  );
}

/** "Delete this reflection?" with the option to also forget the notes it produced. */
export function DeleteReflection({
  open,
  onClose,
  noteCount,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  noteCount: number;
  onDelete: (forgetNotes: boolean) => void;
}) {
  // Default: forget them too, as before. The design defaults this off; see the handoff notes.
  const [forget, setForget] = useState(true);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      role="alertdialog"
      closeButton={false}
      title="Delete this reflection?"
      subtitle="The card, its sky and the conversation will be gone. This can't be undone."
    >
      {noteCount > 0 && (
        <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-edge-lo bg-glass px-3.5 py-3 text-[15px]">
          <span className="relative mt-px flex size-6 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={forget}
              onChange={(e) => setForget(e.target.checked)}
              className="peer absolute inset-0 m-0 size-6 cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-faint checked:border-transparent checked:bg-mic"
            />
            <CheckIcon size={16} strokeWidth={2.4} className="pointer-events-none relative hidden text-mic-fg peer-checked:block" />
          </span>
          <span className="flex flex-col">
            <span>
              Also forget the {noteCount} {noteCount === 1 ? "note" : "notes"} from this conversation
            </span>
            <span className="text-sm text-muted">Otherwise I&apos;ll still remember {noteCount === 1 ? "it" : "them"}.</span>
          </span>
        </label>
      )}
      <div className="flex flex-col gap-2">
        <Button variant="danger" onClick={() => onDelete(forget)} className="min-h-[52px] w-full text-base">
          Delete reflection
        </Button>
        <Button variant="secondary" onClick={onClose} className="min-h-[52px] w-full text-base">
          Keep it
        </Button>
      </div>
    </Sheet>
  );
}
