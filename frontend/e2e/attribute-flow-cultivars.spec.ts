import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { formField, listRow, selectOption } from './support/locators';

// Walk the stepper up to the attribution form: select the form, set the
// author and pick the cultivar (which auto-advances to the form step). The
// picker mode is preseeded to name-select: the default QR scanner mode needs
// a camera and floods the console with NotSupportedError in headless (Quasar
// LocalStorage prefixes string values with __q_strn|).
async function walkToForm(
  page: Page,
  formName: string,
  cultivarName: string,
  opts: { repeat?: number } = {},
): Promise<void> {
  await page.addInitScript(() =>
    localStorage.setItem(
      'breedersdb-cultivar-selector-input-method',
      '__q_strn|cultivar-select',
    ),
  );
  await page.goto('/#/cultivars/attribute');

  // completed step panels stay rendered — the active step's button is last
  const continueButton = () =>
    page.getByRole('button', { name: 'Continue' }).last();

  await selectOption(page, formField(page, 'Select form'), formName);
  await continueButton().click();

  await formField(page, 'Who collects the data?')
    .locator('input')
    .fill('E2E Robot');
  if (opts.repeat) {
    await formField(page, 'Repeat').locator('.q-toggle').click();
    await formField(page, 'Number of attributions per object')
      .locator('input')
      .fill(String(opts.repeat));
  }
  await continueButton().click();

  await selectOption(page, formField(page, 'Cultivar name'), cultivarName, {
    resets: true,
  });
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    cultivarName,
  );
}

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

  await walkToForm(page, form.name, cultivar.display_name);

  // one input per attribute data type
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

// Saving with a value present but a required field empty raises the
// force-save dialog; "Close" keeps the form, "Save Anyway" saves regardless.
// (With no values at all, a "no data" notification appears instead.)
test('force-save dialog guards empty required fields', async ({
  page,
  seed,
}) => {
  const required = await seed.attribute({ dataType: 'TEXT' });
  const optional = await seed.attribute({ dataType: 'INTEGER' });
  const form = await seed.attributionForm([
    { id: required.id, required: true },
    { id: optional.id },
  ]);
  const cultivar = await seed.cultivar();

  await walkToForm(page, form.name, cultivar.display_name);

  // fill only the optional field, then save
  await formField(page, optional.name).locator('input').fill('3');
  const saveButton = page.locator('.attribute-form-save-btn .q-btn');
  await saveButton.click();
  const dialog = page.locator('.q-dialog');
  await expect(dialog).toContainText('Empty Required Fields');
  await expect(dialog).toContainText(required.name);

  // close: nothing saved, the form is still there
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.q-notification')).toHaveCount(0);

  // save anyway: the attribution is stored
  await saveButton.click();
  await dialog
    .getByRole('button', { name: 'Save Anyway', exact: true })
    .click();
  await expect(page.locator('.q-notification')).toContainText(
    'Attribution saved.',
  );
});

// Repeat mode (?repeat= in the URL) keeps the form open after each save and
// counts the attributions on the save button.
test('repeat mode keeps the form open and counts saves', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();

  await walkToForm(page, form.name, cultivar.display_name, { repeat: 2 });
  expect(page.url()).toContain('repeat=2');

  const textInput = formField(page, attribute.name).locator('textarea');
  const saveButton = page.locator('.attribute-form-save-btn .q-btn');
  const counter = page.locator('.attribute-form-save-btn');

  await textInput.fill('first');
  await saveButton.click();
  await expect(page.locator('.q-notification').last()).toContainText(
    'Attribution saved.',
  );
  // the form stays open on the same cultivar, the counter advances
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    cultivar.display_name,
  );
  await expect(counter).toContainText('1 / 2');

  // reaching the repeat target returns to the entity picker for the next one
  await textInput.fill('second');
  await saveButton.click();
  await expect(formField(page, 'Cultivar name')).toBeVisible();
});
