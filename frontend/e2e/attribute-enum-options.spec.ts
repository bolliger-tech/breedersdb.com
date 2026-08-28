import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  formField,
  listRow,
  optionDeleteButton,
  optionRow,
  save,
} from './support/locators';
import { walkToForm } from './support/attribute-flow';
import type { Seeder } from './support/seed';

// Managing the options of an enum attribute that is already in use: the
// editor must protect recorded values (no delete, rename propagates) while
// still allowing the option set to evolve (add, delete unused, disable).

// An enum attribute whose FIRST option is recorded on a cultivar.
async function seedRecordedEnum(seed: Seeder) {
  const attribute = await seed.attribute({
    dataType: 'ENUM',
    enumOptions: ['round', 'oblong', 'conical'],
  });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();
  await seed.attribution({
    formId: form.id,
    cultivarId: cultivar.id,
    values: [
      {
        attributeId: attribute.id,
        dataType: 'ENUM',
        enumOptionId: attribute.enum_options[0]!.id,
      },
    ],
  });
  return { attribute, form, cultivar };
}

async function openOptionsEditor(page: Page, name: string): Promise<void> {
  await page.goto(`/#/attributes?s=${encodeURIComponent(name)}`);
  await listRow(page, name).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByPlaceholder('Option').first()).toBeVisible();
}

test('options in use cannot be deleted, the rest of the set stays editable', async ({
  page,
  seed,
}) => {
  const { attribute } = await seedRecordedEnum(seed);
  await openOptionsEditor(page, attribute.name);

  // the recorded option is locked, the others are not
  const usedDelete = optionDeleteButton(optionRow(page, 0));
  await expect(usedDelete).toBeDisabled();
  await usedDelete.hover();
  await expect(page.locator('.q-tooltip')).toContainText(
    "This option is in use and can't be deleted.",
  );
  await expect(optionDeleteButton(optionRow(page, 1))).toBeEnabled();

  // add an option and persist it
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  await page.getByPlaceholder('Option').last().fill('kidney');
  await save(page);
  await expectDialogClosed(page);

  await openOptionsEditor(page, attribute.name);
  await expect(page.getByPlaceholder('Option')).toHaveCount(4);
  await expect(page.getByPlaceholder('Option').last()).toHaveValue('kidney');

  // ... and delete it again
  await optionDeleteButton(optionRow(page, 3)).click();
  await save(page);
  await expectDialogClosed(page);

  await openOptionsEditor(page, attribute.name);
  await expect(page.getByPlaceholder('Option')).toHaveCount(3);
  await expect(
    page.getByPlaceholder('Option').filter({ hasText: 'kidney' }),
  ).toHaveCount(0);
});

test('renaming an option in use relabels the existing attributions', async ({
  page,
  seed,
}) => {
  const { attribute } = await seedRecordedEnum(seed);
  const list = `/#/attributions?s=${encodeURIComponent(attribute.name)}`;

  await page.goto(list);
  await expect(listRow(page, attribute.name)).toContainText('round');

  await openOptionsEditor(page, attribute.name);
  await page.getByPlaceholder('Option').first().fill('spherical');
  await save(page);
  await expectDialogClosed(page);

  // the denormalized value follows the rename
  await page.goto(list);
  await expect(listRow(page, attribute.name)).toContainText('spherical');
});

test('disabling an option keeps recorded values but hides it from new attributions', async ({
  page,
  seed,
}) => {
  const { attribute, form, cultivar } = await seedRecordedEnum(seed);

  await openOptionsEditor(page, attribute.name);
  await optionRow(page, 0).getByText('Disabled', { exact: true }).click();
  await save(page);
  await expectDialogClosed(page);

  // the attribution recorded before the option was disabled is untouched
  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  await expect(listRow(page, attribute.name)).toContainText('round');

  // a new attribution on the same form is no longer offered the option
  await walkToForm(page, form.name, cultivar.display_name);
  await formField(page, attribute.name).locator('.q-field__control').click();
  const options = page.locator('.q-menu [role="option"]');
  await expect(options.filter({ hasText: 'oblong' })).toHaveCount(1);
  await expect(options.filter({ hasText: 'round' })).toHaveCount(0);
});
