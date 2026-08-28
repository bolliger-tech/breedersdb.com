import { expect, test } from './support/fixtures';
import { openAnalyzePage, saveNameDialog } from './support/analyze';
import { expectRowGone, listRow } from './support/locators';

// The saved-analyses index on cultivars: create via the "Save as …" dialog on
// a new analysis, find it in the list, open it again and delete it through
// the More menu.
test('saved analyses can be created, listed, opened and deleted', async ({
  page,
  seed,
}) => {
  const name = `E2E Analysis ${seed.uid()}`;

  // create: a fresh analysis is only stored once it is named and saved
  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'New Analysis',
  );
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.q-dialog')).toContainText('Save as …');
  await saveNameDialog(page, name);
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
  await expectRowGone(
    page,
    `/#/cultivars/analyze?s=${encodeURIComponent(name)}`,
    name,
  );
});
