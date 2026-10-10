/**
 * Splits streamed text into speakable sentences so text-to-speech can start
 * before the full reply has arrived.
 */
export class SentenceChunker {
  private buffer = "";

  constructor(private readonly minChars = 24) {}

  /** Adds streamed text; returns any sentences now complete. */
  push(text: string): string[] {
    this.buffer += text;
    const out: string[] = [];
    // A sentence ends at . ! ? … (optionally followed by quotes/brackets) and then whitespace.
    const re = /[.!?…]+["'”’)\]]*\s+/g;
    let start = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(this.buffer))) {
      const end = match.index + match[0].length;
      const candidate = this.buffer.slice(start, end).trim();
      if (candidate.length >= this.minChars) {
        out.push(candidate);
        start = end;
      }
    }
    this.buffer = this.buffer.slice(start);
    return out;
  }

  /** Whatever is left at the end of the reply. */
  flush(): string | null {
    const rest = this.buffer.trim();
    this.buffer = "";
    return rest || null;
  }

  reset() {
    this.buffer = "";
  }
}
