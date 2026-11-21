# Work Request Service Specification

## 1. Purpose

Build a small local application that creates and tracks work requests.

The application is for one local user. It must run from an interactive
command-line interface and persist requests and history between restarts.

The original assessment is in `docs/ai-native-swe-assignment.html`. This document
is the implementation specification.

## 2. Technology and Scope

Use:

- Node.js
- TypeScript
- Interactive CLI
- `node:readline/promises`
- `node:fs/promises`
- `tsx`
- Vitest

Use the minimum dependencies needed. Do not add a web server, HTTP API, database
service, authentication, UI framework, cloud service, or external integration.

No concurrent multi-process write support is required.

## 3. Project Structure

Use a structure like this:

```text
work-request-service/
├── src/
│   ├── cli.ts
│   ├── errors.ts
│   ├── historyService.ts
│   ├── jsonStorage.ts
│   ├── models.ts
│   └── requestService.ts
├── tests/
│   └── requestService.test.ts
├── data/
│   └── store.json
├── docs/
│   └── ai-native-swe-assignment.html
├── spec.md
├── README.md
├── WORKLOG.md
├── RELEASE_NOTES.md
├── package.json
├── package-lock.json
├── tsconfig.json
└── .gitignore
```

Keep the CLI separate from the request rules and JSON storage. Add only modules
that provide practical separation or testability.

## 4. User Workflow

The CLI must remain open until the user selects Exit.

Menu:

```text
1. Create request
2. List requests
3. Filter requests
4. View request by ID
5. Change request status
6. View request history
7. Exit
```

An invalid menu choice or invalid input must display an understandable error and
return to the menu. The CLI must not crash from expected invalid input.

## 5. Request Data Model

Each request has:

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique generated ID |
| `title` | string | Required; not empty or whitespace-only |
| `description` | string | May be empty or omitted; store omitted values as `""` |
| `priority` | string | Exactly `low`, `medium`, or `high` |
| `status` | string | `new`, `in_progress`, or `done` |
| `createdAt` | string | UTC ISO 8601 timestamp |
| `updatedAt` | string | UTC ISO 8601 timestamp |

The title is trimmed before validation and storage.

Description validation is:

- A string is accepted.
- An empty or omitted description is accepted.
- A whitespace-only description is accepted and preserved.
- A non-string description is rejected.

Priority values are case-sensitive.

Request and history IDs must be unique. Use `crypto.randomUUID()` or another
simple generated string ID.

## 6. Core Operations

### 6.1 Create a Request

The operation must:

1. Validate the title.
2. Validate the description.
3. Validate the priority.
4. Generate a unique ID.
5. Set `status` to `new`.
6. Set `createdAt` and `updatedAt` to the same current UTC timestamp.
7. Add the request to the store.
8. Add a `created` history event.
9. Persist both collections.

### 6.2 List Requests

List all requests.

For each request, display:

- ID
- Title
- Priority
- Status
- Creation timestamp

Sort newest first by `createdAt`. If timestamps are equal, sort by ID ascending.
Use an understandable message when no requests exist.

### 6.3 Filter Requests

Support:

- Status filter only.
- Priority filter only.
- Status and priority together.

Valid status filter values:

- `new`
- `in_progress`
- `done`

Valid priority filter values:

- `low`
- `medium`
- `high`

When both filters are supplied, use AND logic. Filtering must not modify the
stored requests or history.

### 6.4 Retrieve a Request

Retrieve a request by exact ID. Return a clear unknown-ID error when the ID does
not exist.

### 6.5 Change Request Status

Change Request Status must use this input order:

1. Ask the user for the request ID.
2. Retrieve the request before asking for the new status.
3. If the ID does not exist, display a clear unknown-ID error and stop the
   operation.
4. Only after the request ID is found, ask for the new status.

Do not ask for a status or reopening reason until the request ID has been
validated.

Reopening uses the existing `5. Change request status` menu option. It does not
add a separate reopening menu action. After a valid request ID is found, ask for
the new status. Prompt for the reopening reason only if the user selects
`in_progress` for a request whose current status is `done`. Do not prompt for a
reason for initial lifecycle transitions or any invalid status selection.

The initial lifecycle is:

```text
new -> in_progress -> done
```

Initial allowed transitions:

| Current status | Allowed next status |
|---|---|
| `new` | `in_progress` |
| `in_progress` | `done` |
| `done` | None in the initial version |

Every successful transition must:

1. Validate the transition.
2. Update `status`.
3. Update `updatedAt`.
4. Add a `status_changed` history event.
5. Persist the request and history.

Every rejected transition must leave the request and history unchanged.

## 7. History Data Model

Each history event has:

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique generated ID |
| `requestId` | string | ID of the related request |
| `event` | string | Exactly `created` or `status_changed` |
| `timestamp` | string | UTC ISO 8601 timestamp |
| `previousStatus` | string or null | `null` for creation; otherwise previous status |
| `newStatus` | string | Resulting status |
| `reason` | string or null | Reopening reason or `null` |

Creation history:

```json
{
  "previousStatus": null,
  "newStatus": "new",
  "reason": null
}
```

Normal status-change history has `reason: null`.

History is append-only during normal operations. The persisted collection is
global. Viewing history for a request must return only events with the matching
`requestId`.

Display request history oldest first by `timestamp`. If timestamps are equal,
use event ID ascending as the fallback order.

## 8. JSON Persistence

Store data in `data/store.json`.

Required top-level structure:

```json
{
  "requests": [],
  "history": []
}
```

### Missing file

If `data/store.json` does not exist:

1. Initialize memory with empty `requests` and `history` arrays.
2. Create `data/store.json`.
3. Write the empty store.

Do not report an operation as successful if initialization fails.

### Malformed or invalid file

If the file exists:

- Invalid JSON is a storage error.
- A non-object top level is a storage error.
- Missing `requests` or `history` is a storage error.
- Non-array collections are a storage error.
- Invalid request or history field types and values are a storage error.

Do not silently replace or repair malformed or invalid existing data.

### Persistence failures

Read failures and write failures must produce understandable messages.

Use a simple temporary-file-and-rename write strategy. A successful operation
must not be reported when writing or renaming fails.

Rejected operations must not change either collection in memory or on disk.

## 9. Error Behavior

The application must handle:

- Empty or whitespace-only title.
- Empty or missing description, as allowed.
- Non-string description.
- Invalid priority.
- Invalid status filter or priority filter.
- Invalid status transition.
- Unknown request ID.
- Incomplete CLI input.
- Missing, malformed, or invalid storage.
- Storage read and write failures.

Errors must explain what failed. They must not expose secrets or sensitive data.

## 10. Reopening Requirement Change

Reopening is not part of the initial version.

### Milestone boundary

The initial version must:

1. Be complete.
2. Pass its tests.
3. Be committed.
4. Be tagged as `initial-version` or an equivalent clearly named tag.

Only after that checkpoint may reopening be implemented.

### Reopening behavior

After the initial milestone, add only this transition:

```text
done -> in_progress
```

Reopening requires a non-empty reason.

The reason is valid only after trimming when it contains at least one
non-whitespace character.

On reopening:

1. Validate that the current status is `done`.
2. Validate and trim the reason.
3. Update `status` to `in_progress`.
4. Update `updatedAt`.
5. Add a `status_changed` history event.
6. Set `previousStatus` to `done`.
7. Set `newStatus` to `in_progress`.
8. Store the trimmed reason in `reason`.
9. Persist the request and history.

Reject reopening:

- From `new`.
- From `in_progress`.
- With no reason.
- With a whitespace-only reason.

All rejected reopenings must leave request and history data unchanged.

Reopening must be implemented in a separate commit after the initial milestone.

## 11. Initial Acceptance Criteria

The initial version is complete when:

- A valid request is created with a unique ID and `new` status.
- Empty, omitted, and whitespace descriptions follow the specified behavior.
- Invalid titles and priorities are rejected.
- Requests can be listed newest first.
- Status and priority filters work independently and together.
- A request can be retrieved by ID.
- Unknown IDs produce clear errors.
- `new -> in_progress` and `in_progress -> done` succeed.
- All unsupported initial transitions are rejected.
- Creation and successful transitions create history.
- Rejected operations do not mutate data or history.
- Requests and history survive restart or storage reload.
- Missing storage initializes empty collections.
- Malformed and invalid storage never gets silently replaced.
- Persistence failures are reported as failures.
- Automated tests and initial documentation are complete.

Reopening must not be implemented or enabled in the initial milestone.

## 12. Final Acceptance Criteria

The final submission is complete only after:

- The reopening transition is implemented.
- Reopening rejects missing and whitespace-only reasons.
- Reopening stores the trimmed reason in history.
- Reopening preserves existing behavior.
- Final tests pass.
- The reopening change is in a separate commit.
- README, worklog, validation record, release notes, and security audit are complete.
- The final release is tagged and the commit SHA is recorded.

## 13. Testing Plan

### Initial tests

Test observable behavior for:

- Valid creation.
- Empty title rejection.
- Invalid priority rejection.
- Empty, omitted, and whitespace description behavior.
- Unique IDs.
- Existing and unknown IDs.
- Listing order.
- Status filtering.
- Priority filtering.
- Combined AND filtering.
- Valid initial transitions.
- Unsupported initial transitions.
- Creation history.
- Transition history.
- No mutation after rejected operations.
- Persistence across service instances.
- Missing storage initialization.
- Malformed JSON handling.
- Invalid storage structure handling.
- Persistence write failures.

Do not modify the real `data/store.json` in unit tests. Use temporary directories
or injected storage implementations.

### Reopening tests

Add only after the initial milestone:

- Reopen `done -> in_progress` with a valid reason.
- Reject missing reasons.
- Reject whitespace-only reasons.
- Store and trim the reason.
- Reject reopening from `new`.
- Reject reopening from `in_progress`.
- Preserve state and history on rejected reopening.
- Preserve reopening through a storage reload.
- Run all initial tests as regression tests.

Tests must assert observable behavior, not private implementation details.

Record actual commands and outcomes. Do not claim a test or check passed unless
it was executed.

## 14. Git Milestones

### Milestone A: Initial version

1. Implement the initial functionality.
2. Run tests and type checking.
3. Run a manual CLI smoke test.
4. Review the complete diff.
5. Commit the initial version.
6. Tag the initial commit as `initial-version`.
7. Record the commit SHA and tag in `WORKLOG.md`.

Do not implement reopening before this checkpoint.

### Milestone B: Reopening

1. Add reopening tests.
2. Implement reopening.
3. Run the full regression suite.
4. Run a reopening CLI smoke test.
5. Review the reopening diff.
6. Commit reopening separately.
7. Record the commit SHA in `WORKLOG.md`.

Do not rewrite, squash, or remove the required milestone distinction.

### Final release

1. Complete documentation.
2. Run final validation.
3. Audit repository content and Git history for secrets and personal data.
4. Reset application store data to synthetic or empty data.
5. Commit final documentation and cleanup.
6. Create a clearly named final release tag.
7. Record the final tag and full commit SHA.

## 15. Required Documentation

### README.md

Document:

- Project purpose.
- Supported Node.js version.
- Installation commands.
- Test and type-check commands.
- CLI start command.
- Example workflow.
- Storage location and behavior.
- Known limitations.

Commands must match `package.json`.

### WORKLOG.md

Maintain an actual work record. Include:

- Project and environment.
- Requirements decisions.
- Implementation phases.
- Problems encountered and fixes.
- Commands and observed results.
- AI tool usage and human decisions.
- Initial milestone hash and tag.
- Reopening commit.
- Security and PII audit.
- Remaining limitations.

Do not invent timestamps, durations, test results, findings, or Git hashes.

Mark work that was not completed as `Pending`.

### RELEASE_NOTES.md

Record:

- Release version and date.
- Actual final tag and commit SHA.
- Initial functionality.
- Reopening change.
- Known limitations.
- Actual validation summary.
- Prerequisites and versions.
- Checkout instructions.
- Dependency installation.
- Storage initialization.
- CLI start command.
- Smoke-test steps.

### Security and PII audit

Before final submission:

1. Inspect source files, configuration, tests, store data, documentation, logs,
   and Git history.
2. Check for credentials, tokens, keys, passwords, and real personal data.
3. Use synthetic examples.
4. Record tools and manual checks used.
5. Record findings and remediation.
6. Rerun the checks after remediation.
7. State audit limitations honestly.
