import { expect, test as setup } from '@playwright/test';
import { E2E_USER, STORAGE_STATE } from './config';

setup('sign in', async ({ page }) => {
  await page.goto('/#/sign-in');

  // The form has no test ids; autocomplete tokens are the stable hook and are
  // locale independent, unlike the labels.
  await page.fill('input[autocomplete="username"]', E2E_USER.email);
  await page.fill('input[autocomplete="current-password"]', E2E_USER.password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/#\/plants$/);

  // The session lives in this cookie; wait for it, or storageState would be
  // written before the SignIn response lands.
  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      return cookies.some((c) => c.name === 'breedersdb.id.token');
    })
    .toBe(true);

  // SignIn persists the *user's* locale, so the UI language would depend on
  // whoever the test account belongs to. Pin it so specs can assert on text.
  await page.evaluate(() =>
    window.localStorage.setItem('breedersdb-locale', 'en-US'),
  );

  await page.context().storageState({ path: STORAGE_STATE });
});
