# Print Bridge Mock Server

A super lightweight mock HTTP server for testing printer integrations. No external dependencies; uses Node's built-in `http` module.

## Endpoints

- GET /health → `{ "status": "ok" }`
- GET /printers → array of available printers (static)
- POST /print → requires `X-Printer-Id` header; body is raw ZPL (recommended `Content-Type: text/plain`); responds `200 OK` with `OK`.

## Quick Start

### Requirements

- Node.js 16+ (macOS comes with Node via Homebrew or nvm)

### Run

```sh
cd print-bridge/mock
npm run start
```

Server runs at http://localhost:3333.

### Test

```sh
# Health
curl -s http://localhost:3333/health

# Printers
curl -s http://localhost:3333/printers

# Print
curl -s -X POST \
  -H "X-Printer-Id: com1" \
  -H "Content-Type: text/plain" \
  --data-binary '^XA^FO50,50^ADN,36,20^FDHello ZPL^FS^XZ' \
  http://localhost:3333/print
```
