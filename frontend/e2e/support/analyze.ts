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

// Add a rule to a filter tree and fill its column / operator / term.
// `column` must narrow the option list to exactly one match (e.g.
// "Cultivar > Name" or an attribute's unique name). `section` 0 is the base
// filter (table rows), 1 the attribution filter (cell values).
export async function addFilterRule(
  page: Page,
  section: 0 | 1,
  column: string,
  operator: string | RegExp,
  term?: string,
): Promise<void> {
  // the data-test attribute sits on the q-fab wrapper, the toggle is inside;
  // only the two root fabs carry the --root class
  const addFab = page
    .locator(
      '[data-test="analyze-filter-node__action-btn"].analyze-filter-node__action-btn--root',
    )
    .nth(section);
  await addFab.getByRole('button').first().click();
  await expect(addFab).toHaveClass(/q-fab--opened/);
  await addFab
    .locator('[data-test="analyze-filter-node__action-btn-and"]')
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

// Backwards-compatible shorthand for the base filter.
export async function addBaseFilterRule(
  page: Page,
  column: string,
  operator: string | RegExp,
  term?: string,
): Promise<void> {
  await addFilterRule(page, 0, column, operator, term);
}

// Make a column visible in the result table via the "Add Column" selector.
// `label` is the exact option text (attribute columns come with aggregation
// variants like "Attribute > x Count", so an exact match is required —
// e.g. pass "Attribute > <attribute name>").
export async function addResultColumn(
  page: Page,
  label: string,
): Promise<void> {
  const input = page
    .getByRole('combobox', { name: 'Add Column', exact: true })
    .first();
  await input.click();
  await input.fill(label);
  await page.getByRole('option', { name: label, exact: true }).click();
  await expect(page.locator('.q-menu')).toHaveCount(0);
}
