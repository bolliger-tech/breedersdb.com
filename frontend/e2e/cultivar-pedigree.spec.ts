import { expect, test } from './support/fixtures';
import type { Seeder } from './support/seed';

async function seedCultivar(
  seed: Seeder,
  parents: { motherCultivarId?: number; fatherCultivarId?: number } = {},
) {
  const crossing = await seed.crossing(parents);
  const lot = await seed.lot({ crossingId: crossing.id });
  return seed.cultivar({ lotId: lot.id });
}

test('the pedigree shows two generations and loads deeper ones on expand', async ({
  page,
  seed,
}) => {
  const greatGrandmother = await seedCultivar(seed);
  const grandmother = await seedCultivar(seed, {
    motherCultivarId: greatGrandmother.id,
  });
  const mother = await seedCultivar(seed, { motherCultivarId: grandmother.id });
  const father = await seedCultivar(seed);
  const cultivar = await seedCultivar(seed, {
    motherCultivarId: mother.id,
    fatherCultivarId: father.id,
  });

  await page.goto(`/#/cultivars/${cultivar.id}`);
  const tree = page.locator('.q-dialog .q-tree');

  // parents and grandparents are visible on open, the mother's father unknown
  await expect(
    tree.getByRole('link', { name: mother.display_name }),
  ).toBeVisible();
  await expect(
    tree.getByRole('link', { name: father.display_name }),
  ).toBeVisible();
  await expect(
    tree.getByRole('link', { name: grandmother.display_name }),
  ).toBeVisible();
  await expect(tree.getByText('unknown', { exact: true })).toBeVisible();
  await expect(
    tree.getByRole('link', { name: greatGrandmother.display_name }),
  ).toHaveCount(0);

  // the arrow loads the next generation
  await tree
    .getByRole('treeitem')
    .filter({ hasText: grandmother.display_name })
    .locator('.q-tree__arrow')
    .click();
  const greatGrandmotherLink = tree.getByRole('link', {
    name: greatGrandmother.display_name,
  });
  await expect(greatGrandmotherLink).toBeVisible();

  // the name navigates to the ancestor
  await greatGrandmotherLink.click();
  await expect(page).toHaveURL(
    new RegExp(`#/cultivars/${greatGrandmother.id}$`),
  );
  await expect(
    page.locator('.q-dialog').getByRole('heading', { level: 2 }),
  ).toContainText(greatGrandmother.display_name);
});

test('the pedigree of a cultivar without parents says so', async ({
  page,
  seed,
}) => {
  const cultivar = await seedCultivar(seed);

  await page.goto(`/#/cultivars/${cultivar.id}`);
  const dialog = page.locator('.q-dialog');
  await expect(dialog.getByText('Parents unknown')).toBeVisible();
  await expect(dialog.locator('.q-tree')).toHaveCount(0);
});
