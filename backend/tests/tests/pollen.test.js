import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
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
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllPollen {
        delete_mother_plants(where: {}) {
          affected_rows
        }
        delete_pollen(where: {}) {
          affected_rows
        }
        delete_plants(where: {}) {
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
  expect(resp.data.insert_pollen_one.modified).toEqual(
    resp.data.insert_pollen_one.created,
  );
});

test('name is unique', async () => {
  const resp1 = await postOrFail({
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
  const resp = await postOrFail({
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
  expect(
    new Date(updated.data.update_pollen_by_pk.modified).getTime(),
  ).toBeGreaterThan(new Date(resp.data.insert_pollen_one.modified).getTime());
});

test('cultivar_id is mutable if pollen NOT used in mother_plant', async () => {
  const inserted = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Pollen 1',
      crossing_name: 'Cross1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  const cultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar {
        insert_cultivars_one(
          object: {
            name_segment: "002"
            lot: {
              data: {
                name_segment: "24A"
                crossing: { data: { name: "C0" } }
                orchard: { data: { name: "Orchard 2" } }
              }
            }
          }
        ) {
          id
        }
      }
    `,
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdatePollen($id: Int!, $cultivar_id: Int!) {
        update_pollen_by_pk(
          pk_columns: { id: $id }
          _set: { cultivar_id: $cultivar_id }
        ) {
          id
          cultivar_id
        }
      }
    `,
    variables: {
      id: inserted.data.insert_pollen_one.id,
      cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  expect(inserted.data.insert_pollen_one.id).toBeGreaterThan(0);
  expect(updated.data.update_pollen_by_pk.cultivar_id).not.toBe(
    inserted.data.insert_pollen_one.cultivar_id,
  );
});

test('cultivar_id is NOT mutable if pollen used in mother_plant', async () => {
  const pollen = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Pollen 1',
      crossing_name: 'Cross1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  const insertPlantMutation = /* GraphQL */ `
    mutation InsertPlant(
      $crossing_name: citext!
      $lot_name_segment: citext!
      $cultivar_name_segment: citext!
      $label_id: citext!
      $orchard_name: citext! = "Orchard 2"
    ) {
      insert_plants_one(
        object: {
          label_id: $label_id
          plant_group: {
            data: {
              name_segment: "A"
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
          }
        }
      ) {
        id
        plant_group {
          cultivar {
            id
          }
        }
      }
    }
  `;

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      crossing_name: 'C1',
      orchard_name: 'Orchard 3',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const insertMotherPlantMutation = /* GraphQL */ `
    mutation InsertMotherPlant(
      $name: citext!
      $plant_id: Int!
      $pollen_id: Int
      $crossing_name: citext!
      $crossing_mother_cultivar_id: Int
      $crossing_father_cultivar_id: Int
    ) {
      insert_mother_plants_one(
        object: {
          name: $name
          plant_id: $plant_id
          pollen_id: $pollen_id
          crossing: {
            data: {
              name: $crossing_name
              mother_cultivar_id: $crossing_mother_cultivar_id
              father_cultivar_id: $crossing_father_cultivar_id
            }
          }
        }
      ) {
        id
      }
    }
  `;

  await postOrFail({
    query: insertMotherPlantMutation,
    variables: {
      name: 'Mother plant 1',
      plant_id: plant.data.insert_plants_one.id,
      pollen_id: pollen.data.insert_pollen_one.id,
      crossing_name: 'C3',
      crossing_mother_cultivar_id:
        plant.data.insert_plants_one.plant_group.cultivar.id,
      crossing_father_cultivar_id: pollen.data.insert_pollen_one.cultivar.id,
    },
  });

  const cultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar {
        insert_cultivars_one(
          object: {
            name_segment: "002"
            lot: {
              data: {
                name_segment: "24A"
                crossing: { data: { name: "C0" } }
                orchard: { data: { name: "Orchard 4" } }
              }
            }
          }
        ) {
          id
        }
      }
    `,
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdatePollen($id: Int!, $cultivar_id: Int!) {
        update_pollen_by_pk(
          pk_columns: { id: $id }
          _set: { cultivar_id: $cultivar_id }
        ) {
          id
          cultivar_id
        }
      }
    `,
    variables: {
      id: pollen.data.insert_pollen_one.id,
      cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  expect(updated.errors[0].extensions.internal.error.message).toEqual(
    'The cultivar of pollen cannot be changed once the pollen has been linked to a mother plant.',
  );
});
