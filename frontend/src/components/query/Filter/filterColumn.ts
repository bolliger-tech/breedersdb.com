import type { FilterRuleSchema } from './filterRuleTypes';

export class FilterColumn {
  constructor(
    public readonly table: string,
    public readonly tableColumn: string,
    public readonly label: string,
    public readonly schema: FilterRuleSchema | undefined,
  ) {}

  get value() {
    return `${this.table}.${this.tableColumn}`;
  }

  get isAttribute() {
    return this.table === 'attributes';
  }

  get isValid() {
    return this.schema !== undefined;
  }

  get termCanBeEmpty() {
    return this.schema?.allowEmpty;
  }

  get type() {
    return this.schema?.type;
  }
}
