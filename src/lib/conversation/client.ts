import type { ConverseEvent, ConverseRequest } from "./protocol";

export class ConverseError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

/** Calls /api/converse and yields its newline-delimited JSON events. */
export async function* converse(request: ConverseRequest, signal?: AbortSignal): AsyncGenerator<ConverseEvent> {
  const response = await fetch("/api/converse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null);
    throw new ConverseError(body?.error ?? "Something went wrong.", response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as ConverseEvent;
    }
  }
}
