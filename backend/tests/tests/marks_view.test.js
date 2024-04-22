import { test, expect, afterEach, describe } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const marksViewFields = /* GraphQL */ `
  fragment MarksViewFields on marks_view {
    id
    author
    date_marked
    integer_value
    float_value
    text_value
    boolean_value
    date_value
    mark_attribute_name
    mark_attribute {
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
      publicid
      cultivar_name
    }
    geo_location
    geo_location_accuracy
    exceptional_mark
    attribute_type
    created
    modified
  }
`;

const queryAll = /* GraphQL */ `
  ${marksViewFields}
  query MarksView {
    marks_view {
      ...MarksViewFields
    }
  }
`;

const queryByAttributeId = /* GraphQL */ `
  ${marksViewFields}
  query MarksView($mark_attribute_id: Int!) {
    marks_view(where: { mark_attribute_id: { _eq: $mark_attribute_id } }) {
      ...MarksViewFields
    }
  }
`;

const queryByAttributeIdAndLotId = /* GraphQL */ `
  ${marksViewFields}
  query MarksView($mark_attribute_id: Int!, $lot_id: Int!) {
    marks_view(
      where: {
        mark_attribute_id: { _eq: $mark_attribute_id }
        lot_id: { _eq: $lot_id }
      }
    ) {
      ...MarksViewFields
    }
  }
`;

const queryByAttributeIdAndCultivarId = /* GraphQL */ `
  ${marksViewFields}
  query MarksView($mark_attribute_id: Int!, $cultivar_id: Int!) {
    marks_view(
      where: {
        mark_attribute_id: { _eq: $mark_attribute_id }
        combined_cultivar_id: { _eq: $cultivar_id }
      }
    ) {
      ...MarksViewFields
    }
  }
`;

const queryByAttributeIdAndTreeId = /* GraphQL */ `
  ${marksViewFields}
  query MarksView($mark_attribute_id: Int!, $tree_id: Int!) {
    marks_view(
      where: {
        mark_attribute_id: { _eq: $mark_attribute_id }
        tree_id: { _eq: $tree_id }
      }
    ) {
      ...MarksViewFields
    }
  }
`;

const insertLot = /* GraphQL */ `
  mutation InsertLot($crossing_name: String!, $lot_name_segment: String!) {
    insert_lots_one(
      object: {
        name_segment: $lot_name_segment
        crossing: { data: { name: $crossing_name } }
      }
    ) {
      id
    }
  }
`;

const insertCultivar = /* GraphQL */ `
  mutation InsertCultivar($name_segment: String!, $lot_id: Int!) {
    insert_cultivars_one(
      object: { name_segment: $name_segment, lot_id: $lot_id }
    ) {
      id
    }
  }
`;

const insertTree = /* GraphQL */ `
  mutation InsertTree($publicid: String!, $cultivar_id: Int!) {
    insert_trees_one(
      object: { publicid: $publicid, cultivar_id: $cultivar_id }
    ) {
      id
    }
  }
`;

const insertMarkAttribute = /* GraphQL */ `
  mutation InsertMarkAttribute(
    $name: String!
    $validation_rule: jsonb
    $data_type: attribute_data_types_enum!
    $attribute_type: attribute_types_enum!
  ) {
    insert_mark_attributes_one(
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

const insertMarkForm = /* GraphQL */ `
  mutation InsertMarkForm($name: String!) {
    insert_attribution_forms_one(object: { name: $name }) {
      id
    }
  }
`;

const insertMark = /* GraphQL */ `
  mutation InsertMark(
    $author: String!
    $date_marked: date!
    $attribution_form_id: Int!
    $lot_id: Int
    $cultivar_id: Int
    $tree_id: Int
    $geo_location: geography
    $geo_location_accuracy: float8
  ) {
    insert_marks_one(
      object: {
        author: $author
        date_marked: $date_marked
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

const insertMarkValue = /* GraphQL */ `
  mutation InsertMarkValue(
    $mark_id: Int!
    $mark_attribute_id: Int!
    $integer_value: Int
    $float_value: float8
    $text_value: String
    $boolean_value: Boolean
    $date_value: date
    $note: String
    $exceptional_mark: Boolean = false
  ) {
    insert_attribute_values_one(
      object: {
        mark_id: $mark_id
        mark_attribute_id: $mark_attribute_id
        integer_value: $integer_value
        float_value: $float_value
        text_value: $text_value
        boolean_value: $boolean_value
        date_value: $date_value
        note: $note
        exceptional_mark: $exceptional_mark
      }
    ) {
      id
    }
  }
`;

async function refreshMarksView() {
  return await post({
    /* GraphQL */
    query: `
      mutation RefreshMarksView {
        refresh_marks_view {
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
        delete_marks(where: {}) {
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
        delete_mark_attributes(where: {}) {
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
  lot_name_segment = '24A',
  cultivar_name_segment = '001',
  tree_publicid = '00000001',
  attribution_form_name = 'Form 1',
  mark_attribute_name = 'Attribute 1',
  attribute_data_type = 'INTEGER',
  mark_attribute_validation_rule = { min: 0, max: 100, step: 1 },
  attribute_type = 'OBSERVATION',
  mark_author = 'Author 1',
  mark_date_marked = '2021-01-01',
  mark_geo_location = { type: 'Point', coordinates: [1, 2] },
  mark_geo_location_accuracy = 1,
  integer_value = 42,
  float_value = 42.42,
  text_value = 'Text 1',
  boolean_value = true,
  date_value = '2021-01-01',
  note = 'Note 1',
  exceptional_mark = false,
}) {
  const objects = (is_lot ? 1 : 0) + (is_cultivar ? 1 : 0) + (is_tree ? 1 : 0);
  if (objects !== 1) {
    throw new Error('Exactly one of lot, cultivar, tree must be true');
  }

  const lot = await post({
    query: insertLot,
    variables: {
      crossing_name,
      lot_name_segment,
    },
  });

  const cultivar = await post({
    query: insertCultivar,
    variables: {
      name_segment: cultivar_name_segment,
      lot_id: lot.data.insert_lots_one.id,
    },
  });

  const tree = await post({
    query: insertTree,
    variables: {
      publicid: tree_publicid,
      cultivar_id: cultivar.data.insert_cultivars_one.id,
    },
  });

  const form = await post({
    query: insertMarkForm,
    variables: {
      name: attribution_form_name,
    },
  });

  const attribute = await post({
    query: insertMarkAttribute,
    variables: {
      name: mark_attribute_name,
      validation_rule: ['INTEGER', 'FLOAT'].includes(attribute_data_type)
        ? mark_attribute_validation_rule
        : null,
      data_type: attribute_data_type,
      attribute_type: attribute_type,
    },
  });

  const mark = await post({
    query: insertMark,
    variables: {
      author: mark_author,
      date_marked: mark_date_marked,
      attribution_form_id: form.data.insert_attribution_forms_one.id,
      lot_id: is_lot ? lot.data.insert_lots_one.id : null,
      cultivar_id: is_cultivar ? cultivar.data.insert_cultivars_one.id : null,
      tree_id: is_tree ? tree.data.insert_trees_one.id : null,
      geo_location: mark_geo_location,
      geo_location_accuracy: mark_geo_location_accuracy,
    },
  });

  const value = await post({
    query: insertMarkValue,
    variables: {
      mark_attribute_id: attribute.data.insert_mark_attributes_one.id,
      mark_id: mark.data.insert_marks_one.id,
      integer_value: attribute_data_type === 'INTEGER' ? integer_value : null,
      float_value: attribute_data_type === 'FLOAT' ? float_value : null,
      text_value: attribute_data_type === 'TEXT' ? text_value : null,
      boolean_value: attribute_data_type === 'BOOLEAN' ? boolean_value : null,
      date_value: attribute_data_type === 'DATE' ? date_value : null,
      note,
      exceptional_mark,
    },
  });

  return {
    lot_id: lot.data.insert_lots_one.id,
    cultivar_id: cultivar.data.insert_cultivars_one.id,
    tree_id: tree.data.insert_trees_one.id,
    form_id: form.data.insert_attribution_forms_one.id,
    attribute_id: attribute.data.insert_mark_attributes_one.id,
    mark_id: mark.data.insert_marks_one.id,
    value_id: value.data.insert_attribute_values_one.id,
  };
}

test('view contains new value after update', async () => {
  const { value_id } = await insert_attribute_value_with_associated_data({
    is_lot: true,
  });

  await refreshMarksView();

  const { data } = await post({ query: queryAll });

  expect(data.marks_view).toHaveLength(1);
  expect(data.marks_view[0].id).toBe(value_id);
});

describe('non aggregated values are correct', async () => {
  test('common columns', async () => {
    const { attribute_id, value_id } =
      await insert_attribute_value_with_associated_data({
        is_lot: true,
        mark_attribute_name: 'Attribute 1',
        attribute_data_type: 'INTEGER',
        attribute_type: 'OBSERVATION',
        author: 'Author 1',
        date_marked: '2021-01-01',
        geo_location: { type: 'Point', coordinates: [1, 2] },
        geo_location_accuracy: 1,
        integer_value: 42,
        note: 'Note 1',
        exceptional_mark: true,
      });

    await refreshMarksView();

    const { data } = await post({ query: queryAll });

    expect(data.marks_view).toHaveLength(1);
    expect(data.marks_view[0].id).toBe(value_id);
    expect(data.marks_view[0].author).toBe('Author 1');
    expect(data.marks_view[0].date_marked).toBe('2021-01-01');
    expect(data.marks_view[0].mark_attribute_name).toBe('Attribute 1');
    expect(data.marks_view[0].mark_attribute.id).toBe(attribute_id);
    expect(data.marks_view[0].data_type).toBe('INTEGER');
    expect(data.marks_view[0].note).toBe('Note 1');
    expect(data.marks_view[0].geo_location.coordinates).toEqual([1, 2]);
    expect(data.marks_view[0].geo_location_accuracy).toBe(1);
    expect(data.marks_view[0].exceptional_mark).toBe(true);
    expect(data.marks_view[0].attribute_type).toBe('OBSERVATION');
    expect(data.marks_view[0].created).toMatch(iso8601dateRegex);
    expect(data.marks_view[0].modified).toBeNull();
  });

  test('mark: lot', async () => {
    const { lot_id, value_id } =
      await insert_attribute_value_with_associated_data({
        is_lot: true,
      });

    await refreshMarksView();

    const { data } = await post({ query: queryAll });

    expect(data.marks_view).toHaveLength(1);
    expect(data.marks_view[0].id).toBe(value_id);
    expect(data.marks_view[0].lot.id).toBe(lot_id);
    expect(data.marks_view[0].cultivar).toBeNull();
    expect(data.marks_view[0].tree).toBeNull();
  });

  test('mark: cultivar', async () => {
    const { cultivar_id, value_id } =
      await insert_attribute_value_with_associated_data({
        is_cultivar: true,
      });

    await refreshMarksView();

    const { data } = await post({ query: queryAll });

    expect(data.marks_view).toHaveLength(1);
    expect(data.marks_view[0].id).toBe(value_id);
    expect(data.marks_view[0].lot).toBeNull();
    expect(data.marks_view[0].cultivar.id).toBe(cultivar_id);
    expect(data.marks_view[0].tree).toBeNull();
  });

  test('mark: tree', async () => {
    const { tree_id, cultivar_id, value_id } =
      await insert_attribute_value_with_associated_data({
        is_tree: true,
      });

    await refreshMarksView();

    const { data } = await post({ query: queryAll });

    expect(data.marks_view).toHaveLength(1);
    expect(data.marks_view[0].id).toBe(value_id);
    expect(data.marks_view[0].lot).toBeNull();
    expect(data.marks_view[0].cultivar.id).toBe(cultivar_id);
    expect(data.marks_view[0].tree.id).toBe(tree_id);
  });
});

test('cultivar contains marks of trees', async () => {
  const { cultivar_id, tree_id, value_id, attribute_id } =
    await insert_attribute_value_with_associated_data({
      is_tree: true,
    });

  await refreshMarksView();

  const { data } = await post({
    query: queryByAttributeIdAndCultivarId,
    variables: {
      mark_attribute_id: attribute_id,
      cultivar_id: cultivar_id,
    },
  });

  expect(data.marks_view).toHaveLength(1);
  expect(data.marks_view[0].id).toBe(value_id);
  expect(data.marks_view[0].cultivar.id).toBe(cultivar_id);
  expect(data.marks_view[0].tree.id).toBe(tree_id);
});

test('trees do not contain cultivar marks', async () => {
  const { tree_id, value_id, attribute_id } =
    await insert_attribute_value_with_associated_data({
      is_cultivar: true,
    });

  await refreshMarksView();

  const { data } = await post({
    query: queryByAttributeIdAndTreeId,
    variables: {
      mark_attribute_id: attribute_id,
      tree_id: tree_id,
    },
  });

  expect(data.marks_view).toHaveLength(0);
});
