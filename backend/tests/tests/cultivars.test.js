import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertCultivar(
    $crossing_name: citext!
    $lot_name_segment: citext!
    $orchard_name: citext! = "Orchard 1"
    $name_segment: citext!
    $name_override: citext
    $acronym: citext
    $breeder: String
    $note: String
    $is_variety: Boolean = false
  ) {
    insert_crossings_one(
      object: {
        name: $crossing_name
        is_variety: $is_variety
        lots: {
          data: {
            name_segment: $lot_name_segment
            cultivars: {
              data: {
                name_segment: $name_segment
                name_override: $name_override
                acronym: $acronym
                breeder: $breeder
                note: $note
              }
            }
            orchard: { data: { name: $orchard_name } }
          }
        }
      }
    ) {
      id
      name
      lots {
        id
        name_segment
        cultivars {
          id
          name_segment
          name_override
          full_name
          display_name
          acronym
          breeder
          note
          created
          modified
          is_variety
        }
      }
    }
  }
`;

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllCultivars {
        delete_cultivars(where: {}) {
          affected_rows
        }
        delete_lots(where: {}) {
          affected_rows
        }
        delete_crossings(where: {}) {
          affected_rows
        }
        delete_orchards(where: {}) {
          affected_rows
        }
      }
    `,
  });
});

test('insert', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      acronym: 'TIAN',
      breeder: 'Poma Culta',
      note: 'This is a note',
    },
  });

  const cultivar = resp.data.insert_crossings_one.lots[0].cultivars[0];

  expect(cultivar.id).toBeGreaterThan(0);
  expect(cultivar.name_segment).toBe('001');
  expect(cultivar.full_name).toBe('Abcd.24A.001');
  expect(cultivar.display_name).toBe('Abcd.24A.001');
  expect(cultivar.acronym).toBe('TIAN');
  expect(cultivar.breeder).toBe('Poma Culta');
  expect(cultivar.note).toBe('This is a note');
  expect(cultivar.created).toMatch(iso8601dateRegex);
  expect(cultivar.modified).toEqual(cultivar.created);
  expect(cultivar.is_variety).toBe(false);
});

test('name is unique', async () => {
  const lot = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertLot($lot_name_segment: citext!, $crossing_name: citext!) {
        insert_lots_one(
          object: {
            name_segment: $lot_name_segment
            orchard: { data: { name: "Orchard 2" } }
            crossing: { data: { name: $crossing_name } }
          }
        ) {
          id
        }
      }
    `,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
    },
  });
  const resp1 = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!, $name_segment: citext!) {
        insert_cultivars_one(
          object: { name_segment: $name_segment, lot_id: $lot_id }
        ) {
          id
        }
      }
    `,
    variables: {
      lot_id: lot.data.insert_lots_one.id,
      name_segment: '001',
    },
  });
  const resp2 = await post({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!, $name_segment: citext!) {
        insert_cultivars_one(
          object: { name_segment: $name_segment, lot_id: $lot_id }
        ) {
          id
        }
      }
    `,
    variables: {
      lot_id: lot.data.insert_lots_one.id,
      name_segment: '001',
    },
  });

  expect(resp1.data.insert_cultivars_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name_segment is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('updated full_name crossing', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $name: citext!) {
        update_crossings_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
          id
          lots {
            id
            cultivars {
              id
              full_name
            }
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.id,
      name: 'Efgh',
    },
  });

  expect(
    updated.data.update_crossings_by_pk.lots[0].cultivars[0].full_name,
  ).toBe('Efgh.24A.001');
});

test('updated full_name lot', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $name_segment: citext!) {
        update_lots_by_pk(
          pk_columns: { id: $id }
          _set: { name_segment: $name_segment }
        ) {
          id
          cultivars {
            id
            full_name
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].id,
      name_segment: '24Z',
    },
  });

  expect(updated.data.update_lots_by_pk.cultivars[0].full_name).toBe(
    'Abcd.24Z.001',
  );
});

test('updated full_name cultivar', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!, $name_segment: citext!) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { name_segment: $name_segment }
        ) {
          id
          full_name
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].id,
      name_segment: '999',
    },
  });

  expect(updated.data.update_cultivars_by_pk.full_name).toBe('Abcd.24A.999');
});

test('display_name contains full_name', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const cultivar = resp.data.insert_crossings_one.lots[0].cultivars[0];

  expect(cultivar.full_name).toBe('Abcd.24A.001');
  expect(cultivar.display_name).toBe('Abcd.24A.001');
  expect(cultivar.name_override).toBe(null);
});

test('display_name contains name_override', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      name_override: 'Jonagold',
    },
  });

  const cultivar = resp.data.insert_crossings_one.lots[0].cultivars[0];

  expect(cultivar.full_name).toBe('Abcd.24A.001');
  expect(cultivar.display_name).toBe('Jonagold');
  expect(cultivar.name_override).toBe('Jonagold');
});

test('display_name is updated when lot display_name is updated', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $name_segment: citext!) {
        update_lots_by_pk(
          pk_columns: { id: $id }
          _set: { name_segment: $name_segment }
        ) {
          id
          cultivars {
            id
            display_name
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].id,
      name_segment: '24Z',
    },
  });

  expect(updated.data.update_lots_by_pk.cultivars[0].display_name).toBe(
    'Abcd.24Z.001',
  );
});

test('modified', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!, $name_segment: citext) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { name_segment: $name_segment }
        ) {
          id
          name_segment
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].id,
      name_segment: '999',
    },
  });

  expect(
    new Date(updated.data.update_cultivars_by_pk.modified).getTime(),
  ).toBeGreaterThan(
    new Date(
      resp.data.insert_crossings_one.lots[0].cultivars[0].modified,
    ).getTime(),
  );
});

test('updating is_variety on crossings updates it on cultivars', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!) {
        update_crossings_by_pk(
          pk_columns: { id: $id }
          _set: { is_variety: true }
        ) {
          id
          lots {
            id
            cultivars {
              id
              is_variety
            }
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.id,
    },
  });

  expect(
    updated.data.update_crossings_by_pk.lots[0].cultivars[0].is_variety,
  ).toBe(true);
});

test('updating the lot_id updates is_variety', async () => {
  const notVariety = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      is_variety: false,
    },
  });
  const isVariety = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'APPLE',
      orchard_name: 'Orchard2',
      lot_name_segment: '000',
      name_segment: 'Golden',
      is_variety: true,
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!, $lot_id: Int!) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { lot_id: $lot_id }
        ) {
          id
          is_variety
        }
      }
    `,
    variables: {
      id: notVariety.data.insert_crossings_one.lots[0].cultivars[0].id,
      lot_id: isVariety.data.insert_crossings_one.lots[0].id,
    },
  });

  expect(updated.data.update_cultivars_by_pk.is_variety).toBe(true);
});

test('direct updates on is_variety are impossible', async () => {
  const notVariety = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      is_variety: false,
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { is_variety: true }
        ) {
          id
          is_variety
        }
      }
    `,
    variables: {
      id: notVariety.data.insert_crossings_one.lots[0].cultivars[0].id,
    },
  });

  expect(updated.errors[0].message).toEqual(
    "field 'is_variety' not found in type: 'cultivars_set_input'",
  );
});

test('direct inserts of is_variety are impossible', async () => {
  const notVariety = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      is_variety: false,
    },
  });

  const inserted = await post({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!) {
        insert_cultivars_one(
          object: { lot_id: $lot_id, name_segment: "000", is_variety: true }
        ) {
          id
          is_variety
        }
      }
    `,
    variables: {
      lot_id: notVariety.data.insert_crossings_one.lots[0].id,
    },
  });

  expect(inserted.errors[0].message).toEqual(
    "field 'is_variety' not found in type: 'cultivars_insert_input'",
  );
});

test('acronym is unique', async () => {
  await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      acronym: 'Acronym',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Cross2',
      lot_name_segment: '24Z',
      name_segment: '999',
      acronym: 'acronym',
    },
  });

  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('acronym constraints: no spaces', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      acronym: 'A C',
    },
  });

  expect(resp.errors[0].message).toContain('Check constraint violation.');
});

test('acronym constraints: no dots', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      acronym: 'A.C',
    },
  });

  expect(resp.errors[0].message).toContain('Check constraint violation.');
});

test('acronym constraints: max 8 chars', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      acronym: '123456789',
    },
  });

  expect(resp.errors[0].message).toContain('Check constraint violation.');
});
