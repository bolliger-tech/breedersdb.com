import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// CRUD on the most involved entity form: breeders-cultivar/variety toggle,
// lot select, composed name segment with async uniqueness validation.
test('cultivars can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const lot = await seed.lot();
  const fullName = `${lot.full_name}.001`;
  const renamed = `${lot.full_name}.002`;

  // create a breeders cultivar (the default type) in the seeded lot
  await page.goto('/#/cultivars/new');
  await selectOption(page, formField(page, 'Lot'), lot.full_name);
  await formField(page, 'Breeding name').locator('input').fill('001');
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('cultivars', fullName, 'display_name');

  // list + search (default tab is breeders cultivars)
  await page.goto(`/#/cultivars?s=${encodeURIComponent(fullName)}`);
  await expect(listRow(page, fullName)).toHaveCount(1);

  // view
  await listRow(page, fullName).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(fullName);

  // edit the breeding-name segment; the async uniqueness check must accept it
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const segmentInput = formField(page, 'Breeding name').locator('input');
  await expect(segmentInput).toHaveValue('001');
  await segmentInput.fill('002');
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/cultivars?s=${encodeURIComponent(renamed)}`);
  await expect(listRow(page, renamed)).toHaveCount(1);

  // delete (confirmation dialog)
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
