const http = require('http');
const url = require('url');

const PORT = 3333;

const printers = [
  {
    id: 'Epson_Stylus_Office_BX935FWD',
    status: 'idle',
    description: '',
    connectionType: '',
  },
  {
    id: 'Zebra_Technologies_P4T',
    status: 'idle',
    description: '',
    connectionType: '',
  },
];

function sendJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function notFound(res) {
  sendJSON(res, 404, { error: 'Not Found' });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname || '/';

  // CORS: allow requests from localhost, 127.0.0.1 and any subdomain of breedersdb.com
  const origin = req.headers.origin;
  if (origin) {
    let allow = false;
    try {
      const u = new URL(origin);
      const host = u.hostname;
      const proto = u.protocol;

      if (proto !== 'http:' && proto !== 'https:') {
        throw new Error('Invalid protocol');
      }

      if (
        host.endsWith('.breedersdb.com') ||
        host === 'localhost' ||
        host === '127.0.0.1'
      ) {
        allow = true;
      }
    } catch (e) {
      // ignore invalid origin values
    }

    if (allow) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Printer-Id');

  // Preflight requests
  if (method === 'OPTIONS') {
    res.statusCode = 204; // No Content
    return res.end();
  }

  // Simple routing
  if (method === 'GET' && pathname === '/health') {
    return sendJSON(res, 200, { status: 'ok' });
  }

  if (method === 'GET' && pathname === '/printers') {
    return sendJSON(res, 200, printers);
  }

  if (method === 'POST' && pathname === '/print') {
    const printerId = req.headers['x-printer-id'];
    if (!printerId) {
      return sendJSON(res, 400, { error: 'X-Printer-Id header required' });
    }

    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      // Protect against overly large payloads in a mock context
      if (body.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on('end', () => {
      // In a mock server we just log and acknowledge
      console.log(
        '[PRINT REQUEST]',
        { printerId, contentType: req.headers['content-type'] },
        '\n--- ZPL START ---\n' + body + '\n--- ZPL END ---',
      );
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });

    req.on('error', () => {
      sendJSON(res, 500, { error: 'Failed to read request body' });
    });

    return; // Ensure no fall-through
  }

  return notFound(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
