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

test('the pedigree dialog shows two generations and loads deeper ones on demand', async ({
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
  const viewModal = page.locator('.q-dialog').first();
  await viewModal
    .getByRole('button', { name: 'Pedigree', exact: true })
    .click();

  const chart = page.locator('.cultivar-pedigree-dialog');
  await expect(
    chart.getByRole('heading', { name: 'Pedigree', level: 3 }),
  ).toBeVisible();

  // parents and grandparents are visible on open, the mother's father unknown
  await expect(
    chart.getByRole('link', { name: mother.display_name }),
  ).toBeVisible();
  await expect(
    chart.getByRole('link', { name: father.display_name }),
  ).toBeVisible();
  await expect(
    chart.getByRole('link', { name: grandmother.display_name }),
  ).toBeVisible();
  await expect(chart.getByText('unknown', { exact: true })).toHaveCount(1);
  await expect(
    chart.getByRole('link', { name: greatGrandmother.display_name }),
  ).toHaveCount(0);

  // the father's parents are both unknown: nothing to his right
  await expect(
    chart.getByRole('button', {
      name: `Show parents of ${father.display_name}`,
    }),
  ).toHaveCount(0);
  // only the grandmother has known parents that aren't loaded yet
  await expect(
    chart.getByRole('button', { name: /^Show parents of / }),
  ).toHaveCount(1);

  // the button loads the next generation
  await chart
    .getByRole('button', {
      name: `Show parents of ${grandmother.display_name}`,
    })
    .click();
  const greatGrandmotherLink = chart.getByRole('link', {
    name: greatGrandmother.display_name,
  });
  await expect(greatGrandmotherLink).toBeVisible();

  // the name navigates to the ancestor and closes the pedigree dialog
  await greatGrandmotherLink.click();
  await expect(page).toHaveURL(
    new RegExp(`#/cultivars/${greatGrandmother.id}$`),
  );
  await expect(
    page.locator('.q-dialog').getByRole('heading', { level: 2 }),
  ).toContainText(greatGrandmother.display_name);
  await expect(chart).toHaveCount(0);
});

test('a cultivar without parents says so instead of offering a pedigree', async ({
  page,
  seed,
}) => {
  const cultivar = await seedCultivar(seed);

  await page.goto(`/#/cultivars/${cultivar.id}`);
  const dialog = page.locator('.q-dialog');
  await expect(dialog.getByText('Parents unknown')).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Pedigree', exact: true }),
  ).toHaveCount(0);
});
