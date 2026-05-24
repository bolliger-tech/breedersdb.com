// TC6 — In-use option can't be deleted; unused can; disabling hides it from new
// pickers but keeps existing recorded values. Depends on TC3 (a recorded value).
const {
  cfg,
  sleep,
  withBrowser,
  openAttributeEdit,
  OPTION_ROW,
  makeReporter,
  shot,
} = require('./lib');
const { hasura } = require('./db');

const THROWAWAY = 'ZZ Temp (test)';

async function rowByLabel(page, label) {
  const rows = page.locator(OPTION_ROW);
  const n = await rows.count();
  for (let i = 0; i < n; i++) {
    if ((await rows.nth(i).locator('input[type=text]').inputValue()) === label)
      return rows.nth(i);
  }
  return null;
}
const isDisabled = (btn) =>
  btn.evaluate(
    (el) =>
      el.disabled ||
      el.classList.contains('disabled') ||
      el.getAttribute('aria-disabled') === 'true',
  );

(async () => {
  const r = makeReporter('TC6');

  const used = await hasura(
    `{ attribution_values(where:{ attribute:{name:{_eq:${JSON.stringify(cfg.SAMPLE_ATTRIBUTE)}}}, attribute_enum_option_id:{_is_null:false} }){ attribute_enum_option{ id label } } }`,
  );
  const inUse =
    used.attribution_values[0] &&
    used.attribution_values[0].attribute_enum_option;
  if (!inUse) throw new Error('No in-use option found — run tc3 first.');

  // --- Part A: delete guard + tooltip ---
  await withBrowser(async ({ page }) => {
    await openAttributeEdit(page, cfg.SAMPLE_ATTRIBUTE);
    await shot(page, 'tc6-delete-buttons.png');
    const usedRow = await rowByLabel(page, inUse.label);
    r.check(
      `in-use option "${inUse.label}" delete is disabled`,
      await isDisabled(usedRow.locator('button').last()),
    );

    // tooltip (disabled buttons swallow hover, so dispatch mouseenter directly)
    await usedRow
      .locator('button')
      .last()
      .evaluate((el) =>
        ['mouseenter', 'mouseover', 'mousemove'].forEach((t) =>
          el.dispatchEvent(new MouseEvent(t, { bubbles: true })),
        ),
      );
    await sleep(1000);
    const tips = await page.locator('.q-tooltip').allInnerTexts();
    r.check(
      'disabled-delete tooltip explains it is in use',
      tips.some((t) => /verwendet/i.test(t)),
    );

    // an unused option should be deletable
    const rows = page.locator(OPTION_ROW);
    let unusedEnabled = false;
    for (let i = 0; i < (await rows.count()); i++) {
      const label = await rows.nth(i).locator('input[type=text]').inputValue();
      if (label !== inUse.label) {
        unusedEnabled = !(await isDisabled(
          rows.nth(i).locator('button').last(),
        ));
        break;
      }
    }
    r.check('an unused option is deletable', unusedEnabled);
  });

  // --- Part B: add a throwaway option, persist, reopen, delete it ---
  await withBrowser(async ({ page }) => {
    await openAttributeEdit(page, cfg.SAMPLE_ATTRIBUTE);
    await page
      .locator('.q-dialog button:has-text("Option hinzufügen")')
      .click();
    await sleep(400);
    const rows = page.locator(OPTION_ROW);
    await rows
      .nth((await rows.count()) - 1)
      .locator('input[type=text]')
      .fill(THROWAWAY);
    await sleep(300);
    await page
      .locator('.q-dialog button:has-text("Speichern")')
      .first()
      .click();
    await sleep(2500);
  });
  await withBrowser(async ({ page }) => {
    await openAttributeEdit(page, cfg.SAMPLE_ATTRIBUTE);
    const row = await rowByLabel(page, THROWAWAY);
    r.check('throwaway option persisted', !!row);
    await row.locator('button').last().click(); // delete (enabled — unused)
    await sleep(500);
    await page
      .locator('.q-dialog button:has-text("Speichern")')
      .first()
      .click();
    await sleep(2500);
  });
  const afterDelete = await hasura(
    `{ attribute_enum_options(where:{label:{_eq:${JSON.stringify(THROWAWAY)}}}){ id } }`,
  );
  r.check(
    'DB: throwaway option deleted',
    afterDelete.attribute_enum_options.length === 0,
  );

  // --- Part C: disable the in-use option ---
  await withBrowser(async ({ page }) => {
    await openAttributeEdit(page, cfg.SAMPLE_ATTRIBUTE);
    const row = await rowByLabel(page, inUse.label);
    await row.locator('.q-toggle:has-text("Deaktiviert")').click();
    await sleep(300);
    await page
      .locator('.q-dialog button:has-text("Speichern")')
      .first()
      .click();
    await sleep(2500);
  });
  const disabled = await hasura(
    `{ opt:attribute_enum_options_by_pk(id:${inUse.id}){ disabled }
       cache:cached_attributions(where:{ attribute_name:{_eq:${JSON.stringify(cfg.SAMPLE_ATTRIBUTE)}}, author:{_eq:${JSON.stringify(cfg.AUTHOR)}} }){ text_value } }`,
  );
  r.check(
    'DB: option is now disabled',
    disabled.opt && disabled.opt.disabled === true,
  );
  r.check(
    'DB: existing recorded value still present',
    !!disabled.cache[0] && disabled.cache[0].text_value === inUse.label,
  );

  // verify the disabled option no longer appears in the (preview) picker
  await withBrowser(async ({ page }) => {
    await page.goto(cfg.BASE_URL + '/#/attributes', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await sleep(1200);
    await page
      .locator('input[type=search], input[placeholder*="Name"]')
      .first()
      .fill(cfg.SAMPLE_ATTRIBUTE);
    await sleep(1800);
    await page.locator('table tbody tr').first().click();
    await sleep(1500);
    await page.locator('.q-dialog .q-select').first().click();
    await sleep(700);
    const opts = (await page.locator('.q-menu .q-item').allInnerTexts()).map(
      (s) => s.trim(),
    );
    r.check(
      'disabled option hidden from new picker',
      !opts.some((o) => o === inUse.label),
    );
  });

  // restore: re-enable so the suite is repeatable
  await withBrowser(async ({ page }) => {
    await openAttributeEdit(page, cfg.SAMPLE_ATTRIBUTE);
    const row = await rowByLabel(page, inUse.label);
    await row.locator('.q-toggle:has-text("Deaktiviert")').click();
    await sleep(300);
    await page
      .locator('.q-dialog button:has-text("Speichern")')
      .first()
      .click();
    await sleep(2500);
  });

  r.done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
