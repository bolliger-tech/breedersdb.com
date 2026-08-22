import { expect, test } from './support/fixtures';
import {
  addBaseFilterRule,
  addFilterRule,
  addResultColumn,
  openAnalyzePage,
} from './support/analyze';
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

// TESTING.md cases 4-6 on cultivars: attribution values render as columns,
// and the attribution filter (cell values) keeps/hides them by date.
test('attribution values render and the column filter applies', async ({
  page,
  seed,
}) => {
  const text = await seed.attribute({ dataType: 'TEXT' });
  const integer = await seed.attribute({ dataType: 'INTEGER' });
  const float = await seed.attribute({ dataType: 'FLOAT' });
  const boolean = await seed.attribute({ dataType: 'BOOLEAN' });
  const date = await seed.attribute({ dataType: 'DATE' });
  const rating = await seed.attribute({ dataType: 'RATING' });
  const attributes = [text, integer, float, boolean, date, rating];
  const form = await seed.attributionForm(
    attributes.map((attribute) => ({ id: attribute.id })),
  );
  const cultivar = await seed.cultivar();
  const uniqueText = `case4 ${seed.uid()}`;
  await seed.attribution({
    formId: form.id,
    cultivarId: cultivar.id,
    dateAttributed: '2025-01-01',
    values: [
      { attributeId: text.id, dataType: 'TEXT', value: uniqueText },
      { attributeId: integer.id, dataType: 'INTEGER', value: 77 },
      { attributeId: float.id, dataType: 'FLOAT', value: 0.4 },
      { attributeId: boolean.id, dataType: 'BOOLEAN', value: false },
      { attributeId: date.id, dataType: 'DATE', value: '2025-03-05' },
      { attributeId: rating.id, dataType: 'RATING', value: 8 },
    ],
  });

  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await addBaseFilterRule(
    page,
    'Cultivar > Name',
    'equals',
    cultivar.display_name,
  );
  for (const attribute of attributes) {
    await addResultColumn(
      page,
      attribute.name,
      `Attribute > ${attribute.name}`,
    );
  }

  // case 4: every typed value renders in its cell
  const row = listRow(page, cultivar.display_name);
  await expect(row).toHaveCount(1);
  await expect(
    row.getByText(uniqueText, { exact: true }).first(),
  ).toBeVisible();
  await expect(row.getByText('77', { exact: true }).first()).toBeVisible();
  await expect(row.getByText('0.4', { exact: true }).first()).toBeVisible();
  await expect(row.getByText('✕', { exact: true }).first()).toBeVisible(); // boolean false
  await expect(
    row.getByText('03/05/2025', { exact: true }).first(),
  ).toBeVisible();
  await expect(row.getByText('8', { exact: true }).first()).toBeVisible();

  // case 5: attribution filter matching the attribution date keeps the values
  await addFilterRule(page, 1, 'Attribution > Date', 'equals', '2025-01-01');
  await expect(
    row.getByText(uniqueText, { exact: true }).first(),
  ).toBeVisible();

  // case 6: a non-matching date hides all attribution values
  await page.getByLabel('Value', { exact: true }).last().fill('2024-12-31');
  await expect(row.getByText(uniqueText, { exact: true })).toHaveCount(0);
  await expect(row.getByText('77', { exact: true })).toHaveCount(0);
});

// TESTING.md case 7: aggregation columns. Two decimal attributions (0.1 and
// 0.9) on one cultivar: count 2, max 0.9, min 0.1, mean/median 0.5 and
// (population) SD 0.4.
test('aggregation columns compute count, min, max, mean, median and SD', async ({
  page,
  seed,
}) => {
  const float = await seed.attribute({ dataType: 'FLOAT' });
  const form = await seed.attributionForm([{ id: float.id }]);
  const cultivar = await seed.cultivar();
  for (const value of [0.1, 0.9]) {
    await seed.attribution({
      formId: form.id,
      cultivarId: cultivar.id,
      values: [{ attributeId: float.id, dataType: 'FLOAT', value }],
    });
  }

  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await addBaseFilterRule(
    page,
    'Cultivar > Name',
    'equals',
    cultivar.display_name,
  );
  for (const aggregation of ['Count', 'Max', 'Min', 'Mean', 'Median', 'SD']) {
    await addResultColumn(
      page,
      float.name,
      `Attribute > ${float.name} ${aggregation}`,
    );
  }

  const row = listRow(page, cultivar.display_name);
  await expect(row).toHaveCount(1);
  await expect(row.getByText('2', { exact: true }).first()).toBeVisible(); // count
  await expect(row.getByText('0.9', { exact: true }).first()).toBeVisible(); // max
  await expect(row.getByText('0.1', { exact: true }).first()).toBeVisible(); // min
  await expect(row.getByText('0.5', { exact: true })).toHaveCount(2); // mean + median
  await expect(row.getByText('0.4', { exact: true }).first()).toBeVisible(); // SD
});

// TESTING.md case 8: attributions recorded on a cultivar's plant groups and
// plants roll up into the cultivar analysis.
test('group and plant attributions roll up to the cultivar', async ({
  page,
  seed,
}) => {
  const text = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: text.id }]);
  const { cultivar, groups, plants } = await seed.hierarchy();
  const groupText = `group note ${seed.uid()}`;
  const plantText = `plant note ${seed.uid()}`;
  await seed.attribution({
    formId: form.id,
    plantGroupId: groups[0]!.id,
    values: [{ attributeId: text.id, dataType: 'TEXT', value: groupText }],
  });
  await seed.attribution({
    formId: form.id,
    plantId: plants[0]!.id,
    values: [{ attributeId: text.id, dataType: 'TEXT', value: plantText }],
  });

  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await addBaseFilterRule(
    page,
    'Cultivar > Name',
    'equals',
    cultivar.display_name,
  );
  await addResultColumn(page, text.name, `Attribute > ${text.name}`);

  const row = listRow(page, cultivar.display_name);
  await expect(row).toHaveCount(1);
  await expect(row.getByText(groupText, { exact: true }).first()).toBeVisible();
  await expect(row.getByText(plantText, { exact: true }).first()).toBeVisible();
});
