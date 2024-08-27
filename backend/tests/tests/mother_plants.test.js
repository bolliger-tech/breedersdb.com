import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertMotherPlant(
    $name: citext!
    $date_impregnated: date
    $date_fruits_harvested: date
    $numb_flowers: Int
    $numb_fruits: Int
    $numb_seeds: Int
    $note: String
    $plant_id: Int!
    $pollen_id: Int
    $crossing_name: citext!
    $crossing_mother_cultivar_id: Int
    $crossing_father_cultivar_id: Int
  ) {
    insert_mother_plants_one(
      object: {
        name: $name
        date_impregnated: $date_impregnated
        date_fruits_harvested: $date_fruits_harvested
        numb_flowers: $numb_flowers
        numb_fruits: $numb_fruits
        numb_seeds: $numb_seeds
        note: $note
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
      name
      date_impregnated
      date_fruits_harvested
      numb_flowers
      numb_fruits
      numb_seeds
      note
      plant {
        id
        cultivar_name
      }
      pollen {
        id
        name
        cultivar {
          id
          display_name
        }
      }
      crossing {
        id
        name
        mother_cultivar {
          id
          display_name
        }
        father_cultivar {
          id
          display_name
        }
      }
      created
      modified
    }
  }
`;

const insertPlantMutation = /* GraphQL */ `
  mutation InsertPlant(
    $crossing_name: citext!
    $lot_name_segment: citext!
    $cultivar_name_segment: citext!
    $label_id: citext!
    $orchard_name: citext! = "Orchard 1"
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
      cultivar_name
      plant_group {
        cultivar {
          id
          display_name
          lot {
            id
            display_name
            crossing {
              id
              name
            }
          }
        }
      }
    }
  }
`;

const insertPollenMutation = /* GraphQL */ `
  mutation InsertPollen(
    $name: citext!
    $crossing_name: citext!
    $lot_name_segment: citext!
    $cultivar_name_segment: citext!
    $orchard_name: citext! = "Orchard 1"
  ) {
    insert_pollen_one(
      object: {
        name: $name
        cultivar: {
          data: {
            name_segment: $cultivar_name_segment
            lot: {
              data: {
                name_segment: $lot_name_segment
                crossing: { data: { name: $crossing_name } }
                orchard: { data: { name: $orchard_name } }
              }
            }
          }
        }
      }
    ) {
      id
      name
      cultivar {
        id
        display_name
      }
    }
  }
`;

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllMotherPlants {
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
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const pollen = await postOrFail({
    query: insertPollenMutation,
    variables: {
      name: 'Pollen 1',
      crossing_name: 'C2',
      orchard_name: 'Orchard 2',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Mother plant 1',
      date_impregnated: '2021-01-02',
      date_fruits_harvested: '2021-01-03',
      numb_flowers: 2,
      numb_fruits: 3,
      numb_seeds: 4,
      note: 'Note',
      plant_id: plant.data.insert_plants_one.id,
      pollen_id: pollen.data.insert_pollen_one.id,
      crossing_name: 'C3',
      crossing_mother_cultivar_id:
        plant.data.insert_plants_one.plant_group.cultivar.id,
      crossing_father_cultivar_id: pollen.data.insert_pollen_one.cultivar.id,
    },
  });

  expect(resp.data.insert_mother_plants_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mother_plants_one.name).toBe('Mother plant 1');
  expect(resp.data.insert_mother_plants_one.date_impregnated).toBe(
    '2021-01-02',
  );
  expect(resp.data.insert_mother_plants_one.date_fruits_harvested).toBe(
    '2021-01-03',
  );
  expect(resp.data.insert_mother_plants_one.numb_flowers).toBe(2);
  expect(resp.data.insert_mother_plants_one.numb_fruits).toBe(3);
  expect(resp.data.insert_mother_plants_one.numb_seeds).toBe(4);
  expect(resp.data.insert_mother_plants_one.note).toBe('Note');
  expect(resp.data.insert_mother_plants_one.plant.id).toBe(
    plant.data.insert_plants_one.id,
  );
  expect(resp.data.insert_mother_plants_one.pollen.id).toBe(
    pollen.data.insert_pollen_one.id,
  );
  expect(resp.data.insert_mother_plants_one.crossing.name).toBe('C3');
  expect(resp.data.insert_mother_plants_one.crossing.mother_cultivar.id).toBe(
    plant.data.insert_plants_one.plant_group.cultivar.id,
  );
  expect(resp.data.insert_mother_plants_one.crossing.father_cultivar.id).toBe(
    pollen.data.insert_pollen_one.cultivar.id,
  );
  expect(resp.data.insert_mother_plants_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_mother_plants_one.modified).toEqual(
    resp.data.insert_mother_plants_one.created,
  );
});

test('insert with contradicting plant cultivar', async () => {
  const cultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($name_segment: citext!) {
        insert_cultivars_one(
          object: {
            name_segment: $name_segment
            lot: {
              data: {
                name_segment: "24A"
                crossing: { data: { name: "C0" } }
                orchard: { data: { name: "Orchard 1" } }
              }
            }
          }
        ) {
          id
          display_name
        }
      }
    `,
    variables: {
      name_segment: '002',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      crossing_name: 'C1',
      orchard_name: 'Orchard 2',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mother plant 1',
      date_impregnated: '2021-01-02',
      date_fruits_harvested: '2021-01-03',
      numb_flowers: 2,
      numb_fruits: 3,
      numb_seeds: 4,
      note: 'Note',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    /The cultivar of the mother plant must match the mother cultivar of the crossing./,
  );
});

test('insert with contradicting pollen cultivar', async () => {
  const cultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($name_segment: citext!) {
        insert_cultivars_one(
          object: {
            name_segment: $name_segment
            lot: {
              data: {
                name_segment: "24A"
                crossing: { data: { name: "C0" } }
                orchard: { data: { name: "Orchard 1" } }
              }
            }
          }
        ) {
          id
          display_name
        }
      }
    `,
    variables: {
      name_segment: '002',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      crossing_name: 'C1',
      orchard_name: 'Orchard 2',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const pollen = await postOrFail({
    query: insertPollenMutation,
    variables: {
      name: 'Pollen 1',
      crossing_name: 'C2',
      orchard_name: 'Orchard 3',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mother plant 1',
      date_impregnated: '2021-01-02',
      date_fruits_harvested: '2021-01-03',
      numb_flowers: 2,
      numb_fruits: 3,
      numb_seeds: 4,
      note: 'Note',
      plant_id: plant.data.insert_plants_one.id,
      pollen_id: pollen.data.insert_pollen_one.id,
      crossing_name: 'C3',
      crossing_mother_cultivar_id:
        plant.data.insert_plants_one.plant_group.cultivar_id,
      crossing_father_cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    /The cultivar of the pollen must match the father cultivar of the crossing./,
  );
});

test('insert name is unique', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      crossing_name: 'C1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const resp1 = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Mother plant 1',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id:
        plant.data.insert_plants_one.plant_group.cultivar_id,
    },
  });

  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'mother plant 1',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id:
        plant.data.insert_plants_one.plant_group.cultivar_id,
    },
  });

  expect(resp1.data.insert_mother_plants_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('insert name is required', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      crossing_name: 'C1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id:
        plant.data.insert_plants_one.plant_group.cultivar_id,
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      crossing_name: 'C1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Mother plant 1',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id:
        plant.data.insert_plants_one.plant_group.cultivar_id,
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateMotherPlant($id: Int!, $name: citext) {
        update_mother_plants_by_pk(
          pk_columns: { id: $id }
          _set: { name: $name }
        ) {
          id
          name
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_mother_plants_one.id,
      name: 'Mother plant 999',
    },
  });

  expect(
    new Date(updated.data.update_mother_plants_by_pk.modified).getTime(),
  ).toBeGreaterThan(
    new Date(resp.data.insert_mother_plants_one.modified).getTime(),
  );
});
