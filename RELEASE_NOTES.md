# Release Notes

## Release

- Version: 1.0.0
- Date: 2026-11-21
- Initial tag: `initial-version`
- Initial commit: `30b8c37167feab959dc340e051022c47e230ccf4`
- Reopening commit: `718fbcf12e6fb9850e52e8e7045a817b6d78eadc`
- Final tag: `v1.0.0`
- Final commit: `ed48257cedcf12181806fd30b6971c07dd2a99dd`

## Included

- Interactive Node.js TypeScript CLI
- Work request creation, listing, filtering, and ID lookup
- Initial lifecycle: `new -> in_progress -> done`
- Reopening lifecycle: `done -> in_progress`
- Trimmed, non-empty reopening reasons stored in history
- JSON persistence in `data/store.json`
- Creation and status-change history
- Automated Vitest coverage and strict TypeScript checking

## Known limitations

- Local single-process use only; concurrent multi-process writes are not supported.
- No web server, HTTP API, authentication, database service, or external integration.
- The application is a command-line tool.

## Validation summary

- `npm test`: 18 tests passed.
- `npm run typecheck`: passed.
- The reopening CLI reason prompt is covered by implementation and test review.

## Prerequisites

- Node.js 24.21.0
- npm 11.19.0

## Checkout and installation

```bash
git clone https://github.com/yashdhawane/worker-req-service.git
cd worker-req-service
npm install
git checkout initial-version
```

For the final release, replace `initial-version` with the final release tag once
it is published locally.

## Storage initialization

`data/store.json` starts with:

```json
{
  "requests": [],
  "history": []
}
```

Missing storage is initialized automatically. Malformed or invalid existing
storage is reported without silent replacement.

## Run and smoke test

```bash
npm run cli
```

Create a request, start it, mark it done, then reopen it through menu option 5.
Enter a non-empty reopening reason. Confirm the status becomes `in_progress` and
inspect history through menu option 6.