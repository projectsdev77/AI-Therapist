"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon, SendIcon } from "@/components/ui/icons";

export interface TextComposerProps {
  onSend: (text: string) => void;
  onTypingChange?: (typing: boolean) => void;
  onSwitchToVoice?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Composer pill on the sage band: switch to talking, text that grows to 6 lines, send. */
export function TextComposer({ onSend, onTypingChange, onSwitchToVoice, disabled = false, autoFocus = true }: TextComposerProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 6 * 24 + 20)}px`;
  }, [value]);

  useEffect(() => {
    onTypingChange?.(value.trim().length > 0);
  }, [value, onTypingChange]);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex min-h-14 items-end gap-1 rounded-[28px] border border-border bg-surface px-1.5 py-1.5 shadow-soft focus-within:border-accent-strong"
    >
      {onSwitchToVoice && (
        <button
          type="button"
          onClick={onSwitchToVoice}
          aria-label="Switch to talking"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text"
        >
          <MicIcon size={20} />
        </button>
      )}
      <label htmlFor="composer" className="sr-only">
        Write to your companion
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        maxLength={4000}
        placeholder="Write what's on your mind"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-[164px] min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base leading-6 text-text placeholder:text-faint focus:outline-none focus-visible:outline-none"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-opacity duration-[var(--motion-base)] disabled:opacity-40"
      >
        <SendIcon size={20} strokeWidth={1.8} />
      </button>
    </form>
  );
}
