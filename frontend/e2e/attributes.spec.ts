import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  optionDeleteButton,
  optionRow,
  save,
  selectOption,
} from './support/locators';

// A new attribute defaults to data type TEXT and attribute type OBSERVATION.
// Full CRUD on that simplest shape; the other data types get a create+view
// test each below.
test('text attributes can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const name = `E2E UI Attr ${seed.uid()}`;
  const renamed = `${name} renamed`;

  // create
  await page.goto('/#/attributes/new');
  await formField(page, 'Name').locator('input').fill(name);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('attributes', name); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);

  // view
  await listRow(page, name).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(name);
  await expect(page.locator('.q-dialog')).toContainText('Text');

  // edit
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const nameInput = formField(page, 'Name').locator('input');
  await expect(nameInput).toHaveValue(name);
  await nameInput.fill(renamed);
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/attributes?s=${encodeURIComponent(renamed)}`);
  await expect(listRow(page, renamed)).toHaveCount(1);

  // delete (from the view modal, with confirmation dialog)
  await listRow(page, renamed).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page
    .locator('.q-dialog')
    .last()
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expectDialogClosed(page);
  await expectRowGone(
    page,
    `/#/attributes?s=${encodeURIComponent(renamed)}`,
    renamed,
  );
});

// The numeric data types require a validation rule (min/max, plus step for
// integer/decimal — rating has an implicit step of 1).
for (const dataType of ['Integer', 'Decimal', 'Rating'] as const) {
  test(`${dataType.toLowerCase()} attributes can be created`, async ({
    page,
    seed,
  }) => {
    const name = `E2E UI Attr ${seed.uid()}`;

    await page.goto('/#/attributes/new');
    await formField(page, 'Name').locator('input').fill(name);
    await selectOption(page, formField(page, 'Data type'), dataType);
    await formField(page, 'Minimum value').locator('input').fill('1');
    await formField(page, 'Maximum value').locator('input').fill('9');
    if (dataType !== 'Rating') {
      await formField(page, 'Step').locator('input').fill('1');
    }
    await save(page);
    await expectDialogClosed(page);
    await seed.trackByName('attributes', name);

    await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
    await listRow(page, name).click();
    await expect(page.locator('.q-dialog')).toContainText(dataType);
  });
}

// Data types without extra inputs.
for (const dataType of ['Boolean', 'Date', 'Photo'] as const) {
  test(`${dataType.toLowerCase()} attributes can be created`, async ({
    page,
    seed,
  }) => {
    const name = `E2E UI Attr ${seed.uid()}`;

    await page.goto('/#/attributes/new');
    await formField(page, 'Name').locator('input').fill(name);
    await selectOption(page, formField(page, 'Data type'), dataType);
    await save(page);
    await expectDialogClosed(page);
    await seed.trackByName('attributes', name);

    await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
    await listRow(page, name).click();
    await expect(page.locator('.q-dialog')).toContainText(dataType);
  });
}

// ENUM ("Selection") attributes come with the options editor.
test('selection attributes can be created with enum options', async ({
  page,
  seed,
}) => {
  const name = `E2E UI Attr ${seed.uid()}`;

  await page.goto('/#/attributes/new');
  await formField(page, 'Name').locator('input').fill(name);
  await selectOption(page, formField(page, 'Data type'), 'Selection');

  // the options carry the pre-selection, so the enum has no default-value field
  await expect(formField(page, 'Default value')).toHaveCount(0);

  // switching to Selection auto-adds one empty option row; fill it, then add
  // two more: one pre-selected, one disabled
  await page.getByPlaceholder('Option').first().fill('small');
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  await page.getByPlaceholder('Option').last().fill('large');
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  await page.getByPlaceholder('Option').last().fill('obsolete');
  await optionRow(page, 0).getByText('Pre-selected', { exact: true }).click();
  await optionRow(page, 2).getByText('Disabled', { exact: true }).click();

  await save(page);
  await expectDialogClosed(page);
  await seed.trackByName('attributes', name);

  // the view modal's preview starts on the pre-selected option and offers the
  // enabled ones only
  await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
  await listRow(page, name).click();
  await expect(page.locator('.q-dialog')).toContainText('Selection');
  const preview = page.locator('.q-dialog .q-select');
  await expect(preview.locator('input').first()).toHaveValue('small');
  await preview.click();
  const options = page.locator('.q-menu [role="option"]');
  await expect(options.filter({ hasText: 'small' })).toHaveCount(1);
  await expect(options.filter({ hasText: 'large' })).toHaveCount(1);
  await expect(options.filter({ hasText: 'obsolete' })).toHaveCount(0);
});

// The options editor blocks saves that would leave an attribute without a
// usable set of options.
test('the enum options editor rejects empty, duplicate and missing options', async ({
  page,
  seed,
}) => {
  const name = `E2E UI Attr ${seed.uid()}`;

  await page.goto('/#/attributes/new');
  await formField(page, 'Name').locator('input').fill(name);
  await selectOption(page, formField(page, 'Data type'), 'Selection');

  // the auto-added row is empty, which is not a valid option
  await save(page);
  await expect(page.getByText('Option is required').first()).toBeVisible();
  await expect(page.locator('.q-dialog')).toHaveCount(1);

  // two options with the same label
  await page.getByPlaceholder('Option').first().fill('same');
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  await page.getByPlaceholder('Option').last().fill('same');
  await save(page);
  await expect(
    page.getByText('Option labels must be unique.').first(),
  ).toBeVisible();
  await expect(page.locator('.q-dialog')).toHaveCount(1);

  // no options at all
  await optionDeleteButton(optionRow(page, 1)).click();
  await optionDeleteButton(optionRow(page, 0)).click();
  await expect(page.getByPlaceholder('Option')).toHaveCount(0);
  await save(page);
  await expect(page.getByText('Add at least one option.')).toBeVisible();
  await expect(page.locator('.q-dialog')).toHaveCount(1);

  // none of the rejected attempts got through
  await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(0);
});
