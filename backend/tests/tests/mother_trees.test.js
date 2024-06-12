import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertMotherTree(
    $name: String!
    $date_impregnated: date
    $date_fruits_harvested: date
    $numb_flowers: Int
    $numb_fruits: Int
    $numb_seeds: Int
    $note: String
    $tree_id: Int!
    $pollen_id: Int
    $crossing_name: String!
    $crossing_mother_cultivar_id: Int
    $crossing_father_cultivar_id: Int
  ) {
    insert_mother_trees_one(
      object: {
        name: $name
        date_impregnated: $date_impregnated
        date_fruits_harvested: $date_fruits_harvested
        numb_flowers: $numb_flowers
        numb_fruits: $numb_fruits
        numb_seeds: $numb_seeds
        note: $note
        tree_id: $tree_id
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
      tree {
        id
        cultivar_name
      }
      pollen {
        id
        name
        cultivar {
          id
          name
        }
      }
      crossing {
        id
        name
        mother_cultivar {
          id
          name
        }
        father_cultivar {
          id
          name
        }
      }
      created
      modified
    }
  }
`;

const insertTreeMutation = /* GraphQL */ `
  mutation InsertTree(
    $crossing_name: String!
    $lot_name_segment: String!
    $cultivar_name_segment: String!
    $label_id: String!
    $orchard_name: String! = "Orchard 1"
  ) {
    insert_trees_one(
      object: {
        label_id: $label_id
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
      cultivar_name
      cultivar {
        id
        name
        lot {
          id
          name
          crossing {
            id
            name
          }
        }
      }
    }
  }
`;

const insertPollenMutation = /* GraphQL */ `
  mutation InsertPollen(
    $name: String!
    $crossing_name: String!
    $lot_name_segment: String!
    $cultivar_name_segment: String!
    $orchard_name: String! = "Orchard 1"
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
        name
      }
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllMotherTrees {
        delete_mother_trees(where: {}) {
          affected_rows
        }
        delete_pollen(where: {}) {
          affected_rows
        }
        delete_trees(where: {}) {
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
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      crossing_name: 'C1',
      orchard_name: 'Orchard 1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const pollen = await post({
    query: insertPollenMutation,
    variables: {
      name: 'Pollen 1',
      crossing_name: 'C2',
      orchard_name: 'Orchard 2',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mother tree 1',
      date_impregnated: '2021-01-02',
      date_fruits_harvested: '2021-01-03',
      numb_flowers: 2,
      numb_fruits: 3,
      numb_seeds: 4,
      note: 'Note',
      tree_id: tree.data.insert_trees_one.id,
      pollen_id: pollen.data.insert_pollen_one.id,
      crossing_name: 'C3',
      crossing_mother_cultivar_id: tree.data.insert_trees_one.cultivar.id,
      crossing_father_cultivar_id: pollen.data.insert_pollen_one.cultivar.id,
    },
  });

  expect(resp.data.insert_mother_trees_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mother_trees_one.name).toBe('Mother tree 1');
  expect(resp.data.insert_mother_trees_one.date_impregnated).toBe('2021-01-02');
  expect(resp.data.insert_mother_trees_one.date_fruits_harvested).toBe(
    '2021-01-03',
  );
  expect(resp.data.insert_mother_trees_one.numb_flowers).toBe(2);
  expect(resp.data.insert_mother_trees_one.numb_fruits).toBe(3);
  expect(resp.data.insert_mother_trees_one.numb_seeds).toBe(4);
  expect(resp.data.insert_mother_trees_one.note).toBe('Note');
  expect(resp.data.insert_mother_trees_one.tree.id).toBe(
    tree.data.insert_trees_one.id,
  );
  expect(resp.data.insert_mother_trees_one.pollen.id).toBe(
    pollen.data.insert_pollen_one.id,
  );
  expect(resp.data.insert_mother_trees_one.crossing.name).toBe('C3');
  expect(resp.data.insert_mother_trees_one.crossing.mother_cultivar.id).toBe(
    tree.data.insert_trees_one.cultivar.id,
  );
  expect(resp.data.insert_mother_trees_one.crossing.father_cultivar.id).toBe(
    pollen.data.insert_pollen_one.cultivar.id,
  );
  expect(resp.data.insert_mother_trees_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_mother_trees_one.modified).toBeNull();
});

test('insert with contradicting tree cultivar', async () => {
  const cultivar = await post({
    query: /* GraphQL */ `
      mutation InsertCultivar($name_segment: String!) {
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
          name
        }
      }
    `,
    variables: {
      name_segment: '002',
    },
  });

  const tree = await post({
    query: insertTreeMutation,
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
      name: 'Mother tree 1',
      date_impregnated: '2021-01-02',
      date_fruits_harvested: '2021-01-03',
      numb_flowers: 2,
      numb_fruits: 3,
      numb_seeds: 4,
      note: 'Note',
      tree_id: tree.data.insert_trees_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    /The cultivar of the mother tree must match the mother cultivar of the crossing./,
  );
});

test('insert with contradicting pollen cultivar', async () => {
  const cultivar = await post({
    query: /* GraphQL */ `
      mutation InsertCultivar($name_segment: String!) {
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
          name
        }
      }
    `,
    variables: {
      name_segment: '002',
    },
  });

  const tree = await post({
    query: insertTreeMutation,
    variables: {
      crossing_name: 'C1',
      orchard_name: 'Orchard 2',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const pollen = await post({
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
      name: 'Mother tree 1',
      date_impregnated: '2021-01-02',
      date_fruits_harvested: '2021-01-03',
      numb_flowers: 2,
      numb_fruits: 3,
      numb_seeds: 4,
      note: 'Note',
      tree_id: tree.data.insert_trees_one.id,
      pollen_id: pollen.data.insert_pollen_one.id,
      crossing_name: 'C3',
      crossing_mother_cultivar_id: tree.data.insert_trees_one.cultivar.id,
      crossing_father_cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    /The cultivar of the pollen must match the father cultivar of the crossing./,
  );
});

test('insert name is unique', async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      crossing_name: 'C1',
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      label_id: '00000001',
    },
  });

  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'Mother tree 1',
      tree_id: tree.data.insert_trees_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: tree.data.insert_trees_one.cultivar.id,
    },
  });

  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'Mother tree 1',
      tree_id: tree.data.insert_trees_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: tree.data.insert_trees_one.cultivar.id,
    },
  });

  expect(resp1.data.insert_mother_trees_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('insert name is required', async () => {
  const tree = await post({
    query: insertTreeMutation,
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
      tree_id: tree.data.insert_trees_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: tree.data.insert_trees_one.cultivar.id,
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const tree = await post({
    query: insertTreeMutation,
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
      name: 'Mother tree 1',
      tree_id: tree.data.insert_trees_one.id,
      crossing_name: 'C2',
      crossing_mother_cultivar_id: tree.data.insert_trees_one.cultivar.id,
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateMotherTree($id: Int!, $name: String) {
        update_mother_trees_by_pk(
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
      id: resp.data.insert_mother_trees_one.id,
      name: 'Mother tree 999',
    },
  });

  expect(updated.data.update_mother_trees_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
