import type { HistoryEvent } from "./models.js";

export function formatHistoryEvent(event: HistoryEvent): string {
  const transition =
    `${event.id} | ${event.timestamp} | ${event.event} | ` +
    `${event.previousStatus ?? "-"} -> ${event.newStatus}`;

  return event.reason === null
    ? transition
    : `${transition} | Reason: ${event.reason}`;
}
