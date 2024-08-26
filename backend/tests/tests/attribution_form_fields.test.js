import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertAttributionFormField(
    $priority: Int
    $attribution_form_name: citext
    $attribute_name: citext
    $attribute_validation_rule: jsonb
    $attribute_data_type: attribute_data_types_enum
    $attribute_type: attribute_types_enum
  ) {
    insert_attribution_form_fields_one(
      object: {
        priority: $priority
        attribution_form: { data: { name: $attribution_form_name } }
        attribute: {
          data: {
            name: $attribute_name
            validation_rule: $attribute_validation_rule
            data_type: $attribute_data_type
            attribute_type: $attribute_type
          }
        }
      }
    ) {
      id
      priority
      attribution_form {
        id
        name
      }
      attribute {
        id
        name
        validation_rule
        data_type
        attribute_type
      }
      created
      modified
    }
  }
`;

afterEach(async () => {
  const resp = await post({
    query: /* GraphQL */ `
      mutation DeleteAllAttributionFormFields {
        delete_attribution_form_fields(where: {}) {
          affected_rows
        }
        delete_attributes(where: {}) {
          affected_rows
        }
        delete_attribution_forms(where: {}) {
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
      priority: 1,
      attribution_form_name: 'Attribution Form 1',
      attribute_name: 'Attribution Attribute 1',
      attribute_validation_rule: { max: 9, min: 1, step: 1 },
      attribute_data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_attribution_form_fields_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_form_fields_one.priority).toBe(1);
  expect(
    resp.data.insert_attribution_form_fields_one.attribution_form.name,
  ).toBe('Attribution Form 1');
  expect(resp.data.insert_attribution_form_fields_one.attribute.name).toBe(
    'Attribution Attribute 1',
  );
  expect(resp.data.insert_attribution_form_fields_one.created).toMatch(
    iso8601dateRegex,
  );
  expect(resp.data.insert_attribution_form_fields_one.modified).toBeNull();
});

test('priority is unique per form', async () => {
  const form = await post({
    query: /* GraphQL */ `
      mutation InsertAttributionForm {
        insert_attribution_forms_one(object: { name: "Attribution Form 1" }) {
          id
        }
      }
    `,
  });

  const attr = await post({
    query: /* GraphQL */ `
      mutation InsertAttribute {
        insert_attributes_one(
          object: {
            name: "Attribution Attribute 1"
            validation_rule: { max: 9, min: 1, step: 1 }
            data_type: INTEGER
            attribute_type: OBSERVATION
          }
        ) {
          id
        }
      }
    `,
  });

  const resp1 = await post({
    query: /* GraphQL */ `
      mutation InsertAttributionFormField(
        $attribution_form_id: Int!
        $attribute_id: Int!
      ) {
        insert_attribution_form_fields_one(
          object: {
            priority: 1
            attribution_form_id: $attribution_form_id
            attribute_id: $attribute_id
          }
        ) {
          id
        }
      }
    `,
    variables: {
      attribution_form_id: form.data.insert_attribution_forms_one.id,
      attribute_id: attr.data.insert_attributes_one.id,
    },
  });
  const resp2 = await post({
    query: /* GraphQL */ `
      mutation InsertAttributionFormField(
        $attribution_form_id: Int!
        $attribute_id: Int!
      ) {
        insert_attribution_form_fields_one(
          object: {
            priority: 1
            attribution_form_id: $attribution_form_id
            attribute_id: $attribute_id
          }
        ) {
          id
        }
      }
    `,
    variables: {
      attribution_form_id: form.data.insert_attribution_forms_one.id,
      attribute_id: attr.data.insert_attributes_one.id,
    },
  });

  expect(resp1.data.insert_attribution_form_fields_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      priority: 1,
      attribution_form_name: 'Attribution Form 1',
      attribute_name: 'Attribution Attribute 1',
      attribute_validation_rule: { max: 9, min: 1, step: 1 },
      attribute_data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateAttributionFormField($id: Int!, $priority: Int) {
        update_attribution_form_fields_by_pk(
          pk_columns: { id: $id }
          _set: { priority: $priority }
        ) {
          id
          priority
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_attribution_form_fields_one.id,
      priority: 999,
    },
  });

  expect(updated.data.update_attribution_form_fields_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
