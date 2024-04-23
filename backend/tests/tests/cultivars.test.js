import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertCultivar(
    $crossing_name: String!
    $lot_name_segment: String!
    $name_segment: String!
    $common_name: String
    $acronym: String
    $breeder: String
    $registration: String
    $description: String
  ) {
    insert_crossings_one(
      object: {
        name: $crossing_name
        lots: {
          data: {
            name_segment: $lot_name_segment
            cultivars: {
              data: {
                name_segment: $name_segment
                common_name: $common_name
                acronym: $acronym
                breeder: $breeder
                registration: $registration
                description: $description
              }
            }
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
          name
          common_name
          acronym
          breeder
          registration
          description
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
      }
    `,
  });
});

test('insert', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
      common_name: 'This is an official name',
      acronym: 'TIAN',
      breeder: 'Poma Culta',
      registration: '123456',
      description: 'This is a description',
    },
  });

  const cultivar = resp.data.insert_crossings_one.lots[0].cultivars[0];

  expect(cultivar.id).toBeGreaterThan(0);
  expect(cultivar.name_segment).toBe('001');
  expect(cultivar.name).toBe('Abcd.24A.001');
  expect(cultivar.common_name).toBe('This is an official name');
  expect(cultivar.acronym).toBe('TIAN');
  expect(cultivar.breeder).toBe('Poma Culta');
  expect(cultivar.registration).toBe('123456');
  expect(cultivar.description).toBe('This is a description');
  expect(cultivar.created).toMatch(iso8601dateRegex);
  expect(cultivar.modified).toBeNull();
});

test('name is unique', async () => {
  const lot = await post({
    query: /* GraphQL */ `
      mutation InsertLot($lot_name_segment: String!, $crossing_name: String!) {
        insert_lots_one(
          object: {
            name_segment: $lot_name_segment
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
  const resp1 = await post({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!, $name_segment: String!) {
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
      mutation InsertCultivar($lot_id: Int!, $name_segment: String!) {
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

test('updated name crossing', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
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
              name
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

  expect(updated.data.update_crossings_by_pk.lots[0].cultivars[0].name).toBe(
    'Efgh.24A.001',
  );
});

test('updated name lot', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $name_segment: String!) {
        update_lots_by_pk(
          pk_columns: { id: $id }
          _set: { name_segment: $name_segment }
        ) {
          id
          cultivars {
            id
            name
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].id,
      name_segment: '24Z',
    },
  });

  expect(updated.data.update_lots_by_pk.cultivars[0].name).toBe('Abcd.24Z.001');
});

test('updated name cultivar', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!, $name_segment: String!) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { name_segment: $name_segment }
        ) {
          id
          name
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].id,
      name_segment: '999',
    },
  });

  expect(updated.data.update_cultivars_by_pk.name).toBe('Abcd.24A.999');
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      name_segment: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!, $name_segment: String) {
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

  expect(updated.data.update_cultivars_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
