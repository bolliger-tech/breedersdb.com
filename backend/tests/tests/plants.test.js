import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

// no #graphql tag here, because the syntax checker fails here
const insertFragment = `
id
name
lots {
  id
  name_segment
  cultivars {
    id
    name_segment
    plant_groups {
      id
      display_name
      plants {
        id
        label_id
        cultivar_name
        plant_group_name
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
}
`;

// no #graphql tag here, because the syntax checker fails on the interpolation
const insertMutation = `
mutation InsertPlant(
  $crossing_name: citext!,
  $lot_name_segment: citext!,
  $cultivar_name_segment: citext!,
  $plant_group_name_segment: citext! = "A",
  $rootstock_name: citext,
  $grafting_name: citext,
  $orchard_name: citext,
  $lot_orchard_name: citext! = "Lot Orchard 1"
  $plant_row_name: citext,
  $label_id: citext!,
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
      name_segment: $lot_name_segment,
      orchard: {data: {
        name: $lot_orchard_name
      }}
      cultivars: {data: {
        name_segment: $cultivar_name_segment,
        plant_groups: {data: {
          name_segment: $plant_group_name_segment,
          plants: {data: {
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
    }}
  }) {
    ${insertFragment}
  }
}`;

// no #graphql tag here, because the syntax checker fails on the interpolation
const insertMutationMinimal = `
mutation InsertPlant(
  $crossing_name: citext!,
  $lot_name_segment: citext!,
  $lot_orchard_name: citext! = "Lot Orchard 1"
  $cultivar_name_segment: citext!,
  $plant_group_name_segment: citext! = "A",
  $label_id: citext!,
  $date_eliminated: date
  ) {
  insert_crossings_one(object: {
    name: $crossing_name,
    lots: {data: {
      name_segment: $lot_name_segment,
      orchard: { data: { name: $lot_orchard_name } }
      cultivars: {data: {
        name_segment: $cultivar_name_segment,
        plant_groups: {data: {
          name_segment: $plant_group_name_segment,
          plants: {data: {
            label_id: $label_id,
            date_eliminated: $date_eliminated
          }}
        }}
      }}
    }}
  }) {
    ${insertFragment}
  }
}`;

// no #graphql tag here, because the syntax checker fails on the interpolation
const insertMutationPlantRow = `
mutation InsertPlant(
  $crossing_name: citext!,
  $lot_name_segment: citext!,
  $lot_orchard_name: citext! = "Lot Orchard 1"
  $cultivar_name_segment: citext!,
  $plant_group_name_segment: citext! = "A",
  $label_id: citext!,
  $date_eliminated: date,
  $plant_row_id: Int!,
  $serial_in_plant_row: Int!
  ) {
  insert_crossings_one(object: {
    name: $crossing_name,
    lots: {data: {
      name_segment: $lot_name_segment,
      orchard: { data: { name: $lot_orchard_name } }
      cultivars: {data: {
        name_segment: $cultivar_name_segment,
        plant_groups: {data: {
          name_segment: $plant_group_name_segment,
          plants: {data: {
            label_id: $label_id,
            date_eliminated: $date_eliminated
            plant_row_id: $plant_row_id
            serial_in_plant_row: $serial_in_plant_row
          }}
        }}
      }}
    }}
  }) {
    ${insertFragment}
  }
}`;

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllPlants {
        delete_plants(where: {}) {
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
        delete_plant_groups(where: {}) {
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
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      plant_group_name_segment: 'Z',
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

  const plant =
    resp.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
      .plants[0];

  expect(plant.id).toBeGreaterThan(0);
  expect(plant.label_id).toBe('00000001');
  expect(plant.cultivar_name).toBe('Abcd.24A.001');
  expect(plant.plant_group_name).toBe('Abcd.24A.001.Z');
  expect(plant.serial_in_plant_row).toBe(1);
  expect(plant.distance_plant_row_start).toBe(0.5);
  expect(plant.geo_location.coordinates).toEqual([
    7.470518977340019, 47.13866030575061,
  ]);
  expect(plant.geo_location_accuracy).toBe(0.5);
  expect(plant.date_grafted).toBe('2024-03-21');
  expect(plant.date_planted).toBe('2024-03-22');
  expect(plant.date_labeled).toBe('2024-03-24');
  expect(plant.note).toBe('This is a note');
  expect(plant.rootstock.name).toBe('Rootstock1');
  expect(plant.grafting.name).toBe('Grafting1');
  expect(plant.plant_row.name).toBe('PlantRow1');
  expect(plant.plant_row.orchard.name).toBe('Orchard1');
  expect(plant.disabled).toBe(false);
  expect(plant.created).toMatch(iso8601dateRegex);
  expect(plant.modified).toBeNull();
});

test('eliminating prefixes label_id and sets disabled', async () => {
  const resp = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const eliminated = await postOrFail({
    query: /* GraphQL */ `
      mutation EliminatePlant($id: Int!, $date_eliminated: date) {
        update_plants_by_pk(
          pk_columns: { id: $id }
          _set: { date_eliminated: $date_eliminated }
        ) {
          label_id
          disabled
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
        .plants[0].id,
      date_eliminated: '2024-03-23',
    },
  });

  expect(eliminated.data.update_plants_by_pk.label_id).toBe('#00000001');
  expect(eliminated.data.update_plants_by_pk.disabled).toBe(true);
});

test('prevent insertion of non-prefixed label_id if eliminated', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
      date_eliminated: '2024-03-23',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    "Cannot insert or update a plant with a label_id that is prefixed with a '#' but has no date_eliminated.",
  );
});

test('prevent insertion of prefixed label_id if not eliminated', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '#00000001',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    "Cannot insert or update a plant with a label_id that is prefixed with a '#' but has no date_eliminated.",
  );
});

test('removal of elimination date removes prefix and unsets disabled', async () => {
  const resp = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '#00000001',
      date_eliminated: '2024-03-23',
    },
  });

  const eliminated = await postOrFail({
    query: /* GraphQL */ `
      mutation EliminatePlant($id: Int!, $date_eliminated: date) {
        update_plants_by_pk(
          pk_columns: { id: $id }
          _set: { date_eliminated: $date_eliminated }
        ) {
          label_id
          disabled
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
        .plants[0].id,
      date_eliminated: null,
    },
  });

  expect(eliminated.data.update_plants_by_pk.label_id).toBe('00000001');
  expect(eliminated.data.update_plants_by_pk.disabled).toBe(false);
});

test('label_id is unique', async () => {
  const resp1 = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });
  const resp2 = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Defg',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  expect(
    resp1.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
      .plants[0].id,
  ).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('deleted label_id is not unique', async () => {
  const resp1 = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      lot_orchard_name: 'Orchard 1',
      cultivar_name_segment: '001',
      label_id: '#00000001',
      date_eliminated: '2024-03-23',
    },
  });
  const resp2 = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Defg',
      lot_name_segment: '24A',
      lot_orchard_name: 'Orchard 2',
      cultivar_name_segment: '001',
      label_id: '#00000001',
      date_eliminated: '2024-03-23',
    },
  });

  expect(
    resp1.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
      .plants[0].id,
  ).toBeGreaterThan(0);
  expect(
    resp2.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
      .plants[0].id,
  ).toBeGreaterThan(0);
});

test('label_id is no shorter than 8 digits', async () => {
  const resp = await post({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
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
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
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
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '1234567a',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('updated cultivar_name on cultivar mod', async () => {
  const resp = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '12345678',
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
          plant_groups {
            plants {
              id
              cultivar_name
            }
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].id,
      name_segment: '999',
    },
  });

  expect(
    updated.data.update_cultivars_by_pk.plant_groups[0].plants[0].cultivar_name,
  ).toBe('Abcd.24A.999');
});

test('updated cultivar_name on plant_group cultivar_id change', async () => {
  const initial = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '12345678',
    },
  });

  const newCultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!, $name_segment: citext!) {
        insert_cultivars_one(
          object: { lot_id: $lot_id, name_segment: $name_segment }
        ) {
          id
        }
      }
    `,
    variables: {
      lot_id: initial.data.insert_crossings_one.lots[0].id,
      name_segment: '999',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdatePlantGroup($id: Int!, $cultivar_id: Int!) {
        update_plant_groups_by_pk(
          pk_columns: { id: $id }
          _set: { cultivar_id: $cultivar_id }
        ) {
          id
          plants {
            id
            cultivar_name
          }
        }
      }
    `,
    variables: {
      id: initial.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
        .id,
      cultivar_id: newCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(updated.data.update_plant_groups_by_pk.plants[0].cultivar_name).toBe(
    'Abcd.24A.999',
  );
});

test('updated plant_group_name on plant_group mod', async () => {
  const resp = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      plant_group_name_segment: 'A',
      label_id: '12345678',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdatePlantGroup($id: Int!, $name_segment: citext!) {
        update_plant_groups_by_pk(
          pk_columns: { id: $id }
          _set: { name_segment: $name_segment }
        ) {
          id
          plants {
            id
            plant_group_name
          }
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
        .id,
      name_segment: 'Z',
    },
  });

  expect(
    updated.data.update_plant_groups_by_pk.plants[0].plant_group_name,
  ).toBe('Abcd.24A.001.Z');
});

test('updated plant_group_name and cultivar_name on plant_group_id change', async () => {
  const initial = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      plant_group_name_segment: 'A',
      label_id: '12345678',
    },
  });

  const newCultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!, $name_segment: citext!) {
        insert_cultivars_one(
          object: { lot_id: $lot_id, name_segment: $name_segment }
        ) {
          id
        }
      }
    `,
    variables: {
      lot_id: initial.data.insert_crossings_one.lots[0].id,
      name_segment: '999',
    },
  });

  const newPlantGroup = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertPlantGroup($cultivar_id: Int!, $name_segment: citext!) {
        insert_plant_groups_one(
          object: { cultivar_id: $cultivar_id, name_segment: $name_segment }
        ) {
          id
        }
      }
    `,
    variables: {
      cultivar_id: newCultivar.data.insert_cultivars_one.id,
      name_segment: 'Z',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdatePlant($id: Int!, $plant_group_id: Int!) {
        update_plants_by_pk(
          pk_columns: { id: $id }
          _set: { plant_group_id: $plant_group_id }
        ) {
          id
          plant_group_name
          cultivar_name
        }
      }
    `,
    variables: {
      id: initial.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
        .plants[0].id,
      plant_group_id: newPlantGroup.data.insert_plant_groups_one.id,
    },
  });

  expect(updated.data.update_plants_by_pk.plant_group_name).toBe(
    'Abcd.24A.999.Z',
  );
  expect(updated.data.update_plants_by_pk.cultivar_name).toBe('Abcd.24A.999');
});

test('modified', async () => {
  const resp = await postOrFail({
    query: insertMutationMinimal,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '12345678',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdatePlant($id: Int!, $label_id: citext!) {
        update_plants_by_pk(
          pk_columns: { id: $id }
          _set: { label_id: $label_id }
        ) {
          id
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
        .plants[0].id,
      label_id: '01234567',
    },
  });

  expect(updated.data.update_plants_by_pk.modified).toMatch(iso8601dateRegex);
});

test('row / serial combo is unique if not eliminated', async () => {
  const plantRow = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertPlantRow($name: citext!, $orchard_name: citext!) {
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

  const resp1 = await postOrFail({
    query: insertMutationPlantRow,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
      plant_row_id: plantRow.data.insert_plant_rows_one.id,
      serial_in_plant_row: 1,
    },
  });
  const resp2 = await post({
    query: insertMutationPlantRow,
    variables: {
      crossing_name: 'Defg',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000002',
      plant_row_id: plantRow.data.insert_plant_rows_one.id,
      serial_in_plant_row: 1,
    },
  });

  expect(
    resp1.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
      .plants[0].id,
  ).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('row / serial combo not unique if is eliminated', async () => {
  const plantRow = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertPlantRow($name: citext!, $orchard_name: citext!) {
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

  const resp1 = await postOrFail({
    query: insertMutationPlantRow,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      lot_orchard_name: 'Orchard 1',
      cultivar_name_segment: '001',
      label_id: '#00000001',
      date_eliminated: '2024-03-23',
      plant_row_id: plantRow.data.insert_plant_rows_one.id,
      serial_in_plant_row: 1,
    },
  });
  const resp2 = await postOrFail({
    query: insertMutationPlantRow,
    variables: {
      crossing_name: 'Defg',
      lot_name_segment: '24A',
      lot_orchard_name: 'Orchard 2',
      cultivar_name_segment: '001',
      label_id: '#00000002',
      date_eliminated: '2024-03-23',
      plant_row_id: plantRow.data.insert_plant_rows_one.id,
      serial_in_plant_row: 1,
    },
  });

  expect(
    resp1.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
      .plants[0].id,
  ).toBeGreaterThan(0);
  expect(
    resp2.data.insert_crossings_one.lots[0].cultivars[0].plant_groups[0]
      .plants[0].id,
  ).toBeGreaterThan(0);
});
