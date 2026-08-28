import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// CRUD through the UI: 8-digit label id with uniqueness check, required
// group select plus row/rootstock/grafting selects, and elimination (plants
// offer no UI delete; the Eliminate button #-prefixes the label id and moves
// the plant to the "Disabled" tab).
test('plants can be created, viewed, edited and eliminated', async ({
  page,
  seed,
}) => {
  const group = await seed.plantGroup();
  const row = await seed.plantRow();
  const rootstock = await seed.rootstock();
  const grafting = await seed.grafting();
  const labelId = seed.labelId();

  // create
  await page.goto('/#/plants/new');
  await formField(page, 'Label ID').locator('input').fill(labelId);
  await selectOption(page, formField(page, 'Group'), group.display_name);
  await selectOption(page, formField(page, 'Row'), row.name);
  await selectOption(page, formField(page, 'Rootstock'), rootstock.name);
  await selectOption(page, formField(page, 'Grafting'), grafting.name);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  await seed.trackByName('plants', labelId, 'label_id'); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/plants?s=${encodeURIComponent(labelId)}`);
  await expect(listRow(page, labelId)).toHaveCount(1);

  // view shows label id and the selected relations
  await listRow(page, labelId).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(labelId);
  await expect(page.locator('.q-dialog')).toContainText(rootstock.name);
  await expect(page.locator('.q-dialog')).toContainText(grafting.name);

  // edit: move the plant along its row
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(formField(page, 'Label ID').locator('input')).toHaveValue(
    labelId,
  );
  await formField(page, 'Distance to row start').locator('input').fill('1.5');
  await save(page);
  await expectDialogClosed(page);
  await page.goto(`/#/plants?s=${encodeURIComponent(labelId)}`);
  await listRow(page, labelId).click();
  await expect(page.locator('.q-dialog')).toContainText('1.5');

  // eliminate (button on the view modal, with confirmation dialog; the view
  // modal itself stays open)
  await page.getByRole('button', { name: 'Eliminate', exact: true }).click();
  await page
    .locator('.q-dialog')
    .last()
    .getByRole('button', { name: 'Eliminate', exact: true })
    .click();
  await expect(page.locator('.q-dialog')).toHaveCount(1);

  // eliminating prefixes the label id with # and moves the plant from the
  // active tab to the disabled one. Assert the active tab with the *old*
  // label id: searching a #-prefixed one makes IndexPage switch the list to
  // the "All" tab (it watches `search` for exactly that), which puts the
  // eliminated plant back on screen 20ms later.
  const eliminatedLabel = `#${labelId}`;
  await expectRowGone(
    page,
    `/#/plants?tab=active&s=${encodeURIComponent(labelId)}`,
    labelId,
  );
  await page.goto(
    `/#/plants?tab=disabled&s=${encodeURIComponent(eliminatedLabel)}`,
  );
  await expect(listRow(page, eliminatedLabel)).toHaveCount(1);
});
