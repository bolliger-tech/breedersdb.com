import { test, expect, afterEach, describe } from 'bun:test';
import { postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const attributionsViewFields = /* GraphQL */ `
  fragment attributionsViewFields on attributions_view {
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
  ${attributionsViewFields}
  query attributionsView {
    attributions_view {
      ...attributionsViewFields
    }
  }
`;

const queryByAttributeId = /* GraphQL */ `
  ${attributionsViewFields}
  query attributionsView($attribute_id: Int!) {
    attributions_view(where: { attribute_id: { _eq: $attribute_id } }) {
      ...attributionsViewFields
    }
  }
`;

const queryByAttributeIdAndLotId = /* GraphQL */ `
  ${attributionsViewFields}
  query attributionsView($attribute_id: Int!, $lot_id: Int!) {
    attributions_view(
      where: { attribute_id: { _eq: $attribute_id }, lot_id: { _eq: $lot_id } }
    ) {
      ...attributionsViewFields
    }
  }
`;

const queryByAttributeIdAndPlantGroupId = /* GraphQL */ `
  ${attributionsViewFields}
  query attributionsView($attribute_id: Int!, $plant_group_id: Int!) {
    attributions_view(
      where: {
        attribute_id: { _eq: $attribute_id }
        combined_plant_group_id: { _eq: $plant_group_id }
      }
    ) {
      ...attributionsViewFields
    }
  }
`;

const queryByAttributeIdAndCultivarId = /* GraphQL */ `
  ${attributionsViewFields}
  query attributionsView($attribute_id: Int!, $cultivar_id: Int!) {
    attributions_view(
      where: {
        attribute_id: { _eq: $attribute_id }
        combined_cultivar_id: { _eq: $cultivar_id }
      }
    ) {
      ...attributionsViewFields
    }
  }
`;

const queryByAttributeIdAndPlantId = /* GraphQL */ `
  ${attributionsViewFields}
  query attributionsView($attribute_id: Int!, $plant_id: Int!) {
    attributions_view(
      where: {
        attribute_id: { _eq: $attribute_id }
        plant_id: { _eq: $plant_id }
      }
    ) {
      ...attributionsViewFields
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

async function refreshattributionsView() {
  return await postOrFail({
    /* GraphQL */
    query: `
      mutation RefreshattributionsView {
        refresh_attributions_view {
          id
          last_check
          last_change
        }
      }`,
  });
}

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

test('view contains new value after update', async () => {
  const { value_id } = await insertAttributeValueWithAssociatedData({
    is_lot: true,
  });

  await refreshattributionsView();

  const { data } = await postOrFail({ query: queryAll });

  expect(data.attributions_view).toHaveLength(1);
  expect(data.attributions_view[0].id).toBe(value_id);
});

test('view contains attribution_form', async () => {
  const { form_id } = await insertAttributeValueWithAssociatedData({
    is_lot: true,
  });

  await refreshattributionsView();

  const { data } = await postOrFail({ query: queryAll });

  expect(data.attributions_view[0].attribution_form.id).toEqual(form_id);
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

    await refreshattributionsView();

    const { data } = await postOrFail({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].author).toBe('Author 1');
    expect(data.attributions_view[0].date_attributed).toBe('2021-01-01');
    expect(data.attributions_view[0].attribute_name).toBe('Attribute 1');
    expect(data.attributions_view[0].attribute.id).toBe(attribute_id);
    expect(data.attributions_view[0].data_type).toBe('INTEGER');
    expect(data.attributions_view[0].text_note).toBe('Note 1');
    expect(data.attributions_view[0].photo_note).toBe(
      'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
    );
    expect(data.attributions_view[0].geo_location.coordinates).toEqual([1, 2]);
    expect(data.attributions_view[0].geo_location_accuracy).toBe(1);
    expect(data.attributions_view[0].exceptional_attribution).toBe(true);
    expect(data.attributions_view[0].attribute_type).toBe('OBSERVATION');
    expect(data.attributions_view[0].created).toMatch(iso8601dateRegex);
    expect(data.attributions_view[0].modified).toEqual(
      data.attributions_view[0].created,
    );
  });

  test('attribution: lot', async () => {
    const { lot_id, value_id } = await insertAttributeValueWithAssociatedData({
      is_lot: true,
    });

    await refreshattributionsView();

    const { data } = await postOrFail({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].lot.id).toBe(lot_id);
    expect(data.attributions_view[0].cultivar).toBeNull();
    expect(data.attributions_view[0].plant_group).toBeNull();
    expect(data.attributions_view[0].plant).toBeNull();
  });

  test('attribution: cultivar', async () => {
    const { cultivar_id, value_id } =
      await insertAttributeValueWithAssociatedData({
        is_cultivar: true,
      });

    await refreshattributionsView();

    const { data } = await postOrFail({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].lot).toBeNull();
    expect(data.attributions_view[0].cultivar.id).toBe(cultivar_id);
    expect(data.attributions_view[0].plant_group).toBeNull();
    expect(data.attributions_view[0].plant).toBeNull();
  });

  test('attribution: plant_group', async () => {
    const { plant_group_id, cultivar_id, value_id } =
      await insertAttributeValueWithAssociatedData({
        is_plant_group: true,
      });

    await refreshattributionsView();

    const { data } = await postOrFail({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].lot).toBeNull();
    expect(data.attributions_view[0].cultivar.id).toBe(cultivar_id);
    expect(data.attributions_view[0].plant_group.id).toBe(plant_group_id);
    expect(data.attributions_view[0].plant).toBeNull();
  });

  test('attribution: plant', async () => {
    const { plant_id, plant_group_id, cultivar_id, value_id } =
      await insertAttributeValueWithAssociatedData({
        is_plant: true,
      });

    await refreshattributionsView();

    const { data } = await postOrFail({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].lot).toBeNull();
    expect(data.attributions_view[0].cultivar.id).toBe(cultivar_id);
    expect(data.attributions_view[0].plant_group.id).toBe(plant_group_id);
    expect(data.attributions_view[0].plant.id).toBe(plant_id);
  });
});

test('cultivar contains attributions of plant_groups', async () => {
  const { cultivar_id, plant_group_id, value_id, attribute_id } =
    await insertAttributeValueWithAssociatedData({
      is_plant_group: true,
    });

  await refreshattributionsView();

  const { data } = await postOrFail({
    query: queryByAttributeIdAndCultivarId,
    variables: {
      attribute_id: attribute_id,
      cultivar_id: cultivar_id,
    },
  });

  expect(data.attributions_view).toHaveLength(1);
  expect(data.attributions_view[0].id).toBe(value_id);
  expect(data.attributions_view[0].cultivar.id).toBe(cultivar_id);
  expect(data.attributions_view[0].plant_group.id).toBe(plant_group_id);
});

test('cultivar contains attributions of plants', async () => {
  const { cultivar_id, plant_id, value_id, attribute_id } =
    await insertAttributeValueWithAssociatedData({
      is_plant: true,
    });

  await refreshattributionsView();

  const { data } = await postOrFail({
    query: queryByAttributeIdAndCultivarId,
    variables: {
      attribute_id: attribute_id,
      cultivar_id: cultivar_id,
    },
  });

  expect(data.attributions_view).toHaveLength(1);
  expect(data.attributions_view[0].id).toBe(value_id);
  expect(data.attributions_view[0].cultivar.id).toBe(cultivar_id);
  expect(data.attributions_view[0].plant.id).toBe(plant_id);
});

test('plant_groups contains attributions of plants', async () => {
  const { plant_group_id, plant_id, value_id, attribute_id } =
    await insertAttributeValueWithAssociatedData({
      is_plant: true,
    });

  await refreshattributionsView();

  const { data } = await postOrFail({
    query: queryByAttributeIdAndPlantGroupId,
    variables: {
      attribute_id: attribute_id,
      plant_group_id: plant_group_id,
    },
  });

  expect(data.attributions_view).toHaveLength(1);
  expect(data.attributions_view[0].id).toBe(value_id);
  expect(data.attributions_view[0].plant_group.id).toBe(plant_group_id);
  expect(data.attributions_view[0].plant.id).toBe(plant_id);
});

test('plant_groups do not contain cultivar attributions', async () => {
  const { plant_group_id, value_id, attribute_id } =
    await insertAttributeValueWithAssociatedData({
      is_cultivar: true,
    });

  await refreshattributionsView();

  const { data } = await postOrFail({
    query: queryByAttributeIdAndPlantGroupId,
    variables: {
      attribute_id,
      plant_group_id,
    },
  });

  expect(data.attributions_view).toHaveLength(0);
});

test('plants do not contain plant_group attributions', async () => {
  const { plant_id, value_id, attribute_id } =
    await insertAttributeValueWithAssociatedData({
      is_plant_group: true,
    });

  await refreshattributionsView();

  const { data } = await postOrFail({
    query: queryByAttributeIdAndPlantId,
    variables: {
      attribute_id: attribute_id,
      plant_id: plant_id,
    },
  });

  expect(data.attributions_view).toHaveLength(0);
});

test('plants do not contain cultivar attributions', async () => {
  const { plant_id, value_id, attribute_id } =
    await insertAttributeValueWithAssociatedData({
      is_cultivar: true,
    });

  await refreshattributionsView();

  const { data } = await postOrFail({
    query: queryByAttributeIdAndPlantId,
    variables: {
      attribute_id: attribute_id,
      plant_id: plant_id,
    },
  });

  expect(data.attributions_view).toHaveLength(0);
});
