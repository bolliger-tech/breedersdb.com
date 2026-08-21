import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  formField,
  listRow,
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
  await expect(listRow(page, renamed)).toHaveCount(0);
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

  // switching to Selection auto-adds one empty option row; fill it, add a
  // second one and pre-select the first
  await page.getByPlaceholder('Option').first().fill('small');
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  await page.getByPlaceholder('Option').last().fill('large');
  await page.getByText('Pre-selected', { exact: true }).first().click();

  await save(page);
  await expectDialogClosed(page);
  await seed.trackByName('attributes', name);

  // the view modal renders the options inside the preview's dropdown
  await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
  await listRow(page, name).click();
  await expect(page.locator('.q-dialog')).toContainText('Selection');
  await page.locator('.q-dialog .q-select').click();
  const options = page.locator('.q-menu [role="option"]');
  await expect(options.filter({ hasText: 'small' })).toHaveCount(1);
  await expect(options.filter({ hasText: 'large' })).toHaveCount(1);
});
