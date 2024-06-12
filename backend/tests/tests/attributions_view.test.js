import { test, expect, afterEach, describe } from 'bun:test';
import { post } from '../fetch';
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
    note
    lot {
      id
      name
    }
    cultivar {
      id
      name
    }
    tree {
      id
      label_id
      cultivar_name
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

const queryByAttributeIdAndTreeId = /* GraphQL */ `
  ${attributionsViewFields}
  query attributionsView($attribute_id: Int!, $tree_id: Int!) {
    attributions_view(
      where: {
        attribute_id: { _eq: $attribute_id }
        tree_id: { _eq: $tree_id }
      }
    ) {
      ...attributionsViewFields
    }
  }
`;

const insertLot = /* GraphQL */ `
  mutation InsertLot(
    $crossing_name: String!
    $lot_segment_name: String!
    $orchard_name: String! = "Orchard 1"
  ) {
    insert_lots_one(
      object: {
        segment_name: $lot_segment_name
        crossing: { data: { name: $crossing_name } }
        orchard: { data: { name: $orchard_name } }
      }
    ) {
      id
    }
  }
`;

const insertCultivar = /* GraphQL */ `
  mutation InsertCultivar($segment_name: String!, $lot_id: Int!) {
    insert_cultivars_one(
      object: { segment_name: $segment_name, lot_id: $lot_id }
    ) {
      id
    }
  }
`;

const insertTree = /* GraphQL */ `
  mutation InsertTree($label_id: String!, $cultivar_id: Int!) {
    insert_trees_one(
      object: { label_id: $label_id, cultivar_id: $cultivar_id }
    ) {
      id
    }
  }
`;

const insertAttribute = /* GraphQL */ `
  mutation InsertAttribute(
    $name: String!
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
  mutation InsertAttributionForm($name: String!) {
    insert_attribution_forms_one(object: { name: $name }) {
      id
    }
  }
`;

const insertAttribution = /* GraphQL */ `
  mutation InsertAttribution(
    $author: String!
    $date_attributed: date!
    $attribution_form_id: Int!
    $lot_id: Int
    $cultivar_id: Int
    $tree_id: Int
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
        tree_id: $tree_id
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
    $text_value: String
    $boolean_value: Boolean
    $date_value: date
    $note: String
    $exceptional_attribution: Boolean = false
  ) {
    insert_attribute_values_one(
      object: {
        attribution_id: $attribution_id
        attribute_id: $attribute_id
        integer_value: $integer_value
        float_value: $float_value
        text_value: $text_value
        boolean_value: $boolean_value
        date_value: $date_value
        note: $note
        exceptional_attribution: $exceptional_attribution
      }
    ) {
      id
    }
  }
`;

async function refreshattributionsView() {
  return await post({
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
  await post({
    /* GraphQL */
    query: `
      mutation DeleteAll {
        delete_attribute_values(where: {}) {
          affected_rows
        }
        delete_attributions(where: {}) {
          affected_rows
        }
        delete_attribution_forms(where: {}) {
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
        delete_attributes(where: {}) {
          affected_rows
        }
        delete_orchards(where: {}) {
          affected_rows
        }
      }`,
  });
});

async function insert_attribute_value_with_associated_data({
  is_lot = false,
  is_cultivar = false,
  is_tree = false,
  crossing_name = 'Cross1',
  lot_segment_name = '24A',
  cultivar_segment_name = '001',
  tree_label_id = '00000001',
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
  note = 'Note 1',
  exceptional_attribution = false,
}) {
  const objects = (is_lot ? 1 : 0) + (is_cultivar ? 1 : 0) + (is_tree ? 1 : 0);
  if (objects !== 1) {
    throw new Error('Exactly one of lot, cultivar, tree must be true');
  }

  const lot = await post({
    query: insertLot,
    variables: {
      crossing_name,
      lot_segment_name,
    },
  });

  const cultivar = await post({
    query: insertCultivar,
    variables: {
      segment_name: cultivar_segment_name,
      lot_id: lot.data.insert_lots_one.id,
    },
  });

  const tree = await post({
    query: insertTree,
    variables: {
      label_id: tree_label_id,
      cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  const form = await post({
    query: insertAttributionForm,
    variables: {
      name: attribution_form_name,
    },
  });

  const attribute = await post({
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

  const attribution = await post({
    query: insertAttribution,
    variables: {
      author: attribution_author,
      date_attributed: attribution_date_attributed,
      attribution_form_id: form.data.insert_attribution_forms_one.id,
      lot_id: is_lot ? lot.data.insert_lots_one.id : null,
      cultivar_id: is_cultivar ? cultivar.data.insert_cultivars_one.id : null,
      tree_id: is_tree ? tree.data.insert_trees_one.id : null,
      geo_location: attribution_geo_location,
      geo_location_accuracy: attribution_geo_location_accuracy,
    },
  });

  const value = await post({
    query: insertAttributeValue,
    variables: {
      attribute_id: attribute.data.insert_attributes_one.id,
      attribution_id: attribution.data.insert_attributions_one.id,
      integer_value: attribute_data_type === 'INTEGER' ? integer_value : null,
      float_value: attribute_data_type === 'FLOAT' ? float_value : null,
      text_value: attribute_data_type === 'TEXT' ? text_value : null,
      boolean_value: attribute_data_type === 'BOOLEAN' ? boolean_value : null,
      date_value: attribute_data_type === 'DATE' ? date_value : null,
      note,
      exceptional_attribution,
    },
  });

  return {
    lot_id: lot.data.insert_lots_one.id,
    cultivar_id: cultivar.data.insert_cultivars_one.id,
    tree_id: tree.data.insert_trees_one.id,
    form_id: form.data.insert_attribution_forms_one.id,
    attribute_id: attribute.data.insert_attributes_one.id,
    attribution_id: attribution.data.insert_attributions_one.id,
    value_id: value.data.insert_attribute_values_one.id,
  };
}

test('view contains new value after update', async () => {
  const { value_id } = await insert_attribute_value_with_associated_data({
    is_lot: true,
  });

  await refreshattributionsView();

  const { data } = await post({ query: queryAll });

  expect(data.attributions_view).toHaveLength(1);
  expect(data.attributions_view[0].id).toBe(value_id);
});

describe('non aggregated values are correct', async () => {
  test('common columns', async () => {
    const { attribute_id, value_id } =
      await insert_attribute_value_with_associated_data({
        is_lot: true,
        attribute_name: 'Attribute 1',
        attribute_data_type: 'INTEGER',
        attribute_type: 'OBSERVATION',
        author: 'Author 1',
        date_attributed: '2021-01-01',
        geo_location: { type: 'Point', coordinates: [1, 2] },
        geo_location_accuracy: 1,
        integer_value: 42,
        note: 'Note 1',
        exceptional_attribution: true,
      });

    await refreshattributionsView();

    const { data } = await post({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].author).toBe('Author 1');
    expect(data.attributions_view[0].date_attributed).toBe('2021-01-01');
    expect(data.attributions_view[0].attribute_name).toBe('Attribute 1');
    expect(data.attributions_view[0].attribute.id).toBe(attribute_id);
    expect(data.attributions_view[0].data_type).toBe('INTEGER');
    expect(data.attributions_view[0].note).toBe('Note 1');
    expect(data.attributions_view[0].geo_location.coordinates).toEqual([1, 2]);
    expect(data.attributions_view[0].geo_location_accuracy).toBe(1);
    expect(data.attributions_view[0].exceptional_attribution).toBe(true);
    expect(data.attributions_view[0].attribute_type).toBe('OBSERVATION');
    expect(data.attributions_view[0].created).toMatch(iso8601dateRegex);
    expect(data.attributions_view[0].modified).toBeNull();
  });

  test('attribution: lot', async () => {
    const { lot_id, value_id } =
      await insert_attribute_value_with_associated_data({
        is_lot: true,
      });

    await refreshattributionsView();

    const { data } = await post({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].lot.id).toBe(lot_id);
    expect(data.attributions_view[0].cultivar).toBeNull();
    expect(data.attributions_view[0].tree).toBeNull();
  });

  test('attribution: cultivar', async () => {
    const { cultivar_id, value_id } =
      await insert_attribute_value_with_associated_data({
        is_cultivar: true,
      });

    await refreshattributionsView();

    const { data } = await post({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].lot).toBeNull();
    expect(data.attributions_view[0].cultivar.id).toBe(cultivar_id);
    expect(data.attributions_view[0].tree).toBeNull();
  });

  test('attribution: tree', async () => {
    const { tree_id, cultivar_id, value_id } =
      await insert_attribute_value_with_associated_data({
        is_tree: true,
      });

    await refreshattributionsView();

    const { data } = await post({ query: queryAll });

    expect(data.attributions_view).toHaveLength(1);
    expect(data.attributions_view[0].id).toBe(value_id);
    expect(data.attributions_view[0].lot).toBeNull();
    expect(data.attributions_view[0].cultivar.id).toBe(cultivar_id);
    expect(data.attributions_view[0].tree.id).toBe(tree_id);
  });
});

test('cultivar contains attributions of trees', async () => {
  const { cultivar_id, tree_id, value_id, attribute_id } =
    await insert_attribute_value_with_associated_data({
      is_tree: true,
    });

  await refreshattributionsView();

  const { data } = await post({
    query: queryByAttributeIdAndCultivarId,
    variables: {
      attribute_id: attribute_id,
      cultivar_id: cultivar_id,
    },
  });

  expect(data.attributions_view).toHaveLength(1);
  expect(data.attributions_view[0].id).toBe(value_id);
  expect(data.attributions_view[0].cultivar.id).toBe(cultivar_id);
  expect(data.attributions_view[0].tree.id).toBe(tree_id);
});

test('trees do not contain cultivar attributions', async () => {
  const { tree_id, value_id, attribute_id } =
    await insert_attribute_value_with_associated_data({
      is_cultivar: true,
    });

  await refreshattributionsView();

  const { data } = await post({
    query: queryByAttributeIdAndTreeId,
    variables: {
      attribute_id: attribute_id,
      tree_id: tree_id,
    },
  });

  expect(data.attributions_view).toHaveLength(0);
});
