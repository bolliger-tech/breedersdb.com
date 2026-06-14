# CLAUDE.md — Print Bridge

This file provides guidance to Claude Code (claude.ai/code) when working in `print-bridge/`. See the root [CLAUDE.md](../CLAUDE.md) for the overall architecture.

## What this is

The print bridge is a **local HTTP service that runs on the user's own machine**, letting the browser PWA send raw ZPL to network/USB label printers (the browser cannot talk to printers directly). The frontend calls it directly — not through nginx — at a URL configured in the app's Settings (default `localhost:3333`).

**This repo only contains a mock implementation** ([mock/](mock/)) for testing the frontend integration; the production bridge lives elsewhere. The contract below is what the frontend ([../frontend/src/composables/print/usePrintBridge.ts](../frontend/src/composables/print/usePrintBridge.ts)) expects.

## Protocol

- `GET /health` → `{ "status": "ok" }`
- `GET /printers` → array of `{ id, status, description, connectionType }`
- `POST /print` → requires `X-Printer-Id` header; body is raw ZPL (`Content-Type: text/plain`); responds `200` with `OK`.

CORS must allow `localhost`, `127.0.0.1`, and any `*.breedersdb.com` origin (incl. `OPTIONS` preflight) — the request comes from the PWA in the browser. Any change to this protocol must stay in sync with the frontend print composable.

## Mock server ([mock/](mock/))

Zero-dependency Node `http` server in [mock/server.js](mock/server.js); logs ZPL payloads instead of printing. Node 16+.

```bash
cd print-bridge/mock
npm run start    # listens on http://localhost:3333
```

See [mock/README.md](mock/README.md) for curl examples.
