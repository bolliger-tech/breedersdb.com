import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertLot(
    $crossing_name: citext
    $name_segment: citext
    $name_override: citext
    $date_sowed: date
    $numb_seeds_sowed: Int
    $numb_seedlings_grown: Int
    $seed_tray: String
    $date_planted: date
    $numb_seedlings_planted: Int
    $plot: String
    $orchard_name: citext
    $note: String
    $is_variety: Boolean = false
  ) {
    insert_crossings_one(
      object: {
        name: $crossing_name
        is_variety: $is_variety
        lots: {
          data: {
            name_segment: $name_segment
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
        name_segment
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
        is_variety
        orchard_id
      }
    }
  }
`;

afterEach(async () => {
  await postOrFail({
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
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      name_segment: '24A',
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
  expect(resp.data.insert_crossings_one.lots[0].name_segment).toBe('24A');
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
  expect(resp.data.insert_crossings_one.lots[0].modified).toEqual(
    resp.data.insert_crossings_one.lots[0].created,
  );
  expect(resp.data.insert_crossings_one.lots[0].is_variety).toBe(false);
});

test('crossing_name is unique', async () => {
  const resp1 = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      name_segment: '24A',
      orchard_name: 'Orchard 1',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'abcd',
      name_segment: '24A',
      orchard_name: 'Orchard 2',
    },
  });

  expect(resp1.data.insert_crossings_one.lots[0].id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name_segment is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
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
      orchard_name: 'Orchard1',
      name_segment: '24A',
    },
  });

  const updated = await postOrFail({
    query: `mutation UpdateCrossing($id: Int!, $name: citext!) {
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
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
      name_segment: '24A',
    },
  });

  const updated = await postOrFail({
    query: `mutation UpdateLot($id: Int!, $name_segment: citext!) {
      update_lots_by_pk(pk_columns: {id: $id}, _set: {name_segment: $name_segment}) {
        id
        full_name
      }
    }`,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].id,
      name_segment: '24Z',
    },
  });

  expect(updated.data.update_lots_by_pk.full_name).toBe('Abcd.24Z');
});

test('display_name contains full_name', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      name_segment: '24A',
      orchard_name: 'Orchard1',
    },
  });

  expect(resp.data.insert_crossings_one.lots[0].full_name).toBe('Abcd.24A');
  expect(resp.data.insert_crossings_one.lots[0].display_name).toBe('Abcd.24A');
  expect(resp.data.insert_crossings_one.lots[0].name_override).toBe(null);
});

test('display_name contains name_override', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      name_segment: '24A',
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
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
      name_segment: '24A',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $name_segment: citext) {
        update_lots_by_pk(
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
      id: resp.data.insert_crossings_one.lots[0].id,
      name_segment: '24Z',
    },
  });

  expect(
    new Date(updated.data.update_lots_by_pk.modified).getTime(),
  ).toBeGreaterThan(
    new Date(resp.data.insert_crossings_one.lots[0].modified).getTime(),
  );
});

test('updating is_variety on crossings updates it on lots', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
      name_segment: '24A',
      is_variety: false,
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
            is_variety
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.id,
    },
  });

  expect(updated.data.update_crossings_by_pk.lots[0].is_variety).toBe(true);
});

test('updating the crossing_id updates is_variety', async () => {
  const notVariety = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
      name_segment: '24A',
      is_variety: false,
    },
  });
  const isVariety = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'APPLE',
      orchard_name: 'Orchard2',
      name_segment: '000',
      is_variety: true,
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $crossing_id: Int!) {
        update_lots_by_pk(
          pk_columns: { id: $id }
          _set: { crossing_id: $crossing_id }
        ) {
          id
          is_variety
        }
      }
    `,
    variables: {
      id: notVariety.data.insert_crossings_one.lots[0].id,
      crossing_id: isVariety.data.insert_crossings_one.id,
    },
  });

  expect(updated.data.update_lots_by_pk.is_variety).toBe(true);
});

test('direct updates on is_variety are impossible', async () => {
  const notVariety = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
      name_segment: '24A',
      is_variety: false,
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!) {
        update_lots_by_pk(pk_columns: { id: $id }, _set: { is_variety: true }) {
          id
          is_variety
        }
      }
    `,
    variables: {
      id: notVariety.data.insert_crossings_one.lots[0].id,
    },
  });

  expect(updated.errors[0].message).toEqual(
    "field 'is_variety' not found in type: 'lots_set_input'",
  );
});

test('direct inserts of is_variety are impossible', async () => {
  const notVariety = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      orchard_name: 'Orchard1',
      name_segment: '24A',
      is_variety: false,
    },
  });

  const inserted = await post({
    query: /* GraphQL */ `
      mutation InsertLot($crossing_id: Int!, $orchard_id: Int!) {
        insert_lots_one(
          object: {
            crossing_id: $crossing_id
            orchard_id: $orchard_id
            name_segment: "000"
            is_variety: true
          }
        ) {
          id
          is_variety
        }
      }
    `,
    variables: {
      crossing_id: notVariety.data.insert_crossings_one.id,
      orchard_id: notVariety.data.insert_crossings_one.lots[0].orchard_id,
    },
  });

  expect(inserted.errors[0].message).toEqual(
    "field 'is_variety' not found in type: 'lots_insert_input'",
  );
});
