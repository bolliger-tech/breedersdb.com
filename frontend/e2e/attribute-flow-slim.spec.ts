import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { formField, listRow, selectOption } from './support/locators';

// Slim happy-path of the attribute stepper on the remaining entity types
// (plants, groups, lots): one TEXT attribute, pick the entity, save, toast.
// The full flow incl. all input types is covered on cultivars in
// attribute-flow-cultivars.spec.ts.

// Steps 1 + 2: select the form, set the author. The entity picker mode is
// preseeded via localStorage — the default QR scanner needs a camera and
// floods the console with NotSupportedError in headless (Quasar LocalStorage
// prefixes string values with __q_strn|).
async function walkToEntityStep(
  page: Page,
  path: string,
  pickerStorageKey: string,
  pickerMode: string,
  formName: string,
): Promise<void> {
  await page.addInitScript(
    ([key, mode]) => localStorage.setItem(key!, `__q_strn|${mode}`),
    [pickerStorageKey, pickerMode],
  );
  await page.goto(path);

  // completed step panels stay rendered — the active step's button is last
  const continueButton = () =>
    page.getByRole('button', { name: 'Continue' }).last();

  await selectOption(page, formField(page, 'Select form'), formName);
  await continueButton().click();
  await formField(page, 'Who collects the data?')
    .locator('input')
    .fill('E2E Robot');
  await continueButton().click();
}

async function fillAndSave(page: Page, attributeName: string): Promise<void> {
  const value = `slim ${Date.now()}`;
  await formField(page, attributeName).locator('textarea').fill(value);
  await page.locator('.attribute-form-save-btn .q-btn').click();
  await expect(page.locator('.q-notification')).toContainText(
    'Attribution saved.',
  );
}

test('attribute stepper saves on plants', async ({ page, seed }) => {
  const attribute = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const plant = await seed.plant();

  await walkToEntityStep(
    page,
    '/#/plants/attribute',
    'breedersdb-plant-selector-input-method',
    'plant-label-id',
    form.name,
  );

  // entering the label id + Enter loads the plant and advances to the form
  await formField(page, 'Plant label ID').locator('input').fill(plant.label_id);
  await formField(page, 'Plant label ID').locator('input').press('Enter');
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    plant.label_id,
  );

  await fillAndSave(page, attribute.name);

  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  await expect(listRow(page, attribute.name)).toContainText(plant.label_id);
});

test('attribute stepper saves on plant groups', async ({ page, seed }) => {
  const attribute = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const group = await seed.plantGroup();

  await walkToEntityStep(
    page,
    '/#/groups/attribute',
    'breedersdb-plant-group-selector-input-method',
    'plant-group-select',
    form.name,
  );

  await selectOption(page, formField(page, 'Group name'), group.display_name, {
    resets: true,
  });
  // the heading shows the group's auto-generated label id (G...), not its
  // name — the attributions-list assertion below pins the actual group
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(/^G\d+$/);

  await fillAndSave(page, attribute.name);

  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  await expect(listRow(page, attribute.name)).toContainText(group.display_name);
});

test('attribute stepper saves on lots', async ({ page, seed }) => {
  const attribute = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const lot = await seed.lot();

  await walkToEntityStep(
    page,
    '/#/lots/attribute',
    'breedersdb-lot-selector-input-method',
    'lot-select',
    form.name,
  );

  await selectOption(page, formField(page, 'Lot name'), lot.full_name, {
    resets: true,
  });
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    lot.full_name,
  );

  await fillAndSave(page, attribute.name);

  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  await expect(listRow(page, attribute.name)).toContainText(lot.full_name);
});
