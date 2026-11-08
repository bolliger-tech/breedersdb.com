import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { uploadPhoto, walkToForm } from './support/attribute-flow';
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
  await expect(field).toContainText(
    'by E2E Robot. The attribute can be assigned only once and cannot be overwritten (blocking).',
  );
  await expect(field.locator('textarea')).toBeDisabled();
  await expect(field.locator('textarea')).toHaveValue('first');
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

test('unique block: every data type shows its recorded value and the hint below', async ({
  page,
  seed,
}) => {
  const attrs = {
    text: await seed.attribute({
      dataType: 'TEXT',
      cardinality: 'UNIQUE_BLOCK',
    }),
    integer: await seed.attribute({
      dataType: 'INTEGER',
      cardinality: 'UNIQUE_BLOCK',
    }),
    float: await seed.attribute({
      dataType: 'FLOAT',
      cardinality: 'UNIQUE_BLOCK',
    }),
    boolean: await seed.attribute({
      dataType: 'BOOLEAN',
      cardinality: 'UNIQUE_BLOCK',
    }),
    date: await seed.attribute({
      dataType: 'DATE',
      cardinality: 'UNIQUE_BLOCK',
    }),
    rating: await seed.attribute({
      dataType: 'RATING',
      cardinality: 'UNIQUE_BLOCK',
    }),
    enum: await seed.attribute({
      dataType: 'ENUM',
      cardinality: 'UNIQUE_BLOCK',
    }),
    photo: await seed.attribute({
      dataType: 'PHOTO',
      cardinality: 'UNIQUE_BLOCK',
    }),
  };
  const form = await seed.attributionForm(
    Object.values(attrs).map((attribute) => ({ id: attribute.id })),
  );
  const cultivar = await seed.cultivar();

  // record a value of every type through the UI (photos need a real upload)
  await walkToForm(page, form.name, cultivar.display_name);
  const field = (name: string) => formField(page, name);
  await field(attrs.text.name).locator('textarea').fill('first');
  await field(attrs.integer.name).locator('input').fill('42');
  await field(attrs.float.name).locator('input').fill('4.2');
  await field(attrs.boolean.name).locator('.q-toggle').click();
  await field(attrs.date.name)
    .getByRole('button', { name: '15', exact: true })
    .click();
  await field(attrs.rating.name)
    .getByRole('button', { name: '7', exact: true })
    .click();
  await selectOption(page, field(attrs.enum.name), 'two');
  await uploadPhoto(page, attrs.photo.name, 'e2e/assets/test.jpg');
  await saveAttribution(page);

  await pickCultivarAgain(page, cultivar.display_name);

  // the recorded values are shown in the disabled inputs
  await expect(field(attrs.text.name).locator('textarea')).toHaveValue('first');
  await expect(field(attrs.integer.name).locator('input')).toHaveValue('42');
  await expect(field(attrs.float.name).locator('input')).toHaveValue('4.2');
  await expect(field(attrs.boolean.name).locator('.q-toggle')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(
    field(attrs.date.name).getByRole('button', { name: '15', exact: true }),
  ).toHaveClass(/q-btn--unelevated/);
  await expect(
    field(attrs.rating.name).getByRole('button', { name: '7', exact: true }),
  ).not.toHaveClass(/q-btn--outline/);
  await expect(field(attrs.enum.name).locator('input')).toHaveValue('two');
  await expect(
    field(attrs.photo.name).locator('.attribute-form-input-photo__preview'),
  ).toBeVisible();

  // every input is disabled and has the hint directly below it
  const controls: [string, string][] = [
    [attrs.text.name, '.q-field__control'],
    [attrs.integer.name, '.q-field__control'],
    [attrs.float.name, '.q-field__control'],
    [attrs.boolean.name, '.q-toggle'],
    [attrs.date.name, '.q-date'],
    [attrs.rating.name, '.q-btn'],
    [attrs.enum.name, '.q-field__control'],
    [attrs.photo.name, '.attribute-form-input-photo'],
  ];
  for (const [name, controlSelector] of controls) {
    const hint = field(name).locator('.attribution-add-collision-hint');
    await expect(hint).toHaveText(
      /^Already recorded on \S+ by E2E Robot\. The attribute can be assigned only once and cannot be overwritten \(blocking\)\.$/,
    );
    await expect(field(name).locator('[aria-disabled="true"]')).toHaveCount(1);
    const controlBox = (await field(name)
      .locator(controlSelector)
      .first()
      .boundingBox())!;
    const hintBox = (await hint.boundingBox())!;
    expect(hintBox.y, name).toBeGreaterThanOrEqual(
      controlBox.y + controlBox.height,
    );
    expect(hintBox.y - (controlBox.y + controlBox.height), name).toBeLessThan(
      20,
    );
    // aligned with the label, like the hints of the other inputs
    const labelBox = (await field(name)
      .locator('div.text-weight-bold')
      .boundingBox())!;
    expect(Math.abs(hintBox.x - labelBox.x), name).toBeLessThan(1);
  }

  await page.screenshot({
    path: 'test-results/unique-block-all-types.png',
    fullPage: true,
  });
});
