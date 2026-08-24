import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// Full CRUD through the UI: the crossing must declare the selected plant's
// cultivar as its mother cultivar, so the spec seeds a full hierarchy plus a
// matching crossing.
test('mother plants can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const { cultivar, plants } = await seed.hierarchy();
  const crossing = await seed.crossing({ motherCultivarId: cultivar.id });
  const plant = plants[0]!;
  const name = `E2E UI Mother ${seed.uid()}`;
  const renamed = `${name} renamed`;

  // create
  await page.goto('/#/mother-plants/new');
  await formField(page, 'Name').locator('input').fill(name);
  await selectOption(page, formField(page, 'Crossing'), crossing.name);
  await selectOption(page, formField(page, 'Plant (label ID)'), plant.label_id);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('mother_plants', name); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/mother-plants?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);

  // view shows name, crossing and plant
  await listRow(page, name).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(name);
  await expect(page.locator('.q-dialog')).toContainText(crossing.name);
  await expect(page.locator('.q-dialog')).toContainText(plant.label_id);

  // edit
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const nameInput = formField(page, 'Name').locator('input');
  await expect(nameInput).toHaveValue(name);
  await nameInput.fill(renamed);
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/mother-plants?s=${encodeURIComponent(renamed)}`);
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
    `/#/mother-plants?s=${encodeURIComponent(renamed)}`,
    renamed,
  );
});
