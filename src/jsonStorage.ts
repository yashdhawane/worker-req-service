import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { StorageError } from "./errors.js";
import type { HistoryEvent, Store, WorkRequest } from "./models.js";

export interface Storage {
  load(): Promise<Store>;
  save(store: Store): Promise<void>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}

function isPriority(value: unknown): value is WorkRequest["priority"] {
  return value === "low" || value === "medium" || value === "high";
}

function isStatus(value: unknown): value is WorkRequest["status"] {
  return value === "new" || value === "in_progress" || value === "done";
}

function validRequest(value: unknown): value is WorkRequest {
  if (!isObject(value)) return false;
  return typeof value.id === "string" && value.id.length > 0 &&
    typeof value.title === "string" && value.title.trim().length > 0 &&
    typeof value.description === "string" &&
    isPriority(value.priority) && isStatus(value.status) &&
    isTimestamp(value.createdAt) && isTimestamp(value.updatedAt);
}

function validHistory(value: unknown): value is HistoryEvent {
  if (!isObject(value)) return false;
  return typeof value.id === "string" && value.id.length > 0 &&
    typeof value.requestId === "string" && value.requestId.length > 0 &&
    (value.event === "created" || value.event === "status_changed") &&
    isTimestamp(value.timestamp) &&
    (value.previousStatus === null || isStatus(value.previousStatus)) &&
    isStatus(value.newStatus) && value.reason === null;
}

export class JsonStorage implements Storage {
  constructor(private readonly filePath: string) {}

  async load(): Promise<Store> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const empty: Store = { requests: [], history: [] };
        await this.save(empty);
        return empty;
      }
      throw new StorageError(`Unable to read storage: ${(error as Error).message}`);
    }

    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new StorageError("Storage contains invalid JSON.");
    }

    if (!isObject(value)) {
      throw new StorageError("Storage must contain a JSON object.");
    }
    if (!Array.isArray(value.requests) || !Array.isArray(value.history)) {
      throw new StorageError("Storage must contain requests and history arrays.");
    }
    if (!value.requests.every(validRequest) || !value.history.every(validHistory)) {
      throw new StorageError("Storage contains invalid request or history data.");
    }

    const requestIds = value.requests.map((request) => request.id);
    const historyIds = value.history.map((event) => event.id);
    if (new Set(requestIds).size !== requestIds.length ||
        new Set(historyIds).size !== historyIds.length) {
      throw new StorageError("Storage contains duplicate IDs.");
    }

    return {
      requests: value.requests,
      history: value.history,
    };
  }

  async save(store: Store): Promise<void> {
    const directory = dirname(this.filePath);
    const temporary = join(directory, `.${basename(this.filePath)}.${randomUUID()}.tmp`);
    try {
      await mkdir(directory, { recursive: true });
      await writeFile(temporary, JSON.stringify(store, null, 2) + "\n", "utf8");
      await rename(temporary, this.filePath);
    } catch (error) {
      throw new StorageError(`Unable to persist storage: ${(error as Error).message}`);
    }
  }
}
