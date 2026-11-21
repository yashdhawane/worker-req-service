# Work Request Service

A local command-line application for creating and tracking work requests.

## Prerequisites

- Node.js 24 or later
- npm

## Installation

```bash
npm install
```

## Run the CLI

```bash
npm run cli
```

The CLI remains open until option `7. Exit` is selected.

## Example workflow

1. Select `1` and create a request with a title, optional description, and priority.
2. Select `2` to list requests, newest first.
3. Select `3` to filter by status and/or priority.
4. Select `4` to inspect a request by ID.
5. Select `5` and change `new -> in_progress -> done`.
6. Select `6` to inspect the request history.

After a request reaches `done`, option `5` can reopen it to `in_progress`.
The CLI prompts for a reopening reason only for that transition.

## Validation

```bash
npm test
npm run typecheck
```

## Storage

Requests and history are stored in `data/store.json`. Missing storage is initialized
with empty arrays. Malformed or invalid existing storage is reported as an error
and is not replaced. Unit tests use temporary directories.

## Known limitations

- One local process; concurrent multi-process writes are not supported.
- No web interface, authentication, database service, or external integrations.
- No reopening reason editing after history has been recorded.