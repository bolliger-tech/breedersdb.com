import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { walkToForm } from './support/attribute-flow';
import {
  expectDialogClosed,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// The database enforces an attribute's cardinality (see
// docs/adr/0001-attribute-cardinality-enforced-in-database.md); the attribution
// form only hints at a collision: a blocked input is disabled, a replacing one
// announces the replacement.

async function saveAttribution(page: Page): Promise<void> {
  await page.locator('.attribute-form-save-btn .q-btn').click();
  await expect(page.locator('.q-notification')).toContainText(
    'Attribution saved.',
  );
}

// after a save with repeat target 1 the stepper returns to the entity picker
async function pickCultivarAgain(page: Page, name: string): Promise<void> {
  await selectOption(page, formField(page, 'Cultivar name'), name, {
    resets: true,
  });
  await expect(page.getByRole('heading', { level: 2 })).toContainText(name);
}

test('unique block: a recorded value disables the input until it is edited', async ({
  page,
  seed,
}) => {
  const name = `E2E UI Attr ${seed.uid()}`;

  await page.goto('/#/attributes/new');
  await formField(page, 'Name').locator('input').fill(name);
  await selectOption(page, formField(page, 'Cardinality'), 'Unique – block');
  await expect(formField(page, 'Cardinality')).toContainText(
    'Further values are rejected.',
  );
  await save(page);
  await expectDialogClosed(page);
  await seed.trackByName('attributes', name);

  await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toContainText('Unique – block');
  await listRow(page, name).click();
  await expect(page.locator('.q-dialog')).toContainText('Unique – block');

  const attributeId = Number(page.url().match(/attributes\/(\d+)/)![1]);
  const form = await seed.attributionForm([{ id: attributeId }]);
  const cultivar = await seed.cultivar();

  await walkToForm(page, form.name, cultivar.display_name);
  const field = formField(page, name);
  await expect(field.locator('.attribution-add-collision-hint')).toHaveCount(0);
  await field.locator('textarea').fill('first');
  await saveAttribution(page);

  await pickCultivarAgain(page, cultivar.display_name);
  await expect(field).toContainText(
    'by E2E Robot: first. Edit the existing value to change it.',
  );
  await expect(field.locator('textarea')).toBeDisabled();

  // edit the existing value in place
  await field.getByRole('button', { name: 'Edit existing value' }).click();
  await expect(field.locator('textarea')).toHaveValue('first');
  await expect(field.locator('.attribution-add-collision-hint')).toHaveCount(0);
  await field.locator('textarea').fill('second');
  await saveAttribution(page);

  await page.goto(`/#/attributions?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);
  await expect(listRow(page, name)).toContainText('second');
});

test('unique replace: saving replaces the recorded value', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({
    dataType: 'TEXT',
    cardinality: 'UNIQUE_REPLACE',
  });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();
  await seed.attribution({
    formId: form.id,
    cultivarId: cultivar.id,
    values: [{ attributeId: attribute.id, dataType: 'TEXT', value: 'old' }],
  });

  await walkToForm(page, form.name, cultivar.display_name);
  const field = formField(page, attribute.name);
  await expect(field).toContainText(
    'by E2E Robot: old. Saving will replace it.',
  );
  await field.locator('textarea').fill('new');
  await saveAttribution(page);

  // the hint reflects the new state
  await pickCultivarAgain(page, cultivar.display_name);
  await expect(field).toContainText(
    'by E2E Robot: new. Saving will replace it.',
  );

  // the replaced value is gone
  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  await expect(listRow(page, attribute.name)).toHaveCount(1);
  await expect(listRow(page, attribute.name)).toContainText('new');
});

// The rejected save is logged to the console by design, hence the console
// guard is detached. Hasura only puts the trigger's message into the error's
// `internal` extension, which it returns in dev mode only (as in the dev stack
// and CI); in production the user sees "database query error".
test('an attribute with duplicate values cannot be made unique', async ({
  page,
  context,
  seed,
}) => {
  context.removeAllListeners('console');
  const attribute = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();
  for (const value of ['one', 'two']) {
    await seed.attribution({
      formId: form.id,
      cultivarId: cultivar.id,
      values: [{ attributeId: attribute.id, dataType: 'TEXT', value }],
    });
  }

  await page.goto(`/#/attributes?s=${encodeURIComponent(attribute.name)}`);
  await listRow(page, attribute.name).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await selectOption(page, formField(page, 'Cardinality'), 'Unique – replace');
  await save(page);

  await expect(
    page.locator('.entity-modal-content__error-tooltip'),
  ).toContainText("The attribute can't be made unique");
});
