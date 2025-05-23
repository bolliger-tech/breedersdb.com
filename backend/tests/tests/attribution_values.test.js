import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertAttributeValue(
    $attribute_name: citext
    $attribute_validation_rule: jsonb
    $attribute_data_type: attribute_data_types_enum
    $attribute_type: attribute_types_enum
    $attribution_id: Int
    $integer_value: Int
    $float_value: float8
    $text_value: citext
    $boolean_value: Boolean
    $date_value: date
    $text_note: String
    $photo_note: String
    $exceptional_attribution: Boolean
  ) {
    insert_attribution_values_one(
      object: {
        attribute: {
          data: {
            name: $attribute_name
            validation_rule: $attribute_validation_rule
            data_type: $attribute_data_type
            attribute_type: $attribute_type
          }
        }
        attribution_id: $attribution_id
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
      attribute {
        id
        name
        validation_rule
        data_type
        attribute_type
      }
      attribution_id
      integer_value
      float_value
      text_value
      boolean_value
      date_value
      text_note
      photo_note
      exceptional_attribution
      offline_id
      created
      modified
    }
  }
`;

const insertAttributionMutation = /* GraphQL */ `
  mutation InsertAttributions(
    $author: citext
    $date_attributed: date
    $attribution_form_name: citext
    $lot_name_segment: citext
    $orchard_name: citext! = "Orchard 1"
    $crossing_name: citext
  ) {
    insert_attributions_one(
      object: {
        author: $author
        date_attributed: $date_attributed
        attribution_form: { data: { name: $attribution_form_name } }
        lot: {
          data: {
            name_segment: $lot_name_segment
            orchard: { data: { name: $orchard_name } }
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
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllAttributeValues {
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
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      attribute_name: 'Attribution Attribute 1',
      attribute_data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
      attribution_id: attribution.data.insert_attributions_one.id,
      text_value: 'Text Value 1',
      text_note: 'Description 1',
      photo_note:
        'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2.jpeg',
      exceptional_attribution: true,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.attribute.name).toBe(
    'Attribution Attribute 1',
  );
  expect(resp.data.insert_attribution_values_one.attribution_id).toBe(
    attribution.data.insert_attributions_one.id,
  );
  expect(resp.data.insert_attribution_values_one.integer_value).toBeNull();
  expect(resp.data.insert_attribution_values_one.float_value).toBeNull();
  expect(resp.data.insert_attribution_values_one.text_value).toBe(
    'Text Value 1',
  );
  expect(resp.data.insert_attribution_values_one.boolean_value).toBeNull();
  expect(resp.data.insert_attribution_values_one.date_value).toBeNull();
  expect(resp.data.insert_attribution_values_one.text_note).toBe(
    'Description 1',
  );
  expect(resp.data.insert_attribution_values_one.photo_note).toBe(
    'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2.jpeg',
  );
  expect(resp.data.insert_attribution_values_one.exceptional_attribution).toBe(
    true,
  );
  expect(resp.data.insert_attribution_values_one.created).toMatch(
    iso8601dateRegex,
  );
  expect(resp.data.insert_attribution_values_one.modified).toEqual(
    resp.data.insert_attribution_values_one.created,
  );
});

test('insert with offline data', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertAttributeValue(
        $attribute_name: citext
        $attribute_data_type: attribute_data_types_enum
        $attribute_type: attribute_types_enum
        $attribution_id: Int
        $text_value: citext
        $offline_id: uuid
        $created: timestamptz
      ) {
        insert_attribution_values_one(
          object: {
            attribute: {
              data: {
                name: $attribute_name
                data_type: $attribute_data_type
                attribute_type: $attribute_type
              }
            }
            attribution_id: $attribution_id
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
      attribute_name: 'Attribution Attribute 1',
      attribute_data_type: 'TEXT',
      attribute_type: 'OBSERVATION',
      attribution_id: attribution.data.insert_attributions_one.id,
      text_value: 'Text Value 1',
      offline_id: '00000000-0000-0000-0000-000000000000',
      created: '2021-01-01T00:00:00+00:00',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.offline_id).toBe(
    '00000000-0000-0000-0000-000000000000',
  );
  expect(resp.data.insert_attribution_values_one.created).toBe(
    '2021-01-01T00:00:00+00:00',
  );
});

test('insert INTEGER valid low', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'INTEGER',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 1,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.integer_value).toBe(1);
});

test('insert INTEGER valid high', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'INTEGER',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 9,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.integer_value).toBe(9);
});

test('insert INTEGER too low', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'INTEGER',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 0,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert INTEGER too high', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'INTEGER',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 10,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert INTEGER invalid step', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'INTEGER',
      attribute_validation_rule: { min: 0, max: 10, step: 2 },
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert INTEGER invalid value data type', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'INTEGER',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: '1.0',
    },
  });

  expect(resp.errors[0].message).toMatch(
    'invalid input syntax for type integer',
  );
});

test('insert INTEGER wrong column', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'INTEGER',
      attribute_validation_rule: { min: 0, max: 10, step: 2 },
      float_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert FLOAT valid low', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'FLOAT',
      attribute_validation_rule: { min: 0, max: 1, step: 0.1 },
      float_value: 0,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.float_value).toBe(0);
});

test('insert FLOAT valid high', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'FLOAT',
      attribute_validation_rule: { min: 0, max: 1, step: 0.1 },
      float_value: 1,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.float_value).toBe(1);
});

test('insert FLOAT too low', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'FLOAT',
      attribute_validation_rule: { min: 0, max: 1, step: 0.1 },
      float_value: -0.1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert FLOAT too high', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'FLOAT',
      attribute_validation_rule: { min: 0, max: 1, step: 0.1 },
      float_value: 1.1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert FLOAT invalid value data type', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'FLOAT',
      attribute_validation_rule: { min: 0, max: 10, step: 1 },
      float_value: 'asdf',
    },
  });

  expect(resp.errors[0].message).toMatch(
    /invalid input syntax for type double precision/,
  );
});

test('insert FLOAT wrong column', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'FLOAT',
      attribute_validation_rule: { min: 0, max: 10, step: 2 },
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert TEXT valid', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'TEXT',
      text_value: 'Text Value 1',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.text_value).toBe(
    'Text Value 1',
  );
});

test('insert TEXT too long', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'TEXT',
      text_value: 'a'.repeat(2048),
    },
  });

  expect(resp.errors[0].message).toContain('Check constraint violation.');
});

test('insert TEXT empty', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'TEXT',
      text_value: '',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'An attribution value must populate exactly one column of: integer_value, float_value, text_value, boolean_value or date_value.',
  );
});

test('insert TEXT wrong column', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'TEXT',
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert BOOLEAN valid', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'BOOLEAN',
      boolean_value: false,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.boolean_value).toBe(false);
});

test('insert BOOLEAN invalid value data type', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'BOOLEAN',
      boolean_value: 'asdf',
    },
  });

  expect(resp.errors[0].message).toMatch(
    /invalid input syntax for type boolean/,
  );
});

test('insert BOOLEAN wrong column', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'BOOLEAN',
      text_value: 'false',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert DATE valid', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'DATE',
      date_value: '2021-01-01',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.date_value).toBe('2021-01-01');
});

test('insert DATE out of range date', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'DATE',
      date_value: '2021-01-32',
    },
  });

  expect(resp.errors[0].message).toMatch(/date\/time field value out of range/);
});

test('insert DATE invalid date format', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'DATE',
      date_value: '31.01.21',
    },
  });

  expect(resp.errors[0].message).toMatch(/date\/time field value out of range/);
});

test('insert DATE timestamp', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'DATE',
      date_value: '2021-01-01:23:00+12:00',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.date_value).toBe('2021-01-01');
});

test('insert DATE invalid value data type', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'DATE',
      date_value: 'asdf',
    },
  });

  expect(resp.errors[0].message).toMatch(/invalid input syntax for type date/);
});

test('insert DATE wrong column', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'DATE',
      text_value: '2021-01-01',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('insert PHOTO jpg', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.text_value).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65.jpg',
  );
});

test('insert PHOTO jpeg', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpeg',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.text_value).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65.jpeg',
  );
});

test('insert PHOTO long file name jpeg', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value:
        'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.text_value).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
  );
});

test('insert PHOTO avif', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.avif',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.text_value).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65.avif',
  );
});

test('insert PHOTO png invalid', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.png',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    "The photo's filename must match /^\\w{64}\\.(jpe?g|avif)$/.",
  );
});

test('insert PHOTO name invalid', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'a photo.jpg',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    "The photo's filename must match /^\\w{64}\\.(jpe?g|avif)$/.",
  );
});

test('insert PHOTO empty', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: '',
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'An attribution value must populate exactly one column of: integer_value, float_value, text_value, boolean_value or date_value.',
  );
});

test('insert PHOTO wrong column', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});

test('modified', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'TEXT',
      text_value: 'Text Value 1',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateAttribute($id: Int!, $text_value: citext) {
        update_attribution_values_by_pk(
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
      id: resp.data.insert_attribution_values_one.id,
      text_value: 'Text Value 999',
    },
  });

  expect(
    new Date(updated.data.update_attribution_values_by_pk.modified).getTime(),
  ).toBeGreaterThan(
    new Date(resp.data.insert_attribution_values_one.modified).getTime(),
  );
});

test('insert photo_note jpg', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
      photo_note:
        'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpg',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.photo_note).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpg',
  );
});

test('insert photo_note jpeg', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
      photo_note:
        'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.photo_note).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.jpeg',
  );
});

test('insert photo_note avif', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
      photo_note:
        'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.avif',
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.photo_note).toBe(
    'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.avif',
  );
});

test('insert photo_note png invalid', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
      photo_note:
        'b51fd56a7e0528c5c35f2669750e2c65b51fd56a7e0528c5c35f2669750e2c65.png',
    },
  });

  expect(resp.errors[0].message).toBe(
    'Check constraint violation. new row for relation "attribution_values" violates check constraint "attribution_values_photo_note_check"',
  );
});

test('insert photo_note name invalid', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
      photo_note: 'b51fd.jpg',
    },
  });

  expect(resp.errors[0].message).toBe(
    'Check constraint violation. new row for relation "attribution_values" violates check constraint "attribution_values_photo_note_check"',
  );
});

test('insert photo_note empty', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
      photo_note: '',
    },
  });

  expect(resp.errors[0].message).toBe(
    'Check constraint violation. new row for relation "attribution_values" violates check constraint "attribution_values_photo_note_check"',
  );
});

test('insert photo_note null', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'PHOTO',
      text_value: 'b51fd56a7e0528c5c35f2669750e2c65.jpg',
      photo_note: null,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
});

test('insert RATING valid low', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'RATING',
      attribute_validation_rule: { min: 0, max: 9, step: 1 },
      integer_value: 0,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.integer_value).toBe(0);
});

test('insert RATING valid high', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'RATING',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 9,
    },
  });

  expect(resp.data.insert_attribution_values_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_values_one.integer_value).toBe(9);
});

test('insert RATING too low', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'RATING',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 0,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert RATING too high', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'RATING',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: 10,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value does not match the validation rule.',
  );
});

test('insert RATING invalid step', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'RATING',
      attribute_validation_rule: { min: 0, max: 9, step: 2 },
      integer_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The step value must be 1.',
  );
});

test('insert RATING invalid value data type', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'RATING',
      attribute_validation_rule: { min: 1, max: 9, step: 1 },
      integer_value: '1.0',
    },
  });

  expect(resp.errors[0].message).toMatch(
    'invalid input syntax for type integer',
  );
});

test('insert RATING wrong column', async () => {
  const attribution = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      author: 'Attribution Author',
      date_attributed: '2021-01-01',
      attribution_form_name: 'Attribution Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      exceptional_attribution: false,
      attribution_id: attribution.data.insert_attributions_one.id,
      attribute_name: 'Attribution Attribute 1',
      attribute_type: 'OBSERVATION',
      attribute_data_type: 'RATING',
      attribute_validation_rule: { min: 0, max: 9, step: 1 },
      float_value: 1,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    'The value type does not match the attribute type.',
  );
});
