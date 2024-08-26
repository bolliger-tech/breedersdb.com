import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertAttribute(
    $name: citext
    $validation_rule: jsonb
    $data_type: attribute_data_types_enum
    $description: String
    $attribute_type: attribute_types_enum
    $legend: jsonb
    $default_value: jsonb
  ) {
    insert_attributes_one(
      object: {
        name: $name
        validation_rule: $validation_rule
        data_type: $data_type
        description: $description
        attribute_type: $attribute_type
        disabled: false
        legend: $legend
        default_value: $default_value
      }
    ) {
      id
      name
      validation_rule
      data_type
      description
      attribute_type
      disabled
      created
      modified
      legend
      default_value
    }
  }
`;

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllAttributes {
        delete_attribution_values(where: {}) {
          affected_rows
        }
        delete_attributions(where: {}) {
          affected_rows
        }
        delete_attribution_forms(where: {}) {
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

test('insert', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      description: 'Description 1',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attributes_one.name).toBe('Attribution Attribute 1');
  expect(resp.data.insert_attributes_one.validation_rule).toMatchObject({
    max: '9',
    min: '1',
    step: '1',
  });
  expect(resp.data.insert_attributes_one.data_type).toBe('INTEGER');
  expect(resp.data.insert_attributes_one.description).toBe('Description 1');
  expect(resp.data.insert_attributes_one.attribute_type).toBe('OBSERVATION');
  expect(resp.data.insert_attributes_one.disabled).toBe(false);
  expect(resp.data.insert_attributes_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_attributes_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'attribution attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp1.data.insert_attributes_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('empty validation rule is valid for TEXT', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: null,
      data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('validation rule is empty for TEXT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 1, step: 1 },
      data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The validation rule must be NULL for TEXT, BOOLEAN, DATE and PHOTO.',
  );
});

test('validation rule is empty for BOOLEAN', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 1, step: 1 },
      data_type: 'BOOLEAN',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The validation rule must be NULL for TEXT, BOOLEAN, DATE and PHOTO.',
  );
});

test('validation rule is empty for DATE', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 1, step: 1 },
      data_type: 'DATE',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The validation rule must be NULL for TEXT, BOOLEAN, DATE and PHOTO.',
  );
});

test('validation rule is empty for PHOTO', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 1, step: 1 },
      data_type: 'PHOTO',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The validation rule must be NULL for TEXT, BOOLEAN, DATE and PHOTO.',
  );
});

test('validation rule contains integers for INTEGER', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: -1, step: 1 },
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('validation rule contains no floats for INTEGER', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 1, step: 0.1 },
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'For INTEGER and RATING the validation rule must contain min, max and step keys with integer values.',
  );
});

test('validation rule contains min, max, step for INTEGER', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 1 },
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'For INTEGER, RATING and FLOAT the validation rule must contain min, max and step keys with number values.',
  );
});

test('validation rule contains integers for RATING', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 0, step: 1 },
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('validation rule contains no floats for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 0, step: 0.1 },
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'For INTEGER and RATING the validation rule must contain min, max and step keys with integer values.',
  );
});

test('validation rule contains min, max, step for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 1 },
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'For INTEGER, RATING and FLOAT the validation rule must contain min, max and step keys with number values.',
  );
});

test('validation rule min must not be smaller than 0 for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: -1, step: 1 },
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The minimum value must be between 0 and 9.',
  );
});

test('validation rule max must not be greater than 9 for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 10, min: 0, step: 1 },
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The maximum value must be between 0 and 9.',
  );
});

test('validation rule step must be 1 for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 0, step: 2 },
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The step value must be 1.',
  );
});

test('validation rule min must not be greater than max for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 0, min: 1, step: 1 },
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The minimum value must be less than or equal to the maximum value.',
  );
});

test('validation rule min can be equal to max for RATING', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 1, min: 1, step: 1 },
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('validation rule contains numbers for FLOAT', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 10, min: -0.5, step: 0.001 },
      data_type: 'FLOAT',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('validation rule contains only numbers for FLOAT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 'NaN', step: 0.1 },
      data_type: 'FLOAT',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'For FLOAT the validation rule must contain min, max and step keys with number values.',
  );
});

test('validation rule contains min, max, step for FLOAT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: 9, min: 1 },
      data_type: 'FLOAT',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'For INTEGER, RATING and FLOAT the validation rule must contain min, max and step keys with number values.',
  );
});

test('data type is immutable after insert of attribution_values', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: null,
      data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
    },
  });

  await postOrFail({
    query: /* GraphQL */ `
      mutation InsertAttributeValue($attribute_id: Int!) {
        insert_attribution_values_one(
          object: {
            attribute_id: $attribute_id
            attribution: {
              data: {
                author: "Author 1"
                date_attributed: "2021-01-01"
                attribution_form: { data: { name: "Attribution Form 1" } }
                lot: {
                  data: {
                    name_segment: "24A"
                    crossing: { data: { name: "Cross1" } }
                    orchard: { data: { name: "Orchard1" } }
                  }
                }
              }
            }
            text_value: "Value 1"
          }
        ) {
          id
        }
      }
    `,
    variables: { attribute_id: resp.data.insert_attributes_one.id },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateAttribute(
        $id: Int!
        $data_type: attribute_data_types_enum
      ) {
        update_attributes_by_pk(
          pk_columns: { id: $id }
          _set: { data_type: $data_type }
        ) {
          id
          data_type
        }
      }
    `,
    variables: {
      id: resp.data.insert_attributes_one.id,
      data_type: 'PHOTO',
    },
  });

  expect(updated.errors[0].extensions.internal.error.message).toBe(
    'The data type of an attribution attribute cannot be changed once an attribution value has been inserted.',
  );
});

test("immutability of data type doesn't block other changes", async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: null,
      data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
    },
  });

  await postOrFail({
    query: /* GraphQL */ `
      mutation InsertAttributeValue($attribute_id: Int!) {
        insert_attribution_values_one(
          object: {
            attribute_id: $attribute_id
            attribution: {
              data: {
                author: "Author 1"
                date_attributed: "2021-01-01"
                attribution_form: { data: { name: "Attribution Form 1" } }
                lot: {
                  data: {
                    name_segment: "24A"
                    crossing: { data: { name: "Cross1" } }
                    orchard: { data: { name: "Orchard1" } }
                  }
                }
              }
            }
            text_value: "Value 1"
          }
        ) {
          id
        }
      }
    `,
    variables: { attribute_id: resp.data.insert_attributes_one.id },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateAttribute(
        $id: Int!
        $name: citext!
        $data_type: attribute_data_types_enum
      ) {
        update_attributes_by_pk(
          pk_columns: { id: $id }
          _set: { name: $name, data_type: $data_type }
        ) {
          id
          name
          data_type
        }
      }
    `,
    variables: {
      id: resp.data.insert_attributes_one.id,
      name: 'New Name',
      data_type: resp.data.insert_attributes_one.data_type,
    },
  });

  expect(updated.data.update_attributes_by_pk.id).toBeGreaterThan(0);
});

test('modified', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateAttribute($id: Int!, $name: citext) {
        update_attributes_by_pk(
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
      id: resp.data.insert_attributes_one.id,
      name: 'Attribution Attribute 999',
    },
  });

  expect(updated.data.update_attributes_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});

test('default value can be null', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'PHOTO',
      attribute_type: 'OBSERVATION',
      default_value: null,
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('default value is not allowed for PHOTO', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'PHOTO',
      attribute_type: 'OBSERVATION',
      default_value:
        'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpg',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value must be NULL for PHOTO.',
  );
});

test('default value must be an integer for INTEGER', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
      default_value: 1.1,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value must be an integer.',
  );
});

test('1 is a valid default value for INTEGER', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
      default_value: 1,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('default value must respect the min for INTEGER', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
      default_value: 0,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value does not match the validation rule.',
  );
});

test('default value must respect the max for INTEGER', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
      default_value: 10,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value does not match the validation rule.',
  );
});

test('default value must respect the step for INTEGER', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
      default_value: 1,
      validation_rule: { max: 10, min: 0, step: 2 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value does not match the validation rule.',
  );
});

test('default value must be an integer for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      default_value: 1.1,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value must be an integer.',
  );
});

test('1 is a valid default value for RATING', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      default_value: 1,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('default value must respect the min for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      default_value: 0,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value does not match the validation rule.',
  );
});

test('default value must respect the max for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      default_value: 10,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value does not match the validation rule.',
  );
});

test('default value must respect the step for RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      default_value: 1,
      validation_rule: { max: 10, min: 0, step: 2 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value does not match the validation rule.',
  );
});

test('1.1 is a valid default value for FLOAT', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'FLOAT',
      attribute_type: 'OBSERVATION',
      default_value: 1.1,
      validation_rule: { max: 9, min: 1, step: 0.1 },
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('default value must respect the min for FLOAT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'FLOAT',
      attribute_type: 'OBSERVATION',
      default_value: 0,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value does not match the validation rule.',
  );
});

test('default value must respect the max for FLOAT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'FLOAT',
      attribute_type: 'OBSERVATION',
      default_value: 10,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value does not match the validation rule.',
  );
});

test('2024-07-09 is a valid default value for DATE', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'DATE',
      attribute_type: 'OBSERVATION',
      default_value: '2024-07-09',
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('2024-07-32 is not a valid default value for DATE', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'DATE',
      attribute_type: 'OBSERVATION',
      default_value: '2024-07-32',
    },
  });

  expect(resp.errors[0].message).toMatch('date/time field value out of range:');
});

test('false is a valid default value for BOOLEAN', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'BOOLEAN',
      attribute_type: 'OBSERVATION',
      default_value: false,
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('true is a valid default value for BOOLEAN', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'BOOLEAN',
      attribute_type: 'OBSERVATION',
      default_value: true,
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('"some string" is not a valid default value for BOOLEAN', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'BOOLEAN',
      attribute_type: 'OBSERVATION',
      default_value: 'some string',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The default value must be a boolean.',
  );
});

test('"anything" is a valid default value for TEXT', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
      default_value: 'anything',
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('legend must be null for INTEGER', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
      legend: ['1', '2'],
      validation_rule: { max: 2, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must be NULL for data types other than RATING.',
  );
});

test('legend must be null for FLOAT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'FLOAT',
      attribute_type: 'OBSERVATION',
      legend: ['1', '2'],
      validation_rule: { max: 2, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must be NULL for data types other than RATING.',
  );
});

test('legend must be null for TEXT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
      legend: ['1', '2'],
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must be NULL for data types other than RATING.',
  );
});
test('legend must be null for DATE', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'DATE',
      attribute_type: 'OBSERVATION',
      legend: ['1', '2'],
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must be NULL for data types other than RATING.',
  );
});

test('legend must be null for PHOTO', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'PHOTO',
      attribute_type: 'OBSERVATION',
      legend: ['1', '2'],
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must be NULL for data types other than RATING.',
  );
});

test('legend must be null for BOOLEAN', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'BOOLEAN',
      attribute_type: 'OBSERVATION',
      legend: ['1', '2'],
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must be NULL for data types other than RATING.',
  );
});

test('legend CAN be null for RATING', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      legend: null,
      validation_rule: { max: 9, min: 1, step: 1 },
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('legend matches the count of the RATING', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      legend: ['1', '2'],
      validation_rule: { max: 2, min: 1, step: 1 },
    },
  });

  expect(resp.data.insert_attributes_one.id).toBeGreaterThan(0);
});

test('legend must not have less entries than the RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      legend: ['1'],
      validation_rule: { max: 4, min: 3, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must have 2 items.',
  );
});

test('legend must not have more entries than the RATING', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      legend: ['1', '2'],
      validation_rule: { max: 3, min: 3, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must have 1 items.',
  );
});

test('legend must only contain strings', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      data_type: 'RATING',
      attribute_type: 'OBSERVATION',
      legend: ['1', 2],
      validation_rule: { max: 2, min: 1, step: 1 },
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The legend must contain only strings.',
  );
});
