import { expect, test, type Page } from '@playwright/test';

// Every entity list page exercises the router, urql, the gql.tada generated
// types, QTable and vue-i18n at once - which is exactly the surface a
// dependency upgrade breaks.
const ENTITY_LISTS = [
  { path: '/plants', heading: 'Plants' },
  { path: '/groups', heading: 'Groups' },
  { path: '/cultivars', heading: 'Cultivars' },
  { path: '/lots', heading: 'Lots' },
  { path: '/crossings', heading: 'Crossings' },
  { path: '/attributions', heading: 'Attributions' },
  { path: '/attributes', heading: 'Attributes' },
  { path: '/attribution-forms', heading: 'Attribution Forms' },
  { path: '/orchards', heading: 'Orchards' },
  { path: '/rootstocks', heading: 'Rootstocks' },
];

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

for (const { path, heading } of ENTITY_LISTS) {
  test(`${path} lists rows`, async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto(`/#${path}`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(
      page.locator('.entity-list-table tbody tr').first(),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });
}
