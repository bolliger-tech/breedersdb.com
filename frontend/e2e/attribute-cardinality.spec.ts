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

test('unique block: a recorded value disables the input', async ({
  page,
  seed,
}) => {
  const name = `E2E UI Attr ${seed.uid()}`;

  await page.goto('/#/attributes/new');
  await formField(page, 'Name').locator('input').fill(name);
  await selectOption(page, formField(page, 'Repetition'), 'Once only – block');
  await save(page);
  await expectDialogClosed(page);
  await seed.trackByName('attributes', name);

  await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toContainText('Once only – block');
  await listRow(page, name).click();
  await expect(page.locator('.q-dialog')).toContainText('Once only – block');

  const attributeId = Number(page.url().match(/attributes\/(\d+)/)![1]);
  const form = await seed.attributionForm([{ id: attributeId }]);
  const cultivar = await seed.cultivar();

  await walkToForm(page, form.name, cultivar.display_name);
  const field = formField(page, name);
  await expect(field.locator('.attribution-add-collision-hint')).toHaveCount(0);
  await field.locator('textarea').fill('first');
  await saveAttribution(page);

  await pickCultivarAgain(page, cultivar.display_name);
  await expect(field).toContainText('by E2E Robot: first.');
  await expect(field.locator('textarea')).toBeDisabled();
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
    'by E2E Robot: old. A new value replaces it and deletes its notes and photos. Leave empty to keep the existing value.',
  );
  await field.locator('textarea').fill('new');
  await saveAttribution(page);

  // the hint reflects the new state
  await pickCultivarAgain(page, cultivar.display_name);
  await expect(field).toContainText(
    'by E2E Robot: new. A new value replaces it and deletes its notes and photos. Leave empty to keep the existing value.',
  );

  // the replaced value is gone
  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  await expect(listRow(page, attribute.name)).toHaveCount(1);
  await expect(listRow(page, attribute.name)).toContainText('new');
});

// The form checks for duplicates before saving: in production Hasura hides
// the database's own rejection message.
test('an attribute with duplicate values cannot be made unique', async ({
  page,
  seed,
}) => {
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
  await selectOption(
    page,
    formField(page, 'Repetition'),
    'Once only – replace',
  );
  const message =
    "Can't limit this attribute to once only: 1 entity has more than one value of it. Remove the duplicates first.";
  await expect(formField(page, 'Repetition')).toContainText(message);

  // saving is blocked: the modal stays open and the attribute stays repeatable
  await save(page);
  await expect(formField(page, 'Repetition')).toContainText(message);
  await page.goto(`/#/attributes?s=${encodeURIComponent(attribute.name)}`);
  await expect(listRow(page, attribute.name)).toContainText('Repeatable');
});

test('a unique attribute can only be filled once per attribution', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({
    dataType: 'TEXT',
    cardinality: 'UNIQUE_REPLACE',
  });
  const form = await seed.attributionForm([
    { id: attribute.id },
    { id: attribute.id },
  ]);
  const cultivar = await seed.cultivar();

  await walkToForm(page, form.name, cultivar.display_name);
  const fields = formField(page, attribute.name);
  await fields.nth(0).locator('textarea').fill('one');
  await expect(page.getByText('may only be filled once')).toHaveCount(0);
  await fields.nth(1).locator('textarea').fill('two');
  for (const i of [0, 1]) {
    await expect(fields.nth(i)).toContainText(
      'This attribute may only be filled once.',
    );
  }

  await page.locator('.attribute-form-save-btn .q-btn').click();
  await expect(
    page.locator('.entity-modal-content__error-tooltip'),
  ).toContainText('This attribute may only be filled once.');
  await expect(page.locator('.q-notification')).toHaveCount(0);
});
