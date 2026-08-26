import { expect, test } from './support/fixtures';
import { addBaseFilterRule, openAnalyzePage } from './support/analyze';

// Build a base filter rule in the UI (cultivar name equals X) and assert the
// GraphQL query/variables the app generates, via the hidden debug block in
// AnalyzeResult.vue. DB-independent.
test('a filter rule built in the UI lands in the generated query', async ({
  page,
}) => {
  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await addBaseFilterRule(
    page,
    'Cultivar > Name',
    'equals',
    'e2e-no-such-cultivar',
  );

  // the generated query filters cultivars by display_name with our term
  const query = page.locator('[data-test="query"]');
  const variables = page.locator('[data-test="variables"]');
  await expect(query).toContainText('display_name');
  await expect(query).toContainText('_eq');
  await expect(variables).toContainText('e2e-no-such-cultivar');
});
