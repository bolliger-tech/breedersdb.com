import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { formField, selectOption } from './locators';

// Walk the attribution stepper up to the attribution form: select the form,
// set the author and pick the cultivar (which auto-advances to the form
// step). The picker mode is preseeded to name-select: the default QR scanner
// mode needs a camera and floods the console with NotSupportedError in
// headless (Quasar LocalStorage prefixes string values with __q_strn|).
export async function walkToForm(
  page: Page,
  formName: string,
  cultivarName: string,
  opts: { repeat?: number } = {},
): Promise<void> {
  await page.addInitScript(() =>
    localStorage.setItem(
      'breedersdb-cultivar-selector-input-method',
      '__q_strn|cultivar-select',
    ),
  );
  // addInitScript only runs on a fresh document; goto guarantees one (see
  // fixtures.ts), so the preseeded picker mode is in place no matter where
  // the caller navigated before.
  await page.goto('/#/cultivars/attribute');

  // completed step panels stay rendered — the active step's button is last
  const continueButton = () =>
    page.getByRole('button', { name: 'Continue' }).last();

  await selectOption(page, formField(page, 'Select form'), formName);
  await continueButton().click();

  await formField(page, 'Who collects the data?')
    .locator('input')
    .fill('E2E Robot');
  if (opts.repeat) {
    await formField(page, 'Repeat').locator('.q-toggle').click();
    await formField(page, 'Number of attributions per object')
      .locator('input')
      .fill(String(opts.repeat));
  }
  await continueButton().click();

  await selectOption(page, formField(page, 'Cultivar name'), cultivarName, {
    resets: true,
  });
  await expect(page.getByRole('heading', { level: 2 })).toContainText(
    cultivarName,
  );
}

// Set a photo on the attribution form and wait until the picked file has
// been processed (resized + hashed) — the preview image turning visible is
// the signal that the form actually holds the value. Clicking save earlier
// races the processing and the photo is silently dropped ("Nothing to save"
// when it is the only value).
export async function uploadPhoto(
  page: Page,
  fieldLabel: string,
  filePath: string,
): Promise<void> {
  const field = formField(page, fieldLabel);
  await field.locator('input[type="file"]').setInputFiles(filePath);
  await expect(
    field.locator('.attribute-form-input-photo__preview'),
  ).toBeVisible();
}
