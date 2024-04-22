import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertMarkFormField(
    $priority: Int
    $mark_form_name: String
    $mark_attribute_name: String
    $mark_attribute_validation_rule: jsonb
    $mark_attribute_data_type: attribute_data_types_enum
    $attribute_type: attribute_types_enum
  ) {
    insert_mark_form_fields_one(
      object: {
        priority: $priority
        mark_form: { data: { name: $mark_form_name } }
        mark_attribute: {
          data: {
            name: $mark_attribute_name
            validation_rule: $mark_attribute_validation_rule
            data_type: $mark_attribute_data_type
            attribute_type: $attribute_type
          }
        }
      }
    ) {
      id
      priority
      mark_form {
        id
        name
      }
      mark_attribute {
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
      mutation DeleteAllMarkFormFields {
        delete_mark_form_fields(where: {}) {
          affected_rows
        }
        delete_mark_attributes(where: {}) {
          affected_rows
        }
        delete_mark_forms(where: {}) {
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
      mark_form_name: 'Mark Form 1',
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_validation_rule: { max: 9, min: 1, step: 1 },
      mark_attribute_data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  expect(resp.data.insert_mark_form_fields_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_mark_form_fields_one.priority).toBe(1);
  expect(resp.data.insert_mark_form_fields_one.mark_form.name).toBe(
    'Mark Form 1',
  );
  expect(resp.data.insert_mark_form_fields_one.mark_attribute.name).toBe(
    'Mark Attribute 1',
  );
  expect(resp.data.insert_mark_form_fields_one.created).toMatch(
    iso8601dateRegex,
  );
  expect(resp.data.insert_mark_form_fields_one.modified).toBeNull();
});

test('priority is unique per form', async () => {
  const form = await post({
    query: /* GraphQL */ `
      mutation InsertMarkForm {
        insert_mark_forms_one(object: { name: "Mark Form 1" }) {
          id
        }
      }
    `,
  });

  const attr = await post({
    query: /* GraphQL */ `
      mutation InsertMarkAttribute {
        insert_mark_attributes_one(
          object: {
            name: "Mark Attribute 1"
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
      mutation InsertMarkFormField(
        $mark_form_id: Int!
        $mark_attribute_id: Int!
      ) {
        insert_mark_form_fields_one(
          object: {
            priority: 1
            mark_form_id: $mark_form_id
            mark_attribute_id: $mark_attribute_id
          }
        ) {
          id
        }
      }
    `,
    variables: {
      mark_form_id: form.data.insert_mark_forms_one.id,
      mark_attribute_id: attr.data.insert_mark_attributes_one.id,
    },
  });
  const resp2 = await post({
    query: /* GraphQL */ `
      mutation InsertMarkFormField(
        $mark_form_id: Int!
        $mark_attribute_id: Int!
      ) {
        insert_mark_form_fields_one(
          object: {
            priority: 1
            mark_form_id: $mark_form_id
            mark_attribute_id: $mark_attribute_id
          }
        ) {
          id
        }
      }
    `,
    variables: {
      mark_form_id: form.data.insert_mark_forms_one.id,
      mark_attribute_id: attr.data.insert_mark_attributes_one.id,
    },
  });

  expect(resp1.data.insert_mark_form_fields_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      priority: 1,
      mark_form_name: 'Mark Form 1',
      mark_attribute_name: 'Mark Attribute 1',
      mark_attribute_validation_rule: { max: 9, min: 1, step: 1 },
      mark_attribute_data_type: 'INTEGER',
      attribute_type: 'OBSERVATION',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateMarkFormField($id: Int!, $priority: Int) {
        update_mark_form_fields_by_pk(
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
      id: resp.data.insert_mark_form_fields_one.id,
      priority: 999,
    },
  });

  expect(updated.data.update_mark_form_fields_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
