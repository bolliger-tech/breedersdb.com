import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

// no #graphql tag here, because the syntax checker fails here
const insertFragment = `
id
name
lots {
  id
  segment_name
  cultivars {
    id
    segment_name
    trees {
      id
      label_id
      cultivar_name
      serial_in_plant_row
      distance_plant_row_start
      geo_location
      geo_location_accuracy
      date_grafted
      date_planted
      date_eliminated
      date_labeled
      note
      rootstock {
        id
        name
      }
      grafting {
        id
        name
      }
      plant_row {
        id
        name
        note
        date_created
        date_eliminated
        orchard {
          id
          name
        }
      }
      disabled
      created
      modified
    }
  }
}
`;

// no #graphql tag here, because the syntax checker fails on the interpolation
const insertMutation = `
mutation InsertTree(
  $crossing_name: String!,
  $lot_segment_name: String!,
  $cultivar_segment_name: String!,
  $rootstock_name: String,
  $grafting_name: String,
  $orchard_name: String,
  $lot_orchard_name: String! = "Lot Orchard 1"
  $plant_row_name: String,
  $label_id: String!,
  $serial_in_plant_row: Int,
  $distance_plant_row_start: float8,
  $geo_location: geography,
  $geo_location_accuracy: float8,
  $date_grafted: date,
  $date_planted: date,
  $date_eliminated: date,
  $date_labeled: date,
  $note: String
  ) {
  insert_crossings_one(object: {
    name: $crossing_name,
    lots: {data: {
      segment_name: $lot_segment_name,
      orchard: {data: {
        name: $lot_orchard_name
      }}
      cultivars: {data: {
        segment_name: $cultivar_segment_name,
        trees: {data: {
          label_id: $label_id,
          serial_in_plant_row: $serial_in_plant_row,
          distance_plant_row_start: $distance_plant_row_start,
          geo_location: $geo_location,
          geo_location_accuracy: $geo_location_accuracy,
          date_grafted: $date_grafted,
          date_planted: $date_planted,
          date_eliminated: $date_eliminated,
          date_labeled: $date_labeled,
          note: $note
          rootstock: {data: {
            name: $rootstock_name
          }},
          grafting: {data: {
            name: $grafting_name
          }},
          plant_row: {data: {
            name: $plant_row_name,
            orchard: {data: {
              name: $orchard_name
            }}
          }},
        }}
      }}
    }}
  }) {
    ${insertFragment}
  }
}`;

// no #graphql tag here, because the syntax checker fails on the interpolation
const insertMutationMinimal = `
mutation InsertTree(
  $crossing_name: String!,
  $lot_segment_name: String!,
  $lot_orchard_name: String! = "Lot Orchard 1"
  $cultivar_segment_name: String!,
  $label_id: String!,
  $date_eliminated: date
  ) {
  insert_crossings_one(object: {
    name: $crossing_name,
    lots: {data: {
      segment_name: $lot_segment_name,
      orchard: { data: { name: $lot_orchard_name } }
      cultivars: {data: {
        segment_name: $cultivar_segment_name,
        trees: {data: {
          label_id: $label_id,
          date_eliminated: $date_eliminated
        }}
      }}
    }}
  }) {
    ${insertFragment}
  }
}`;

// no #graphql tag here, because the syntax checker fails on the interpolation
const insertMutationPlantRow = `
mutation InsertTree(
  $crossing_name: String!,
  $lot_segment_name: String!,
  $lot_orchard_name: String! = "Lot Orchard 1"
  $cultivar_segment_name: String!,
  $label_id: String!,
  $date_eliminated: date,
  $plant_row_id: Int!,
  $serial_in_plant_row: Int!
  ) {
  insert_crossings_one(object: {
    name: $crossing_name,
    lots: {data: {
      segment_name: $lot_segment_name,
      orchard: { data: { name: $lot_orchard_name } }
      cultivars: {data: {
        segment_name: $cultivar_segment_name,
        trees: {data: {
          label_id: $label_id,
          date_eliminated: $date_eliminated
          plant_row_id: $plant_row_id
          serial_in_plant_row: $serial_in_plant_row
        }}
      }}
    }}
  }) {
    ${insertFragment}
  }
}`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllTrees {
        delete_trees(where: {}) {
          affected_rows
        }
        delete_plant_rows(where: {}) {
          affected_rows
        }
        delete_rootstocks(where: {}) {
          affected_rows
        }
        delete_graftings(where: {}) {
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
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '00000001',
      serial_in_plant_row: 1,
      distance_plant_row_start: 0.5,
      geo_location: {
        type: 'Point',
        coordinates: [7.470518977340019, 47.13866030575061],
      },
      geo_location_accuracy: 0.5,
      date_grafted: '2024-03-21',
      date_planted: '2024-03-22',
      date_labeled: '2024-03-24',
      note: 'This is a note',
      rootstock_name: 'Rootstock1',
      grafting_name: 'Grafting1',
      plant_row_name: 'PlantRow1',
      orchard_name: 'Orchard1',
    },
  });

  const tree = resp.data.insert_crossings_one.lots[0].cultivars[0].trees[0];

  expect(tree.id).toBeGreaterThan(0);
  expect(tree.label_id).toBe('00000001');
  expect(tree.cultivar_name).toBe('Abcd.24A.001');
  expect(tree.serial_in_plant_row).toBe(1);
  expect(tree.distance_plant_row_start).toBe(0.5);
  expect(tree.geo_location.coordinates).toEqual([
    7.470518977340019, 47.13866030575061,
  ]);
  expect(tree.geo_location_accuracy).toBe(0.5);
  expect(tree.date_grafted).toBe('2024-03-21');
  expect(tree.date_planted).toBe('2024-03-22');
  expect(tree.date_labeled).toBe('2024-03-24');
  expect(tree.note).toBe('This is a note');
  expect(tree.rootstock.name).toBe('Rootstock1');
  expect(tree.grafting.name).toBe('Grafting1');
  expect(tree.plant_row.name).toBe('PlantRow1');
  expect(tree.plant_row.orchard.name).toBe('Orchard1');
  expect(tree.disabled).toBe(false);
  expect(tree.created).toMatch(iso8601dateRegex);
  expect(tree.modified).toBeNull();
});

test('eliminating prefixes label_id and sets disabled', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '00000001',
    },
  });

  const eliminated = await post({
    query: /* GraphQL */ `
      mutation EliminateTree($id: Int!, $date_eliminated: date) {
        update_trees_by_pk(
          pk_columns: { id: $id }
          _set: { date_eliminated: $date_eliminated }
        ) {
          label_id
          disabled
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
      date_eliminated: '2024-03-23',
    },
  });

  expect(eliminated.data.update_trees_by_pk.label_id).toBe('#00000001');
  expect(eliminated.data.update_trees_by_pk.disabled).toBe(true);
});

test('prevent insertion of non-prefixed label_id if eliminated', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '00000001',
      date_eliminated: '2024-03-23',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    "Cannot insert or update a tree with a label_id that is prefixed with a '#' but has no date_eliminated.",
  );
});

test('prevent insertion of prefixed label_id if not eliminated', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '#00000001',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    "Cannot insert or update a tree with a label_id that is prefixed with a '#' but has no date_eliminated.",
  );
});

test('removal of elimination date removes prefix and unsets disabled', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '#00000001',
      date_eliminated: '2024-03-23',
    },
  });

  const eliminated = await post({
    query: /* GraphQL */ `
      mutation EliminateTree($id: Int!, $date_eliminated: date) {
        update_trees_by_pk(
          pk_columns: { id: $id }
          _set: { date_eliminated: $date_eliminated }
        ) {
          label_id
          disabled
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
      date_eliminated: null,
    },
  });

  expect(eliminated.data.update_trees_by_pk.label_id).toBe('00000001');
  expect(eliminated.data.update_trees_by_pk.disabled).toBe(false);
});

test('label_id is unique', async () => {
  const resp1 = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '00000001',
    },
  });
  const resp2 = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Defg',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '00000001',
    },
  });

  expect(
    resp1.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
  ).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('deleted label_id is not unique', async () => {
  const resp1 = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      lot_orchard_name: 'Orchard 1',
      cultivar_segment_name: '001',
      label_id: '#00000001',
      date_eliminated: '2024-03-23',
    },
  });
  const resp2 = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Defg',
      lot_segment_name: '24A',
      lot_orchard_name: 'Orchard 2',
      cultivar_segment_name: '001',
      label_id: '#00000001',
      date_eliminated: '2024-03-23',
    },
  });

  expect(
    resp1.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
  ).toBeGreaterThan(0);
  expect(
    resp2.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
  ).toBeGreaterThan(0);
});

test('label_id is no shorter than 8 digits', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '1234567',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('label_id is no longer than 8 digits', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '123456789',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('label_id is digits only', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '1234567a',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('updated cultivar_name cultivar', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '12345678',
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
          trees {
            id
            cultivar_name
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].id,
      segment_name: '999',
    },
  });

  expect(updated.data.update_cultivars_by_pk.trees[0].cultivar_name).toBe(
    'Abcd.24A.999',
  );
});

test('updated cultivar_name tree cultivar_id change', async () => {
  const initial = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '12345678',
    },
  });

  const newCultivar = await post({
    query: `mutation InsertCultivar($lot_id: Int!, $segment_name: String!) {
      insert_cultivars_one(object: {lot_id: $lot_id, segment_name: $segment_name}) {
        id
      }
    }`,
    variables: {
      lot_id: initial.data.insert_crossings_one.lots[0].id,
      segment_name: '999',
    },
  });

  const updatedTree = await post({
    query: /* GraphQL */ `
      mutation UpdateTree($id: Int!, $cultivar_id: Int!) {
        update_trees_by_pk(
          pk_columns: { id: $id }
          _set: { cultivar_id: $cultivar_id }
        ) {
          id
          cultivar_name
        }
      }
    `,
    variables: {
      id: initial.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
      cultivar_id: newCultivar.data.insert_cultivars_one.id,
    },
  });
});

test('modified', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '12345678',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateTree($id: Int!, $label_id: String!) {
        update_trees_by_pk(
          pk_columns: { id: $id }
          _set: { label_id: $label_id }
        ) {
          id
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
      label_id: '01234567',
    },
  });

  expect(updated.data.update_trees_by_pk.modified).toMatch(iso8601dateRegex);
});

test('row / serial combo is unique if not eliminated', async () => {
  const plantRow = await post({
    query: /* GraphQL */ `
      mutation InsertPlantRow($name: String!, $orchard_name: String!) {
        insert_plant_rows_one(
          object: { name: $name, orchard: { data: { name: $orchard_name } } }
        ) {
          id
        }
      }
    `,
    variables: {
      name: 'PlantRow1',
      orchard_name: 'Orchard1',
    },
  });

  const resp1 = await post({
    query: insertMutationPlantRow,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '00000001',
      plant_row_id: plantRow.data.insert_plant_rows_one.id,
      serial_in_plant_row: 1,
    },
  });
  const resp2 = await post({
    query: insertMutationPlantRow,
    variables: {
      crossing_name: 'Defg',
      lot_segment_name: '24A',
      cultivar_segment_name: '001',
      label_id: '00000002',
      plant_row_id: plantRow.data.insert_plant_rows_one.id,
      serial_in_plant_row: 1,
    },
  });

  expect(
    resp1.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
  ).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('row / serial combo not unique if is eliminated', async () => {
  const plantRow = await post({
    query: /* GraphQL */ `
      mutation InsertPlantRow($name: String!, $orchard_name: String!) {
        insert_plant_rows_one(
          object: { name: $name, orchard: { data: { name: $orchard_name } } }
        ) {
          id
        }
      }
    `,
    variables: {
      name: 'PlantRow1',
      orchard_name: 'Orchard1',
    },
  });

  const resp1 = await post({
    query: insertMutationPlantRow,
    variables: {
      crossing_name: 'Abcd',
      lot_segment_name: '24A',
      lot_orchard_name: 'Orchard 1',
      cultivar_segment_name: '001',
      label_id: '#00000001',
      date_eliminated: '2024-03-23',
      plant_row_id: plantRow.data.insert_plant_rows_one.id,
      serial_in_plant_row: 1,
    },
  });
  const resp2 = await post({
    query: insertMutationPlantRow,
    variables: {
      crossing_name: 'Defg',
      lot_segment_name: '24A',
      lot_orchard_name: 'Orchard 2',
      cultivar_segment_name: '001',
      label_id: '#00000002',
      date_eliminated: '2024-03-23',
      plant_row_id: plantRow.data.insert_plant_rows_one.id,
      serial_in_plant_row: 1,
    },
  });

  expect(
    resp1.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
  ).toBeGreaterThan(0);
  expect(
    resp2.data.insert_crossings_one.lots[0].cultivars[0].trees[0].id,
  ).toBeGreaterThan(0);
});
