import { adminGql } from './graphql';

// Tables in a delete order that satisfies the foreign keys (no cascades in the
// schema except attribute_enum_options).
const DELETE_ORDER = [
  'attribution_values',
  'attributions',
  'attribution_form_fields',
  'attribution_forms',
  'attributes',
  'mother_plants',
  'pollen',
  'plants',
  'plant_groups',
  'cultivars',
  'lots',
  'crossings',
  'plant_rows',
  'graftings',
  'rootstocks',
  'orchards',
] as const;

type Table = (typeof DELETE_ORDER)[number];

export type AttributeDataType =
  | 'INTEGER'
  | 'FLOAT'
  | 'TEXT'
  | 'BOOLEAN'
  | 'DATE'
  | 'PHOTO'
  | 'RATING'
  | 'ENUM';

interface IdRow {
  id: number;
}

let processCounter = 0;

// Creates uniquely named entities via admin GraphQL and deletes them again on
// cleanup(). Names must fit the strictest DB checks (crossing: <= 8 chars of
// [-_\w], lot segment: \d\d[A-Z], plant label: 8 digits), so uniqueness comes
// from a compact base36 timestamp + counter, not from a verbose prefix.
export class Seeder {
  private created: { table: Table; id: number }[] = [];
  private userEmails: string[] = [];

  // 7 chars, unique enough across parallel workers and consecutive runs
  uid(): string {
    processCounter += 1;
    const worker = Number(process.env.TEST_WORKER_INDEX ?? '0');
    const time = (Date.now() % 36 ** 5).toString(36).padStart(5, '0');
    const seq = ((worker * 36 + processCounter) % 36 ** 2)
      .toString(36)
      .padStart(2, '0');
    return `${time}${seq}`;
  }

  // 8 digits, prefixed 9 to stay clear of real label ids
  labelId(): string {
    processCounter += 1;
    return (
      '9' +
      String((Date.now() % 100_000) * 100 + (processCounter % 100)).padStart(
        7,
        '0',
      )
    );
  }

  // Register a row created outside the Seeder (e.g. through the UI) so
  // cleanup() removes it as well.
  track(table: Table, id: number): void {
    this.created.push({ table, id });
  }

  // Same, by (unique) name right after creating a row in the UI: cleanup then
  // works even if the test fails before its own delete step. Pass the column
  // for tables without a plain name (cultivars/plant_groups: display_name).
  async trackByName(
    table: Table,
    name: string,
    column = 'name',
  ): Promise<void> {
    const data = await adminGql<{ rows: IdRow[] }>(
      `query ($name: citext!) {
        rows: ${table}(where: { ${column}: { _eq: $name } }) { id }
      }`,
      { name },
    );
    for (const row of data.rows) this.track(table, row.id);
  }

  private async insertOne<T extends IdRow>(
    table: Table,
    inputType: string,
    object: Record<string, unknown>,
    returning = 'id',
  ): Promise<T> {
    const data = await adminGql<{ row?: T }>(
      `mutation ($object: ${inputType}!) {
        row: insert_${table}_one(object: $object) { ${returning} }
      }`,
      { object },
    );
    if (!data.row) throw new Error(`insert into ${table} returned no row`);
    this.track(table, data.row.id);
    return data.row;
  }

  async orchard(): Promise<IdRow & { name: string }> {
    return this.insertOne(
      'orchards',
      'orchards_insert_input',
      { name: `E2E Orchard ${this.uid()}` },
      'id name',
    );
  }

  async rootstock(): Promise<IdRow & { name: string }> {
    return this.insertOne(
      'rootstocks',
      'rootstocks_insert_input',
      { name: `E2E RS ${this.uid()}` },
      'id name',
    );
  }

  async grafting(): Promise<IdRow & { name: string }> {
    return this.insertOne(
      'graftings',
      'graftings_insert_input',
      { name: `E2E Graft ${this.uid()}` },
      'id name',
    );
  }

  async plantRow(
    opts: { orchardId?: number } = {},
  ): Promise<IdRow & { name: string }> {
    const orchardId = opts.orchardId ?? (await this.orchard()).id;
    return this.insertOne(
      'plant_rows',
      'plant_rows_insert_input',
      { name: `E2E Row ${this.uid()}`, orchard_id: orchardId },
      'id name',
    );
  }

  async crossing(
    opts: { motherCultivarId?: number } = {},
  ): Promise<IdRow & { name: string }> {
    return this.insertOne(
      'crossings',
      'crossings_insert_input',
      { name: `E${this.uid()}`, mother_cultivar_id: opts.motherCultivarId },
      'id name',
    );
  }

  async lot(
    opts: { crossingId?: number; orchardId?: number } = {},
  ): Promise<IdRow & { name_segment: string; full_name: string }> {
    const crossingId = opts.crossingId ?? (await this.crossing()).id;
    const orchardId = opts.orchardId ?? (await this.orchard()).id;
    const segment = `${String(this.created.length % 100).padStart(2, '0')}Z`;
    return this.insertOne(
      'lots',
      'lots_insert_input',
      { name_segment: segment, crossing_id: crossingId, orchard_id: orchardId },
      'id name_segment full_name',
    );
  }

  async cultivar(
    opts: { lotId?: number } = {},
  ): Promise<IdRow & { name_segment: string; display_name: string }> {
    const lotId = opts.lotId ?? (await this.lot()).id;
    const segment = String(this.created.length % 1000).padStart(3, '0');
    return this.insertOne(
      'cultivars',
      'cultivars_insert_input',
      { name_segment: segment, lot_id: lotId },
      'id name_segment display_name',
    );
  }

  async plantGroup(
    opts: { cultivarId?: number; nameSegment?: string } = {},
  ): Promise<IdRow & { name_segment: string; display_name: string }> {
    const cultivarId = opts.cultivarId ?? (await this.cultivar()).id;
    return this.insertOne(
      'plant_groups',
      'plant_groups_insert_input',
      {
        name_segment:
          opts.nameSegment ?? `E2E-${String(this.created.length % 1000)}`,
        cultivar_id: cultivarId,
      },
      'id name_segment display_name',
    );
  }

  async plant(
    opts: { plantGroupId?: number } = {},
  ): Promise<IdRow & { label_id: string }> {
    const plantGroupId = opts.plantGroupId ?? (await this.plantGroup()).id;
    return this.insertOne(
      'plants',
      'plants_insert_input',
      { label_id: this.labelId(), plant_group_id: plantGroupId },
      'id label_id',
    );
  }

  // crossing -> lot -> cultivar -> group(s) -> plant(s), for specs that need
  // the whole breeding hierarchy (attribution and analyze tests).
  async hierarchy(opts: { groups?: number; plantsPerGroup?: number } = {}) {
    const crossing = await this.crossing();
    const lot = await this.lot({ crossingId: crossing.id });
    const cultivar = await this.cultivar({ lotId: lot.id });
    const groups = [];
    const plants = [];
    for (let g = 0; g < (opts.groups ?? 1); g++) {
      const group = await this.plantGroup({
        cultivarId: cultivar.id,
        nameSegment: String.fromCharCode(65 + g), // A, B, ...
      });
      groups.push(group);
      for (let p = 0; p < (opts.plantsPerGroup ?? 1); p++) {
        plants.push(await this.plant({ plantGroupId: group.id }));
      }
    }
    return { crossing, lot, cultivar, groups, plants };
  }

  async pollen(
    opts: { cultivarId?: number } = {},
  ): Promise<IdRow & { name: string }> {
    const cultivarId = opts.cultivarId ?? (await this.cultivar()).id;
    return this.insertOne(
      'pollen',
      'pollen_insert_input',
      { name: `E2E Pollen ${this.uid()}`, cultivar_id: cultivarId },
      'id name',
    );
  }

  async motherPlant(
    opts: { plantId?: number; crossingId?: number } = {},
  ): Promise<IdRow & { name: string }> {
    const plantId = opts.plantId ?? (await this.plant()).id;
    let crossingId = opts.crossingId;
    if (!crossingId) {
      // The DB requires the crossing to declare the plant's cultivar as its
      // mother cultivar, so a plain crossing() won't do.
      const data = await adminGql<{
        plants_by_pk: { plant_group: { cultivar_id: number } };
      }>(
        `query ($id: Int!) {
          plants_by_pk(id: $id) { plant_group { cultivar_id } }
        }`,
        { id: plantId },
      );
      crossingId = (
        await this.insertOne<IdRow>('crossings', 'crossings_insert_input', {
          name: `E${this.uid()}`,
          mother_cultivar_id: data.plants_by_pk.plant_group.cultivar_id,
        })
      ).id;
    }
    return this.insertOne(
      'mother_plants',
      'mother_plants_insert_input',
      {
        name: `E2E Mother ${this.uid()}`,
        plant_id: plantId,
        crossing_id: crossingId,
      },
      'id name',
    );
  }

  async attribute(
    opts: {
      dataType?: AttributeDataType;
      validationRule?: { min: number; max: number; step: number };
      enumOptions?: string[];
    } = {},
  ): Promise<
    IdRow & { name: string; enum_options: (IdRow & { label: string })[] }
  > {
    const dataType = opts.dataType ?? 'INTEGER';
    const defaultRules: Partial<
      Record<AttributeDataType, { min: number; max: number; step: number }>
    > = {
      INTEGER: { min: 0, max: 100, step: 1 },
      FLOAT: { min: 0, max: 100, step: 0.1 },
      RATING: { min: 1, max: 9, step: 1 },
    };
    return this.insertOne(
      'attributes',
      'attributes_insert_input',
      {
        name: `E2E ${dataType} ${this.uid()}`,
        data_type: dataType,
        attribute_type: 'OBSERVATION',
        validation_rule: opts.validationRule ?? defaultRules[dataType] ?? null,
        enum_options:
          dataType === 'ENUM'
            ? {
                data: (opts.enumOptions ?? ['one', 'two', 'three']).map(
                  (label, position) => ({ label, position }),
                ),
              }
            : undefined,
      },
      'id name enum_options { id label }',
    );
  }

  async attributionForm(
    attributes: { id: number; required?: boolean }[],
  ): Promise<IdRow & { name: string }> {
    const form = await this.insertOne<IdRow & { name: string }>(
      'attribution_forms',
      'attribution_forms_insert_input',
      { name: `E2E Form ${this.uid()}` },
      'id name',
    );
    const data = await adminGql<{ rows: { returning: IdRow[] } }>(
      `mutation ($objects: [attribution_form_fields_insert_input!]!) {
        rows: insert_attribution_form_fields(objects: $objects) {
          returning { id }
        }
      }`,
      {
        objects: attributes.map((attribute, priority) => ({
          attribution_form_id: form.id,
          attribute_id: attribute.id,
          priority,
          required: attribute.required ?? false,
        })),
      },
    );
    for (const row of data.rows.returning) {
      this.track('attribution_form_fields', row.id);
    }
    return form;
  }

  // One attribution with typed values. PHOTO values can only be created
  // through the UI (they need a real asset in the cloud-function).
  async attribution(opts: {
    formId: number;
    plantId?: number;
    plantGroupId?: number;
    cultivarId?: number;
    lotId?: number;
    author?: string;
    dateAttributed?: string;
    values?: {
      attributeId: number;
      dataType: Exclude<AttributeDataType, 'PHOTO'>;
      value: number | string | boolean;
      enumOptionId?: number;
    }[];
  }): Promise<IdRow> {
    const attribution = await this.insertOne<IdRow>(
      'attributions',
      'attributions_insert_input',
      {
        attribution_form_id: opts.formId,
        plant_id: opts.plantId,
        plant_group_id: opts.plantGroupId,
        cultivar_id: opts.cultivarId,
        lot_id: opts.lotId,
        author: opts.author ?? 'E2E Robot',
        date_attributed: opts.dateAttributed ?? '2025-01-01',
      },
    );
    if (opts.values?.length) {
      const columnByType: Record<string, string> = {
        INTEGER: 'integer_value',
        RATING: 'integer_value',
        FLOAT: 'float_value',
        TEXT: 'text_value',
        BOOLEAN: 'boolean_value',
        DATE: 'date_value',
      };
      const data = await adminGql<{ rows: { returning: IdRow[] } }>(
        `mutation ($objects: [attribution_values_insert_input!]!) {
          rows: insert_attribution_values(objects: $objects) {
            returning { id }
          }
        }`,
        {
          objects: opts.values.map((v) => ({
            attribution_id: attribution.id,
            attribute_id: v.attributeId,
            ...(v.dataType === 'ENUM'
              ? { attribute_enum_option_id: v.enumOptionId }
              : { [columnByType[v.dataType] as string]: v.value }),
          })),
        },
      );
      for (const row of data.rows.returning) {
        this.track('attribution_values', row.id);
      }
    }
    return attribution;
  }

  // Via the InsertUser action so the password gets hashed; needs the
  // cloud-function to be up.
  async user(): Promise<{ email: string; password: string }> {
    const email = `e2e-${this.uid()}@breedersdb.com`;
    const password = 'E2e.test.password.1';
    await adminGql(
      `mutation ($email: citext!, $password: String!) {
        InsertUser(object: { email: $email, password: $password, locale: "en-US" }) {
          email
        }
      }`,
      { email, password },
    );
    this.userEmails.push(email);
    return { email, password };
  }

  // Deletes everything this Seeder created, plus attributions/values the UI
  // attached to seeded entities during the test.
  async cleanup(): Promise<void> {
    const ids = (table: Table) =>
      this.created.filter((row) => row.table === table).map((row) => row.id);

    const attributionsOnSeededEntities: Record<string, { _in: number[] }>[] =
      [];
    for (const [column, table] of [
      ['plant_id', 'plants'],
      ['plant_group_id', 'plant_groups'],
      ['cultivar_id', 'cultivars'],
      ['lot_id', 'lots'],
      ['attribution_form_id', 'attribution_forms'],
    ] as const) {
      if (ids(table).length > 0) {
        attributionsOnSeededEntities.push({ [column]: { _in: ids(table) } });
      }
    }

    const where: Partial<Record<Table, unknown>> = {};
    for (const table of DELETE_ORDER) {
      const clauses: unknown[] = [];
      if (ids(table).length > 0) clauses.push({ id: { _in: ids(table) } });
      if (
        table === 'attribution_values' &&
        attributionsOnSeededEntities.length
      ) {
        clauses.push({ attribution: { _or: attributionsOnSeededEntities } });
      }
      if (table === 'attribution_values' && ids('attributes').length) {
        clauses.push({ attribute_id: { _in: ids('attributes') } });
      }
      if (table === 'attributions' && attributionsOnSeededEntities.length) {
        clauses.push(...attributionsOnSeededEntities);
      }
      if (clauses.length > 0) where[table] = { _or: clauses };
    }

    for (const table of DELETE_ORDER) {
      if (!where[table]) continue;
      await adminGql(
        `mutation ($where: ${table}_bool_exp!) {
          delete_${table}(where: $where) { affected_rows }
        }`,
        { where: where[table] },
      );
    }

    if (this.userEmails.length > 0) {
      await adminGql(
        `mutation ($emails: [citext!]!) {
          delete_user_tokens(where: { user: { email: { _in: $emails } } }) { affected_rows }
          delete_users(where: { email: { _in: $emails } }) { affected_rows }
        }`,
        { emails: this.userEmails },
      );
    }

    this.created = [];
    this.userEmails = [];
  }
}
