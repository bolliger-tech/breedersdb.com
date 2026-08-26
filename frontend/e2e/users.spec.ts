import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  save,
  selectOption,
} from './support/locators';

// Full CRUD on a user created by this test (the shared tester@breedersdb.com
// sign-in account must never be touched), including the change-password
// dialog on the view modal.
test('users can be created, viewed, edited and deleted', async ({
  page,
  seed,
}) => {
  const email = `e2e-ui-${seed.uid()}@breedersdb.com`;
  const renamed = `renamed-${email}`;
  const password = 'E2e.test.password.1';

  // create
  await page.goto('/#/users/new');
  await formField(page, 'Email').locator('input').fill(email);
  await selectOption(page, formField(page, 'Locale'), 'English');
  await formField(page, 'Password').locator('input').fill(password);
  await save(page);
  await expectDialogClosed(page); // modal closed = saved
  seed.trackUserEmail(email); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/users?s=${encodeURIComponent(email)}`);
  await expect(listRow(page, email)).toHaveCount(1);

  // view
  await listRow(page, email).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(email);

  // change the password of the created user (nested dialog in the edit modal)
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByRole('button', { name: 'Change Password', exact: true })
    .click();
  const passwordDialog = page.locator('.q-dialog').last();
  await formField(passwordDialog, 'New Password')
    .locator('input')
    .fill(`${password}.changed`);
  await passwordDialog
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  // back to the edit modal only (the change-password dialog closed)
  await expect(page.locator('.q-dialog')).toHaveCount(1, { timeout: 15_000 });

  // edit the email address
  const emailInput = formField(page, 'Email').locator('input');
  await expect(emailInput).toHaveValue(email);
  await emailInput.fill(renamed);
  await save(page);
  await expectDialogClosed(page);
  seed.trackUserEmail(renamed);

  await page.goto(`/#/users?s=${encodeURIComponent(renamed)}`);
  await expect(listRow(page, renamed)).toHaveCount(1);

  // delete (from the view modal, with confirmation dialog)
  await listRow(page, renamed).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page
    .locator('.q-dialog')
    .last()
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expectDialogClosed(page);
  await expectRowGone(
    page,
    `/#/users?s=${encodeURIComponent(renamed)}`,
    renamed,
  );
});
