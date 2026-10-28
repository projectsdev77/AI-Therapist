import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronIcon } from "./icons";

/** A labelled group: a 14/600 muted label above a glass card whose rows are divided by edge-lo. */
export function Group({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="t-group m-0 ml-1 mb-0.5">{title}</h2>
      <div className="overflow-hidden rounded-md border border-edge-hi bg-glass [&>*+*]:border-t [&>*+*]:border-edge-lo">{children}</div>
      {note && <p className="m-0 mx-1 mt-0.5 text-sm text-muted">{note}</p>}
    </section>
  );
}

function RowText({ title, subtitle, danger }: { title: ReactNode; subtitle?: ReactNode; danger?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col text-left">
      <span className={`text-base ${danger ? "text-danger-text" : "text-text"}`}>{title}</span>
      {subtitle && <span className="text-sm text-muted">{subtitle}</span>}
    </span>
  );
}

const rowBase = "flex min-h-16 w-full items-center gap-3 py-2 pr-2 pl-4";

/** A row with any control on the right (a switch, a pill button). */
export function Row({ title, subtitle, children, dim }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode; dim?: boolean }) {
  return (
    <div className={`${rowBase} ${dim ? "opacity-50" : ""}`}>
      <RowText title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}

function Trail({ value }: { value?: ReactNode }) {
  return (
    <span className="flex min-h-11 items-center gap-1.5 px-1.5 text-sm text-muted">
      {value}
      <ChevronIcon size={18} className="text-faint" />
    </span>
  );
}

/** A row that navigates, with an optional value before the chevron. */
export function RowLink({ href, title, subtitle, value, danger }: { href: string; title: ReactNode; subtitle?: ReactNode; value?: ReactNode; danger?: boolean }) {
  return (
    <Link href={href} className={`${rowBase} press text-text no-underline hover:bg-glass hover:text-text`}>
      <RowText title={title} subtitle={subtitle} danger={danger} />
      <Trail value={value} />
    </Link>
  );
}

/** A row that acts (opens a sheet, exports a file). */
export function RowButton({
  onClick,
  title,
  subtitle,
  value,
  danger,
  trailing,
  haspopup,
}: {
  onClick: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  danger?: boolean;
  trailing?: ReactNode;
  haspopup?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} aria-haspopup={haspopup ? "dialog" : undefined} className={`${rowBase} press bg-transparent text-text hover:bg-glass`}>
      <RowText title={title} subtitle={subtitle} danger={danger} />
      {trailing}
      <Trail value={value} />
    </button>
  );
}

/** Page heading: desktop shows a 40px title; phones show the title in the top bar instead. */
export function PageHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="t-page-h1 m-0 hidden min-[720px]:block">{title}</h1>
      {subtitle && <p className="m-0 text-muted">{subtitle}</p>}
    </div>
  );
}
