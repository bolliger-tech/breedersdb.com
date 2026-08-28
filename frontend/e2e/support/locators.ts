import { expect, type Locator, type Page } from '@playwright/test';

// The app has almost no test ids. These helpers encode the few stable DOM
// facts (see BaseInputLabel.vue, EntityModalContentSave.vue, EntityListTable):
// keep all selector knowledge here instead of repeating it in specs.

export const escapeRegExp = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// QSelect's default input-debounce: typing into a use-input q-select schedules
// its @filter this far in the future. Picking an option before that timer fires
// leaves the filter pending, and QSelect re-opens the menu when a filter
// resolves while the menu is already closed - the reopened menu then swallows
// the next click. There is no DOM signal for "a filter is pending", so callers
// that type into a q-select must wait the window out.
export const INPUT_DEBOUNCE_MS = 500;

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
    // Wait out the debounce, then assert the @filter has been applied, i.e.
    // every listed option matches the typed text. The assertion alone is not
    // enough: when the unfiltered list already satisfies it - a near-empty
    // database, as in CI, where the seeded entity is the only one - it passes
    // inside the debounce window and the pick races the pending filter.
    await page.waitForTimeout(INPUT_DEBOUNCE_MS + 100);
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
// a specific dialog (e.g. the analyze name dialog). The spinner wait covers
// the queries a validator depends on, not the validator itself: until
// PlantGroupNameSegmentInput's cultivar query lands, its uniqueness check is
// scoped to `cultivar_id: -1` and passes vacuously. The name input's 300ms
// QInput debounce is deliberately not waited out - no query is running yet,
// so nothing spins - and clicking into that window is what exercises the
// save-during-validation race.
export async function save(scope: Page | Locator): Promise<void> {
  const dialog = 'page' in scope ? scope : scope.locator('.q-dialog');
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

// Assert a list row is gone after a delete. The goto loads a fresh document
// (see fixtures.ts), so the in-memory list cannot mask the deletion — but an
// empty row count is also true while that document is still booting, so wait
// for its list query to land before asserting.
export async function expectRowGone(
  page: Page,
  listUrl: string,
  text: string | RegExp,
): Promise<void> {
  await page.goto(listUrl);
  await page.waitForLoadState('networkidle');
  await expect(listRow(page, text)).toHaveCount(0);
}

// One row of the enum options editor (AttributeEnumOptionsInput renders every
// option as a BaseSortableListItem: the label input, a delete button and the
// "Pre-selected" / "Disabled" checkboxes in the after-slot). Rows are ordered
// by the option's position.
export function optionRow(page: Page, index: number): Locator {
  return page.locator('.q-dialog .base-sortable-list-item').nth(index);
}

// The icon-only delete button of an enum option row; disabled while the
// option is used by an attribution.
export function optionDeleteButton(row: Locator): Locator {
  return row.getByRole('button').filter({ hasText: 'delete_outline' });
}
