const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Quasar option-row inside the enum options editor (one row per option).
const OPTION_ROW = '.q-dialog .row:has(.q-toggle)';

// Run `fn` against a fresh browser/context/page. `headless: false` is needed for
// the attribution entity-picker (it inits the QR scanner / BarcodeDetector, which
// throws NotSupportedError in headless). `errors` collects page/console/hasura errors.
async function withBrowser(fn, { headless = true, useState = true } = {}) {
  const browser = await chromium.launch({ headless });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1500, height: 1050 },
      ...(useState && fs.existsSync(cfg.STATE_PATH)
        ? { storageState: cfg.STATE_PATH }
        : {}),
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => {
      if (m.type() === 'error')
        errors.push('CONSOLE: ' + m.text().split('\n')[0]);
    });
    page.on('response', (r) => {
      if (r.url().includes('/api/hasura') && r.status() >= 400)
        errors.push('HTTP ' + r.status());
    });
    return await fn({ browser, ctx, page, errors });
  } finally {
    await browser.close();
  }
}

async function login(page) {
  if (!cfg.PASSWORD)
    throw new Error(
      'Set BREEDERSDB_PASSWORD (and optionally BREEDERSDB_EMAIL) in the environment.',
    );
  await page.goto(cfg.BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type=email]', cfg.EMAIL);
  await page.fill('input[type=password]', cfg.PASSWORD);
  await page.click('button:has-text("SIGN IN")');
  await page.waitForURL((u) => !String(u).includes('sign-in'), {
    timeout: 20000,
  });
  await sleep(1500);
}

// Robustly pick an option from a Quasar q-select by its visible label. The menu
// items render with a short delay, so we wait for them before clicking.
async function pickFromSelect(page, selectLocator, optionText) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await selectLocator.click();
    try {
      await page
        .locator('.q-menu .q-item')
        .first()
        .waitFor({ state: 'visible', timeout: 6000 });
    } catch {
      continue;
    }
    const item = page
      .locator('.q-menu .q-item')
      .filter({ hasText: optionText });
    try {
      await item.first().waitFor({ state: 'visible', timeout: 4000 });
      await item.first().click();
      await sleep(400);
      return true;
    } catch {
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(300);
    }
  }
  return false;
}

// Pick from a searchable q-select by typing to filter first (for long lists).
async function pickTyped(page, selectLocator, typeText, optionText) {
  await selectLocator.click();
  await sleep(400);
  if (typeText) await page.keyboard.type(typeText, { delay: 30 });
  await sleep(900);
  const item = page.locator('.q-menu .q-item').filter({ hasText: optionText });
  await item.first().waitFor({ state: 'visible', timeout: 8000 });
  await item.first().click();
  await sleep(700);
}

// Open the "new attribute" modal from /attributes.
async function openAttributeAdd(page) {
  await page.goto(cfg.BASE_URL + '/#/attributes', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await sleep(1200);
  await page.click('button:has-text("Hinzufügen")');
  await sleep(1000);
}

// Open the edit modal for an existing attribute by name (search → row → BEARBEITEN).
async function openAttributeEdit(page, name) {
  await page.goto(cfg.BASE_URL + '/#/attributes', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await sleep(1500);
  await page
    .locator('input[type=search], input[placeholder*="Name"]')
    .first()
    .fill(name);
  await sleep(1800);
  await page.locator('table tbody tr').first().click();
  await sleep(1200);
  await page
    .locator(
      '.q-dialog button:has-text("BEARBEITEN"), .q-dialog button:has-text("Bearbeiten")',
    )
    .first()
    .click();
  await sleep(1800);
}

// Ensure the options editor has at least `n` option rows.
async function ensureOptionRows(page, n) {
  const addBtn = page.locator('.q-dialog button:has-text("Option hinzufügen")');
  for (let g = 0; g < n + 4; g++) {
    if ((await page.locator(OPTION_ROW).count()) >= n) break;
    await addBtn.click();
    await sleep(300);
  }
}

async function saveDialog(page) {
  await page.locator('.q-dialog button:has-text("Speichern")').first().click();
  await sleep(2600);
}

function shot(page, name) {
  if (!fs.existsSync(cfg.SHOTS_DIR))
    fs.mkdirSync(cfg.SHOTS_DIR, { recursive: true });
  return page.screenshot({
    path: path.join(cfg.SHOTS_DIR, name),
    fullPage: true,
  });
}

// Tiny assertion helper that prints a PASS/FAIL line and tracks failures.
function makeReporter(tc) {
  let failed = 0;
  return {
    check(label, ok) {
      console.log(`  ${ok ? 'PASS' : 'FAIL'} — ${label}`);
      if (!ok) failed++;
    },
    done() {
      console.log(
        `${tc}: ${failed === 0 ? 'PASS' : 'FAIL (' + failed + ' check(s))'}`,
      );
      if (failed) process.exitCode = 1;
    },
  };
}

module.exports = {
  cfg,
  sleep,
  OPTION_ROW,
  withBrowser,
  login,
  pickFromSelect,
  pickTyped,
  openAttributeAdd,
  openAttributeEdit,
  ensureOptionRows,
  saveDialog,
  shot,
  makeReporter,
};
