import { expect, test } from './support/fixtures';
import { expectDialogClosed, listRow, save } from './support/locators';

// Attributions have no AddModal (they are created via the attribute flow) —
// this covers list search, the view modal, the single-value edit modal and
// deletion, on a seeded INTEGER attribution.
test('attributions can be viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({ dataType: 'INTEGER' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();
  await seed.attribution({
    formId: form.id,
    cultivarId: cultivar.id,
    values: [{ attributeId: attribute.id, dataType: 'INTEGER', value: 5 }],
  });

  // list + search (by the unique attribute name)
  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  const row = listRow(page, attribute.name);
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(cultivar.display_name);
  await expect(row).toContainText('5');

  // view
  await row.click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    attribute.name,
  );
  await expect(page.locator('.q-dialog')).toContainText(cultivar.display_name);

  // edit the value
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const valueInput = page.locator('.q-dialog input[type="number"]');
  await expect(valueInput).toHaveValue('5');
  await valueInput.fill('7');
  await save(page);
  await expectDialogClosed(page);

  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  await expect(row).toContainText('7');

  // delete (from the view modal, with confirmation dialog)
  await row.click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page
    .locator('.q-dialog')
    .last()
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expectDialogClosed(page);
  await expect(row).toHaveCount(0);
});
