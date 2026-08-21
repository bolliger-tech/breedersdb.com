import { expect, test } from './support/fixtures';
import { addBaseFilterRule, openAnalyzePage } from './support/analyze';
import { listRow } from './support/locators';

// TESTING.md cases 1-3 on cultivars: filter by name, and by attribution text
// value with the exclusive (default) and non-exclusive ("include cultivars
// without attributions") predicate.

test('name filter shows only the matching cultivar', async ({ page, seed }) => {
  const target = await seed.cultivar();
  const other = await seed.cultivar();

  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await addBaseFilterRule(
    page,
    'Cultivar > Name',
    'equals',
    target.display_name,
  );

  await expect(listRow(page, target.display_name)).toHaveCount(1);
  await expect(page.locator('.entity-list-table tbody tr')).toHaveCount(1);
  await expect(listRow(page, other.display_name)).toHaveCount(0);
});

test('attribution filter is exclusive by default and inclusive on demand', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  // both cultivars share a lot so a name-prefix rule pins the result set —
  // in inclusive mode every other cultivar in the DB would match otherwise
  const lot = await seed.lot();
  const attributed = await seed.cultivar({ lotId: lot.id });
  const unattributed = await seed.cultivar({ lotId: lot.id });
  const uniqueText = `unique ${seed.uid()}`;
  await seed.attribution({
    formId: form.id,
    cultivarId: attributed.id,
    values: [
      { attributeId: attribute.id, dataType: 'TEXT', value: uniqueText },
    ],
  });

  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await addBaseFilterRule(
    page,
    'Cultivar > Name',
    'starts with',
    lot.full_name,
  );
  await addBaseFilterRule(
    page,
    `Attribute > ${attribute.name}`,
    'contains',
    uniqueText,
  );

  // exclusive (default): only the attributed cultivar
  await expect(listRow(page, attributed.display_name)).toHaveCount(1);
  await expect(page.locator('.entity-list-table tbody tr')).toHaveCount(1);

  // non-exclusive: cultivars without such an attribution show up as well
  await page
    .getByText(`Include cultivars without ${attribute.name} attributions.`)
    .click();
  await expect(listRow(page, attributed.display_name)).toHaveCount(1);
  await expect(listRow(page, unattributed.display_name)).toHaveCount(1);
  await expect(page.locator('.entity-list-table tbody tr')).toHaveCount(2);
});
