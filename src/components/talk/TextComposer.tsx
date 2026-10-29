"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon, SendIcon } from "@/components/ui/icons";

export interface TextComposerProps {
  onSend: (text: string) => void;
  onTypingChange?: (typing: boolean) => void;
  onSwitchToVoice?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Desktop: Space in an empty box switches to talking. */
  spaceToTalk?: boolean;
}

/**
 * One glass composer (README "Composer"): the round aqua button is the mic while the box is
 * empty (switch to voice) and becomes Send once there is text.
 */
export function TextComposer({ onSend, onTypingChange, onSwitchToVoice, disabled = false, autoFocus = true, spaceToTalk = false }: TextComposerProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 6 * 24 + 16)}px`;
  }, [value]);

  useEffect(() => {
    onTypingChange?.(hasText);
  }, [hasText, onTypingChange]);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  const round = "press inline-flex size-[46px] shrink-0 items-center justify-center rounded-full bg-mic text-mic-fg hover:bg-mic-hover";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={`flex min-h-[60px] items-end gap-2 rounded-[30px] border bg-glass-strong has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-[3px] has-[textarea:focus-visible]:outline-focus has-[textarea:focus-visible]:outline-solid py-1.5 pr-[7px] pl-5 backdrop-blur-[18px] ${
        hasText ? "border-[rgba(143,240,232,.5)]" : "border-edge-hi"
      }`}
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
        placeholder="Write what's on your mind"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (spaceToTalk && e.key === " " && !value && onSwitchToVoice) {
            e.preventDefault();
            onSwitchToVoice();
            return;
          }
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-[160px] min-h-[46px] flex-1 resize-none self-center bg-transparent py-[11px] text-base leading-6 text-text placeholder:text-faint focus:outline-none focus-visible:outline-none"
      />
      {hasText || !onSwitchToVoice ? (
        <button type="submit" disabled={disabled || !hasText} aria-label="Send" className={`${round} disabled:opacity-45`}>
          <SendIcon size={20} />
        </button>
      ) : (
        <button type="button" onClick={onSwitchToVoice} aria-label="Switch to talking" className={round}>
          <MicIcon size={22} />
        </button>
      )}
    </form>
  );
}
