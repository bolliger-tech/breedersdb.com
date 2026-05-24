// TC7 — Analyze: enum attribute as a column, and as a row filter.
// NOTE: the filter requires the fix in
//   frontend/src/components/Analyze/Result/filterToQuery.ts
// where ColumnTypes.Enum must map to 'citext' (not 'String'); otherwise Hasura
// rejects the query ("variable declared as 'String!' ... where 'citext' expected").
const {
  cfg,
  sleep,
  withBrowser,
  pickTyped,
  pickFromSelect,
  shot,
  makeReporter,
} = require('./lib');
const { hasura } = require('./db');

(async () => {
  const r = makeReporter('TC7');

  const used = await hasura(
    `{ attribution_values(where:{ attribute:{name:{_eq:${JSON.stringify(cfg.SAMPLE_ATTRIBUTE)}}}, attribute_enum_option_id:{_is_null:false} }){ attribute_enum_option{ label } } }`,
  );
  const inUse =
    used.attribution_values[0] &&
    used.attribution_values[0].attribute_enum_option;
  if (!inUse) throw new Error('No recorded enum value found — run tc3 first.');
  const label = inUse.label;

  await withBrowser(async ({ page, errors }) => {
    await page.goto(cfg.BASE_URL + '/#/plants/analyze/new', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await sleep(2500);

    // 1) add the enum attribute as a column (previously crashed: "Enum not supported yet")
    await pickTyped(
      page,
      page
        .locator('.q-select')
        .filter({ hasText: 'Spalte hinzufügen' })
        .first(),
      'Fruit shape',
      cfg.SAMPLE_ATTRIBUTE,
    );
    await sleep(1500);
    const headers = await page
      .locator('table thead')
      .innerText()
      .catch(() => '');
    r.check('column added, no crash', /Fruit shape/.test(headers));
    r.check('no runtime errors adding column', errors.length === 0);

    // 2) add a row filter on the enum attribute
    await page
      .locator('[data-test="analyze-filter-node__action-btn"]')
      .first()
      .click();
    await sleep(700);
    await page
      .locator('[data-test="analyze-filter-node__action-btn-and"]')
      .first()
      .click();
    await sleep(1500);
    await pickTyped(
      page,
      page.locator('.q-select').filter({ hasText: 'Zeile' }).first(),
      'Fruit shape',
      cfg.SAMPLE_ATTRIBUTE,
    );
    await pickFromSelect(
      page,
      page.locator('.q-select').filter({ hasText: 'Operator' }).first(),
      'gleich',
    );

    const valSel = page
      .locator('.q-select')
      .filter({ hasText: 'Wert' })
      .first();
    await valSel.click();
    await sleep(800);
    const valOpts = (await page.locator('.q-menu .q-item').allInnerTexts()).map(
      (s) => s.trim(),
    );
    r.check('value control offers option labels', valOpts.includes(label));
    await page
      .locator('.q-menu .q-item')
      .filter({ hasText: label })
      .first()
      .click();
    await sleep(2500);
    await shot(page, 'tc7-filtered.png');

    const rows = await page.locator('table tbody tr').allInnerTexts();
    r.check('filter runs without error', errors.length === 0);
    r.check(
      'filtered result contains the attributed plant',
      rows.some((row) => row.includes(cfg.PLANT_LABEL)),
    );
    r.check(
      'column renders the enum label',
      rows.some((row) => row.includes(label)),
    );
  });

  r.done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
