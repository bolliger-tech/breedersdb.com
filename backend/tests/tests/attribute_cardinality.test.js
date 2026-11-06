import { test, expect, afterEach, describe } from 'bun:test';
import { post, postOrFail } from '../fetch';

const insertAttribute = /* GraphQL */ `
  mutation InsertAttribute(
    $name: citext!
    $cardinality: attribute_cardinalities_enum
  ) {
    insert_attributes_one(
      object: {
        name: $name
        data_type: TEXT
        attribute_type: OBSERVATION
        cardinality: $cardinality
      }
    ) {
      id
      cardinality
    }
  }
`;

const insertAttributeWithoutCardinality = /* GraphQL */ `
  mutation InsertAttribute($name: citext!) {
    insert_attributes_one(
      object: { name: $name, data_type: TEXT, attribute_type: OBSERVATION }
    ) {
      id
      cardinality
    }
  }
`;

const updateCardinality = /* GraphQL */ `
  mutation UpdateCardinality(
    $id: Int!
    $cardinality: attribute_cardinalities_enum!
  ) {
    update_attributes_by_pk(
      pk_columns: { id: $id }
      _set: { cardinality: $cardinality }
    ) {
      id
      cardinality
    }
  }
`;

const insertAttribution = /* GraphQL */ `
  mutation InsertAttribution(
    $date_attributed: date! = "2024-01-01"
    $attribution_form_id: Int!
    $lot_id: Int
    $cultivar_id: Int
    $plant_group_id: Int
    $plant_id: Int
  ) {
    insert_attributions_one(
      object: {
        author: "Author"
        date_attributed: $date_attributed
        attribution_form_id: $attribution_form_id
        lot_id: $lot_id
        cultivar_id: $cultivar_id
        plant_group_id: $plant_group_id
        plant_id: $plant_id
      }
    ) {
      id
    }
  }
`;

const insertValue = /* GraphQL */ `
  mutation InsertValue(
    $attribution_id: Int!
    $attribute_id: Int!
    $text_value: citext!
    $text_note: String
    $photo_note: String
    $exceptional_attribution: Boolean = false
  ) {
    insert_attribution_values_one(
      object: {
        attribution_id: $attribution_id
        attribute_id: $attribute_id
        text_value: $text_value
        text_note: $text_note
        photo_note: $photo_note
        exceptional_attribution: $exceptional_attribution
      }
    ) {
      id
    }
  }
`;

const queryValues = /* GraphQL */ `
  query Values($attribute_id: Int!) {
    attribution_values(
      where: { attribute_id: { _eq: $attribute_id } }
      order_by: { id: asc }
    ) {
      id
      text_value
      text_note
      photo_note
    }
  }
`;

const queryCached = /* GraphQL */ `
  query Cached($attribute_id: Int!) {
    cached_attributions(
      where: { attribute_id: { _eq: $attribute_id } }
      order_by: { id: asc }
    ) {
      id
      text_value
      plant_id
    }
  }
`;

const photoNote =
  'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2.jpeg';

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
        delete_plants(where: {}) {
          affected_rows
        }
        delete_plant_groups(where: {}) {
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
      }
    `,
  });
});

async function setup() {
  const resp = await postOrFail({
    query: /* GraphQL */ `
      mutation Setup {
        insert_lots_one(
          object: {
            name_segment: "24A"
            crossing: { data: { name: "Cross1" } }
            orchard: { data: { name: "Orchard1" } }
          }
        ) {
          id
        }
        insert_attribution_forms_one(object: { name: "Form 1" }) {
          id
        }
      }
    `,
  });
  const lotId = resp.data.insert_lots_one.id;

  const cultivar = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar($lot_id: Int!) {
        insert_cultivars_one(object: { name_segment: "001", lot_id: $lot_id }) {
          id
        }
      }
    `,
    variables: { lot_id: lotId },
  });
  const cultivarId = cultivar.data.insert_cultivars_one.id;

  const plants = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertPlants($cultivar_id: Int!) {
        insert_plant_groups_one(
          object: {
            name_segment: "A"
            cultivar_id: $cultivar_id
            plants: {
              data: [{ label_id: "00000001" }, { label_id: "00000002" }]
            }
          }
        ) {
          plants(order_by: { label_id: asc }) {
            id
          }
        }
      }
    `,
    variables: { cultivar_id: cultivarId },
  });

  return {
    formId: resp.data.insert_attribution_forms_one.id,
    cultivarId,
    plantIds: plants.data.insert_plant_groups_one.plants.map((p) => p.id),
  };
}

async function createAttribute(cardinality) {
  const resp = await postOrFail({
    query: insertAttribute,
    variables: { name: `Attribute ${cardinality}`, cardinality },
  });
  return resp.data.insert_attributes_one.id;
}

async function createAttribution(formId, entity, date_attributed) {
  const resp = await postOrFail({
    query: insertAttribution,
    variables: { attribution_form_id: formId, date_attributed, ...entity },
  });
  return resp.data.insert_attributions_one.id;
}

async function addValue(attributionId, attributeId, text_value, extra = {}) {
  return post({
    query: insertValue,
    variables: {
      attribution_id: attributionId,
      attribute_id: attributeId,
      text_value,
      ...extra,
    },
  });
}

async function addValueOrFail(attributionId, attributeId, text_value) {
  const resp = await addValue(attributionId, attributeId, text_value);
  expect(resp.errors).toBeUndefined();
  return resp.data.insert_attribution_values_one.id;
}

async function getValues(attributeId) {
  const resp = await postOrFail({
    query: queryValues,
    variables: { attribute_id: attributeId },
  });
  return resp.data.attribution_values;
}

function errorMessage(resp) {
  return resp.errors[0].extensions.internal.error.message;
}

describe('attribute', () => {
  test('cardinality defaults to REPEATABLE', async () => {
    const resp = await postOrFail({
      query: insertAttributeWithoutCardinality,
      variables: { name: 'Attribute 1' },
    });

    expect(resp.data.insert_attributes_one.cardinality).toBe('REPEATABLE');
  });

  test('switch to unique is rejected if an entity has duplicates', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('REPEATABLE');
    for (const plantId of plantIds) {
      const attributionId = await createAttribution(formId, {
        plant_id: plantId,
      });
      await addValueOrFail(attributionId, attributeId, 'a');
      await addValueOrFail(attributionId, attributeId, 'b');
    }

    const resp = await post({
      query: updateCardinality,
      variables: { id: attributeId, cardinality: 'UNIQUE_BLOCK' },
    });

    expect(errorMessage(resp)).toMatch(/2 attributed entities/);
  });

  test('switch to unique is allowed without duplicates', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('REPEATABLE');
    for (const plantId of plantIds) {
      const attributionId = await createAttribution(formId, {
        plant_id: plantId,
      });
      await addValueOrFail(attributionId, attributeId, 'a');
    }

    const resp = await postOrFail({
      query: updateCardinality,
      variables: { id: attributeId, cardinality: 'UNIQUE_REPLACE' },
    });

    expect(resp.data.update_attributes_by_pk.cardinality).toBe(
      'UNIQUE_REPLACE',
    );
  });

  test('switch between unique and back to repeatable is allowed', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_BLOCK');
    const attributionId = await createAttribution(formId, {
      plant_id: plantIds[0],
    });
    await addValueOrFail(attributionId, attributeId, 'a');

    const replace = await postOrFail({
      query: updateCardinality,
      variables: { id: attributeId, cardinality: 'UNIQUE_REPLACE' },
    });
    const repeatable = await postOrFail({
      query: updateCardinality,
      variables: { id: attributeId, cardinality: 'REPEATABLE' },
    });

    expect(replace.data.update_attributes_by_pk.cardinality).toBe(
      'UNIQUE_REPLACE',
    );
    expect(repeatable.data.update_attributes_by_pk.cardinality).toBe(
      'REPEATABLE',
    );
  });
});

describe('insert', () => {
  test('REPEATABLE allows multiple values per entity', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('REPEATABLE');
    const entity = { plant_id: plantIds[0] };

    await addValueOrFail(
      await createAttribution(formId, entity),
      attributeId,
      'a',
    );
    await addValueOrFail(
      await createAttribution(formId, entity),
      attributeId,
      'b',
    );

    expect(await getValues(attributeId)).toHaveLength(2);
  });

  test('UNIQUE_BLOCK blocks a second value on the same entity', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_BLOCK');
    const entity = { plant_id: plantIds[0] };

    await addValueOrFail(
      await createAttribution(formId, entity),
      attributeId,
      'a',
    );
    const resp = await addValue(
      await createAttribution(formId, entity),
      attributeId,
      'b',
    );

    expect(errorMessage(resp)).toMatch(/unique/);
    const values = await getValues(attributeId);
    expect(values).toHaveLength(1);
    expect(values[0].text_value).toBe('a');
  });

  test('UNIQUE_BLOCK counts exceptional values', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_BLOCK');
    const entity = { plant_id: plantIds[0] };

    await addValue(await createAttribution(formId, entity), attributeId, 'a', {
      exceptional_attribution: true,
    });
    const resp = await addValue(
      await createAttribution(formId, entity),
      attributeId,
      'b',
    );

    expect(errorMessage(resp)).toMatch(/unique/);
  });

  test('UNIQUE_BLOCK allows values on other entities', async () => {
    const { formId, plantIds, cultivarId } = await setup();
    const attributeId = await createAttribute('UNIQUE_BLOCK');

    await addValueOrFail(
      await createAttribution(formId, { plant_id: plantIds[0] }),
      attributeId,
      'a',
    );
    await addValueOrFail(
      await createAttribution(formId, { plant_id: plantIds[1] }),
      attributeId,
      'b',
    );
    await addValueOrFail(
      await createAttribution(formId, { cultivar_id: cultivarId }),
      attributeId,
      'c',
    );

    expect(await getValues(attributeId)).toHaveLength(3);
  });

  test('UNIQUE_REPLACE deletes the existing value incl. notes', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_REPLACE');
    const entity = { plant_id: plantIds[0] };

    await addValue(
      await createAttribution(formId, entity),
      attributeId,
      'old',
      {
        text_note: 'old note',
        photo_note: photoNote,
      },
    );
    const newId = await addValueOrFail(
      await createAttribution(formId, entity),
      attributeId,
      'new',
    );

    expect(await getValues(attributeId)).toEqual([
      { id: newId, text_value: 'new', text_note: null, photo_note: null },
    ]);
  });

  test('UNIQUE_REPLACE keeps the new value even if back-dated', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_REPLACE');
    const entity = { plant_id: plantIds[0] };

    await addValueOrFail(
      await createAttribution(formId, entity, '2024-06-01'),
      attributeId,
      'newer date',
    );
    const newId = await addValueOrFail(
      await createAttribution(formId, entity, '2020-01-01'),
      attributeId,
      'older date',
    );

    const values = await getValues(attributeId);
    expect(values).toHaveLength(1);
    expect(values[0].id).toBe(newId);
  });

  test('UNIQUE_REPLACE leaves values on other entities', async () => {
    const { formId, plantIds, cultivarId } = await setup();
    const attributeId = await createAttribute('UNIQUE_REPLACE');

    await addValueOrFail(
      await createAttribution(formId, { plant_id: plantIds[0] }),
      attributeId,
      'a',
    );
    await addValueOrFail(
      await createAttribution(formId, { cultivar_id: cultivarId }),
      attributeId,
      'b',
    );

    expect(await getValues(attributeId)).toHaveLength(2);
  });

  test('UNIQUE_REPLACE keeps cached_attributions correct', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_REPLACE');
    const entity = { plant_id: plantIds[0] };

    await addValueOrFail(
      await createAttribution(formId, entity),
      attributeId,
      'old',
    );
    const newId = await addValueOrFail(
      await createAttribution(formId, entity),
      attributeId,
      'new',
    );

    const resp = await postOrFail({
      query: queryCached,
      variables: { attribute_id: attributeId },
    });
    expect(resp.data.cached_attributions).toEqual([
      { id: newId, text_value: 'new', plant_id: plantIds[0] },
    ]);
  });
});

describe('update attribution value', () => {
  const updateAttributeId = /* GraphQL */ `
    mutation UpdateValue($id: Int!, $attribute_id: Int!) {
      update_attribution_values_by_pk(
        pk_columns: { id: $id }
        _set: { attribute_id: $attribute_id }
      ) {
        id
      }
    }
  `;

  const updateAttributionId = /* GraphQL */ `
    mutation UpdateValue($id: Int!, $attribution_id: Int!) {
      update_attribution_values_by_pk(
        pk_columns: { id: $id }
        _set: { attribution_id: $attribution_id }
      ) {
        id
      }
    }
  `;

  test('changing attribute_id to UNIQUE_BLOCK is blocked', async () => {
    const { formId, plantIds } = await setup();
    const uniqueId = await createAttribute('UNIQUE_BLOCK');
    const repeatableId = await createAttribute('REPEATABLE');
    const attributionId = await createAttribution(formId, {
      plant_id: plantIds[0],
    });
    await addValueOrFail(attributionId, uniqueId, 'a');
    const valueId = await addValueOrFail(attributionId, repeatableId, 'b');

    const resp = await post({
      query: updateAttributeId,
      variables: { id: valueId, attribute_id: uniqueId },
    });

    expect(errorMessage(resp)).toMatch(/unique/);
  });

  test('changing attribute_id to UNIQUE_REPLACE replaces', async () => {
    const { formId, plantIds } = await setup();
    const uniqueId = await createAttribute('UNIQUE_REPLACE');
    const repeatableId = await createAttribute('REPEATABLE');
    const attributionId = await createAttribution(formId, {
      plant_id: plantIds[0],
    });
    await addValueOrFail(attributionId, uniqueId, 'a');
    const valueId = await addValueOrFail(attributionId, repeatableId, 'b');

    await postOrFail({
      query: updateAttributeId,
      variables: { id: valueId, attribute_id: uniqueId },
    });

    const values = await getValues(uniqueId);
    expect(values).toHaveLength(1);
    expect(values[0].id).toBe(valueId);
  });

  test('changing attribution_id to another entity is blocked', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_BLOCK');
    const attribution1 = await createAttribution(formId, {
      plant_id: plantIds[0],
    });
    const attribution2 = await createAttribution(formId, {
      plant_id: plantIds[1],
    });
    await addValueOrFail(attribution1, attributeId, 'a');
    const valueId = await addValueOrFail(attribution2, attributeId, 'b');

    const resp = await post({
      query: updateAttributionId,
      variables: { id: valueId, attribution_id: attribution1 },
    });

    expect(errorMessage(resp)).toMatch(/unique/);
  });

  test('updating a unique value in place is allowed', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_BLOCK');
    const attributionId = await createAttribution(formId, {
      plant_id: plantIds[0],
    });
    const valueId = await addValueOrFail(attributionId, attributeId, 'a');

    await postOrFail({
      query: updateAttributeId,
      variables: { id: valueId, attribute_id: attributeId },
    });

    expect(await getValues(attributeId)).toHaveLength(1);
  });
});

describe('update attribution entity', () => {
  const updatePlantId = /* GraphQL */ `
    mutation UpdateAttribution($id: Int!, $plant_id: Int!) {
      update_attributions_by_pk(
        pk_columns: { id: $id }
        _set: { plant_id: $plant_id }
      ) {
        id
      }
    }
  `;

  test('moving onto an entity with a UNIQUE_BLOCK value is blocked', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_BLOCK');
    const attribution1 = await createAttribution(formId, {
      plant_id: plantIds[0],
    });
    const attribution2 = await createAttribution(formId, {
      plant_id: plantIds[1],
    });
    await addValueOrFail(attribution1, attributeId, 'a');
    await addValueOrFail(attribution2, attributeId, 'b');

    const resp = await post({
      query: updatePlantId,
      variables: { id: attribution2, plant_id: plantIds[0] },
    });

    expect(errorMessage(resp)).toMatch(/unique/);
  });

  test('moving onto an entity with a UNIQUE_REPLACE value replaces', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_REPLACE');
    const attribution1 = await createAttribution(formId, {
      plant_id: plantIds[0],
    });
    const attribution2 = await createAttribution(formId, {
      plant_id: plantIds[1],
    });
    await addValueOrFail(attribution1, attributeId, 'a');
    const movedId = await addValueOrFail(attribution2, attributeId, 'b');

    await postOrFail({
      query: updatePlantId,
      variables: { id: attribution2, plant_id: plantIds[0] },
    });

    const values = await getValues(attributeId);
    expect(values).toHaveLength(1);
    expect(values[0].id).toBe(movedId);

    const cached = await postOrFail({
      query: queryCached,
      variables: { attribute_id: attributeId },
    });
    expect(cached.data.cached_attributions).toEqual([
      { id: movedId, text_value: 'b', plant_id: plantIds[0] },
    ]);
  });

  test('moving onto an entity without a value is allowed', async () => {
    const { formId, plantIds } = await setup();
    const attributeId = await createAttribute('UNIQUE_BLOCK');
    const attributionId = await createAttribution(formId, {
      plant_id: plantIds[0],
    });
    await addValueOrFail(attributionId, attributeId, 'a');

    await postOrFail({
      query: updatePlantId,
      variables: { id: attributionId, plant_id: plantIds[1] },
    });

    expect(await getValues(attributeId)).toHaveLength(1);
  });
});
