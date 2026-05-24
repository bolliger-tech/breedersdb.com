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

async function subcase(name, fillFn) {
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
    return { page, dialogStayedOpen };
  });
}

(async () => {
  const r = makeReporter('TC2');

  // A: option with empty label
  await subcase('TC2 empty (test)', async (page) => {
    await ensureOptionRows(page, 1);
  }).then(async ({ page, dialogStayedOpen }) => {
    await shot(page, 'tc2-empty.png');
    r.check('empty label blocks save', dialogStayedOpen);
    r.check(
      'empty label message shown',
      (await page.getByText('Option ist zwingend', { exact: false }).count()) >
        0,
    );
  });

  // B: two options with the same label
  await subcase('TC2 dup (test)', async (page) => {
    await ensureOptionRows(page, 2);
    const rows = page.locator(OPTION_ROW);
    await rows.nth(0).locator('input[type=text]').fill('Same');
    await rows.nth(1).locator('input[type=text]').fill('Same');
    await sleep(200);
  }).then(async ({ page, dialogStayedOpen }) => {
    await shot(page, 'tc2-duplicate.png');
    r.check('duplicate label blocks save', dialogStayedOpen);
    r.check(
      'duplicate label message shown',
      (await page.getByText('eindeutig', { exact: false }).count()) > 0,
    );
  });

  // C: zero options
  await subcase('TC2 zero (test)', async () => {}).then(
    async ({ page, dialogStayedOpen }) => {
      await shot(page, 'tc2-zero.png');
      r.check('zero options blocks save', dialogStayedOpen);
      r.check(
        '"add at least one option" message shown',
        (await page
          .getByText('Füge mindestens eine Option hinzu', { exact: false })
          .count()) > 0,
      );
    },
  );

  const data = await hasura(
    `{ attributes(where:{name:{_ilike:"TC2%"}}){ id } }`,
  );
  r.check('DB: nothing persisted', data.attributes.length === 0);

  r.done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
