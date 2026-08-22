import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { openAnalyzePage } from './support/analyze';
import { expectDialogClosed, formField } from './support/locators';

// Management of a saved analysis: note, rename, duplicate, and the
// "Add columns from form" shortcut in the column selector.

// The "Save as …" / rename dialog has a debounced async uniqueness validator
// on the name — clicking save while it is in flight hangs the dialog (same
// app bug that save() in support/locators.ts works around).
async function saveNameDialog(page: Page, name: string) {
  const dialog = page.locator('.q-dialog');
  await formField(dialog, 'Name').locator('input').fill(name);
  await page.waitForTimeout(350);
  await expect(dialog.locator('.q-spinner')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expectDialogClosed(page);
}

test('analyses support note, rename, duplicate and columns-from-form', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const name = `E2E Analysis ${seed.uid()}`;
  const renamed = `${name} renamed`;
  const copyName = `${name} copy`;

  // create
  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await saveNameDialog(page, name);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
  await seed.trackByName('analyze_filters', name); // cleanup even if the test fails below

  // note: add, save, persists across a reload
  const noteText = `analysis note ${seed.uid()}`;
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await formField(page, 'Notes').locator('textarea').fill(noteText);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForLoadState('networkidle'); // let the save land
  await page.reload();
  // once a note exists, an Edit button joins the label row — formField's
  // anchored label match no longer applies
  const noteField = page
    .locator('.entity-label')
    .filter({ hasText: 'Notes' })
    .first();
  await expect(noteField.locator('textarea').first()).toHaveValue(noteText);

  // rename (via the "More" fab)
  await page.getByTitle('More', { exact: true }).click();
  await page
    .locator('.q-fab__actions')
    .getByText('Rename', { exact: true })
    .click();
  await saveNameDialog(page, renamed);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(renamed);
  await seed.trackByName('analyze_filters', renamed);

  // duplicate: keeps the state, saves under a new name
  await page.getByTitle('More', { exact: true }).click();
  await page
    .locator('.q-fab__actions')
    .getByText('Duplicate', { exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'New Analysis',
  );
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await saveNameDialog(page, copyName);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(copyName);
  await seed.trackByName('analyze_filters', copyName);

  // add columns from form: all the form's attributes become columns
  await page.getByRole('combobox', { name: 'Add Column', exact: true }).click();
  await page
    .getByRole('button', { name: 'Add columns from form', exact: true })
    .click();
  const dialog = page.locator('.q-dialog');
  // the Add Column options menu stays open underneath the dialog, so the
  // shared selectOption helper (which assumes a single menu) does not apply:
  // scope the pick to the newest menu
  const formSelect = formField(dialog, 'Select form');
  await formSelect.locator('.q-field__control').click();
  await formSelect.locator('input:not([readonly])').fill(form.name);
  const menu = page.locator('.q-menu').last();
  await expect(async () => {
    const texts = await menu.locator('[role="option"]').allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) expect(text).toContain(form.name);
  }).toPass();
  await menu.locator('[role="option"]').first().click();
  await expect(
    page.locator('.entity-list-table th').filter({ hasText: attribute.name }),
  ).toHaveCount(1);
});
