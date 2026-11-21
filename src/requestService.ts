import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { ServiceError } from "./errors.js";
import { JsonStorage, type Storage } from "./jsonStorage.js";
import type {
  HistoryEvent,
  Priority,
  RequestStatus,
  Store,
  WorkRequest,
} from "./models.js";

export interface CreateRequestInput {
  title: string;
  description?: unknown;
  priority: string;
}

export interface FilterInput {
  status?: string;
  priority?: string;
}

function utcNow(): string {
  return new Date().toISOString();
}

function validPriority(value: string): value is Priority {
  return value === "low" || value === "medium" || value === "high";
}

function validStatus(value: string): value is RequestStatus {
  return value === "new" || value === "in_progress" || value === "done";
}

export class RequestService {
  constructor(
    private readonly storage: Storage =
      new JsonStorage(join(process.cwd(), "data", "store.json")),
  ) {}

  async create(input: CreateRequestInput): Promise<WorkRequest> {
    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      throw new ServiceError("title must be a non-empty string.");
    }
    if (input.description !== undefined && typeof input.description !== "string") {
      throw new ServiceError("description must be a string.");
    }
    if (!validPriority(input.priority)) {
      throw new ServiceError("priority must be low, medium, or high.");
    }

    const store = await this.storage.load();
    const timestamp = utcNow();
    const request: WorkRequest = {
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description === undefined ? "" : input.description,
      priority: input.priority,
      status: "new",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const history: HistoryEvent = {
      id: randomUUID(),
      requestId: request.id,
      event: "created",
      timestamp,
      previousStatus: null,
      newStatus: "new",
      reason: null,
    };

    const nextStore: Store = {
      requests: [...store.requests, request],
      history: [...store.history, history],
    };
    await this.storage.save(nextStore);
    return request;
  }

  async list(): Promise<WorkRequest[]> {
    const store = await this.storage.load();
    return [...store.requests].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt) ||
      left.id.localeCompare(right.id),
    );
  }

  async filter(input: FilterInput): Promise<WorkRequest[]> {
    if (input.status !== undefined && !validStatus(input.status)) {
      throw new ServiceError("Status filter must be new, in_progress, or done.");
    }
    if (input.priority !== undefined && !validPriority(input.priority)) {
      throw new ServiceError("Priority filter must be low, medium, or high.");
    }

    const requests = await this.list();
    return requests.filter((request) =>
      (input.status === undefined || request.status === input.status) &&
      (input.priority === undefined || request.priority === input.priority),
    );
  }

  async getById(id: string): Promise<WorkRequest> {
    const store = await this.storage.load();
    const request = store.requests.find((candidate) => candidate.id === id);
    if (!request) throw new ServiceError(`Unknown request ID: ${id}`);
    return request;
  }

  async changeStatus(id: string, newStatus: string): Promise<WorkRequest> {
    const store = await this.storage.load();
    const request = store.requests.find((candidate) => candidate.id === id);
    if (!request) throw new ServiceError(`Unknown request ID: ${id}`);
    if (!validStatus(newStatus)) {
      throw new ServiceError("Status must be new, in_progress, or done.");
    }

    const allowed =
      (request.status === "new" && newStatus === "in_progress") ||
      (request.status === "in_progress" && newStatus === "done");
    if (!allowed) {
      throw new ServiceError(
        `Invalid status transition: ${request.status} -> ${newStatus}.`,
      );
    }

    const previousStatus = request.status;
    const timestamp = utcNow();
    const updated = { ...request, status: newStatus, updatedAt: timestamp };
    const event: HistoryEvent = {
      id: randomUUID(),
      requestId: request.id,
      event: "status_changed",
      timestamp,
      previousStatus,
      newStatus,
      reason: null,
    };
    const nextStore: Store = {
      requests: store.requests.map((candidate) =>
        candidate.id === id ? updated : candidate,
      ),
      history: [...store.history, event],
    };
    await this.storage.save(nextStore);
    return updated;
  }

  async getHistory(requestId: string): Promise<HistoryEvent[]> {
    const store = await this.storage.load();
    if (!store.requests.some((request) => request.id === requestId)) {
      throw new ServiceError(`Unknown request ID: ${requestId}`);
    }
    return store.history
      .filter((event) => event.requestId === requestId)
      .sort((left, right) =>
        left.timestamp.localeCompare(right.timestamp) ||
        left.id.localeCompare(right.id),
      );
  }
}
