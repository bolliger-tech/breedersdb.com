// TC2 — Options-editor validation: empty label, duplicate label, zero options.
// Each subcase runs in a fresh browser; none should persist (save must be blocked).
const {
  cfg,
  sleep,
  withBrowser,
  pickFromSelect,
  openAttributeAdd,
  OPTION_ROW,
  ensureOptionRows,
  shot,
  makeReporter,
} = require('./lib');
const { hasura } = require('./db');

// Run a subcase end-to-end inside the browser scope and return plain results
// (the browser is closed once `withBrowser` resolves, so no `page` escapes).
async function subcase(name, fillFn, inspectFn) {
  return withBrowser(async ({ page }) => {
    await openAttributeAdd(page);
    await page.locator('.q-dialog input[type=text]').first().fill(name);
    await pickFromSelect(
      page,
      page.locator('.q-dialog .q-select').nth(0),
      'Auswahl',
    );
    await sleep(500);
    await fillFn(page);
    await page
      .locator('.q-dialog button:has-text("Speichern")')
      .first()
      .click();
    await sleep(1500);
    const dialogStayedOpen = (await page.locator('.q-dialog').count()) > 0;
    return await inspectFn(page, dialogStayedOpen);
  });
}

(async () => {
  const r = makeReporter('TC2');

  // A: option with empty label
  const a = await subcase(
    'TC2 empty (test)',
    async (page) => {
      await ensureOptionRows(page, 1);
    },
    async (page, dialogStayedOpen) => {
      await shot(page, 'tc2-empty.png');
      return {
        stayedOpen: dialogStayedOpen,
        msg:
          (await page
            .getByText('Option ist zwingend', { exact: false })
            .count()) > 0,
      };
    },
  );
  r.check('empty label blocks save', a.stayedOpen);
  r.check('empty label message shown', a.msg);

  // B: two options with the same label
  const b = await subcase(
    'TC2 dup (test)',
    async (page) => {
      await ensureOptionRows(page, 2);
      const rows = page.locator(OPTION_ROW);
      await rows.nth(0).locator('input[type=text]').fill('Same');
      await rows.nth(1).locator('input[type=text]').fill('Same');
      await sleep(200);
    },
    async (page, dialogStayedOpen) => {
      await shot(page, 'tc2-duplicate.png');
      return {
        stayedOpen: dialogStayedOpen,
        msg: (await page.getByText('eindeutig', { exact: false }).count()) > 0,
      };
    },
  );
  r.check('duplicate label blocks save', b.stayedOpen);
  r.check('duplicate label message shown', b.msg);

  // C: zero options (a fresh enum seeds one empty row, so remove it first)
  const c = await subcase(
    'TC2 zero (test)',
    async (page) => {
      const rows = page.locator(OPTION_ROW);
      for (let count = await rows.count(); count > 0; count--) {
        await rows.first().locator('button').last().click();
        await sleep(200);
      }
    },
    async (page, dialogStayedOpen) => {
      await shot(page, 'tc2-zero.png');
      return {
        stayedOpen: dialogStayedOpen,
        msg:
          (await page
            .getByText('Füge mindestens eine Option hinzu', { exact: false })
            .count()) > 0,
      };
    },
  );
  r.check('zero options blocks save', c.stayedOpen);
  r.check('"add at least one option" message shown', c.msg);

  const data = await hasura(
    `{ attributes(where:{name:{_ilike:"TC2%"}}){ id } }`,
  );
  r.check('DB: nothing persisted', data.attributes.length === 0);

  r.done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
