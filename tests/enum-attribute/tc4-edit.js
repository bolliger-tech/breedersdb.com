// TC4 — Edit the recorded value (Oblong -> Conical). Depends on TC3.
const { cfg, sleep, withBrowser, shot, makeReporter } = require('./lib');
const { hasura } = require('./db');

(async () => {
  const r = makeReporter('TC4');

  // The global /attributions edit route is keyed by cached_attributions.id.
  const before = await hasura(
    `{ cached_attributions(where:{ attribute_name:{_eq:${JSON.stringify(cfg.SAMPLE_ATTRIBUTE)}}, author:{_eq:${JSON.stringify(cfg.AUTHOR)}} }){ id text_value } }`,
  );
  const cached = before.cached_attributions[0];
  if (!cached) throw new Error('No recorded value found — run tc3 first.');

  await withBrowser(async ({ page, errors }) => {
    await page.goto(cfg.BASE_URL + '/#/attributions/' + cached.id + '/edit', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await sleep(3000);
    const dialogText = await page.locator('.q-dialog').innerText();
    r.check(
      'edit modal shows the sample attribute',
      dialogText.includes(cfg.SAMPLE_ATTRIBUTE),
    );
    await shot(page, 'tc4-before.png');

    const sel = page.locator('.q-dialog .q-select').first();
    await sel.click();
    await sleep(700);
    await page
      .locator('.q-menu .q-item')
      .filter({ hasText: 'Conical' })
      .first()
      .click();
    await sleep(500);
    await page
      .locator('.q-dialog button:has-text("Speichern")')
      .first()
      .click();
    await sleep(2500);
    r.check(
      'modal closed after save',
      (await page.locator('.q-dialog').count()) === 0,
    );
    r.check('no runtime errors', errors.length === 0);
  });

  const after = await hasura(
    `{ cached_attributions(where:{id:{_eq:${cached.id}}}){ text_value } }`,
  );
  r.check(
    'DB: denormalized text_value updated to "Conical"',
    after.cached_attributions[0] &&
      after.cached_attributions[0].text_value === 'Conical',
  );

  r.done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
