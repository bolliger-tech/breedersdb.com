import { FilterRuleType, type FilterRuleTypeSchema } from './filterRule';

export type FilterRuleOperatorJson = {
  label: string;
  value: FilterOperatorValue;
  suitableRuleTypes: FilterRuleType[];
};

export class FilterRuleOperator {
  public readonly label: string;
  public readonly value: FilterOperatorValue;
  public readonly suitableRuleTypes: FilterRuleType[];
  public readonly schema: FilterRuleTypeSchema | undefined;

  constructor({
    label,
    value,
    suitableRuleTypes,
    schema,
  }: {
    label: string;
    value: FilterOperatorValue;
    suitableRuleTypes: FilterRuleType[];
    schema?: FilterRuleTypeSchema;
  }) {
    this.label = label;
    this.value = value;
    this.suitableRuleTypes = suitableRuleTypes;
    this.schema = schema;
  }

  get isValid() {
    if (typeof this.schema === 'undefined') return undefined;
    return this.suitableRuleTypes.includes(this.schema.type);
  }

  toJSON(): FilterRuleOperatorJson {
    return {
      label: this.label,
      value: this.value,
      suitableRuleTypes: this.suitableRuleTypes,
    };
  }

  static FromJSON(
    json: string | FilterRuleOperatorJson,
    schema?: FilterRuleTypeSchema,
  ) {
    const data = 'string' === typeof json ? JSON.parse(json) : json;

    return new FilterRuleOperator({
      label: data.label,
      value: data.value,
      suitableRuleTypes: data.suitableRuleTypes,
      schema,
    });
  }
}

export enum FilterOperatorValue {
  Equal = '===',
  NotEqual = '!==',
  Less = '<',
  LessOrEqual = '<=',
  Greater = '>',
  GreaterOrEqual = '>=',
  StartsWith = 'startsWith',
  StartsNotWith = 'startsNotWith',
  Contains = 'contains',
  NotContains = 'notContains',
  EndsWith = 'endsWith',
  NotEndsWith = 'notEndsWith',
  Empty = 'empty',
  NotEmpty = 'notEmpty',
  True = 'true',
  False = 'false',
}
