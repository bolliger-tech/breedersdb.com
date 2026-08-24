import { expect, type Locator, type Page } from '@playwright/test';

// The app has almost no test ids. These helpers encode the few stable DOM
// facts (see BaseInputLabel.vue, EntityModalContentSave.vue, EntityListTable):
// keep all selector knowledge here instead of repeating it in specs.

export const escapeRegExp = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A form field wrapper (.entity-label from BaseInputLabel) by its label text.
// Returns the wrapper; chain .locator('input') / .locator('textarea') or use
// the q-select helpers below. Labels are stable because the locale is pinned
// to en-US by auth.setup.ts. The bold label row may carry an explainer icon
// (material ligature "help"), so the match is anchored manually instead of
// using { exact: true }.
export function formField(page: Page | Locator, label: string): Locator {
  return page.locator('.entity-label').filter({
    has: pageOf(page)
      .locator('div.text-weight-bold')
      .filter({
        hasText: new RegExp(`^${escapeRegExp(label)}[\\s\\u00a0]*(help)?$`),
      }),
  });
}

function pageOf(scope: Page | Locator): Page {
  return 'page' in scope ? scope.page() : scope;
}

// Fill a q-select by typing (EntitySelect is use-input) and picking from the
// portal menu (Quasar renders the options list at body level, outside the
// field).
export async function selectOption(
  page: Page,
  field: Locator,
  option: string | RegExp,
  // pickers that clear themselves after a pick (e.g. the attribution form's
  // "Add Field") never show the selected label — pass { resets: true } there
  opts: { resets?: boolean } = {},
): Promise<void> {
  const input = field.locator('input:not([readonly])').first();
  const menu = page.locator('.q-menu');
  const options = menu.locator('[role="option"]');
  await field.locator('.q-field__control').first().click();
  if (typeof option === 'string') {
    await input.fill(option);
    // Wait until the input-debounced (500ms) async @filter has been applied,
    // i.e. every listed option matches the typed text. Clicking earlier
    // leaves the filter's done-callback pending, and when it resolves it
    // re-opens the menu over the form, swallowing the next click (e.g. save).
    await expect(async () => {
      const texts = await options.allTextContents();
      expect(texts.length).toBeGreaterThan(0);
      for (const text of texts) expect(text).toContain(option);
    }).toPass();
  }
  await options.filter({ hasText: option }).first().click();
  // Postcondition: menu gone, pick stuck (EntitySelect is fill-input, so the
  // input shows the selected label after the popup closed).
  await expect(menu).toHaveCount(0);
  if (!opts.resets) {
    await expect(input).toHaveValue(
      typeof option === 'string' ? new RegExp(escapeRegExp(option)) : option,
    );
  }
}

// The save control in entity modals: a plain button, or the main section of a
// split dropdown when print / new-from-template actions exist. Both expose
// role=button named "Save" in a fresh browser context (the split button's
// primary action defaults to plain save).
export function saveButton(scope: Page | Locator): Locator {
  return scope.getByRole('button', { name: 'Save', exact: true });
}

// Save an entity modal; pass a dialog Locator instead of the Page to target
// a specific dialog (e.g. the analyze name dialog). KNOWN APP BUG (found
// 2026-08-21, reproducible with --repeat-each under load): clicking save
// while a debounced async uniqueness validator (useIsUnique, 300ms) is still
// in flight makes validate() hang forever - the save button spins and the
// mutation is never sent. Until that is fixed, wait out the debounce window
// and any running validation query before clicking. Do NOT copy this
// waitForTimeout pattern anywhere else.
export async function save(scope: Page | Locator): Promise<void> {
  const dialog = 'page' in scope ? scope : scope.locator('.q-dialog');
  await pageOf(scope).waitForTimeout(350);
  await expect(dialog.locator('.q-spinner')).toHaveCount(0);
  await saveButton(scope).click();
}

// Entity saves show no toast - the dialog closing is the success signal (this
// also covers the delete confirmation). Async uniqueness validators plus the
// mutation can exceed the default 5s expect timeout when tests run in
// parallel, hence the explicit allowance.
export async function expectDialogClosed(page: Page): Promise<void> {
  await expect(page.locator('.q-dialog')).toHaveCount(0, { timeout: 15_000 });
}

// A row of the entity list table containing the given text.
export function listRow(page: Page, text: string | RegExp): Locator {
  return page.locator('.entity-list-table tbody tr').filter({ hasText: text });
}

// Assert a list row is gone after a delete. Under parallel load the list's
// in-place refetch can race the delete, so assert the deletion on a fresh
// page load of the list URL instead.
export async function expectRowGone(
  page: Page,
  listUrl: string,
  text: string | RegExp,
): Promise<void> {
  await page.goto(listUrl);
  await expect(listRow(page, text)).toHaveCount(0);
}
