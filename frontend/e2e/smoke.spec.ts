import { expect, test } from './support/fixtures';
import type { Seeder } from './support/seed';

// Every entity list page exercises the router, urql, the gql.tada generated
// types, QTable and vue-i18n at once - which is exactly the surface a
// dependency upgrade breaks. Each test seeds its own row, so the suite also
// passes against an empty database.
const ENTITY_LISTS: {
  path: string;
  heading: string;
  // seeds at least one row; omitted when the page cannot be empty (users) or
  // rows cannot be seeded via the API (personal access tokens)
  seedRow?: (seed: Seeder) => Promise<unknown>;
  emptyOk?: boolean;
}[] = [
  { path: '/plants', heading: 'Plants', seedRow: (s) => s.plant() },
  { path: '/groups', heading: 'Groups', seedRow: (s) => s.plantGroup() },
  { path: '/cultivars', heading: 'Cultivars', seedRow: (s) => s.cultivar() },
  { path: '/lots', heading: 'Lots', seedRow: (s) => s.lot() },
  { path: '/crossings', heading: 'Crossings', seedRow: (s) => s.crossing() },
  {
    path: '/attributions',
    heading: 'Attributions',
    seedRow: async (s) => {
      const attribute = await s.attribute();
      const form = await s.attributionForm([{ id: attribute.id }]);
      const cultivar = await s.cultivar();
      await s.attribution({
        formId: form.id,
        cultivarId: cultivar.id,
        values: [{ attributeId: attribute.id, dataType: 'INTEGER', value: 1 }],
      });
    },
  },
  { path: '/attributes', heading: 'Attributes', seedRow: (s) => s.attribute() },
  {
    path: '/attribution-forms',
    heading: 'Attribution Forms',
    seedRow: (s) => s.attributionForm([]),
  },
  { path: '/orchards', heading: 'Orchards', seedRow: (s) => s.orchard() },
  { path: '/rootstocks', heading: 'Rootstocks', seedRow: (s) => s.rootstock() },
  // the signed-in account itself is always listed
  { path: '/users', heading: 'Users' },
  { path: '/graftings', heading: 'Graftings', seedRow: (s) => s.grafting() },
  { path: '/rows', heading: 'Rows', seedRow: (s) => s.plantRow() },
  { path: '/pollen', heading: 'Pollen', seedRow: (s) => s.pollen() },
  {
    path: '/mother-plants',
    heading: 'Mother Plants',
    seedRow: (s) => s.motherPlant(),
  },
  {
    path: '/personal-access-tokens',
    heading: 'Personal Access Tokens',
    emptyOk: true,
  },
];

for (const { path, heading, seedRow, emptyOk } of ENTITY_LISTS) {
  test(`${path} lists rows`, async ({ page, seed }) => {
    await seedRow?.(seed);

    await page.goto(`/#${path}`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    if (emptyOk) {
      await expect(page.locator('.entity-list-table')).toBeVisible();
    } else {
      await expect(
        page.locator('.entity-list-table tbody tr').first(),
      ).toBeVisible();
    }
  });
}
