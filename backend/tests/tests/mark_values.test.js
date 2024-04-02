import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertMarkValue(
    $mark_attribute_name: String
    $mark_attribute_validation_rule: jsonb
    $mark_attribute_data_type: mark_attribute_data_types_enum
    $mark_attribute_mark_type: mark_types_enum
    $mark_id: Int
    $integer_value: Int
    $float_value: float8
    $text_value: String
    $boolean_value: Boolean
    $date_value: date
    $note: String
    $exceptional_mark: Boolean
  ) {
    insert_mark_values_one(
      object: {
        mark_attribute: {
          data: {
            name: $mark_attribute_name
            validation_rule: $mark_attribute_validation_rule
            data_type: $mark_attribute_data_type
            mark_type: $mark_attribute_mark_type
          }
        }
        mark_id: $mark_id
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
      mark_attribute {
        id
        name
        validation_rule
        data_type
        mark_type
      }
      mark_id
      integer_value
      float_value
      text_value
      boolean_value
      date_value
      note
      exceptional_mark
      offline_id
      created
      modified
    }
  }
`;

const insertMarkMutation = /* GraphQL */ `
  mutation InsertMarks(
    $author: String
    $date_marked: date
    $mark_form_name: String
    $lot_name_segment: String
    $crossing_name: String
  ) {
    insert_marks_one(
      object: {
        author: $author
        date_marked: $date_marked
        mark_form: { data: { name: $mark_form_name } }
        lot: {
          data: {
            name_segment: $lot_name_segment
            crossing: { data: { name: $crossing_name } }
          }
        }
      }
    ) {
      id
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllMarkValues {
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
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_data_type: 'TEXT',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_id: mark.data.insert_marks_one.id,
      text_value: 'Text Value 1',
      note: 'Description 1',
      exceptional_mark: true,
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.mark_attribute.name).toBe(
    'Mark Attribute 1',
  );
  expect(resp.data.insert_mark_values_one.mark_id).toBe(
    mark.data.insert_marks_one.id,
  );
  expect(resp.data.insert_mark_values_one.integer_value).toBeNull();
  expect(resp.data.insert_mark_values_one.float_value).toBeNull();
  expect(resp.data.insert_mark_values_one.text_value).toBe('Text Value 1');
  expect(resp.data.insert_mark_values_one.boolean_value).toBeNull();
  expect(resp.data.insert_mark_values_one.date_value).toBeNull();
  expect(resp.data.insert_mark_values_one.note).toBe('Description 1');
  expect(resp.data.insert_mark_values_one.exceptional_mark).toBe(true);
  expect(resp.data.insert_mark_values_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_mark_values_one.modified).toBeNull();
});

test('insert with offline data', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: /* GraphQL */ `
      mutation InsertMarkValue(
        $mark_attribute_name: String
        $mark_attribute_data_type: mark_attribute_data_types_enum
        $mark_attribute_mark_type: mark_types_enum
        $mark_id: Int
        $text_value: String
        $offline_id: uuid
        $created: timestamptz
      ) {
        insert_mark_values_one(
          object: {
            mark_attribute: {
              data: {
                name: $mark_attribute_name
                data_type: $mark_attribute_data_type
                mark_type: $mark_attribute_mark_type
              }
            }
            mark_id: $mark_id
            text_value: $text_value
            offline_id: $offline_id
            created: $created
          }
        ) {
          id
          offline_id
          created
          modified
        }
      }
    `,
    variables: {
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_data_type: 'TEXT',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_id: mark.data.insert_marks_one.id,
      text_value: 'Text Value 1',
      offline_id: '00000000-0000-0000-0000-000000000000',
      created: '2021-01-01T00:00:00+00:00',
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.offline_id).toBe(
    '00000000-0000-0000-0000-000000000000',
  );
  expect(resp.data.insert_mark_values_one.created).toBe(
    '2021-01-01T00:00:00+00:00',
  );
});

test('insert INTEGER valid low', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'INTEGER',
      mark_attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 1,
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.integer_value).toBe(1);
});

test('insert INTEGER valid high', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'INTEGER',
      mark_attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 9,
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.integer_value).toBe(9);
});

test('insert INTEGER too low', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'INTEGER',
      mark_attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 0,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert INTEGER too high', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'INTEGER',
      mark_attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 10,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert INTEGER invalid step', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'INTEGER',
      mark_attribute_validation_rule: { min: 0, max: 10, step: 2 },
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert INTEGER invalid value data type', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'INTEGER',
      mark_attribute_validation_rule: { min: 0, max: 10, step: 2 },
      integer_value: 1.0,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert INTEGER wrong column', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'INTEGER',
      mark_attribute_validation_rule: { min: 0, max: 10, step: 2 },
      float_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert FLOAT valid low', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'FLOAT',
      mark_attribute_validation_rule: { min: 0, max: 1, step: 0.1 },
      float_value: 0,
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.float_value).toBe(0);
});

test('insert FLOAT valid high', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'FLOAT',
      mark_attribute_validation_rule: { min: 0, max: 1, step: 0.1 },
      float_value: 1,
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.float_value).toBe(1);
});

test('insert FLOAT too low', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'FLOAT',
      mark_attribute_validation_rule: { min: 0, max: 1, step: 0.1 },
      float_value: -0.1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert FLOAT too high', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'FLOAT',
      mark_attribute_validation_rule: { min: 0, max: 1, step: 0.1 },
      float_value: 1.1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert FLOAT invalid value data type', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'FLOAT',
      mark_attribute_validation_rule: { min: 0, max: 10, step: 1 },
      float_value: 'asdf',
    },
  });

  expect(resp.errors[0].message).toMatch(
    /invalid input syntax for type double precision/,
  );
});

test('insert FLOAT wrong column', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'FLOAT',
      mark_attribute_validation_rule: { min: 0, max: 10, step: 2 },
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert TEXT valid', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'TEXT',
      text_value: 'Text Value 1',
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.text_value).toBe('Text Value 1');
});

test('insert TEXT too long', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'TEXT',
      text_value: 'a'.repeat(2048),
    },
  });

  expect(resp.errors[0].message).toBe(
    'value too long for type character varying(2047)',
  );
});

test('insert TEXT empty', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'TEXT',
      text_value: '',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'A mark value must populate exactly one column of: integer_value, float_value, text_value, boolean_value or date_value.',
  );
});

test('insert TEXT wrong column', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'TEXT',
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert BOOLEAN valid', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'BOOLEAN',
      boolean_value: false,
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.boolean_value).toBe(false);
});

test('insert BOOLEAN invalid value data type', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'BOOLEAN',
      boolean_value: 'asdf',
    },
  });

  expect(resp.errors[0].message).toMatch(
    /invalid input syntax for type boolean/,
  );
});

test('insert BOOLEAN wrong column', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'BOOLEAN',
      text_value: 'false',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert DATE valid', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'DATE',
      date_value: '2021-01-01',
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.date_value).toBe('2021-01-01');
});

test('insert DATE out of range date', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'DATE',
      date_value: '2021-01-32',
    },
  });

  expect(resp.errors[0].message).toMatch(/date\/time field value out of range/);
});

test('insert DATE invalid date format', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'DATE',
      date_value: '31.01.21',
    },
  });

  expect(resp.errors[0].message).toMatch(/date\/time field value out of range/);
});

test('insert DATE timestamp', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'DATE',
      date_value: '2021-01-01:23:00+12:00',
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.date_value).toBe('2021-01-01');
});

test('insert DATE invalid value data type', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'DATE',
      date_value: 'asdf',
    },
  });

  expect(resp.errors[0].message).toMatch(/invalid input syntax for type date/);
});

test('insert DATE wrong column', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'DATE',
      text_value: '2021-01-01',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert PHOTO jpg', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.text_value).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65.jpg',
  );
});

test('insert PHOTO jpeg', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpeg',
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.text_value).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65.jpeg',
  );
});

test('insert PHOTO avif', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.avif',
    },
  });

  expect(resp.data.insert_mark_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_values_one.text_value).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65.avif',
  );
});

test('insert PHOTO png invalid', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.png',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    "The photo's filename must match /^\\w{32}\\.(jpe?g|avif)$/.",
  );
});

test('insert PHOTO name invalid', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'PHOTO',
      text_value: 'a photo.jpg',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    "The photo's filename must match /^\\w{32}\\.(jpe?g|avif)$/.",
  );
});

test('insert PHOTO empty', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'PHOTO',
      text_value: '',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'A mark value must populate exactly one column of: integer_value, float_value, text_value, boolean_value or date_value.',
  );
});

test('insert PHOTO wrong column', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'PHOTO',
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('modified', async () => {
  const mark = await post({
    query: insertMarkMutation,
    variables: {
      author: 'Mark Author',
      date_marked: '2021-01-01',
      mark_form_name: 'Mark Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_mark: false,
      mark_id: mark.data.insert_marks_one.id,
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_mark_type: 'OBSERVATION',
      mark_attribute_data_type: 'TEXT',
      text_value: 'Text Value 1',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateMarkAttribute($id: Int!, $text_value: String) {
        update_mark_values_by_pk(
          pk_columns: { id: $id }
          _set: { text_value: $text_value }
        ) {
          id
          text_value
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_mark_values_one.id,
      text_value: 'Text Value 999',
    },
  });

  expect(updated.data.update_mark_values_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
