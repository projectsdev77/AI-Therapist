import styles from "./captions.module.css";

export interface CaptionLine {
  id: string;
  speaker: "user" | "companion";
  text: string;
  /** True while the line is still streaming in. */
  pending?: boolean;
}

export interface CaptionsProps {
  lines: CaptionLine[];
  className?: string;
}

/**
 * Film-style captions: the current line is bright, the previous one fades,
 * and older lines dissolve. Not a chat log — see the transcript drawer for that.
 */
export function Captions({ lines, className = "" }: CaptionsProps) {
  const visible = lines.filter((l) => l.text.trim().length > 0).slice(-3);
  const lastFinalCompanion = [...lines].reverse().find((l) => l.speaker === "companion" && !l.pending);

  return (
    <div className={`${styles.captions} ${className}`}>
      <div className={styles.stack} aria-hidden>
        {visible.map((line, i) => {
          const age = visible.length - 1 - i;
          return (
            <p
              key={line.id}
              className={`${styles.line} ${line.speaker === "user" ? styles.user : styles.companion}`}
              data-age={age}
            >
              {line.text}
              {line.pending && <span className={styles.cursor} />}
            </p>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {lastFinalCompanion?.text ?? ""}
      </p>
    </div>
  );
}
