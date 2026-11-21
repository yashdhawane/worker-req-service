import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonStorage } from "../src/jsonStorage.js";
import { RequestService } from "../src/requestService.js";
import { StorageError } from "../src/errors.js";
import type { Storage } from "../src/jsonStorage.js";

describe("RequestService", () => {
  let directory: string;
  let filePath: string;
  let service: RequestService;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "work-request-service-"));
    filePath = join(directory, "store.json");
    service = new RequestService(new JsonStorage(filePath));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("creates a request and rejects an empty title", async () => {
    await expect(
      service.create({ title: "   ", priority: "high" }),
    ).rejects.toThrow("title");

    const created = await service.create({
      title: "  Prepare a demo  ",
      description: "",
      priority: "high",
    });

    expect(created.title).toBe("Prepare a demo");
    expect(created.status).toBe("new");
    expect(created.description).toBe("");
    expect(created.id).not.toBe("");
  });

  it("preserves whitespace descriptions and normalizes omitted descriptions", async () => {
    const omitted = await service.create({ title: "Omitted", priority: "low" });
    const whitespace = await service.create({
      title: "Whitespace",
      description: "   ",
      priority: "medium",
    });

    expect(omitted.description).toBe("");
    expect(whitespace.description).toBe("   ");
  });

  it("rejects invalid priorities and descriptions", async () => {
    await expect(
      service.create({ title: "Test", priority: "urgent" }),
    ).rejects.toThrow("priority");
    await expect(
      service.create({ title: "Test", description: 42, priority: "low" }),
    ).rejects.toThrow("description");
  });

  it("lists newest first and filters with AND logic", async () => {
    const first = await service.create({ title: "First", priority: "high" });
    const second = await service.create({ title: "Second", priority: "high" });
    const third = await service.create({ title: "Third", priority: "low" });

    expect((await service.list()).map((request) => request.id)).toEqual([
      third.id,
      second.id,
      first.id,
    ]);
    expect(
      (await service.filter({ status: "new", priority: "high" })).map(
        (request) => request.id,
      ),
    ).toEqual([second.id, first.id]);
  });

  it("retrieves and rejects unknown IDs", async () => {
    const created = await service.create({ title: "Known", priority: "medium" });
    expect((await service.getById(created.id)).id).toBe(created.id);
    await expect(service.getById("missing")).rejects.toThrow("Unknown request ID");
  });

  it("runs valid transitions and rejects unsupported transitions without mutation", async () => {
    const created = await service.create({ title: "Lifecycle", priority: "low" });
    await expect(
      service.changeStatus(created.id, "done"),
    ).rejects.toThrow("Invalid status transition");

    const started = await service.changeStatus(created.id, "in_progress");
    expect(started.status).toBe("in_progress");

    await expect(
      service.changeStatus(created.id, "new"),
    ).rejects.toThrow("Invalid status transition");

    const done = await service.changeStatus(created.id, "done");
    expect(done.status).toBe("done");

    await expect(
      service.changeStatus(created.id, "in_progress"),
    ).rejects.toThrow("Invalid status transition");

    expect((await service.getById(created.id)).status).toBe("done");
  });

  it("records creation and transition history", async () => {
    const created = await service.create({ title: "History", priority: "high" });
    await service.changeStatus(created.id, "in_progress");
    await service.changeStatus(created.id, "done");

    const history = await service.getHistory(created.id);
    expect(history).toHaveLength(3);
    expect(history.map((event) => event.event)).toEqual([
      "created",
      "status_changed",
      "status_changed",
    ]);
  });

  it("preserves requests across service instances", async () => {
    const firstService = new RequestService(new JsonStorage(filePath));
    const created = await firstService.create({ title: "Persistent", priority: "low" });

    const secondService = new RequestService(new JsonStorage(filePath));
    expect((await secondService.getById(created.id)).title).toBe("Persistent");
  });

  it("does not allow reopening in Milestone A", async () => {
    const created = await service.create({ title: "Initial", priority: "low" });
    await service.changeStatus(created.id, "in_progress");
    await service.changeStatus(created.id, "done");

    await expect(
      service.changeStatus(created.id, "in_progress"),
    ).rejects.toThrow("Invalid status transition");
  });

  it("initializes missing storage with empty collections", async () => {
    const storage = new JsonStorage(filePath);
    expect(await storage.load()).toEqual({ requests: [], history: [] });
  });

  it("rejects malformed JSON without replacing it", async () => {
    await writeFile(filePath, "{bad json", "utf8");
    await expect(service.list()).rejects.toThrow("invalid JSON");
  });

  it("rejects invalid storage structure", async () => {
    await writeFile(filePath, JSON.stringify({ requests: {}, history: [] }), "utf8");
    await expect(service.list()).rejects.toThrow("requests and history arrays");
  });

  it("reports write failures and leaves rejected operations unchanged", async () => {
    const failingStorage: Storage = {
      load: async () => ({ requests: [], history: [] }),
      save: async () => {
        throw new StorageError("Unable to persist storage.");
      },
    };
    const failingService = new RequestService(failingStorage);

    await expect(
      failingService.create({ title: "Not persisted", priority: "high" }),
    ).rejects.toThrow("Unable to persist storage");
  });
});
