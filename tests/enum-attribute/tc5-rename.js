// TC5 — Rename the in-use option and confirm it propagates to existing data.
// We rename whichever option is currently recorded (Conical after TC4) to
// "Elongated", which exercises rename-while-in-use + denormalized-cache update.
const {
  cfg,
  sleep,
  withBrowser,
  openAttributeEdit,
  OPTION_ROW,
  shot,
  makeReporter,
} = require('./lib');
const { hasura } = require('./db');

const NEW_LABEL = 'Elongated';

(async () => {
  const r = makeReporter('TC5');

  const used = await hasura(
    `{ attribution_values(where:{ attribute:{name:{_eq:${JSON.stringify(cfg.SAMPLE_ATTRIBUTE)}}}, attribute_enum_option_id:{_is_null:false} }){ attribute_enum_option{ id label } } }`,
  );
  const inUse =
    used.attribution_values[0] &&
    used.attribution_values[0].attribute_enum_option;
  if (!inUse) throw new Error('No in-use option found — run tc3/tc4 first.');
  const oldLabel = inUse.label;

  await withBrowser(async ({ page, errors }) => {
    await openAttributeEdit(page, cfg.SAMPLE_ATTRIBUTE);
    const rows = page.locator(OPTION_ROW);
    const n = await rows.count();
    let renamed = false;
    for (let i = 0; i < n; i++) {
      const inp = rows.nth(i).locator('input[type=text]');
      if ((await inp.inputValue()) === oldLabel) {
        await inp.fill(NEW_LABEL);
        await inp.blur();
        renamed = true;
        break;
      }
    }
    r.check(`found and renamed "${oldLabel}" -> "${NEW_LABEL}"`, renamed);
    await sleep(400);
    await shot(page, 'tc5-renamed.png');
    await page
      .locator('.q-dialog button:has-text("Speichern")')
      .first()
      .click();
    await sleep(2800);
    r.check('no runtime errors', errors.length === 0);
  });

  const after = await hasura(
    `{ opt:attribute_enum_options_by_pk(id:${inUse.id}){ label }
       cache:cached_attributions(where:{ attribute_name:{_eq:${JSON.stringify(cfg.SAMPLE_ATTRIBUTE)}}, author:{_eq:${JSON.stringify(cfg.AUTHOR)}} }){ text_value }
       fk:attribution_values(where:{ attribute_enum_option_id:{_eq:${inUse.id}} }){ id } }`,
  );
  r.check(
    'DB: option label updated',
    after.opt && after.opt.label === NEW_LABEL,
  );
  r.check(
    'DB: denormalized cache propagated to new label',
    after.cache[0] && after.cache[0].text_value === NEW_LABEL,
  );
  r.check('DB: recorded value FK unchanged', after.fk.length > 0);

  r.done();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
