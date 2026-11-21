export type Priority = "low" | "medium" | "high";
export type RequestStatus = "new" | "in_progress" | "done";

export interface WorkRequest {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEvent {
  id: string;
  requestId: string;
  event: "created" | "status_changed";
  timestamp: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  reason: string | null;
}

export interface Store {
  requests: WorkRequest[];
  history: HistoryEvent[];
}

