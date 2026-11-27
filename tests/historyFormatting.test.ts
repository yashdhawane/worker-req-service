import { describe, expect, it } from "vitest";
import { formatHistoryEvent } from "../src/historyFormatting.js";
import type { HistoryEvent } from "../src/models.js";

describe("formatHistoryEvent", () => {
  it("displays the reopening reason in the history line", () => {
    const event: HistoryEvent = {
      id: "event-1",
      requestId: "request-1",
      event: "status_changed",
      timestamp: "2026-11-27T15:00:00.000Z",
      previousStatus: "done",
      newStatus: "in_progress",
      reason: "Needs another review",
    };

    expect(formatHistoryEvent(event)).toBe(
      "event-1 | 2026-11-27T15:00:00.000Z | status_changed | done -> in_progress | Reason: Needs another review",
    );
  });
});
