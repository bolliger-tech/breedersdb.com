import { expect, test } from './support/fixtures';
import { listRow } from './support/locators';
import { E2E_USER } from './config';

// The /plants/eliminate stepper: pick a plant by label id, confirm, toast,
// and the plant lands in the disabled tab with a #-prefixed label.
test('the eliminate stepper eliminates a plant', async ({ page, seed }) => {
  const plant = await seed.plant();

  // preseed the picker to label-id mode: the default QR scanner needs a
  // camera and floods the console with NotSupportedError in headless
  await page.addInitScript(() =>
    localStorage.setItem(
      'breedersdb-plant-selector-input-method',
      '__q_strn|plant-label-id',
    ),
  );
  await page.goto('/#/plants/eliminate');

  const labelInput = page.locator('input:not([readonly])').first();
  await labelInput.fill(plant.label_id);
  await labelInput.press('Enter');

  // step 2 shows the picked plant, the eliminate button confirms
  await expect(page.getByText(plant.label_id).first()).toBeVisible();
  await page.getByRole('button', { name: 'Eliminate', exact: true }).click();
  await expect(page.locator('.q-notification')).toContainText(
    `Plant ${plant.label_id} eliminated`,
  );

  await page.goto(
    `/#/plants?tab=disabled&s=${encodeURIComponent(`#${plant.label_id}`)}`,
  );
  await expect(listRow(page, `#${plant.label_id}`)).toHaveCount(1);
});

test('the settings page renders', async ({ page }) => {
  await page.goto('/#/settings');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
  await expect(
    page.getByRole('heading', { name: 'Printing', exact: true }),
  ).toBeVisible();
});

test('the info page shows version and user email', async ({ page }) => {
  await page.goto('/#/info');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Info');
  // version is the git HEAD set at dev-server start — assert it is non-empty
  const version = page
    .getByRole('heading', { name: 'Version', exact: true })
    .locator('xpath=following-sibling::p[1]');
  await expect(version).toHaveText(/./);
  await expect(page.getByText(E2E_USER.email)).toBeVisible();
});

test('unknown routes render the 404 page', async ({ page }) => {
  await page.goto('/#/no/such/page');
  await expect(page.getByText('Nothing here!')).toBeVisible();
});
