// TC1 — Create an ENUM ("Auswahl") attribute with options, a default and a disabled one.
const {
  cfg,
  sleep,
  withBrowser,
  pickFromSelect,
  openAttributeAdd,
  OPTION_ROW,
  ensureOptionRows,
  saveDialog,
  shot,
  makeReporter,
} = require('./lib');
const { hasura } = require('./db');

(async () => {
  const r = makeReporter('TC1');

  await withBrowser(async ({ page, errors }) => {
    await openAttributeAdd(page);
    await page
      .locator('.q-dialog input[type=text]')
      .first()
      .fill(cfg.TEST_ATTRIBUTE);

    r.check(
      '"Auswahl" data type selectable',
      await pickFromSelect(
        page,
        page.locator('.q-dialog .q-select').nth(0),
        'Auswahl',
      ),
    );
    await sleep(600);

    r.check(
      'no Standardwert field for enum',
      (await page.locator('.q-dialog:has-text("Standardwert")').count()) === 0,
    );
    r.check(
      'options editor shown',
      (await page.locator('.q-dialog:has-text("Optionen")').count()) > 0,
    );

    await ensureOptionRows(page, 3);
    const rows = page.locator(OPTION_ROW);
    const labels = ['Crisp', 'Soft', 'Mealy'];
    for (let i = 0; i < 3; i++) {
      await rows.nth(i).locator('input[type=text]').fill(labels[i]);
      await sleep(150);
    }
    await rows.nth(0).locator('.q-toggle:has-text("Standard")').click(); // default = Crisp
    await sleep(200);
    await rows.nth(2).locator('.q-toggle:has-text("Deaktiviert")').click(); // disabled = Mealy
    await sleep(200);

    await shot(page, 'tc1-filled.png');
    await saveDialog(page);

    r.check(
      'modal closed after save',
      (await page.locator('.q-dialog').count()) === 0,
    );
    r.check('no runtime errors', errors.length === 0);
  });

  const data = await hasura(
    `{ attributes(where:{name:{_eq:${JSON.stringify(cfg.TEST_ATTRIBUTE)}}}){
        data_type
        enum_options(order_by:{position:asc}){ label disabled is_default }
      } }`,
  );
  const a = data.attributes[0];
  r.check('DB: data_type ENUM', !!a && a.data_type === 'ENUM');
  r.check(
    'DB: Crisp(default) / Soft / Mealy(disabled)',
    JSON.stringify(a && a.enum_options) ===
      JSON.stringify([
        { label: 'Crisp', disabled: false, is_default: true },
        { label: 'Soft', disabled: false, is_default: false },
        { label: 'Mealy', disabled: true, is_default: false },
      ]),
  );

  r.done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
