import { describe, test, expect, afterEach, beforeEach } from 'bun:test';
import { post, postOrFail } from '../fetch';

let orchardId;

beforeEach(async () => {
  const resp = await postOrFail({
    query: /* GraphQL */ `
      mutation {
        insert_orchards_one(object: { name: "Orchard 1" }) {
          id
        }
      }
    `,
  });
  orchardId = resp.data.insert_orchards_one.id;
});

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAll {
        delete_cultivars(where: {}) {
          affected_rows
        }
        delete_lots(where: {}) {
          affected_rows
        }
        delete_crossings(where: {}) {
          affected_rows
        }
        delete_orchards(where: {}) {
          affected_rows
        }
      }
    `,
  });
});

// Inserts a crossing with one lot and one cultivar. Distinct segments let the lot or cultivar move to another crossing
// or lot without a name collision.
async function insertCrossingWithCultivar({
  name,
  lotSegment = '24A',
  cultivarSegment = '001',
  motherCultivarId = null,
  fatherCultivarId = null,
}) {
  const resp = await postOrFail({
    query: /* GraphQL */ `
      mutation InsertCultivar(
        $crossing_name: citext!
        $mother_cultivar_id: Int
        $father_cultivar_id: Int
        $orchard_id: Int!
        $lot_segment: citext!
        $cultivar_segment: citext!
      ) {
        insert_cultivars_one(
          object: {
            name_segment: $cultivar_segment
            lot: {
              data: {
                name_segment: $lot_segment
                orchard_id: $orchard_id
                crossing: {
                  data: {
                    name: $crossing_name
                    mother_cultivar_id: $mother_cultivar_id
                    father_cultivar_id: $father_cultivar_id
                  }
                }
              }
            }
          }
        ) {
          id
          lot {
            id
            crossing_id
          }
        }
      }
    `,
    variables: {
      crossing_name: name,
      mother_cultivar_id: motherCultivarId,
      father_cultivar_id: fatherCultivarId,
      orchard_id: orchardId,
      lot_segment: lotSegment,
      cultivar_segment: cultivarSegment,
    },
  });
  const cultivar = resp.data.insert_cultivars_one;
  return {
    cultivarId: cultivar.id,
    lotId: cultivar.lot.id,
    crossingId: cultivar.lot.crossing_id,
  };
}

function updateCrossingParents(id, parents) {
  return post({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $entity: crossings_set_input!) {
        update_crossings_by_pk(pk_columns: { id: $id }, _set: $entity) {
          id
        }
      }
    `,
    variables: { id, entity: parents },
  });
}

function updateLotCrossing(id, crossingId) {
  return post({
    query: /* GraphQL */ `
      mutation UpdateLot($id: Int!, $crossing_id: Int!) {
        update_lots_by_pk(
          pk_columns: { id: $id }
          _set: { crossing_id: $crossing_id }
        ) {
          id
        }
      }
    `,
    variables: { id, crossing_id: crossingId },
  });
}

function updateCultivarLot(id, lotId) {
  return post({
    query: /* GraphQL */ `
      mutation UpdateCultivar($id: Int!, $lot_id: Int!) {
        update_cultivars_by_pk(
          pk_columns: { id: $id }
          _set: { lot_id: $lot_id }
        ) {
          id
        }
      }
    `,
    variables: { id, lot_id: lotId },
  });
}

function expectError(resp, message) {
  expect(resp.errors[0].extensions.internal.error.message).toContain(message);
}

async function hasDescendant(table, field, argName, id, candidateId) {
  const resp = await postOrFail({
    query: /* GraphQL */ `
      query HasDescendant($id: Int!, $candidate_id: Int!) {
        ${table}_by_pk(id: $id) {
          ${field}(args: { ${argName}: $candidate_id })
        }
      }
    `,
    variables: { id, candidate_id: candidateId },
  });
  return resp.data[`${table}_by_pk`][field];
}

test('direct cycle: mother cultivar from the crossing itself', async () => {
  const k = await insertCrossingWithCultivar({ name: 'K' });

  const resp = await updateCrossingParents(k.crossingId, {
    mother_cultivar_id: k.cultivarId,
  });

  expectError(
    resp,
    'Ancestry cycle: The mother cultivar descends from this crossing.',
  );
});

test('direct cycle: father cultivar from the crossing itself', async () => {
  const k = await insertCrossingWithCultivar({ name: 'K' });

  const resp = await updateCrossingParents(k.crossingId, {
    father_cultivar_id: k.cultivarId,
  });

  expectError(
    resp,
    'Ancestry cycle: The father cultivar descends from this crossing.',
  );
});

test('indirect cycle over several generations', async () => {
  const a = await insertCrossingWithCultivar({ name: 'A' });
  const b = await insertCrossingWithCultivar({
    name: 'B',
    motherCultivarId: a.cultivarId,
  });
  const c = await insertCrossingWithCultivar({
    name: 'C',
    fatherCultivarId: b.cultivarId,
  });

  const resp = await updateCrossingParents(a.crossingId, {
    mother_cultivar_id: c.cultivarId,
  });

  expectError(
    resp,
    'Ancestry cycle: The mother cultivar descends from this crossing.',
  );
});

test('cycle through lots.crossing_id', async () => {
  const a = await insertCrossingWithCultivar({ name: 'A', lotSegment: '24B' });
  const b = await insertCrossingWithCultivar({
    name: 'B',
    motherCultivarId: a.cultivarId,
  });

  // A's lot (with A.24B.001, the mother of B) would descend from B
  const resp = await updateLotCrossing(a.lotId, b.crossingId);

  expectError(resp, 'Ancestry cycle: The crossing descends from this lot.');
});

test('cycle through cultivars.lot_id', async () => {
  const a = await insertCrossingWithCultivar({
    name: 'A',
    cultivarSegment: '002',
  });
  const b = await insertCrossingWithCultivar({
    name: 'B',
    motherCultivarId: a.cultivarId,
  });

  // A.24A.002, the mother of B, would descend from B
  const resp = await updateCultivarLot(a.cultivarId, b.lotId);

  expectError(resp, 'Ancestry cycle: The lot descends from this cultivar.');
});

test('selfing is allowed', async () => {
  const x = await insertCrossingWithCultivar({ name: 'X' });
  const k = await insertCrossingWithCultivar({ name: 'K' });

  const resp = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $cultivar_id: Int!) {
        update_crossings_by_pk(
          pk_columns: { id: $id }
          _set: {
            mother_cultivar_id: $cultivar_id
            father_cultivar_id: $cultivar_id
          }
        ) {
          mother_cultivar_id
          father_cultivar_id
        }
      }
    `,
    variables: { id: k.crossingId, cultivar_id: x.cultivarId },
  });

  expect(resp.data.update_crossings_by_pk).toEqual({
    mother_cultivar_id: x.cultivarId,
    father_cultivar_id: x.cultivarId,
  });
});

test('repeated ancestors are allowed', async () => {
  const a = await insertCrossingWithCultivar({ name: 'A' });
  const b = await insertCrossingWithCultivar({
    name: 'B',
    motherCultivarId: a.cultivarId,
  });
  const c = await insertCrossingWithCultivar({ name: 'C' });

  // A.24A.001 is the mother of C and the grandmother of C via B
  const resp = await updateCrossingParents(c.crossingId, {
    mother_cultivar_id: a.cultivarId,
    father_cultivar_id: b.cultivarId,
  });

  expect(resp.errors).toBeUndefined();
});

test('moving a lot or cultivar without closing a cycle is allowed', async () => {
  const a = await insertCrossingWithCultivar({
    name: 'A',
    cultivarSegment: '002',
  });
  const b = await insertCrossingWithCultivar({
    name: 'B',
    lotSegment: '24B',
    motherCultivarId: a.cultivarId,
  });
  const c = await insertCrossingWithCultivar({ name: 'C' });

  // B's lot may move to the unrelated crossing C ...
  const lotResp = await updateLotCrossing(b.lotId, c.crossingId);
  expect(lotResp.errors).toBeUndefined();

  // ... and B's mother to C's lot
  const cultivarResp = await updateCultivarLot(a.cultivarId, c.lotId);
  expect(cultivarResp.errors).toBeUndefined();
});

describe('has_descendant computed fields', () => {
  test('crossings.has_descendant_cultivar', async () => {
    const a = await insertCrossingWithCultivar({ name: 'A' });
    const b = await insertCrossingWithCultivar({
      name: 'B',
      motherCultivarId: a.cultivarId,
    });
    const c = await insertCrossingWithCultivar({ name: 'C' });

    const check = (crossingId, cultivarId) =>
      hasDescendant(
        'crossings',
        'has_descendant_cultivar',
        'cultivar_id',
        crossingId,
        cultivarId,
      );

    expect(await check(a.crossingId, a.cultivarId)).toBe(true);
    expect(await check(a.crossingId, b.cultivarId)).toBe(true);
    expect(await check(b.crossingId, a.cultivarId)).toBe(false);
    expect(await check(a.crossingId, c.cultivarId)).toBe(false);
  });

  test('lots.has_descendant_crossing', async () => {
    const a = await insertCrossingWithCultivar({ name: 'A' });
    const b = await insertCrossingWithCultivar({
      name: 'B',
      motherCultivarId: a.cultivarId,
    });
    const c = await insertCrossingWithCultivar({ name: 'C' });

    const check = (lotId, crossingId) =>
      hasDescendant(
        'lots',
        'has_descendant_crossing',
        'crossing_id',
        lotId,
        crossingId,
      );

    expect(await check(a.lotId, b.crossingId)).toBe(true);
    expect(await check(b.lotId, a.crossingId)).toBe(false);
    expect(await check(a.lotId, c.crossingId)).toBe(false);
  });

  test('cultivars.has_descendant_lot', async () => {
    const a = await insertCrossingWithCultivar({ name: 'A' });
    const b = await insertCrossingWithCultivar({
      name: 'B',
      motherCultivarId: a.cultivarId,
    });
    const c = await insertCrossingWithCultivar({ name: 'C' });

    const check = (cultivarId, lotId) =>
      hasDescendant(
        'cultivars',
        'has_descendant_lot',
        'lot_id',
        cultivarId,
        lotId,
      );

    expect(await check(a.cultivarId, b.lotId)).toBe(true);
    expect(await check(b.cultivarId, a.lotId)).toBe(false);
    expect(await check(a.cultivarId, c.lotId)).toBe(false);
  });
});
