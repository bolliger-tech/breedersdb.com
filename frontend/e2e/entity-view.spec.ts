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
