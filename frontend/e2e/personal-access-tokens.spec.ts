import { expect, test } from './support/fixtures';
import {
  expectDialogClosed,
  expectRowGone,
  formField,
  listRow,
  save,
} from './support/locators';

// Create and revoke a personal access token through the UI. The raw token is
// shown exactly once in the created dialog and never again afterwards.
test('personal access tokens can be created and revoked', async ({
  page,
  seed,
}) => {
  const name = `E2E UI PAT ${seed.uid()}`;

  // create
  await page.goto('/#/personal-access-tokens/new');
  await formField(page, 'Name').locator('input').fill(name);
  await save(page);

  // the raw token is shown once in the created dialog
  const createdDialog = page.locator('.q-dialog').last();
  await expect(createdDialog).toContainText('Personal Access Token Created');
  const token = await createdDialog.locator('input').inputValue();
  expect(token.length).toBeGreaterThan(20);
  await createdDialog
    .getByRole('button', { name: 'Close', exact: true })
    .click();
  await expectDialogClosed(page);
  await seed.trackUserTokenByName(name); // cleanup even if the test fails below

  // list + search
  await page.goto(`/#/personal-access-tokens?s=${encodeURIComponent(name)}`);
  await expect(listRow(page, name)).toHaveCount(1);

  // the view modal never reveals the raw token again
  await listRow(page, name).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(name);
  await expect(page.locator('.q-dialog')).not.toContainText(token);

  // revoke (delete with confirmation dialog)
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page
    .locator('.q-dialog')
    .last()
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expectDialogClosed(page);
  await expectRowGone(
    page,
    `/#/personal-access-tokens?s=${encodeURIComponent(name)}`,
    name,
  );
});
