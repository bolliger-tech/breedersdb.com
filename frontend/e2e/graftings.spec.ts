import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  save,
} from './support/locators';

// Full CRUD through the UI: the grafting form is a single name field with an
// async uniqueness validator.
test('graftings can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const name = `E2E UI Graft ${seed.uid()}`;
  const renamed = `${name} renamed`;

  // create
  await page.goto('/#/graftings/new');
  await formField(page, 'Name').locator('input').fill(name);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('graftings', name); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/graftings?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);

  // view
  await listRow(page, name).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(name);

  // edit
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const nameInput = formField(page, 'Name').locator('input');
  await expect(nameInput).toHaveValue(name);
  await nameInput.fill(renamed);
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/graftings?s=${encodeURIComponent(renamed)}`);
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
    `/#/graftings?s=${encodeURIComponent(renamed)}`,
    renamed,
  );
});
