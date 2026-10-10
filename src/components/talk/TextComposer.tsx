"use client";

import { useEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/ui/icons";

export interface TextComposerProps {
  onSend: (text: string) => void;
  onTypingChange?: (typing: boolean) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function TextComposer({ onSend, onTypingChange, disabled = false, autoFocus = true }: TextComposerProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
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
      className="flex w-full items-end gap-2 rounded-lg border border-border bg-surface p-2 backdrop-blur focus-within:border-accent"
    >
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
        placeholder="Write what's on your mind…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[1rem] leading-relaxed text-text placeholder:text-faint focus:outline-none focus-visible:outline-none"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-accent text-on-accent transition-opacity disabled:opacity-30"
      >
        <SendIcon size={20} />
      </button>
    </form>
  );
}
