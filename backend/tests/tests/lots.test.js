import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertLot(
    $crossing_name: String
    $segment_name: String
    $name_override: String
    $date_sowed: date
    $numb_seeds_sowed: Int
    $numb_seedlings_grown: Int
    $seed_tray: String
    $date_planted: date
    $numb_seedlings_planted: Int
    $plot: String
    $orchard_name: String
    $note: String
  ) {
    insert_crossings_one(
      object: {
        name: $crossing_name
        lots: {
          data: {
            segment_name: $segment_name
            name_override: $name_override
            date_sowed: $date_sowed
            numb_seeds_sowed: $numb_seeds_sowed
            numb_seedlings_grown: $numb_seedlings_grown
            seed_tray: $seed_tray
            date_planted: $date_planted
            numb_seedlings_planted: $numb_seedlings_planted
            plot: $plot
            orchard: { data: { name: $orchard_name } }
            note: $note
          }
        }
      }
    ) {
      id
      name
      lots {
        id
        segment_name
        full_name
        name_override
        display_name
        date_sowed
        numb_seeds_sowed
        numb_seedlings_grown
        seed_tray
        date_planted
        numb_seedlings_planted
        plot
        note
        created
        modified
      }
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllLots {
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
  const date = '2024-03-21';
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      segment_name: '24A',
      date_sowed: date,
      numb_seeds_sowed: 100,
      numb_seedlings_grown: 90,
      seed_tray: 'A1',
      date_planted: date,
      numb_seedlings_planted: 80,
      plot: 'Plot1',
      orchard_name: 'Orchard1',
      note: 'This is a note',
    },
  });

  expect(resp.data.insert_crossings_one.lots[0].id).toBeGreaterThan(0);
  expect(resp.data.insert_crossings_one.lots[0].segment_name).toBe('24A');
  expect(resp.data.insert_crossings_one.lots[0].full_name).toBe('Abcd.24A');
  expect(resp.data.insert_crossings_one.lots[0].display_name).toBe('Abcd.24A');
  expect(resp.data.insert_crossings_one.lots[0].date_sowed).toBe(date);
  expect(resp.data.insert_crossings_one.lots[0].numb_seeds_sowed).toBe(100);
  expect(resp.data.insert_crossings_one.lots[0].numb_seedlings_grown).toBe(90);
  expect(resp.data.insert_crossings_one.lots[0].seed_tray).toBe('A1');
  expect(resp.data.insert_crossings_one.lots[0].date_planted).toBe(date);
  expect(resp.data.insert_crossings_one.lots[0].numb_seedlings_planted).toBe(
    80,
  );
  expect(resp.data.insert_crossings_one.lots[0].plot).toBe('Plot1');
  expect(resp.data.insert_crossings_one.lots[0].note).toBe('This is a note');
  expect(resp.data.insert_crossings_one.lots[0].created).toMatch(
    iso8601dateRegex,
  );
  expect(resp.data.insert_crossings_one.lots[0].modified).toBeNull();
});

test('crossing_name is unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      segment_name: '24A',
      orchard_name: 'Orchard 1',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      segment_name: '24A',
      orchard_name: 'Orchard 2',
    },
  });

  expect(resp1.data.insert_crossings_one.lots[0].id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('segment_name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
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
      orchard_name: 'Orchard1',
      segment_name: '24A',
    },
  });

  const updated = await post({
    query: `mutation UpdateCrossing($id: Int!, $name: String!) {
      update_crossings_by_pk(pk_columns: {id: $id}, _set: {name: $name}) {
        id
        lots {
          id
          full_name
        }
      }
    }`,
    variables: {
      id: resp.data.insert_crossings_one.id,
      name: 'Efgh',
    },
  });

  expect(updated.data.update_crossings_by_pk.lots[0].full_name).toBe(
    'Efgh.24A',
  );
});

test('updated full_name lot', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
      segment_name: '24A',
    },
  });

  const updated = await post({
    query: `mutation UpdateLot($id: Int!, $segment_name: String!) {
      update_lots_by_pk(pk_columns: {id: $id}, _set: {segment_name: $segment_name}) {
        id
        full_name
      }
    }`,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].id,
      segment_name: '24Z',
    },
  });

  expect(updated.data.update_lots_by_pk.full_name).toBe('Abcd.24Z');
});

test('display_name contains full_name', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      segment_name: '24A',
      orchard_name: 'Orchard1',
    },
  });

  expect(resp.data.insert_crossings_one.lots[0].full_name).toBe('Abcd.24A');
  expect(resp.data.insert_crossings_one.lots[0].display_name).toBe('Abcd.24A');
  expect(resp.data.insert_crossings_one.lots[0].name_override).toBe(null);
});

test('display_name contains name_override', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      segment_name: '24A',
      name_override: 'The lot name',
      orchard_name: 'Orchard1',
    },
  });

  expect(resp.data.insert_crossings_one.lots[0].full_name).toBe('Abcd.24A');
  expect(resp.data.insert_crossings_one.lots[0].display_name).toBe(
    'The lot name',
  );
  expect(resp.data.insert_crossings_one.lots[0].display_name).toBe(
    'The lot name',
  );
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
      segment_name: '24A',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $segment_name: String) {
        update_lots_by_pk(
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
      id: resp.data.insert_crossings_one.lots[0].id,
      segment_name: '24Z',
    },
  });

  expect(updated.data.update_lots_by_pk.modified).toMatch(iso8601dateRegex);
});
