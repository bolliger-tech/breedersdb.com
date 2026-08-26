import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// Full CRUD through the UI: mother/father cultivar selects plus a name
// restricted to 8 chars of [-_\w] with an async uniqueness validator.
test('crossings can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const mother = await seed.cultivar();
  const father = await seed.cultivar();
  const name = `E${seed.uid()}`; // 8 chars, no spaces allowed
  const renamed = `R${name.slice(1)}`;

  // create
  await page.goto('/#/crossings/new');
  await selectOption(
    page,
    formField(page, 'Mother Cultivar'),
    mother.display_name,
  );
  await selectOption(
    page,
    formField(page, 'Father Cultivar'),
    father.display_name,
  );
  await formField(page, 'Name').locator('input').fill(name);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('crossings', name); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/crossings?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);

  // view shows name and both parent cultivars
  await listRow(page, name).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(name);
  await expect(page.locator('.q-dialog')).toContainText(mother.display_name);
  await expect(page.locator('.q-dialog')).toContainText(father.display_name);

  // edit
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const nameInput = formField(page, 'Name').locator('input');
  await expect(nameInput).toHaveValue(name);
  await nameInput.fill(renamed);
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/crossings?s=${encodeURIComponent(renamed)}`);
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
    `/#/crossings?s=${encodeURIComponent(renamed)}`,
    renamed,
  );
});
