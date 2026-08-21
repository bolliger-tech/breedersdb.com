import { expect, test } from './support/fixtures';

// Build a base filter rule in the UI (cultivar name equals X) and assert the
// GraphQL query/variables the app generates, via the hidden debug block in
// AnalyzeResult.vue. DB-independent.
test('a filter rule built in the UI lands in the generated query', async ({
  page,
}) => {
  await page.goto('/#/cultivars/analyze/new');
  // wait until all initial GraphQL loads are in — each arrival re-renders
  // the filter tree and silently discards the add-fab's open state
  await page.waitForLoadState('networkidle');

  // add an "and" rule to the base filter (the first add-fab on the page);
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

  // column: Cultivar > Name (options are static, filtered by typed text)
  const columnSelect = page
    .locator('.q-select')
    .filter({ hasText: 'Column' })
    .first();
  await columnSelect.locator('.q-field__control').click();
  await columnSelect.locator('input:not([readonly])').fill('Cultivar > Name');
  // wait for the (debounced) filter to narrow the list to the one match
  await expect(page.locator('.q-menu [role="option"]')).toHaveCount(1);
  await page.locator('.q-menu [role="option"]').click();
  await expect(page.locator('.q-menu')).toHaveCount(0);

  // operator: equals
  const operatorSelect = page
    .locator('.q-select')
    .filter({ hasText: 'Operator' })
    .first();
  await operatorSelect.locator('.q-field__control').click();
  await page
    .locator('.q-menu [role="option"]')
    .filter({ hasText: /^equals$/ })
    .click();
  await expect(page.locator('.q-menu')).toHaveCount(0);

  // term
  const termInput = page
    .locator('.q-input')
    .filter({ hasText: 'Value' })
    .first()
    .locator('input');
  await termInput.fill('e2e-no-such-cultivar');

  // the generated query filters cultivars by display_name with our term
  const query = page.locator('[data-test="query"]');
  const variables = page.locator('[data-test="variables"]');
  await expect(query).toContainText('display_name');
  await expect(query).toContainText('_eq');
  await expect(variables).toContainText('e2e-no-such-cultivar');
});
