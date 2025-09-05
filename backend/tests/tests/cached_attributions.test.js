import { test, expect, afterEach, describe } from 'bun:test';
import { postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const cachedAttributionsFields = /* GraphQL */ `
  fragment cachedAttributionsFields on cached_attributions {
    id
    author
    date_attributed
    integer_value
    float_value
    text_value
    boolean_value
    date_value
    attribute_name
    attribute {
      id
    }
    data_type
    text_note
    photo_note
    lot {
      id
      display_name
    }
    cultivar {
      id
      display_name
    }
    plant_group {
      id
      display_name
    }
    plant {
      id
      label_id
      cultivar_name
    }
    attribution_form {
      id
      name
    }
    geo_location
    geo_location_accuracy
    exceptional_attribution
    attribute_type
    created
    modified
  }
`;

const queryAll = /* GraphQL */ `
  ${cachedAttributionsFields}
  query cachedAttributions {
    cached_attributions {
      ...cachedAttributionsFields
    }
  }
`;

const queryById = /* GraphQL */ `
  ${cachedAttributionsFields}
  query cachedAttributions($id: Int!) {
    cached_attributions_by_pk(id: $id) {
      ...cachedAttributionsFields
    }
  }
`;

const queryByAttributeId = /* GraphQL */ `
  ${cachedAttributionsFields}
  query cachedAttributions($attribute_id: Int!) {
    cached_attributions(where: { attribute_id: { _eq: $attribute_id } }) {
      ...cachedAttributionsFields
    }
  }
`;

const queryByAttributeIdAndLotId = /* GraphQL */ `
  ${cachedAttributionsFields}
  query cachedAttributions($attribute_id: Int!, $lot_id: Int!) {
    cached_attributions(
      where: { attribute_id: { _eq: $attribute_id }, lot_id: { _eq: $lot_id } }
    ) {
      ...cachedAttributionsFields
    }
  }
`;

const queryByAttributeIdAndPlantGroupId = /* GraphQL */ `
  ${cachedAttributionsFields}
  query cachedAttributions($attribute_id: Int!, $plant_group_id: Int!) {
    cached_attributions(
      where: {
        attribute_id: { _eq: $attribute_id }
        combined_plant_group_id: { _eq: $plant_group_id }
      }
    ) {
      ...cachedAttributionsFields
    }
  }
`;

const queryByAttributeIdAndCultivarId = /* GraphQL */ `
  ${cachedAttributionsFields}
  query cachedAttributions($attribute_id: Int!, $cultivar_id: Int!) {
    cached_attributions(
      where: {
        attribute_id: { _eq: $attribute_id }
        combined_cultivar_id: { _eq: $cultivar_id }
      }
    ) {
      ...cachedAttributionsFields
    }
  }
`;

const queryByAttributeIdAndPlantId = /* GraphQL */ `
  ${cachedAttributionsFields}
  query cachedAttributions($attribute_id: Int!, $plant_id: Int!) {
    cached_attributions(
      where: {
        attribute_id: { _eq: $attribute_id }
        plant_id: { _eq: $plant_id }
      }
    ) {
      ...cachedAttributionsFields
    }
  }
`;

const insertLot = /* GraphQL */ `
  mutation InsertLot(
    $crossing_name: citext!
    $lot_name_segment: citext!
    $orchard_name: citext! = "Orchard 1"
  ) {
    insert_lots_one(
      object: {
        name_segment: $lot_name_segment
        crossing: { data: { name: $crossing_name } }
        orchard: { data: { name: $orchard_name } }
      }
    ) {
      id
    }
  }
`;

const insertCultivar = /* GraphQL */ `
  mutation InsertCultivar($name_segment: citext!, $lot_id: Int!) {
    insert_cultivars_one(
      object: { name_segment: $name_segment, lot_id: $lot_id }
    ) {
      id
    }
  }
`;

const insertPlantGroup = /* GraphQL */ `
  mutation InsertPlantGroup($name_segment: citext!, $cultivar_id: Int!) {
    insert_plant_groups_one(
      object: { name_segment: $name_segment, cultivar_id: $cultivar_id }
    ) {
      id
    }
  }
`;

const insertPlant = /* GraphQL */ `
  mutation InsertPlant($label_id: citext!, $plant_group_id: Int!) {
    insert_plants_one(
      object: { label_id: $label_id, plant_group_id: $plant_group_id }
    ) {
      id
    }
  }
`;

const insertAttribute = /* GraphQL */ `
  mutation InsertAttribute(
    $name: citext!
    $validation_rule: jsonb
    $data_type: attribute_data_types_enum!
    $attribute_type: attribute_types_enum!
  ) {
    insert_attributes_one(
      object: {
        name: $name
        validation_rule: $validation_rule
        data_type: $data_type
        attribute_type: $attribute_type
      }
    ) {
      id
    }
  }
`;

const insertAttributionForm = /* GraphQL */ `
  mutation InsertAttributionForm($name: citext!) {
    insert_attribution_forms_one(object: { name: $name }) {
      id
    }
  }
`;

const insertAttribution = /* GraphQL */ `
  mutation InsertAttribution(
    $author: citext!
    $date_attributed: date!
    $attribution_form_id: Int!
    $lot_id: Int
    $cultivar_id: Int
    $plant_group_id: Int
    $plant_id: Int
    $geo_location: geography
    $geo_location_accuracy: float8
  ) {
    insert_attributions_one(
      object: {
        author: $author
        date_attributed: $date_attributed
        attribution_form_id: $attribution_form_id
        lot_id: $lot_id
        cultivar_id: $cultivar_id
        plant_group_id: $plant_group_id
        plant_id: $plant_id
        geo_location: $geo_location
        geo_location_accuracy: $geo_location_accuracy
      }
    ) {
      id
    }
  }
`;

const insertAttributeValue = /* GraphQL */ `
  mutation InsertAttributeValue(
    $attribution_id: Int!
    $attribute_id: Int!
    $integer_value: Int
    $float_value: float8
    $text_value: citext
    $boolean_value: Boolean
    $date_value: date
    $text_note: String
    $photo_note: String
    $exceptional_attribution: Boolean = false
  ) {
    insert_attribution_values_one(
      object: {
        attribution_id: $attribution_id
        attribute_id: $attribute_id
        integer_value: $integer_value
        float_value: $float_value
        text_value: $text_value
        boolean_value: $boolean_value
        date_value: $date_value
        text_note: $text_note
        photo_note: $photo_note
        exceptional_attribution: $exceptional_attribution
      }
    ) {
      id
    }
  }
`;

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAll {
        delete_attribution_values(where: {}) {
          affected_rows
        }
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
        delete_attributes(where: {}) {
          affected_rows
        }
        delete_orchards(where: {}) {
          affected_rows
        }
      }
    `,
  });
});

async function insertAttributeValueWithAssociatedData({
  is_lot = false,
  is_cultivar = false,
  is_plant_group = false,
  is_plant = false,
  crossing_name = 'Cross1',
  lot_name_segment = '24A',
  plant_group_name_segment = 'A',
  cultivar_name_segment = '001',
  plant_label_id = '00000001',
  attribution_form_name = 'Form 1',
  attribute_name = 'Attribute 1',
  attribute_data_type = 'INTEGER',
  attribute_validation_rule = { min: 0, max: 100, step: 1 },
  attribute_type = 'OBSERVATION',
  attribution_author = 'Author 1',
  attribution_date_attributed = '2021-01-01',
  attribution_geo_location = { type: 'Point', coordinates: [1, 2] },
  attribution_geo_location_accuracy = 1,
  integer_value = 42,
  float_value = 42.42,
  text_value = 'Text 1',
  boolean_value = true,
  date_value = '2021-01-01',
  text_note = 'Note 1',
  photo_note = 'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
  exceptional_attribution = false,
}) {
  const objects =
    (is_lot ? 1 : 0) +
    (is_cultivar ? 1 : 0) +
    (is_plant_group ? 1 : 0) +
    (is_plant ? 1 : 0);
  if (objects !== 1) {
    throw new Error(
      'Exactly one of lot, cultivar, plant_group, plant must be true',
    );
  }

  const lot = await postOrFail({
    query: insertLot,
    variables: {
      crossing_name,
      lot_name_segment,
    },
  });

  const cultivar = await postOrFail({
    query: insertCultivar,
    variables: {
      name_segment: cultivar_name_segment,
      lot_id: lot.data.insert_lots_one.id,
    },
  });

  const plant_group = await postOrFail({
    query: insertPlantGroup,
    variables: {
      name_segment: plant_group_name_segment,
      cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  const plant = await postOrFail({
    query: insertPlant,
    variables: {
      label_id: plant_label_id,
      plant_group_id: plant_group.data.insert_plant_groups_one.id,
    },
  });

  const form = await postOrFail({
    query: insertAttributionForm,
    variables: {
      name: attribution_form_name,
    },
  });

  const attribute = await postOrFail({
    query: insertAttribute,
    variables: {
      name: attribute_name,
      validation_rule: ['INTEGER', 'FLOAT'].includes(attribute_data_type)
        ? attribute_validation_rule
        : null,
      data_type: attribute_data_type,
      attribute_type: attribute_type,
    },
  });

  const attribution = await postOrFail({
    query: insertAttribution,
    variables: {
      author: attribution_author,
      date_attributed: attribution_date_attributed,
      attribution_form_id: form.data.insert_attribution_forms_one.id,
      lot_id: is_lot ? lot.data.insert_lots_one.id : null,
      cultivar_id: is_cultivar ? cultivar.data.insert_cultivars_one.id : null,
      plant_group_id: is_plant_group
        ? plant_group.data.insert_plant_groups_one.id
        : null,
      plant_id: is_plant ? plant.data.insert_plants_one.id : null,
      geo_location: attribution_geo_location,
      geo_location_accuracy: attribution_geo_location_accuracy,
    },
  });

  const value = await postOrFail({
    query: insertAttributeValue,
    variables: {
      attribute_id: attribute.data.insert_attributes_one.id,
      attribution_id: attribution.data.insert_attributions_one.id,
      integer_value: attribute_data_type === 'INTEGER' ? integer_value : null,
      float_value: attribute_data_type === 'FLOAT' ? float_value : null,
      text_value: attribute_data_type === 'TEXT' ? text_value : null,
      boolean_value: attribute_data_type === 'BOOLEAN' ? boolean_value : null,
      date_value: attribute_data_type === 'DATE' ? date_value : null,
      text_note,
      photo_note,
      exceptional_attribution,
    },
  });

  return {
    lot_id: lot.data.insert_lots_one.id,
    cultivar_id: cultivar.data.insert_cultivars_one.id,
    plant_group_id: plant_group.data.insert_plant_groups_one.id,
    plant_id: plant.data.insert_plants_one.id,
    form_id: form.data.insert_attribution_forms_one.id,
    attribute_id: attribute.data.insert_attributes_one.id,
    attribution_id: attribution.data.insert_attributions_one.id,
    value_id: value.data.insert_attribution_values_one.id,
  };
}

describe('completenes', () => {
  test('view contains new value after update', async () => {
    const { value_id } = await insertAttributeValueWithAssociatedData({
      is_lot: true,
    });

    const { data } = await postOrFail({ query: queryAll });

    expect(data.cached_attributions).toHaveLength(1);
    expect(data.cached_attributions[0].id).toBe(value_id);
  });

  test('view contains attribution_form', async () => {
    const { form_id } = await insertAttributeValueWithAssociatedData({
      is_lot: true,
    });

    const { data } = await postOrFail({ query: queryAll });

    expect(data.cached_attributions[0].attribution_form.id).toEqual(form_id);
  });

  test('cultivar contains attributions of plant_groups', async () => {
    const { cultivar_id, plant_group_id, value_id, attribute_id } =
      await insertAttributeValueWithAssociatedData({
        is_plant_group: true,
      });

    const { data } = await postOrFail({
      query: queryByAttributeIdAndCultivarId,
      variables: {
        attribute_id: attribute_id,
        cultivar_id: cultivar_id,
      },
    });

    expect(data.cached_attributions).toHaveLength(1);
    expect(data.cached_attributions[0].id).toBe(value_id);
    expect(data.cached_attributions[0].cultivar.id).toBe(cultivar_id);
    expect(data.cached_attributions[0].plant_group.id).toBe(plant_group_id);
  });

  test('cultivar contains attributions of plants', async () => {
    const { cultivar_id, plant_id, value_id, attribute_id } =
      await insertAttributeValueWithAssociatedData({
        is_plant: true,
      });

    const { data } = await postOrFail({
      query: queryByAttributeIdAndCultivarId,
      variables: {
        attribute_id: attribute_id,
        cultivar_id: cultivar_id,
      },
    });

    expect(data.cached_attributions).toHaveLength(1);
    expect(data.cached_attributions[0].id).toBe(value_id);
    expect(data.cached_attributions[0].cultivar.id).toBe(cultivar_id);
    expect(data.cached_attributions[0].plant.id).toBe(plant_id);
  });

  test('plant_groups contains attributions of plants', async () => {
    const { plant_group_id, plant_id, value_id, attribute_id } =
      await insertAttributeValueWithAssociatedData({
        is_plant: true,
      });

    const { data } = await postOrFail({
      query: queryByAttributeIdAndPlantGroupId,
      variables: {
        attribute_id: attribute_id,
        plant_group_id: plant_group_id,
      },
    });

    expect(data.cached_attributions).toHaveLength(1);
    expect(data.cached_attributions[0].id).toBe(value_id);
    expect(data.cached_attributions[0].plant_group.id).toBe(plant_group_id);
    expect(data.cached_attributions[0].plant.id).toBe(plant_id);
  });
});

describe('correctness', () => {
  test('view lacks value after delete', async () => {
    const { value_id } = await insertAttributeValueWithAssociatedData({
      is_lot: true,
    });

    // precondition check
    const { data: precondition } = await postOrFail({ query: queryAll });
    expect(precondition.cached_attributions).toHaveLength(1);
    expect(precondition.cached_attributions[0].id).toBe(value_id);

    // act
    await postOrFail({
      query: /* GraphQL */ `
        mutation DeleteValue($value_id: Int!) {
          delete_attribution_values_by_pk(id: $value_id) {
            id
          }
        }
      `,
      variables: { value_id },
    });

    // test
    const { data } = await postOrFail({ query: queryAll });
    expect(data.cached_attributions).toHaveLength(0);
  });

  test('plant_groups do not contain cultivar attributions', async () => {
    const { plant_group_id, value_id, attribute_id } =
      await insertAttributeValueWithAssociatedData({
        is_cultivar: true,
      });

    const { data } = await postOrFail({
      query: queryByAttributeIdAndPlantGroupId,
      variables: {
        attribute_id,
        plant_group_id,
      },
    });

    expect(data.cached_attributions).toHaveLength(0);
  });

  test('plants do not contain plant_group attributions', async () => {
    const { plant_id, value_id, attribute_id } =
      await insertAttributeValueWithAssociatedData({
        is_plant_group: true,
      });

    const { data } = await postOrFail({
      query: queryByAttributeIdAndPlantId,
      variables: {
        attribute_id: attribute_id,
        plant_id: plant_id,
      },
    });

    expect(data.cached_attributions).toHaveLength(0);
  });

  test('plants do not contain cultivar attributions', async () => {
    const { plant_id, value_id, attribute_id } =
      await insertAttributeValueWithAssociatedData({
        is_cultivar: true,
      });

    //

    const { data } = await postOrFail({
      query: queryByAttributeIdAndPlantId,
      variables: {
        attribute_id: attribute_id,
        plant_id: plant_id,
      },
    });

    expect(data.cached_attributions).toHaveLength(0);
  });

  describe('non aggregated values are correct', async () => {
    test('common columns', async () => {
      const { attribute_id, value_id } =
        await insertAttributeValueWithAssociatedData({
          is_lot: true,
          attribute_name: 'Attribute 1',
          attribute_data_type: 'INTEGER',
          attribute_type: 'OBSERVATION',
          author: 'Author 1',
          date_attributed: '2021-01-01',
          geo_location: { type: 'Point', coordinates: [1, 2] },
          geo_location_accuracy: 1,
          integer_value: 42,
          text_note: 'Note 1',
          photo_note:
            'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
          exceptional_attribution: true,
        });

      const { data } = await postOrFail({ query: queryAll });

      expect(data.cached_attributions).toHaveLength(1);
      expect(data.cached_attributions[0].id).toBe(value_id);
      expect(data.cached_attributions[0].author).toBe('Author 1');
      expect(data.cached_attributions[0].date_attributed).toBe('2021-01-01');
      expect(data.cached_attributions[0].attribute_name).toBe('Attribute 1');
      expect(data.cached_attributions[0].attribute.id).toBe(attribute_id);
      expect(data.cached_attributions[0].data_type).toBe('INTEGER');
      expect(data.cached_attributions[0].text_note).toBe('Note 1');
      expect(data.cached_attributions[0].photo_note).toBe(
        'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
      );
      expect(data.cached_attributions[0].geo_location.coordinates).toEqual([
        1, 2,
      ]);
      expect(data.cached_attributions[0].geo_location_accuracy).toBe(1);
      expect(data.cached_attributions[0].exceptional_attribution).toBe(true);
      expect(data.cached_attributions[0].attribute_type).toBe('OBSERVATION');
      expect(data.cached_attributions[0].created).toMatch(iso8601dateRegex);
      expect(data.cached_attributions[0].modified).toEqual(
        data.cached_attributions[0].created,
      );
    });

    test('attribution: lot', async () => {
      const { lot_id, value_id } = await insertAttributeValueWithAssociatedData(
        {
          is_lot: true,
        },
      );

      const { data } = await postOrFail({ query: queryAll });

      expect(data.cached_attributions).toHaveLength(1);
      expect(data.cached_attributions[0].id).toBe(value_id);
      expect(data.cached_attributions[0].lot.id).toBe(lot_id);
      expect(data.cached_attributions[0].cultivar).toBeNull();
      expect(data.cached_attributions[0].plant_group).toBeNull();
      expect(data.cached_attributions[0].plant).toBeNull();
    });

    test('attribution: cultivar', async () => {
      const { cultivar_id, value_id } =
        await insertAttributeValueWithAssociatedData({
          is_cultivar: true,
        });

      const { data } = await postOrFail({ query: queryAll });

      expect(data.cached_attributions).toHaveLength(1);
      expect(data.cached_attributions[0].id).toBe(value_id);
      expect(data.cached_attributions[0].lot).toBeNull();
      expect(data.cached_attributions[0].cultivar.id).toBe(cultivar_id);
      expect(data.cached_attributions[0].plant_group).toBeNull();
      expect(data.cached_attributions[0].plant).toBeNull();
    });

    test('attribution: plant_group', async () => {
      const { plant_group_id, cultivar_id, value_id } =
        await insertAttributeValueWithAssociatedData({
          is_plant_group: true,
        });

      const { data } = await postOrFail({ query: queryAll });

      expect(data.cached_attributions).toHaveLength(1);
      expect(data.cached_attributions[0].id).toBe(value_id);
      expect(data.cached_attributions[0].lot).toBeNull();
      expect(data.cached_attributions[0].cultivar.id).toBe(cultivar_id);
      expect(data.cached_attributions[0].plant_group.id).toBe(plant_group_id);
      expect(data.cached_attributions[0].plant).toBeNull();
    });

    test('attribution: plant', async () => {
      const { plant_id, plant_group_id, cultivar_id, value_id } =
        await insertAttributeValueWithAssociatedData({
          is_plant: true,
        });

      const { data } = await postOrFail({ query: queryAll });

      expect(data.cached_attributions).toHaveLength(1);
      expect(data.cached_attributions[0].id).toBe(value_id);
      expect(data.cached_attributions[0].lot).toBeNull();
      expect(data.cached_attributions[0].cultivar.id).toBe(cultivar_id);
      expect(data.cached_attributions[0].plant_group.id).toBe(plant_group_id);
      expect(data.cached_attributions[0].plant.id).toBe(plant_id);
    });
  });

  describe('attribution_value update', () => {
    test('common columns', async () => {
      const { value_id } = await insertAttributeValueWithAssociatedData({
        is_lot: true,
        text_note: 'Note 1',
        photo_note:
          'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
        exceptional_attribution: true,
      });

      await postOrFail({
        query: /* GraphQL */ `
          mutation UpdateAttributionValue(
            $id: Int!
            $text_note: String!
            $photo_note: String!
            $exceptional_attribution: Boolean!
          ) {
            update_attribution_values_by_pk(
              pk_columns: { id: $id }
              _set: {
                text_note: $text_note
                photo_note: $photo_note
                exceptional_attribution: $exceptional_attribution
              }
            ) {
              id
            }
          }
        `,
        variables: {
          id: value_id,
          text_note: 'Updated',
          photo_note:
            '0000000000000000000000000000000000000000000000000000000000000000.jpeg',
          exceptional_attribution: false,
        },
      });

      const { data } = await postOrFail({
        query: queryById,
        variables: { id: value_id },
      });
      const updated = data.cached_attributions_by_pk;

      expect(updated.id).toBe(value_id);
      expect(updated.text_note).toBe('Updated');
      expect(updated.photo_note).toBe(
        '0000000000000000000000000000000000000000000000000000000000000000.jpeg',
      );
      expect(updated.exceptional_attribution).toBe(false);
    });

    test('integer', async () => {
      const { value_id } = await insertAttributeValueWithAssociatedData({
        is_lot: true,
        integer_value: 42,
      });

      await postOrFail({
        query: /* GraphQL */ `
          mutation UpdateAttributionValue($id: Int!, $integer_value: Int!) {
            update_attribution_values_by_pk(
              pk_columns: { id: $id }
              _set: { integer_value: $integer_value }
            ) {
              id
            }
          }
        `,
        variables: {
          id: value_id,
          integer_value: 43,
        },
      });

      const { data } = await postOrFail({
        query: queryById,
        variables: { id: value_id },
      });
      const updated = data.cached_attributions_by_pk;

      expect(updated.id).toBe(value_id);
      expect(updated.integer_value).toBe(43);
    });

    test('float', async () => {
      const { value_id } = await insertAttributeValueWithAssociatedData({
        is_lot: true,
        float_value: 42.0,
        attribute_data_type: 'FLOAT',
        attribute_validation_rule: { min: 0, max: 100, step: 0.1 },
      });

      await postOrFail({
        query: /* GraphQL */ `
          mutation UpdateAttributionValue($id: Int!, $float_value: float8!) {
            update_attribution_values_by_pk(
              pk_columns: { id: $id }
              _set: { float_value: $float_value }
            ) {
              id
            }
          }
        `,
        variables: {
          id: value_id,
          float_value: 43.0,
        },
      });

      const { data } = await postOrFail({
        query: queryById,
        variables: { id: value_id },
      });
      const updated = data.cached_attributions_by_pk;

      expect(updated.id).toBe(value_id);
      expect(updated.float_value).toBe(43.0);
    });

    test('text', async () => {
      const { value_id } = await insertAttributeValueWithAssociatedData({
        is_lot: true,
        text_value: 'Hello',
        attribute_data_type: 'TEXT',
      });

      await postOrFail({
        query: /* GraphQL */ `
          mutation UpdateAttributionValue($id: Int!, $text_value: citext!) {
            update_attribution_values_by_pk(
              pk_columns: { id: $id }
              _set: { text_value: $text_value }
            ) {
              id
            }
          }
        `,
        variables: {
          id: value_id,
          text_value: 'World',
        },
      });

      const { data } = await postOrFail({
        query: queryById,
        variables: { id: value_id },
      });
      const updated = data.cached_attributions_by_pk;

      expect(updated.id).toBe(value_id);
      expect(updated.text_value).toBe('World');
    });

    test('boolean', async () => {
      const { value_id } = await insertAttributeValueWithAssociatedData({
        is_lot: true,
        boolean_value: true,
        attribute_data_type: 'BOOLEAN',
      });

      await postOrFail({
        query: /* GraphQL */ `
          mutation UpdateAttributionValue($id: Int!, $boolean_value: Boolean!) {
            update_attribution_values_by_pk(
              pk_columns: { id: $id }
              _set: { boolean_value: $boolean_value }
            ) {
              id
            }
          }
        `,
        variables: {
          id: value_id,
          boolean_value: false,
        },
      });

      const { data } = await postOrFail({
        query: queryById,
        variables: { id: value_id },
      });
      const updated = data.cached_attributions_by_pk;

      expect(updated.id).toBe(value_id);
      expect(updated.boolean_value).toBe(false);
    });

    test('date', async () => {
      const { value_id } = await insertAttributeValueWithAssociatedData({
        is_lot: true,
        date_value: '2021-01-01',
        attribute_data_type: 'DATE',
      });

      await postOrFail({
        query: /* GraphQL */ `
          mutation UpdateAttributionValue($id: Int!, $date_value: date!) {
            update_attribution_values_by_pk(
              pk_columns: { id: $id }
              _set: { date_value: $date_value }
            ) {
              id
            }
          }
        `,
        variables: {
          id: value_id,
          date_value: '2024-01-01',
        },
      });

      const { data } = await postOrFail({
        query: queryById,
        variables: { id: value_id },
      });
      const updated = data.cached_attributions_by_pk;

      expect(updated.id).toBe(value_id);
      expect(updated.date_value).toBe('2024-01-01');
    });
  });

  test('view reflects attribute.name, .attribute_type change', async () => {
    const { attribute_id } = await insertAttributeValueWithAssociatedData({
      is_lot: true,
      attribute_name: 'Attribute 1',
      attribute_data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    });

    await postOrFail({
      query: /* GraphQL */ `
        mutation UpdateAttribute(
          $attribute_id: Int!
          $name: citext!
          $attribute_type: attribute_types_enum!
        ) {
          update_attributes_by_pk(
            pk_columns: { id: $attribute_id }
            _set: { name: $name, attribute_type: $attribute_type }
          ) {
            id
          }
        }
      `,
      variables: {
        attribute_id,
        name: 'Attribute 2',
        attribute_type: 'OTHER',
      },
    });

    const { data } = await postOrFail({ query: queryAll });

    expect(data.cached_attributions).toHaveLength(1);
    expect(data.cached_attributions[0].attribute_name).toBe('Attribute 2');
    expect(data.cached_attributions[0].attribute_type).toBe('OTHER');
  });

  test('view reflects attribution.date, .author change', async () => {
    const { attribution_id } = await insertAttributeValueWithAssociatedData({
      is_lot: true,
      attribution_author: 'Hugo',
      attribution_date_attributed: '2021-01-01',
    });

    await postOrFail({
      query: /* GraphQL */ `
        mutation UpdateAttribution(
          $attribution_id: Int!
          $author: citext!
          $date_attributed: date!
        ) {
          update_attributions_by_pk(
            pk_columns: { id: $attribution_id }
            _set: { author: $author, date_attributed: $date_attributed }
          ) {
            id
          }
        }
      `,
      variables: {
        attribution_id,
        author: 'Petra',
        date_attributed: '2024-01-01',
      },
    });

    const { data } = await postOrFail({ query: queryAll });

    expect(data.cached_attributions).toHaveLength(1);
    expect(data.cached_attributions[0].author).toBe('Petra');
    expect(data.cached_attributions[0].date_attributed).toBe('2024-01-01');
  });

  test('timestamps correspond to the attribution_value timestamps', async () => {
    const { value_id } = await insertAttributeValueWithAssociatedData({
      is_lot: true,
      attribute_data_type: 'INTEGER',
      integer_value: 42,
    });

    // wait for the timestamps to differ by at least 1ms
    await new Promise((r) => setTimeout(r, 1));

    const attribution_value = await postOrFail({
      query: /* GraphQL */ `
        mutation UpdateAttributionValue($id: Int!) {
          update_attribution_values_by_pk(
            pk_columns: { id: $id }
            _set: { integer_value: 43 }
          ) {
            id
            created
            modified
          }
        }
      `,
      variables: { id: value_id },
    });

    const { data } = await postOrFail({ query: queryAll });

    expect(data.cached_attributions[0].id).toBe(value_id);
    expect(data.cached_attributions[0].integer_value).toBe(43);
    expect(data.cached_attributions[0].created).toBe(
      attribution_value.data.update_attribution_values_by_pk.created,
    );
    expect(data.cached_attributions[0].modified).toBe(
      attribution_value.data.update_attribution_values_by_pk.modified,
    );

    const created = new Date(data.cached_attributions[0].created);
    const modified = new Date(data.cached_attributions[0].modified);
    expect(modified.getTime()).toBeGreaterThan(created.getTime());
  });

  test('combined_plant_group_id and combined_cultivar_id are updated after plant update', async () => {
    const { plant_id, plant_group_id, cultivar_id, lot_id, value_id } =
      await insertAttributeValueWithAssociatedData({
        is_plant: true,
      });

    const cultivar = await postOrFail({
      query: insertCultivar,
      variables: {
        name_segment: '002',
        lot_id,
      },
    });

    const newCultivarId = cultivar.data.insert_cultivars_one.id;

    const plant_group = await postOrFail({
      query: insertPlantGroup,
      variables: {
        name_segment: 'B',
        cultivar_id: newCultivarId,
      },
    });

    const newPlantGroupId = plant_group.data.insert_plant_groups_one.id;

    // update plant's plant group
    await postOrFail({
      query: /* GraphQL */ `
        mutation UpdatePlant($id: Int!, $plant_group_id: Int!) {
          update_plants_by_pk(
            pk_columns: { id: $id }
            _set: { plant_group_id: $plant_group_id }
          ) {
            id
          }
        }
      `,
      variables: {
        id: plant_id,
        plant_group_id: newPlantGroupId,
      },
    });

    // Fetch the updated attribution view
    const { data: updated } = await postOrFail({
      query: queryById,
      variables: {
        id: value_id,
      },
    });

    expect(updated.cached_attributions_by_pk.id).toBe(value_id);
    expect(updated.cached_attributions_by_pk.plant.id).toBe(plant_id);
    expect(updated.cached_attributions_by_pk.plant_group.id).toBe(
      newPlantGroupId,
    );
    expect(updated.cached_attributions_by_pk.plant_group.id).not.toBe(
      plant_group_id,
    );
    expect(updated.cached_attributions_by_pk.cultivar.id).toBe(newCultivarId);
    expect(updated.cached_attributions_by_pk.cultivar.id).not.toBe(cultivar_id);
  });

  test('combined_cultivar_id is updated after plant_group update', async () => {
    const { plant_id, plant_group_id, cultivar_id, lot_id, value_id } =
      await insertAttributeValueWithAssociatedData({
        is_plant_group: true,
      });

    const cultivar = await postOrFail({
      query: insertCultivar,
      variables: {
        name_segment: '002',
        lot_id,
      },
    });

    const newCultivarId = cultivar.data.insert_cultivars_one.id;

    // update plant group
    await postOrFail({
      query: /* GraphQL */ `
        mutation UpdatePlantGroup($id: Int!, $cultivar_id: Int!) {
          update_plant_groups_by_pk(
            pk_columns: { id: $id }
            _set: { cultivar_id: $cultivar_id }
          ) {
            id
          }
        }
      `,
      variables: {
        id: plant_group_id,
        cultivar_id: newCultivarId,
      },
    });

    // Fetch the updated attribution view
    const { data: updated } = await postOrFail({
      query: queryById,
      variables: {
        id: value_id,
      },
    });

    expect(updated.cached_attributions_by_pk.id).toBe(value_id);
    expect(updated.cached_attributions_by_pk.plant_group.id).toBe(
      plant_group_id,
    );
    expect(updated.cached_attributions_by_pk.cultivar.id).toBe(newCultivarId);
    expect(updated.cached_attributions_by_pk.cultivar.id).not.toBe(cultivar_id);
  });
});
