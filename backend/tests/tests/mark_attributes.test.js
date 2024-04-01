import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertMarkAttribute(
    $name: String
    $validation_rule: jsonb
    $data_type: mark_attribute_data_types_enum
    $description: String
    $mark_type: mark_types_enum
  ) {
    insert_mark_attributes_one(
      object: {
        name: $name
        validation_rule: $validation_rule
        data_type: $data_type
        description: $description
        mark_type: $mark_type
        disabled: false
      }
    ) {
      id
      name
      validation_rule
      data_type
      description
      mark_type
      disabled
      created
      modified
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllMarkAttributes {
        delete_mark_values(where: {}) {
          affected_rows
        }
        delete_marks(where: {}) {
          affected_rows
        }
        delete_mark_forms(where: {}) {
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
      }
    `,
  });
});

test('insert', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      description: 'Description 1',
      mark_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_mark_attributes_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_attributes_one.name).toBe('Mark Attribute 1');
  expect(resp.data.insert_mark_attributes_one.validation_rule).toMatchObject({
    max: '9',
    min: '1',
    step: '1',
  });
  expect(resp.data.insert_mark_attributes_one.data_type).toBe('INTEGER');
  expect(resp.data.insert_mark_attributes_one.description).toBe(
    'Description 1',
  );
  expect(resp.data.insert_mark_attributes_one.mark_type).toBe('OBSERVATION');
  expect(resp.data.insert_mark_attributes_one.disabled).toBe(false);
  expect(resp.data.insert_mark_attributes_one.created).toMatch(
    iso8601dateRegex,
  );
  expect(resp.data.insert_mark_attributes_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      mark_type: 'OBSERVATION',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      mark_type: 'OBSERVATION',
    },
  });

  expect(resp1.data.insert_mark_attributes_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      mark_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('empty validation rule is valid for TEXT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: null,
      data_type: 'TEXT',
      mark_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_mark_attributes_one.id).toBeGreaterThan(0);
});

test('validation rule is empty for TEXT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: 1, step: 1 },
      data_type: 'TEXT',
      mark_type: 'OBSERVATION',
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
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: 1, step: 1 },
      data_type: 'BOOLEAN',
      mark_type: 'OBSERVATION',
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
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: 1, step: 1 },
      data_type: 'DATE',
      mark_type: 'OBSERVATION',
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
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: 1, step: 1 },
      data_type: 'PHOTO',
      mark_type: 'OBSERVATION',
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
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: -1, step: 1 },
      data_type: 'INTEGER',
      mark_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_mark_attributes_one.id).toBeGreaterThan(0);
});

test('validation rule contains no floats for INTEGER', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: 1, step: 0.1 },
      data_type: 'INTEGER',
      mark_type: 'OBSERVATION',
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
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: 1 },
      data_type: 'INTEGER',
      mark_type: 'OBSERVATION',
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
      name: 'Mark Attribute 1',
      validation_rule: { max: 10, min: -0.5, step: 0.001 },
      data_type: 'FLOAT',
      mark_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_mark_attributes_one.id).toBeGreaterThan(0);
});

test('validation rule contains only numbers for FLOAT', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: 'NaN', step: 0.1 },
      data_type: 'FLOAT',
      mark_type: 'OBSERVATION',
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
      name: 'Mark Attribute 1',
      validation_rule: { max: 9, min: 1 },
      data_type: 'FLOAT',
      mark_type: 'OBSERVATION',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'For FLOAT the validation rule must contain min, max and step keys with number values.',
  );
});

test('data type is immutable after insert of mark_values', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: null,
      data_type: 'TEXT',
      mark_type: 'OBSERVATION',
    },
  });

  await post({
    query: /* GraphQL */ `
      mutation InsertMarkValue($mark_attribute_id: Int!) {
        insert_mark_values_one(
          object: {
            mark_attribute_id: $mark_attribute_id
            mark: {
              data: {
                author: "Author 1"
                date_marked: "2021-01-01"
                mark_form: { data: { name: "Mark Form 1" } }
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
    variables: { mark_attribute_id: resp.data.insert_mark_attributes_one.id },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateMarkAttribute(
        $id: Int!
        $data_type: mark_attribute_data_types_enum
      ) {
        update_mark_attributes_by_pk(
          pk_columns: { id: $id }
          _set: { data_type: $data_type }
        ) {
          id
          data_type
        }
      }
    `,
    variables: {
      id: resp.data.insert_mark_attributes_one.id,
      data_type: 'PHOTO',
    },
  });

  expect(updated.errors[0].extensions.internal.error.message).toBe(
    'The data type of a mark attribute cannot be changed once a mark value has been inserted.',
  );
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Mark Attribute 1',
      validation_rule: { max: '9', min: '1', step: '1' },
      data_type: 'INTEGER',
      mark_type: 'OBSERVATION',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateMarkAttribute($id: Int!, $name: String) {
        update_mark_attributes_by_pk(
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
      id: resp.data.insert_mark_attributes_one.id,
      name: 'Mark Attribute 999',
    },
  });

  expect(updated.data.update_mark_attributes_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
