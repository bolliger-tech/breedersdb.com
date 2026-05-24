// TC3 — Put the sample enum attribute on a form, then record an attribution.
// Runs HEADED: the entity-picker step inits the QR scanner (BarcodeDetector),
// which throws NotSupportedError in headless. We use the "Etiketten-ID" tab so no
// camera is actually needed, but the component still crashes headless on mount.
const {
  cfg,
  sleep,
  withBrowser,
  pickTyped,
  shot,
  makeReporter,
} = require('./lib');
const { hasura } = require('./db');

(async () => {
  const r = makeReporter('TC3');

  await withBrowser(
    async ({ page, errors }) => {
      // --- create the form ---
      await page.goto(cfg.BASE_URL + '/#/attribution-forms', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await sleep(1500);
      await page.click('button:has-text("Hinzufügen")');
      await sleep(1200);
      await page
        .locator('.q-dialog input[type=text]')
        .first()
        .fill(cfg.TEST_FORM);
      await pickTyped(
        page,
        page.locator('.q-dialog .q-select').first(),
        cfg.SAMPLE_ATTRIBUTE,
        cfg.SAMPLE_ATTRIBUTE,
      );
      await sleep(800);
      await shot(page, 'tc3-form.png');
      await page
        .locator('.q-dialog button:has-text("Speichern")')
        .first()
        .click();
      await sleep(2500);
      r.check('form saved', (await page.locator('.q-dialog').count()) === 0);

      // --- record an attribution: step 1 form, step 2 metadata, step 3 entity, step 4 value ---
      await page.goto(cfg.BASE_URL + '/#/plants/attribute', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await sleep(2000);
      await pickTyped(
        page,
        page.locator('.q-select').first(),
        cfg.TEST_FORM,
        cfg.TEST_FORM,
      );
      await page.locator('button:has-text("WEITER")').first().click();
      await sleep(1200);

      await page.locator('input[type=text]').first().fill(cfg.AUTHOR);
      await page.locator('button:has-text("WEITER")').first().click();
      await sleep(2000);

      await page.locator('button:has-text("ETIKETTEN-ID")').click();
      await sleep(800);
      await page.locator('input[type=text]').first().fill(cfg.PLANT_LABEL);
      await sleep(700);
      await page.locator('button:has-text("WEITER")').first().click();
      await sleep(2500);

      // step 4: the enum picker
      const enumSelect = page.locator('.q-select').first();
      await enumSelect.click();
      await sleep(800);
      const opts = (await page.locator('.q-menu .q-item').allInnerTexts()).map(
        (s) => s.trim(),
      );
      r.check(
        'disabled option (Kidney) hidden from picker',
        !opts.some((o) => /Kidney/i.test(o)),
      );
      await page
        .locator('.q-menu .q-item')
        .filter({ hasText: 'Oblong' })
        .first()
        .click();
      await sleep(600);
      await shot(page, 'tc3-oblong.png');

      await page.locator('button:has-text("save")').last().click(); // floating save
      await sleep(3000);
      await shot(page, 'tc3-saved.png');
      r.check('no runtime errors', errors.length === 0);
    },
    { headless: false },
  );

  const data = await hasura(
    `{ cached_attributions(where:{ attribute_name:{_eq:${JSON.stringify(cfg.SAMPLE_ATTRIBUTE)}}, author:{_eq:${JSON.stringify(cfg.AUTHOR)}} }){ data_type text_value } }`,
  );
  const row = data.cached_attributions[0];
  r.check('DB: recorded as ENUM', !!row && row.data_type === 'ENUM');
  r.check(
    'DB: denormalized text_value = "Oblong"',
    !!row && row.text_value === 'Oblong',
  );

  r.done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
