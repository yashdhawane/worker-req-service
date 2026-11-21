# Work Log

## Project and environment

- Project: Work Request Service
- Operating system: Windows
- Node.js: v24.21.0
- npm: 11.19.0
- Repository: `https://github.com/yashdhawane/worker-req-service.git`
- Branch: `main`
- Initial repository state: no commits; setup and documentation files were untracked.

## Requirements decisions

- Implemented as an interactive Node.js TypeScript CLI.
- JSON persistence uses `data/store.json`.
- Initial lifecycle is `new -> in_progress -> done`.
- `done -> in_progress` reopening is deferred to Milestone B.
- Reopening will use the existing `Change request status` menu option.

## Implementation phases

### Milestone A

Pending implementation review and commit approval.

Implemented:
- Request and history models
- JSON storage loading, validation, initialization, and temporary-file writes
- Request creation, listing, filtering, retrieval, status changes, and history
- Interactive CLI
- Initial automated tests
- README setup and usage instructions
- Synthetic empty application store

## Commands and observed results

- `npm test` — Initial red run failed because `src/jsonStorage` did not exist.
- `npm test` — 9 tests passed after initial implementation.
- `npm run typecheck` — Passed after ESM and Node type configuration fixes.
- `npm test` — Passed with 13 tests, including missing, malformed, and invalid storage cases.
- `npm run typecheck` — Passed after ESM import fixes.
- CLI smoke test — Piped `7` to `npm run cli`; displayed the menu and exited successfully.

## AI tool usage and human decisions

The Copilot AI assistant implemented from the approved specification. Human decisions
approved the CLI-only scope and the reopening UI rule. The implementation was not
committed or tagged during this phase.

## Milestone A commit and tag

- Initial implementation commit: `30b8c37167feab959dc340e051022c47e230ccf4`
- Initial milestone tag: `initial-version`
- Tag target: `30b8c37167feab959dc340e051022c47e230ccf4`

## Reopening milestone

- Reopening commit: `718fbcf12e6fb9850e52e8e7045a817b6d78eadc`
- Implemented `done -> in_progress` with trimmed non-empty reasons.
- Added reopening, rejection, preservation, and persistence tests.
- `npm test`: 18 tests passed.
- `npm run typecheck`: passed.
- CLI reopening smoke: attempted with redirected stdin. The environment did not deliver subsequent prompts to `node:readline/promises`; service behavior and prompt condition were reviewed and covered by the implementation tests.

## Security and PII audit

- Inspected source, tests, configuration, package lock, store data,
  documentation, Git history, and tracked files.
- Text checks searched for credential formats, private-key markers,
  password/token assignments, and email addresses.
- Manual review found no credentials or private-key material.
- Smoke-test request data was removed from `data/store.json`.
- Rechecked the working tree and tracked files after cleanup.
- Limitation: text-pattern and manual checks do not prove that every possible
  secret or sensitive value is absent; no external secret scanner was used.

## Validation record

- `npm test`: 18/18 tests passed.
- `npm run typecheck`: passed.
- The reopening CLI prompt is implemented and covered through service tests.
- The interactive stdin smoke attempt did not reliably deliver subsequent prompts
  in this environment; it is not represented as a passing CLI smoke result.
- Final release tag: `v1.0.0`
- Final release commit: `ed48257cedcf12181806fd30b6971c07dd2a99dd`

## Reflection

### Active time

- Active time was not measured during the implementation; no duration is recorded.The coding session started at 06:54 PM and ended at 07:39 PM

### Lessons learned

- Separating the initial lifecycle and reopening milestones made acceptance and
  review boundaries clear.
- Test-first reopening slices exposed missing-reason, whitespace-reason,
  state-preservation, and persistence requirements before the implementation was
  considered complete.
- Recording commands and outcomes prevents assumed validation from being
  represented as executed validation.

## Remaining limitations

- No external secret scanner or hosted CI validation was used.