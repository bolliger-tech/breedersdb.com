import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';

// Insert an ENUM attribute together with its options in a single nested insert.
const insertEnumAttributeMutation = /* GraphQL */ `
  mutation InsertEnumAttribute(
    $name: citext!
    $attribute_type: attribute_types_enum!
    $options: [attribute_enum_options_insert_input!]!
  ) {
    insert_attributes_one(
      object: {
        name: $name
        data_type: ENUM
        attribute_type: $attribute_type
        enum_options: { data: $options }
      }
    ) {
      id
      data_type
      enum_options(order_by: { position: asc }) {
        id
        label
        position
        disabled
        is_default
      }
    }
  }
`;

const insertAttributionMutation = /* GraphQL */ `
  mutation InsertAttribution(
    $author: citext = "Author"
    $date_attributed: date = "2024-01-01"
    $attribution_form_name: citext!
    $lot_name_segment: citext!
    $orchard_name: citext! = "Orchard 1"
    $crossing_name: citext!
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

const insertEnumValueMutation = /* GraphQL */ `
  mutation InsertEnumValue(
    $attribute_id: Int!
    $attribution_id: Int!
    $attribute_enum_option_id: Int!
  ) {
    insert_attribution_values_one(
      object: {
        attribute_id: $attribute_id
        attribution_id: $attribution_id
        attribute_enum_option_id: $attribute_enum_option_id
      }
    ) {
      id
      attribute_enum_option_id
      attribute_enum_option {
        label
      }
    }
  }
`;

async function createAttribution() {
  const resp = await postOrFail({
    query: insertAttributionMutation,
    variables: {
      attribution_form_name: 'Form 1',
      lot_name_segment: '24A',
      crossing_name: 'Cross1',
    },
  });
  return resp.data.insert_attributions_one.id;
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

test('insert ENUM attribute with options', async () => {
  const resp = await postOrFail({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Fruit shape',
      attribute_type: 'OBSERVATION',
      options: [
        { label: 'Round', position: 0, is_default: true },
        { label: 'Oblong', position: 1 },
        { label: 'Conical', position: 2 },
      ],
    },
  });

  const attr = resp.data.insert_attributes_one;
  expect(attr.data_type).toBe('ENUM');
  expect(attr.enum_options).toHaveLength(3);
  expect(attr.enum_options.map((o) => o.label)).toEqual([
    'Round',
    'Oblong',
    'Conical',
  ]);
  expect(attr.enum_options[0].is_default).toBe(true);
  expect(attr.enum_options[1].is_default).toBe(false);
});

test('ENUM attribute rejects validation_rule', async () => {
  const resp = await post({
    query: /* GraphQL */ `
      mutation Insert($rule: jsonb) {
        insert_attributes_one(
          object: {
            name: "Bad enum"
            data_type: ENUM
            attribute_type: OBSERVATION
            validation_rule: $rule
          }
        ) {
          id
        }
      }
    `,
    variables: { rule: { min: '0', max: '1', step: '1' } },
  });
  expect(resp.errors).toBeDefined();
});

test('ENUM attribute rejects default_value', async () => {
  const resp = await post({
    query: /* GraphQL */ `
      mutation Insert($def: jsonb) {
        insert_attributes_one(
          object: {
            name: "Bad enum"
            data_type: ENUM
            attribute_type: OBSERVATION
            default_value: $def
          }
        ) {
          id
        }
      }
    `,
    variables: { def: 'Round' },
  });
  expect(resp.errors).toBeDefined();
});

test('options cannot be attached to a non-ENUM attribute', async () => {
  const resp = await post({
    query: /* GraphQL */ `
      mutation Insert {
        insert_attributes_one(
          object: {
            name: "Text attr"
            data_type: TEXT
            attribute_type: OBSERVATION
            enum_options: { data: [{ label: "Nope" }] }
          }
        ) {
          id
        }
      }
    `,
  });
  expect(resp.errors).toBeDefined();
});

test('duplicate option labels per attribute are rejected', async () => {
  const resp = await post({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Dup labels',
      attribute_type: 'OBSERVATION',
      options: [{ label: 'Same' }, { label: 'same' }], // citext -> case-insensitive
    },
  });
  expect(resp.errors).toBeDefined();
});

test('at most one default option per attribute', async () => {
  const resp = await post({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Two defaults',
      attribute_type: 'OBSERVATION',
      options: [
        { label: 'A', is_default: true },
        { label: 'B', is_default: true },
      ],
    },
  });
  expect(resp.errors).toBeDefined();
});

test('insert ENUM attribution value and cache the label', async () => {
  const attr = await postOrFail({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Fruit shape',
      attribute_type: 'OBSERVATION',
      options: [{ label: 'Round' }, { label: 'Oblong' }],
    },
  });
  const attributeId = attr.data.insert_attributes_one.id;
  const optionId = attr.data.insert_attributes_one.enum_options[0].id;
  const attributionId = await createAttribution();

  const resp = await postOrFail({
    query: insertEnumValueMutation,
    variables: {
      attribute_id: attributeId,
      attribution_id: attributionId,
      attribute_enum_option_id: optionId,
    },
  });
  expect(resp.data.insert_attribution_values_one.attribute_enum_option_id).toBe(
    optionId,
  );
  expect(
    resp.data.insert_attribution_values_one.attribute_enum_option.label,
  ).toBe('Round');

  // the cache denormalizes the option label into text_value
  const cached = await postOrFail({
    query: /* GraphQL */ `
      query Cached($attribution_id: Int!) {
        cached_attributions(
          where: { attribution_id: { _eq: $attribution_id } }
        ) {
          data_type
          text_value
        }
      }
    `,
    variables: { attribution_id: attributionId },
  });
  expect(cached.data.cached_attributions).toHaveLength(1);
  expect(cached.data.cached_attributions[0].data_type).toBe('ENUM');
  expect(cached.data.cached_attributions[0].text_value).toBe('Round');
});

test('ENUM attribution value rejects a typed value column', async () => {
  const attr = await postOrFail({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Fruit shape',
      attribute_type: 'OBSERVATION',
      options: [{ label: 'Round' }],
    },
  });
  const attributeId = attr.data.insert_attributes_one.id;
  const optionId = attr.data.insert_attributes_one.enum_options[0].id;
  const attributionId = await createAttribution();

  const resp = await post({
    query: /* GraphQL */ `
      mutation Insert($a: Int!, $att: Int!, $o: Int!) {
        insert_attribution_values_one(
          object: {
            attribute_id: $a
            attribution_id: $att
            attribute_enum_option_id: $o
            text_value: "extra"
          }
        ) {
          id
        }
      }
    `,
    variables: { a: attributeId, att: attributionId, o: optionId },
  });
  expect(resp.errors).toBeDefined();
});

test('ENUM attribution value requires an option', async () => {
  const attr = await postOrFail({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Fruit shape',
      attribute_type: 'OBSERVATION',
      options: [{ label: 'Round' }],
    },
  });
  const attributeId = attr.data.insert_attributes_one.id;
  const attributionId = await createAttribution();

  const resp = await post({
    query: /* GraphQL */ `
      mutation Insert($a: Int!, $att: Int!) {
        insert_attribution_values_one(
          object: { attribute_id: $a, attribution_id: $att, text_value: "x" }
        ) {
          id
        }
      }
    `,
    variables: { a: attributeId, att: attributionId },
  });
  expect(resp.errors).toBeDefined();
});

test('an option from another attribute is rejected (composite FK)', async () => {
  const attrA = await postOrFail({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Attr A',
      attribute_type: 'OBSERVATION',
      options: [{ label: 'A1' }],
    },
  });
  const attrB = await postOrFail({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Attr B',
      attribute_type: 'OBSERVATION',
      options: [{ label: 'B1' }],
    },
  });
  const attributionId = await createAttribution();

  const resp = await post({
    query: insertEnumValueMutation,
    variables: {
      attribute_id: attrA.data.insert_attributes_one.id,
      attribution_id: attributionId,
      // option that belongs to attribute B
      attribute_enum_option_id:
        attrB.data.insert_attributes_one.enum_options[0].id,
    },
  });
  expect(resp.errors).toBeDefined();
});

test('an in-use option cannot be deleted, an unused one can', async () => {
  const attr = await postOrFail({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Fruit shape',
      attribute_type: 'OBSERVATION',
      options: [{ label: 'Used' }, { label: 'Unused' }],
    },
  });
  const attributeId = attr.data.insert_attributes_one.id;
  const usedId = attr.data.insert_attributes_one.enum_options[0].id;
  const unusedId = attr.data.insert_attributes_one.enum_options[1].id;
  const attributionId = await createAttribution();

  await postOrFail({
    query: insertEnumValueMutation,
    variables: {
      attribute_id: attributeId,
      attribution_id: attributionId,
      attribute_enum_option_id: usedId,
    },
  });

  const deleteUsed = await post({
    query: /* GraphQL */ `
      mutation Del($id: Int!) {
        delete_attribute_enum_options_by_pk(id: $id) {
          id
        }
      }
    `,
    variables: { id: usedId },
  });
  expect(deleteUsed.errors).toBeDefined();

  const deleteUnused = await postOrFail({
    query: /* GraphQL */ `
      mutation Del($id: Int!) {
        delete_attribute_enum_options_by_pk(id: $id) {
          id
        }
      }
    `,
    variables: { id: unusedId },
  });
  expect(deleteUnused.data.delete_attribute_enum_options_by_pk.id).toBe(
    unusedId,
  );
});

test('renaming an in-use option keeps the reference and updates the cache', async () => {
  const attr = await postOrFail({
    query: insertEnumAttributeMutation,
    variables: {
      name: 'Fruit shape',
      attribute_type: 'OBSERVATION',
      options: [{ label: 'Round' }],
    },
  });
  const attributeId = attr.data.insert_attributes_one.id;
  const optionId = attr.data.insert_attributes_one.enum_options[0].id;
  const attributionId = await createAttribution();

  await postOrFail({
    query: insertEnumValueMutation,
    variables: {
      attribute_id: attributeId,
      attribution_id: attributionId,
      attribute_enum_option_id: optionId,
    },
  });

  await postOrFail({
    query: /* GraphQL */ `
      mutation Rename($id: Int!, $label: citext!) {
        update_attribute_enum_options_by_pk(
          pk_columns: { id: $id }
          _set: { label: $label }
        ) {
          id
          label
        }
      }
    `,
    variables: { id: optionId, label: 'Spherical' },
  });

  const cached = await postOrFail({
    query: /* GraphQL */ `
      query Cached($attribution_id: Int!) {
        cached_attributions(
          where: { attribution_id: { _eq: $attribution_id } }
        ) {
          text_value
        }
      }
    `,
    variables: { attribution_id: attributionId },
  });
  expect(cached.data.cached_attributions[0].text_value).toBe('Spherical');
});
