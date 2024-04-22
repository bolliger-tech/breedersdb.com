import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertAttribute(
    $name: String
    $validation_rule: jsonb
    $data_type: attribute_data_types_enum
    $description: String
    $attribute_type: attribute_types_enum
  ) {
    insert_attributes_one(
      object: {
        name: $name
        validation_rule: $validation_rule
        data_type: $data_type
        description: $description
        attribute_type: $attribute_type
        disabled: false
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
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllAttributes {
        delete_attribute_values(where: {}) {
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
      }
    `,
  });
});

test('insert', async () => {
  const resp = await post({
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
  const resp1 = await post({
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
      name: 'Attribution Attribute 1',
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
  const resp = await post({
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
  const resp = await post({
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
    'For INTEGER the validation rule must contain min, max and step keys with integer values.',
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
    'For INTEGER the validation rule must contain min, max and step keys with integer values.',
  );
});

test('validation rule contains numbers for FLOAT', async () => {
  const resp = await post({
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
    'For FLOAT the validation rule must contain min, max and step keys with number values.',
  );
});

test('data type is immutable after insert of attribute_values', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: null,
      data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
    },
  });

  await post({
    query: /* GraphQL */ `
      mutation InsertAttributionValue($attribute_id: Int!) {
        insert_attribute_values_one(
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

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Attribution Attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateAttribute($id: Int!, $name: String) {
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
