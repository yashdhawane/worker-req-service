export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

