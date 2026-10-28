"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DownloadIcon } from "@/components/ui/icons";
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
    <Sheet open={open} onClose={onClose} title="Save image" subtitle="Themes and notes never appear on it.">
      <div role="radiogroup" aria-label="Size" className="grid grid-cols-2 gap-1 rounded-md border border-edge-hi bg-glass p-1">
        {(
          [
            ["story", "Stories", "1080 × 1920"],
            ["feed", "Feed", "1080 × 1350"],
          ] as const
        ).map(([id, label, size]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={format === id}
            onClick={() => setFormat(id)}
            className={`press flex min-h-[52px] flex-col items-center justify-center rounded-sm leading-[1.2] ${format === id ? "bg-mic text-mic-fg" : "text-text hover:bg-glass"}`}
          >
            <span className="text-[15px] font-semibold">{label}</span>
            <span className="text-[12px] opacity-85">{size}</span>
          </button>
        ))}
      </div>
      {reflection.quotes.length > 0 && (
        <div className="flex min-h-[52px] items-center gap-3 rounded-md border border-edge-lo bg-glass py-1 pr-1 pl-4">
          <span className="flex flex-1 flex-col">
            <span className="text-[15px]">Include your words</span>
            <span className="text-sm text-muted">Adds one quote</span>
          </span>
          <Switch checked={includeQuote} onChange={setIncludeQuote} label="Include your words" />
        </div>
      )}
      <div className="flex justify-center rounded-md bg-ink-deep p-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview.url} alt="Preview of the card image" className="max-h-[42dvh] w-auto rounded-sm" />
        ) : (
          <div className="h-[42dvh]" />
        )}
      </div>
      <Button variant="primary" size="xl" disabled={!preview} onClick={() => preview && void saveCardImage(preview.blob, reflection.title)}>
        <DownloadIcon size={18} />
        Save image
      </Button>
    </Sheet>
  );
}
