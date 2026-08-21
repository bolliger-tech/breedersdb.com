import { expect, test } from './support/fixtures';
import { formField, listRow, selectOption } from './support/locators';

// The full attribute stepper on cultivars: pick form, metadata, entity, then
// fill every input type (text, integer, decimal, boolean, date, rating, enum
// and photo upload) and save. The attribution flow is the one flow that DOES
// toast on save.
test('attribute stepper on cultivars saves all input types', async ({
  page,
  seed,
}) => {
  const text = await seed.attribute({ dataType: 'TEXT' });
  const integer = await seed.attribute({ dataType: 'INTEGER' });
  const float = await seed.attribute({ dataType: 'FLOAT' });
  const boolean = await seed.attribute({ dataType: 'BOOLEAN' });
  const date = await seed.attribute({ dataType: 'DATE' });
  const rating = await seed.attribute({ dataType: 'RATING' });
  const enumAttr = await seed.attribute({ dataType: 'ENUM' });
  const photo = await seed.attribute({ dataType: 'PHOTO' });
  const form = await seed.attributionForm(
    [text, integer, float, boolean, date, rating, enumAttr, photo].map(
      (attribute) => ({ id: attribute.id }),
    ),
  );
  const cultivar = await seed.cultivar();

  // default the entity picker to name-select: the default QR scanner mode
  // needs a camera and floods the console with NotSupportedError in headless
  // (Quasar LocalStorage prefixes string values with __q_strn|)
  await page.addInitScript(() =>
    localStorage.setItem(
      'breedersdb-cultivar-selector-input-method',
      '__q_strn|cultivar-select',
    ),
  );
  await page.goto('/#/cultivars/attribute');

  // step 1: select the form
  await selectOption(page, formField(page, 'Select form'), form.name);
  // completed step panels stay rendered — the active step's button is last
  const continueButton = () =>
    page.getByRole('button', { name: 'Continue' }).last();
  await continueButton().click();

  // step 2: author (fresh contexts have no prefill), date defaults to today
  await formField(page, 'Who collects the data?')
    .locator('input')
    .fill('E2E Robot');
  await continueButton().click();

  // step 3: picking the cultivar by name auto-advances to the form step
  await selectOption(
    page,
    formField(page, 'Cultivar name'),
    cultivar.display_name,
    { resets: true },
  );
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    cultivar.display_name,
  );

  // step 4: one input per attribute data type
  const uniqueText = `a unique text ${seed.uid()}`;
  await formField(page, text.name).locator('textarea').fill(uniqueText);
  await formField(page, integer.name).locator('input').fill('42');
  await formField(page, float.name).locator('input').fill('4.2');
  await formField(page, boolean.name).locator('.q-toggle').click();
  // the date input is an inline q-date calendar — pick a day of this month
  await formField(page, date.name)
    .getByRole('button', { name: '15', exact: true })
    .click();
  await formField(page, rating.name)
    .getByRole('button', { name: '7', exact: true })
    .click();
  await selectOption(page, formField(page, enumAttr.name), 'two');
  await formField(page, photo.name)
    .locator('input[type="file"]')
    .setInputFiles('e2e/assets/test.jpg');

  // save (floating icon-only button) and expect the toast
  await page.locator('.attribute-form-save-btn .q-btn').click();
  await expect(page.locator('.q-notification')).toContainText(
    'Attribution saved.',
  );

  // the attribution (one row per value) is on the cultivar
  await page.goto(`/#/attributions?s=${encodeURIComponent(text.name)}`);
  const row = listRow(page, text.name);
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(cultivar.display_name);
  await expect(row).toContainText(uniqueText);
});
