import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertCultivar(
    $crossing_name: String!
    $lot_segment_name: String!
    $orchard_name: String! = "Orchard 1"
    $segment_name: String!
    $name_override: String
    $acronym: String
    $breeder: String
    $registration: String
    $note: String
  ) {
    insert_crossings_one(
      object: {
        name: $crossing_name
        lots: {
          data: {
            segment_name: $lot_segment_name
            cultivars: {
              data: {
                segment_name: $segment_name
                name_override: $name_override
                acronym: $acronym
                breeder: $breeder
                registration: $registration
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
        segment_name
        cultivars {
          id
          segment_name
          name_override
          full_name
          display_name
          acronym
          breeder
          registration
          note
          created
          modified
        }
      }
    }
  }
`;

afterEach(async () => {
  await post({
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
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '001',
      acronym: 'TIAN',
      breeder: 'Poma Culta',
      registration: '123456',
      note: 'This is a note',
    },
  });

  const cultivar = resp.data.insert_crossings_one.lots[0].cultivars[0];

  expect(cultivar.id).toBeGreaterThan(0);
  expect(cultivar.segment_name).toBe('001');
  expect(cultivar.full_name).toBe('Abcd.24A.001');
  expect(cultivar.display_name).toBe('Abcd.24A.001');
  expect(cultivar.acronym).toBe('TIAN');
  expect(cultivar.breeder).toBe('Poma Culta');
  expect(cultivar.registration).toBe('123456');
  expect(cultivar.note).toBe('This is a note');
  expect(cultivar.created).toMatch(iso8601dateRegex);
  expect(cultivar.modified).toBeNull();
});

test('name is unique', async () => {
  const lot = await post({
    query: /* GraphQL */ `
      mutation InsertLot($lot_segment_name: String!, $crossing_name: String!) {
        insert_lots_one(
          object: {
            segment_name: $lot_segment_name
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
      lot_segment_name: '24A',
    },
  });
  const resp1 = await post({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!, $segment_name: String!) {
        insert_cultivars_one(
          object: { segment_name: $segment_name, lot_id: $lot_id }
        ) {
          id
        }
      }
    `,
    variables: {
      lot_id: lot.data.insert_lots_one.id,
      segment_name: '001',
    },
  });
  const resp2 = await post({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!, $segment_name: String!) {
        insert_cultivars_one(
          object: { segment_name: $segment_name, lot_id: $lot_id }
        ) {
          id
        }
      }
    `,
    variables: {
      lot_id: lot.data.insert_lots_one.id,
      segment_name: '001',
    },
  });

  expect(resp1.data.insert_cultivars_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('segment_name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('updated full_name crossing', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $name: String!) {
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
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $segment_name: String!) {
        update_lots_by_pk(
          pk_columns: { id: $id }
          _set: { segment_name: $segment_name }
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
      segment_name: '24Z',
    },
  });

  expect(updated.data.update_lots_by_pk.cultivars[0].full_name).toBe(
    'Abcd.24Z.001',
  );
});

test('updated full_name cultivar', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!, $segment_name: String!) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { segment_name: $segment_name }
        ) {
          id
          full_name
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].id,
      segment_name: '999',
    },
  });

  expect(updated.data.update_cultivars_by_pk.full_name).toBe('Abcd.24A.999');
});

test('display_name contains full_name', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '001',
    },
  });

  const cultivar = resp.data.insert_crossings_one.lots[0].cultivars[0];

  expect(cultivar.full_name).toBe('Abcd.24A.001');
  expect(cultivar.display_name).toBe('Abcd.24A.001');
  expect(cultivar.name_override).toBe(null);
});

test('display_name contains name_override', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '001',
      name_override: 'Jonagold',
    },
  });

  const cultivar = resp.data.insert_crossings_one.lots[0].cultivars[0];

  expect(cultivar.full_name).toBe('Abcd.24A.001');
  expect(cultivar.display_name).toBe('Jonagold');
  expect(cultivar.name_override).toBe('Jonagold');
});

test('display_name is updated when lot display_name is updated', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $segment_name: String!) {
        update_lots_by_pk(
          pk_columns: { id: $id }
          _set: { segment_name: $segment_name }
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
      segment_name: '24Z',
    },
  });

  expect(updated.data.update_lots_by_pk.cultivars[0].display_name).toBe(
    'Abcd.24Z.001',
  );
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      segment_name: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!, $segment_name: String) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { segment_name: $segment_name }
        ) {
          id
          segment_name
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].id,
      segment_name: '999',
    },
  });

  expect(updated.data.update_cultivars_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
