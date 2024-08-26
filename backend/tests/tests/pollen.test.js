import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertPollen(
    $name: citext!
    $date_harvested: date
    $note: String
    $crossing_name: citext!
    $orchard_name: citext! = "Orchard 1"
    $lot_name_segment: citext!
    $cultivar_name_segment: citext!
  ) {
    insert_pollen_one(
      object: {
        name: $name
        date_harvested: $date_harvested
        note: $note
        cultivar: {
          data: {
            name_segment: $cultivar_name_segment
            lot: {
              data: {
                name_segment: $lot_name_segment
                orchard: { data: { name: $orchard_name } }
                crossing: { data: { name: $crossing_name } }
              }
            }
          }
        }
      }
    ) {
      id
      name
      date_harvested
      note
      cultivar {
        id
        display_name
      }
      created
      modified
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllPollen {
        delete_pollen(where: {}) {
          affected_rows
        }
        delete_plants(where: {}) {
          affected_rows
        }
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
      name: 'Pollen 1',
      date_harvested: '2021-01-01',
      note: 'note',
      crossing_name: 'Cross1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  expect(resp.data.insert_pollen_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_pollen_one.name).toBe('Pollen 1');
  expect(resp.data.insert_pollen_one.date_harvested).toBe('2021-01-01');
  expect(resp.data.insert_pollen_one.note).toBe('note');
  expect(resp.data.insert_pollen_one.cultivar.display_name).toBe(
    'Cross1.24A.001',
  );
  expect(resp.data.insert_pollen_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_pollen_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'Pollen 1',
      crossing_name: 'Cross1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'pollen 1',
      crossing_name: 'Cross2',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  expect(resp1.data.insert_pollen_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      crossing_name: 'Cross1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Pollen 1',
      crossing_name: 'Cross1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdatePollen($id: Int!, $name: citext!) {
        update_pollen_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
          id
          name
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_pollen_one.id,
      name: 'Pollen 2',
    },
  });

  expect(updated.data.update_pollen_by_pk.id).toBe(
    resp.data.insert_pollen_one.id,
  );
  expect(updated.data.update_pollen_by_pk.name).toBe('Pollen 2');
  expect(updated.data.update_pollen_by_pk.modified).toMatch(iso8601dateRegex);
});
