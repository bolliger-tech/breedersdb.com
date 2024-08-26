import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertPlantRow(
    $name: String
    $orchard_name: String
    $note: String
    $date_created: date
    $date_eliminated: date
  ) {
    insert_plant_rows_one(
      object: {
        name: $name
        orchard: { data: { name: $orchard_name } }
        note: $note
        date_created: $date_created
        date_eliminated: $date_eliminated
      }
    ) {
      id
      name
      orchard {
        name
      }
      note
      date_created
      date_eliminated
      disabled
      created
      modified
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllPlantRows {
        delete_plant_rows(where: {}) {
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
      name: 'Row 1',
      orchard_name: 'Orchard 1',
      note: 'Note 1',
      date_created: '2021-01-01',
      date_eliminated: '2021-01-02',
    },
  });

  expect(resp.data.insert_plant_rows_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_plant_rows_one.name).toBe('Row 1');
  expect(resp.data.insert_plant_rows_one.orchard.name).toBe('Orchard 1');
  expect(resp.data.insert_plant_rows_one.note).toBe('Note 1');
  expect(resp.data.insert_plant_rows_one.date_created).toBe('2021-01-01');
  expect(resp.data.insert_plant_rows_one.date_eliminated).toBe('2021-01-02');
  expect(resp.data.insert_plant_rows_one.disabled).toBe(true);
  expect(resp.data.insert_plant_rows_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_plant_rows_one.modified).toBeNull();
});

test('name is unique in orchard', async () => {
  const orchard = await post({
    query: /* GraphQL */ `
      mutation InsertOrchard($name: String) {
        insert_orchards_one(object: { name: $name }) {
          id
          name
        }
      }
    `,
    variables: { name: 'Orchard 1' },
  });
  const resp1 = await post({
    query: /* GraphQL */ `
      mutation InsertPlantRow($name: String, $orchard_id: Int) {
        insert_plant_rows_one(
          object: { name: $name, orchard_id: $orchard_id }
        ) {
          id
        }
      }
    `,
    variables: {
      name: 'Row 1',
      orchard_id: orchard.data.insert_orchards_one.id,
    },
  });
  const resp2 = await post({
    query: /* GraphQL */ `
      mutation InsertPlantRow($name: String, $orchard_id: Int) {
        insert_plant_rows_one(
          object: { name: $name, orchard_id: $orchard_id }
        ) {
          id
        }
      }
    `,
    variables: {
      name: 'row 1',
      orchard_id: orchard.data.insert_orchards_one.id,
    },
  });

  expect(resp1.data.insert_plant_rows_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is not globally unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'Row 1',
      orchard_name: 'Orchard 1',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'Row 1',
      orchard_name: 'Orchard 2',
    },
  });
  expect(resp1.data.insert_plant_rows_one.id).toBeGreaterThan(0);
  expect(resp2.data.insert_plant_rows_one.id).toBeGreaterThan(0);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      orchard_name: 'Orchard 1',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('date_eliminated sets disabled', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Row 1',
      orchard_name: 'Orchard 1',
      date_eliminated: '2021-01-02',
    },
  });

  expect(resp.data.insert_plant_rows_one.disabled).toBe(true);
});

test('removal of date_eliminated unsets disabled', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Row 1',
      orchard_name: 'Orchard 1',
      date_eliminated: '2021-01-02',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdatePlantRow($id: Int!, $date_eliminated: date) {
        update_plant_rows_by_pk(
          pk_columns: { id: $id }
          _set: { date_eliminated: $date_eliminated }
        ) {
          id
          disabled
        }
      }
    `,
    variables: {
      id: resp.data.insert_plant_rows_one.id,
      date_eliminated: null,
    },
  });

  expect(updated.data.update_plant_rows_by_pk.disabled).toBe(false);
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Row 1',
      orchard_name: 'Orchard 2',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdatePlantRow($id: Int!, $name: String) {
        update_plant_rows_by_pk(
          pk_columns: { id: $id }
          _set: { name: $name }
        ) {
          id
          name
          modified
        }
      }
    `,
    variables: { id: resp.data.insert_plant_rows_one.id, name: 'Row 999' },
  });

  expect(updated.data.update_plant_rows_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
