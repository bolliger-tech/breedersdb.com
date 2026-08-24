import { expect, test } from './support/fixtures';

// Auth flows run without the shared storage state — signing out with the
// shared session cookie would kill every parallel spec — and against a user
// created by the test, never the shared tester account.
test.use({ storageState: { cookies: [], origins: [] } });

const emailInput = 'input[autocomplete="username"]';
const passwordInput = 'input[autocomplete="current-password"]';

test('sign-in rejects wrong credentials and accepts correct ones', async ({
  page,
  seed,
}) => {
  const user = await seed.user();

  await page.goto('/#/sign-in');

  // wrong password
  await page.fill(emailInput, user.email);
  await page.fill(passwordInput, 'Wrong.password.1');
  await page.click('button[type="submit"]');
  await expect(page.getByText('This password is not correct')).toBeVisible();
  await expect(page).toHaveURL(/#\/sign-in/);

  // correct password
  await page.fill(passwordInput, user.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/#\/plants$/);
});

test('sign-out ends the session', async ({ page, seed }) => {
  const user = await seed.user();

  await page.goto('/#/sign-in');
  await page.fill(emailInput, user.email);
  await page.fill(passwordInput, user.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/#\/plants$/);

  await page.goto('/#/sign-out');
  await expect(
    page.getByText('Are you sure you want to sign out?'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
  await expect(page).toHaveURL(/#\/sign-in/);

  // the session is gone: guarded pages bounce back to sign-in
  await page.goto('/#/orchards');
  await expect(page).toHaveURL(/#\/sign-in/);
});

test('forgot-password accepts a submission', async ({ page, seed }) => {
  const user = await seed.user();

  await page.goto('/#/sign-in');
  await page.getByText('Forgot password?').click();
  await expect(page).toHaveURL(/#\/forgot-password/);

  await page.fill(emailInput, user.email);
  await page
    .getByRole('button', { name: 'Reset password', exact: true })
    .click();
  await expect(
    page.getByText('Follow the instructions in the email'),
  ).toBeVisible();
});

// The e-mail round trip is out of scope — this covers the reset-password
// page itself: no token at all, and a token the backend rejects (401).
test('reset-password rejects a bogus token', async ({ page }) => {
  await page.goto('/#/reset-password');
  await expect(
    page.getByText('The password reset token is missing'),
  ).toBeVisible();

  await page.goto('/#/reset-password?token=bogus');
  await page.fill('input[autocomplete="new-password"]', 'E2e.test.password.1');
  await page.getByRole('button', { name: 'Set password', exact: true }).click();
  await expect(
    page.getByText('Invalid or expired password reset link'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Get new password reset link' }).click();
  await expect(page).toHaveURL(/#\/forgot-password/);
});

test('unauthenticated visitors are redirected to sign-in', async ({ page }) => {
  await page.goto('/#/cultivars');
  await expect(page).toHaveURL(/#\/sign-in/);
});
