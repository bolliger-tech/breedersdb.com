import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertCrossing($name: String, $note: String) {
    insert_crossings_one(object: { name: $name, note: $note }) {
      id
      name
      mother_cultivar_id
      father_cultivar_id
      note
      created
      modified
      is_variety
    }
  }
`;

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllCrossings {
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
      name: 'Abcd',
      note: 'Some note',
    },
  });

  expect(resp.data.insert_crossings_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_crossings_one.name).toBe('Abcd');
  expect(resp.data.insert_crossings_one.mother_cultivar_id).toBeNull();
  expect(resp.data.insert_crossings_one.father_cultivar_id).toBeNull();
  expect(resp.data.insert_crossings_one.note).toBe('Some note');
  expect(resp.data.insert_crossings_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_crossings_one.modified).toBeNull();
  expect(resp.data.insert_crossings_one.is_variety).toBe(false);
});

test('name is unique', async () => {
  const resp1 = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Abcd',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'Abcd',
    },
  });

  expect(resp1.data.insert_crossings_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'modified',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $name: String) {
        update_crossings_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
          id
          name
          modified
        }
      }
    `,
    variables: { id: resp.data.insert_crossings_one.id, name: 'EFGH' },
  });

  expect(updated.data.update_crossings_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});

test('mother cultivar can not be changed to a cultivar different from linked mother plants cultivar', async () => {
  const crossing = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'cross1',
    },
  });

  await postOrFail({
    query: /* GraphQL */ `
      mutation InsertMotherPlant($crossing_id: Int!) {
        insert_mother_plants_one(
          object: {
            name: "Mother1"
            crossing_id: $crossing_id
            plant: {
              data: {
                label_id: "00000001"
                plant_group: {
                  data: {
                    name_segment: "A"
                    cultivar: {
                      data: {
                        name_segment: "001"
                        lot: {
                          data: {
                            name_segment: "24A"
                            orchard: { data: { name: "Orchard1" } }
                            crossing_id: $crossing_id
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
    `,
    variables: {
      crossing_id: crossing.data.insert_crossings_one.id,
    },
  });

  const newCultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($crossing_id: Int!) {
        insert_cultivars_one(
          object: {
            name_segment: "999"
            lot: {
              data: {
                name_segment: "24B"
                orchard: { data: { name: "Orchard2" } }
                crossing_id: $crossing_id
              }
            }
          }
        ) {
          id
        }
      }
    `,
    variables: {
      crossing_id: crossing.data.insert_crossings_one.id,
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $cultivar_id: Int) {
        update_crossings_by_pk(
          pk_columns: { id: $id }
          _set: { mother_cultivar_id: $cultivar_id }
        ) {
          id
        }
      }
    `,
    variables: {
      id: crossing.data.insert_crossings_one.id,
      cultivar_id: newCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(updated.errors[0].extensions.internal.error.message).toEqual(
    'Failed to change mother cultivar: Mother plants for this crossing exist, but their plant has a different cultivar.',
  );
});

test('mother cultivar can be changed to the same cultivar as the linked mother plants cultivar', async () => {
  const crossing = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Abcd',
    },
  });

  const motherCultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($crossing_id: Int!) {
        insert_cultivars_one(
          object: {
            name_segment: "123"
            lot: {
              data: {
                name_segment: "24M"
                orchard: { data: { name: "OrchardM" } }
                crossing_id: $crossing_id
              }
            }
          }
        ) {
          id
        }
      }
    `,
    variables: {
      crossing_id: crossing.data.insert_crossings_one.id,
    },
  });
  const fatherCultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($crossing_id: Int!) {
        insert_cultivars_one(
          object: {
            name_segment: "234"
            lot: {
              data: {
                name_segment: "24F"
                orchard: { data: { name: "OrchardF" } }
                crossing_id: $crossing_id
              }
            }
          }
        ) {
          id
        }
      }
    `,
    variables: {
      crossing_id: crossing.data.insert_crossings_one.id,
    },
  });

  await postOrFail({
    query: /* GraphQL */ `
      mutation InsertMotherPlant(
        $crossing_id: Int!
        $mother_cultivar_id: Int!
        $father_cultivar_id: Int!
      ) {
        insert_mother_plants_one(
          object: {
            name: "Mother1"
            crossing_id: $crossing_id
            plant: {
              data: {
                label_id: "00000001"
                plant_group: {
                  data: { name_segment: "A", cultivar_id: $mother_cultivar_id }
                }
              }
            }
            pollen: {
              data: { name: "pollen1", cultivar_id: $father_cultivar_id }
            }
          }
        ) {
          id
        }
      }
    `,
    variables: {
      crossing_id: crossing.data.insert_crossings_one.id,
      mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
      father_cultivar_id: fatherCultivar.data.insert_cultivars_one.id,
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCrossing(
        $id: Int!
        $mother_cultivar_id: Int!
        $father_cultivar_id: Int!
      ) {
        update_crossings_by_pk(
          pk_columns: { id: $id }
          _set: {
            mother_cultivar_id: $mother_cultivar_id
            father_cultivar_id: $father_cultivar_id
          }
        ) {
          id
        }
      }
    `,
    variables: {
      id: crossing.data.insert_crossings_one.id,
      mother_cultivar_id: motherCultivar.data.insert_cultivars_one.id,
      father_cultivar_id: fatherCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(updated.data.update_crossings_by_pk.id).toBeNumber();
});

test('father cultivar can not be changed to a cultivar different from linked pollen cultivar', async () => {
  const crossing = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'cross1',
    },
  });

  await postOrFail({
    query: /* GraphQL */ `
      mutation InsertMotherPlant($crossing_id: Int!) {
        insert_mother_plants_one(
          object: {
            name: "Mother1"
            crossing_id: $crossing_id
            plant: {
              data: {
                label_id: "00000001"
                plant_group: {
                  data: {
                    name_segment: "A"
                    cultivar: {
                      data: {
                        name_segment: "001"
                        lot: {
                          data: {
                            name_segment: "24A"
                            orchard: { data: { name: "Orchard1" } }
                            crossing_id: $crossing_id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            pollen: {
              data: {
                name: "pollen1"
                cultivar: {
                  data: {
                    name_segment: "111"
                    lot: {
                      data: {
                        name_segment: "24Z"
                        orchard: { data: { name: "Orchard2" } }
                        crossing_id: $crossing_id
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
    `,
    variables: {
      crossing_id: crossing.data.insert_crossings_one.id,
    },
  });

  const newCultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($crossing_id: Int!) {
        insert_cultivars_one(
          object: {
            name_segment: "999"
            lot: {
              data: {
                name_segment: "24B"
                orchard: { data: { name: "Orchard10" } }
                crossing_id: $crossing_id
              }
            }
          }
        ) {
          id
        }
      }
    `,
    variables: {
      crossing_id: crossing.data.insert_crossings_one.id,
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $cultivar_id: Int) {
        update_crossings_by_pk(
          pk_columns: { id: $id }
          _set: { father_cultivar_id: $cultivar_id }
        ) {
          id
        }
      }
    `,
    variables: {
      id: crossing.data.insert_crossings_one.id,
      cultivar_id: newCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(updated.errors[0].extensions.internal.error.message).toEqual(
    'Failed to change father cultivar: Mother plants for this crossing exist, but their pollen has a different cultivar.',
  );
});

test('father & mother cultivar can changed if no mother plant is linked', async () => {
  const crossing = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'cross1',
    },
  });

  const newCultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($crossing_id: Int!) {
        insert_cultivars_one(
          object: {
            name_segment: "999"
            lot: {
              data: {
                name_segment: "24B"
                orchard: { data: { name: "Orchard10" } }
                crossing_id: $crossing_id
              }
            }
          }
        ) {
          id
        }
      }
    `,
    variables: {
      crossing_id: crossing.data.insert_crossings_one.id,
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $cultivar_id: Int) {
        update_crossings_by_pk(
          pk_columns: { id: $id }
          _set: {
            father_cultivar_id: $cultivar_id
            mother_cultivar_id: $cultivar_id
          }
        ) {
          id
        }
      }
    `,
    variables: {
      id: crossing.data.insert_crossings_one.id,
      cultivar_id: newCultivar.data.insert_cultivars_one.id,
    },
  });

  expect(updated.data.update_crossings_by_pk.id).toBeNumber();
});
