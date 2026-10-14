"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import type { Reflection } from "@/lib/data/types";
import { renderCardImage, saveCardImage, type CardFormat } from "@/lib/reflection/cardImage";

/** Pick a size, choose whether to include your words, preview, then save or share. */
export function ShareCardSheet({ open, onClose, reflection }: { open: boolean; onClose: () => void; reflection: Reflection }) {
  const [format, setFormat] = useState<CardFormat>("story");
  const [includeQuote, setIncludeQuote] = useState(false);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let url: string | null = null;
    renderCardImage(reflection, { format, includeQuote }).then((blob) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setPreview({ url, blob });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, format, includeQuote, reflection]);

  return (
    <Sheet open={open} onClose={onClose} label="Save image">
      <div className="flex flex-col gap-4">
        <h2 className="heading heading-sheet">
          Keep this <span className="accent">card</span>
        </h2>
        <div role="radiogroup" aria-label="Size" className="flex gap-1 self-start rounded-pill border border-border bg-surface p-1">
          {(
            [
              ["story", "Stories"],
              ["feed", "Feed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={format === id}
              onClick={() => setFormat(id)}
              className={`min-h-11 rounded-pill px-4 text-[15px] ${format === id ? "bg-accent font-medium text-on-accent" : "text-text"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {reflection.quotes.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="flex flex-col">
              <span>Include your words</span>
              <span className="text-sm text-muted">Adds one quote. Themes and notes never appear.</span>
            </span>
            <Switch checked={includeQuote} onChange={setIncludeQuote} label="Include your words" />
          </div>
        )}
        <div className="flex justify-center rounded-md bg-band p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={preview.url} alt="Preview of the card image" className="max-h-[42dvh] w-auto rounded-sm shadow-raised" />
          ) : (
            <div className="h-[42dvh]" />
          )}
        </div>
        <Button variant="primary" size="lg" disabled={!preview} onClick={() => preview && void saveCardImage(preview.blob, reflection.title)}>
          Save image
        </Button>
      </div>
    </Sheet>
  );
}
