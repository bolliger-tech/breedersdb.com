import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { listRow } from './support/locators';

// Shared EntityListTable behavior (column selector, sorting, pagination,
// XLSX export), exercised on orchards as the representative entity. All
// state lives in query args (?col= ?sortBy= ?desc= ?page= ?rowsPerPage=)
// plus localStorage for the visible columns. Rows are always pinned to a
// seeded unique name (prefix) via ?s= — other workers' rows stay invisible.

function nameHeader(page: Page) {
  return page
    .locator('th.entity-list-table-header-cell')
    .filter({ hasText: 'Name' });
}

test('columns can be hidden (persisted) and re-added', async ({
  page,
  seed,
}) => {
  const orchard = await seed.orchard();
  const listUrl = `/#/orchards?s=${encodeURIComponent(orchard.name)}`;

  await page.goto(listUrl);
  await expect(listRow(page, orchard.name)).toHaveCount(1);

  // hide the Name column via the header cell's close button
  await nameHeader(page)
    .getByRole('button')
    .filter({ hasText: 'close' })
    .click();
  await expect(nameHeader(page)).toHaveCount(0);
  await expect(listRow(page, orchard.name)).toHaveCount(0); // rows lost the name cell

  // the choice is persisted (localStorage) into a fresh document — assert it
  // on a second page so this one keeps its state for the re-add below
  const freshPage = await page.context().newPage();
  await freshPage.goto(listUrl);
  await expect(
    freshPage.locator('.entity-list-table tbody tr'),
  ).not.toHaveCount(0);
  await expect(nameHeader(freshPage)).toHaveCount(0);
  await freshPage.close();

  // re-add it through the Add Column selector
  await page.locator('.q-select').filter({ hasText: 'Add Column' }).click();
  await page.getByRole('option', { name: 'Name', exact: true }).click();
  await expect(nameHeader(page)).toHaveCount(1);
  await expect(listRow(page, orchard.name)).toHaveCount(1);
});

test('clicking a header cell sorts the list', async ({ page, seed }) => {
  const prefix = `E2E Sort ${seed.uid()}`;
  for (const suffix of ['a', 'b', 'c']) {
    await seed.orchard({ name: `${prefix} ${suffix}` });
  }

  await page.goto(`/#/orchards?s=${encodeURIComponent(prefix)}`);
  const rows = page.locator('.entity-list-table tbody tr');
  await expect(rows).toHaveCount(3);

  // default sort is name ascending
  await expect(rows.first()).toContainText(`${prefix} a`);

  // toggle to descending (binary-state-sort: asc <-> desc)
  await nameHeader(page).getByText('Name').click();
  await expect(page).toHaveURL(/desc=true/);
  await expect(rows.first()).toContainText(`${prefix} c`);

  await nameHeader(page).getByText('Name').click();
  await expect(page).toHaveURL(/desc=false/);
  await expect(rows.first()).toContainText(`${prefix} a`);
});

test('pagination pages through the filtered rows', async ({ page, seed }) => {
  const prefix = `E2E Page ${seed.uid()}`;
  for (let i = 1; i <= 11; i++) {
    await seed.orchard({ name: `${prefix} ${String(i).padStart(2, '0')}` });
  }

  await page.goto(`/#/orchards?s=${encodeURIComponent(prefix)}&rowsPerPage=10`);
  const rows = page.locator('.entity-list-table tbody tr');
  const bottom = page.locator('.q-table__bottom');
  await expect(rows).toHaveCount(10);
  await expect(bottom).toContainText('1-10 of 11');
  await expect(rows.last()).toContainText(`${prefix} 10`);

  await bottom.getByRole('button').filter({ hasText: 'chevron_right' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(`${prefix} 11`);
  await expect(bottom).toContainText('11-11 of 11');
});

test('the export button downloads an XLSX file', async ({ page, seed }) => {
  const orchard = await seed.orchard();
  await page.goto(`/#/orchards?s=${encodeURIComponent(orchard.name)}`);
  await expect(listRow(page, orchard.name)).toHaveCount(1);

  // file contents are out of scope — assert the download event only
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
});
