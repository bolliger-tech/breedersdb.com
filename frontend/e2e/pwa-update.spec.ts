import { test, expect, type Page } from '@playwright/test';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

// Exercises the real service worker update flow, which only exists in a
// production build: the dev server's service worker doesn't precache. The app
// is served from a copy of dist/pwa on its own origin, so "deploying" a new
// version (changing sw.js) doesn't touch the build or the rest of the suite.
const DIST = 'dist/pwa';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

test.skip(
  !existsSync(join(DIST, 'sw.js')),
  'requires a production build: yarn build',
);

// each test gets a fresh browser context, but all share the served copy of
// the build, which deployNewVersion() changes
test.describe.configure({ mode: 'serial' });

let root: string;
let server: Server;
let origin: string;

test.beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'bdb-pwa-update-'));
  cpSync(DIST, root, { recursive: true });

  server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    const file = join(root, path === '/' ? 'index.html' : path);
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type':
        CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
      // like production: the browser must not cache sw.js
      'Cache-Control': 'no-cache',
    });
    res.end(readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(root, { recursive: true, force: true });
});

// A byte change in sw.js is what makes the browser install a new version.
function deployNewVersion(version: string) {
  appendFileSync(join(root, 'sw.js'), `\n// e2e deploy ${version}\n`);
}

function activeScriptVersion(page: Page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const response = await fetch(registration.active!.scriptURL, {
      cache: 'no-store',
    });
    return {
      controlled: navigator.serviceWorker.controller !== null,
      waiting: registration.waiting !== null,
      latestDeploy: (await response.text()).match(/e2e deploy (\w+)/g)?.pop(),
    };
  });
}

async function installApp(page: Page) {
  await page.goto(origin);
  await page.evaluate(() => navigator.serviceWorker.ready);
  // the first install doesn't control the page that registered it until
  // clientsClaim runs; a reload makes it controlled in any case
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}

function checkForUpdate(page: Page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  });
}

const updateNotification = (page: Page) =>
  page.locator('.q-notification').filter({ hasText: 'Update available' });

test('does not offer an update on the first install', async ({ page }) => {
  await page.goto(origin);
  // resolves once the first worker is active, i.e. after it was installed
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.locator('.q-notification')).toHaveCount(0);
});

test('offers a deployed update and activates it on request', async ({
  page,
}) => {
  await installApp(page);

  deployNewVersion('v2');
  await checkForUpdate(page);

  const notification = updateNotification(page);
  await expect(notification).toBeVisible();

  // the new worker waits, so open tabs keep the old version's precache
  expect(await activeScriptVersion(page)).toMatchObject({
    controlled: true,
    waiting: true,
  });

  // a plain reload doesn't apply the update while the tab is open
  await page.reload();
  await expect(notification).toBeVisible();
  expect(await activeScriptVersion(page)).toMatchObject({ waiting: true });

  await Promise.all([
    page.waitForEvent('load'),
    notification.getByRole('button', { name: 'Update' }).click(),
  ]);

  await expect(updateNotification(page)).toHaveCount(0);
  expect(await activeScriptVersion(page)).toEqual({
    controlled: true,
    waiting: false,
    latestDeploy: 'e2e deploy v2',
  });
});
