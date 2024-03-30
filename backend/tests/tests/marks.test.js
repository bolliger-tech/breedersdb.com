import { test, expect, afterEach } from "bun:test";
import { post } from "../fetch";
import { iso8601dateRegex } from "../utils";

const insertMutation = /* GraphQL */ `
  mutation InsertMarks(
    $author: String
    $date_marked: date
    $mark_form_name: String
    $tree_id: Int
    $cultivar_id: Int
    $lot_id: Int
    $geo_location: geography
    $geo_location_accuracy: float8
  ) {
    insert_marks_one(
      object: {
        author: $author
        date_marked: $date_marked
        mark_form: { data: { name: $mark_form_name } }
        tree_id: $tree_id
        cultivar_id: $cultivar_id
        lot_id: $lot_id
        geo_location: $geo_location
        geo_location_accuracy: $geo_location_accuracy
      }
    ) {
      id
      author
      date_marked
      mark_form {
        id
        name
      }
      tree {
        id
        publicid
      }
      cultivar {
        id
        name
      }
      lot {
        id
        name
      }
      geo_location
      geo_location_accuracy
      created
      modified
    }
  }
`;

const insertTreeMutation = /* GraphQL */ `
  mutation InsertTree(
    $publicid: String!
    $cultivar_name_segment: String!
    $lot_name_segment: String!
    $crossing_name: String!
  ) {
    insert_trees_one(
      object: {
        publicid: $publicid
        cultivar: {
          data: {
            name_segment: $cultivar_name_segment
            lot: {
              data: {
                name_segment: $lot_name_segment
                crossing: { data: { name: $crossing_name } }
              }
            }
          }
        }
      }
    ) {
      id
      cultivar {
        id
        lot {
          id
        }
      }
    }
  }
`;

afterEach(async () => {
  const del = await post({
    query: /* GraphQL */ `
      mutation DeleteAllMarks {
        delete_marks(where: {}) {
          affected_rows
        }
        delete_mark_forms(where: {}) {
          affected_rows
        }
        delete_trees(where: {}) {
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
      }
    `,
  });
});

test("insert", async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      publicid: "00000001",
      cultivar_name_segment: "001",
      lot_name_segment: "24A",
      crossing_name: "Cross1",
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: "Author 1",
      date_marked: "2021-01-01",
      mark_form_name: "Mark Form 1",
      tree_id: tree.data.insert_trees_one.id,
      cultivar_id: null,
      lot_id: null,
      geo_location: {
        type: "Point",
        coordinates: [7.470518977340019, 47.13866030575061],
      },
      geo_location_accuracy: 7.1,
    },
  });

  expect(resp.data.insert_marks_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_marks_one.author).toBe("Author 1");
  expect(resp.data.insert_marks_one.date_marked).toBe("2021-01-01");
  expect(resp.data.insert_marks_one.mark_form.name).toBe("Mark Form 1");
  expect(resp.data.insert_marks_one.tree.publicid).toBe("00000001");
  expect(resp.data.insert_marks_one.cultivar).toBeNull();
  expect(resp.data.insert_marks_one.lot).toBeNull();
  expect(resp.data.insert_marks_one.geo_location).toMatchObject({
    type: "Point",
    coordinates: [7.470518977340019, 47.13866030575061],
  });
  expect(resp.data.insert_marks_one.geo_location_accuracy).toBe(7.1);
  expect(resp.data.insert_marks_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_marks_one.modified).toBeNull();
});

test("author is required", async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      publicid: "00000001",
      cultivar_name_segment: "001",
      lot_name_segment: "24A",
      crossing_name: "Cross1",
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: "",
      date_marked: "2021-01-01",
      mark_form_name: "Mark Form 1",
      tree_id: tree.data.insert_trees_one.id,
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test("date_marked is required", async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      publicid: "00000001",
      cultivar_name_segment: "001",
      lot_name_segment: "24A",
      crossing_name: "Cross1",
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: "",
      date_marked: null,
      mark_form_name: "Mark Form 1",
      tree_id: tree.data.insert_trees_one.id,
    },
  });

  expect(resp.errors[0].message).toBe("unexpected null value for type 'date'");
});

test("has mark object", async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      publicid: "00000001",
      cultivar_name_segment: "001",
      lot_name_segment: "24A",
      crossing_name: "Cross1",
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: "Author 1",
      date_marked: "2021-01-01",
      mark_form_name: "Mark Form 1",
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    "A mark must be associated with exactly one tree, cultivar or lot, but not with none or more than one of them."
  );
});

test("has exclusively one tree", async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      publicid: "00000001",
      cultivar_name_segment: "001",
      lot_name_segment: "24A",
      crossing_name: "Cross1",
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: "Author 1",
      date_marked: "2021-01-01",
      mark_form_name: "Mark Form 1",
      tree_id: tree.data.insert_trees_one.id,
      cultivar_id: tree.data.insert_trees_one.cultivar.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    "A mark must be associated with exactly one tree, cultivar or lot, but not with none or more than one of them."
  );
});

test("has exclusively one cultivar", async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      publicid: "00000001",
      cultivar_name_segment: "001",
      lot_name_segment: "24A",
      crossing_name: "Cross1",
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: "Author 1",
      date_marked: "2021-01-01",
      mark_form_name: "Mark Form 1",
      cultivar_id: tree.data.insert_trees_one.cultivar.id,
      lot_id: tree.data.insert_trees_one.cultivar.lot.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    "A mark must be associated with exactly one tree, cultivar or lot, but not with none or more than one of them."
  );
});

test("has exclusively one lot", async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      publicid: "00000001",
      cultivar_name_segment: "001",
      lot_name_segment: "24A",
      crossing_name: "Cross1",
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: "Author 1",
      date_marked: "2021-01-01",
      mark_form_name: "Mark Form 1",
      tree_id: tree.data.insert_trees_one.id,
      lot_id: tree.data.insert_trees_one.cultivar.lot.id,
    },
  });

  expect(resp.errors[0].extensions.internal.error.message).toBe(
    "A mark must be associated with exactly one tree, cultivar or lot, but not with none or more than one of them."
  );
});

test("modified", async () => {
  const tree = await post({
    query: insertTreeMutation,
    variables: {
      publicid: "00000001",
      cultivar_name_segment: "001",
      lot_name_segment: "24A",
      crossing_name: "Cross1",
    },
  });

  const resp = await post({
    query: insertMutation,
    variables: {
      author: "Author 1",
      date_marked: "2021-01-01",
      mark_form_name: "Mark Form 1",
      tree_id: tree.data.insert_trees_one.id,
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateMark($id: Int!, $author: String) {
        update_marks_by_pk(pk_columns: { id: $id }, _set: { author: $author }) {
          id
          author
          modified
        }
      }
    `,
    variables: { id: resp.data.insert_marks_one.id, author: "Author 999" },
  });

  expect(updated.data.update_marks_by_pk.modified).toMatch(iso8601dateRegex);
});
