import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';

const query = /* GraphQL */ `
  query NextFreeLabelId($label_id: String!) {
    plants_next_free_label_id(args: { input_label_id: $label_id }) {
      label_id
    }
  }
`;

const insertMutation = /* GraphQL */ `
  mutation InsertPlant(
    $crossing_name: String!
    $lot_name_segment: String!
    $orchard_name: String! = "Orchard 1"
    $cultivar_name_segment: String!
    $plant_group_name_segment: String! = "A"
    $label_id: String!
    $date_eliminated: date = null
  ) {
    insert_crossings_one(
      object: {
        name: $crossing_name
        lots: {
          data: {
            name_segment: $lot_name_segment
            orchard: { data: { name: $orchard_name } }
            cultivars: {
              data: {
                name_segment: $cultivar_name_segment
                plant_groups: {
                  data: {
                    name_segment: $plant_group_name_segment
                    plants: {
                      data: {
                        label_id: $label_id
                        date_eliminated: $date_eliminated
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ) {
      id
    }
  }
`;

async function insertWithLabelId({
  label_id,
  crossing_name = 'Abcd',
  orchard_name = 'Orchard 1',
  eliminated = false,
}) {
  await postOrFail({
    query: insertMutation,
    variables: {
      crossing_name,
      lot_name_segment: '24A',
      cultivar_name_segment: '001',
      plant_group_name_segment: 'Z',
      label_id,
      date_eliminated: eliminated ? '2024-03-24' : null,
      orchard_name,
    },
  });
}

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

test('throws on not digits only input', async () => {
  const resp = await post({
    query,
    variables: {
      label_id: '#00000001',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toMatch(
    /input_label_id must be a string of digits/,
  );
});

test('empty table', async () => {
  const resp = await postOrFail({
    query,
    variables: {
      label_id: '00000001',
    },
  });

  expect(resp.data.plants_next_free_label_id[0].label_id).toBe('00000001');
});

test('free label_id', async () => {
  await insertWithLabelId({ label_id: '00000001' });

  const resp = await postOrFail({
    query,
    variables: {
      label_id: '00000009',
    },
  });

  expect(resp.data.plants_next_free_label_id[0].label_id).toBe('00000009');
});

test('free label_id with same label_id eliminated', async () => {
  await insertWithLabelId({
    label_id: '#00000001',
    eliminated: true,
  });

  const resp = await postOrFail({
    query,
    variables: {
      label_id: '00000001',
    },
  });

  expect(resp.data.plants_next_free_label_id[0].label_id).toBe('00000001');
});

test('next is free', async () => {
  await insertWithLabelId({ label_id: '00000001' });

  const resp = await postOrFail({
    query,
    variables: {
      label_id: '00000001',
    },
  });

  expect(resp.data.plants_next_free_label_id[0].label_id).toBe('00000002');
});

test('+2 is free', async () => {
  await insertWithLabelId({
    label_id: '00000001',
    crossing_name: 'a',
    orchard_name: 'Orchard 1',
  });
  await insertWithLabelId({
    label_id: '00000002',
    crossing_name: 'b',
    orchard_name: 'Orchard 2',
  });

  const resp = await postOrFail({
    query,
    variables: {
      label_id: '00000001',
    },
  });

  expect(resp.data.plants_next_free_label_id[0].label_id).toBe('00000003');
});

test('fills the gaps', async () => {
  await insertWithLabelId({
    label_id: '00000001',
    crossing_name: 'a',
    orchard_name: 'Orchard 1',
  });
  await insertWithLabelId({
    label_id: '00000003',
    crossing_name: 'b',
    orchard_name: 'Orchard 2',
  });

  const resp = await postOrFail({
    query,
    variables: {
      label_id: '00000001',
    },
  });

  expect(resp.data.plants_next_free_label_id[0].label_id).toBe('00000002');
});

test('is not lower than the given label id', async () => {
  await insertWithLabelId({
    label_id: '00000010',
    crossing_name: 'a',
    orchard_name: 'Orchard 1',
  });

  const resp = await postOrFail({
    query,
    variables: {
      label_id: '00000010',
    },
  });

  expect(resp.data.plants_next_free_label_id[0].label_id).toBe('00000011');
});

test('respects unpadded label_id', async () => {
  await insertWithLabelId({
    label_id: '00000001',
    crossing_name: 'a',
    orchard_name: 'Orchard 1',
  });

  const resp = await postOrFail({
    query,
    variables: {
      label_id: '1',
    },
  });

  expect(resp.data.plants_next_free_label_id[0].label_id).toBe('00000002');
});
