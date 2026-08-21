import { expect, type Page } from '@playwright/test';

// Helpers for the analyze filter UI. The rule selects are raw q-selects with
// inline labels (no BaseInputLabel wrapper), so the formField helper does not
// apply here.

// Wait until the analyze page is interactive: every initial GraphQL load
// re-renders the filter tree and silently discards the add-fab's open state.
export async function openAnalyzePage(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

// Add a rule to the base filter (the first add-fab on the page) and fill its
// column / operator / term. `column` must narrow the option list to exactly
// one match (e.g. "Cultivar > Name" or an attribute's unique name).
export async function addBaseFilterRule(
  page: Page,
  column: string,
  operator: string | RegExp,
  term?: string,
): Promise<void> {
  // the data-test attribute sits on the q-fab wrapper, the toggle is inside
  const addFab = page
    .locator('[data-test="analyze-filter-node__action-btn"]')
    .first();
  await addFab.getByRole('button').first().click();
  await expect(addFab).toHaveClass(/q-fab--opened/);
  await page
    .locator('[data-test="analyze-filter-node__action-btn-and"]')
    .first()
    .click();

  // exact accessible names — a bare hasText 'Column' would also match the
  // result table's "Add Column" selector
  const columnInput = page
    .getByRole('combobox', { name: 'Column', exact: true })
    .last();
  await columnInput.click();
  await columnInput.fill(column);
  // wait for the (debounced) filter to narrow the list to the one match
  await expect(page.locator('.q-menu [role="option"]')).toHaveCount(1);
  await page.locator('.q-menu [role="option"]').click();
  await expect(page.locator('.q-menu')).toHaveCount(0);

  await page
    .getByRole('combobox', { name: 'Operator', exact: true })
    .last()
    .click();
  await page
    .locator('.q-menu [role="option"]')
    .filter({
      hasText:
        typeof operator === 'string' ? new RegExp(`^${operator}$`) : operator,
    })
    .click();
  await expect(page.locator('.q-menu')).toHaveCount(0);

  if (term !== undefined) {
    await page.getByLabel('Value', { exact: true }).last().fill(term);
  }
}
