import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// Full CRUD through the UI: the form is composed via the "Add Field"
// attribute picker; each picked field row carries a required flag
// ("Warn if not filled out") and can be reordered by drag and drop.
test('attribution forms can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const attrA = await seed.attribute({ dataType: 'INTEGER' });
  const attrB = await seed.attribute({ dataType: 'TEXT' });
  const name = `E2E UI Form ${seed.uid()}`;
  const renamed = `${name} renamed`;

  // create: pick both attributes, flag the first as required
  await page.goto('/#/attribution-forms/new');
  await formField(page, 'Name').locator('input').fill(name);
  await selectOption(page, formField(page, 'Add Field'), attrA.name, {
    resets: true,
  });
  await selectOption(page, formField(page, 'Add Field'), attrB.name, {
    resets: true,
  });
  await page
    .getByText('Warn if not filled out', { exact: true })
    .first()
    .click();
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('attribution_forms', name); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/attribution-forms?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);

  // view shows both fields
  await listRow(page, name).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(name);
  await expect(page.locator('.q-dialog')).toContainText(attrA.name);
  await expect(page.locator('.q-dialog')).toContainText(attrB.name);

  // edit: rename and check the picked fields kept their order and flags
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const nameInput = formField(page, 'Name').locator('input');
  await expect(nameInput).toHaveValue(name);
  await expect(page.locator('.q-dialog .q-select input').first()).toHaveValue(
    attrA.name,
  );
  await expect(
    page.locator('.q-dialog [role="checkbox"]').first(),
  ).toHaveAttribute('aria-checked', 'true');
  await nameInput.fill(renamed);
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/attribution-forms?s=${encodeURIComponent(renamed)}`);
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
