import type { Locator } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { uploadPhoto, walkToForm } from './support/attribute-flow';

// View-modal content beyond the plain field table, exercised on the cultivar
// view modal (the richest one): attributions incl. the photo gallery, and
// the related-entity tables. Attributions render from cached_attributions,
// so seeded attributions show up without going through the UI — except
// PHOTO values, which only exist after a real UI upload.

test('attributions and photos render on the cultivar view modal', async ({
  page,
  seed,
}) => {
  const text = await seed.attribute({ dataType: 'TEXT' });
  const photo = await seed.attribute({ dataType: 'PHOTO' });
  const form = await seed.attributionForm([{ id: text.id }, { id: photo.id }]);
  const cultivar = await seed.cultivar();
  const uniqueText = `a view modal text ${seed.uid()}`;
  await seed.attribution({
    formId: form.id,
    cultivarId: cultivar.id,
    values: [{ attributeId: text.id, dataType: 'TEXT', value: uniqueText }],
  });

  // the photo can only be attributed through the UI upload
  await walkToForm(page, form.name, cultivar.display_name);
  await uploadPhoto(page, photo.name, 'e2e/assets/test.jpg');
  await page.locator('.attribute-form-save-btn .q-btn').click();
  await expect(page.locator('.q-notification')).toContainText(
    'Attribution saved.',
  );

  await page.goto(`/#/cultivars/${cultivar.id}`);
  const dialog = page.locator('.q-dialog');
  await expect(dialog.getByRole('heading', { level: 2 })).toContainText(
    cultivar.display_name,
  );

  // photo gallery under "Photos"
  await expect(
    dialog.locator('.q-scrollarea img[src*="/api/assets/"]').first(),
  ).toBeVisible();

  // the seeded TEXT attribution under "Observations"
  const observations = dialog
    .locator('.entity-related-table')
    .filter({ hasText: text.name });
  await expect(observations).toContainText(uniqueText);
});

test('related entities render on the cultivar view modal', async ({
  page,
  seed,
}) => {
  const { cultivar, groups, plants } = await seed.hierarchy();
  const group = groups[0]!;
  const plant = plants[0]!;

  await page.goto(`/#/cultivars/${cultivar.id}`);
  const dialog = page.locator('.q-dialog');
  await expect(dialog.getByRole('heading', { level: 2 })).toContainText(
    cultivar.display_name,
  );

  // plant groups table and active plants list (the plant's row also shows
  // the group name, so pin the group row to its drill-down link)
  const groupLink = dialog.locator(`a[href="#/groups/${group.id}"]`);
  await expect(groupLink).toHaveCount(1);
  await expect(
    dialog.locator('tbody tr').filter({ hasText: plant.label_id }),
  ).toHaveCount(1);

  // the link drills down into the plant group
  await groupLink.click();
  await expect(page).toHaveURL(new RegExp(`/groups/${group.id}$`));
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    group.display_name,
  );
});

test('related-entity tables keep short values on one line and scroll', async ({
  page,
  seed,
}) => {
  // narrow viewport: with wrapping cells, names and dates broke across lines
  await page.setViewportSize({ width: 375, height: 800 });
  const { plants } = await seed.hierarchy();
  const plant = plants[0]!;
  const motherPlant = await seed.motherPlant({ plantId: plant.id });
  const text = await seed.attribute({ dataType: 'TEXT' });
  const form = await seed.attributionForm([{ id: text.id }]);
  const longText = `long free text ${seed.uid()} `.repeat(8);
  await seed.attribution({
    formId: form.id,
    plantId: plant.id,
    values: [{ attributeId: text.id, dataType: 'TEXT', value: longText }],
  });

  await page.goto(`/#/plants/${plant.id}`);
  const dialog = page.locator('.q-dialog');
  const motherPlants = dialog
    .locator('.entity-related-table')
    .filter({ hasText: motherPlant.name });
  const row = motherPlants.locator('tbody tr').first();
  await expect(row).toBeVisible();

  const nameCell = row.locator('td').first();
  const createdCell = row.locator('td').last();
  // polled: the layout may still settle (fonts, dialog transition)
  await expect.poll(() => countLines(nameCell)).toBe(1);
  await expect.poll(() => countLines(createdCell)).toBe(1);

  // the table scrolls horizontally instead of squeezing the cells
  const tableScroller = motherPlants.locator('.q-table__middle');
  await expect
    .poll(() => tableScroller.evaluate((el) => el.scrollWidth > el.clientWidth))
    .toBe(true);

  // free text still wraps
  const valueCell = dialog
    .locator('.entity-related-table td')
    .filter({ hasText: longText.trim() });
  await expect.poll(() => countLines(valueCell)).toBeGreaterThan(1);
  // ... but isn't squeezed to one word per line
  await expect
    .poll(async () => (await valueCell.boundingBox())!.width)
    .toBeGreaterThanOrEqual(100);
});

// number of rendered text lines in an element
function countLines(locator: Locator) {
  return locator.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops = [...range.getClientRects()].map((r) => Math.round(r.top));
    return new Set(tops).size;
  });
}
