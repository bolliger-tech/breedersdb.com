import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertPlantGroup(
    $crossing_name: citext! = "Abcd"
    $lot_name_segment: citext! = "24A"
    $orchard_name: citext! = "Orchard 1"
    $cultivar_name_segment: citext! = "001"
    $name_segment: citext!
    $name_override: citext
    $note: String
    $disabled: Boolean = false
  ) {
    insert_plant_groups_one(
      object: {
        name_segment: $name_segment
        name_override: $name_override
        note: $note
        disabled: $disabled
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
      label_id
      cultivar {
        id
        display_name
      }
      cultivar_name
      name_segment
      full_name
      name_override
      display_name
      note
      disabled
      created
      modified
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllPlantGroups {
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
  const { data, errors } = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
      name_override: 'The group',
      note: 'A note',
      disabled: true,
    },
  });

  expect(errors).toBeUndefined();
  expect(data.insert_plant_groups_one).toMatchObject({
    id: expect.any(Number),
    label_id: expect.stringMatching(/^G\d{8}$/),
    cultivar: { display_name: 'Abcd.24A.001' },
    cultivar_name: 'Abcd.24A.001',
    name_segment: 'A',
    full_name: 'Abcd.24A.001.A',
    name_override: 'The group',
    display_name: 'The group',
    note: 'A note',
    disabled: true,
    created: expect.stringMatching(iso8601dateRegex),
    modified: expect.stringMatching(iso8601dateRegex),
  });
});

test('changing the display_name of the cultivar changes the cultivar_name, full_name and display_name of the plant group', async () => {
  const { data: data1 } = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
    },
  });

  const { data: data2 } = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateCultivarDisplayName($id: Int!) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { name_override: "New" }
        ) {
          id
          plant_groups {
            id
            cultivar_name
            full_name
            display_name
          }
        }
      }
    `,
    variables: { id: data1.insert_plant_groups_one.cultivar.id },
  });

  expect(data2.update_cultivars_by_pk.plant_groups[0]).toMatchObject({
    id: data1.insert_plant_groups_one.id,
    cultivar_name: 'New',
    full_name: 'New.A',
    display_name: 'New.A',
  });
});

test('changing the cultivar_id changes the cultivar_name, full_name and display_name of the plant group', async () => {
  const { data: data1 } = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
    },
  });

  const { data: newCultivar } = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar {
        insert_cultivars_one(
          object: {
            name_segment: "999"
            lot: {
              data: {
                name_segment: "24A"
                orchard: { data: { name: "Orchard 2" } }
                crossing: { data: { name: "xyz" } }
              }
            }
          }
        ) {
          id
        }
      }
    `,
  });

  const { data: data2 } = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateCultivarId($id: Int!, $cultivar_id: Int!) {
        update_plant_groups_by_pk(
          pk_columns: { id: $id }
          _set: { cultivar_id: $cultivar_id }
        ) {
          id
          cultivar_name
          full_name
          display_name
        }
      }
    `,
    variables: {
      id: data1.insert_plant_groups_one.id,
      cultivar_id: newCultivar.insert_cultivars_one.id,
    },
  });

  expect(data2.update_plant_groups_by_pk).toMatchObject({
    id: data1.insert_plant_groups_one.id,
    cultivar_name: 'xyz.24A.999',
    full_name: 'xyz.24A.999.A',
    display_name: 'xyz.24A.999.A',
  });
});

test('display_name contains name_override', async () => {
  const { data } = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
      name_override: 'The group',
    },
  });

  expect(data.insert_plant_groups_one.display_name).toBe('The group');
});

test('display_name contains full_name', async () => {
  const { data } = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
      name_override: null,
    },
  });

  expect(data.insert_plant_groups_one.display_name).toBe('Abcd.24A.001.A');
});

test('modified is updated', async () => {
  const { data: data1 } = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
    },
  });

  const { data: data2 } = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdatePlantGroup($id: Int!) {
        update_plant_groups_by_pk(
          pk_columns: { id: $id }
          _set: { name_segment: "B" }
        ) {
          id
          modified
        }
      }
    `,
    variables: { id: data1.insert_plant_groups_one.id },
  });

  expect(data2.update_plant_groups_by_pk.modified).toMatch(iso8601dateRegex);
  expect(
    new Date(data1.insert_plant_groups_one.modified).getTime(),
  ).toBeLessThan(new Date(data2.update_plant_groups_by_pk.modified).getTime());
});

test('plant group name_override cannot conflict with existing crossing name', async () => {
  // First create a crossing
  await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'ExistCr3',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
    },
  });

  // Try to create a plant group with name_override that conflicts with crossing name
  const { errors } = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'DiffCr7',
      lot_name_segment: '24B',
      orchard_name: 'Orchard 2',
      cultivar_name_segment: '002',
      name_segment: 'B',
      name_override: 'ExistCr3',
    },
  });

  expect(errors[0].extensions.internal.error.message).toMatch(
    /name_override ExistCr3 conflicts with existing crossing name/,
  );
});

test('plant group name_override cannot conflict with existing lot name_override', async () => {
  // First create a lot with name_override
  await postOrFail({
    query: `
      mutation InsertLotWithNameOverride {
        insert_lots_one(
          object: {
            name_segment: "24A"
            name_override: "LotOvr3"
            orchard: { data: { name: "TestOrch" } }
            crossing: { data: { name: "TestCr10" } }
          }
        ) {
          id
        }
      }
    `,
  });

  // Try to create a plant group with the same name_override
  const { errors } = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'DiffCr8',
      lot_name_segment: '24B',
      orchard_name: 'Orchard 2',
      cultivar_name_segment: '001',
      name_segment: 'A',
      name_override: 'LotOvr3',
    },
  });

  expect(errors[0].extensions.internal.error.message).toMatch(
    /name_override LotOvr3 conflicts with existing lot name_override/,
  );
});

test('plant group name_override cannot conflict with existing cultivar name_override', async () => {
  // First create a cultivar with name_override
  await postOrFail({
    query: `
      mutation InsertCultivarWithNameOverride {
        insert_cultivars_one(
          object: {
            name_segment: "001"
            name_override: "CultiOvr3"
            lot: {
              data: {
                name_segment: "24A"
                orchard: { data: { name: "TestOrch" } }
                crossing: { data: { name: "TestCr11" } }
              }
            }
          }
        ) {
          id
        }
      }
    `,
  });

  // Try to create a plant group with the same name_override
  const { errors } = await post({
    query: insertMutation,
    variables: {
      crossing_name: 'DiffCr9',
      lot_name_segment: '24B',
      orchard_name: 'Orchard 2',
      cultivar_name_segment: '002',
      name_segment: 'A',
      name_override: 'CultiOvr3',
    },
  });

  expect(errors[0].extensions.internal.error.message).toMatch(
    /name_override CultiOvr3 conflicts with existing cultivar name_override/,
  );
});

test('plant group name_override trims whitespace and converts empty strings to null', async () => {
  const { data } = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'TestCr12',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
      name_override: '  \t\n  ',
    },
  });

  expect(data.insert_plant_groups_one.name_override).toBeNull();
});

test('plant group name_override can be updated without conflicts', async () => {
  const { data: data1 } = await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name: 'Abcd',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      name_segment: 'A',
      name_override: 'OrigOvr3',
    },
  });

  const { data: data2 } = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdatePlantGroup($id: Int!, $name_override: citext) {
        update_plant_groups_by_pk(
          pk_columns: { id: $id }
          _set: { name_override: $name_override }
        ) {
          id
          name_override
        }
      }
    `,
    variables: {
      id: data1.insert_plant_groups_one.id,
      name_override: 'UpdOvr3',
    },
  });

  expect(data2.update_plant_groups_by_pk.name_override).toBe('UpdOvr3');
});
