import { expect, test } from './support/fixtures';
import { expectDialogClosed, formField, listRow } from './support/locators';

// The saved-analyses index on cultivars: create via the "Save as …" dialog on
// a new analysis, find it in the list, open it again and delete it through
// the More menu.
test('saved analyses can be created, listed, opened and deleted', async ({
  page,
  seed,
}) => {
  const name = `E2E Analysis ${seed.uid()}`;

  // create: a fresh analysis is only stored once it is named and saved
  await page.goto('/#/cultivars/analyze/new');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'New Analysis',
  );
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const dialog = page.locator('.q-dialog');
  await expect(dialog).toContainText('Save as …');
  await formField(dialog, 'Name').locator('input').fill(name);
  // the name field has a debounced async uniqueness validator — clicking
  // save while it is in flight hangs the dialog (same app bug as save() in
  // support/locators.ts works around; see COVERAGE.md)
  await page.waitForTimeout(350);
  await expect(dialog.locator('.q-spinner')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expectDialogClosed(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
  await seed.trackByName('analyze_filters', name); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/cultivars/analyze?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);

  // open
  await listRow(page, name).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);

  // delete (via the "More" fab, with confirmation dialog)
  await page.getByTitle('More', { exact: true }).click();
  await page
    .locator('.q-fab__actions')
    .getByText('Delete', { exact: true })
    .click();
  await page
    .locator('.q-dialog')
    .last()
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await page.goto(`/#/cultivars/analyze?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(0);
});
