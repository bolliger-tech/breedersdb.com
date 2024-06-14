import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertAttributions(
    $author: String
    $date_attributed: date
    $attribution_form_name: String
    $plant_id: Int
    $plant_group_id: Int
    $cultivar_id: Int
    $lot_id: Int
    $geo_location: geography
    $geo_location_accuracy: float8
  ) {
    insert_attributions_one(
      object: {
        author: $author
        date_attributed: $date_attributed
        attribution_form: { data: { name: $attribution_form_name } }
        plant_id: $plant_id
        plant_group_id: $plant_group_id
        cultivar_id: $cultivar_id
        lot_id: $lot_id
        geo_location: $geo_location
        geo_location_accuracy: $geo_location_accuracy
      }
    ) {
      id
      author
      date_attributed
      attribution_form {
        id
        name
      }
      plant {
        id
        label_id
      }
      plant_group {
        id
        display_name
      }
      cultivar {
        id
        display_name
      }
      lot {
        id
        display_name
      }
      geo_location
      geo_location_accuracy
      created
      modified
    }
  }
`;

const insertPlantMutation = /* GraphQL */ `
  mutation InsertPlant(
    $label_id: String!
    $cultivar_name_segment: String!
    $lot_name_segment: String!
    $crossing_name: String!
    $orchard_name: String! = "Orchard 1"
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
        id
        display_name
        cultivar {
          id
          lot {
            id
          }
        }
      }
    }
  }
`;

afterEach(async () => {
  const del = await post({
    query: /* GraphQL */ `
      mutation DeleteAllAttributions {
        delete_attributions(where: {}) {
          affected_rows
        }
        delete_attribution_forms(where: {}) {
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
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      author: 'Author 1',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      plant_id: plant.data.insert_plants_one.id,
      cultivar_id: null,
      lot_id: null,
      geo_location: {
        type: 'Point',
        coordinates: [7.470518977340019, 47.13866030575061],
      },
      geo_location_accuracy: 7.1,
    },
  });

  expect(resp.data.insert_attributions_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attributions_one.author).toBe('Author 1');
  expect(resp.data.insert_attributions_one.date_attributed).toBe('2021-01-01');
  expect(resp.data.insert_attributions_one.attribution_form.name).toBe(
    'Attribution Form 1',
  );
  expect(resp.data.insert_attributions_one.plant.label_id).toBe('00000001');
  expect(resp.data.insert_attributions_one.cultivar).toBeNull();
  expect(resp.data.insert_attributions_one.lot).toBeNull();
  expect(resp.data.insert_attributions_one.geo_location).toMatchObject({
    type: 'Point',
    coordinates: [7.470518977340019, 47.13866030575061],
  });
  expect(resp.data.insert_attributions_one.geo_location_accuracy).toBe(7.1);
  expect(resp.data.insert_attributions_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_attributions_one.modified).toBeNull();
});

test('author is required', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: '',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      plant_id: plant.data.insert_plants_one.id,
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('date_attributed is required', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: '',
      date_attributed: null,
      attribution_form_name: 'Attribution Form 1',
      plant_id: plant.data.insert_plants_one.id,
    },
  });

  expect(resp.errors[0].message).toBe("unexpected null value for type 'date'");
});

test('has attribution object', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: 'Author 1',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'An attribution must be associated with exactly one plant, plant_group, cultivar or lot, but not with none or more than one of them.',
  );
});

test('has exclusively one plant', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: 'Author 1',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      plant_id: plant.data.insert_plants_one.id,
      cultivar_id: plant.data.insert_plants_one.plant_group.cultivar.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'An attribution must be associated with exactly one plant, plant_group, cultivar or lot, but not with none or more than one of them.',
  );
});

test('has exclusively one plant group', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: 'Author 1',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      plant_id: plant.data.insert_plants_one.id,
      plant_group_id: plant.data.insert_plants_one.plant_group.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'An attribution must be associated with exactly one plant, plant_group, cultivar or lot, but not with none or more than one of them.',
  );
});

test('has exclusively one cultivar', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: 'Author 1',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      cultivar_id: plant.data.insert_plants_one.plant_group.cultivar.id,
      lot_id: plant.data.insert_plants_one.plant_group.cultivar.lot.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'An attribution must be associated with exactly one plant, plant_group, cultivar or lot, but not with none or more than one of them.',
  );
});

test('has exclusively one lot', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: 'Author 1',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      plant_id: plant.data.insert_plants_one.id,
      lot_id: plant.data.insert_plants_one.plant_group.cultivar.lot.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'An attribution must be associated with exactly one plant, plant_group, cultivar or lot, but not with none or more than one of them.',
  );
});

test('modified', async () => {
  const plant = await postOrFail({
    query: insertPlantMutation,
    variables: {
      label_id: '00000001',
      cultivar_name_segment: '001',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      author: 'Author 1',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      plant_id: plant.data.insert_plants_one.id,
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateAttribution($id: Int!, $author: String) {
        update_attributions_by_pk(
          pk_columns: { id: $id }
          _set: { author: $author }
        ) {
          id
          author
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_attributions_one.id,
      author: 'Author 999',
    },
  });

  expect(updated.data.update_attributions_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
