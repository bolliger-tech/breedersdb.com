import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertCultivarMutation = /* GraphQL */ `
  mutation InsertCultivar(
    $name_segment: citext!
    $lot_name_segment: citext! = "24A"
    $crossing_name: citext! = "C0"
    $orchard_name: citext! = "Orchard 1"
  ) {
    insert_cultivars_one(
      object: {
        name_segment: $name_segment
        lot: {
          data: {
            name_segment: $lot_name_segment
            crossing: { data: { name: $crossing_name } }
            orchard: { data: { name: $orchard_name } }
          }
        }
      }
    ) {
      id
      display_name
    }
  }
`;

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
  mutation InsertPlant($cultivar_id: Int!, $label_id: citext!) {
    insert_plants_one(
      object: {
        label_id: $label_id
        plant_group: { data: { name_segment: "A", cultivar_id: $cultivar_id } }
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
  mutation InsertPollen($name: citext!, $cultivar_id: Int!) {
    insert_pollen_one(object: { name: $name, cultivar_id: $cultivar_id }) {
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
  const motherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
    },
  });

  const fatherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '002',
      lot_name_segment: '24A',
      crossing_name: 'C2',
      orchard_name: 'Orchard 2',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_id: motherCultivar.data.insert_cultivars_one.id,
    },
  });

  const pollen = await postOrFail({
    query: insertPollenMutation,
    variables: {
      name: 'Pollen 1',
      cultivar_id: fatherCultivar.data.insert_cultivars_one.id,
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
      crossing_mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
      crossing_father_cultivar_id: fatherCultivar.data.insert_cultivars_one.id,
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
    motherCultivar.data.insert_cultivars_one.id,
  );
  expect(resp.data.insert_mother_plants_one.crossing.father_cultivar.id).toBe(
    fatherCultivar.data.insert_cultivars_one.id,
  );
  expect(resp.data.insert_mother_plants_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_mother_plants_one.modified).toEqual(
    resp.data.insert_mother_plants_one.created,
  );
});

test('insert with contradicting plant cultivar', async () => {
  const motherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
    },
  });

  const notMotherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '002',
      lot_name_segment: '24A',
      crossing_name: 'C2',
      orchard_name: 'Orchard 2',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      cultivar_id: notMotherCultivar.data.insert_cultivars_one.id,
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
      crossing_name: 'C3',
      crossing_mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    /The cultivar of the mother plant must match the mother cultivar of the crossing./,
  );
});

test('insert with empty crossing mother cultivar', async () => {
  const motherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      cultivar_id: motherCultivar.data.insert_cultivars_one.id,
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
      crossing_name: 'C3',
      crossing_mother_cultivar_id: null,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    /The crossing of the mother plant must have a mother cultivar\./,
  );
});

test('insert with contradicting pollen cultivar', async () => {
  const motherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
    },
  });

  const fatherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '002',
      lot_name_segment: '24A',
      crossing_name: 'C2',
      orchard_name: 'Orchard 2',
    },
  });

  const notFatherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '003',
      lot_name_segment: '24A',
      crossing_name: 'C3',
      orchard_name: 'Orchard 3',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      cultivar_id: motherCultivar.data.insert_cultivars_one.id,
      label_id: '00000001',
    },
  });

  const pollen = await postOrFail({
    query: insertPollenMutation,
    variables: {
      name: 'Pollen 1',
      cultivar_id: notFatherCultivar.data.insert_cultivars_one.id,
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
      crossing_name: 'C4',
      crossing_mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
      crossing_father_cultivar_id: fatherCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    /The cultivar of the pollen must match the father cultivar of the crossing./,
  );
});

test('insert name is unique', async () => {
  const motherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      cultivar_id: motherCultivar.data.insert_cultivars_one.id,
      label_id: '00000001',
    },
  });

  const resp1 = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Mother plant 1',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
    },
  });

  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'mother plant 1',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(resp1.data.insert_mother_plants_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('insert name is required', async () => {
  const motherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      cultivar_id: motherCultivar.data.insert_cultivars_one.id,
      label_id: '00000001',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const motherCultivar = await postOrFail({
    query: insertCultivarMutation,
    variables: {
      name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
    },
  });

  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      cultivar_id: motherCultivar.data.insert_cultivars_one.id,
      label_id: '00000001',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Mother plant 1',
      plant_id: plant.data.insert_plants_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
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
