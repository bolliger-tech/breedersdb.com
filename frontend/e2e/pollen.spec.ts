import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// Full CRUD through the UI: name with uniqueness check, required cultivar
// select, optional harvest date and note.
test('pollen can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const cultivar = await seed.cultivar();
  const name = `E2E UI Pollen ${seed.uid()}`;
  const renamed = `${name} renamed`;

  // create
  await page.goto('/#/pollen/new');
  await formField(page, 'Name').locator('input').fill(name);
  await selectOption(page, formField(page, 'Cultivar'), cultivar.display_name);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('pollen', name); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/pollen?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);

  // view shows the name and the cultivar
  await listRow(page, name).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(name);
  await expect(page.locator('.q-dialog')).toContainText(cultivar.display_name);

  // edit
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const nameInput = formField(page, 'Name').locator('input');
  await expect(nameInput).toHaveValue(name);
  await nameInput.fill(renamed);
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/pollen?s=${encodeURIComponent(renamed)}`);
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
