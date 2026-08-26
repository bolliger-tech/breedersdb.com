import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// Full CRUD through the UI: readonly label id, cultivar select, free-text
// name segment ("Breeding name", <= 25 chars) with async uniqueness check.
test('plant groups can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const cultivar = await seed.cultivar();
  const segment = `G${seed.uid()}`;
  const displayName = `${cultivar.display_name}.${segment}`;
  const renamed = `${cultivar.display_name}.${segment}R`;

  // create
  await page.goto('/#/groups/new');
  await selectOption(page, formField(page, 'Cultivar'), cultivar.display_name);
  await formField(page, 'Breeding name').locator('input').fill(segment);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('plant_groups', displayName, 'display_name'); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/groups?s=${encodeURIComponent(displayName)}`);
  await expect(listRow(page, displayName)).toHaveCount(1);

  // view
  await listRow(page, displayName).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    displayName,
  );

  // edit the name segment
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const segmentInput = formField(page, 'Breeding name').locator('input');
  await expect(segmentInput).toHaveValue(segment);
  await segmentInput.fill(`${segment}R`);
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/groups?s=${encodeURIComponent(renamed)}`);
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
    `/#/groups?s=${encodeURIComponent(renamed)}`,
    renamed,
  );
});
