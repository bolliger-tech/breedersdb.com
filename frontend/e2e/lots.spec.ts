import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// Full CRUD through the UI: crossing + orchard selects and the masked
// name-segment input (\d\d[A-Z], displayed as "Breeding name" with the
// crossing name as prefix).
test('lots can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const crossing = await seed.crossing();
  const orchard = await seed.orchard();
  const fullName = `${crossing.name}.11Z`;
  const renamed = `${crossing.name}.22Z`;

  // create
  await page.goto('/#/lots/new');
  await selectOption(page, formField(page, 'Crossing'), crossing.name);
  await formField(page, 'Breeding name').locator('input').fill('11Z');
  await selectOption(page, formField(page, 'Orchard'), orchard.name);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('lots', fullName, 'full_name'); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/lots?s=${encodeURIComponent(fullName)}`);
  await expect(listRow(page, fullName)).toHaveCount(1);

  // view shows full name and the selected orchard
  await listRow(page, fullName).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(fullName);
  await expect(page.locator('.q-dialog')).toContainText(orchard.name);

  // edit the name segment; the async uniqueness check must accept it
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const segmentInput = formField(page, 'Breeding name').locator('input');
  await expect(segmentInput).toHaveValue('11Z');
  await segmentInput.fill('22Z');
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/lots?s=${encodeURIComponent(renamed)}`);
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
    `/#/lots?s=${encodeURIComponent(renamed)}`,
    renamed,
  );
});
